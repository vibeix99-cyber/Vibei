# GRAND LINE ARENA — Architecture & Contracts

> **Read this before touching any file.** Every module in this project talks through the
> contracts below. If you change a contract, you break other agents' work. Extend, don't mutate.

A turn-based PvP monster-battler in the Pokémon lineage, cast with anime fighters
(One Piece–led). Pure ES modules, Three.js, no build step, no network at runtime.

---

## 0. Golden rules

1. **The simulation is pure.** `src/core/**` must never import from `render/`, `ui/`, `audio/`,
   or touch `window`, `document`, `Math.random`, or `Date.now()`. It is deterministic given
   `(seed, choices)`. This is what makes replays, netplay, and AI search possible.
2. **The simulation emits events. Presentation consumes events.** Renderers never read
   battle state to decide what to animate — they read the event stream. (See §4.)
3. **All randomness goes through the injected `RNG`.** Never `Math.random()` in core.
4. **Data is data.** Moves, fighters, items, abilities live in `src/data/**` as plain objects.
   Behaviour hooks live in `src/core/**`.
5. **Everything must be reachable from `window.__ARENA`** (see §7) so critics can drive
   the game headlessly.

---

## 1. Module map & ownership

```
index.html               shell + importmap
src/
  main.js                bootstrap, screen router, game loop
  core/                  ← PURE SIM. no DOM, no three.
    rng.js               seeded deterministic RNG
    types.js             type chart + effectiveness
    stats.js             stat computation, natures, boosts
    damage.js            damage formula
    engine.js            turn resolution, the event emitter
    battleState.js       state construction / cloning / serialization
    status.js            status conditions, volatiles, field effects
    abilities.js         ability hooks
    items.js             item hooks
    ai.js                opponent AI (reads state, returns Choice)
    validate.js          team legality + data integrity checks
  data/
    moves.js             MoveDef[]
    fighters.js          FighterDef[]
    items.js             ItemDef[]
    abilities.js         AbilityDef[]
    arenas.js            ArenaDef[]
  render/
    scene.js             renderer, arena, lighting, post-processing
    fighterModel.js      procedural fighter meshes + rig + idle
    vfx.js               move effects, particles, impact
    camera.js            cinematic camera director
    feel.js              hitstop, shake, tween, easing
    battleView.js        event-stream → animation orchestrator
  ui/
    hud.js               HP bars, name plates, status pips
    menus.js             FIGHT/BAG/PARTY/RUN, move cards
    textbox.js           typewriter message box
    screens/*.js         title, team builder, dex, results…
  audio/audio.js         procedural music + SFX (WebAudio, zero assets)
  net/link.js            hot-seat + WebRTC link battle + replays
  meta/*                 progression, save, tournament
```

**One agent owns one file.** Do not edit files you do not own. If you need a change in
someone else's file, add it to `docs/HANDOFF.md` instead.

---

## 2. Core data shapes

### 2.1 Types (18)

```
SLASH FIST HAKI FLAME FROST SEA STORM EARTH WIND
SHADOW LIGHT BEAST MECHA MIND TOXIN SOUND SPIRIT VOID
```

### 2.2 `MoveDef`

```js
{
  id: 'gum_gum_pistol',            // snake_case, unique
  name: 'Gum-Gum Pistol',
  type: 'FIST',
  category: 'physical' | 'special' | 'status',
  power: 40,                       // 0 for status
  accuracy: 100,                   // null = cannot miss
  pp: 25,
  priority: 0,                     // -7..+5
  target: 'foe'|'self'|'field'|'foeSide'|'allySide'|'all',
  critStage: 0,                    // added to crit stage
  contact: true,
  flags: ['punch','sound','slice','bite','protect','reflectable','bypassSub',
          'charge','recharge','snatch','pulse','bullet','wind','dance'],
  hits: [2,5] | null,              // multi-hit range
  drain: 0.5 | 0,                  // fraction of damage healed
  recoil: 0.33 | 0,                // fraction of damage taken
  effects: [                       // resolved in order after damage
    { kind:'status',  value:'brn', chance:30, target:'foe' },
    { kind:'boost',   stats:{atk:1}, chance:100, target:'self' },
    { kind:'volatile',value:'flinch', chance:30, target:'foe' },
    { kind:'heal',    frac:0.5, target:'self' },
    { kind:'weather', value:'rain' },
    { kind:'terrain', value:'blade' },
    { kind:'hazard',  value:'caltrops', target:'foeSide' },
    { kind:'screen',  value:'reflect', target:'allySide' },
    { kind:'custom',  value:'<handlerId>' }   // handler in core/moveHandlers
  ],
  desc: 'Short mechanical description shown in UI.',
  flavor: 'One line of characterful text.',
  fx: { key:'straight_punch', color:'#ff5a3c', shape:'beam'|'arc'|'burst'|'melee'|'aura',
        scale:1, hitstop:90, shake:0.6, sfx:'impact_heavy' }
}
```

### 2.3 `FighterDef`

```js
{
  id: 'luffy',
  name: 'Luffy',
  epithet: 'Straw Hat',
  origin: 'One Piece',
  types: ['FIST','BEAST'],         // 1 or 2
  base: { hp:90, atk:125, def:80, spa:60, spd:75, spe:110 },
  abilities: ['gum_body','conquerors_will'],  // [0]=common, [1]=rare
  learnset: [ {lv:1,  move:'gum_gum_pistol'}, ... ],
  signature: 'red_hawk',
  awaken: { into:'luffy_g4', at:36 } | null,   // "evolution"
  model: {                                      // consumed by render/fighterModel.js
    build:'lean'|'athletic'|'bulk'|'giant'|'lithe',
    height: 1.74,                               // metres, drives scale
    palette:{ skin:'#f2c79a', hair:'#141414', primary:'#d63b2f',
              secondary:'#1e64c8', accent:'#f5d547' },
    silhouette:['strawhat','scar','openvest','sandals'],  // prop keys
    aura:'#ff3b2f'
  },
  dex: 'Two sentences of dex flavour.',
  tier: 'S'|'A'|'B'|'C',
  cry: { root: 220, shape:'roar'|'chime'|'growl'|'clang', len: 0.55 }
}
```

### 2.4 `Combatant` (runtime instance — created by battleState)

```js
{
  uid:'p0-0', side:0, slot:0,
  speciesId:'luffy', nickname:'Luffy', level:50,
  nature:'adamant', ivs:{...}, evs:{...},
  stats:{hp,atk,def,spa,spd,spe},   // computed, unboosted
  hp: 165, maxHp: 165,
  moves:[{id,pp,maxPp,disabled:false}],
  ability:'gum_body', item:'sea_stone_band'|null, itemUsed:false,
  status:null|'brn'|'psn'|'tox'|'par'|'slp'|'frz', statusTurns:0, toxicCounter:0,
  boosts:{atk:0,def:0,spa:0,spd:0,spe:0,acc:0,eva:0},
  volatiles:{},                     // see status.js VOLATILES
  fainted:false, lastMoveId:null, movedThisTurn:false,
  turnsActive:0, timesHit:0, damageTakenThisTurn:0
}
```

### 2.5 `Choice` (what a player submits each turn)

```js
{ kind:'move',   moveId:'red_hawk', target:'foe' }
{ kind:'switch', toSlot:2 }
{ kind:'item',   itemId:'hyper_potion', targetSlot:0 }
{ kind:'run' }
```

---

## 3. Engine API

```js
import { createBattle, submitChoices, forceSwitch, isOver } from './core/engine.js';

const battle = createBattle({
  seed: 123456,
  format: { level: 50, teamSize: 6, bring: 3 },
  sides: [ {name:'You',  team:[TeamMember,...]},
           {name:'Rival',team:[TeamMember,...]} ],
  arena: 'marineford'
});

// battle.request tells each side what it must choose: 'move' | 'switch' | null
const events = submitChoices(battle, [choiceP0, choiceP1]);  // → BattleEvent[]
```

- `submitChoices` **mutates** `battle` and **returns** the event list for that turn.
- Never mutate `battle` outside the engine.
- `battle.request = { 0:'move'|'switch'|null, 1:... }` after every call.
- `battle.winner = 0|1|'draw'|null`.

### `TeamMember` (pre-battle build)

```js
{ speciesId, nickname?, level, nature, ivs, evs, ability, item, moves:[id,id,id,id] }
```

---

## 4. Event stream — the presentation contract

Every event is `{ t: '<kind>', ... }`. The renderer/UI walk this list in order,
each producing an animation of some duration. **New event kinds are allowed;
never repurpose an existing one.**

| `t`              | payload                                                        |
|------------------|----------------------------------------------------------------|
| `battleStart`    | `{sides:[{name},{name}], arena}`                                 |
| `turnStart`      | `{turn}`                                                         |
| `switchIn`       | `{side, uid, speciesId, nickname, hp, maxHp, level, status}`     |
| `switchOut`      | `{side, uid}`                                                    |
| `moveUsed`       | `{side, uid, moveId, targetSide, targetUid}`                     |
| `prepare`        | `{side, uid, moveId, text}`  (two-turn charge)                   |
| `miss`           | `{side, uid, targetUid, reason:'accuracy'|'protect'|'immune'}`   |
| `damage`         | `{side, uid, amount, hpAfter, maxHp, eff, crit, hits, source}`   |
| `heal`           | `{side, uid, amount, hpAfter, maxHp, source}`                    |
| `boost`          | `{side, uid, stat, delta, stage, failed}`                        |
| `statusApply`    | `{side, uid, status}`                                            |
| `statusCure`     | `{side, uid, status}`                                            |
| `volatileStart`  | `{side, uid, id}`                                                |
| `volatileEnd`    | `{side, uid, id}`                                                |
| `weather`        | `{id, phase:'start'|'upkeep'|'end'}`                             |
| `terrain`        | `{id, phase}`                                                    |
| `hazard`         | `{side, id, layers}`                                             |
| `screen`         | `{side, id, turns, phase}`                                       |
| `ability`        | `{side, uid, abilityId}`                                         |
| `itemUse`        | `{side, uid, itemId, consumed}`                                  |
| `faint`          | `{side, uid}`                                                    |
| `cannotMove`     | `{side, uid, reason:'par'|'slp'|'frz'|'flinch'|'confusion'|…}`   |
| `message`        | `{text, style?:'plain'|'crit'|'super'|'weak'}`                   |
| `battleEnd`      | `{winner:0|1|'draw'}`                                            |

`eff` (effectiveness) ∈ `{0, 0.25, 0.5, 1, 2, 4}`.

---

## 5. Screens & router

`main.js` owns a router. Screens register themselves:

```js
router.register('title',  TitleScreen);
router.register('battle', BattleScreen);
router.go('battle', { params });
```

Screens implement `{ mount(root, params), unmount(), update(dt) }`.
`root` is a `<div>` inside `#ui`. Three.js scene is shared and lives in `render/scene.js`.

Screen ids: `title`, `mode`, `teambuilder`, `dex`, `battle`, `results`, `tournament`,
`link`, `options`, `tutorial`.

---

## 6. Style tokens

Defined in `src/ui/theme.css`. Use the variables, never raw hex in UI code.
Type colours live in `src/core/types.js → TYPE_COLOR`.

---

## 7. `window.__ARENA` — the test/critic surface

`main.js` must always expose:

```js
window.__ARENA = {
  version,
  ready: Promise<void>,           // resolves when first frame rendered
  router,                         // .go(id, params), .current
  scene,                          // three scene wrapper
  audio,                          // .setMuted(bool)
  data: { moves, fighters, items, abilities },
  // headless sim
  sim: { createBattle, submitChoices },
  // drive the visible battle
  battle: {
    start(opts),                  // opts: {seed, p0Team, p1Team, arena, mode}
    quick(seedOrOpts),            // instant 3v3 demo battle
    state(),                      // deep-cloned public battle state
    choose(sideIndex, choice),    // submit a choice programmatically
    events(),                     // events produced so far
    skipAnimations(bool),
    isAnimating(),
    log()                         // array of message strings, in order
  },
  perf: { fps, drawCalls, tris },
  debug: { seed(n), screenshotSafe() }
};
```

Critics will use `page.evaluate(() => window.__ARENA...)`. Keep it stable.

---

## 8. Running & testing

```bash
npm run serve        # static server on :8080
npm run probe        # playwright: screenshots + __ARENA smoke test
npm run check        # data integrity + sim invariants (node, no browser)
```

Screenshots land in `tests/shots/`.
