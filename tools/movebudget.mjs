// Move-library balance audit. Drives the live page and reads window.__ARENA.
//
//   node tools/movebudget.mjs                 # boots its own server on :8311
//   node tools/movebudget.mjs --port 8302     # reuse a server that is already up
//   node tools/movebudget.mjs --json out.json
//
// Reports, for every move in src/data/moves.js (+ signatures):
//   · BP distribution by type and category
//   · every move whose effective power score (EPS) breaks the PP cap
//   · every type missing one of the five required roles
//   · every fx.sfx key that does not exist in src/audio/audio.js
//   · duplicate ids / names, bad fx shapes, bad effect kinds, bad PP
// Exits non-zero if anything is broken.
//
// The budget it enforces is documented at the top of src/data/moves.js.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const OWN_SERVER = !args.port;
const PORT = Number(args.port || 8311);
const BASE = `http://127.0.0.1:${PORT}`;

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 8000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  return p;
}

/* ------------------------------------------------------------------ */
/* the audit, executed inside the page                                 */
/* ------------------------------------------------------------------ */

function audit() {
  const A = window.__ARENA;
  const moves = A.data.moves;
  const TYPES = ['SLASH', 'FIST', 'HAKI', 'FLAME', 'FROST', 'SEA', 'STORM', 'EARTH', 'WIND',
    'SHADOW', 'LIGHT', 'BEAST', 'MECHA', 'MIND', 'TOXIN', 'SOUND', 'SPIRIT', 'VOID'];
  const SHAPES = ['arc', 'beam', 'burst', 'melee', 'aura'];
  const EFFECT_KINDS = ['status', 'cure', 'boost', 'volatile', 'heal', 'weather', 'terrain',
    'hazard', 'screen', 'clearHazards', 'trickRoom', 'custom'];
  const CUSTOM = ['seismic', 'halfhp', 'ohko', 'painsplit', 'swapboosts', 'clearboosts'];
  const VOLATILES = ['confusion', 'flinch', 'protect', 'substitute', 'leechseed', 'taunt', 'encore',
    'charging', 'recharge', 'focusenergy', 'endure', 'destinybond', 'rooted', 'torment', 'disable',
    'perish', 'imprison', 'minimized', 'aqua_ring', 'magnetrise', 'yawn'];
  // Volatiles declared in status.js that the engine does not yet act on.
  const INERT_VOLATILES = ['taunt', 'encore', 'disable', 'torment', 'perish', 'imprison', 'minimized', 'rooted'];
  const STATUSES = ['brn', 'psn', 'tox', 'par', 'slp', 'frz'];
  const WEATHERS = ['rain', 'sun', 'sandstorm', 'hail', 'fog', 'none'];
  const TERRAINS = ['blade', 'ember', 'psychic', 'haki', 'none'];
  const HAZARDS = ['caltrops', 'oilslick', 'barbs', 'shards'];
  const SCREENS = ['reflect', 'lightwall', 'veil', 'mist', 'tailwind', 'safeguard'];

  // engine's real multi-hit distribution: 2:.35 3:.35 4:.15 5:.15, clamped to [lo,hi]
  const avgHits = (hits) => {
    if (!hits) return 1;
    const [lo, hi] = hits;
    const p = [[2, 0.35], [3, 0.35], [4, 0.15], [5, 0.15]];
    return p.reduce((a, [n, w]) => a + w * Math.max(lo, Math.min(hi, n)), 0);
  };

  const PP_CAP = (pp) => (pp >= 30 ? 70 : pp >= 20 ? 85 : pp >= 15 ? 95 : pp >= 10 ? 108 : 125);

  function eps(m) {
    if (m.category === 'status') return null;
    const acc = m.accuracy === null || m.accuracy === undefined ? 100 : m.accuracy;
    let v = (m.power || 0) * avgHits(m.hits) * (acc / 100);
    let riderField = false;
    for (const e of m.effects || []) {
      const c = (e.chance ?? 100) / 100;
      if (e.kind === 'status') v += 25 * c;
      else if (e.kind === 'volatile' && (e.value === 'flinch' || e.value === 'confusion')) v += 18 * c;
      else if (e.kind === 'boost') {
        const sum = Object.values(e.stats).reduce((a, b) => a + b, 0);
        const mine = e.target === 'self';
        // stages in the user's favour: own boosts up, foe boosts down
        const favour = mine ? sum : -sum;
        v += (favour >= 0 ? 12 : 14) * favour * c;
      } else if (['weather', 'terrain', 'hazard', 'screen'].includes(e.kind)) riderField = true;
    }
    if (riderField) v += 10;
    v += 30 * (m.drain || 0);
    v += 8 * (m.critStage || 0);
    if ((m.priority || 0) > 0) v += 15 * m.priority;
    if ((m.priority || 0) <= -3) v -= 20;
    v -= 45 * (m.recoil || 0);
    if (m.flags?.includes('recharge')) v -= 22;
    if (m.flags?.includes('charge')) v -= 22;
    return Math.round(v * 10) / 10;
  }

  const hasDrawback = (m) =>
    (m.accuracy !== null && m.accuracy <= 90) ||
    m.recoil > 0 ||
    m.flags?.includes('recharge') ||
    m.flags?.includes('charge') ||
    (m.pp <= 5) ||
    (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self' &&
      Object.values(e.stats).some((v) => v < 0)) ||
    (m.priority || 0) < 0;

  const isTech = (m) =>
    (m.priority || 0) !== 0 || !!m.hits || m.drain > 0 || (m.critStage || 0) > 0 ||
    (m.effects || []).some((e) => ['hazard', 'screen', 'weather', 'terrain', 'clearHazards',
      'trickRoom', 'custom', 'volatile', 'heal', 'cure'].includes(e.kind));

  /* ---------------- integrity ---------------- */
  const problems = [];
  const warnings = [];
  const seenId = new Set(), seenName = new Set();
  const sfxUsed = new Set();

  for (const m of moves) {
    const tag = `${m.id}`;
    if (seenId.has(m.id)) problems.push(`duplicate id: ${m.id}`);
    seenId.add(m.id);
    if (seenName.has(m.name)) problems.push(`duplicate name: "${m.name}" (${m.id})`);
    seenName.add(m.name);

    if (m.type !== '???' && !TYPES.includes(m.type)) problems.push(`${tag}: unknown type ${m.type}`);
    if (!['physical', 'special', 'status'].includes(m.category)) problems.push(`${tag}: bad category`);
    if (!(m.pp >= 1)) problems.push(`${tag}: bad pp ${m.pp}`);
    if (!m.desc) problems.push(`${tag}: missing desc`);
    else if (m.desc.length > 62) warnings.push(`${tag}: desc ${m.desc.length} chars (>62) — may wrap on the move card`);
    if (!m.flavor) warnings.push(`${tag}: empty flavor`);
    if (m.name.length > 24) warnings.push(`${tag}: name ${m.name.length} chars — tight on the move card`);

    if (!m.fx) problems.push(`${tag}: no fx block`);
    else {
      if (!SHAPES.includes(m.fx.shape)) problems.push(`${tag}: bad fx.shape "${m.fx.shape}"`);
      if (!/^#[0-9a-fA-F]{6}$/.test(m.fx.color || '')) problems.push(`${tag}: bad fx.color`);
      if (!m.fx.sfx) problems.push(`${tag}: no fx.sfx`);
      else sfxUsed.add(m.fx.sfx);
      if (!m.fx.key) problems.push(`${tag}: no fx.key`);
    }

    if (m.category === 'status' && m.power !== 0) problems.push(`${tag}: status move with power`);
    if (m.category !== 'status' && m.power === 0 && !(m.effects || []).some((e) => e.kind === 'custom'))
      problems.push(`${tag}: 0-power attack with no custom handler`);

    if (m.priority < -7 || m.priority > 5) problems.push(`${tag}: priority ${m.priority} out of range`);

    for (const e of m.effects || []) {
      if (!EFFECT_KINDS.includes(e.kind)) { problems.push(`${tag}: unknown effect kind ${e.kind}`); continue; }
      if (e.kind === 'custom' && !CUSTOM.includes(e.value)) problems.push(`${tag}: unknown custom handler ${e.value}`);
      if (e.kind === 'volatile') {
        if (!VOLATILES.includes(e.value)) problems.push(`${tag}: unknown volatile ${e.value}`);
        else if (INERT_VOLATILES.includes(e.value)) warnings.push(`${tag}: volatile "${e.value}" is declared in status.js but the engine does not act on it yet (see docs/HANDOFF.md)`);
      }
      if (e.kind === 'status' && !STATUSES.includes(e.value)) problems.push(`${tag}: unknown status ${e.value}`);
      if (e.kind === 'weather' && !WEATHERS.includes(e.value)) problems.push(`${tag}: unknown weather ${e.value}`);
      if (e.kind === 'terrain' && !TERRAINS.includes(e.value)) problems.push(`${tag}: unknown terrain ${e.value}`);
      if (e.kind === 'hazard' && !HAZARDS.includes(e.value)) problems.push(`${tag}: unknown hazard ${e.value}`);
      if (e.kind === 'screen' && !SCREENS.includes(e.value)) problems.push(`${tag}: unknown screen ${e.value}`);
      if (e.kind === 'boost') for (const k of Object.keys(e.stats)) {
        if (!['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'].includes(k)) problems.push(`${tag}: bad boost stat ${k}`);
      }
    }
  }

  /* ---------------- budget ---------------- */
  const overBudget = [];
  const underUsed = [];
  const rows = [];
  for (const m of moves) {
    if (m.id === 'struggle') continue;
    const score = eps(m);
    if (score === null) {
      // status-move sanity
      if (m.target === 'foe' && m.accuracy === null) problems.push(`${m.id}: foe status move cannot miss`);
      const bigBoost = (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self' &&
        Object.values(e.stats).reduce((a, b) => a + b, 0) >= 2);
      if (bigBoost && m.pp > 20) problems.push(`${m.id}: 2-stage self boost at ${m.pp} PP (max 20)`);
      const hasProtect = (m.effects || []).some((e) => e.kind === 'volatile' && e.value === 'protect');
      if (hasProtect && m.priority < 3) problems.push(`${m.id}: Protect-like with priority ${m.priority}`);
      continue;
    }
    const cap = PP_CAP(m.pp);
    rows.push({ id: m.id, name: m.name, type: m.type, cat: m.category, bp: m.power, acc: m.accuracy, pp: m.pp, eps: score, cap });
    if (score > cap) overBudget.push({ id: m.id, name: m.name, eps: score, cap, pp: m.pp, over: Math.round((score - cap) * 10) / 10 });
    if (score > 95 && !hasDrawback(m)) overBudget.push({ id: m.id, name: m.name, eps: score, cap, pp: m.pp, over: 0, reason: 'EPS > 95 with no drawback' });
    if (m.power > 100 && m.accuracy === 100 && !hasDrawback(m)) overBudget.push({ id: m.id, name: m.name, eps: score, cap, pp: m.pp, over: 0, reason: '>100 BP, 100% acc, no drawback' });
    if (score < cap - 48) underUsed.push({ id: m.id, name: m.name, eps: score, cap });
  }

  /* ---------------- role coverage ---------------- */
  const coverage = {};
  for (const t of TYPES) {
    const own = moves.filter((m) => m.type === t);
    const reliable = own.filter((m) => m.category !== 'status' && m.power >= 60 && m.power <= 75 &&
      (m.accuracy === null || m.accuracy >= 95) && m.pp >= 15);
    const heavy = own.filter((m) => m.category !== 'status' && m.power >= 90 && hasDrawback(m));
    const status = own.filter((m) => m.category === 'status');
    const tech = own.filter((m) => isTech(m));
    const phys = own.filter((m) => m.category === 'physical');
    const spec = own.filter((m) => m.category === 'special');
    coverage[t] = {
      count: own.length,
      reliable: reliable.length, heavy: heavy.length, status: status.length, tech: tech.length,
      physical: phys.length, special: spec.length,
      missing: [
        reliable.length ? null : 'reliable 60-75',
        heavy.length ? null : 'heavy 90+ w/ cost',
        status.length ? null : 'status move',
        tech.length ? null : 'tech move',
        phys.length ? null : 'physical',
        spec.length ? null : 'special'
      ].filter(Boolean)
    };
    if (coverage[t].missing.length) problems.push(`${t} missing: ${coverage[t].missing.join(', ')}`);
  }

  /* ---------------- BP distribution ---------------- */
  const bands = ['0', '1-49', '50-69', '70-89', '90-109', '110+'];
  const bandOf = (bp) => (bp === 0 ? '0' : bp < 50 ? '1-49' : bp < 70 ? '50-69' : bp < 90 ? '70-89' : bp < 110 ? '90-109' : '110+');
  const dist = {};
  for (const t of TYPES) {
    dist[t] = { physical: 0, special: 0, status: 0, bands: Object.fromEntries(bands.map((b) => [b, 0])), maxBp: 0, avgEps: 0 };
  }
  let epsSum = {}, epsN = {};
  for (const m of moves) {
    if (!dist[m.type]) continue;
    dist[m.type][m.category]++;
    if (m.category !== 'status') {
      dist[m.type].bands[bandOf(m.power)]++;
      dist[m.type].maxBp = Math.max(dist[m.type].maxBp, m.power);
      const s = eps(m);
      epsSum[m.type] = (epsSum[m.type] || 0) + s; epsN[m.type] = (epsN[m.type] || 0) + 1;
    }
  }
  for (const t of TYPES) dist[t].avgEps = epsN[t] ? Math.round(epsSum[t] / epsN[t]) : 0;

  /* ---------------- archetype census ---------------- */
  const has = (fn) => moves.filter(fn).map((m) => m.id);
  const archetypes = {
    'priority +1': has((m) => m.priority === 1 && m.category !== 'status'),
    'priority +2/+3': has((m) => m.priority >= 2 && m.priority <= 3 && m.category !== 'status'),
    'priority negative': has((m) => m.priority < 0),
    'charge (2-turn)': has((m) => m.flags?.includes('charge')),
    'recharge': has((m) => m.flags?.includes('recharge')),
    'multi-hit': has((m) => !!m.hits),
    'drain': has((m) => m.drain > 0),
    'recoil': has((m) => m.recoil > 0),
    'high crit': has((m) => (m.critStage || 0) > 0),
    'fixed / OHKO damage': has((m) => (m.effects || []).some((e) => e.kind === 'custom' && ['seismic', 'halfhp', 'ohko'].includes(e.value))),
    'hazard setters': has((m) => (m.effects || []).some((e) => e.kind === 'hazard')),
    'hazard removal': has((m) => (m.effects || []).some((e) => e.kind === 'clearHazards')),
    'screens': has((m) => (m.effects || []).some((e) => e.kind === 'screen')),
    'weather setters': has((m) => (m.effects || []).some((e) => e.kind === 'weather')),
    'terrain setters': has((m) => (m.effects || []).some((e) => e.kind === 'terrain')),
    'Substitute-like': has((m) => (m.effects || []).some((e) => e.kind === 'volatile' && e.value === 'substitute')),
    'Protect-like': has((m) => (m.effects || []).some((e) => e.kind === 'volatile' && ['protect', 'endure'].includes(e.value))),
    'Taunt/Encore/Disable': has((m) => (m.effects || []).some((e) => e.kind === 'volatile' && ['taunt', 'encore', 'disable'].includes(e.value))),
    'Leech Seed-like': has((m) => (m.effects || []).some((e) => e.kind === 'volatile' && e.value === 'leechseed')),
    'Trick Room': has((m) => (m.effects || []).some((e) => e.kind === 'trickRoom')),
    'Destiny Bond': has((m) => (m.effects || []).some((e) => e.kind === 'volatile' && e.value === 'destinybond')),
    'healing': has((m) => (m.effects || []).some((e) => e.kind === 'heal')),
    '+2 boost sweeper': has((m) => (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self' && Object.values(e.stats).some((v) => v >= 2))),
    '+1 spread boost': has((m) => (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self' && Object.keys(e.stats).length >= 2 && Object.values(e.stats).every((v) => v === 1)))
  };

  return {
    total: moves.length,
    problems, warnings, overBudget, underUsed, coverage, dist, archetypes, rows,
    sfxUsed: [...sfxUsed].sort()
  };
}

/* ------------------------------------------------------------------ */

function bar(n, max, w = 18) {
  const k = max ? Math.round((n / max) * w) : 0;
  return '█'.repeat(k) + '·'.repeat(w - k);
}

async function main() {
  const server = OWN_SERVER ? await startServer() : null;
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 20000 });
  await page.evaluate(() => window.__ARENA.ready);

  const r = await page.evaluate(audit);

  // sfx keys actually implemented, read straight out of the audio module source
  const sfxKeys = await page.evaluate(async () => {
    const src = await (await fetch('/src/audio/audio.js')).text();
    const body = src.slice(src.indexOf('sfx(name'), src.indexOf('cry(cry)'));
    return [...body.matchAll(/case\s+'([a-z0-9_]+)'/g)].map((m) => m[1]);
  });
  const known = new Set(sfxKeys);
  const badSfx = r.sfxUsed.filter((k) => !known.has(k));

  await browser.close();
  if (server) server.kill();

  /* ---------------- report ---------------- */
  const TYPES = Object.keys(r.coverage);
  console.log(`\n  GRAND LINE ARENA — move library audit`);
  console.log(`  ${r.total} moves\n`);

  console.log('  TYPE      n  phy spe sta │ rel big st tec │ 1-49 50-69 70-89 90-109 110+ │ maxBP avgEPS');
  console.log('  ' + '─'.repeat(94));
  for (const t of TYPES) {
    const c = r.coverage[t], d = r.dist[t];
    const ok = c.missing.length === 0 ? ' ' : '!';
    console.log(
      `  ${ok}${t.padEnd(8)}${String(c.count).padStart(2)}  ` +
      `${String(d.physical).padStart(3)} ${String(d.special).padStart(3)} ${String(d.status).padStart(3)} │ ` +
      `${String(c.reliable).padStart(3)} ${String(c.heavy).padStart(3)} ${String(c.status).padStart(2)} ${String(c.tech).padStart(3)} │ ` +
      `${String(d.bands['1-49']).padStart(4)} ${String(d.bands['50-69']).padStart(5)} ${String(d.bands['70-89']).padStart(5)} ` +
      `${String(d.bands['90-109']).padStart(6)} ${String(d.bands['110+']).padStart(4)} │ ` +
      `${String(d.maxBp).padStart(5)} ${String(d.avgEps).padStart(6)}`
    );
  }

  const maxCount = Math.max(...TYPES.map((t) => r.coverage[t].count));
  console.log('\n  moves per type');
  for (const t of TYPES) console.log(`    ${t.padEnd(7)} ${bar(r.coverage[t].count, maxCount)} ${r.coverage[t].count}`);

  console.log('\n  archetype census');
  for (const [k, v] of Object.entries(r.archetypes)) {
    const flag = v.length === 0 ? ' ✗' : '  ';
    console.log(`   ${flag} ${k.padEnd(22)} ${String(v.length).padStart(2)}  ${v.slice(0, 6).join(', ')}${v.length > 6 ? ' …' : ''}`);
  }

  let bad = 0;
  if (r.overBudget.length) {
    console.log(`\n  ✗ OVER BUDGET (${r.overBudget.length})`);
    for (const o of r.overBudget) console.log(`    ${o.id.padEnd(22)} EPS ${String(o.eps).padStart(6)} vs cap ${o.cap} @ ${o.pp} PP  ${o.reason || `+${o.over}`}`);
    bad += r.overBudget.length;
  }
  if (badSfx.length) {
    console.log(`\n  ✗ UNKNOWN fx.sfx KEYS (${badSfx.length}): ${badSfx.join(', ')}`);
    bad += badSfx.length;
  }
  if (r.problems.length) {
    console.log(`\n  ✗ PROBLEMS (${r.problems.length})`);
    r.problems.forEach((p) => console.log('    - ' + p));
    bad += r.problems.length;
  }
  if (r.warnings.length) {
    console.log(`\n  ⚠ warnings (${r.warnings.length})`);
    r.warnings.forEach((w) => console.log('    - ' + w));
  }
  if (r.underUsed.length) {
    console.log(`\n  · under budget by >48 (fine, but check they still earn a slot)`);
    r.underUsed.forEach((u) => console.log(`    ${u.id.padEnd(22)} EPS ${u.eps} vs cap ${u.cap}`));
  }

  if (args.json) await writeFile(String(args.json), JSON.stringify({ ...r, badSfx, sfxKeys }, null, 2));

  console.log(bad ? `\n  ❌ ${bad} balance problem(s)\n` : `\n  ✅ move library clean — ${r.total} moves within budget\n`);
  process.exit(bad ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
