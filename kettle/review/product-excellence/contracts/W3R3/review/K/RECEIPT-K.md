# RECEIPT-K: capture lane K, W3R3 new 2D Chai masters (raw captures and measurements, no verdicts)

BEFORE = integration `f034205` (dev :5560, preview :5570). AFTER = trial `4e9961f` (dev :5621, preview :5622; worktree `/home/user/wt/w9tr`, integration + C2 `17f5a70`). Playwright 1.56 Chromium; every browser run went through the slot gate (`--lane K --n 1`). Captures were taken on the **dev** servers with `?debug`. Pillow/numpy/scipy in a venv outside the repo. No repo file was changed.

**Stages** (each committed): 1 raw captures, 2 reference + edges + pose-switch + proportions, 3 pixel diff + noise floor + file sizes + hand-back.

**Frozen date (as W3R1/W3R2):** Playwright clock installed at 2026-10-12T07:40Z (Monday), timezone UTC, `setFixedTime` so `Date.now()` is constant (the focus countdown stays 25:00); the `?seed=` profile pins the time of day (veteran 15:30; evening Home = +3.5 h = 19:00). Screenshots: `animations: disabled`, fonts ready, full page, DPR 1. Dark/light by `?theme=`, reduced motion by `?motion=reduce` plus media emulation, 200 % text by `html{font-size:200%!important}` (the a11y-audit approach). Welcome notify: `Notification.permission` forced to `granted` (headless Chromium reports denied, and Chai is the vector idle pose then).

## Stage 1: BEFORE/AFTER capture matrix

13 states per config, file name = state:

| state file | what | pose |
|---|---|---|
| `kit-chai` | Kit gallery `#/kit?part=art&view=chai` (all three) | reading, sipping, cheering |
| `settings` | Settings; About card is the foot of a tall page | sipping |
| `home-evening` | veteran at 19:00, Home hero | sipping |
| `focus-running` | Focus stage, brew running | reading |
| `home-live` | Home hero while a brew runs | reading |
| `focus-paused` | Focus stage, paused | reading |
| `whistle` | the whistle (hop) | cheering |
| `summary` | summary | cheering |
| `focus-break` | tea break on the Stage | sipping |
| `home-break` | Home hero in the break | sipping |
| `welcome-sound` | Welcome, sound step | sipping |
| `welcome-notify` | Welcome, notify step (granted) | cheering |
| `welcome-ready` | Welcome, ready step | cheering |

Per-capture Chai `<img>` box and pose: `shots/<side>/states.log.txt` (identical lines before and after for every capture: the layout footprint is unchanged).

| config dir (`shots/<side>/<dir>/`) | BEFORE PNGs | AFTER PNGs |
|---|---|---|
| `1440x900-dark` | 13 | 13 |
| `1440x900-light` | 13 | 13 |
| `375x667-dark` | 13 | 13 |
| `375x667-light` | 13 | 13 |
| `390x844-dark` | 13 | 13 |
| `390x844-dark-t200` | 13 | 13 |
| `390x844-light` | 13 | 13 |
| `390x844-light-rm` | 13 | 13 |
| `390x844-light-t200` | 13 | 13 |
| **total** | **117** | **117** |

`-t200` = 200 % text (390x844 light and dark, all 13 states), `-rm` = reduced motion (390x844 light, all 13 states). So every pose has a 200 % text and a reduced-motion capture (more than the "at least one of each" asked).

Re-capture note: the animated flow states (`focus-running`, `home-live`, `focus-paused`, `focus-break`, `home-break`) were first taken in parallel runs; under that load the Stage scene and tab bar were caught mid-entrance, so these five were re-taken strictly serially, BEFORE then AFTER per config, with 3x the settle time (`scripts/run-states3.sh`). The PNGs in `shots/` are those final ones.

Scripts (`scripts/`): `lib.mjs`, `states.mjs` (matrix), `run-states.sh`, `run-states3.sh`.
