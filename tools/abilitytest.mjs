// Abilities & held/bag items: coverage + behavioural + fuzz verification.
//
//   node tools/abilitytest.mjs                 # everything
//   node tools/abilitytest.mjs --port 8313
//   node tools/abilitytest.mjs --fuzz 4000
//   node tools/abilitytest.mjs --only three_blades,sitrus_fruit
//   node tools/abilitytest.mjs --skip-fuzz
//
// Everything runs headless *inside the page* through window.__ARENA.sim, so it
// tests the same modules the game loads. Exits non-zero on any failure.

import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8313);
const BASE = `http://127.0.0.1:${PORT}`;
const FUZZ = args['skip-fuzz'] ? 0 : Number(args.fuzz || 3000);
const ONLY = typeof args.only === 'string' ? args.only.split(',').map((s) => s.trim()) : null;

/* ── 1. Which hook names does the engine actually invoke? ─────────────────── */

async function engineHookNames() {
  const engine = await readFile('src/core/engine.js', 'utf8');
  const ability = new Set();
  const item = new Set();
  for (const m of engine.matchAll(/runAbility\(\s*['"]([a-zA-Z]+)['"]/g)) ability.add(m[1]);
  for (const m of engine.matchAll(/runItemHook\(\s*['"]([a-zA-Z]+)['"]/g)) item.add(m[1]);
  // Abilities may also be consulted directly by the pure formula modules.
  const damage = await readFile('src/core/damage.js', 'utf8');
  const direct = [];
  for (const m of damage.matchAll(/ability\s*===\s*'([a-z_]+)'/g)) direct.push({ id: m[1], where: 'core/damage.js' });
  const engineDirect = [];
  for (const m of engine.matchAll(/\.item\s*===\s*'([a-z_]+)'/g)) engineDirect.push({ id: m[1], where: 'core/engine.js' });
  return { ability: [...ability], item: [...item], directAbilities: direct, directItems: engineDirect };
}

/* ── 2. server ───────────────────────────────────────────────────────────── */

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 10000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.on('error', rej);
  });
  return p;
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 3. The in-page suite                                                       */
/* ══════════════════════════════════════════════════════════════════════════ */

function inPage(hooks, only) {
  const A = window.__ARENA;
  const sim = A.sim;
  const D = A.data;
  const ABIL = D.abilities;
  const ITEMS = D.items;
  const MOVES = D.moves;
  const FIGHTERS = D.fighters;
  const HELD = ITEMS.filter((i) => i.kind === 'held');
  const BAG = ITEMS.filter((i) => i.kind === 'bag');
  const NEUTRAL = 'insomnia_watch';                 // control: only onStatusImmune, never fires here

  const out = { coverage: [], tests: [], fuzz: null, counts: {} };
  const fail = (list, name, why) => list.push({ name, pass: false, note: why });
  const ok = (list, name, note) => list.push({ name, pass: true, note: note || '' });

  /* ---- 3a. coverage ---- */

  const abilityIds = Object.keys(ABIL);
  const itemIds = ITEMS.map((i) => i.id);
  out.counts = { abilities: abilityIds.length, items: itemIds.length, held: HELD.length, bag: BAG.length };

  // every ability a fighter references exists
  {
    const missing = [];
    for (const f of FIGHTERS) for (const a of (f.abilities || [])) if (!ABIL[a]) missing.push(`${f.id}:${a}`);
    missing.length ? fail(out.coverage, 'roster ability ids resolve', missing.join(', '))
      : ok(out.coverage, 'roster ability ids resolve', `${FIGHTERS.length} fighters checked`);
  }
  // every item id referenced anywhere resolves
  {
    const ids = new Set(itemIds);
    const missing = [];
    for (const f of FIGHTERS) if (f.item && !ids.has(f.item)) missing.push(`${f.id}:${f.item}`);
    for (const k of Object.keys(sim.defaultBag())) if (!ids.has(k)) missing.push(`defaultBag:${k}`);
    for (const it of ITEMS) if (!it.id || !it.name || !it.desc) missing.push(`malformed:${it.id}`);
    missing.length ? fail(out.coverage, 'item ids resolve', missing.join(', '))
      : ok(out.coverage, 'item ids resolve', `${itemIds.length} items, default bag OK`);
  }
  // every ability is wired to a hook the engine really calls
  {
    const engineHooks = new Set(hooks.ability);
    const directIds = new Set(hooks.directAbilities.map((d) => d.id));
    const bad = [];
    for (const [id, a] of Object.entries(ABIL)) {
      const declared = Object.keys(a).filter((k) => typeof a[k] === 'function');
      const live = declared.filter((k) => engineHooks.has(k));
      const dead = declared.filter((k) => !engineHooks.has(k));
      if (dead.length) bad.push(`${id} declares dead hook(s) ${dead.join('/')}`);
      if (!live.length && !directIds.has(id)) bad.push(`${id} has no live hook`);
      if (!a.name || !a.desc) bad.push(`${id} missing name/desc`);
    }
    bad.length ? fail(out.coverage, 'every ability is wired to a live engine hook', bad.join(' | '))
      : ok(out.coverage, 'every ability is wired to a live engine hook',
        `engine hooks: ${[...engineHooks].join(', ')}${directIds.size ? ` (+${[...directIds].join(',')} via formula)` : ''}`);
  }
  // held items likewise
  {
    const live = new Set([...hooks.ability, ...hooks.item]);
    const directItems = new Set(hooks.directItems.map((d) => d.id));
    const bad = [];
    for (const it of HELD) {
      const declared = Object.keys(it.hooks || {});
      const dead = declared.filter((k) => !live.has(k));
      if (dead.length) bad.push(`${it.id} declares dead hook(s) ${dead.join('/')}`);
      if (!declared.length && !directItems.has(it.id)) bad.push(`${it.id} has no hooks at all`);
    }
    for (const it of BAG) if (typeof it.use !== 'function') bad.push(`${it.id} bag item has no use()`);
    bad.length ? fail(out.coverage, 'every held item is wired to a live hook', bad.join(' | '))
      : ok(out.coverage, 'every held item is wired to a live hook', `${HELD.length} held, ${BAG.length} bag`);
  }
  // purity: no Math.random reachable from the ability/item sources is checked in node (see below)

  /* ---- 3b. sim helpers ---- */

  const mvBy = (pred) => MOVES.find(pred);
  const need = (pred, what) => { const m = mvBy(pred); if (!m) throw new Error(`no move for ${what}`); return m.id; };
  const atk = (m) => m.category !== 'status' && m.power > 0;

  const M = {
    punch: need((m) => atk(m) && m.contact && m.flags?.includes('punch') && m.power <= 90, 'punch'),
    slice: need((m) => atk(m) && m.flags?.includes('slice') && m.power <= 90, 'slice'),
    sound: need((m) => atk(m) && m.flags?.includes('sound'), 'sound'),
    weak: need((m) => atk(m) && m.power <= 60 && !m.priority, 'weak'),
    heavy: need((m) => atk(m) && m.power >= 100 && m.power <= 130 && !m.flags?.includes('charge') && !m.flags?.includes('recharge'), 'heavy'),
    contact: need((m) => atk(m) && m.contact && m.power >= 60 && m.power <= 90, 'contact'),
    ranged: need((m) => atk(m) && !m.contact && m.power >= 60 && m.power <= 95, 'ranged'),
    selfBuff: need((m) => m.category === 'status' && m.accuracy == null && m.target === 'self', 'self status')
  };
  for (const t of ['FLAME', 'SEA', 'STORM', 'EARTH', 'SHADOW', 'MIND', 'FIST', 'SLASH', 'VOID', 'HAKI', 'FROST'])
    M[t] = need((m) => atk(m) && m.type === t && m.power >= 55 && m.power <= 110, `${t} attack`);
  M.SPECIAL = need((m) => m.category === 'special' && m.power >= 60 && m.power <= 100, 'special');
  M.PHYSICAL = need((m) => m.category === 'physical' && m.power >= 60 && m.power <= 100 && m.contact, 'physical');

  const F0 = FIGHTERS[0].id;
  const F1 = FIGHTERS[1].id;

  function mem(speciesId, o = {}) {
    const m = sim.makeDefaultMember(speciesId, 50);
    if (o.ability !== undefined) m.ability = o.ability;
    m.item = o.item ?? null;
    if (o.moves) m.moves = o.moves.slice(0, 4);
    return m;
  }
  function mkBattle(t0, t1, seed = 4242, bag) {
    return sim.createBattle({
      seed,
      sides: [
        { name: 'A', tag: 'P1', team: Array.isArray(t0) ? t0 : [t0], items: bag ? bag() : {} },
        { name: 'B', tag: 'P2', team: Array.isArray(t1) ? t1 : [t1], items: bag ? bag() : {} }
      ],
      arena: 'colosseum'
    });
  }
  const A0 = (b) => b.sides[0].party[b.sides[0].activeIndex];
  const A1 = (b) => b.sides[1].party[b.sides[1].activeIndex];
  const mv = (id) => ({ kind: 'move', moveId: id });
  const sw = (i) => ({ kind: 'switch', toSlot: i });

  /** Fire one move with no turn machinery. Returns the events it produced. */
  function shoot(b, side, moveId) {
    const at = b.events.length;
    sim.executeMove(b, side, moveId);
    return b.events.slice(at);
  }
  const dmgOn = (evs, uid) => evs.filter((e) => e.t === 'damage' && e.uid === uid).reduce((a, e) => a + e.amount, 0);
  const has = (evs, pred) => evs.some(pred);
  const texts = (evs) => evs.filter((e) => e.t === 'message').map((e) => e.text).join(' | ');

  /**
   * Run the same single move twice — once with `variant` applied, once with the
   * control — and compare damage. RNG consumption is identical, so any delta is
   * the ability/item and nothing else.
   */
  function compare(cfg) {
    const build = (variant) => {
      const a = mem(cfg.attacker || F0, { ability: variant.aAbility ?? NEUTRAL, item: variant.aItem ?? null, moves: cfg.aMoves });
      const d = mem(cfg.defender || F1, { ability: variant.dAbility ?? NEUTRAL, item: variant.dItem ?? null, moves: cfg.dMoves });
      const b = mkBattle(a, d, cfg.seed ?? 909);
      A0(b).boosts.acc = 6;                     // never miss, both runs alike
      cfg.before?.(b);
      const evs = shoot(b, 0, cfg.move);
      return { b, evs, dmg: dmgOn(evs, A1(b).uid) };
    };
    const test = build(cfg.variant);
    const ctrl = build(cfg.control || {});
    return { test, ctrl, ratio: ctrl.dmg > 0 ? test.dmg / ctrl.dmg : (test.dmg > 0 ? Infinity : 1) };
  }
  const near = (got, want, tol = 0.09) => Math.abs(got - want) <= tol;

  /* ---- 3c. the tests ---- */

  const T = [];
  const test = (kind, name, fn) => T.push({ kind, name, fn });

  /* -- attacker-side damage multipliers -- */
  const dmgMul = (id, cfg, want) => test('ability', id, () => {
    const r = compare({ ...cfg, variant: { aAbility: id } });
    if (r.ctrl.dmg <= 0) return [false, `control did no damage (${texts(r.ctrl.evs)})`];
    return [near(r.ratio, want, 0.1), `x${r.ratio.toFixed(2)} (want ~${want}) ${r.test.dmg}/${r.ctrl.dmg}`];
  });

  dmgMul('three_blades', { move: M.slice }, 1.3);
  dmgMul('iron_fist', { move: M.punch }, 1.3);
  dmgMul('amplifier', { move: M.sound }, 1.4);
  dmgMul('technician', { move: M.weak }, 1.5);
  dmgMul('overwhelm', { move: M.heavy }, 1.2);
  dmgMul('opportunist', { move: M.ranged, before: (b) => { A1(b).status = 'psn'; } }, 1.3);
  dmgMul('finisher', { move: M.ranged, before: (b) => { A1(b).hp = Math.floor(A1(b).maxHp * 0.4); } }, 1.3);
  dmgMul('berserker', { move: M.ranged, before: (b) => { A0(b).hp = Math.floor(A0(b).maxHp * 0.25); } }, 1.5);
  dmgMul('guts_haki', { move: M.ranged, before: (b) => { A0(b).status = 'psn'; } }, 1.5);
  dmgMul('blue_flame', { move: M.FLAME }, 1.2);
  dmgMul('slow_haki', { move: M.ranged }, 1.3);
  dmgMul('weather_read', { move: M.ranged, before: (b) => { b.field.weather = { id: 'sandstorm', turns: 5 }; } }, 1.3);
  dmgMul('chivalry', { move: M.ranged, before: (b) => { A1(b).hp = Math.floor(A1(b).maxHp * 0.2); } }, 0.6);
  dmgMul('late_bloomer', { move: M.ranged, before: (b) => { A0(b).turnsActive = 3; } }, 1.3);

  test('ability', 'adaptability', () => {
    // needs a STAB move for the attacker: 1.5x -> 2x
    const f = FIGHTERS.find((x) => MOVES.some((m) => m.type === x.types[0] && m.power >= 55 && m.category !== 'status'));
    const move = MOVES.find((m) => m.type === f.types[0] && m.power >= 55 && m.category !== 'status').id;
    const r = compare({ attacker: f.id, move, variant: { aAbility: 'adaptability' } });
    if (r.ctrl.dmg <= 0) return [false, 'control did no damage'];
    return [near(r.ratio, 2 / 1.5, 0.1), `x${r.ratio.toFixed(2)} (want ~1.33) via core/damage.js STAB`];
  });

  test('ability', 'operating_room', () => {
    const before = (b) => { A1(b).boosts.spd = 2; A1(b).boosts.def = 2; };
    const r = compare({ move: M.MIND, before, variant: { aAbility: 'operating_room' } });
    // with +2 defences the control is at 1/2 damage; ignoring them should ~double it
    if (r.ctrl.dmg <= 0) return [false, 'control did no damage'];
    return [r.ratio > 1.7 && r.ratio < 2.3, `x${r.ratio.toFixed(2)} through +2 defences (want ~2.0)`];
  });

  /* -- defender-side damage modifiers -- */
  const takenMul = (id, cfg, want) => test(cfg.kind || 'ability', id, () => {
    const key = cfg.kind === 'item' ? 'dItem' : 'dAbility';
    const r = compare({ ...cfg, variant: { [key]: id } });
    if (r.ctrl.dmg <= 0) return [false, `control did no damage (${texts(r.ctrl.evs)})`];
    return [near(r.ratio, want, 0.1), `x${r.ratio.toFixed(2)} taken (want ~${want}) ${r.test.dmg}/${r.ctrl.dmg}`];
  });

  takenMul('gum_body', { move: M.STORM }, 0.5);
  takenMul('mochi_body', { move: M.FIST }, 0.5);
  takenMul('logia_flame', { move: M.contact }, 0.5);
  takenMul('sand_body', { move: M.contact, before: (b) => { b.field.weather = { id: 'sandstorm', turns: 5 }; } }, 0.5);
  takenMul('solar_skin', { move: M.SPECIAL, before: (b) => { b.field.weather = { id: 'sun', turns: 5 }; } }, 0.8);
  takenMul('blizzard_veil', { move: M.PHYSICAL, before: (b) => { b.field.weather = { id: 'hail', turns: 5 }; } }, 0.7);

  test('ability', 'windborne', () => {
    const r = compare({ move: M.EARTH, variant: { dAbility: 'windborne' } });
    return [r.test.dmg === 1 && r.ctrl.dmg > 1, `${r.test.dmg} dmg vs control ${r.ctrl.dmg}`];
  });

  const absorb = (id, type, checkEv, label) => test('ability', id, () => {
    const r = compare({ move: M[type], variant: { dAbility: id } });
    const good = r.test.dmg === 1 && r.ctrl.dmg > 1 && has(r.test.evs, checkEv);
    return [good, `${r.test.dmg} dmg (control ${r.ctrl.dmg}); ${label} ${has(r.test.evs, checkEv) ? 'fired' : 'MISSING'}`];
  });
  absorb('flash_absorb', 'STORM', (e) => e.t === 'heal' && e.source === 'ability', 'heal');
  absorb('sea_legs', 'SEA', (e) => e.t === 'heal' && e.source === 'ability', 'heal');
  absorb('flame_drinker', 'FLAME', (e) => e.t === 'boost' && e.stat === 'spa' && e.delta > 0, 'Sp.Atk boost');

  test('ability', 'future_sight', () => {
    const r = compare({ move: M.ranged, variant: { dAbility: 'future_sight' } });
    return [near(r.ratio, 0.25, 0.1) && has(r.test.evs, (e) => e.t === 'volatileEnd' && e.id === 'future_dodge'),
      `first hit x${r.ratio.toFixed(2)}, dodge consumed`];
  });
  test('ability', 'future_sight (only once)', () => {
    const d = mem(F1, { ability: 'future_sight' });
    const b = mkBattle(mem(F0, { ability: NEUTRAL }), d, 11);
    A0(b).boosts.acc = 6;
    const e1 = shoot(b, 0, M.ranged); const d1 = dmgOn(e1, A1(b).uid);
    const e2 = shoot(b, 0, M.ranged); const d2 = dmgOn(e2, A1(b).uid);
    return [d2 > d1 * 2, `hit1 ${d1} -> hit2 ${d2} (dodge did not repeat)`];
  });

  /* -- survival -- */
  test('ability', 'unbreakable', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL }), mem(F1, { ability: 'unbreakable' }), 5);
    A0(b).boosts.acc = 6;
    const t = A1(b); t.hp = t.maxHp;
    const evs = shoot(b, 0, M.heavy);
    // force lethality by shrinking maxHp-equivalent: use repeated hits at full HP instead
    let n = 0; while (t.hp > 1 && n < 20) { t.hp = t.maxHp; shoot(b, 0, M.heavy); n++; }
    return [t.hp === 1 && n < 20, `survived at ${t.hp} HP from full (${n + 1} lethal attempts)`, evs];
  });
  test('ability', 'last_stand', () => {
    let survived = 0, tried = 0;
    for (let s = 0; s < 60 && survived < 1; s++) {
      const b = mkBattle(mem(F0, { ability: NEUTRAL }), mem(F1, { ability: 'last_stand' }), 100 + s);
      A0(b).boosts.acc = 6;
      const t = A1(b); t.hp = 12; tried++;
      shoot(b, 0, M.heavy);
      if (t.hp === 1) survived++;
    }
    return [survived > 0, `survived ${survived}/${tried} lethal blows (25% ability)`];
  });
  test('ability', 'revenant', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, moves: [M.heavy] }), [mem(F1, { ability: 'revenant', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL })], 7);
    A0(b).boosts.acc = 6;
    const t = A1(b); t.hp = 10;
    sim.submitChoices(b, [mv(M.heavy), mv(M.selfBuff)]);
    const healed = t.hp > 1;
    // second lethal blow must NOT be survived
    t.hp = 10;
    shoot(b, 0, M.heavy);
    return [healed && t.fainted, `survived + healed to ${b.sides[1].party[0].hp}, second KO went through`];
  });
  test('ability', 'stamina_wall', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL }), mem(F1, { ability: 'stamina_wall' }), 21);
    A0(b).boosts.acc = 6;
    shoot(b, 0, M.ranged);
    return [A1(b).boosts.def >= 1, `Def stage ${A1(b).boosts.def} after one hit`];
  });
  test('ability', 'justified', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL }), mem(F1, { ability: 'justified' }), 22);
    A0(b).boosts.acc = 6;
    shoot(b, 0, M.SHADOW);
    const shadow = A1(b).boosts.atk;
    const b2 = mkBattle(mem(F0, { ability: NEUTRAL }), mem(F1, { ability: 'justified' }), 22);
    A0(b2).boosts.acc = 6;
    shoot(b2, 0, M.FIST);
    return [shadow >= 1 && A1(b2).boosts.atk === 0, `SHADOW hit -> Atk ${shadow}; FIST hit -> Atk ${A1(b2).boosts.atk}`];
  });
  test('ability', 'pressure_haki', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, moves: [M.ranged] }), mem(F1, { ability: 'pressure_haki' }), 23);
    A0(b).boosts.acc = 6;
    const slot = A0(b).moves[0]; const before = slot.pp;
    shoot(b, 0, M.ranged);
    return [before - slot.pp === 2, `PP ${before} -> ${slot.pp} (1 normal + 1 pressure)`];
  });

  /* -- contact punishers -- */
  const contactTest = (id, kind, check, label) => test(kind, id, () => {
    const a = mem(F0, { ability: NEUTRAL, moves: [M.contact] });
    const d = kind === 'item' ? mem(F1, { ability: NEUTRAL, item: id }) : mem(F1, { ability: id });
    const b = mkBattle(a, d, 31);
    A0(b).boosts.acc = 6;
    const evs = shoot(b, 0, M.contact);
    return [check(b, evs), label(b, evs)];
  });
  contactTest('thousand_arms', 'ability', (b) => A0(b).boosts.def === -1, (b) => `attacker Def ${A0(b).boosts.def}`);
  contactTest('mirror_scale', 'ability', (b) => A0(b).boosts.spe === -1, (b) => `attacker Spe ${A0(b).boosts.spe}`);
  contactTest('iron_hide', 'ability', (b) => A0(b).hp < A0(b).maxHp, (b) => `attacker at ${A0(b).hp}/${A0(b).maxHp}`);
  contactTest('cursed_grip', 'ability', (b) => A0(b).moves[0].pp === A0(b).moves[0].maxPp - 3,
    (b) => `attacker PP ${A0(b).moves[0].pp}/${A0(b).moves[0].maxPp} (1 + 2 drained)`);
  contactTest('spiked_guard', 'item', (b) => A0(b).hp < A0(b).maxHp, (b) => `attacker at ${A0(b).hp}/${A0(b).maxHp}`);

  const contactChance = (id, statusWanted) => test('ability', id, () => {
    let hits = 0, tries = 0;
    for (let s = 0; s < 80 && hits < 1; s++) {
      const b = mkBattle(mem(F0, { ability: NEUTRAL, moves: [M.contact] }), mem(F1, { ability: id }), 300 + s);
      A0(b).boosts.acc = 6; A0(b).types = ['MECHA'];   // avoid type immunity to the status
      shoot(b, 0, M.contact); tries++;
      if (A0(b).status === statusWanted) hits++;
    }
    return [hits > 0, `inflicted ${statusWanted} in ${hits}/${tries} contacts`];
  });
  contactChance('static_field', 'par');
  contactChance('venom_spines', 'tox');

  test('ability', 'mirage_step', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, moves: [M.contact] }), mem(F1, { ability: 'mirage_step' }), 33);
    const eva = A1(b).boosts.eva;
    A0(b).boosts.acc = 6;
    shoot(b, 0, M.contact);
    return [eva === 1 && A0(b).boosts.acc === 5, `entry evasion +${eva}, attacker accuracy ${A0(b).boosts.acc} (was 6)`];
  });

  /* -- entry effects -- */
  const entry = (id, kind, check, label) => test(kind, id, () => {
    const holder = kind === 'item' ? mem(F0, { ability: NEUTRAL, item: id }) : mem(F0, { ability: id });
    const b = mkBattle(holder, mem(F1, { ability: NEUTRAL }), 41);
    return [check(b), label(b)];
  });
  entry('conquerors_will', 'ability', (b) => A1(b).boosts.atk === -1, (b) => `foe Atk ${A1(b).boosts.atk}`);
  entry('cold_read', 'ability', (b) => A0(b).critStageBonus === 1, (b) => `crit stage bonus ${A0(b).critStageBonus}`);
  entry('perfect_edge', 'ability', (b) => !!A0(b).volatiles.locked_on, () => 'locked_on volatile set — accuracyCheck short-circuits');
  entry('chivalry', 'ability', (b) => A0(b).boosts.spe === 1, (b) => `Speed ${A0(b).boosts.spe} on entry`);
  entry('mirage_step (entry)', 'ability', () => true, () => 'covered above');
  entry('caltrop_trail', 'ability', (b) => b.sides[1].hazards.caltrops === 1, (b) => `foe caltrops ${b.sides[1].hazards.caltrops}`);
  entry('sunburst', 'ability', (b) => b.field.weather.id === 'sun', (b) => `weather ${b.field.weather.id}`);
  entry('squall_caller', 'ability', (b) => b.field.weather.id === 'rain', (b) => `weather ${b.field.weather.id}`);
  entry('dust_devil', 'ability', (b) => b.field.weather.id === 'sandstorm', (b) => `weather ${b.field.weather.id}`);
  entry('frozen_wake', 'ability', (b) => b.field.weather.id === 'hail', (b) => `weather ${b.field.weather.id}`);
  entry('blade_ground', 'ability', (b) => b.field.terrain.id === 'blade', (b) => `terrain ${b.field.terrain.id}`);
  entry('download_read', 'ability', (b) => A0(b).boosts.atk + A0(b).boosts.spa === 1,
    (b) => `Atk+${A0(b).boosts.atk} / SpA+${A0(b).boosts.spa} against the foe's weaker defence`);
  entry('mimicry', 'ability', (b) => A0(b).ability === A1(b).ability && A0(b).ability !== 'mimicry',
    (b) => `copied "${A0(b).ability}" from the foe`);

  test('ability', 'clean_sweep', () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL }), mem(F0, { ability: 'clean_sweep' })], mem(F1, { ability: NEUTRAL }), 42);
    b.sides[0].hazards.caltrops = 2;
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    return [!b.sides[0].hazards.caltrops, `own hazards after entry: ${JSON.stringify(b.sides[0].hazards)}`];
  });
  test('ability', 'regenerator', () => {
    const b = mkBattle([mem(F0, { ability: 'regenerator' }), mem(F0, { ability: NEUTRAL })], mem(F1, { ability: NEUTRAL }), 43);
    const m0 = b.sides[0].party[0]; m0.hp = 20;
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    sim.submitChoices(b, [sw(0), mv(M.selfBuff)]);
    return [m0.hp > 20 + Math.floor(m0.maxHp / 3) - 2, `${20} -> ${m0.hp} HP on re-entry (+1/3 max)`];
  });
  test('ability', 'pure_heart', () => {
    const b = mkBattle([mem(F0, { ability: 'pure_heart' }), mem(F0, { ability: NEUTRAL })], mem(F1, { ability: NEUTRAL }), 44);
    const m0 = b.sides[0].party[0]; m0.status = 'psn';
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    sim.submitChoices(b, [sw(0), mv(M.selfBuff)]);
    return [m0.status === null, `status on re-entry: ${m0.status}`];
  });
  test('ability', 'trade_places', () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL }), mem(F0, { ability: 'trade_places' })], mem(F1, { ability: NEUTRAL }), 45);
    A1(b).boosts.atk = 3; b.sides[0].party[1].boosts.spa = 0;
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    return [A0(b).boosts.atk === 3 && A1(b).boosts.atk === 0, `stole the foe's +3 Atk (mine ${A0(b).boosts.atk}, theirs ${A1(b).boosts.atk})`];
  });

  /* -- speed & priority -- */
  function firstMover(b, c0, c1) {
    const at = b.events.length;
    sim.submitChoices(b, [c0, c1]);
    const first = b.events.slice(at).find((e) => e.t === 'moveUsed');
    return first ? first.side : null;
  }
  const speedTest = (id, kind, setup, label) => test(kind, id, () => {
    const holder = kind === 'item' ? { ability: NEUTRAL, item: id, moves: [M.selfBuff] } : { ability: id, moves: [M.selfBuff] };
    const b = mkBattle(mem(F0, holder), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 51);
    setup(b);
    const ctl = mkBattle(mem(F0, { ability: NEUTRAL, moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 51);
    setup(ctl);
    const a = firstMover(b, mv(M.selfBuff), mv(M.selfBuff));
    const c = firstMover(ctl, mv(M.selfBuff), mv(M.selfBuff));
    return [a === 0 && c === 1, `${label}: with=${a === 0 ? 'holder first' : 'foe first'}, without=${c === 1 ? 'foe first' : 'holder first'}`];
  });
  const slowSetup = (mult) => (b) => { A0(b).stats.spe = 100; A1(b).stats.spe = 100 * mult; };
  speedTest('swift_swim', 'ability', (b) => { slowSetup(1.5)(b); b.field.weather = { id: 'rain', turns: 5 }; }, 'Squall doubles Speed');
  speedTest('heat_haze', 'ability', (b) => { slowSetup(1.5)(b); b.field.weather = { id: 'sun', turns: 5 }; }, 'Sun doubles Speed');
  speedTest('unburden_ki', 'ability', (b) => { slowSetup(1.5)(b); A0(b).hp = Math.floor(A0(b).maxHp / 3); }, 'low HP doubles Speed');
  speedTest('weather_read (speed)', 'ability', (b) => { slowSetup(1.2)(b); b.field.weather = { id: 'sandstorm', turns: 5 }; }, 'weather +30% Speed');
  speedTest('log_pose_scarf', 'item', slowSetup(1.4), 'scarf +50% Speed');

  test('ability', 'quick_draw', () => {
    const b = mkBattle(mem(F0, { ability: 'quick_draw', moves: [M.weak] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 52);
    A0(b).stats.spe = 10; A1(b).stats.spe = 300;
    return [firstMover(b, mv(M.weak), mv(M.selfBuff)) === 0, 'a 60-power move outran a 30x faster foe'];
  });
  test('ability', 'prankster_wit', () => {
    const b = mkBattle(mem(F0, { ability: 'prankster_wit', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.ranged] }), 53);
    A0(b).stats.spe = 10; A1(b).stats.spe = 300;
    return [firstMover(b, mv(M.selfBuff), mv(M.ranged)) === 0, 'status move went first from 10 Speed'];
  });
  test('ability', 'slow_haki (priority)', () => {
    const b = mkBattle(mem(F0, { ability: 'slow_haki', moves: [M.ranged] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 54);
    A0(b).stats.spe = 300; A1(b).stats.spe = 10;
    return [firstMover(b, mv(M.ranged), mv(M.selfBuff)) === 1, 'always acts last despite 30x the Speed'];
  });
  test('ability', 'momentum', () => {
    const b = mkBattle(mem(F0, { ability: 'momentum', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 55);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [A0(b).boosts.spe === 1, `Speed stage ${A0(b).boosts.spe} after one turn`];
  });
  test('item', 'weighted_bands', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'weighted_bands', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 56);
    A0(b).stats.spe = 200; A1(b).stats.spe = 150;
    const slow = firstMover(b, mv(M.selfBuff), mv(M.selfBuff)) === 1;
    const r = compare({ move: M.ranged, variant: { aItem: 'weighted_bands' } });
    return [slow && near(r.ratio, 1.5, 0.1), `Speed halved (foe moved first) and damage x${r.ratio.toFixed(2)}`];
  });
  test('item', 'quick_charm', () => {
    let flips = 0;
    for (let s = 0; s < 70; s++) {
      const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'quick_charm', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 600 + s);
      A0(b).stats.spe = 50; A1(b).stats.spe = 250;
      if (firstMover(b, mv(M.selfBuff), mv(M.selfBuff)) === 0) flips++;
    }
    return [flips > 0 && flips < 70, `moved first in ${flips}/70 turns (20% item)`];
  });

  /* -- status immunity (drive engine.applyStatus directly) -- */
  const immune = (id, kind, blocked, allowed) => test(kind, id, () => {
    const holder = kind === 'item' ? mem(F1, { ability: NEUTRAL, item: id }) : mem(F1, { ability: id });
    const b = mkBattle(mem(F0, { ability: NEUTRAL }), holder, 61);
    const t = A1(b); t.types = ['MECHA'];                  // strip type immunities so only the ability/item can block
    const results = {};
    for (const s of blocked) { t.status = null; results[s] = sim.applyStatus(b, t, s); }
    let allowedOk = true;
    if (allowed) { t.status = null; allowedOk = sim.applyStatus(b, t, allowed) === true; }
    t.status = null;
    const allBlocked = blocked.every((s) => results[s] === false);
    return [allBlocked && allowedOk, `blocked ${blocked.join('/')}${allowed ? `, still takes ${allowed}` : ''}`];
  });
  immune('gum_body', 'ability', ['par'], 'brn');
  immune('blue_flame', 'ability', ['brn'], 'par');
  immune('flame_drinker', 'ability', ['brn'], 'par');
  immune('immunity_gut', 'ability', ['psn', 'tox'], 'par');
  immune('insomnia_watch', 'ability', ['slp'], 'par');
  immune('thick_hide', 'ability', ['brn', 'frz'], 'par');
  immune('sea_stone_band', 'item', ['par', 'brn', 'psn', 'slp', 'frz', 'tox'], null);

  /* -- residual abilities -- */
  const residual = (id, kind, setup, check, label) => test(kind, id, () => {
    const holder = kind === 'item'
      ? mem(F0, { ability: NEUTRAL, item: id, moves: [M.selfBuff] })
      : mem(F0, { ability: id, moves: [M.selfBuff] });
    const b = mkBattle([holder, mem(F0, { ability: NEUTRAL })], [mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL })], 71);
    setup?.(b);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [check(b), label(b)];
  });
  residual('ocean_heart', 'ability', (b) => { b.field.weather = { id: 'rain', turns: 5 }; A0(b).hp = 30; },
    (b) => A0(b).hp > 30, (b) => `30 -> ${A0(b).hp} HP in a Squall`);
  residual('solar_skin (heal)', 'ability', (b) => { b.sides[0].party[0].ability = 'solar_skin'; b.field.weather = { id: 'sun', turns: 5 }; A0(b).hp = 30; },
    (b) => A0(b).hp > 30, (b) => `30 -> ${A0(b).hp} HP in Sun`);
  residual('sand_body (heal)', 'ability', (b) => { b.sides[0].party[0].ability = 'sand_body'; A0(b).types = ['EARTH']; b.field.weather = { id: 'sandstorm', turns: 5 }; A0(b).hp = 30; },
    (b) => A0(b).hp > 30, (b) => `30 -> ${A0(b).hp} HP in a Sandstorm`);
  residual('desiccate', 'ability', (b) => { b.field.weather = { id: 'sandstorm', turns: 5 }; A0(b).types = ['EARTH']; A1(b).types = ['EARTH']; A0(b).hp = 40; },
    (b) => A1(b).hp < A1(b).maxHp && A0(b).hp > 40, (b) => `foe ${A1(b).hp}/${A1(b).maxHp}, self healed to ${A0(b).hp}`);
  residual('undying', 'ability', (b) => { A0(b).hp = Math.floor(A0(b).maxHp * 0.4); },
    (b) => A0(b).hp > Math.floor(A0(b).maxHp * 0.4), (b) => `recovered to ${A0(b).hp}/${A0(b).maxHp}`);
  residual('rage_scale', 'ability', (b) => { A0(b).hp = Math.floor(A0(b).maxHp * 0.4); },
    (b) => A0(b).boosts.spa === 2, (b) => `Sp.Atk stage ${A0(b).boosts.spa} below half HP`);
  residual('bad_dreams', 'ability', (b) => { A1(b).status = 'slp'; A1(b).statusTurns = 5; },
    (b) => A1(b).hp < A1(b).maxHp, (b) => `sleeping foe at ${A1(b).hp}/${A1(b).maxHp}`);
  residual('harvest_luck', 'ability', (b) => { A0(b).item = 'sitrus_fruit'; A0(b).itemUsed = true; },
    () => true, () => 'see harvest_luck (recovery) below');

  test('ability', 'harvest_luck (recovery)', () => {
    let recovered = 0;
    for (let s = 0; s < 40 && !recovered; s++) {
      const b = mkBattle(mem(F0, { ability: 'harvest_luck', item: 'sitrus_fruit', moves: [M.selfBuff] }),
        mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 700 + s);
      A0(b).itemUsed = true;
      sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
      if (!A0(b).itemUsed) recovered++;
    }
    return [recovered > 0, `spent item came back within 40 seeded turns`];
  });
  test('ability', 'bloodlust', () => {
    const b = mkBattle(mem(F0, { ability: 'bloodlust', moves: [M.heavy] }),
      [mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL })], 73);
    A0(b).boosts.acc = 6; A1(b).hp = 1;
    sim.submitChoices(b, [mv(M.heavy), mv(M.selfBuff)]);
    return [A0(b).boosts.atk === 1, `Atk stage ${A0(b).boosts.atk} after the KO`];
  });

  /* ── held items ───────────────────────────────────────────────────────── */

  const itemDmg = (id, cfg, want) => test('item', id, () => {
    const r = compare({ ...cfg, variant: { aItem: id } });
    if (r.ctrl.dmg <= 0) return [false, 'control did no damage'];
    return [near(r.ratio, want, 0.1), `x${r.ratio.toFixed(2)} (want ~${want})`];
  });
  itemDmg('power_band', { move: M.PHYSICAL }, 1.2);
  itemDmg('focus_lens', { move: M.SPECIAL }, 1.2);
  itemDmg('choice_edge', { move: M.PHYSICAL }, 1.5);
  itemDmg('choice_lens', { move: M.SPECIAL }, 1.5);
  itemDmg('cursed_cutlass', { move: M.ranged }, 1.3);
  itemDmg('iron_gi', { move: M.ranged }, 0.8);

  test('item', 'expert_belt', () => {
    // find an attacker/defender/move where the move is super effective
    for (const f of FIGHTERS) for (const g of FIGHTERS) {
      for (const mid of [M.FLAME, M.SEA, M.STORM, M.EARTH, M.SHADOW, M.MIND, M.FIST, M.SLASH, M.VOID, M.HAKI, M.FROST]) {
        const r = compare({ attacker: f.id, defender: g.id, move: mid, variant: { aItem: 'expert_belt' } });
        const eff = r.ctrl.evs.find((e) => e.t === 'damage' && e.uid === A1(r.ctrl.b).uid)?.eff;
        if (eff > 1 && r.ctrl.dmg > 0) return [near(r.ratio, 1.25, 0.1), `x${r.ratio.toFixed(2)} on a ${eff}x hit`];
      }
    }
    return [false, 'no super-effective matchup found in the roster'];
  });
  for (const it of HELD.filter((x) => x.boostType)) {
    itemDmg(it.id, { move: M[it.boostType] }, 1.3);
  }
  test('item', 'marine_vest', () => {
    const r = compare({ move: M.SPECIAL, variant: { dItem: 'marine_vest' } });
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'marine_vest', moves: [M.selfBuff, M.ranged] }), mem(F1, { ability: NEUTRAL }), 81);
    const statusSlot = A0(b).moves.find((m) => m.id === M.selfBuff);
    return [near(r.ratio, 0.65, 0.1) && statusSlot.disabled, `special damage x${r.ratio.toFixed(2)}, status move locked out`];
  });
  test('item', 'war_drum', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'war_drum', moves: [M.ranged] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 82);
    A0(b).boosts.acc = 6;
    const d = [];
    for (let i = 0; i < 3; i++) {
      const at = b.events.length;
      sim.submitChoices(b, [mv(M.ranged), mv(M.selfBuff)]);
      d.push(dmgOn(b.events.slice(at), A1(b).uid));
      A1(b).hp = A1(b).maxHp;
    }
    return [d[2] > d[0], `damage grew ${d.join(' -> ')} on repeats`];
  });
  test('item', 'straw_charm', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL }), mem(F1, { ability: NEUTRAL, item: 'straw_charm' }), 83);
    A0(b).boosts.acc = 6;
    const t = A1(b);
    let n = 0; while (t.hp > 1 && n < 20) { t.hp = t.maxHp; shoot(b, 0, M.heavy); n++; }
    const survived = t.hp === 1 && t.itemUsed;
    t.hp = t.maxHp; shoot(b, 0, M.heavy);
    const gone = t.hp !== 1;                      // consumed -> must not save again
    return [survived && gone, `survived once at 1 HP, itemUsed=${t.itemUsed}, second lethal blow landed`];
  });
  test('item', 'leftovers', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'leftovers', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 84);
    A0(b).hp = 40;
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [A0(b).hp > 40, `40 -> ${A0(b).hp} HP`];
  });
  test('item', 'shell_bell', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'shell_bell', moves: [M.ranged] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 85);
    A0(b).boosts.acc = 6; A0(b).hp = 40;
    sim.submitChoices(b, [mv(M.ranged), mv(M.selfBuff)]);
    const healed = A0(b).hp > 40;
    A0(b).hp = 40;
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [healed && A0(b).hp === 40, `healed after attacking (${healed}); no heal on a non-attacking turn`];
  });
  test('item', 'cursed_cutlass (recoil)', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'cursed_cutlass', moves: [M.ranged] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 86);
    A0(b).boosts.acc = 6;
    const before = A0(b).hp;
    sim.submitChoices(b, [mv(M.ranged), mv(M.selfBuff)]);
    const hurt = A0(b).hp < before;
    const mid = A0(b).hp;
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [hurt && A0(b).hp === mid, `lost ${before - mid} HP after attacking; none on a quiet turn`];
  });
  const berry = (id, setup, check, label) => test('item', id, () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: id, moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 87);
    setup(b);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    const first = check(b);
    const used = A0(b).itemUsed;
    setup(b);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [first && used && !check(b, true), `${label(b)}; consumed and did not re-fire`];
  });
  berry('sitrus_fruit',
    (b) => { A0(b).hp = Math.floor(A0(b).maxHp * 0.4); A0(b)._mark = A0(b).hp; },
    (b, second) => second ? A0(b).hp > A0(b)._mark : A0(b).hp > A0(b)._mark,
    (b) => `healed to ${A0(b).hp}`);
  berry('pinch_pepper',
    (b) => { A0(b).hp = Math.floor(A0(b).maxHp * 0.2); A0(b)._mark = A0(b).hp; A0(b).boosts.atk = 0; },
    (b) => A0(b).hp > A0(b)._mark && A0(b).boosts.atk >= 1,
    (b) => `healed to ${A0(b).hp} and Atk +${A0(b).boosts.atk}`);
  test('item', 'cure_plum', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'cure_plum', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 88);
    A0(b).status = 'par';
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    const cured = A0(b).status === null && A0(b).itemUsed;
    A0(b).status = 'brn';
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [cured && A0(b).status === 'brn', 'cured once, then stayed spent'];
  });
  test('item', 'mint_leaf', () => {
    const b = mkBattle(mem(F0, { ability: NEUTRAL, item: 'mint_leaf', moves: [M.selfBuff] }), mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 89);
    sim.addVolatile(b, A0(b), 'confusion', 5);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [!A0(b).volatiles.confusion && A0(b).itemUsed, 'confusion cleared and berry spent'];
  });
  for (const it of HELD.filter((x) => x.wardType)) {
    test('item', it.id, () => {
      // find a defender the ward type is super effective against
      for (const g of FIGHTERS) {
        const r = compare({ defender: g.id, move: M[it.wardType], variant: { dItem: it.id } });
        const eff = r.ctrl.evs.find((e) => e.t === 'damage')?.eff;
        if (eff > 1 && r.ctrl.dmg > 0) {
          const consumed = A1(r.test.b).itemUsed;
          return [near(r.ratio, 0.5, 0.1) && consumed, `x${r.ratio.toFixed(2)} on a ${eff}x ${it.wardType} hit, consumed`];
        }
      }
      return [false, `no ${it.wardType}-weak defender in the roster`];
    });
  }
  test('item', 'ward_plum', () => {
    for (const g of FIGHTERS) for (const t of ['FLAME', 'SEA', 'STORM', 'EARTH', 'SHADOW', 'MIND', 'FIST', 'SLASH', 'VOID', 'HAKI', 'FROST']) {
      const r = compare({ defender: g.id, move: M[t], variant: { dItem: 'ward_plum' } });
      const eff = r.ctrl.evs.find((e) => e.t === 'damage')?.eff;
      if (eff > 1 && r.ctrl.dmg > 0) return [near(r.ratio, 0.667, 0.1) && A1(r.test.b).itemUsed, `x${r.ratio.toFixed(2)} on a ${eff}x ${t} hit, consumed`];
    }
    return [false, 'no super-effective matchup found'];
  });
  for (const it of HELD.filter((x) => x.weather)) {
    test('item', it.id, () => {
      const b = mkBattle(mem(F0, { ability: NEUTRAL, item: it.id }), mem(F1, { ability: NEUTRAL }), 91);
      return [b.field.weather.id === it.weather && b.field.weather.turns === 8 && A0(b).itemUsed,
        `${b.field.weather.id} for ${b.field.weather.turns} turns, stone consumed`];
    });
  }
  test('item', 'prism_boots', () => {
    const bare = mkBattle([mem(F0, { ability: NEUTRAL }), mem(F0, { ability: NEUTRAL })], mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 92);
    bare.sides[0].hazards.caltrops = 3;
    sim.submitChoices(bare, [sw(1), mv(M.selfBuff)]);
    const bareHp = bare.sides[0].party[1].hp;

    const b = mkBattle([mem(F0, { ability: NEUTRAL }), mem(F0, { ability: NEUTRAL, item: 'prism_boots' })], mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 92);
    b.sides[0].hazards.caltrops = 3;
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    const boots = b.sides[0].party[1];
    return [boots.hp === boots.maxHp && bareHp < boots.maxHp, `boots ${boots.hp}/${boots.maxHp} vs bare ${bareHp}/${boots.maxHp} through 3 caltrop layers`];
  });
  const choiceItem = (id) => test('item', `${id} (lock)`, () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL, item: id, moves: [M.ranged, M.PHYSICAL, M.selfBuff] }), mem(F0, { ability: NEUTRAL })],
      mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 93);
    A0(b).boosts.acc = 6;
    sim.submitChoices(b, [mv(M.ranged), mv(M.selfBuff)]);
    const locked = A0(b).moves.filter((m) => m.disabled).length;
    const legal = sim.legalMoves(b, 0);
    const m0 = b.sides[0].party[0];
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    sim.submitChoices(b, [sw(0), mv(M.selfBuff)]);
    const unlocked = m0.moves.every((m) => !m.disabled);
    return [locked === 2 && legal.length === 1 && legal[0] === M.ranged && unlocked,
      `locked into ${legal.join('')} (${locked} moves disabled); switching out cleared it`];
  });
  choiceItem('choice_edge'); choiceItem('choice_lens'); choiceItem('log_pose_scarf');

  /* ── bag items ────────────────────────────────────────────────────────── */

  const bagTest = (id, setup, check, label) => test('bag', id, () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL, moves: [M.selfBuff] }), mem(F0, { ability: NEUTRAL })],
      mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 95, () => ({ [id]: 3 }));
    setup?.(b);
    sim.submitChoices(b, [{ kind: 'item', itemId: id, targetSlot: 0 }, mv(M.selfBuff)]);
    return [check(b), label(b)];
  });
  bagTest('potion', (b) => { A0(b).hp = 10; }, (b) => A0(b).hp === 50, (b) => `10 -> ${A0(b).hp} HP (+40)`);
  bagTest('super_potion', (b) => { A0(b).hp = 10; }, (b) => A0(b).hp === 80, (b) => `10 -> ${A0(b).hp} HP (+70)`);
  bagTest('hyper_potion', (b) => { A0(b).hp = 10; }, (b) => A0(b).hp === 130, (b) => `10 -> ${A0(b).hp} HP (+120)`);
  bagTest('full_restore', (b) => { A0(b).hp = 10; A0(b).status = 'brn'; },
    (b) => A0(b).hp === A0(b).maxHp && !A0(b).status, (b) => `full HP (${A0(b).hp}) and status cleared`);
  bagTest('full_heal', (b) => { A0(b).status = 'slp'; A0(b).statusTurns = 5; }, (b) => !A0(b).status, () => 'sleep cured');
  bagTest('antidote', (b) => { A0(b).status = 'tox'; A0(b).toxicCounter = 1; }, (b) => !A0(b).status, () => 'bad poison cured');
  bagTest('awakening', (b) => { A0(b).status = 'slp'; A0(b).statusTurns = 5; }, (b) => !A0(b).status, () => 'sleep cured');
  bagTest('x_attack', null, (b) => A0(b).boosts.atk === 2, (b) => `Atk +${A0(b).boosts.atk}`);
  bagTest('x_defense', null, (b) => A0(b).boosts.def === 2, (b) => `Def +${A0(b).boosts.def}`);
  bagTest('x_special', null, (b) => A0(b).boosts.spa === 2, (b) => `Sp.Atk +${A0(b).boosts.spa}`);
  bagTest('x_speed', null, (b) => A0(b).boosts.spe === 2, (b) => `Speed +${A0(b).boosts.spe}`);
  bagTest('dire_hit', null, (b) => A0(b).critStageBonus === 2, (b) => `crit stage +${A0(b).critStageBonus}`);
  test('bag', 'revive', () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL, moves: [M.selfBuff] }), mem(F0, { ability: NEUTRAL })],
      mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] }), 96, () => ({ revive: 1 }));
    const dead = b.sides[0].party[1];
    dead.hp = 0; dead.fainted = true;
    sim.submitChoices(b, [{ kind: 'item', itemId: 'revive', targetSlot: 1 }, mv(M.selfBuff)]);
    return [!dead.fainted && dead.hp === Math.floor(dead.maxHp / 2), `revived to ${dead.hp}/${dead.maxHp}`];
  });

  /* ── consistency ──────────────────────────────────────────────────────── */

  test('consistency', 'bag is capped per battle', () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL, moves: [M.selfBuff] })], [mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] })], 97, () => ({ potion: 9 }));
    const heals = [];
    for (let i = 0; i < 6; i++) {
      A0(b).hp = 10;
      const at = b.events.length;
      sim.submitChoices(b, [{ kind: 'item', itemId: 'potion', targetSlot: 0 }, mv(M.selfBuff)]);
      heals.push(b.events.slice(at).some((e) => e.t === 'heal' && e.source === 'item'));
    }
    const used = heals.filter(Boolean).length;
    return [used === 3 && b.sides[0].items.potion === 0, `${used} potions landed out of 6 attempts; stock zeroed (bag menu empties)`];
  });
  test('consistency', 'consumed items survive a switch cycle', () => {
    const b = mkBattle([mem(F0, { ability: NEUTRAL, item: 'sitrus_fruit', moves: [M.selfBuff] }), mem(F0, { ability: NEUTRAL, moves: [M.selfBuff] })],
      [mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] })], 98);
    const m0 = b.sides[0].party[0];
    m0.hp = Math.floor(m0.maxHp * 0.3);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    const spent = m0.itemUsed;
    sim.submitChoices(b, [sw(1), mv(M.selfBuff)]);
    sim.submitChoices(b, [sw(0), mv(M.selfBuff)]);
    const hpBefore = m0.hp = Math.floor(m0.maxHp * 0.3);
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    return [spent && m0.itemUsed && m0.hp === hpBefore, 'spent berry stayed spent across switch-out/switch-in'];
  });
  test('consistency', 'held item hooks never double-fire', () => {
    // Ship Rations heals exactly maxHp/16 once per turn even though runAbility
    // and runItemHook both see 'onResidual'.
    const b = mkBattle([mem(F0, { ability: NEUTRAL, item: 'leftovers', moves: [M.selfBuff] })],
      [mem(F1, { ability: NEUTRAL, moves: [M.selfBuff] })], 99);
    const m = A0(b); m.hp = 20;
    const at = b.events.length;
    sim.submitChoices(b, [mv(M.selfBuff), mv(M.selfBuff)]);
    const heals = b.events.slice(at).filter((e) => e.t === 'heal' && e.uid === m.uid);
    return [heals.length === 1 && heals[0].amount === Math.floor(m.maxHp / 16), `one heal event of ${heals[0]?.amount} (= maxHp/16)`];
  });
  test('consistency', 'no ability declares a hook the engine never calls', () => {
    const live = new Set(hooks.ability);
    const bad = [];
    for (const [id, a] of Object.entries(ABIL))
      for (const k of Object.keys(a)) if (typeof a[k] === 'function' && !live.has(k)) bad.push(`${id}.${k}`);
    return [!bad.length, bad.length ? bad.join(', ') : `${Object.keys(ABIL).length} abilities clean`];
  });

  /* ---- run ---- */
  for (const t of T) {
    if (only && !only.some((o) => t.name.includes(o))) continue;
    let pass = false, note = '';
    try {
      const r = t.fn();
      pass = !!r[0]; note = r[1] || '';
    } catch (e) { pass = false; note = `THREW: ${e.message}`; }
    out.tests.push({ kind: t.kind, name: t.name, pass, note });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 4. Fuzz                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

function inPageFuzz(n) {
  const A = window.__ARENA;
  const sim = A.sim;
  const D = A.data;
  const abilityIds = Object.keys(D.abilities);
  const heldIds = D.items.filter((i) => i.kind === 'held').map((i) => i.id);
  const fighterIds = D.fighters.map((f) => f.id);
  const bag = sim.defaultBag();

  const res = { battles: 0, turns: 0, maxTurns: 0, maxEventsPerTurn: 0, crashes: [], stalls: 0, nan: 0, badHp: 0, loops: [], draws: 0, wins: [0, 0] };

  const isBad = (v) => typeof v !== 'number' || !Number.isFinite(v);

  for (let i = 0; i < n; i++) {
    const rng = new sim.RNG((i * 2654435761 + 12345) >>> 0);
    const team = () => Array.from({ length: 3 }, () => {
      const m = sim.makeDefaultMember(rng.pick(fighterIds), 50);
      m.ability = rng.pick(abilityIds);
      m.item = rng.next() < 0.75 ? rng.pick(heldIds) : null;
      return m;
    });
    let b;
    try {
      b = sim.createBattle({
        seed: (i * 7919 + 3) >>> 0,
        sides: [{ name: 'A', team: team(), items: { ...bag } }, { name: 'B', team: team(), items: { ...bag }, isAI: true }],
        arena: 'colosseum'
      });
    } catch (e) { res.crashes.push(`create #${i}: ${e.message}`); continue; }

    let turns = 0;
    try {
      while (!b.ended && turns < 300) {
        const choices = [0, 1].map((s) => (b.request[s] ? sim.chooseAction(b, s, rng.next() < 0.5 ? 'ace' : 'rookie') : null));
        const evs = sim.submitChoices(b, choices);
        if (evs.length > res.maxEventsPerTurn) res.maxEventsPerTurn = evs.length;
        // an ability ping-pong would blow the per-turn event budget
        if (evs.length > 300) { res.loops.push(`#${i} turn ${turns}: ${evs.length} events`); break; }
        turns++;
      }
    } catch (e) { res.crashes.push(`#${i} turn ${turns}: ${e.message}`); continue; }

    if (!b.ended) res.stalls++;
    else if (b.winner === 'draw') res.draws++;
    else res.wins[b.winner]++;
    res.battles++;
    res.turns += turns;
    res.maxTurns = Math.max(res.maxTurns, turns);

    for (const s of b.sides) for (const p of s.party) {
      if (isBad(p.hp) || isBad(p.maxHp)) res.nan++;
      else if (p.hp < 0 || p.hp > p.maxHp) res.badHp++;
      for (const k of Object.keys(p.boosts)) if (isBad(p.boosts[k]) || Math.abs(p.boosts[k]) > 6) res.nan++;
      for (const k of Object.keys(p.stats)) if (isBad(p.stats[k])) res.nan++;
      if (p.hp === 0 && !p.fainted) res.badHp++;
    }
    if (isBad(b.turn)) res.nan++;
  }
  res.avgTurns = res.battles ? +(res.turns / res.battles).toFixed(1) : 0;
  return res;
}

/* ══════════════════════════════════════════════════════════════════════════ */

async function main() {
  const hooks = await engineHookNames();

  // purity guard, checked on the source itself
  const purity = [];
  for (const f of ['src/core/abilities.js', 'src/core/items.js', 'src/data/items.js']) {
    const src = await readFile(f, 'utf8');
    for (const bad of ['Math.random', 'Date.now', 'document.', 'window.'])
      if (src.includes(bad)) purity.push(`${f} contains ${bad}`);
  }

  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.sim?.createBattle, null, { timeout: 25000 });
  await page.evaluate(() => window.__ARENA.audio?.setMuted?.(true));

  const r = await page.evaluate(inPage, hooks, ONLY);
  const fuzz = FUZZ > 0 ? await page.evaluate(inPageFuzz, FUZZ) : null;

  await browser.close();
  server.kill();

  /* ---- report ---- */
  const line = (s = '') => console.log(s);
  line();
  line('════ GRAND LINE ARENA — abilities & items ════');
  line(`abilities: ${r.counts.abilities}   items: ${r.counts.items} (${r.counts.held} held, ${r.counts.bag} bag)`);
  line(`engine ability hooks : ${hooks.ability.join(', ')}`);
  line(`engine item hooks    : ${hooks.item.join(', ')}`);
  if (hooks.directAbilities.length) line(`formula-wired        : ${hooks.directAbilities.map((d) => `${d.id} (${d.where})`).join(', ')}`);
  if (hooks.directItems.length) line(`engine-wired items   : ${hooks.directItems.map((d) => `${d.id} (${d.where})`).join(', ')}`);
  line();

  line('── coverage ──');
  for (const c of r.coverage) line(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name}\n          ${c.note}`);
  line();

  const groups = ['ability', 'item', 'bag', 'consistency'];
  for (const g of groups) {
    const rows = r.tests.filter((t) => t.kind === g);
    if (!rows.length) continue;
    const p = rows.filter((x) => x.pass).length;
    line(`── ${g} (${p}/${rows.length}) ──`);
    for (const t of rows) line(`  ${t.pass ? 'PASS' : 'FAIL'}  ${t.name.padEnd(28)} ${t.note}`);
    line();
  }

  if (purity.length) { line('── purity ──'); for (const p of purity) line(`  FAIL  ${p}`); line(); }
  else line('── purity ──\n  PASS  no Math.random / Date.now / DOM in abilities.js, core/items.js, data/items.js\n');

  if (fuzz) {
    line('── fuzz ──');
    line(`  ${fuzz.battles} AI battles, random abilities + held items across the roster`);
    line(`  avg ${fuzz.avgTurns} turns, longest ${fuzz.maxTurns}, busiest turn ${fuzz.maxEventsPerTurn} events`);
    line(`  results: p0 ${fuzz.wins[0]} / p1 ${fuzz.wins[1]} / draws ${fuzz.draws}`);
    line(`  crashes ${fuzz.crashes.length} | non-terminating ${fuzz.stalls} | NaN/out-of-range ${fuzz.nan} | bad HP ${fuzz.badHp} | suspected loops ${fuzz.loops.length}`);
    for (const c of fuzz.crashes.slice(0, 6)) line(`    ! ${c}`);
    for (const c of fuzz.loops.slice(0, 6)) line(`    ~ ${c}`);
    line();
  }

  if (consoleErrors.length) { line('── console ──'); for (const e of consoleErrors.slice(0, 10)) line(`  ${e}`); line(); }

  const testsPassed = r.tests.filter((t) => t.pass).length;
  const covPassed = r.coverage.filter((t) => t.pass).length;
  const fuzzBad = fuzz ? (fuzz.crashes.length + fuzz.stalls + fuzz.nan + fuzz.badHp + fuzz.loops.length) : 0;
  const okAll = testsPassed === r.tests.length && covPassed === r.coverage.length && !purity.length && !fuzzBad;

  line(`TOTAL  behaviour ${testsPassed}/${r.tests.length}   coverage ${covPassed}/${r.coverage.length}   fuzz ${fuzz ? (fuzzBad ? 'FAIL' : 'clean') : 'skipped'}`);
  line(okAll ? '✅ all green' : '❌ failures above');
  process.exit(okAll ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
