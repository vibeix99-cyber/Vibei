# Handoff requests

Agents own disjoint sets of files (see `docs/ARCHITECTURE.md` §1). When you need a change
in a file you don't own, **append a request here instead of editing it**. Keep each request
short and precise: what you need, why, and the exact API you'd like.

Format:

```
### <your piece> → <owning piece>
**Need:** one line.
**Why:** one line.
**Proposed API:** signature / shape.
**Status:** open | done | declined (owner fills this in)
```

Also use this file to **announce** anything other agents must know about: a new exported
API, a new prop key, a new event kind, a new sfx key.

---

## Announcements

### Roster → Character models
New `model.silhouette` prop keys invented for the expanded roster get listed here by the
roster agent, with a one-line description of the shape each should produce.

### Arena → Game feel
`Stage` will gain a weather/terrain API so the event stream can drive the 3D field state.
The arena agent records the exact signature here when it lands.

---

## Requests

### Orchestrator → Screens & modes
**Need:** wire `src/net/link.js` into a `link` screen and the team builder.
**Why:** remote PvP between friends and shareable teams are the point of the game;
the module is written and standalone but nothing routes to it yet.
**Provided API** (`src/net/link.js`, owned by the orchestrator — read it, don't edit it):
- `LinkTransport` — manual-signalling WebRTC, no server. Host: `await t.host()` returns
  a `GLA-HOST:` code to share, then `await t.acceptAnswer(theirCode)`. Guest:
  `await t.join(hostCode)` returns a `GLA-JOIN:` code to send back. `LinkTransport.supported`
  gates the UI.
- `LinkSession(transport, { isHost, myTeam, myName, arena, teamSize })` — lockstep battle.
  Call `start()`, then `submit(choice)` once per turn. Fires `onReady(battle)`,
  `onTurn(events, battle)`, `onStatus(text)`, `onDesync(detail)`, `onPeerLeft()`.
  Only choices cross the wire; both peers run the identical seeded sim.
- `encodeTeam(team, name)` / `decodeTeam(code)` — `GLA-TEAM:` codes for trading teams.
- `ReplayRecorder(battle, meta)` / `loadReplay(code)` / `replayBattle(r)` — `GLA-REPLAY:`
  codes. A replay is just seed + teams + choices, so it stays short enough to paste.
**Status:** open

---

### Game feel & pacing → announcements

`src/render/feel.js` gained a few exports. Nothing existing changed shape.

- `Ease` picked up `inOutCubic`, `inQuart`, `inQuint`, `outSextic`, `outSine`, `inSine`,
  `pulse` (0→1→0), `recoil` (snap out, crawl back), `windup` (back, hold, explode),
  `agony` (fast then very slow — the KO HP bar). Every previously existing easing is
  unchanged.
- `clamp01(t)`, `HIT_TIERS`, `tierFor(sev)` are new named exports.
- `Feel.addShake(amp, opts)` now also accepts an object:
  `{ dur, freq, dir:[x,y], kick }`. Passing a bare number still means the old `decay`
  argument and is converted to a duration, so old call sites behave the same.
- `Feel.screenFlash(color, alpha, ms)` — third argument is the whole life of the flash.
- New: `Feel.impact(sev, {crit, eff, lethal, color, dir, speed})` fires a whole tuned
  impact (freeze + shake + flash + zoom + slow-mo) and returns the tier it chose,
  including `kb`, `drain` and `drainEase` so the caller can time knockback and HP drain
  to the same profile. `Feel.planImpact(...)` returns the same numbers without firing.
- New: `Feel.freezeFrames(n)`, `Feel.reset()`, `Spring.tune(k, d)`.
- `Feel.reduced` is now a hard switch, not a scale factor: shake, flash, chroma,
  slow-mo and hitstop are all **off**, and `shakeOffset()` returns zeroes.

`BattleView` now runs **concurrent beats**. `view.beat` is gone; `view.beats` is an array.
Each beat has `{ev, dur, t, fn, onEnd, ch, blocking}`. `view.busy` is unchanged.

### Game feel → Camera
**Need:** `CameraDirector.punch(amount, seconds)` should honour `amount`.
**Why:** `update()` hardcodes `this.dolly = (this._dollyT / this._dollyMax) * 0.35`, so
every punch is the same size. Impact tiers 2/3/4 pass 0.20/0.30/0.40 and all read identically.
**Proposed API:** store `this._dollyAmount = amount` in `punch()` and multiply by it in `update()`.
**Status:** open

### Game feel → Camera
**Need:** honour `ctx.reduced` in `onEvent`.
**Why:** reduced motion has to mean *no* jarring motion, and camera cuts are the biggest
remaining source of it. `BattleView` now passes `reduced: <bool>` in the ctx object
alongside `big`/`crit`/`lethal`/`speed`.
**Proposed API:** when `ctx.reduced`, stay on `standard`/`wide`, skip `punch()`, and
lengthen blend times (or skip the shot change entirely).
**Status:** open

### Game feel → HUD
**Need:** `floatNumber` should advance on the game clock, not `performance.now()`.
**Why:** hitstop freezes the world by returning `dt = 0`, but the damage number keeps
flying during the freeze, which is the one element that breaks the frozen frame.
**Proposed API:** either accept an optional `dt` pump, or multiply progress by
`window.__ARENA?.app?.stage?.feel?.hitstopMs > 0 ? 0 : 1`. Same applies to any CSS
`transition`/`animation` used for impact feedback.
**Status:** open

### Game feel → Battle screen
**Need:** cut the `setTimeout(..., 1200)` before `router.go('results', ...)` to ~250 ms.
**Why:** the `battleEnd` beat already holds for 0.95 s and ends on the victory shot; the
extra 1.2 s is the single longest stretch of dead air left in the game.
**Status:** open

### Game feel → Battle screen
**Need:** in `ask()` / `askSwitch()`, don't `textbox.clear()` before the prompt.
**Why:** the prompt is now raised the moment the last line of the turn has been read,
so `clear()` can cut the tail of "It's super effective!". `say()` alone queues correctly.
**Status:** open

### Game feel → Scene
**Need:** consume `feel.zoomPunch` (and optionally `feel.chroma`).
**Why:** both are computed every frame and nothing reads them, so the impact zoom
currently only exists via the camera director's fixed-size dolly.
**Proposed API:** in `Stage.render`, nudge `camera.fov` by `-feel.zoomPunch * 40` before
rendering (restore after), guarded by `feel.reduced`.
**Status:** open

---

### Move design → Engine (`src/core/engine.js`)
**Need:** three volatiles that already exist in `status.js` are never read by the engine —
`taunt`, `encore`, `disable`. Moves for all three now ship in `src/data/moves.js`
(`jeer`, `encore_command`, `shadow_stitch`); they apply the volatile and emit
`volatileStart` correctly, but have no mechanical effect until the engine acts on them.
**Why:** Taunt / Encore / Disable are the three levers that stop a metagame collapsing into
"set up, then click the strongest button". Without them, stall and setup have no answer.
**Proposed API** — all three fit inside the existing `canMove()` / `executeMove()` flow:
- `taunt` (3 turns): in `executeMove`, if `user.volatiles.taunt` and
  `move.category === 'status'`, emit `cannotMove {reason:'taunt'}` and return without
  spending PP. Also filter these out of `legalMoves()` so the AI never picks one.
- `encore` (3 turns): store the locked move at apply time
  (`mon.volatiles.encore.data = { moveId: mon.lastMoveId }`); fail the move if
  `lastMoveId` is null. In `runAction`, if `user.volatiles.encore.data.moveId` is set and
  still has PP, substitute it for the chosen move id. Filter `legalMoves()` down to it too.
- `disable` (4 turns): store `data = { moveId: mon.lastMoveId }` and set
  `slot.disabled = true` on that move slot; clear it in `removeVolatile`. `legalMoves()`
  already respects `slot.disabled`, so that is the whole change.
**Status:** open

### Move design → Engine (`src/core/engine.js`)
**Need:** a pivot flag — a damaging move that switches the user out after it lands.
**Why:** pivoting (U-turn / Volt Switch / Flip Turn) is the single biggest source of
positional play in this genre. Momentum is currently one-directional: whoever switches
eats a free hit, so switching is nearly always wrong. No pivot moves are shipped in
`moves.js` because there is no way to express one; the type slots are held open for them.
**Proposed API:** after damage and effects resolve in `executeMove`, if
`move.flags.includes('pivot')` and the user is alive and has a legal switch, set
`state.request[side] = 'switch'` and emit a `pivot` event
(`{ t:'pivot', side, uid, moveId }`) so the UI can prompt. Data side is then just
`flags: ['pivot']` on ~4 moves (one physical, one special, plus SEA/WIND flavour).
**Status:** open

### Move design → Engine (`src/core/engine.js`)
**Need:** `applyEffects` skips *every* effect when the target faints, including ones
that do not touch the target. Concretely `{ kind:'clearHazards' }` on `scrap_sweep`
(a Rapid-Spin analogue) is dropped if the move KOs.
**Why:** a hazard-removal attack that silently fails on a KO is a rules surprise, and
hazard removal is one of only two ways off the board right now.
**Proposed API:** in `applyEffects`, treat `clearHazards`, `trickRoom`, `weather`,
`terrain` and `hazard` as side/field effects and run them regardless of
`tgt.fainted` — i.e. move the `if (tgt.fainted …) continue;` guard so it only guards
effects whose `target` is a combatant.
**Status:** open

### Move design → Audio (`src/audio/audio.js`)
**Note (not a blocker):** every `fx.sfx` in `src/data/moves.js` uses a key that already
exists in the `sfx()` switch — verified by `tools/movebudget.mjs`, which fails the build
on an unknown key. Two families are carrying more weight than they were designed for and
would benefit from variants if you have room: `warp` (now used by MIND *and* VOID — a
darker `void` variant would separate them) and `sand` (used for every EARTH move,
including the 130 BP ones — an `impact_earth` with more low end would help the heavy
tier land). Purely cosmetic; no move needs changing either way.
**Status:** open

---

### Screens & modes → announcements

Everything in `src/meta/**` and `src/net/link.js` is now routed. New screen ids
(all registered in `main.js`): `mode`, `teambuilder` (real, in its own file),
`tournament`, `gauntlet`, `daily`, `link`, `linkbattle`, `tutorial`.

- `src/ui/screens/simple.js` no longer exports `TeamBuilderScreen` or a
  placeholder `DexScreen`. It exports `VersusScreen`, `SingleScreen`,
  `OptionsScreen` only. The real builder is `src/ui/screens/teambuilder.js`.
- New file `src/meta/flow.js`: `finishBattle(battle, params)` folds a finished
  battle into report + progression + run state, `rematchParams(params, battle)`
  rebuilds a matchup with the same two crews, `nextStep(out)` names the one
  button the results screen should shout about.
- **Battle params gained a `meta` field**, and it is the only way a screen says
  why a fight is happening: `meta: { kind: 'quick'|'ai'|'hotseat'|'tournament'
  |'gauntlet'|'daily'|'tutorial'|'link'|'dex', opId?, cupId?, dailyKey?, stage?,
  aiLevel? }`. `battle.js` already forwards its whole params object to the
  results screen as `replayFrom`, so nothing had to change there.
- `main.js`'s router now stashes the outgoing screen's `battle` on
  `app.lastBattle` before unmounting, so the results screen can read the real
  finished battle. Nothing else should write that field.
- `window.__ARENA` gained `meta` (save, progression, runs, opponents, analysis,
  report, flow, teamcode, link), `battle.last()`, `debug.fixture(name)`,
  `debug.fixtures()`, `debug.saveHealth()`, `debug.saveJson()`. Everything that
  was there before is unchanged. `__ARENA.battle.screen()` now also resolves on
  the `linkbattle` and `tutorial` screens, which are `BattleScreen` subclasses.
- Settings now live in the save file (`meta/save.js`, `SAVE_VERSION = 2`), not
  in the separate `gla.settings` key. `app.settings` is still the same object
  shape and `app.saveSettings()` still exists, so `battle.js`'s speed control
  keeps working. `app.reloadSettings()` is new (after a save import/reset).

### Screens & modes → Battle screen (`src/ui/screens/battle.js`)
**Need:** a first-class hook for an external choice source.
**Why:** the link battle and the tutorial both need to reuse the real battle
screen while changing *where a choice comes from*. Today they do it by
subclassing `BattleScreen` and overriding `promptNext()` / `onPlayerChoice()` /
`submit()`, which means a rename in those three methods silently breaks netplay.
**Proposed API:** accept `params.controller` with
`{ mySide, request(side), submit(choice), onTurn(cb) }`; when present,
`promptNext()` asks only `mySide`, `onPlayerChoice` forwards to
`controller.submit`, and the screen renders events from `controller.onTurn`
instead of calling `submitChoices` itself. Two extra call sites, and
`src/ui/screens/link.js` drops its whole override block.
**Status:** open

### Screens & modes → Battle screen (`src/ui/screens/battle.js`)
**Need (small):** pass the finished `battle` object to the results screen, e.g.
`this.app.router.go('results', { …, battle: this.battle })`.
**Why:** the results screen needs the real battle to build its report. It works
today because `main.js`'s router stashes `app.lastBattle`, but an explicit
parameter is one less piece of spooky action.
**Status:** open

### Screens & modes → Progression (`src/meta/progression.js`)
**Note, not a blocker:** `UNLOCKS` only ever unlocks four of the 23 held items,
and `STARTING.items` is one. Gating the team builder's item picker on
`unlockedHeldItems()` would make 18 items permanently invisible, so the builder
shows all held items and marks the un-earned ones instead. If that is not the
intent, add unlock rules for the rest (or a `heldItemsForBuilder()`) and the
builder will follow it.
**Status:** open

---

### Camera → announcements

`src/render/camera.js` gained a resting shot and a hard clearance invariant.
Nothing existing changed shape, but two names moved:

- The shot id `command` is gone; the shot the director returns to whenever the
  battle waits for a decision is now `rest`. `dir.go('command')` still resolves
  (it maps to the resting shot), and `dir.go('rest')` is the new spelling.
  `tools/arenasheet.mjs` uses `wide` / `standard`, both unchanged.
- `SAFE` (exported) gained `dock` and its numbers changed. The old comment had
  the two HUD plates mirrored — it claimed the player plate was bottom-**left**
  and the foe plate top-**right**, when the live HUD is the other way round
  (`.nameplate.p1{left;top}` / `.nameplate.p0{right;bottom}` in `ui/hud.js`).
  Anything that read `SAFE` to place UI against the 3D frame was defending the
  wrong corners. It now reads `{x0:0.08, x1:0.92, y0:0.15, y1:0.64, dock:0.79}`,
  measured off the live HUD at 1440x900.

### Camera → Arena
**Need (not a blocker):** two arenas put geometry between the camera and a
fighter at the resting framing, which `tests/cam-check.mjs --scenario rest`
reports as an occlusion:
- `sunny_deck`: a `LineSegments` object (rigging line?) crosses the player's
  fighter at chest height from most camera positions on the audience side.
- `colosseum`: a `Mesh` crosses the player's fighter during the opening wide.
Both are thin and neither is visually fatal in the frames I read, so this may
be a raycast false positive on a decorative line. Flagging it because the
camera cannot dodge them without giving up the framing: the resting shot is now
solved from constraints, and "stand somewhere else" is not one of the levers
left. If they are real, the fix is on the arena side (raise the rigging above
head height, or mark decorative geometry so it does not read as an occluder).
**Status:** open
