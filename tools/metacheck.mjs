// The non-combat half of the game: does it hold together?
//
//   node tools/metacheck.mjs [--stage all|screens|builder|runs|save|link] [--port 8871]
//
// Everything outside a battle had never been judged: team builder, tournament,
// gauntlet, daily, save/load, the link lobby. The engine grew EV spreads, held
// items, screens and hazard removal; this asks whether a player can actually
// reach any of it, and whether the mode flows survive being driven hard.
//
// Read-only against the game — it drives the real UI through window.__ARENA and
// asserts on the live DOM. Writes nothing except its own findings.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8871));
const STAGE = arg('stage', 'all');

const findings = [];
const ok = [];
const note = (pass, label, detail) => (pass ? ok : findings).push(`${label}${detail ? ' — ' + detail : ''}`);

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const go = async (id, params = {}) => {
  await page.evaluate(([i, p]) => window.__ARENA.router.go(i, p), [id, params]);
  await sleep(700);
};
const dom = (fn) => page.evaluate(fn);

/* ---------------------------------------------------- 1. screen sweep */
if (STAGE === 'all' || STAGE === 'screens') {
  const ids = await dom(() => Object.keys(window.__ARENA.router.screens));
  for (const id of ids) {
    const before = errors.length;
    let shape;
    try {
      await go(id);
      shape = await dom(() => {
        const r = document.querySelector('.screen');
        const txt = (r?.innerText || '').trim();
        return { mounted: window.__ARENA.router.currentId, nodes: r ? r.querySelectorAll('*').length : 0, chars: txt.length, buttons: r ? r.querySelectorAll('button').length : 0 };
      });
    } catch (e) { note(false, `screen "${id}" threw on mount`, e.message.slice(0, 90)); continue; }
    const newErrs = errors.slice(before);
    // `linkbattle` is a deep-link into a live session. With no session it is
    // *supposed* to render "that link battle is no longer running" and bounce
    // to the lobby, which is the correct behaviour and not a mount failure.
    if (id === 'linkbattle' && shape.mounted === 'link') note(true, `screen "${id}"`, 'correctly bounces to the lobby with no live session');
    else if (shape.mounted !== id) note(false, `screen "${id}" did not become current`, `router says "${shape.mounted}"`);
    else if (shape.nodes < 3) note(false, `screen "${id}" mounted empty`, `${shape.nodes} nodes`);
    else if (newErrs.length) note(false, `screen "${id}" logged an error`, newErrs[0].slice(0, 110));
    else note(true, `screen "${id}"`, `${shape.nodes} nodes, ${shape.buttons} buttons`);
  }
}

/* -------------------------------------------------- 2. the team builder */
if (STAGE === 'all' || STAGE === 'builder') {
  await go('teambuilder');
  // Select a fighter first. The landing view is a roster list; the EV, nature,
  // item and ability controls live in the editor pane and do not exist in the
  // DOM until something is selected — reading the screen text on mount reports
  // them all missing, which is the harness being wrong, not the builder.
  await page.evaluate(() => {
    const row = document.querySelector('.trow');
    if (row) row.click();
  });
  await sleep(500);
  const surfaces = await dom(() => {
    const r = document.querySelector('.screen');
    const txt = (r?.innerText || '');
    const has = (re) => re.test(txt);
    return {
      rosterRows: r.querySelectorAll('.trow').length,
      slots: r.querySelectorAll('.slot').length,
      // Assert on controls, not on labels. Three of my first four "missing
      // surface" findings here were the harness grepping for a word the UI
      // never prints — the EV editor renders a budget and six sliders and the
      // string "EV" appears nowhere in it.
      mentionsEV: r.querySelectorAll('input[type=range]').length >= 6 && /spent|left/i.test(txt),
      evSliders: r.querySelectorAll('input[type=range]').length,
      mentionsNature: has(/nature/i),
      mentionsItem: has(/item|held/i),
      mentionsAbility: has(/abilit/i),
      tabs: [...r.querySelectorAll('.tb-tabs button, .tb-tabs .chip')].map((b) => b.textContent.trim()).filter(Boolean)
    };
  });
  note(surfaces.rosterRows >= 32, 'builder lists the roster', `${surfaces.rosterRows} rows`);
  note(surfaces.slots >= 1, 'builder shows crew slots', `${surfaces.slots}`);
  for (const [k, label] of [['mentionsEV', 'EVs'], ['mentionsNature', 'natures'], ['mentionsItem', 'held items'], ['mentionsAbility', 'abilities']]) {
    note(surfaces[k], `builder surfaces ${label}`, surfaces[k] ? (k === 'mentionsEV' ? `${surfaces.evSliders} stat sliders + budget` : '') : 'not reachable in the editor pane');
  }

  // can a player reach the deep data through the API the builder itself uses?
  const reach = await dom(async () => {
    const A = window.__ARENA;
    const F = await import('/src/data/fighters.js');
    const Items = await import('/src/data/items.js');
    const M = await import('/src/data/moves.js');
    const held = Items.heldItems ? Items.heldItems() : Items.ITEMS.filter((i) => i.kind === 'held');
    const removal = Object.values(M.MOVES).filter((m) => m.effects?.some((e) => e.kind === 'clearHazards')).map((m) => m.id);
    const screens = Object.values(M.MOVES).filter((m) => m.effects?.some((e) => e.kind === 'screen')).map((m) => m.id);
    const owners = (ids) => F.allFighters().filter((f) => f.learnset.some((l) => ids.includes(l.move))).map((f) => f.id);
    return {
      heldItemsOffered: held.length,
      removalLearnable: owners(removal),
      screenLearnable: owners(screens),
      evHelpers: !!(A.meta && A.sim),
      maxEvTotal: (await import('/src/core/stats.js')).MAX_EV_TOTAL
    };
  });
  note(reach.heldItemsOffered >= 30, 'builder can offer the held-item library', `${reach.heldItemsOffered} items`);
  note(reach.removalLearnable.length >= 3, 'hazard removal is learnable in the builder', reach.removalLearnable.join(', '));
  note(reach.screenLearnable.length >= 5, 'screens are learnable in the builder', `${reach.screenLearnable.length} fighters`);

  // round-trip a *modified* member through both code formats
  const rt = await dom(async () => {
    const F = await import('/src/data/fighters.js');
    const TC = await import('/src/meta/teamcode.js');
    const Link = await import('/src/net/link.js');
    const m = F.makeDefaultMember('franky', 50);
    // the deep data the engine grew: a custom spread, a nature, an item, a move set
    m.evs = { hp: 252, def: 200, spd: 56 };
    m.ivs = { hp: 31, atk: 3, def: 31, spa: 31, spd: 31, spe: 0 };
    m.nature = 'relaxed';
    m.item = 'iron_gi';
    m.ability = F.getFighter('franky').abilities[2] || F.getFighter('franky').abilities[0];
    m.moves = ['scrap_sweep', 'iron_wall', 'field_repair', 'strong_hammer'];
    const team = { name: 'Audit Crew', members: [m] };
    // Normalise both sides before comparing: the decoder fills every stat key,
    // the caller may supply only the ones it cares about. A three-key spread
    // coming back as six keys with zeros is not data loss.
    const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
    const norm = (o, dflt) => KEYS.map((k) => (o?.[k] ?? dflt)).join(',');
    const sig = (x) => JSON.stringify({
      s: x.speciesId, n: x.nature, i: x.item, a: x.ability,
      mv: [...(x.moves || [])].sort(), e: norm(x.evs, 0), v: norm(x.ivs, 31)
    });
    const out = {};
    const c1 = TC.encodeTeam(team);
    const d1 = TC.decodeTeam(c1);
    out.compact = d1?.ok ? (sig(d1.team.members[0]) === sig(m) ? 'ok' : 'LOSSY: ' + sig(d1.team.members[0])) : 'FAILED: ' + d1?.error;
    const c2 = Link.encodeTeam([m], 'Audit Crew');
    try {
      const d2 = Link.decodeTeam(c2);
      out.link = sig(d2.team[0]) === sig(m) ? 'ok' : 'LOSSY: ' + sig(d2.team[0]);
    } catch (e) { out.link = 'THREW: ' + e.message; }
    return out;
  });
  note(rt.compact === 'ok', 'GLA1. round-trips a fully customised member', rt.compact === 'ok' ? '' : rt.compact);
  note(rt.link === 'ok', 'GLA-TEAM: round-trips a fully customised member', rt.link === 'ok' ? '' : rt.link);
}

/* --------------------------------------------------- 3. gauntlet / tournament */
if (STAGE === 'all' || STAGE === 'runs') {
  for (const mode of ['tournament', 'gauntlet', 'daily']) {
    const before = errors.length;
    await go(mode);
    const st = await dom(() => {
      const r = document.querySelector('.screen');
      return { id: window.__ARENA.router.currentId, buttons: [...r.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 8), nodes: r.querySelectorAll('*').length };
    });
    if (st.id !== mode) { note(false, `${mode} screen did not mount`, `router says ${st.id}`); continue; }
    note(st.nodes > 5, `${mode} screen renders`, `${st.nodes} nodes, buttons: ${st.buttons.join(' / ') || 'none'}`);
    if (errors.length > before) note(false, `${mode} logged an error on mount`, errors[before].slice(0, 110));
  }
  // Drive both run types through their whole bracket in the sim, which is the
  // part that can silently drop state: does the run actually advance, does the
  // opponent change, does it terminate, and does the AI tier escalate?
  const drive = await dom(async () => {
    const A = window.__ARENA, R = A.meta.runs, F = await import('/src/data/fighters.js');
    const team = ['luffy', 'zoro', 'nami'].map((i) => F.makeDefaultMember(i, 50));
    const out = {};

    // tournament: play the bracket to a conclusion
    try {
      let run = R.createTournament({ seed: 99, playerTeam: team });
      const seen = [], rounds = [];
      // Terminal flag is `run.status` ('won' | 'lost'), not `run.done`. Checking
      // the wrong field advances a finished bracket forever and it looks like a
      // tournament that never ends.
      let guard = 0;
      const running = () => run.status !== 'won' && run.status !== 'lost';
      while (running() && guard++ < 12) {
        const opp = R.playerOpponent(run);
        seen.push(opp ? (opp.name || opp.id || '?') : 'none');
        rounds.push(R.roundName(run));
        R.resolveAiMatches(run);
        run = R.advanceTournament(run, true) || run;
      }
      out.tournament = {
        finished: run.status === 'won' || run.status === 'lost', status: run.status,
        rounds: guard, distinctOpponents: new Set(seen).size,
        seen: seen.slice(0, 6), roundNames: [...new Set(rounds)].slice(0, 6),
        champion: run.champion ?? run.winner ?? null
      };
    } catch (e) { out.tournament = { err: e.message }; }

    // gauntlet: climb the ladder, checking the opponent escalates
    try {
      let run = R.createGauntlet({ seed: 7, playerTeam: team });
      const tiers = [], names = [];
      let guard = 0;
      while (guard++ < 14) {
        const opp = R.gauntletOpponent(run);
        if (!opp) break;
        names.push(opp.name || opp.id || '?');
        tiers.push(opp.aiLevel || opp.level || opp.tier || '?');
        const next = R.advanceGauntlet ? R.advanceGauntlet(run, true) : null;
        if (!next) break;
        run = next;
        if (run.status === 'won' || run.status === 'lost') break;
      }
      out.gauntlet = { steps: guard, distinct: new Set(names).size, names: names.slice(0, 5), tiers: [...new Set(tiers)] };
    } catch (e) { out.gauntlet = { err: e.message }; }
    return out;
  });
  const T = drive.tournament, G = drive.gauntlet;
  if (T?.err) note(false, 'tournament bracket threw', T.err);
  else {
    note(T.finished, 'tournament bracket runs to a conclusion', T.finished ? `status "${T.status}" after ${T.rounds} rounds: ${T.roundNames.join(' → ')}` : `still running after ${T.rounds} advances`);
    note(T.distinctOpponents >= 2, 'tournament gives a different opponent each round', `${T.distinctOpponents} distinct: ${T.seen.join(', ')}`);
  }
  if (G?.err) note(false, 'gauntlet ladder threw', G.err);
  else {
    note(G.steps >= 3, 'gauntlet ladder advances', `${G.steps} steps`);
    note(G.distinct >= 3, 'gauntlet gives a different opponent each step', `${G.distinct} distinct: ${G.names.join(', ')}`);
    note(G.tiers.length >= 2, 'gauntlet escalates the AI tier', `tiers seen: ${G.tiers.join(', ')}`);
  }
}

/* ------------------------------------------------------------ 4. save/load */
if (STAGE === 'all' || STAGE === 'save') {
  const res = await dom(async () => {
    const Save = await import('/src/meta/save.js');
    const before = Save.data();
    Save.patch((d) => { d.stats = d.stats || {}; d.stats.__auditMarker = 4242; });
    Save.commit();
    const raw = localStorage.getItem(Save.SAVE_KEY);
    return { wrote: !!raw && raw.includes('__auditMarker'), version: before.v };
  });
  note(res.wrote, 'save writes through to localStorage', `v${res.version}`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.version);
  await page.evaluate(() => window.__ARENA.ready);
  const after = await dom(async () => {
    const Save = await import('/src/meta/save.js');
    return Save.data()?.stats?.__auditMarker ?? null;
  });
  note(after === 4242, 'save survives a page reload', after === 4242 ? '' : `marker came back as ${after}`);
}

/* --------------------------------------------------------------- 5. link */
if (STAGE === 'all' || STAGE === 'link') {
  const before = errors.length;
  await go('link');
  const st = await dom(() => {
    const r = document.querySelector('.screen');
    return { id: window.__ARENA.router.currentId, chars: (r?.innerText || '').length, buttons: [...r.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 8) };
  });
  note(st.id === 'link' && st.chars > 20, 'link lobby mounts', `buttons: ${st.buttons.join(' / ') || 'none'}`);
  if (errors.length > before) note(false, 'link lobby logged an error', errors[before].slice(0, 110));
}

await browser.close();
server.kill();

console.log(`\n════ META SYSTEMS — the non-combat half ════\n`);
for (const o of ok) console.log(`  ✅ ${o}`);
if (findings.length) {
  console.log('');
  for (const f of findings) console.log(`  ✗ ${f}`);
}
const stray = errors.filter((e) => !findings.some((f) => f.includes(e.slice(0, 40))));
if (stray.length) {
  console.log(`\n  ${stray.length} console/page error(s) seen overall:`);
  for (const e of [...new Set(stray)].slice(0, 8)) console.log(`     ${e.slice(0, 150)}`);
}
console.log(findings.length ? `\n❌ ${findings.length} problem(s)` : `\n✅ meta systems clean`);
process.exit(findings.length ? 1 : 0);
