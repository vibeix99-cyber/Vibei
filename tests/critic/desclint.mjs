// CRITIC — does the text on the move card match the data behind it?
// The engine honours the data (verified by moveverify.mjs); this checks the
// promise the *player reads* against that data.

import { MOVES } from '../../src/data/moves.js';
import { ABILITIES } from '../../src/core/abilities.js';
import { ITEMS } from '../../src/data/items.js';

const bad = [];
const flag = (id, name, why) => bad.push({ id, name, why });

const STATNAME = {
  atk: /(?<!sp\.? ?)(?<!special )attack\b/i,
  def: /(?<!sp\.? ?)(?<!special )defen[cs]e\b/i,
  spa: /sp\.? ?atk|special attack/i,
  spd: /sp\.? ?def|special defen[cs]e/i,
  spe: /speed/i, acc: /accuracy/i, eva: /evasion|evasiveness/i
};

for (const m of MOVES) {
  const d = (m.desc || '').toLowerCase();
  const eff = m.effects || [];
  const kinds = new Set(eff.map((e) => e.kind));
  const vals = new Set(eff.map((e) => e.value).filter(Boolean));

  if (!m.desc) { flag(m.id, m.name, 'no desc at all'); continue; }

  // percentages claimed in text must exist as a chance in the data
  for (const match of d.matchAll(/(\d+)\s?%/g)) {
    const pctv = Number(match[1]);
    const found = eff.some((e) => (e.chance ?? 100) === pctv) ||
      Math.abs((m.drain || 0) * 100 - pctv) < 1 || Math.abs((m.recoil || 0) * 100 - pctv) < 1 ||
      (m.accuracy === pctv);
    if (!found) flag(m.id, m.name, `desc claims ${pctv}% but no effect/drain/recoil/accuracy matches`);
  }

  const claims = [
    [/burn(s|ed)?\b/, () => vals.has('brn')],
    [/\bpoison(s|ed)?\b/, () => vals.has('psn') || vals.has('tox')],
    [/badly poison/, () => vals.has('tox')],
    [/paraly[sz]/, () => vals.has('par')],
    [/\bsleep\b|puts? .* to sleep|drowsy/, () => vals.has('slp') || vals.has('yawn')],
    [/free[sz]e|frozen/, () => vals.has('frz')],
    [/flinch/, () => vals.has('flinch')],
    [/confus/, () => vals.has('confusion')],
    [/high critical|critical[- ]hit ratio/, () => (m.critStage || 0) > 0 || vals.has('focusenergy')],
    [/always goes first|goes first|priority/, () => m.priority > 0],
    [/recoil|takes? .* damage in return|hurts? itself/, () => (m.recoil || 0) > 0],
    [/\bdrains? (half|a third|a quarter|\d+%)/, () => (m.drain || 0) > 0],
    [/hits? (two|three|2|3)[–-](five|3|5)|hits? \d+[–-]\d+ times|hits? twice/, () => !!m.hits],
    [/switch(es)? out|swaps? out|returns? to the (bench|party)/, () => m.flags?.includes('pivot')],
    [/charge[sd]? (a )?turn|two[- ]turn|on the second turn|charges/, () => m.flags?.includes('charge')],
    [/recharge|must rest/, () => m.flags?.includes('recharge')],
    [/never misses|cannot miss/, () => m.accuracy === null || vals.has('locked_on')],
    [/traps? the (target|foe)|cannot (flee|escape|switch)/, () => vals.has('rooted') || vals.has('trapped')],
    [/(sets?|scatters?|lays?) .*(hazard|spikes|caltrops|barbs|shards)/, () => kinds.has('hazard')],
    [/(clears?|blows? away|burns? away|sweeps?) .*hazard/, () => kinds.has('clearHazards') || eff.some((e) => e.kind === 'custom' && e.value === 'clearHazards')],
    [/halves? (physical|special) damage/, () => kinds.has('screen')],
    [/protects? the user|blocks? all moves/, () => vals.has('protect') || vals.has('endure')],
    [/decoy|substitute/, () => vals.has('substitute')],
    [/restores? .* hp|regains? health|recovers? half/, () => kinds.has('heal') || (m.drain || 0) > 0 || vals.has('aqua_ring') || vals.has('rooted') || vals.has('leechseed')],
    [/\brain\b|sunlight|sandstorm|\bhail\b|\bfog\b|weather/, () => kinds.has('weather')],
    [/terrain/, () => kinds.has('terrain')],
    [/cures?|clears? .*status|burns? off status/, () => kinds.has('cure')],
    [/one-hit ko|faints? the target instantly|ohko/, () => eff.some((e) => e.kind === 'custom' && e.value === 'ohko')]
  ];
  for (const [re, ok] of claims) if (re.test(d) && !ok()) flag(m.id, m.name, `desc says /${re.source}/ but the data has no such property — "${m.desc}"`);

  // stat words: "raises/lowers <stat>" must have a boost effect on that stat
  for (const [k, re] of Object.entries(STATNAME)) {
    if (!re.test(d)) continue;
    const wantUp = /(raise|boost|sharply rise|increase|rise)/.test(d);
    const wantDown = /(lower|drop|fall|reduce|cut)/.test(d);
    if (!wantUp && !wantDown) continue;
    const hasBoost = eff.some((e) => e.kind === 'boost' && e.stats && k in e.stats) ||
      (k === 'acc' && m.accuracy === null) || eff.some((e) => e.kind === 'custom');
    if (!hasBoost) flag(m.id, m.name, `desc talks about ${k} changing but no boost effect touches ${k} — "${m.desc}"`);
  }

  // silent extras: a real effect the card never mentions
  for (const e of eff) {
    if (e.kind === 'status' && !new RegExp(({ brn: 'burn', psn: 'poison', tox: 'poison', par: 'paraly', slp: 'sleep', frz: 'free' })[e.value] ?? 'zzz', 'i').test(d))
      flag(m.id, m.name, `applies ${e.value} but the card never says so — "${m.desc}"`);
    if (e.kind === 'volatile' && e.value === 'flinch' && !/flinch/.test(d) && (e.chance ?? 100) >= 10)
      flag(m.id, m.name, `can flinch but the card never says so — "${m.desc}"`);
  }
}

console.log(`\n════ MOVE CARD TEXT vs. DATA — ${MOVES.length} moves ════\n`);
if (!bad.length) console.log('  every card matches its data.');
for (const b of bad) console.log(`  ${b.id.padEnd(24)} ${b.why}`);
console.log(`\n${bad.length} mismatch(es) over ${MOVES.length} moves.`);

/* ability + item descriptions vs the hooks they declare */
const noHook = [];
for (const [id, a] of Object.entries(ABILITIES)) {
  const hooks = Object.keys(a).filter((k) => k !== 'name' && k !== 'desc');
  if (!hooks.length) noHook.push(`ability ${id} declares no hook at all — "${a.desc}"`);
}
for (const it of ITEMS) {
  if (it.kind !== 'held') continue;
  const hooks = Object.keys(it.hooks || {});
  if (!hooks.length) noHook.push(`item ${it.id} has no hooks — "${it.desc}"`);
}
console.log(`\nabilities/items with no implementation hook: ${noHook.length}`);
noHook.forEach((n) => console.log('  ' + n));
