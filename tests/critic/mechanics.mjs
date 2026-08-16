// CRITIC — the tactical primitives a competitive player actually uses.
// Each case builds an exact board and asserts on the event stream.

import {
  arena, turn, mv, pick, has, texts, RiggedRNG, RNG,
  getMove, MOVES, getFighter, allFighters, FILLER
} from './lib.mjs';

const out = [];
function t(name, fn) {
  try {
    const r = fn();
    out.push({ name, ok: r === true || r?.ok === true, note: (typeof r === 'object' && r?.note) || '' });
  } catch (e) { out.push({ name, ok: false, note: `threw: ${e.message}` }); }
}

const norm = (m, hpFrac = 1) => { m.maxHp = 500; m.hp = Math.floor(500 * hpFrac); };

/* find a move by predicate for generic setups */
const anyStatusMove = MOVES.find((m) => m.category === 'status' && m.target === 'self' && m.effects?.some((e) => e.kind === 'boost'));
const TAUNT = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'taunt'));
const ENCORE = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'encore'));
const DISABLE = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'disable'));
const TORMENT = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'torment'));
const IMPRISON = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'imprison'));
const SUB = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'substitute'));
const PROTECT = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'protect'));
const PIVOT = MOVES.find((m) => m.flags?.includes('pivot'));
const PURSUIT = MOVES.find((m) => m.flags?.includes('pursuit'));
const LEECH = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'leechseed'));
const PERISH = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'perish'));
const DBOND = MOVES.find((m) => m.effects?.some((e) => e.kind === 'volatile' && e.value === 'destinybond'));
const TRICK = MOVES.find((m) => m.effects?.some((e) => e.kind === 'trickRoom'));
const REFLECT = MOVES.find((m) => m.effects?.some((e) => e.kind === 'screen' && e.value === 'reflect'));
const SAFEG = MOVES.find((m) => m.effects?.some((e) => e.kind === 'screen' && e.value === 'safeguard'));

const NEUTRAL_ATK = 'one_sword_slash';   // SLASH 60, physical, 30pp, crit+1
const NEUTRAL_ATK2 = 'flying_slash';     // SLASH 70, special

console.log('primitives found:', {
  taunt: TAUNT?.id, encore: ENCORE?.id, disable: DISABLE?.id, torment: TORMENT?.id,
  imprison: IMPRISON?.id, sub: SUB?.id, protect: PROTECT?.id, pivot: PIVOT?.id,
  pursuit: PURSUIT?.id, leech: LEECH?.id, perish: PERISH?.id, dbond: DBOND?.id,
  trick: TRICK?.id, reflect: REFLECT?.id, safeguard: SAFEG?.id
});

/* ---------------------------------------------------------------- taunt */
t('TAUNT blocks the foe from using a status move', () => {
  const boostMove = anyStatusMove.id;
  const a = arena({
    userSpecies: 'zoro', targetSpecies: 'nami',
    userMoves: [TAUNT.id, NEUTRAL_ATK], targetMoves: [boostMove, NEUTRAL_ATK]
  });
  norm(a.user); norm(a.target);
  const e1 = turn(a.state, mv(TAUNT.id), mv(boostMove));
  const taunted = has(e1, 'volatileStart', (x) => x.id === 'taunt' && x.uid === a.target.uid);
  const blockedSameTurn = has(e1, 'cannotMove', (x) => x.uid === a.target.uid && x.reason === 'taunt');
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(boostMove));
  const stillBoosted = has(e2, 'boost', (x) => x.uid === a.target.uid && x.delta > 0);
  return { ok: taunted && blockedSameTurn && !stillBoosted, note: `applied=${taunted} blockedSameTurn=${blockedSameTurn} laterBoost=${stillBoosted}; next turn it fell back to "${e2.find((x) => x.t === 'moveUsed' && x.side === 1)?.moveName}"` };
});

t('TAUNT still allows attacking moves', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [TAUNT.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK, anyStatusMove.id] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(TAUNT.id), mv(NEUTRAL_ATK));
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  return { ok: has(e2, 'moveUsed', (x) => x.uid === a.target.uid), note: '' };
});

/* --------------------------------------------------------------- encore */
t('ENCORE locks the foe into its last move', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [ENCORE.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK, NEUTRAL_ATK2] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));      // target's last = NEUTRAL_ATK
  const e2 = turn(a.state, mv(ENCORE.id), mv(NEUTRAL_ATK2));
  const applied = has(e2, 'volatileStart', (x) => x.id === 'encore' && x.uid === a.target.uid);
  // target now tries a *different* move — it must be forced back
  const e3 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK2));
  const forced = has(e3, 'moveUsed', (x) => x.uid === a.target.uid && x.moveId === NEUTRAL_ATK) ||
                 has(e3, 'cannotMove', (x) => x.uid === a.target.uid && x.reason === 'encore');
  const escaped = has(e3, 'moveUsed', (x) => x.uid === a.target.uid && x.moveId === NEUTRAL_ATK2);
  return { ok: applied && forced && !escaped, note: `applied=${applied} forced=${forced} escaped=${escaped}` };
});

/* -------------------------------------------------------------- disable */
t('DISABLE seals the foe\'s last move', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [DISABLE.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK, NEUTRAL_ATK2] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  const e2 = turn(a.state, mv(DISABLE.id), mv(NEUTRAL_ATK2));
  const applied = has(e2, 'volatileStart', (x) => x.id === 'disable' && x.uid === a.target.uid);
  const e3 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  const blocked = has(e3, 'cannotMove', (x) => x.uid === a.target.uid && x.reason === 'disable') ||
                  !has(e3, 'moveUsed', (x) => x.uid === a.target.uid && x.moveId === NEUTRAL_ATK);
  return { ok: applied && blocked, note: `applied=${applied} blocked=${blocked}` };
});

/* -------------------------------------------------------------- torment */
if (TORMENT) t('TORMENT stops the foe repeating a move', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [TORMENT.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK, NEUTRAL_ATK2] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(TORMENT.id), mv(NEUTRAL_ATK));
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  const blocked = has(e2, 'cannotMove', (x) => x.uid === a.target.uid && x.reason === 'torment') ||
                  has(e2, 'moveUsed', (x) => x.uid === a.target.uid && x.moveId !== NEUTRAL_ATK);
  return { ok: blocked, note: `${texts(e2).slice(0, 3).join(' | ')}` };
});

/* ------------------------------------------------------------- imprison */
if (IMPRISON) t('IMPRISON seals moves the user also knows', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [IMPRISON.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK, NEUTRAL_ATK2] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(IMPRISON.id), mv(NEUTRAL_ATK2));
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  return { ok: has(e2, 'cannotMove', (x) => x.uid === a.target.uid && x.reason === 'imprison'), note: texts(e2).slice(0, 3).join(' | ') };
});

/* ------------------------------------------------------------- protect */
t('PROTECT blocks damage, and spamming it starts failing', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [PROTECT.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK], rig: null, seed: 99 });
  norm(a.user); norm(a.target);
  const e1 = turn(a.state, mv(PROTECT.id), mv(NEUTRAL_ATK));
  const blocked = has(e1, 'miss', (x) => x.reason === 'protect');
  let failures = 0;
  for (let i = 0; i < 8; i++) {
    const e = turn(a.state, mv(PROTECT.id), mv(NEUTRAL_ATK));
    if (!has(e, 'volatileStart', (x) => x.id === 'protect')) failures++;
  }
  return { ok: blocked && failures > 0, note: `firstBlocked=${blocked} consecutive-protect failures in 8 tries=${failures}` };
});

/* ---------------------------------------------------------- substitute */
t('SUBSTITUTE eats damage and blocks status', () => {
  const statusMove = MOVES.find((m) => m.category === 'status' && m.target === 'foe' && m.effects?.some((e) => e.kind === 'status'));
  const a = arena({ userSpecies: 'nami', targetSpecies: 'zoro', userMoves: [SUB.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK, statusMove.id] });
  norm(a.user); norm(a.target);
  const e1 = turn(a.state, mv(SUB.id), mv(NEUTRAL_ATK));
  const made = has(e1, 'substitute', (x) => x.phase === 'start');
  const absorbed = has(e1, 'substitute', (x) => x.phase === 'hit' || x.phase === 'break');
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(statusMove.id));
  const statusLanded = has(e2, 'statusApply', (x) => x.uid === a.user.uid);
  return { ok: made && absorbed && !statusLanded, note: `made=${made} absorbed=${absorbed} statusThroughSub=${statusLanded}` };
});

/* --------------------------------------------------------------- pivot */
t('PIVOT switches the user out after it hits', () => {
  if (!PIVOT) return { ok: false, note: 'no pivot-flagged move exists' };
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [PIVOT.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK] });
  norm(a.user); norm(a.target);
  const e = turn(a.state, mv(PIVOT.id), mv(NEUTRAL_ATK));
  const dealt = has(e, 'damage', (x) => x.uid === a.target.uid);
  const pivoted = has(e, 'pivot');
  const cameIn = has(e, 'switchIn', (x) => x.side === 0 && x.uid !== a.user.uid);
  return { ok: dealt && pivoted && cameIn, note: `${PIVOT.id}: damage=${dealt} pivotEvent=${pivoted} replacementIn=${cameIn}` };
});

/* ------------------------------------------------------------- pursuit */
t('PURSUIT intercepts a switching foe at double power', () => {
  if (!PURSUIT) return { ok: false, note: 'no pursuit-flagged move exists' };
  const base = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [PURSUIT.id], targetMoves: [NEUTRAL_ATK] });
  norm(base.user); norm(base.target);
  const staying = turn(base.state, mv(PURSUIT.id), mv(NEUTRAL_ATK));
  const dmgStay = pick(staying, 'damage', (x) => x.uid === base.target.uid)[0]?.amount ?? 0;

  const b = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [PURSUIT.id], targetMoves: [NEUTRAL_ATK] });
  norm(b.user); norm(b.target);
  const fleeing = turn(b.state, mv(PURSUIT.id), { kind: 'switch', toSlot: 1 });
  const dmgFlee = pick(fleeing, 'damage', (x) => x.uid === b.target.uid)[0]?.amount ?? 0;
  const flagged = fleeing.some((x) => x.t === 'moveUsed' && x.pursuit);
  return { ok: dmgFlee >= dmgStay * 1.8, note: `staying=${dmgStay} fleeing=${dmgFlee} (x${(dmgFlee / (dmgStay || 1)).toFixed(2)}) pursuitFlag=${flagged}` };
});

/* --------------------------------------------------------- leech seed */
t('LEECH SEED drains every turn into the seeder', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [LEECH.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK] });
  norm(a.user, 0.5); norm(a.target);
  turn(a.state, mv(LEECH.id), mv(NEUTRAL_ATK));
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  const drained = has(e2, 'damage', (x) => x.uid === a.target.uid && x.source !== 'move');
  const fed = has(e2, 'heal', (x) => x.uid === a.user.uid);
  return { ok: drained && fed, note: `drainTick=${drained} healedSeeder=${fed}` };
});

/* -------------------------------------------------------- perish song */
t('PERISH SONG counts down and KOs', () => {
  if (!PERISH) return { ok: false, note: 'no move in the library applies the perish volatile' };
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [PERISH.id, NEUTRAL_ATK], targetMoves: [FILLER] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(PERISH.id), mv(FILLER));
  let counts = [];
  for (let i = 0; i < 4 && !a.state.ended; i++) {
    const e = turn(a.state, mv(NEUTRAL_ATK), mv(FILLER));
    counts = counts.concat(pick(e, 'perish').map((x) => x.count));
    if (has(e, 'faint')) break;
  }
  return { ok: counts.length > 0 && counts.includes(0), note: `counts seen: ${counts.join(',')}` };
});

/* ------------------------------------------------------ destiny bond */
t('DESTINY BOND drags the killer down', () => {
  const a = arena({ userSpecies: 'nami', targetSpecies: 'zoro', userMoves: [DBOND.id], targetMoves: [NEUTRAL_ATK] });
  a.user.maxHp = 500; a.user.hp = 1; norm(a.target);
  a.user.stats.spe = 400; a.target.stats.spe = 20;
  const e = turn(a.state, mv(DBOND.id), mv(NEUTRAL_ATK));
  const both = pick(e, 'faint').length;
  return { ok: both === 2, note: `faints this turn: ${both} (${pick(e, 'faint').map((x) => x.uid).join(',')})` };
});

/* --------------------------------------------------------- trick room */
t('TRICK ROOM inverts the turn order', () => {
  const a = arena({ userSpecies: 'nami', targetSpecies: 'zoro', userMoves: [TRICK.id, NEUTRAL_ATK], targetMoves: [NEUTRAL_ATK] });
  norm(a.user); norm(a.target);
  a.user.stats.spe = 20; a.target.stats.spe = 400;   // user is SLOWER
  const e1 = turn(a.state, mv(TRICK.id), mv(NEUTRAL_ATK));
  const set = has(e1, 'trickRoom', (x) => x.turns > 0);
  const e2 = turn(a.state, mv(NEUTRAL_ATK), mv(NEUTRAL_ATK));
  const order = e2.filter((x) => x.t === 'moveUsed').map((x) => x.side);
  return { ok: set && order[0] === 0, note: `set=${set} moveOrder=${order.join('>')} (slow user should be first)` };
});

/* ------------------------------------------------------------ screens */
t('REFLECT roughly halves physical damage', () => {
  const mk = (withScreen) => {
    // rig 0.99 → max damage roll, no crit (crits punch through screens by design)
    const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [FILLER], targetMoves: [REFLECT.id, 'one_sword_slash'], rig: 0.99 });
    norm(a.user); norm(a.target);
    if (withScreen) turn(a.state, mv(FILLER), mv(REFLECT.id));
    const e = turn(a.state, mv(FILLER), mv('one_sword_slash'));
    return pick(e, 'damage', (x) => x.uid === a.target.uid && x.source === 'move')[0]?.amount ?? 0;
  };
  const open = mk(false), walled = mk(true);
  const ratio = walled / (open || 1);
  return { ok: ratio > 0.4 && ratio < 0.85, note: `no screen ${open} → reflect ${walled} (${(ratio * 100).toFixed(0)}%)` };
});

/* ---------------------------------------------------------- safeguard */
if (SAFEG) t('SAFEGUARD blocks incoming status', () => {
  const statusMove = MOVES.find((m) => m.category === 'status' && m.target === 'foe' && m.effects?.some((e) => e.kind === 'status'));
  const a = arena({ userSpecies: 'nami', targetSpecies: 'zoro', userMoves: [SAFEG.id, FILLER], targetMoves: [statusMove.id] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(SAFEG.id), mv(statusMove.id));
  const e2 = turn(a.state, mv(FILLER), mv(statusMove.id));
  return { ok: !has(e2, 'statusApply', (x) => x.uid === a.user.uid), note: texts(e2).slice(0, 3).join(' | ') };
});

/* -------------------------------------------------------------- status */
t('BURN halves physical damage and chips each turn', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [NEUTRAL_ATK], targetMoves: [FILLER] });
  norm(a.user); norm(a.target);
  const clean = pick(turn(a.state, mv(NEUTRAL_ATK), mv(FILLER)), 'damage', (x) => x.uid === a.target.uid && x.source === 'move')[0]?.amount ?? 0;
  a.user.status = 'brn';
  const e = turn(a.state, mv(NEUTRAL_ATK), mv(FILLER));
  const burned = pick(e, 'damage', (x) => x.uid === a.target.uid && x.source === 'move')[0]?.amount ?? 0;
  const chip = has(e, 'damage', (x) => x.uid === a.user.uid && x.source !== 'move');
  return { ok: burned < clean * 0.65 && chip, note: `clean ${clean} → burned ${burned}; residual chip=${chip}` };
});

t('PARALYSIS halves speed and sometimes locks the turn', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [FILLER], targetMoves: [FILLER], rig: null, seed: 7 });
  norm(a.user); norm(a.target);
  a.user.stats.spe = 200; a.target.stats.spe = 150; a.user.status = 'par';
  const e = turn(a.state, mv(FILLER), mv(FILLER));
  const order = e.filter((x) => x.t === 'moveUsed').map((x) => x.side);
  let locks = 0;
  for (let i = 0; i < 40 && !a.state.ended; i++) {
    const ev = turn(a.state, mv(FILLER), mv(FILLER));
    if (has(ev, 'cannotMove', (x) => x.uid === a.user.uid && x.reason === 'par')) locks++;
    a.user.hp = a.user.maxHp; a.target.hp = a.target.maxHp;
  }
  return { ok: order[0] === 1 && locks > 2, note: `paralysed user moved ${order[0] === 1 ? 'second' : 'FIRST'}; full-para ${locks}/40` };
});

t('TOXIC ramps: each tick hurts more than the last', () => {
  const toxMove = MOVES.find((m) => m.effects?.some((e) => e.kind === 'status' && e.value === 'tox'));
  if (!toxMove) return { ok: false, note: 'no tox move' };
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [toxMove.id, FILLER], targetMoves: [FILLER] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(toxMove.id), mv(FILLER));
  const ticks = [];
  for (let i = 0; i < 4 && !a.state.ended; i++) {
    const e = turn(a.state, mv(FILLER), mv(FILLER));
    const d = pick(e, 'damage', (x) => x.uid === a.target.uid && x.source !== 'move')[0];
    if (d) ticks.push(d.amount);
    a.target.hp = a.target.maxHp;
  }
  const rising = ticks.every((v, i) => i === 0 || v > ticks[i - 1]);
  return { ok: ticks.length >= 3 && rising, note: `ticks ${ticks.join(',')}` };
});

t('SLEEP lasts a random 1-3 turns and blocks the move', () => {
  const slpMove = MOVES.find((m) => m.effects?.some((e) => e.kind === 'status' && e.value === 'slp'));
  if (!slpMove) return { ok: false, note: 'no sleep move' };
  const lens = new Set();
  for (let s = 0; s < 12; s++) {
    const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [slpMove.id, FILLER], targetMoves: [FILLER], rig: null, seed: 1000 + s * 37 });
    norm(a.user); norm(a.target);
    let e = turn(a.state, mv(slpMove.id), mv(FILLER));
    if (!has(e, 'statusApply', (x) => x.status === 'slp')) continue;
    let asleep = 0;
    for (let i = 0; i < 6 && !a.state.ended; i++) {
      a.target.hp = a.target.maxHp;
      e = turn(a.state, mv(FILLER), mv(FILLER));
      if (has(e, 'cannotMove', (x) => x.uid === a.target.uid && x.reason === 'slp')) asleep++;
      if (has(e, 'statusCure', (x) => x.uid === a.target.uid)) break;
    }
    lens.add(asleep);
  }
  return { ok: lens.size > 1, note: `observed sleep lengths: ${[...lens].sort().join(',')}` };
});

/* ---------------------------------------------------------- hazards */
t('HAZARDS damage whatever switches in', () => {
  const hz = MOVES.find((m) => m.effects?.some((e) => e.kind === 'hazard'));
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [hz.id, FILLER], targetMoves: [FILLER] });
  norm(a.user); norm(a.target);
  turn(a.state, mv(hz.id), mv(FILLER));
  const e = turn(a.state, mv(FILLER), { kind: 'switch', toSlot: 1 });
  const trig = has(e, 'hazard', (x) => x.phase === 'trigger') || has(e, 'damage', (x) => x.side === 1 && x.source !== 'move');
  return { ok: trig, note: `${hz.id}: entry damage=${trig}` };
});

/* --------------------------------------------------------- weather */
t('WEATHER boosts its type and chips the rest', () => {
  const w = MOVES.find((m) => m.effects?.some((e) => e.kind === 'weather' && (e.value === 'sun' || e.value === 'rain' || e.value === 'sand' || e.value === 'hail')));
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [w.id, FILLER], targetMoves: [FILLER] });
  norm(a.user); norm(a.target);
  const e1 = turn(a.state, mv(w.id), mv(FILLER));
  const started = has(e1, 'weather', (x) => x.phase === 'start');
  const e2 = turn(a.state, mv(FILLER), mv(FILLER));
  const upkeep = has(e2, 'weather', (x) => x.phase === 'upkeep');
  let ended = false;
  for (let i = 0; i < 8 && !a.state.ended; i++) {
    a.user.hp = a.user.maxHp; a.target.hp = a.target.maxHp;
    if (has(turn(a.state, mv(FILLER), mv(FILLER)), 'weather', (x) => x.phase === 'end')) { ended = true; break; }
  }
  return { ok: started && upkeep && ended, note: `${w.id} start=${started} upkeep=${upkeep} expires=${ended}` };
});

/* --------------------------------------------------------- priority */
t('PRIORITY beats speed', () => {
  const p = MOVES.find((m) => m.priority > 0 && m.power > 0);
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [p.id], targetMoves: ['one_sword_slash'] });
  norm(a.user); norm(a.target);
  a.user.stats.spe = 20; a.target.stats.spe = 400;   // user much slower
  const e = turn(a.state, mv(p.id), mv('one_sword_slash'));
  const order = e.filter((x) => x.t === 'moveUsed').map((x) => x.side);
  return { ok: order[0] === 0, note: `${p.id} (prio ${p.priority}) order=${order.join('>')}` };
});

/* -------------------------------------------------- crit vs. boosts */
t('CRITS ignore the defender\'s boosts and screens', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [FILLER], targetMoves: [FILLER], rig: 0.99 });
  norm(a.user); norm(a.target);
  a.target.boosts.def = 6;
  a.user.critStageBonus = 4;   // guaranteed crit
  const crit = pick(turn(a.state, mv(FILLER), mv(FILLER)), 'damage', (x) => x.uid === a.target.uid && x.source === 'move')[0];
  const b = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [FILLER], targetMoves: [FILLER], rig: 0.99 });
  norm(b.user); norm(b.target); b.target.boosts.def = 6;
  const plain = pick(turn(b.state, mv(FILLER), mv(FILLER)), 'damage', (x) => x.uid === b.target.uid && x.source === 'move')[0];
  return { ok: crit?.crit === true && crit.amount > plain.amount * 2, note: `+6 def: normal ${plain?.amount} vs crit ${crit?.amount}` };
});

/* --------------------------------------------------- switch mechanics */
t('SWITCHING costs the turn and clears volatiles', () => {
  const a = arena({ userSpecies: 'zoro', targetSpecies: 'nami', userMoves: [FILLER], targetMoves: [FILLER] });
  norm(a.user); norm(a.target);
  a.user.volatiles.confusion = { turns: 4, data: {} };
  const e = turn(a.state, { kind: 'switch', toSlot: 1 }, mv(FILLER));
  const out = has(e, 'switchOut', (x) => x.side === 0);
  const inn = has(e, 'switchIn', (x) => x.side === 0);
  const order = e.findIndex((x) => x.t === 'switchIn' && x.side === 0) < e.findIndex((x) => x.t === 'moveUsed' && x.side === 1);
  const cleared = !a.user.volatiles.confusion;
  return { ok: out && inn && order && cleared, note: `out=${out} in=${inn} switchBeforeFoeMove=${order} volatilesCleared=${cleared}` };
});

/* ------------------------------------------------------------ report */
console.log('\n════ TACTICAL PRIMITIVES ════\n');
let bad = 0;
for (const r of out) {
  if (!r.ok) bad++;
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
  if (r.note) console.log(`          ${r.note}`);
}
console.log(`\n${out.length - bad}/${out.length} primitives behave as advertised.`);
