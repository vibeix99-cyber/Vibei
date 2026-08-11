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

**Status:** open

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
