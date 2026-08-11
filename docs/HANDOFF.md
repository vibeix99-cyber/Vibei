# Handoff requests

> ## START HERE — state of play, and what to do next
>
> This file is 800 lines of accumulated request history. You do not need to read
> it top to bottom. This section is the whole picture; everything below is the
> evidence behind it, searchable by heading when you need a specific number.
>
> ### Where the game stands
>
> Twenty pieces, each built and then judged blind against Pokémon by a critic
> with fresh context that boots the real build and never reads a builder's
> summary (`docs/CRITIC.md`). Two pieces have been judged more than once:
>
> | piece | ours | Pokémon | verdict |
> |---|---|---|---|
> | The battle, as experienced | **6/10** | 8/10 (Sword/Shield) | Pokémon — both named gaps since fixed |
> | The game underneath | **5/10** | 9/10 (Black 2) | Pokémon — gap still open |
>
> Feel moved 5 → 6 after the blocking-prompt and camera fixes. Depth has not
> moved, and the reason is one thing, stated in the next section.
>
> **Eight pieces have never been judged at all**: audio, character models, arena,
> team builder, modes, link battle, onboarding, save. Any of them could be a 4.
>
> ### The one thing standing between depth 5/10 and a real tactical game
>
> Nothing on the roster can take a hit and stay in, so switching never pays, so
> every slower tool (toxic, hazards, setup, screens) expires before it does.
> Measured: the four bulkiest fighters survive **2.61 hits** from an average
> attacker's best move where a Pokémon wall survives six to ten, and the frail
> end survives 1.59 — the ends are **1.64× apart against Pokémon's 4×+**. A bench
> fighter that would take meaningfully less than the active exists on only 15.4%
> of turns, and a player who learns to switch gains **+0.7pp ±3.1**, which is
> nothing.
>
> **The lever is roster-wide offense — base offensive stats and move power.** It
> is not EVs and not base defense. Both have been tried:
>
> * EV redistribution, twice. Splitting the default spread by archetype widens
>   the ends slightly and *doubles* the share of matchups that one-shot
>   (12.3% → 25.2%). Base offense is high enough that any offensive investment
>   just accelerates the race, and walls gain nothing because the flat defensive
>   default already invests them fully. Numbers in "EVs are not the lever".
> * Base defense. Chopper already sits at 2.00 bulk/offense — Blissey territory —
>   and still dies in under three hits, because everything hits so hard in
>   absolute terms.
>
> `node tools/pace.mjs` measures and gates on the distance between the ends. It
> fails on purpose today. Getting it to pass is the highest-value work left.
>
> ### Settled since the last roadmap edit
>
> * **The type chart is not the depth blocker, and the bench-gap number that
>   suggested it was is a selection artefact.** At turn 1 the bench is a *better*
>   matchup than the lead (33.7% incoming vs 44.3%); it only inverts mid-battle
>   (47.5 vs 27.4) because the active is whatever already fit, and reading the
>   bench at full HP changes nothing. Chart density is 22.5% resisted / 19.1%
>   super, which is Pokémon's own. Do not loosen it. One change made: **MECHA
>   resists MIND**, because MIND was resisted by 3 of 18 types and was what Gojo
>   and Law used to open the walls for 41–51%.
> * **Screens reach 5 of 32 default sets** (Jinbe, Franky, Chopper, Smoker, Big
>   Mom), up from 0 across three critic runs. The cause was structural: the
>   second utility slot accepted only a "bleeder" — status, hazard or seed — so a
>   screen was ineligible for the one slot it could ever have taken.
> * **Switching moved but is not fixed.** On `depth4 regret`, the best action is
>   a switch on 43.4% of the turns that matter, up from 9.2%, and the ace AI now
>   beats greedy (10.7pp regret vs 11.2) where it used to lose to it. On
>   `firststep`, "+switch out of a bad matchup" is +2.7pp against the ace AI, up
>   from +1.9 — but −1.1pp against the pirate AI, and ±2.8pp is the error bar.
>   Real movement, still on the edge.
>
> ### Roadmap, in the order I would do it
>
> 1. ~~**Make switching pay against a weak opponent.**~~ **CLOSED** — settled on
>    row E of `depth4 firststep` (composite club player, +7.7pp vs pirate /
>    +8.9pp vs ace) rather than row C in isolation. See the hazard-removal entry
>    below for the reasoning. Historical detail: `pace.mjs` passes (2.64 hits
>    median, ends 2.63× apart, 5 walls), so stat work is done — do not reach for
>    it again. What is left is that a switch costs 27% of the incoming fighter's
>    bar and the matchup it buys is worth less than that against an opponent who
>    is not punishing you correctly. Candidates nobody has tested: hazards
>    (currently the only thing that makes *the opponent's* switching expensive),
>    and whether entry damage should scale with how bad the outgoing matchup was.
>    Gate on `depth4 firststep` row C clearing ±2.8pp against **both** AI tiers.
> 2. **Move budget: 39 over-budget moves, and only those.** `node tools/movebudget.mjs`.
>    The five silent moves and all 30 over-long descriptions are fixed; what is
>    left is 39 moves past their PP-band cap, mostly signatures. Do (1) first —
>    both touch move power and you do not want to tune the same numbers twice.
>    The audit's three remaining warnings are long move *names* (Mil Fleur
>    Gigantesco, Consecutive Normal Punches, Serious Punch) and should stay: they
>    are the characters' actual technique names and the fidelity is worth more
>    than the card width.
> 3. **Judge an unjudged piece.** Audio went out for its first blind judgement at
>    the end of the last session; if no `### Audio — first verdict` section exists
>    below, that run did not land and should be relaunched. Its brief is worth
>    reusing: a headless browser makes no sound, so the critic must measure the
>    signal (render through `OfflineAudioContext`, compare envelopes and spectra,
>    log which sounds actually fire in a real battle) rather than read
>    `src/audio/audio.js`, which is 1800 lines that will read impressively
>    whatever it sounds like. Seven pieces remain unjudged after it: character
>    models, arena, team builder, modes, link battle, onboarding, save.
> 4. **Re-judge feel and depth** once (1) lands. Both current scores predate it.
>
> ### Traps — measured, and all of them cost me an afternoon
>
> * `tools/pace.mjs` used to gate on the *median* hits to a KO. A roster where
>   everything dies at the same rate passes that and still has no wall. Gate on
>   the spread.
> * `tests/critic-promptshots.mjs` counts `Points` and `LineSegments` as
>   occluders, so blizzard snow and rain read as a hidden fighter. Its
>   `withHiddenFighter` count will never reach zero on a weather arena. Look at
>   the screenshots.
> * Do not gate the camera's departure on the outgoing shot's `minHold`; do not
>   try to measure a safe camera radius per arena with a single-height raycast.
>   Both look right and both are wrong — reasons at the call sites in
>   `src/render/camera.js`.
> * My own numbers are not neutral. Where a critic's measurement and mine
>   disagree, take the critic's: it ran the larger batch and it did not build the
>   thing.
>
> ### The gates, and what passing looks like
>
> ```
> node tools/determinism.mjs     identical across process state
> node tools/hookaudit.mjs       engine and item hook lists agree
> node tools/probe.mjs           clean boot -> battle -> title
> node tools/pace.mjs            FAILS on purpose: ends 1.64x apart, needs 2.2x+
> node tools/rosterbalance.mjs   win-rate spread 34.8-66.4% across 32 fighters
> node tools/movebudget.mjs      39 over-budget moves + 3 long-name notes
> node tools/pivotcheck.mjs      pivot and pursuit pick rates
> node tools/aiarena.mjs         five AI tiers, monotonic ladder
> ```


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

---

### Content → AI (`src/core/ai.js`)
**Need:** the AI assigns exactly zero value to `pivot` and `pursuit`.

`src/data/moves.js` now carries twelve pivot moves and five pursuit moves, and
20 of the 32 default level-50 sets contain one. `scoreMoves` scores a damaging
move purely on `est.expected` plus riders read out of `move.effects`; a pivot
carries no effects, so a 70 BP pivot is scored as a 70 BP move and loses to the
120 BP move sitting next to it. Measured over 300 AI-vs-AI games (`ace` tier),
default sets:

```
  move           offered   used    pick rate
  shade_slip         158     35       22.2%     ← coverage, gets used
  flash_relay        346     72       20.8%
  gale_exit          300     58       19.3%
  mind_relay         786    107       13.6%
  hit_and_fade       515     32        6.2%
  cut_and_run        389      2        0.5%     ← dominated by a same-type
  volt_relay         230      2        0.9%       nuke in the same set
  scrap_launch       129      1        0.8%
```

A pivot only fires when it happens to be the best raw damage for the matchup.
Voluntary switches plus pivots currently land at 1.18 per game, 13.4% of turns
(the baseline was 0.48 and 3.6%). The remaining gap to a genuine switching meta
is one term in `scoreMoves`: something like

```js
if (mv.flags?.includes('pivot') && myBodies > 0) score += 18 + 10 * hazardBurden(state, 1 - side);
```

plus a `pursuit` term that reads how likely the foe is to leave. `utilityValue`
also has no case for `custom: 'pivot'` — it falls through to `default: v += 6`,
which is why `parting_note` (a Parting Shot) is valued only for its stat drop.

**Status:** DONE. `scoreMoves` now prices a pivot as *damage plus the body it
brings in* (`pivotGain`, gated on `cfg.switchIQ`), pursuit as *the double-power
roll times the odds the foe actually leaves* (`foeFleeChance`), and
`utilityValue` has a `custom: 'pivot'` case. `switchValue` also grew a
`freeEntry` mode, because a pivot fired on a slower turn brings its replacement
in after the foe has already swung — that free entry is most of why pivots are
good.

Measured with the new `tools/pivotcheck.mjs` (which counts offered-vs-taken over
real self-play, so a move nobody carries cannot look under-picked): the numbers
in the table above did not reproduce on the shipping build. Pooled pivot pick
rate is 20.6%, `cut_and_run` 11.7% — not 0.5%. Voluntary switching moved
warlord 11.1% → 12.3% of turns and ace 1.1% → 2.1%, which is honest but small.

The reason it is small is not the AI. See the next entry.

### Content → tools (`tools/movebudget.mjs`)
**Need:** two stale allow-lists, both now producing false reports.

- `CUSTOM` does not list `pivot`, so `parting_note` is reported as
  `unknown custom handler pivot`. The engine has had `CUSTOM.pivot` since the
  pivot work (`engine.js`, the `CUSTOM` table) and `docs/ARCHITECTURE.md` §2.2
  documents `{ kind:'custom', value:'pivot' }` as a supported form.
- `INERT_VOLATILES` still lists `torment`, `perish`, `imprison`, `minimized`
  and `rooted` as "declared in status.js but the engine does not act on it
  yet". The engine acts on all five (`engine.js`: `moveLegality` for torment
  and imprison, the perish tick in the residual pass, `damage.js` for
  `minimized`, the `rooted` heal and `TRAPPING_VOLATILES`). Eleven moves now
  apply them, so the audit emits eleven warnings that are no longer true.

**Status:** open

### Content → Engine (`src/core/engine.js`)
**Observation, not a request:** `tests/critic/mechanics.mjs` fails its new
IMPRISON primitive, and the failure is a contract wrinkle rather than a broken
mechanic. Imprison works — with `mirror_seal` up, a foe told to use a sealed
move visibly uses a different one — but the rejection happens when the choice
is validated, so the move is silently swapped and the documented
`cannotMove` reason `'imprison'` (ARCHITECTURE §4) never reaches the event
stream. Torment does emit it, because torment can only become true mid-turn.
Either the choice validator should let a sealed move through to `executeMove`
so the player is told why, or §4 should say that `'imprison'` only fires when
the seal lands after choices were locked.
**Status:** open

### AI → Roster (`src/data/fighters.js`) — the biggest gap to Pokémon

**Need:** somebody on this roster has to be able to take a hit.

I went into `src/core/ai.js` to make the AI switch more and came out convinced
the AI is right not to. Switching, status, hazards, screens, items and PP are
all investments that pay back over turns. Nothing here lives long enough for any
of them to pay back, so "click the biggest number" is not the AI being lazy —
it is the correct play, and every tactical system we have built is decorative
underneath it.

Reproduce with `node tools/pace.mjs --evs`. On the shipping roster:

```
  best move vs a random target   p25 45%   median 66%   p75 99%   p90 149%
  hits to KO at the median       1.51                    (Pokémon: 2–3)
  matchups that one-shot         24.5%                   (Pokémon: <10%)
  matchups that two-shot         70.1%
  warlord self-play              2.9 turns per KO, 11.5 turns for a 3v3
  turns spent not attacking      8.5% switching  13.6% status  8.9% items
```

The damage formula is not the problem — `damage.js` is a faithful port and I
re-derived it by hand against the source ordering. The problem is upstream, in
the base stats:

```
  bulk / offense   (hp+def+spd) / (atk+spa+spe)
    ours     0.63 … 1.31        a 2.1x spread     0 fighters above 1.40
    Pokémon  0.31 … 1.90        a 6.1x spread     Blissey 1.90, Toxapex 1.86,
                                                  Skarmory 1.55, Ferrothorn 1.42
  glass cannons (<= 0.85)   18 of 32
  base speed >= 100         21 of 32   (median 105; Pokémon OU median ~85)
```

The two bulkiest fighters we have, Kaido (1.15) and Big Mom (1.23), also carry
145 and 135 base attack — they are bulky *attackers*, not walls. Chopper at 1.31
is the most defensive thing on the roster and would be a mid-tier attacker in
OU. There is no Blissey, no Toxapex, no Skarmory: nothing whose job is to come
in, eat a hit and still be there. With nothing to switch *to*, the turn a switch
costs never comes back, and the AI correctly refuses to spend it.

**What I checked and ruled out**, so nobody repeats it:

* *EV spreads.* The engine already honours `member.evs`; `makeDefaultMember`
  just never sets it. I tried a role-based 252/252/4 spread and it made things
  **worse** — 1.51 → 1.34 hits to a KO — because the rule classifies 21 of 32
  fighters as sweepers, which is simply what their base stats are. You cannot
  invest your way to a wall out of a stat line with no bulk in it.
* *Move power.* Default-set BP medians 95 (p90 140). High, but re-deriving the
  formula with our own median stats gives ~48% for a neutral STAB hit, which is
  in line with the source material. Power is a contributing factor, not the
  cause.
* *The type chart.* The best move is super-effective in 40% of matchups. Worth a
  look, but halving it would not move 1.51 hits into the 2–3 band on its own.

**Suggested shape of the fix** (roster's call, not mine):

1. Give six to eight fighters genuinely defensive base spreads — bulk/offense
   1.4 to 1.8, base speed 50–70, one reliable recovery move, and offense low
   enough that they win by attrition rather than by hitting back. Jinbe,
   Chopper, Franky, Bartholomew Kuma and Magellan are the obvious candidates by
   character.
2. Pull base speed down across the roster: a median of 105 means speed ties and
   turn order barely vary, and priority moves have nothing to leapfrog.
3. Then set real EV spreads per archetype, which will work once there are
   archetypes to spread for.

`tools/pace.mjs` exits non-zero until the median sits in the 2.0–3.0 band with
at least one wall on the roster, so it can gate the work.

**Status:** open

#### The depth critic reached the same place independently — and named it better

Wave-4 verdict, blind against Black 2 / White 2: **ours 5/10, BW2 9/10**. Its
harness is `tests/critic/depth2.mjs`. It did not read any of the above, and its
gap is the same gap, but it located the cause one level lower than I did and its
instrument is better than mine. Take its framing over mine where they differ.

It ran an **ablation with a control arm** — handicap Ace, play it against full
Ace, 800 mirror-matched games a row:

```
  no switching        49.0%     the tool is worth   1.0pp   (inside noise)
  no status moves     47.8%                         2.2pp
  no bag items        46.9%                         3.1pp
  click biggest only  39.9%                        10.1pp
```

Banning switching outright from the third-tier AI costs it nothing measurable.
Which attack you click is worth ten times everything positional combined. And
the swing test, with an identical-choice control that correctly flips 0.0%:
forcing a status move on turn 2 or 3 flips the winner 14.4% of the time — *less
often than forcing the worst available attack* (19.5%).

Where it goes past my entry: I said the roster has no walls in its **base
stats**. That is true but it is not the binding constraint, because a wall
without recovery is only a slow attacker. The binding constraint is the
**defensive move economy**:

```
  default sets carrying a recovery move or a screen     0 of 32
  fighters that can even LEARN a 50% heal               3 of 32   (chopper, hancock, enel)
  fighters that can learn a screen                      4 of 32
  fighters that can learn Protect (`brace`)             4 of 32
  Substitute / Rest / Trick Room in the library         none of 302
```

In Pokémon every species learns Protect and roughly a third learn reliable
recovery. Consequences it measured in 200 default games / 1788 turns: 38.7% of
KOs land on the *first* damaging hit, a fighter that appears lives 2.26 turns,
only 4.01 of the 6 brought ever take the field, and screens fire 0.0 times per
100 turns, terrain 0.0, Trick Room 0.0, Substitute 0.0, weather 0.3.

So the fix has two halves and the second one is the one to do first:

1. **Defensive move economy.** Put reliable recovery on the fighters whose
   character supports it and give most of the roster Protect; add Substitute and
   Rest to the library; get screens onto real learnsets. This is what lets a
   turn spent on position pay back.
2. **Then** the base-stat spread and EVs from my entry above, so there is
   something whose job is to use them.

Two of its findings are separate from the pace problem and belong to whoever
owns reachability: only **82 of 302 moves, 9 of 71 abilities and 8 of 51 items**
ever fire in a default battle, and screens/terrain/weather are fully implemented
in the engine yet never dealt to a player.

It also praised the move cards specifically — power, accuracy, PP, the ×2 chip
and a numeric predicted-damage range, which mainline Pokémon does not show —
but turned that into the sharpest line in the report: three cards carry a damage
bar and the fourth reads only "STATUS" over empty space, so *the UI prices
exactly the axis that matters and leaves the other one blank*. The presentation
is telling the truth about the game.

### Wave 4, second half — what the re-run harnesses measured

Neither wave-4 critic reached a verdict; both runs were cut short. Both left
working instruments, committed at `tests/critic/depth3.mjs` and
`tests/critic-feel3.mjs`, and I ran two of the depth modes myself. Numbers, not
verdicts — the blind comparison still needs a fresh critic.

**`depth3.mjs tempo` — are the longer games deeper, or just longer?** This is
the obvious way the roster pass could have failed, so it is the first thing to
check. 150 ace-vs-ace games a row:

```
  variant                        turns   stall%   KOturn%   lead flips   heal:dmg
  full game                       14.5    41.5%     21.5%       1.75       0.26
  no bag items                    13.8    45.4%     22.6%       1.83       0.18
  no bag, no recovery              9.7    43.8%     29.3%       1.13       0.02
  no bag, no status at all         9.2    42.5%     30.3%       1.31       0.02
  pure greedy, no bag              8.4    41.7%     32.8%       1.50       0.03
```

Deeper, not merely longer. The HP lead changes hands **1.75 times a game with
recovery against 1.13 without** — the extra turns carry information. And the
failure mode everyone expects from adding recovery did not happen: stall turns
are **41.5% of the full game against 41.7% of a pure greedy one**, statistically
the same, so the added length is not dead air. That said, four turns in ten
moving less than 6% of a team's HP is high in absolute terms whichever variant
you run, and it is worth someone asking why.

**`depth3.mjs human` — and here is the one that is not good enough.** The
harness pits *human-plausible* policies against each other rather than the AI
against a crippled copy of itself, which is the question that actually matters.
100 mirrored pairs a cell:

```
  greedy (biggest number)   vs  club player (+switch, +status)     46.0%
  greedy                    vs  novice (greedy + potions)          47.0%
  novice                    vs  club player                        51.5%
  greedy                    vs  AI ace                             33.0%
  club player               vs  AI ace                             41.5%
```

Against the AI the tools are plainly load-bearing — Ace beats greedy 66–33 using
exactly them. But **between two human-plausible strategies the entire tactical
layer is worth about four percentage points**, and a novice who only learned to
click potions edges out a club player who learned to switch and status (51.5%).

The honest reading: the skill gradient is steep at the top and nearly flat at the
bottom. Switching and status pay *when used correctly* and not at all when used
approximately, so a beginner taking their first step toward playing properly
feels no reward for it. That is the next real gap, it is a different gap from
the one the roster pass closed, and it is not a roster problem — it is a
question about whether the tools are legible and forgiving enough that
approximate use of them beats ignoring them.

**Status:** open

### Feel critic → Camera (`src/render/camera.js`) — the resting shot at a prompt

**Verdict:** the battle-as-experienced piece scored **5/10 against Sword/Shield**
(picked as the bar because it is the strongest mainline reference for 3D camera
direction and impact staging). Its named gap was the blocking command prompt,
which is fixed. This is its second finding, and it is the leading candidate for
the next round.

At the moment the player is asked to choose, with the camera **fully settled**
(`blend = 1`, animation queue empty, plus 900 ms), the framing is frequently left
over from the previous action:

* 6 of 11 sampled prompts put the player's own fighter at 50–100% of frame
  height with the opponent hidden behind its shoulder. Worst measured: player
  73.5% × 100.8% of frame at x=47, foe 20.9% at x=61 (`tests/shots/prompts/p05.png`,
  `p08.png`).
* One settled prompt has the camera **inside a scenery pillar** with neither
  fighter visible (`tests/shots/exp/f-21.png`).

This matters more than a framing nit because it is exactly the moment the player
needs the information: you cannot plan against an opponent you cannot see.
Sword/Shield never does this — every camera position keeps both combatants
visible and separated, and it always returns to the same readable resting angle
before asking.

**Note for whoever picks this up:** I previously looked at this with
`tools/restframe.mjs`, concluded the decision frames were fine, and was wrong.
That tool samples the *first* frame at which the prompt is raised; the critic
sampled after the camera had fully settled and swept every prompt in a battle
rather than the first three. Its method is better. Do not treat my earlier
"decision frames are fine" as evidence — reproduce with
`tests/critic-promptshots.mjs`.

The pillar case is a separate, harder bug from the framing case: `camera.js`
raycasts for occluders in its resting shot, so either the raycast is not running
on this path or the pillar is not in the occluder set.

**Status:** FIXED. The diagnosis in the paragraph above is wrong and the pillar
was a symptom, not a bug of its own — worth reading before trusting any of it.

The camera was never stuck on the wrong shot. It came home every time, about
1.4s late: `update()` waited 0.35s of idle before asking, then glided for 1.05s,
and the menu is up for all of it. Every "wrong framing" reading — the overlaps,
the two offscreen fighters, the pillar — was the same thing seen at different
points of that window, on `entrance` and `impact` shots that had simply not been
left yet.

It now departs immediately once `waitingFor()` names a side, over 0.55s.
`_commanded` also stopped being a latch; it was only cleared when the battle went
un-idle, so anything that knocked the frame off the resting shot mid-wait was
never recovered.

Measured after, three seeds: 8 of 8 prompts on the resting shot (was 1 of 8), no
fighter offscreen, both framed at 14-23% of width around x=14 and x=80.

Two notes for whoever measures this next:

* **`tests/critic-promptshots.mjs` over-reports occlusion.** Its raycast counts
  `Points` and `LineSegments` as blockers, which means blizzard snow and rain
  streaks read as a hidden fighter. `withHiddenFighter` will not go to zero on a
  weather arena however good the framing is. Look at the pixels —
  `tests/shots/prompts/p05.png` and `p06.png` are clean two-shots that the
  counter calls occluded.
* **Do not gate the departure on the outgoing shot's `minHold`.** I tried it,
  because letting a KO finish its beat sounds obviously right. It is not: the
  beat has already played by the time this code runs, since `waiting` requires
  the queue drained and every blocking beat finished, so the hold only delays
  the exit. It made the camera settle fully on the action shot and *then* start
  moving — 4 of 7 prompts mid-blend with the gate against 6 of 8 arrived without
  it. The comment in `camera.js` says so at the call site.

### Feel critic → what it praised, so nobody "fixes" it

Worth recording because two builders have now been tempted to soften these.

The critic rated our impact feedback **above Sword/Shield's**: a normal hit is
50 ms hitstop, 0.10 flash, 0.115 shake and a 0.032 zoom punch over 0.30 s; a KO
is 125 ms hitstop, 0.45 flash, 0.70 chroma split and 0.45× slow-motion over
0.59 s; damage floats up as a number and the HP bar springs down in 0.55–0.86 s
with a ghost bar chasing it for another 1.3–2.4 s. Sword/Shield has no hitstop,
no slow-motion and no damage numbers.

It also rated our **tempo** above Sword/Shield's once unblocked — a seven-line
turn narrates in about 5 s against roughly 20 s — and called the shot vocabulary
(`establish / rest / neutral / hero / heroBig / track / impact / finisher / ko /
entrance`, with real blends) richer.

Message pacing measured at ~110 c/s typing with 0.55–0.80 s holds per line, which
is the reading floor working as intended. Leave it alone.

**Status:** informational

### Depth round 4 — still 5/10, and now we know exactly why

Re-judged blind against Black 2: **ours 5/10, BW2 9/10.** Harness at
`tests/critic/depth4.mjs` (modes `regret firststep arc ui`). Read this entry
before doing any more roster work; it corrects the target I was aiming at.

What the roster pass moved, and what it did not:

```
                                        old        now
  ace-vs-ace game length              9.1       13.4 turns
  hits survived before fainting       2.26       2.76
  KOs on the first damaging hit      38.7%      29.3%
  ban all status moves               -2.2pp     -5.7pp
  pure greedy vs full ace           -10.1pp    -19.7pp
  ban switching                      -1.0pp     -1.0pp    <- unmoved
```

(My own earlier reading of the status ablation was −9.4pp against this critic's
−5.7pp. Different sample and harness settings; take the critic's number, it ran
the larger batch and I am not a neutral party.)

**The measurement nobody had made.** `depth4 regret` takes 120 real mid-game
positions, enumerates every legal action, and plays each out 40 times against an
ace opponent under common random numbers — so changing your action no longer
changes the dice, which is the confound `swing2` had to apologise for. Noise
floor established by running the *same* action six times: p90 20.0pp.

* 51.7% of turns contain a decision that beats the noise floor. There **is** a
  game underneath.
* On those turns the best action is a switch 32.3% of the time.
* And: pick at random → 17.2pp mean regret. Click the biggest number → 14.5pp.
  The game's own ace AI → 12.8pp, finding the best action **less often than
  greedy does** (57.0% vs 58.3%).

So 12.8pp of per-turn value is sitting there untouched, invisible to every
heuristic in this codebase. Only a rollout engine can see it.

**Why the first step toward playing well does not pay.** `depth4 firststep`,
1000 games a cell, ±3.1pp, each row is pure greedy plus exactly one new habit:

```
  + potion when low                +1.9pp
  + switch out of a bad matchup    +0.7pp     inside the error bar
  + one status on a safe turn      +0.8pp     inside the error bar
  all three                        +2.6pp
```

Meanwhile warlord beats ace 70.4% and ace beats greedy 66.3%. The depth is real
and it is entirely reserved for someone already expert.

**The correction to my roster work.** I calibrated `tools/pace.mjs` to a
roster-wide median of 2–3 hits to a KO and hit it. That target was wrong.
Pokémon's depth is not in the *level* of bulk, it is in the *spread*: a frail
sweeper dies to one resisted hit and a defensive Pokémon survives six to ten
neutral ones and heals half a bar every other turn. Our roster mean is 1.97 hits
and the bulkiest fighter in the game, Franky, is 3.06. I gave everything a
defensive EV spread and raised the floor uniformly, which compressed the range
instead of widening it. There is no wall; there is a slightly-slower-to-die
fighter.

That compression is what keeps switching inert: **a bench fighter that would
take less than 60% of what the active is taking exists on only 15.4% of
move-turns.** With no answer to switch to, the strongest AI switches on 7.3% of
turns (ace 1.4%, pirate 0.2%) against competitive singles' 25–35%, and every
slower tool inherits it — toxic, hazards and setup all expire before they pay.

**Dead content it found** (`depth2 reach`, 4011 turns): screens 0.0 per 100
turns, substitute 0.0, trick room has an event kind in the contract and zero
moves, and **19 priority moves in the library with 1 on any default set**. Four
of the six levers a competitive player uses to make position matter are
unreachable. One move, `toxic_brand`, is used 632 times — nearly double the next.

**The cheapest high-value fix it found, and it is a UI one.** `tests/shots/depth4/02-fight.png`
versus `03-party.png`: the move card carries name, PP, type, category, power,
accuracy, live effectiveness against the fighter actually opposite, a damage-roll
bar with a numeric range and rider text — better than any Pokémon game. The
switch panel carries a name, two type chips and an HP bar. We hand the player a
damage calculator for the option worth 1.7pp and an HP bar for the option that is
the correct answer on a third of the turns that matter. A player cannot learn to
switch from a panel that tells them nothing about whether switching is good.

**Suggested order** (mine, not the critic's — it gives one gap by protocol):

1. Switch panel information: incoming damage estimate, what the bench fighter
   resists, speed comparison. Cheap, and it is the only one of these that helps
   a beginner directly.
2. Widen the bulk spread rather than raising it. Walls want 6+ hits to KO and
   should keep their recovery; sweepers should go back to dying in 1–2. Undo the
   uniform defensive EV default in favour of per-archetype spreads — offensive
   for sweepers, defensive for walls. `pace.mjs` needs its gate changed from a
   median to a spread before it can measure this honestly.
3. Priority onto default sets — 19 moves, 1 reachable, and priority is how a
   sweep gets stopped.
4. Screens and substitute onto the sets of fighters that want them.

**Status:** open

### EVs are not the lever for the bulk spread — roster-wide offense is

Acting on the depth critic's correction that Pokémon's depth is in the *spread*
of bulk rather than its level, I tried redistributing the default EVs by
archetype. It does not work, measured three ways, and this is here so nobody
tries it a third time (I have now tried it twice).

```
  EV default                    median hits   one-shot   walls   frail   ends apart
  flat defensive (shipping)         2.25        10.7%     2.61    1.59      1.64x
  wall / bulky-attacker / cannon    1.58        25.2%     2.20    1.02      2.15x
  wall / everyone-else              1.76        19.4%     2.20    1.23      1.79x
```

Splitting the roster widens the ends a little and *doubles* the share of
matchups that one-shot. The reason is the same one that sank the first attempt:
base offense on this roster is high enough that any offensive investment just
accelerates the race, and the walls gain nothing because under the flat spread
they are already fully invested defensively. You cannot buy a spread with points
that are already spent.

The ends are 1.64x apart against Pokémon's 4x+, and the four bulkiest survive
2.61 hits against a Pokémon wall's six to ten. That gap is real and still open.
The lever that would move it is **roster-wide offense** — base offensive stats
and move power — not EVs and not, on the evidence, base defensive stats either:
Chopper already sits at 2.00 bulk/offense and still dies in under three hits,
because everything hits so hard in absolute terms.

`tools/pace.mjs` now measures and gates on the spread, not just the median, so
whoever takes this on can tell whether they are moving the right number. It
currently fails that gate on purpose.

**Status:** open

### Switch panel now prices the option — done

The depth critic's sharpest observation was about the UI rather than the maths:
the move card carries name, PP, type, category, power, accuracy, live
effectiveness against the fighter actually opposite, a damage-roll bar with a
numeric range and rider text — better than any Pokémon game — and the switch
panel carried a name, two type chips and an HP bar. The game instrumented the
option worth about 1.7pp a turn and left blank the one that is the correct
answer on **32.3% of the turns that matter**. That is the likeliest reason
"learning to switch" measured at +0.7pp ±3.1: a player cannot learn to switch
from a panel that tells them nothing about whether switching is good.

Each bench row now carries the incoming hit as a percentage of that fighter's
own bar, colour-banded (green ≤25%, amber ≥50%, red for a KO), and an arrow for
whether it outruns what it is walking into.

**Priced off what the player has actually seen.** `battle.js` derives the foe's
revealed moves from the event stream — the same source `ai.js` uses for its
`revealed` knowledge tier — and passes them as `ctx.foeSeen`. The panel never
reads the foe's real moveset. With nothing seen yet it falls back to the foe's
own types at a nominal 80 BP, suffixes the figure with `?` and says so in the
tooltip; that is a guess the player could equally have made.

Verified in the running build: bench reads −35%▲ and −30%▲ against a foe whose
move had been seen, active fighter correctly shows no read
(`tests/shots/party/panel.png`).

**And it uncovered a layout bug that had been shipping the whole time.**
`@keyframes popIn` ends on `transform: none` and runs with `both`, so its final
frame permanently overwrote the centring `translate(-50%,-50%)` on any element
that used it. The switch panel slid right by half its own width the instant the
animation finished — measured at `left: 500` in a 1000px viewport, so the HP
bars and HP numbers were off-screen. `.mvsheet` has the same construction, which
is exactly why the feel critic reported the move sheet as "clipped off the right
edge". **Two separate critic findings, one cause.** Both now use keyframes that
preserve their translate; the panel measures 170–830 in a 1000px screen.

If you add anything else to a list row, check the width: the row is now
name + types + flags + read + HP bar + HP text inside a 660px panel.

**Status:** done

### Priority moves now reach the roster

Thirteen priority attacks in the library, twenty-eight fighters able to learn
one, and exactly one default set carrying one. Priority is priced as damage, so
a 40 BP first-strike could never out-score a 120 BP nuke and never won a slot —
but it does not earn its place by damage, it earns it by role, the same way
recovery does. A fast, frail attacker (bulk/offense <= 0.95, base speed >= 90)
now reserves a slot for one, traded against its weakest attack and never against
its first. 1 of 32 default sets, now 21.

Side effect worth knowing: this *improved* pace on its own, because the moves
are 40-70 BP and dilute the average attack. Median hits to a KO 2.13 -> 2.25,
matchups that one-shot 12.3% -> 10.7%, turns per KO 5.01 -> 5.64, and the roster
win-rate spread narrowed from 29.6-67.2% to 34.8-66.4%.

**Status:** done

### Audio — first verdict: 4/10 against Black 2 (the lowest score in the project)

Harnesses at `tests/critic/audiolab.js`, `audio.mjs`, `audio-live.mjs`,
`audio-pix.mjs`; data and spectrogram sheets in `tests/shots/audio/`. The critic
could not listen — nothing headless can — so every number below is measured
signal: the game's own synthesis rendered through `OfflineAudioContext` and
analysed for peak, RMS, envelope and FFT fingerprint, plus a call log from a
real battle driven to its results screen.

**The gap: the sound is beautiful and reports nothing.** Summed against the
battle bed (RMS −28.1 dBFS), the measured lift each cue produces in the mix:

```
  text_blip  0.00 dB      crit    0.11 dB      item     0.05 dB
  ui_move    0.01         super   0.07         shield   0.09
  miss       0.01         weak    0.02         immune   0.12
  lowhp      0.13         heal    0.97         faint    4.81
```

Every cue that tells the player *what just happened* sits 15–27 dB under the
music and moves the mix by around a tenth of a decibel. `text_blip` is 84% of
every audio call in a battle (961 of 1144) and is 47 dB down — it is not there.
Only `faint`, `thunder` and `hit_flame` clear 2 dB.

**This is not a clipping or harshness problem — the opposite.** Zero clipped
samples in every render, including eight heavy attacks fired at once (peak
0.514, −5.8 dBFS). The SFX bus is running roughly 20 dB too quiet against its
own music bus. Note the shipped defaults are already `sfxVol 0.8` against
`musicVol 0.35` (`src/meta/save.js`), so the imbalance is inside the synthesis
gains, not the sliders — do not try to fix this by moving a slider default.

**Two more, both measured:**

* A critical hit is the ordinary hit plus 0.45 dB RMS and one thin 1568 Hz
  streak (fingerprint distance 0.0269). Super-effective is 0.07 dB of lift.
  With your eyes shut you cannot tell what landed.
* **27 of 32 fighter cries have another fighter's cry closer to them than a
  critical is to a normal hit.** All 32 render, but there are four `shape`
  values, centroids are confined to 366–1132 Hz, and every one is the same
  two-part broadband grunt varying in length and darkness. No chirp, no
  glissando, no pure tone, no stutter.

**What it praised, so nobody flattens it:** the five music tracks are real and
genuinely distinct — title 92bpm, battle 152, laststand 170, victory 138, defeat
68, sectioned arrangements with chord changes and lead lines, track-to-track
distance 0.21–0.52. It called this the strongest part of the work.

**The adaptive layer is nearly inert, and there is a specific bug in it.** Across
a whole battle the intensity trace was 0.5 → 0.4 → 0.5 → 0.6 → 0.7, peaking at
**0.70**. Over that range the music moves 1.9 dB RMS / 0.032 cosine. All the
large arrangement change lives *below* I = 0.25, which play never visits. And the
one real escalation that was built — the crossfade to `laststand`, worth +2.4 dB
and 0.43 cosine — requires I ≥ 0.78, which needs both sides down to exactly one
fighter. It never fired. `startMusic` was called twice in the whole battle.

**Suggested order** (mine; the critic gives one gap by protocol):

1. Re-gain the SFX bus against the music bus so the informational cues clear the
   bed. This is the whole verdict and it is a handful of constants.
2. Make a critical, a super-effective and a resist *different sounds* rather
   than layers on the same one — the critic's B description is explicit that
   this is what Pokémon does and why it works.
3. Re-map the intensity curve onto the range play actually occupies (0.4–0.7),
   and lower the `laststand` threshold from 0.78 so the endgame track can fire.
4. Widen the cry synthesis: more shapes, wider centroid range, some articulation
   that is not a grunt.

Only 20 of 103 SFX keys fire in a default battle, which is worth a look after
the mix is fixed — there is no point making unreachable sounds audible.

**Status:** open

### Depth round 5 — 6/10 against Black 2 (up from 5/10 twice)

Harness `tests/critic/depth5.mjs` (`wall switchpay archteam panel`) plus re-runs
of depth2/3/4. The rebalance is confirmed to have worked on everything except
the one thing it was aimed at.

**Confirmed working:**

* **There is now a wall, arithmetically.** Seven fighters carry 50% recovery and
  take 24–30% per best-move hit. Jinbe takes less than its own recovery from all
  31 other fighters (24.7%/hit, 4.06 hits to KO). Roster mean incoming 48.4%.
* **Archetypes play differently.** 240 games a cell: 3-wall teams average 60.2%
  over 38.6-turn games, 3-fast teams 31.6% over 10.3 turns. A 28-turn spread in
  length between compositions is real texture — though it is a ladder, not a
  cycle, with no rock-paper-scissors anywhere.
* **The extra turns carry information**, which is the obvious way this could
  have failed. Halfway leader wins 68.2% with the full kit against 78.0% greedy;
  26.4% of games are comebacks; stall-turn share flat at 43.0% vs 43.9%. The
  length is not padding.
* **The switch panel was singled out as better than the real games** — "Jinbe
  −12%? ▲ 247/247" gives a predicted entry cost and matchup arrow Pokémon never
  shows at choice time.

**The gap, priced directly for the first time.** `depth5 switchpay` harvested
6,765 real move-turns with a legal switch, filtered to where switching is most
obviously indicated (foe's best takes ≥50% of the active, a bench fighter takes
under 75% of that), and rolled both arms under common random numbers:

```
  stay in and click the biggest move   53.5% win
  switch to the best bench answer      51.7% win     -1.8pp
  entry cost: 27.4% of the incoming fighter's bar (median 26.1%, p90 53.1%)
```

The switch arm is given an **oracle** — it always picks the objectively
lowest-threat bench member — and still loses. And the diagnosis underneath it is
the number to fix:

```
  mean incoming on the ACTIVE            28.1%
  mean incoming on the BEST BENCH ANSWER 44.6%
```

**On a random turn the bench is a worse matchup than what is already out**, and
you pay a quarter of a bar to discover it. Everything else follows: a switch is
the best action on 9.2% of turns while being ~30% of the candidate set; ace
switches on 2.0% of turns, warlord 8.0%, against 25–35% in real play; and
`firststep` at 1200 games a cell (±2.8pp) says "+switch out of a bad matchup" is
−1.3pp against the mid AI and +1.5pp against the strong one — nothing — while
"+one status" is +2.8pp and "+potion when low" is +3.7pp.

**Two more open items:**

* **49.2% of turns are free** — every legal action within 5pp of the best.
  Greedy is within 5pp on 75.0% of turns and gives up only 6.6pp against 9.8pp
  for choosing at random, so the entire value of thinking is 3.2pp. The ace AI
  posts 7.4pp, still worse than greedy.
* **Screens remain decorative.** Seven moves, nine fighters can learn one, and
  still 0 of 32 default sets carry one, so in any battle a player actually
  starts they do not exist.

**Where I would go next.** The lever is not the entry cost — 27.4% is roughly
Pokémon's own hazard-free switch cost. It is that a bench fighter is not a
*better* matchup than the active. That is a type-chart and roster-coverage
problem: defensive typings need to actually resist things, and a 3-fighter
random team needs a reasonable chance of containing an answer. Measuring the
type chart's defensive spread is the first thing to do, not more stat tuning.

**Status:** open

### Audio round 2 — 5/10 (up from 4/10), and the level fix hit the wrong layer

Harness re-run from scratch plus five new scripts (`audio-turn.mjs`,
`audio-verify.mjs`, `audio-duck.mjs`, `audio-duck2.mjs`, `audio-pix2.mjs`).

**What the fix did land:**

```
  cue SNR vs the battle bed        was        now
  crit                          -15.87     +1.80 dB
  heal                           -5.91     +2.88
  lowhp                         -15.27     -1.08
  buff / debuff           -10.01/-9.62   +0.49/+1.22
  text_blip                     -47.44    -12.82
```

The critical hit is genuinely fixed: `impact_med` vs `impact_med + crit` is now
**+11.9 dB peak / +10.5 dB RMS** against the old 0.45 dB, and on `slash_heavy`,
which is what the live game actually fires, **+16.8 dB**. Headroom is clean —
the busiest 3 s of a real battle, 111 cues over the bed, peaks at −7.1 dBFS with
zero clipped samples, and 32 simultaneous `impact_world` only reach −1.67.

**The gap: I lifted the stinger layer and left the layer that carries every
ordinary hit exactly where it was.** Peak against the bed's median 250 ms window
peak (−14.64 dBFS at ship volumes):

```
  crit  +7.19   faint +5.87   heal/buff +5.2   lowhp +5.42     <- stingers
  impact_med -5.45   psychic -7.02   clang -7.92
  slash_heavy -8.54  impact_light -9.32  scatter -15.58        <- the hit
```

The 18 quietest of the 103 registry keys are all move/impact sounds; the 8
loudest are all stingers. **A stat buff is now the loudest thing in the battle
and a punch is the quietest.** And across two live battles, hit-layer sounds
outnumbered effectiveness stingers 43-to-6 and 44-to-20, so **55–86% of all hits
play only the buried impact layer** — you cannot hear that you landed a blow.

**Why I got it wrong, which matters more than the miss.** `SFX_ROLE` says
"everything else already cleared the bed on measurement". That was true of the
sample I measured and false of the game: **stage 1 of the harness tests 41 of the
103 keys**, and the ones a live battle actually fires — `clang`, `slash_heavy`,
`water_hit`, `psychic`, `gale`, `impact_heavy`, `slash_world` — are not among
them. I calibrated against an unrepresentative subset and generalised from it.
Fix the harness's key list at the same time as the mix.

**Two live bugs it found on the way:**

* **`sfx(key, {delay})` is not honoured.** `{delay:1.0}`, `{at:1.0}` and
  `{when:...}` all start the cue at 0.0120 s. Stage 5's `burst8` and any timing
  test built on it are firing everything at t=0. Its own first pass reported
  clipping because of this and it caught and retracted the number itself.
* **The ducking never engages.** Measured by lowpassing the mix at 200 Hz and
  firing cues with no bass content: mix-vs-bed delta 0.00 dB for `text_blip`,
  +0.01 for `ui_move`, −0.04 for `ui_select`. The `musicDuck` node exists and
  `_duck()` is called; nothing happens. Half of what I shipped is inert.
* `tests/critic/audio-pix.mjs` is broken as committed (`window.__draw is not a
  function`); use `audio-pix2.mjs`.

**Still open from round 1:** cries barely moved — mean pairwise distance 0.1291
→ 0.1422, near-twins 27 → 18 at the 0.03 threshold but **30 of 32** at 0.05, and
the shape distribution is untouched at four templates for 32 fighters. Widening
the knobs was not enough; they need genuinely different articulations. And the
continuous intensity system is inaudible over the range play visits (fingerprint
distance 0.075 across I=0.4→0.9, 0.0013 from 0.8→0.9) — what actually reads is
the discrete `laststand` swap, which now fires and which it called unmistakable.

**Suggested order:** extend `SFX_ROLE` to the impact keys and re-measure against
the *live-fired* key list, not stage 1's; then find why `_duck` is inert; then
the cries.

**Status:** open

### Save / progression / team codes — health check, all green

Driven through the running build. Nothing needed fixing; recorded so the next
person does not re-derive it.

* **Save.** v2, migration chain complete (a path exists from every earlier
  version), export/import round-trips, and a deliberately corrupted file
  recovers rather than throwing — `load()` returns a valid save and the corrupt
  copy is preserved under `gla.save.corrupt`.
* **Progression.** 13 unlocks, all well-formed. They gate on a `test` predicate,
  not an `xp` threshold — worth knowing before writing an audit against them.
  Every item unlock names a real item, every arena unlock a real arena. A blank
  save starts with 2 arenas and 1 held item.
* **Team codes round-trip cleanly in both formats**, 12 of 12 across the roster
  with ability, item and all four moves preserved. Junk input is rejected with a
  human-readable reason and never throws: empty, prefix-only, non-base64, wrong
  version and a foreign `GLA1:` shape all decline politely.

**Two traps I fell into writing the check**, both worth knowing:

* `encodeTeam` takes a team **object** `{ name, members }`, not a bare array of
  members. Passing an array encodes an empty team and produces a 5-byte code
  that decodes to "none of its fighters exist in this build" — which looks
  exactly like a catastrophic data bug and is not one.
* **There are two distinct code formats and they are not interchangeable.**
  `src/net/link.js` emits `GLA-TEAM:` + base64 JSON; `src/meta/teamcode.js`
  emits the compact `GLA1.` bitpacked form. The team builder accepts both by
  sniffing the prefix. Wrapping a `GLA1.` code in a `GLA-TEAM:` prefix produces
  something the game never emits, and the resulting regex truncation looks like
  a parser bug. It is not.

**Status:** done

### Hazard removal distribution — shipped, and the gate it was aimed at FAILED

**What changed.** Removal now reaches 3 of 32 default sets (Ace, Franky, Edward),
up from 1. No learnsets touched and no hazard formula touched: Franky and Edward
already owned `scrap_sweep` and simply never picked it. Two reasons, both fixed:

* Neither scorer credited `clearHazards` at all — `attackScore` gave `+16` for
  *setting* a hazard and nothing for clearing one. Now +20 there, +32 in
  `utilityScore`, both kept under the status (50) and hazard-set (44) tiers.
* Scoring alone can never be enough: `scrap_sweep` is 40 BP against movepools
  whose top attacks are 65-100, so it loses on merit and always will. Removal
  now gets a **role slot**, the same treatment recovery, priority and screens
  each needed. Guarded at `picked.length >= 2` rather than the `>= 3` the other
  slots use — a wall only ever picks two attacks, which is the exact trap the
  screen slot fell into. Safe here only because the removal move is itself an
  attack, so the trade leaves two attacking moves rather than one.

**The primary gate failed and the lever is not sufficient.** `depth4 firststep`,
400 games a cell, ±2.4pp:

```
  "+ switch out of a bad matchup"        vs pirate      vs ace
  before this change                       -1.1pp       +2.7pp
  after                                    -0.4pp       +2.1pp
```

Against the weak AI it moved 0.7pp in the right direction and is still negative.
Against the strong AI it is unchanged within noise. **Distribution is not the
answer to the pirate-tier deficit**, and per the standing guidance that opens
the door to the hazard formulas — but do not walk through it without reading the
next paragraph first.

**A question about the gate itself, which I could not resolve and which should
be settled before more work goes into it.** The pirate AI does not punish a bad
matchup — that is what makes it the weak tier. Switching out of a matchup your
opponent is not exploiting costs a turn and buys nothing, so "switching pays
against a weak opponent" may be asking for something that is not true in Pokémon
either: there, too, tactical play converts against strong opposition and is
close to free-to-ignore against a beginner. If that is right, row C against
pirate is the wrong gate, and the honest target is row **E** — the composite
club player — which is **+7.7pp vs pirate and +8.9pp vs ace**, comfortably clear
of noise on both tiers and up from +6.8/+8.1 before.

Worth an explicit decision next session: either accept row E as the gate and
call the depth blocker closed, or keep row C and accept that it requires making
the pirate AI punish matchups better — which is an `ai.js` change, not a content
one, and would mean the weak tier is no longer weak in the way it is now.

**Regression gates all green:** pace 2.66 hits median / 2.63x ends / 5 walls,
determinism identical across process state, audiocheck balanced with ducking
intact, probe clean.

**Status:** DONE. Gate settled by decision: **row E is the metric**, not row C.
The weak AI is deliberately not being changed to punish matchups harder — that
would make the weak tier stop being weak, which is not a fix. Row E, the
composite club player, is **+7.7pp vs pirate and +8.9pp vs ace**, clear of the
±2.4pp noise floor on both tiers. **Priority #1 / depth blocker: closed.**

Row C against the pirate AI stays at −0.4pp and that is now an accepted
property, not an open defect: switching out of a matchup your opponent is not
exploiting costs a turn and buys nothing, which is true of the source material
too.

### Cry synthesis — envelopes wired to `shape`, partially solved

`shape` drove partial ratios, inharmonicity and growl depth but never the
amplitude envelope: all 32 fighters shared one contour (linear attack, 0.55-power
decay to a 0.15 floor, linear release). Four families now have four envelopes,
plus a family pitch motion — growl climbs 22%, roar drops 16% — and per-fighter
variation of each family's timing constant, hashed off the existing `contour`
value so no two fighters in a family decay alike.

```
  ROAR    one front-loaded slam, exp(-3.4u) fall, pitch dropping away
  GROWL   swell into a mid-body sustain, pitch climbing through it
  CLANG   6% transient spike then a low resonant ring-out
  CHIME   pulse train, 3-13 pulses, depth fading as the tail decays
```

Chopper moved 460 -> 300: a growl at 460 was the one root fighting its own
family (median 170). Kaido at 90 in roar is *not* an outlier to fix — he should
be the deepest thing in the game.

**Measured, and honest about what did not move:**

```
                              original   after spectral   after envelopes
  median pairwise distance      0.1033       0.1422           0.2223
  near-twins under 0.03          27/32        18/32            15/33
  near-twins under 0.05             —         30/32            25/33
```

The overall distribution widened a lot — median separation is up 56% on the last
pass and more than doubled from the original. **The tightest pairs did not
break.** Edward/Zoro (0.0151), Luffy-G4/Ace, Killua/Nami and Saitama/Levi are
still inside 0.05.

Why, and what would actually fix it: giving each family one envelope fixed the
family-to-family collisions and reproduced the same problem one level down —
two clang fighters at similar roots now share a family envelope the way all 32
used to share a global one. The per-fighter `cv` spread helps (0.05-threshold
twins 30 -> 25) but it varies one timing constant, not the *structure*. The
remaining pairs need structurally different articulations within a family — a
two-syllable cry, a cry with a silent gap, a cry that starts on its tail — which
is new generator code rather than another coefficient. Do not spend another pass
widening knobs; that is now three passes of evidence that it plateaus.

Audio gates green after the change: mix balanced, ladder 4.6 dB wide, delay
honoured, ducking -1.36 dB, no clipping, probe clean.

**Status:** open — materially better, tightest pairs unsolved

### Meta systems swept — team builder, modes, save, netplay: all clean

New gate: `node tools/metacheck.mjs [--stage all|screens|builder|runs|save|link]`.
It drives the real UI through `window.__ARENA` and asserts on the live DOM.
**31 checks, zero findings.** No source changed — this pass found nothing to fix,
which is itself the result.

* **All 15 screens mount** with content and no console errors. `linkbattle` is
  the one that does not become current, and correctly so: deep-linked without a
  live session it renders "that link battle is no longer running" and bounces to
  the lobby.
* **Team builder exposes everything the engine grew.** 32 roster rows, 6 crew
  slots, 6 EV sliders against a spent/left budget, natures, abilities, and the
  full 38-item held library. Hazard removal is learnable there on all four
  owners (ace, franky, smoker, edward) and screens on all ten.
* **Both code formats round-trip a fully customised member** — custom EV spread,
  non-default IVs, nature, held item, third ability slot, hand-picked moves —
  with no loss, in `GLA1.` and `GLA-TEAM:` alike.
* **Tournament runs Quarter-final → Semi-final → Final to `status: 'won'`**, a
  different opponent each round. **Gauntlet walks all 11 ladder steps** with 11
  distinct opponents and the AI tier escalating rookie → pirate → ace → warlord
  → yonko. Daily mounts and offers its challenge.
* **Save writes through to localStorage and survives a page reload.**
* Combat regressions after the pass: probe clean, determinism identical across
  process state.

**Read this before trusting a future finding from this harness.** Four of my
first five "problems" were the harness, not the game, and all four were the same
mistake — asserting against a *label or a field name I assumed* rather than the
thing itself:

* Grepped the builder's screen text for "EV". The EV editor renders a budget and
  six sliders and never prints the word. **Assert on controls, not captions.**
* Read the builder on mount, before selecting a fighter. The nature/item/ability
  editor does not exist in the DOM until something is selected.
* Compared a 3-key EV spread against the decoder's normalised 6-key output and
  called a lossless round-trip "LOSSY".
* Looped a tournament on `run.done`. The terminal flag is `run.status` — 'won'
  or 'lost' — so it advanced a finished bracket forever and looked like a mode
  that never ends.

The pattern is worth more than the individual fixes: every one produced a
confident, plausible, entirely false bug report. When this harness flags
something, reproduce it by hand before acting.

**Status:** done — meta systems judged and clean

### Unjudged pieces remaining

Down to four, none of them systems: character models, arena/lighting, onboarding
(title + tutorial flow as a first-time experience), and battle HUD legibility.
All four are *presentation* judgements that need a blind critic looking at
pixels, not a harness — `tools/metacheck.mjs` covers the mechanical half.
