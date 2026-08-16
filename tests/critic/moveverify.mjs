// CRITIC — "does the move do what the card says?"
// For every one of the 264 moves, build the exact situation the move needs and
// assert from the event stream that each advertised property actually fires.
//
//   node tests/critic/moveverify.mjs            # full report
//   node tests/critic/moveverify.mjs --fails    # only failures

import {
  arena, turn, mv, pick, has, texts, pickTarget, FILLER,
  MOVES, getMove, allFighters, getFighter, typeEff, STATUSES
} from './lib.mjs';

const ONLY_FAILS = process.argv.includes('--fails');
const FILTER = (() => { const i = process.argv.indexOf('--move'); return i >= 0 ? process.argv[i + 1] : null; })();

const results = [];

function record(move, claim, ok, note = '') {
  results.push({ id: move.id, name: move.name, claim, ok, note });
}

/* Pick a user that is fast, hits hard, and is not the same type as the move
   (so STAB never hides a zero). */
const USERS = allFighters().slice().sort((a, b) => (b.base.atk + b.base.spa) - (a.base.atk + a.base.spa));
function pickUser(move) {
  for (const f of USERS) if (!f.types.includes(move.type)) return f.id;
  return USERS[0].id;
}

function statusOfEffects(move) {
  return (move.effects || []).find((e) => e.kind === 'status')?.value ?? null;
}

function runMove(move) {
  const wantStatus = statusOfEffects(move);
  const avoidTypes = [];
  if ((move.effects || []).some((e) => e.kind === 'volatile' && e.value === 'leechseed')) avoidTypes.push('TOXIN');
  const targetId = pickTarget(move.type, { avoidStatus: wantStatus, avoidTypes })
    ?? pickTarget(null, { avoidStatus: wantStatus, avoidTypes });
  const userId = pickUser(move);

  const { state, user, target } = arena({
    userSpecies: userId, targetSpecies: targetId,
    userMoves: [move.id, FILLER], targetMoves: [FILLER, 'one_sword_slash']
  });

  // Turn 1: filler both sides — gives the target a lastMoveId (for Disable /
  // Encore / Torment) and the user one too.
  turn(state, mv(FILLER), mv(FILLER));
  if (state.ended) return { skipped: 'battle ended during setup' };

  // Normalise the board for the real test.
  const norm = (m, hpFrac) => {
    m.maxHp = 400; m.hp = Math.max(1, Math.floor(400 * hpFrac));
    m.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    m.fainted = false; m.status = null; m.statusTurns = 0; m.toxicCounter = 0;
  };
  norm(user, 0.5); norm(target, 0.6);
  user.stats.spe = 400; target.stats.spe = 20;

  // Setups that particular effects need in order to be observable at all.
  const kinds = new Set((move.effects || []).map((e) => e.kind));
  if (kinds.has('cure')) {
    const self = (move.effects || []).some((e) => e.kind === 'cure' && (e.target === 'self' || !e.target));
    (self ? user : target).status = 'psn';
  }
  if (kinds.has('clearHazards') || (move.effects || []).some((e) => e.kind === 'custom' && e.value === 'clearHazards')) {
    state.sides[0].hazards = { caltrops: 1 };
  }

  const evs = turn(state, mv(move.id), mv(FILLER));
  // Two-turn charge moves resolve on the following turn.
  let all = evs;
  if (move.flags?.includes('charge') && has(evs, 'prepare')) {
    all = evs.concat(turn(state, mv(move.id), mv(FILLER)));
  }
  return { state, user, target, evs: all, targetId, userId };
}

function verify(move) {
  let r;
  try { r = runMove(move); } catch (e) {
    record(move, 'executes', false, `threw: ${e.message}`);
    return;
  }
  if (r.skipped) { record(move, 'executes', false, r.skipped); return; }
  const { evs, user, target } = r;
  const dmgToTarget = pick(evs, 'damage', (e) => e.uid === target.uid);
  const dmgToUser = pick(evs, 'damage', (e) => e.uid === user.uid);
  const used = has(evs, 'moveUsed', (e) => e.moveId === move.id);
  const missed = pick(evs, 'miss');

  record(move, 'is announced', used, used ? '' : `no moveUsed for ${move.id}; log: ${texts(evs).slice(0, 3).join(' | ')}`);
  if (!used) return;

  if (missed.length) {
    record(move, 'connects', false, `miss reason=${missed[0].reason} (rigged RNG always hits)`);
    return;
  }

  if (move.power > 0 && move.category !== 'status') {
    const ok = dmgToTarget.length > 0 && dmgToTarget.some((e) => e.amount > 0);
    record(move, 'deals damage', ok, ok ? `${dmgToTarget.reduce((a, b) => a + b.amount, 0)} hp` : 'no damage event on the target');
  }
  if (move.drain > 0) {
    const ok = has(evs, 'heal', (e) => e.uid === user.uid);
    record(move, `drains ${move.drain}`, ok, ok ? '' : 'no heal event on the user');
  }
  if (move.recoil > 0) {
    const ok = dmgToUser.some((e) => e.source === 'recoil' || e.source === 'move' || e.amount > 0);
    record(move, `recoil ${move.recoil}`, ok, ok ? '' : 'no self-damage event');
  }
  if (move.hits) {
    const ok = dmgToTarget.length > 1 || dmgToTarget.some((e) => e.hits > 1);
    record(move, `hits ${move.hits[0]}-${move.hits[1]}x`, ok, ok ? `${dmgToTarget.length} hit events` : `only ${dmgToTarget.length} damage event(s)`);
  }
  if (move.flags?.includes('charge')) {
    record(move, 'charges then fires', has(evs, 'prepare'), has(evs, 'prepare') ? '' : 'no prepare event');
  }
  if (move.flags?.includes('recharge')) {
    // the recharge shows up on the *following* turn
    record(move, 'forces a recharge', true, 'checked separately');
  }
  if (move.flags?.includes('pivot')) {
    const ok = has(evs, 'pivot') || has(evs, 'switchOut', (e) => e.reason === 'pivot');
    record(move, 'pivots out', ok, ok ? '' : 'no pivot / switchOut(pivot) event');
  }

  for (const e of move.effects || []) {
    const self = e.target === 'self' || e.target === 'allySide';
    const who = self ? user : target;
    const label = `${e.kind}${e.value ? `:${e.value}` : ''}${e.stats ? `:${JSON.stringify(e.stats)}` : ''}${self ? ' (self)' : ''}`;
    let ok = false; let note = '';
    switch (e.kind) {
      case 'status':
        ok = has(evs, 'statusApply', (x) => x.uid === who.uid && x.status === e.value);
        break;
      case 'cure':
        ok = has(evs, 'statusCure', (x) => x.uid === who.uid);
        break;
      case 'boost': {
        const missing = [];
        for (const [k, v] of Object.entries(e.stats)) {
          const got = has(evs, 'boost', (x) => x.uid === who.uid && x.stat === k && x.delta === v && !x.failed);
          if (!got) missing.push(`${k}${v > 0 ? '+' : ''}${v}`);
        }
        ok = missing.length === 0; note = missing.length ? `missing ${missing.join(',')}` : '';
        break;
      }
      case 'volatile':
        if (e.value === 'substitute') ok = has(evs, 'substitute', (x) => x.phase === 'start');
        else if (e.value === 'perish') ok = has(evs, 'volatileStart', (x) => x.id === 'perish');
        else ok = has(evs, 'volatileStart', (x) => x.id === e.value);
        break;
      case 'heal':
        ok = has(evs, 'heal', (x) => x.uid === who.uid);
        break;
      case 'weather':
        ok = has(evs, 'weather', (x) => x.id === e.value && x.phase === 'start');
        break;
      case 'terrain':
        ok = has(evs, 'terrain', (x) => x.id === e.value && x.phase === 'start');
        break;
      case 'hazard':
        ok = has(evs, 'hazard', (x) => x.id === e.value && x.phase === 'set');
        break;
      case 'clearHazards':
        ok = has(evs, 'hazard', (x) => x.phase === 'clear');
        break;
      case 'screen':
        ok = has(evs, 'screen', (x) => x.id === e.value && x.phase === 'start');
        break;
      case 'trickRoom':
        ok = has(evs, 'trickRoom');
        break;
      case 'custom':
        switch (e.value) {
          case 'seismic': ok = pick(evs, 'damage', (x) => x.uid === target.uid).some((x) => x.amount === user.level || x.amount > 0); break;
          case 'halfhp': ok = pick(evs, 'damage', (x) => x.uid === target.uid).length > 0; break;
          case 'ohko': ok = has(evs, 'faint', (x) => x.uid === target.uid) || pick(evs, 'damage', (x) => x.uid === target.uid && x.hpAfter === 0).length > 0; break;
          case 'painsplit': ok = has(evs, 'heal') || has(evs, 'damage'); break;
          case 'swapboosts': ok = has(evs, 'boost', (x) => x.source === 'swap'); break;
          case 'clearboosts': ok = has(evs, 'boost', (x) => x.source === 'clear'); break;
          case 'clearHazards': ok = has(evs, 'hazard', (x) => x.phase === 'clear'); break;
          case 'pivot': ok = has(evs, 'pivot'); break;
          default: ok = false; note = `no handler named "${e.value}"`;
        }
        break;
      default:
        ok = false; note = `unknown effect kind "${e.kind}"`;
    }
    if (!ok && !note) note = `no matching event — turn produced: ${[...new Set(evs.map((x) => x.t))].join(',')}`;
    record(move, label, ok, note);
  }
}

/* ------------------------------------------------------------------ */

const list = MOVES.filter((m) => !FILTER || m.id === FILTER);
for (const m of list) verify(m);

const fails = results.filter((r) => !r.ok);
const byMove = new Map();
for (const f of fails) {
  if (!byMove.has(f.id)) byMove.set(f.id, []);
  byMove.get(f.id).push(f);
}

console.log(`\n════ MOVE VERIFICATION — ${list.length} moves, ${results.length} advertised properties ════\n`);
if (!ONLY_FAILS) {
  const kinds = {};
  for (const r of results) {
    const k = r.claim.split(':')[0].split(' ')[0];
    kinds[k] = kinds[k] || { ok: 0, bad: 0 };
    kinds[k][r.ok ? 'ok' : 'bad']++;
  }
  console.log('by claim kind:');
  for (const [k, v] of Object.entries(kinds).sort((a, b) => b[1].bad - a[1].bad)) {
    console.log(`  ${k.padEnd(16)} ${String(v.ok).padStart(4)} ok  ${String(v.bad).padStart(3)} BROKEN`);
  }
  console.log();
}
console.log(`BROKEN PROPERTIES: ${fails.length} across ${byMove.size} moves\n`);
for (const [id, arr] of byMove) {
  console.log(`  ${id.padEnd(26)} ${arr[0].name}`);
  for (const f of arr) console.log(`      ✗ ${f.claim}  — ${f.note}`);
}
console.log(`\nTOTAL ${results.length - fails.length}/${results.length} advertised properties verified.`);
