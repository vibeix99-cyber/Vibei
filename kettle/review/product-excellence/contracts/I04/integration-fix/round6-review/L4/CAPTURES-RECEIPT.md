# L4 CAPTURES RECEIPT (phase 1: comparison captures)

Lane L4 (captures and regression), round-6 combined review. I run checks and write receipts only. This receipt gives no verdict.

- Model: claude-sonnet-5-5 (Sonnet 5.5). Effort: not inspectable.
- Wall clock: first command 2026-10-10T18:24:12Z, last capture finished 21:44:15Z, receipt written 21:46Z (about 3 h 22 min; most of it was waiting for browser slots, since lanes L1/L2/L3 held 2 to 3 of the 3 slots for long stretches, plus the re-captures described below).
- Phase 2 (regression) has NOT been started. It waits for the orchestrator's resume.

## Where everything is

All paths are under `/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4/`.

| Item | Path |
|---|---|
| R6 standard sets (7 BEFORE configs + 844x390 light/dark) | `captures/R6/<config>/` |
| INT standard sets at 844x390 light/dark | `captures/INT/phone-844x390-{light,dark}/` |
| Warning sets, R6 (16) | `captures/R6/warning/<viewport>-<theme>-<text>pct/` |
| Warning sets, INT (16) | `captures/INT/warning/<viewport>-<theme>-<text>pct/` |
| Logs (every run's command line, stdout, slot-gate lines, the run tsv files, superseded passes) | `logs/` |
| Scripts used (copies; the live one is `/home/user/wt/rv6-r6/kettle/.tmp/L4/warning-captures.mjs`, git-ignored) | `tools/` |

Not captured here: the 7 BEFORE configs on INT. The existing BEFORE set at `/home/user/Vibei/kettle/review/product-excellence/integration/wave1/captures/<config>/` is to be reused for those (phase 2). Note on that set: its `capture-meta.json` files say base `http://localhost:5191`, revisions `455b6c6` (390x844 light) and `1bec1a8` (others), captured 2026-10-08. `git rev-parse 455b6c6:kettle/src` = `1fc4a1b`, the same `kettle/src` tree as INT `0d58c5e`, so the app code is the same; the tool/doc commits differ. I did not read any BEFORE image in this phase except `phone-390x844-light/10-break-over.png` (for the comparison note below).

## Revisions, ports, servers

| Name | Revision | kettle/src tree | Worktree | URL / port | Verified by orchestrator |
|---|---|---|---|---|---|
| R6 | trial merge `e866118` | `05bb3f8` | `/home/user/wt/rv6-r6/kettle` | http://127.0.0.1:5301 (5301) | yes (SETUP.md) |
| INT | `0d58c5e` | `1fc4a1b` | `/home/user/wt/rv6-int/kettle` | http://127.0.0.1:5303 (5303) | yes (SETUP.md) |

Each `capture-meta.json` / `meta.json` records `base` (URL), port, revision, viewport, DPR, theme, time and page errors. I did not stop or restart any server. Servers answered HTTP 200 at the start. Every browser launch went through `slots.py run --lane L4cap --n 1` (one Chromium per command). Every context is fresh with a disposable profile (`chromium.launch` without a user-data dir; a new context per state in the warning script).

## Counts

| Set kind | Sets | PNGs | Metas | Page errors |
|---|---|---|---|---|
| Standard, R6 (7 configs + 2 at 844x390) | 9 | 189 (9 x 21) | 9 `capture-meta.json` | 0 |
| Standard, INT at 844x390 | 2 | 42 (2 x 21) | 2 | 0 |
| Warning, R6 | 16 | 96 (16 x 6) | 16 `meta.json` | 0 |
| Warning, INT | 16 | 96 (16 x 6) | 16 | 0 |
| Total | 43 | 423 | 43 | 0 |

"22 standard states" is 21 PNGs plus `capture-meta.json` (22 files per config). The existing BEFORE sets hold the same 21 PNGs (ids 01, 01b, 02 to 10, 11, 11b, 12 to 19) plus meta. The reduced-motion set is in the 9 R6 standard sets (`phone-390x844-dark-reduced-motion`).

## Commands

Standard sets (from each revision's worktree; the tool is identical in both worktrees, `diff` empty):

```
cd <worktree>   # /home/user/wt/rv6-r6/kettle for R6, /home/user/wt/rv6-int/kettle for INT
python3 -I <round6-review>/tools/slots.py run --lane L4cap --n 1 -- \
  node review/product-excellence/tools/capture.mjs --base http://127.0.0.1:<5301|5303> \
  --out <L4>/captures/<R6|INT>/<config> --w <w> --h <h> --dpr <dpr> --theme <light|dark> [--rm]
```
Configs, in `tools/std-jobs.txt`: 390x844@2 light/dark, 375x667@2 light/dark, 1440x900@1 light/dark, 390x844@2 dark `--rm` (R6 only); 844x390@2 light/dark (R6 and INT). Run through `tools/run-one.sh` with 2 workers in parallel. Per-run command line is the first line of `logs/capture-<rev>-<config>.log`.

Warning sets (script written for this lane, `tools/warning-captures.mjs`; one invocation per set):

```
cd <worktree>
python3 -I <round6-review>/tools/slots.py run --lane L4cap --n 1 -- \
  node /home/user/wt/rv6-r6/kettle/.tmp/L4/warning-captures.mjs --base http://127.0.0.1:<port> --rev <R6|INT> \
  --wt <worktree> --out <L4>/captures/<rev>/warning/<w>x<h>-<theme>-<100|200>pct \
  --w <w> --h <h> --dpr <dpr> --theme <theme> --text <100|200>
```
Job lists `tools/warn-jobs-R6.txt`, `tools/warn-jobs-INT.txt` via `tools/run-warning.sh` (R6 worker from 18:28Z, INT worker from 18:49Z, one browser each). Re-captures: see "Re-captures" below (`tools/rerun-robust.sh`, `tools/rerun-a.sh` with the job lists).

### What the warning script does

- Profile as in `contracts/I03/capture-storage-full.mjs`: settings with `onboarded`, `scene: 'off'` (3D stills), no auto-starts, muted; `/?debug&theme=<t>[&nooktime=day for light]`; wait for the timer leader gate; `__kettle.seed('newbie')`; reload; save the timer.
- Context: viewport WxH, DPR as given, `isMobile` = W<900 and W<H (same rule as `capture.mjs` and the I03 script, so 844x390 is not mobile-emulated but has touch), `hasTouch` = W<900, `colorScheme` = theme.
- Text size 200 %: `html { font-size: 200% }` injected at DOMContentLoaded (computed `html` font size recorded: 16 px / 32 px, every state).
- Storage full (states a to d): I03's `fill()` writes 1 MB chunks, halving down to 8 bytes; a 64-byte write then throws `QuotaExceededError` (recorded as `quotaProbe`). States c2/d2 (extra, see below) run with storage not full.
- Debug API used for setup only: seed, filling the clock to the end of a phase (`nearEnd`, `finish`), setting leaves one below the next cozy level, timer save. Real input: typing the words, pressing "Put the kettle on", "End session" + the sheet's "End session", "Tea time". Ordinary toasts in b and c are raised through the app's own `ui:toast` event bus (`import('/src/lib/events.ts').emit`) with their default 3.2 s timers (no duration override); the storage-full warning is the app's own 12 s toast.
- States (files in each set dir): `a-home-warning`, `b-focus-warning-toasts`, `c-breakover-toasts`, `d-summary-levelup` (all with storage really full), plus `c2-breakover-toasts-storage-ok` and `d2-summary-levelup-storage-ok` (the same c and d with storage NOT full; added because the makers' own c/d captures were taken with storage not full, so a like-for-like pair exists).
  - a: type words, start brew, 2.5 s, End session (real clicks), Today with "Kettle's off" and the warning.
  - b: brew running 3 s, then two toasts ("Recipe done: Take 2 full tea breaks · +15 leaves", "New badge: Tea Time"), shot 1.1 s later.
  - c: brew to 0:00 (clock), summary, press "Tea time", the break runs out (clock), "Break's over" with "Mark it done, start fresh" visible (carried task "Chapter 3 notes"); natural toasts left to expire; the same two toasts raised; shot 1.1 s later.
  - d: leaves set to one below the next level; brew to 0:00; summary after the whistle (+2.5 s); the level-up card is on screen (level before/after in the meta).
- Screenshot: viewport-size PNG at full device resolution (`page.screenshot`, not full-page; document scroll size is in the meta, and the app is a fixed shell). Per state the meta holds: route, toasts before and after the shot (text, rect, opacity), the warning's rect, `page` (inner size, DPR, html font px, dark flag, doc scroll size, summary text), `capturedAt`, `shotMs`, attempts, `fullyDrawn`/`stable` flags, data state and quota probe.
- A shot counts as stable when the toast texts before and after the shot are identical and enough toasts were up (a: 1, or 2 in re-captures; b/c: 2); the script retries up to 3 times (5 to 8 in re-captures).

## Re-captures (what changed after the first pass, and why)

1. **Revision missing.** My first script version had a git typo that wrote `revision: "unknown"` into the first warning set (R6 `390x844-light-100pct`). It was re-run in full (19:08:13 to 19:11:56Z); the first run's log is `logs/warning-R6-390x844-light-100pct.first-run-revision-unknown.log`. Every other set was started after the fix.
2. **Toasts expiring or mid-fade during the shot (first pass).** The first pass shot after a fixed wait. At 1440x900 the CPU renderer sometimes took 2.6 to 3.9 s to produce a frame (`shotMs`), longer than the 3.2 s "Kettle's off" toast, and the machine was shared with other lanes. An audit of toast opacity before and after every one of the 192 shots found 17 states with a toast mid-fade or expired during the shot. I re-captured those with `--robust 1`.
3. **State a, geometry not settled.** Re-reading the re-captures I found a second problem: a first re-capture method (resting a real pointer on the "Kettle's off" toast to hold its timer) and the first polling method (shoot as soon as both toasts are at opacity >= 0.9) gave toast boxes that were not in their settled place (R6 `844x390-light-200pct/a` came out with the warning 57 px above the viewport; six repeat runs of the same state all give top = 8 px). I discarded those and re-captured every state-a shot from a hover-held or polled pass (14 sets, seven of the 1440x900 ones a second time) with: poll every 50 ms until both toasts are at opacity >= 0.9 AND neither moved for 300 ms, then shoot at once; the shot only counts if no toast moved more than 1 px during it; retry up to 8 times. (Logs: `logs/rerun-*`; `pass1` to `pass6b` folders are superseded passes, the top-level `warning-rerun-robust-*.log` files are the last ones; each set's `meta.json` has a `rerun` list.)
4. **1440x900, state a: six frames are warning-only.** At 1440x900 the "Kettle's off" toast (3.2 s) expires before a settled frame can be taken in 6 of the 8 sets (R6 `1440x900-dark-100pct`, `1440x900-light-100pct`; INT `1440x900-{light,dark}-{100,200}pct`), even with 8 retries. For these the accepted frame is the warning alone, fully drawn and still (`--needa 1`); the other 26 state-a frames show the warning and "Kettle's off". The two light 100 % ones (R6 and INT) were shot with Playwright `animations: 'disabled'` (infinite CSS animations cancelled during the frame; meta `screenshotAnimations: disabled`) because their frames took 2 to 4 s otherwise. Everything else uses the default.

## Flagged (4 of 192 warning states fail "same toasts, all fully drawn and still before and after the shot")

| Set | State | What the meta shows |
|---|---|---|
| INT `375x667-dark-200pct` | b | warning toast appears during the shot (before: 2 toasts, after: 3, opacity 0.71; boxes moved) |
| INT `375x667-light-200pct` | b | warning toast opacity 0.0 before, 0.57 after: mid-transition |
| INT `390x844-dark-200pct` | b | warning toast opacity 0.84 before, 0.02 after: mid-transition |
| INT `390x844-light-200pct` | b | warning toast absent before, opacity 0 after: mid-transition |

These four are not capture noise alone: in INT the warning toast is added and removed by the app while the two ordinary toasts are up (its opacity moves between the two reads on each of 5 retries). One frame cannot be "settled". If the Lead wants the sequence, a frame burst of those four is cheap; I have not taken one.

How to read the tables: "toasts" is the number of toast `li` elements in the DOM. A toast box can be clipped by the toast stack itself; see the notes below (R6 844x390 at 200 %).

## Samples opened (step 4)

I opened these PNGs with the Read tool and checked them against their claims:

- Standard: R6 `phone-390x844-light/10-break-over`; BEFORE `phone-390x844-light/10-break-over` (for comparison); R6 `phone-390x844-dark/03-focus-mid`; R6 `phone-390x844-dark-reduced-motion/06-whistle`; R6 `phone-375x667-light/08-summary-end`; R6 `phone-375x667-dark/09-break`; R6 `desktop-1440x900-light/11-summary-unlock`; R6 `desktop-1440x900-dark/01-home`; R6 `phone-844x390-light/05-focus-added`; R6 `phone-844x390-dark/07-summary`; INT `phone-844x390-light/10-break-over`; INT `phone-844x390-dark/16-stats-populated` (full-page).
- Warning: R6 `390x844-light-100pct/{b,d}`, `390x844-light-200pct/{a,c}`, `375x667-dark-100pct/a`, `1440x900-light-100pct/{a,b}`, `1440x900-dark-100pct/a`, `844x390-dark-200pct/{a,c}`, `844x390-light-200pct/a`; INT `390x844-light-100pct/b`, `375x667-dark-100pct/c`, `1440x900-light-100pct/a`, `844x390-dark-200pct/a`.
- Result: each shows the route, theme, viewport and state it claims (summary with the level-up card "Fairy lights is in your nook / Cozy level 5" in d; carried-task "Mark it done, start fresh" in c; the warning toast "Kettle couldn't save your latest changes: this browser's storage is full" in a). 200 % text is visibly larger (html 32 px in every meta).

## Things I noticed while opening samples (facts, not verdicts; for the Lead)

1. Standard `10-break-over`, R6 `phone-390x844-light`: a "Recipe done: Take 2 full tea breaks · +15 leaves" toast covers the sentence "Ready for another brew of Chapter 3 notes?". The existing BEFORE image has no toast and shows the sentence. The tool shoots 2.6 s after the break ends and the toast lives 3.2 s, so this is timing-sensitive; phase 2 should settle it with an INT re-capture of that state at the same load (`capture.mjs --only 10`) before treating it as a change.
2. Warning in state b (focus running with toasts): in R6 the warning is not in the DOM in any phone-width or 844x390 set, nor at 1440x900 with 200 % text (`-` in the table); it is on screen with two toasts (3 in all) at 1440x900 100 % (light, dark). In INT it is in the DOM in every set (and flaps in four, see Flagged).
3. R6 state b on phones (e.g. `R6/warning/390x844-light-100pct/b-focus-warning-toasts.png`): the two ordinary toasts sit over the countdown digits (only the top of "24:56" shows above the first toast; the status line is hidden behind the second). The INT twin has the toasts above and the warning below them over the digits.
4. R6 state a at 844x390 with 200 % text (light and dark, same geometry in 6 repeat runs): the warning box sits inside the viewport (`[195,8,635,170]`, 162 px high); in the PNG its text is clipped by the box (about three lines of five or six are visible, and the "Save backup" button overlaps the third); "Kettle's off" is in the DOM (box `[202,178,628,235]`) but is not visible in the PNG. In INT the same state has the warning box 289 px above the viewport (`[195,-289,635,172]`, the first lines are off-screen).
5. In R6 no toast or warning box in any of the 192 states lies outside the viewport (scan of the metas' rects). In INT these do (warning/toast tops above 0): state a at 390x844 and 375x667 and 844x390 with 200 % text (warning tops -203, -380, -289), state b at 1440x900 with 200 % (top -75), at 844x390 200 % (top -290), and the ordinary toasts at 375x667 / 390x844 with 200 % in state b (tops down to -402).
6. State c (Break's over with toasts) at 375x667 dark 100 %: INT (`INT/warning/375x667-dark-100pct/c-breakover-toasts.png`) has the two toasts over "Ready for another brew of ..." and over "Mark it done, start fresh"; R6 (`R6/warning/375x667-dark-100pct/c-breakover-toasts.png`) shows the toasts above "Mark it done, start fresh" and the "Put the kettle on" button, both visible, but the title "Break's over" and the sentence are not visible (the toasts start right under the stage). INT: title visible, sentence and "Mark it done" covered.

## Per-set listings


### Standard sets

| Rev | Port | Set (path under `captures/<rev>/`) | PNGs | page errors | start (UTC) | end (UTC) |
|---|---|---|---|---|---|---|
| R6 | 5301 | `desktop-1440x900-dark` (1440x900@1, dark; rev e866118) | 21 | 0 | 18:30:42 | 18:36:24 |
| R6 | 5301 | `desktop-1440x900-light` (1440x900@1, light; rev e866118) | 21 | 0 | 18:30:39 | 18:34:29 |
| R6 | 5301 | `phone-375x667-dark` (375x667@2, dark; rev e866118) | 21 | 0 | 18:28:09 | 18:30:39 |
| R6 | 5301 | `phone-375x667-light` (375x667@2, light; rev e866118) | 21 | 0 | 18:28:08 | 18:30:42 |
| R6 | 5301 | `phone-390x844-dark` (390x844@2, dark; rev e866118) | 21 | 0 | 18:24:43 | 18:28:09 |
| R6 | 5301 | `phone-390x844-dark-reduced-motion` (390x844@2, dark, reduced motion; rev e866118) | 21 | 0 | 18:34:29 | 18:38:54 |
| R6 | 5301 | `phone-390x844-light` (390x844@2, light; rev e866118) | 21 | 0 | 18:24:43 | 18:28:08 |
| R6 | 5301 | `phone-844x390-dark` (844x390@2, dark; rev e866118) | 21 | 0 | 18:38:54 | 18:43:19 |
| R6 | 5301 | `phone-844x390-light` (844x390@2, light; rev e866118) | 21 | 0 | 18:36:24 | 18:39:37 |
| INT | 5303 | `phone-844x390-dark` (844x390@2, dark; rev 0d58c5e) | 21 | 0 | 18:43:19 | 18:49:27 |
| INT | 5303 | `phone-844x390-light` (844x390@2, light; rev 0d58c5e) | 21 | 0 | 18:39:37 | 18:45:51 |

### Warning sets

Cell = toasts on screen after the shot / `W` if the storage-full warning was one of them (`-` if not) / attempts used. `!` = flagged (see notes).

| Rev | Set (path under `captures/<rev>/warning/`) | PNGs | a home | b focus | c break-over | d level-up | c2 (storage ok) | d2 (storage ok) | page errors | first run start-end (UTC) |
|---|---|---|---|---|---|---|---|---|---|---|
| R6 | `390x844-light-100pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:08:13-19:11:56 |
| R6 | `390x844-light-200pct` | 6 | 2/W/2 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:30:02-18:31:39 |
| R6 | `390x844-dark-100pct` | 6 | 2/W/3 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:31:39-18:34:09 |
| R6 | `390x844-dark-200pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:34:09-18:38:08 |
| R6 | `375x667-light-100pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:38:08-18:42:03 |
| R6 | `375x667-light-200pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:42:03-18:47:08 |
| R6 | `375x667-dark-100pct` | 6 | 2/W/5 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:47:08-18:52:02 |
| R6 | `375x667-dark-200pct` | 6 | 2/W/2 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:52:02-18:55:44 |
| R6 | `1440x900-light-100pct` | 6 | 1/W/2 | 3/W/1 | 2/-/2 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:55:44-19:01:30 |
| R6 | `1440x900-light-200pct` | 6 | 2/W/3 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:01:30-19:04:25 |
| R6 | `1440x900-dark-100pct` | 6 | 1/W/1 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:04:25-19:07:51 |
| R6 | `1440x900-dark-200pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:07:51-19:10:40 |
| R6 | `844x390-light-100pct` | 6 | 2/W/3 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:10:40-19:15:01 |
| R6 | `844x390-light-200pct` | 6 | 2/W/2 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:15:01-19:17:51 |
| R6 | `844x390-dark-100pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:17:51-19:20:31 |
| R6 | `844x390-dark-200pct` | 6 | 2/W/1 | 2/-/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:20:31-19:23:34 |
| INT | `390x844-light-100pct` | 6 | 2/W/1 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:49:33-18:53:32 |
| INT | `390x844-light-200pct` | 6 | 2/W/2 | 3/W/5 ! | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:53:32-18:58:15 |
| INT | `390x844-dark-100pct` | 6 | 2/W/1 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 18:58:15-19:02:52 |
| INT | `390x844-dark-200pct` | 6 | 2/W/1 | 3/W/5 ! | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:02:52-19:05:46 |
| INT | `375x667-light-100pct` | 6 | 2/W/1 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:05:46-19:09:13 |
| INT | `375x667-light-200pct` | 6 | 2/W/1 | 3/W/5 ! | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:09:13-19:13:10 |
| INT | `375x667-dark-100pct` | 6 | 2/W/6 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:13:10-19:16:25 |
| INT | `375x667-dark-200pct` | 6 | 2/W/1 | 3/W/5 ! | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:16:25-19:19:12 |
| INT | `1440x900-light-100pct` | 6 | 1/W/1 ! | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:19:12-19:22:14 |
| INT | `1440x900-light-200pct` | 6 | 1/W/3 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:22:14-19:25:31 |
| INT | `1440x900-dark-100pct` | 6 | 1/W/1 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:25:31-19:27:05 |
| INT | `1440x900-dark-200pct` | 6 | 1/W/5 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:27:05-19:28:34 |
| INT | `844x390-light-100pct` | 6 | 2/W/2 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:28:34-19:30:06 |
| INT | `844x390-light-200pct` | 6 | 2/W/2 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:30:06-19:31:41 |
| INT | `844x390-dark-100pct` | 6 | 2/W/2 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:31:41-19:33:18 |
| INT | `844x390-dark-200pct` | 6 | 2/W/1 | 3/W/1 | 2/-/1 | 0/-/1 | 2/-/1 | 0/-/1 | 0 | 19:33:18-19:34:37 |

Warning PNGs total: 192

## Known limits of this phase

- Single-frame captures of states with timers: the shipped toast timers are real, so each frame is a moment, not a sequence. The meta of each state gives before/after toast lists with opacity and boxes.
- I did not diff any R6 and INT images in this phase (phase 2). I did not use the makers' captures, scripts or reports; the structure of the warning script follows the I03 `capture-storage-full.mjs` the brief named, and the state list follows the brief.
- The machine was shared: load average reached 14 while L1/L2/L3 ran. Captures are CPU-rendered (SwiftShader). Timings in the metas reflect that load.
