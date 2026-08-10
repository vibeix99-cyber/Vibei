// CRITIC — THE GAME UNDERNEATH.
// Measures whether a real tactical decision exists on a given turn.
//
//   node tests/critic/depth2.mjs economy  --games 200
//   node tests/critic/depth2.mjs reach    --games 300
//   node tests/critic/depth2.mjs forced   --games 120
//   node tests/critic/depth2.mjs ablate2  --games 150
//   node tests/critic/depth2.mjs roster2
//   node tests/critic/depth2.mjs bulk
//   node tests/critic/depth2.mjs swing    --games 400

import {
  createBattle, submitChoices, legalMoves, legalSwitches, active
} from '../../src/core/engine.js';
import { chooseAction, chooseActionDetailed, AI_LEVELS } from '../../src/core/ai.js';
import { damageRange } from '../../src/core/damage.js';
import { RNG } from '../../src/core/rng.js';
import { MOVES, getMove } from '../../src/data/moves.js';
import { allFighters, getFighter, makeDefaultMember, defaultMoves, defaultItem, defaultAbility } from '../../src/data/fighters.js';
import { ITEMS, defaultBag } from '../../src/data/items.js';
import { ABILITIES } from '../../src/core/abilities.js';
import { TYPES, typeEff } from '../../src/core/types.js';
import { computeStats } from '../../src/core/stats.js';

const MODE = process.argv[2] || 'economy';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const GAMES = Number(arg('games', 200));
const LEVEL = arg('level', 'ace');
const SIZE = Number(arg('size', 3));
const MAXT = 300;

const IDS = allFighters().map((f) => f.id);
const BY = Object.fromEntries(allFighters().map((f) => [f.id, f]));
const pct = (x) => `${(x * 100).toFixed(1)}%`;

function team(rng, size = SIZE) {
  const pool = IDS.slice(); const out = [];
  for (let i = 0; i < size && pool.length; i++) {
    const k = rng.int(pool.length);
    out.push(makeDefaultMember(pool[k], 50)); pool.splice(k, 1);
  }
  return out;
}

function mkBattle(seed, t0, t1) {
  return createBattle({
    seed, arena: 'colosseum', format: { level: 50, teamSize: SIZE, bring: SIZE },
    sides: [{ name: 'A', team: t0, items: defaultBag() }, { name: 'B', team: t1, items: defaultBag() }]
  });
}

/** greedy = "click the biggest number", accuracy-weighted expected damage */
function greedyRank(state, side) {
  const me = active(state, side), foe = active(state, 1 - side);
  const legal = legalMoves(state, side);
  const rows = [];
  for (const id of legal) {
    const move = getMove(id);
    if (!move) continue;
    let score = 0;
    if (move.power > 0 && move.category !== 'status') {
      const r = damageRange({ move, user: me, target: foe, field: state.field, foeSide: state.sides[1 - side], crit: false });
      score = (r.avg / Math.max(1, foe.hp)) * (move.accuracy === null ? 1 : move.accuracy / 100);
    }
    rows.push({ id, score });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows;
}
function greedy(state, side) {
  const rows = greedyRank(state, side);
  return { kind: 'move', moveId: rows.length ? rows[0].id : 'struggle' };
}

/* ===================================================================== ui */
// The decision as a *player* meets it. Requires: node tools/serve.mjs 8812 &
if (MODE === 'ui') {
  const { chromium } = await import('playwright');
  const { mkdir, writeFile } = await import('node:fs/promises');
  const OUT = 'tests/shots/depth2';
  const PORT = Number(arg('port', 8812));
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log('  shot', `${OUT}/${n}.png`); };
  await shot('00-title');

  console.log('\n════ THE DECISION AS THE PLAYER MEETS IT ════\n');
  await page.evaluate(() => window.__ARENA.battle.quick(424242));
  await page.waitForFunction(() => !!window.__ARENA.battle.state()?.request?.[0], null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.battle.skipAnimations(true));
  await page.waitForFunction(() => !window.__ARENA.battle.isAnimating(), null, { timeout: 40000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  await shot('01-battle-menu');

  // FIGHT panel
  const clicked = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, [role=button], .btn, .menu-item, li, div')];
    const b = all.find((e) => /^\s*fight\s*$/i.test(e.textContent || '') && e.offsetParent);
    if (b) { b.click(); return true; }
    return false;
  });
  await new Promise((r) => setTimeout(r, 1200));
  await shot('02-fight-cards');
  console.log('clicked FIGHT:', clicked);

  const dump = await page.evaluate(() => {
    const root = document.querySelector('#ui') || document.body;
    const txt = (el) => (el.innerText || '').replace(/\n+/g, ' | ').trim();
    const cards = [...root.querySelectorAll('*')].filter((e) => /move-?card|movebtn|move-button|move\b/i.test(e.className || ''));
    const uniq = [];
    for (const c of cards) if (!uniq.some((u) => u.contains(c))) uniq.push(c);
    return {
      screen: window.__ARENA.router.current,
      uiText: txt(root).slice(0, 2500),
      classes: [...new Set([...root.querySelectorAll('*')].map((e) => String(e.className)).filter(Boolean))].slice(0, 60),
      cardTexts: uniq.slice(0, 8).map(txt)
    };
  });
  console.log('screen:', dump.screen);
  console.log('\n--- MOVE CARD TEXT ---');
  dump.cardTexts.forEach((t, i) => console.log(`  card ${i}: ${t}`));
  console.log('\n--- FULL UI TEXT ---\n' + dump.uiText);
  console.log('\n--- CLASSES ---\n' + dump.classes.join(' '));

  // Party / switch panel
  await page.keyboard.press('Escape').catch(() => {});
  await new Promise((r) => setTimeout(r, 500));
  const pc = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, [role=button], .btn, .menu-item, li, div')];
    const b = all.find((e) => /^\s*(party|switch|team)\s*$/i.test(e.textContent || '') && e.offsetParent);
    if (b) { b.click(); return b.textContent.trim(); }
    return null;
  });
  await new Promise((r) => setTimeout(r, 1200));
  await shot('03-party');
  console.log('\nparty button:', pc);
  console.log('party panel text:\n' + await page.evaluate(() => (document.querySelector('#ui')?.innerText || '').slice(0, 1600)));

  // Bag
  await page.keyboard.press('Escape').catch(() => {});
  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, [role=button], .btn, .menu-item, li, div')];
    const b = all.find((e) => /^\s*bag\s*$/i.test(e.textContent || '') && e.offsetParent);
    if (b) b.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await shot('04-bag');
  console.log('\nbag panel text:\n' + await page.evaluate(() => (document.querySelector('#ui')?.innerText || '').slice(0, 1200)));

  // Play out a full battle with the AI on both sides, screenshotting mid-battle
  await page.keyboard.press('Escape').catch(() => {});
  const sum = await page.evaluate(async () => {
    const A = window.__ARENA;
    const out = { turns: 0, log: [] };
    for (let i = 0; i < 40; i++) {
      const st = A.battle.state();
      if (!st || st.ended) break;
      if (st.request && st.request[0]) {
        const c = A.sim.chooseAction ? A.sim.chooseAction(st, 0, 'ace') : null;
        A.battle.choose(0, c || { kind: 'move', moveId: st.sides[0].party[st.sides[0].activeIndex].moves[0].id });
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    const st = A.battle.state();
    out.turns = st?.turn ?? 0;
    out.log = A.battle.log().slice(-30);
    return out;
  });
  await new Promise((r) => setTimeout(r, 1500));
  await shot('05-midbattle');
  console.log('\nturns reached:', sum.turns);
  console.log('last log lines:\n  ' + sum.log.join('\n  '));
  console.log('\nconsole errors:', errs.length ? errs.slice(0, 6) : 'none');
  await browser.close();
}

/* ================================================================ economy */
if (MODE === 'economy') {
  const A = { move: 0, status: 0, switch: 0, item: 0, run: 0 };
  let turns = 0, games = 0, damageEvents = 0, faints = 0;
  const hitsToKO = [];
  let curHits = new Map();
  for (let n = 0; n < GAMES; n++) {
    const rng = new RNG(90000 + n * 7919);
    const b = mkBattle(4000 + n * 131, team(rng), team(rng));
    curHits = new Map();
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      const c = [null, null];
      for (const s of [0, 1]) {
        if (!b.request[s]) continue;
        const ch = chooseAction(b, s, LEVEL);
        c[s] = ch;
        if (b.request[s] === 'move') {
          if (ch.kind === 'move') {
            const m = getMove(ch.moveId);
            if (m && m.category === 'status') A.status++; else A.move++;
          } else A[ch.kind] = (A[ch.kind] || 0) + 1;
        }
      }
      const evs = submitChoices(b, c);
      for (const e of evs) {
        if (e.t === 'damage' && e.source === 'move') {
          damageEvents++;
          curHits.set(e.uid, (curHits.get(e.uid) || 0) + 1);
        }
        if (e.t === 'faint') { faints++; hitsToKO.push(curHits.get(e.uid) || 0); curHits.set(e.uid, 0); }
      }
    }
    turns += b.turn; games++;
  }
  const acts = A.move + A.status + A.switch + A.item + A.run;
  hitsToKO.sort((a, b) => a - b);
  const med = hitsToKO[Math.floor(hitsToKO.length / 2)];
  const mean = hitsToKO.reduce((a, c) => a + c, 0) / hitsToKO.length;
  console.log(`\n════ TURN ECONOMY — ${LEVEL} vs ${LEVEL}, ${games} games of ${SIZE}v${SIZE} ════\n`);
  console.log(`avg game length      ${(turns / games).toFixed(1)} turns  (${(turns / games / (SIZE * 2)).toFixed(1)} turns per fighter on the field)`);
  console.log(`decisions logged     ${acts}`);
  console.log(`  attacking move     ${A.move} (${pct(A.move / acts)})`);
  console.log(`  status move        ${A.status} (${pct(A.status / acts)})`);
  console.log(`  switch             ${A.switch} (${pct(A.switch / acts)})`);
  console.log(`  bag item           ${A.item} (${pct(A.item / acts)})`);
  console.log(`NON-ATTACK share     ${pct((A.status + A.switch + A.item) / acts)}`);
  console.log(`\nhits survived before fainting: mean ${mean.toFixed(2)}, median ${med}, p10 ${hitsToKO[Math.floor(hitsToKO.length * 0.1)]}, p90 ${hitsToKO[Math.floor(hitsToKO.length * 0.9)]}`);
  const dist = {};
  for (const h of hitsToKO) dist[Math.min(h, 6)] = (dist[Math.min(h, 6)] || 0) + 1;
  console.log('KO after n damaging hits: ' + Object.entries(dist).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}${k === '6' ? '+' : ''}:${pct(v / hitsToKO.length)}`).join('  '));
}

/* ================================================================== reach */
if (MODE === 'reach') {
  const movesUsed = new Map(), abilFired = new Map(), itemsFired = new Map();
  const statusSeen = new Map(); const kinds = new Map();
  let turns = 0, hazSet = 0, scrSet = 0, wthr = 0, terr = 0, troom = 0, subs = 0, pivots = 0, crits = 0, misses = 0;
  let effCount = { 0: 0, 0.25: 0, 0.5: 0, 1: 0, 2: 0, 4: 0 };
  const movesInSets = new Set();
  for (let n = 0; n < GAMES; n++) {
    const rng = new RNG(31337 + n * 7717);
    const t0 = team(rng), t1 = team(rng);
    for (const t of [t0, t1]) for (const m of t) m.moves.forEach((id) => movesInSets.add(id));
    const b = mkBattle(7000 + n * 97, t0, t1);
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      const c = [null, null];
      for (const s of [0, 1]) if (b.request[s]) c[s] = chooseAction(b, s, LEVEL);
      const evs = submitChoices(b, c);
      for (const e of evs) {
        kinds.set(e.t, (kinds.get(e.t) || 0) + 1);
        if (e.t === 'moveUsed') movesUsed.set(e.moveId, (movesUsed.get(e.moveId) || 0) + 1);
        if (e.t === 'ability') abilFired.set(e.abilityId, (abilFired.get(e.abilityId) || 0) + 1);
        if (e.t === 'itemUse') itemsFired.set(e.itemId, (itemsFired.get(e.itemId) || 0) + 1);
        if (e.t === 'statusApply') statusSeen.set(e.status, (statusSeen.get(e.status) || 0) + 1);
        if (e.t === 'hazard' && e.phase === 'set') hazSet++;
        if (e.t === 'screen' && e.phase === 'start') scrSet++;
        if (e.t === 'weather' && e.phase === 'start') wthr++;
        if (e.t === 'terrain' && e.phase === 'start') terr++;
        if (e.t === 'trickRoom') troom++;
        if (e.t === 'substitute' && e.phase === 'start') subs++;
        if (e.t === 'pivot') pivots++;
        if (e.t === 'damage' && e.source === 'move') { if (e.crit) crits++; if (e.eff !== undefined) effCount[e.eff] = (effCount[e.eff] || 0) + 1; }
        if (e.t === 'miss') misses++;
      }
    }
    turns += b.turn;
  }
  const totMoves = Object.keys(MOVES).length;
  const totAbil = Object.keys(ABILITIES).length;
  const totItems = Object.keys(ITEMS).length;
  console.log(`\n════ REACHABILITY — ${GAMES} default ${SIZE}v${SIZE} games, ${LEVEL} vs ${LEVEL}, ${turns} turns ════\n`);
  console.log(`moves in the library        ${totMoves}`);
  console.log(`moves that appear on a set  ${movesInSets.size} (${pct(movesInSets.size / totMoves)})`);
  console.log(`moves actually used         ${movesUsed.size} (${pct(movesUsed.size / totMoves)})`);
  const statusUsed = [...movesUsed.keys()].filter((id) => getMove(id)?.category === 'status');
  console.log(`  of which status moves     ${statusUsed.length} of 90 status moves in the library`);
  console.log(`abilities that fired        ${abilFired.size} / ${totAbil} (${pct(abilFired.size / totAbil)})`);
  console.log(`items that fired            ${itemsFired.size} / ${totItems} (${pct(itemsFired.size / totItems)})`);
  console.log(`\nper 100 turns:`);
  const per = (x) => (x / turns * 100).toFixed(1);
  console.log(`  status inflicted ${per([...statusSeen.values()].reduce((a, c) => a + c, 0))}   hazards set ${per(hazSet)}   screens ${per(scrSet)}   weather ${per(wthr)}   terrain ${per(terr)}   trickroom ${per(troom)}   subs ${per(subs)}   pivots ${per(pivots)}`);
  console.log(`  crits ${per(crits)}   misses ${per(misses)}`);
  console.log(`status breakdown: ${[...statusSeen.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ') || 'NONE'}`);
  const tot = Object.values(effCount).reduce((a, c) => a + c, 0);
  console.log(`effectiveness of damaging hits: ${Object.entries(effCount).map(([k, v]) => `${k}x:${pct(v / tot)}`).join('  ')}`);
  console.log(`\ntop 15 moves used: ${[...movesUsed.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}(${v})`).join(' ')}`);
  console.log(`\ntop items: ${[...itemsFired.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}(${v})`).join(' ')}`);
  console.log(`\ntop abilities: ${[...abilFired.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}(${v})`).join(' ')}`);
  console.log(`\nevent kinds seen: ${[...kinds.keys()].sort().join(' ')}`);
}

/* ================================================================= forced */
// On a given turn, how forced is the decision?
if (MODE === 'forced') {
  let turnsScored = 0, agree = 0, aiNonMove = 0;
  const margins = [];        // (best - 2nd best) expected damage as % of foe HP
  const koOptions = [];      // how many legal moves KO the foe outright
  let onlyOneKO = 0, multiKO = 0, zeroKO = 0;
  let bestIsAlsoOnlyGoodOne = 0;
  const chosenRank = new Map();
  for (let n = 0; n < GAMES; n++) {
    const rng = new RNG(5150 + n * 3733);
    const b = mkBattle(11000 + n * 211, team(rng), team(rng));
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      const c = [null, null];
      for (const s of [0, 1]) {
        if (!b.request[s]) continue;
        const ch = chooseAction(b, s, LEVEL);
        c[s] = ch;
        if (b.request[s] !== 'move') continue;
        const rows = greedyRank(b, s);
        if (rows.length < 2) continue;
        turnsScored++;
        if (ch.kind !== 'move') { aiNonMove++; chosenRank.set('nonmove', (chosenRank.get('nonmove') || 0) + 1); continue; }
        const idx = rows.findIndex((r) => r.id === ch.moveId);
        chosenRank.set(idx, (chosenRank.get(idx) || 0) + 1);
        if (idx === 0) agree++;
        margins.push(rows[0].score - rows[1].score);
        const kos = rows.filter((r) => r.score >= 1).length;
        koOptions.push(kos);
        if (kos === 0) zeroKO++; else if (kos === 1) onlyOneKO++; else multiKO++;
        if (rows[0].score >= 1 && rows[1].score < 1) bestIsAlsoOnlyGoodOne++;
      }
      submitChoices(b, c);
    }
  }
  margins.sort((a, b) => a - b);
  const q = (p) => margins[Math.floor(margins.length * p)];
  console.log(`\n════ HOW FORCED IS THE TURN? — ${LEVEL}, ${GAMES} games, ${turnsScored} move-decisions ════\n`);
  console.log(`AI picks the single biggest-damage move   ${pct(agree / turnsScored)}`);
  console.log(`AI does something other than a move       ${pct(aiNonMove / turnsScored)}`);
  console.log(`AI picks a strictly worse-damage move     ${pct(1 - agree / turnsScored - aiNonMove / turnsScored)}`);
  console.log(`chosen greedy-rank histogram: ${[...chosenRank.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([k, v]) => `${k}:${pct(v / turnsScored)}`).join('  ')}`);
  console.log(`\nmargin between best and 2nd-best move (as fraction of foe's remaining HP):`);
  console.log(`  p10 ${q(0.1).toFixed(3)}  p25 ${q(0.25).toFixed(3)}  median ${q(0.5).toFixed(3)}  p75 ${q(0.75).toFixed(3)}  p90 ${q(0.9).toFixed(3)}`);
  console.log(`  share of turns where the margin is < 5% of foe HP (i.e. genuinely close): ${pct(margins.filter((m) => m < 0.05).length / margins.length)}`);
  console.log(`\nturns where at least one move outright KOs: ${pct((onlyOneKO + multiKO) / (zeroKO + onlyOneKO + multiKO))}`);
  console.log(`  exactly one KO option (forced): ${pct(onlyOneKO / (zeroKO + onlyOneKO + multiKO))}   multiple: ${pct(multiKO / (zeroKO + onlyOneKO + multiKO))}`);
}

/* ================================================================ ablate2 */
// Surgically remove ONE tool from the AI and see what it costs.
if (MODE === 'ablate2') {
  const full = (state, side) => chooseAction(state, side, LEVEL);
  const noSwitch = (state, side) => {
    const c = chooseAction(state, side, LEVEL);
    if (state.request[side] === 'move' && c.kind === 'switch') return greedyish(state, side);
    return c;
  };
  const noStatus = (state, side) => {
    const c = chooseAction(state, side, LEVEL);
    if (state.request[side] === 'move' && c.kind === 'move' && getMove(c.moveId)?.category === 'status') return greedy(state, side);
    return c;
  };
  const noItem = (state, side) => {
    const c = chooseAction(state, side, LEVEL);
    if (state.request[side] === 'move' && c.kind === 'item') return greedyish(state, side);
    return c;
  };
  // "greedyish": best non-switch action the real brain would take
  // The AI exposes no ranked candidate list, so a banned action falls back to
  // the best damaging move — the same fallback meta.mjs uses.
  function greedyish(state, side) { return greedy(state, side); }
  function series(pA, pB, games, seed0) {
    let wa = 0, wb = 0, dr = 0, tn = 0;
    for (let i = 0; i < games; i++) {
      const rng = new RNG(seed0 + i * 6367);
      const ta = team(rng), tb = team(rng);
      for (const [x, y, flip] of [[pA, pB, false], [pB, pA, true]]) {
        const b = mkBattle(seed0 + i * 977, ta, tb);
        let g = 0;
        while (!b.ended && g++ < MAXT) {
          const c = [null, null];
          for (const s of [0, 1]) if (b.request[s]) c[s] = (s === 0 ? x : y)(b, s);
          submitChoices(b, c);
        }
        tn += b.turn;
        const aWon = flip ? b.winner === 1 : b.winner === 0;
        const bWon = flip ? b.winner === 0 : b.winner === 1;
        if (aWon) wa++; else if (bWon) wb++; else dr++;
      }
    }
    return { wa, wb, dr, n: games * 2, wr: wa / (games * 2), turns: tn / (games * 2) };
  }
  console.log(`\n════ ONE-TOOL ABLATION — handicapped ${LEVEL} vs full ${LEVEL} ════`);
  console.log(`(50% means the tool is worth nothing; lower means the tool is load-bearing)\n`);
  for (const [name, pol] of [['no switching', noSwitch], ['no status moves', noStatus], ['no bag items', noItem], ['pure greedy (biggest number)', greedy]]) {
    const r = series(pol, full, GAMES, 8080);
    console.log(`${name.padEnd(30)} ${pct(r.wr).padStart(7)}  (${r.wa}-${r.wb}-${r.dr} of ${r.n}, ${r.turns.toFixed(1)} turns)`);
  }
}

/* ================================================================== swing */
// Does a switch or a status move ever *change who wins*?
// Replay the same battle, forcing one decision to differ at a chosen turn.
if (MODE === 'swing') {
  let n = 0, switchFlips = 0, switchTries = 0, statusFlips = 0, statusTries = 0;
  for (let i = 0; i < GAMES; i++) {
    const rng = new RNG(777 + i * 4231);
    const ta = team(rng), tb = team(rng);
    const seed = 20000 + i * 313;
    const run = (override) => {
      const b = mkBattle(seed, ta.map((m) => ({ ...m })), tb.map((m) => ({ ...m })));
      let g = 0;
      while (!b.ended && g++ < MAXT) {
        const c = [null, null];
        for (const s of [0, 1]) {
          if (!b.request[s]) continue;
          let ch = chooseAction(b, s, LEVEL);
          if (override && s === 0 && b.turn === override.turn && b.request[0] === 'move') {
            const alt = override.fn(b);
            if (alt) ch = alt;
          }
          c[s] = ch;
        }
        submitChoices(b, c);
      }
      return b.winner;
    };
    const base = run(null);
    if (base !== 0 && base !== 1) continue;
    n++;
    // force a switch on turn 2 for side 0
    const swFn = (b) => {
      const sw = legalSwitches(b, 0);
      return sw.length ? { kind: 'switch', toSlot: sw[0] } : null;
    };
    const stFn = (b) => {
      const legal = legalMoves(b, 0).filter((id) => getMove(id)?.category === 'status');
      return legal.length ? { kind: 'move', moveId: legal[0], target: 'foe' } : null;
    };
    for (const t of [2, 3]) {
      const probe = mkBattle(seed, ta.map((m) => ({ ...m })), tb.map((m) => ({ ...m })));
      // cheap legality precheck done inside run
      const r1 = run({ turn: t, fn: swFn });
      switchTries++; if (r1 !== base) switchFlips++;
      const r2 = run({ turn: t, fn: stFn });
      statusTries++; if (r2 !== base) statusFlips++;
    }
  }
  console.log(`\n════ DOES ONE DIFFERENT DECISION CHANGE THE WINNER? — ${LEVEL}, ${n} decided games ════\n`);
  console.log(`forcing one switch  on turn 2 or 3: winner flips ${pct(switchFlips / switchTries)} of ${switchTries} probes`);
  console.log(`forcing one status  on turn 2 or 3: winner flips ${pct(statusFlips / statusTries)} of ${statusTries} probes`);
}

/* ================================================================= swing2 */
// Same as swing, but with a CONTROL arm: forcing a different *attack* changes
// the RNG stream too, so any flip rate must be read against that baseline.
if (MODE === 'swing2') {
  let n = 0;
  const arms = { identical: [0, 0], switch: [0, 0], status: [0, 0], secondBest: [0, 0], worstAttack: [0, 0] };
  for (let i = 0; i < GAMES; i++) {
    const rng = new RNG(777 + i * 4231);
    const ta = team(rng), tb = team(rng);
    const seed = 20000 + i * 313;
    const run = (override) => {
      const b = mkBattle(seed, ta.map((m) => ({ ...m })), tb.map((m) => ({ ...m })));
      let g = 0, applied = false;
      while (!b.ended && g++ < MAXT) {
        const c = [null, null];
        for (const s of [0, 1]) {
          if (!b.request[s]) continue;
          let ch = chooseAction(b, s, LEVEL);
          if (override && s === 0 && b.turn === override.turn && b.request[0] === 'move') {
            const alt = override.fn(b, ch);
            if (alt) { ch = alt; applied = true; }
          }
          c[s] = ch;
        }
        submitChoices(b, c);
      }
      return { w: b.winner, applied };
    };
    const base = run(null).w;
    if (base !== 0 && base !== 1) continue;
    n++;
    const fns = {
      identical: () => null,
      switch: (b) => { const sw = legalSwitches(b, 0); return sw.length ? { kind: 'switch', toSlot: sw[0] } : null; },
      status: (b) => { const l = legalMoves(b, 0).filter((id) => getMove(id)?.category === 'status'); return l.length ? { kind: 'move', moveId: l[0], target: 'foe' } : null; },
      secondBest: (b, ch) => { const r = greedyRank(b, 0).filter((x) => x.score > 0); if (r.length < 2) return null; const alt = r.find((x) => x.id !== (ch.kind === 'move' ? ch.moveId : null)); return alt ? { kind: 'move', moveId: alt.id, target: 'foe' } : null; },
      worstAttack: (b, ch) => { const r = greedyRank(b, 0).filter((x) => x.score > 0); if (r.length < 2) return null; const alt = r[r.length - 1]; return alt.id === (ch.kind === 'move' ? ch.moveId : null) ? null : { kind: 'move', moveId: alt.id, target: 'foe' }; }
    };
    for (const t of [2, 3]) {
      for (const [k, fn] of Object.entries(fns)) {
        const r = run({ turn: t, fn });
        if (k !== 'identical' && !r.applied) continue;
        arms[k][1]++; if (r.w !== base) arms[k][0]++;
      }
    }
  }
  console.log(`\n════ DOES ONE DIFFERENT DECISION CHANGE THE WINNER? — ${LEVEL}, ${n} decided games ════\n`);
  console.log(`(the RNG stream shifts whenever an action changes, so read every arm against 'secondBest')\n`);
  for (const [k, [f, t]] of Object.entries(arms)) {
    console.log(`  ${k.padEnd(12)} winner flips ${pct(f / (t || 1)).padStart(7)}  (${f}/${t} probes)`);
  }
}

/* ============================================================== movespace */
// 85 distinct move IDs reach the field. How many distinct *behaviours* is that?
if (MODE === 'movespace') {
  const setMoves = new Set();
  for (const f of allFighters()) defaultMoves(f.id, 50).forEach((m) => setMoves.add(m));
  const sig = (m) => {
    const eff = (m.effects || []).map((e) => {
      if (e.kind === 'boost') return `boost:${Object.entries(e.stats || {}).map(([k, v]) => k + v).sort().join(',')}@${e.target}${e.chance < 100 ? '?' : ''}`;
      if (e.kind === 'status') return `status:${e.value}${e.chance < 100 ? '?' : ''}`;
      if (e.kind === 'volatile') return `vol:${e.value}${e.chance < 100 ? '?' : ''}`;
      return `${e.kind}:${e.value ?? e.frac ?? ''}`;
    }).sort().join('|');
    const pw = m.power === 0 ? 'status' : m.power < 60 ? 'weak' : m.power < 90 ? 'mid' : m.power < 120 ? 'strong' : 'nuke';
    return [m.category, pw, m.priority, eff, m.drain ? 'drain' : '', m.recoil ? 'recoil' : '', m.hits ? 'multi' : '', (m.flags || []).filter((f) => ['pivot', 'protect', 'charge', 'recharge', 'pursuit'].includes(f)).sort().join('+')].join(' / ');
  };
  const groupsAll = new Map(), groupsSet = new Map();
  for (const m of Object.values(MOVES)) {
    const s = sig(m);
    (groupsAll.get(s) || groupsAll.set(s, []).get(s)).push(m.id);
    if (setMoves.has(m.id)) (groupsSet.get(s) || groupsSet.set(s, []).get(s)).push(m.id);
  }
  console.log(`\n════ MOVE SPACE — distinct IDs vs distinct behaviours ════\n`);
  console.log(`library:   ${Object.keys(MOVES).length} move ids  ->  ${groupsAll.size} distinct behaviour signatures`);
  console.log(`reachable: ${setMoves.size} move ids on default sets  ->  ${groupsSet.size} distinct behaviour signatures`);
  const big = [...groupsSet.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12);
  console.log(`\nbiggest reachable clusters (same behaviour, different name):`);
  for (const [s, ids] of big) console.log(`  ${String(ids.length).padStart(2)}x  ${s}\n        ${ids.join(', ')}`);
  // pure damage, no rider — measured over the 128 real slots, not unique ids
  let slots = 0, plainSlots = 0, statusSlots = 0, riderSlots = 0;
  const slotTypes = new Map();
  for (const f of allFighters()) {
    for (const id of defaultMoves(f.id, 50)) {
      const m = getMove(id); if (!m) continue;
      slots++;
      slotTypes.set(`${m.category}/${m.type}`, (slotTypes.get(`${m.category}/${m.type}`) || 0) + 1);
      if (m.category === 'status') { statusSlots++; continue; }
      const rider = (m.effects || []).length || m.drain || m.recoil || m.hits || m.priority !== 0
        || (m.flags || []).some((x) => ['pivot', 'charge', 'recharge', 'pursuit'].includes(x));
      if (rider) riderSlots++; else plainSlots++;
    }
  }
  console.log(`\ndefault move slots: ${slots}`);
  console.log(`  status moves            ${statusSlots} (${pct(statusSlots / slots)})`);
  console.log(`  attacks WITH a rider    ${riderSlots} (${pct(riderSlots / slots)})`);
  console.log(`  attacks with NO rider   ${plainSlots} (${pct(plainSlots / slots)})  <- pure "biggest number" slots`);
  console.log(`distinct (category,type) pairs across all slots: ${slotTypes.size}`);
}

/* =============================================================== attrition */
// PP, switch rate by AI tier, and how long the resource game lasts.
if (MODE === 'attrition') {
  console.log(`\n════ ATTRITION & SWITCH RATE BY TIER — ${GAMES} games each ════\n`);
  console.log('tier      turns  switch%  status%  item%  ppOut%  maxPPspent  KO-by-residual%');
  for (const tier of ['pirate', 'ace', 'warlord']) {
    let turns = 0, sw = 0, st = 0, it = 0, mv = 0, ppOutGames = 0, maxSpent = 0, residKO = 0, totKO = 0;
    for (let n = 0; n < GAMES; n++) {
      const rng = new RNG(4242 + n * 5501);
      const b = mkBattle(6100 + n * 173, team(rng), team(rng));
      let g = 0, hitZero = false;
      while (!b.ended && g++ < MAXT) {
        const c = [null, null];
        for (const s of [0, 1]) {
          if (!b.request[s]) continue;
          const ch = chooseAction(b, s, tier); c[s] = ch;
          if (b.request[s] !== 'move') continue;
          if (ch.kind === 'switch') sw++;
          else if (ch.kind === 'item') it++;
          else if (ch.kind === 'move' && getMove(ch.moveId)?.category === 'status') st++;
          else mv++;
        }
        const evs = submitChoices(b, c);
        for (const e of evs) {
          if (e.t === 'faint') totKO++;
          if (e.t === 'damage' && e.source && e.source !== 'move') { /* residual tracked below */ }
        }
        // find the KO cause: last damage event on that uid this turn
        for (let i = 0; i < evs.length; i++) {
          if (evs[i].t !== 'faint') continue;
          for (let j = i - 1; j >= 0; j--) {
            if (evs[j].t === 'damage' && evs[j].uid === evs[i].uid) { if (evs[j].source !== 'move') residKO++; break; }
          }
        }
      }
      for (const side of b.sides) for (const m of side.party) for (const mo of m.moves) {
        const spent = mo.maxPp - mo.pp;
        if (spent > maxSpent) maxSpent = spent;
        if (mo.pp === 0) hitZero = true;
      }
      if (hitZero) ppOutGames++;
      turns += b.turn;
    }
    const acts = sw + st + it + mv;
    console.log(`${tier.padEnd(9)} ${(turns / GAMES).toFixed(1).padStart(5)}  ${pct(sw / acts).padStart(7)}  ${pct(st / acts).padStart(7)}  ${pct(it / acts).padStart(5)}  ${pct(ppOutGames / GAMES).padStart(6)}  ${String(maxSpent).padStart(10)}  ${pct(residKO / totKO).padStart(15)}`);
  }
}

/* ================================================================ control */
// Speed control + per-fighter move concentration ("is each fighter one button?")
if (MODE === 'control') {
  const { speedStat } = await import('../../src/core/stats.js');
  let turns = 0, flips = 0, ties = 0;
  const used = new Map();   // speciesId -> Map(moveId -> n)
  for (let n = 0; n < GAMES; n++) {
    const rng = new RNG(1201 + n * 6607);
    const b = mkBattle(9100 + n * 149, team(rng), team(rng));
    let g = 0;
    while (!b.ended && g++ < MAXT) {
      const c = [null, null];
      const a0 = active(b, 0), a1 = active(b, 1);
      if (a0 && a1 && b.request[0] === 'move' && b.request[1] === 'move') {
        turns++;
        const baseFast = a0.stats.spe === a1.stats.spe ? 0 : (a0.stats.spe > a1.stats.spe ? 0 : 1);
        const s0 = speedStat(a0), s1 = speedStat(a1);
        const realFast = s0 === s1 ? 0 : (s0 > s1 ? 0 : 1);
        if (a0.stats.spe === a1.stats.spe) ties++;
        else if (baseFast !== realFast) flips++;
      }
      for (const s of [0, 1]) {
        if (!b.request[s]) continue;
        const ch = chooseAction(b, s, LEVEL); c[s] = ch;
        if (b.request[s] === 'move' && ch.kind === 'move') {
          const me = active(b, s);
          if (me) {
            if (!used.has(me.speciesId)) used.set(me.speciesId, new Map());
            const m = used.get(me.speciesId); m.set(ch.moveId, (m.get(ch.moveId) || 0) + 1);
          }
        }
      }
      submitChoices(b, c);
    }
  }
  console.log(`\n════ SPEED CONTROL & MOVE CONCENTRATION — ${LEVEL}, ${GAMES} games ════\n`);
  console.log(`turn-order flipped away from raw base Speed on ${pct(flips / turns)} of ${turns} contested turns`);
  console.log(`(that is: paralysis, boosts, held-item Speed, all combined)\n`);
  const rows = [];
  for (const [sp, m] of used) {
    const tot = [...m.values()].reduce((a, c) => a + c, 0);
    const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const H = -[...m.values()].reduce((a, c) => a + (c / tot) * Math.log2(c / tot), 0);
    rows.push({ sp, tot, top: sorted[0][0], share: sorted[0][1] / tot, distinct: m.size, H });
  }
  rows.sort((a, b) => b.share - a.share);
  console.log('fighter            picks  top move                 top-move share  distinct  entropy(bits, max 2)');
  for (const r of rows) console.log(`${r.sp.padEnd(18)} ${String(r.tot).padStart(5)}  ${r.top.padEnd(24)} ${pct(r.share).padStart(13)}  ${String(r.distinct).padStart(8)}  ${r.H.toFixed(2).padStart(6)}`);
  const mean = rows.reduce((a, c) => a + c.share, 0) / rows.length;
  const mh = rows.reduce((a, c) => a + c.H, 0) / rows.length;
  console.log(`\nmean top-move share ${pct(mean)}   mean entropy ${mh.toFixed(2)} bits of a possible 2.00 (4 slots used evenly)`);
  console.log(`fighters that spend >60% of picks on ONE move: ${rows.filter((r) => r.share > 0.6).length}/${rows.length}`);
}

/* ================================================================= roster2 */
if (MODE === 'roster2') {
  const fs = allFighters();
  console.log(`\n════ ROSTER SHAPE — ${fs.length} fighters, default sets ════\n`);
  const rows = fs.map((f) => {
    const mv = defaultMoves(f.id, 50);
    const defs = mv.map((id) => getMove(id)).filter(Boolean);
    const st = defs.filter((m) => m.category === 'status').length;
    const phys = defs.filter((m) => m.category === 'physical').length;
    const spec = defs.filter((m) => m.category === 'special').length;
    const types = new Set(defs.filter((m) => m.category !== 'status').map((m) => m.type));
    const b = f.base;
    const bst = b.hp + b.atk + b.def + b.spa + b.spd + b.spe;
    const bulk = b.hp + b.def + b.spd;
    const off = Math.max(b.atk, b.spa);
    // archetype heuristics
    let arch = 'mid';
    if (bulk >= 300 && off <= 100) arch = 'WALL';
    else if (b.spe >= 110 && off >= 115) arch = 'SWEEPER';
    else if (off >= 125 && b.spe < 95) arch = 'WALLBREAKER';
    else if (bulk >= 290 && off >= 105) arch = 'BULKY-OFF';
    else if (b.spe >= 105) arch = 'FAST-UTIL';
    const hasHazard = defs.some((m) => (m.effects || []).some((e) => e.kind === 'hazard'));
    const hasScreen = defs.some((m) => (m.effects || []).some((e) => e.kind === 'screen'));
    const hasHeal = defs.some((m) => (m.effects || []).some((e) => e.kind === 'heal') || m.drain);
    const hasStatus = defs.some((m) => (m.effects || []).some((e) => e.kind === 'status'));
    const hasBoost = defs.some((m) => (m.effects || []).some((e) => e.kind === 'boost' && e.target === 'self'));
    const hasPivot = defs.some((m) => (m.flags || []).includes('pivot'));
    const prio = defs.some((m) => m.priority > 0 && m.power > 0);
    return { id: f.id, tier: f.tier, types: f.types.join('/'), bst, bulk, off, spe: b.spe, arch, st, phys, spec, ncov: types.size, hasHazard, hasScreen, hasHeal, hasStatus, hasBoost, hasPivot, prio, mv, item: defaultItem(f.id), abil: defaultAbility(f.id) };
  });
  console.log('id                 tier types              bst bulk  off  spe  archetype     atk-types stat  haz scr heal sts boost piv prio  item');
  for (const r of rows.sort((a, b) => a.arch.localeCompare(b.arch) || b.bst - a.bst)) {
    console.log(`${r.id.padEnd(18)} ${r.tier.padEnd(4)} ${r.types.padEnd(18)} ${String(r.bst).padStart(3)} ${String(r.bulk).padStart(4)} ${String(r.off).padStart(4)} ${String(r.spe).padStart(4)}  ${r.arch.padEnd(12)} ${String(r.ncov).padStart(8)} ${String(r.st).padStart(4)}   ${r.hasHazard ? 'Y' : '.'}   ${r.hasScreen ? 'Y' : '.'}   ${r.hasHeal ? 'Y' : '.'}    ${r.hasStatus ? 'Y' : '.'}   ${r.hasBoost ? 'Y' : '.'}    ${r.hasPivot ? 'Y' : '.'}   ${r.prio ? 'Y' : '.'}   ${r.item}`);
  }
  const counts = {};
  for (const r of rows) counts[r.arch] = (counts[r.arch] || 0) + 1;
  console.log(`\narchetypes: ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join('  ')}`);
  console.log(`sets with >=1 status move: ${rows.filter((r) => r.st > 0).length}/${rows.length}   with recovery: ${rows.filter((r) => r.hasHeal).length}   with hazards: ${rows.filter((r) => r.hasHazard).length}   with screens: ${rows.filter((r) => r.hasScreen).length}   with self-boost: ${rows.filter((r) => r.hasBoost).length}   with pivot: ${rows.filter((r) => r.hasPivot).length}   with priority: ${rows.filter((r) => r.prio).length}`);
  console.log(`avg attacking types per set: ${(rows.reduce((a, c) => a + c.ncov, 0) / rows.length).toFixed(2)}`);
  // pairwise moveset overlap
  let shared = 0, pairs = 0, maxOv = 0, maxPair = '';
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const a = new Set(rows[i].mv), b = rows[j].mv;
    const ov = b.filter((x) => a.has(x)).length;
    shared += ov; pairs++;
    if (ov > maxOv) { maxOv = ov; maxPair = `${rows[i].id}/${rows[j].id}`; }
  }
  console.log(`pairwise shared moves: mean ${(shared / pairs).toFixed(2)} of 4   worst pair ${maxPair} shares ${maxOv}`);
  const allSetMoves = new Set(rows.flatMap((r) => r.mv));
  console.log(`distinct moves across all 32 default sets: ${allSetMoves.size} of ${rows.length * 4} slots`);
  const items = new Set(rows.map((r) => r.item)), abils = new Set(rows.map((r) => r.abil));
  console.log(`distinct default items: ${items.size} (${[...items].join(', ')})`);
  console.log(`distinct default abilities: ${abils.size}`);
}

/* ==================================================================== bulk */
// How many hits does a typical fighter survive from a typical attacker?
if (MODE === 'bulk') {
  const fs = allFighters();
  const mk = (f) => {
    const m = makeDefaultMember(f.id, 50);
    return { f, stats: computeStats(f.base, 50, null, null, 'hardy'), member: m };
  };
  const all = fs.map(mk);
  const rows = [];
  let tot = 0, cnt = 0, neutralTot = 0, neutralCnt = 0;
  for (const d of all) {
    let sum = 0, k = 0, nsum = 0, nk = 0;
    for (const a of all) {
      if (a.f.id === d.f.id) continue;
      const mvs = defaultMoves(a.f.id, 50).map(getMove).filter((m) => m && m.category !== 'status' && m.power > 0);
      if (!mvs.length) continue;
      // best move by rough expected damage
      let best = 0, bestNeutral = 0;
      for (const m of mvs) {
        const atkStat = m.category === 'physical' ? a.stats.atk : a.stats.spa;
        const defStat = m.category === 'physical' ? d.stats.def : d.stats.spd;
        const stab = a.f.types.includes(m.type) ? 1.5 : 1;
        const eff = typeEff(m.type, d.f.types);
        const base = ((2 * 50 / 5 + 2) * m.power * atkStat / defStat) / 50 + 2;
        const dmg = base * stab * eff * 0.925 * (m.accuracy === null ? 1 : m.accuracy / 100) * (m.hits ? (m.hits[0] + m.hits[1]) / 2 : 1);
        if (dmg > best) best = dmg;
        const dmgN = base * stab * 0.925 * (m.accuracy === null ? 1 : m.accuracy / 100) * (m.hits ? (m.hits[0] + m.hits[1]) / 2 : 1);
        if (dmgN > bestNeutral) bestNeutral = dmgN;
      }
      if (best > 0) { sum += d.stats.hp / best; k++; }
      if (bestNeutral > 0) { nsum += d.stats.hp / bestNeutral; nk++; }
    }
    rows.push({ id: d.f.id, hp: d.stats.hp, hits: sum / k, nhits: nsum / nk });
    tot += sum / k; cnt++; neutralTot += nsum / nk; neutralCnt++;
  }
  rows.sort((a, b) => b.hits - a.hits);
  console.log(`\n════ BULK — hits survived vs every other fighter's best default move (level 50) ════\n`);
  console.log('id                  hp   hits-to-KO (best move)   (type-neutral)');
  for (const r of rows) console.log(`${r.id.padEnd(18)} ${String(r.hp).padStart(4)}   ${r.hits.toFixed(2).padStart(8)}                ${r.nhits.toFixed(2).padStart(6)}`);
  console.log(`\nroster mean: ${(tot / cnt).toFixed(2)} hits to KO (type-neutral ${(neutralTot / neutralCnt).toFixed(2)})`);
  console.log(`bulkiest ${rows[0].id} ${rows[0].hits.toFixed(2)}   frailest ${rows[rows.length - 1].id} ${rows[rows.length - 1].hits.toFixed(2)}   ratio ${(rows[0].hits / rows[rows.length - 1].hits).toFixed(2)}x`);
}
