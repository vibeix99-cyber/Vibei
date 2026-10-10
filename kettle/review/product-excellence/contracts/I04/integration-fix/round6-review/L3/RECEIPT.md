# L3 (behaviour and accessibility), round-6 combined review: RECEIPT

**Status: see "Coverage" below.** This receipt records measurements only. It issues no APPROVE or REJECT and classifies nothing as blocking.

- **Lane:** L3. I implemented nothing under review, edited no application code, tests or maker files, committed nothing and pushed nothing.
- **Wall clock (UTC):** start 2026-10-10T18:24:08Z; end 2026-10-10T22:46:01Z (see the last line).
  - About 71 minutes of that was spent waiting for browser slots (L3 has the lowest priority among the lanes: first slot at 19:35:29Z).
- **Model / effort:** model `claude-sonnet-5-5` (Sonnet 5.5). Effort: the harness header shows `reasoning_effort 30`; the unit and scale are not documented to me, so otherwise "not inspectable".
- **Host:** 4 CPUs, load average 12–16 during the runs (other lanes), CPU SwiftShader, Chromium headless via Playwright. All timings are pessimistic and `requestAnimationFrame` stalls: max frame gaps of 0.1–0.7 s on phone runs and 1–4 s on 1440×900 runs. Where that matters I say so and used DOM-event timelines (MutationObserver) instead of frame sampling.

## Revisions and servers (never stopped or restarted by me)

| Name | Commit | Dev server (debug API) | Production preview |
|---|---|---|---|
| R6 | `e866118` | http://127.0.0.1:5301 | http://127.0.0.1:5321 (3f only) |
| INT | `0d58c5e` | http://127.0.0.1:5303 | http://127.0.0.1:5323 (3f only) |

## Rules followed

- Fresh browser context and disposable profile for every run (many runs per browser process, one context each).
- Every browser command went through `slots.py run --lane L3 --n 1`. No Playwright test runner was used, so no `--output` directory was needed.
- Real input for everything the checks are about: real clicks, `keyboard.press`, `mouse.wheel`, real `goBack`, `setFiles` through the real file chooser. Toasts expired on their real timers. No programmatic scrolling (the only scrolling is real wheel events). No held toasts. I never changed a toast timer.
- Debug API used for setup only: `?debug&seed=newbie` through `__kettle.seed('newbie')` (then reload), `timer.setState({})` so a saved timer exists, `settings.set(...)` in 3c, and `__kettle.ff(...)` to bring a 25-minute brew or a break to within 50 ms of its end (the last 50 ms run on the real clock), or to add 12 active minutes ("End later", m1).
  - `kbd.mjs` (3a) starts the brew and ends it within the first minute through `timer.startFocus` / `timer.end('user')`, as M2's `kbd6.mjs` does, so the start state is comparable. Everything after that is real key presses.
  - All other probes start with a real click on "Put the kettle on" and end with a real click on "End session".
- Storage full: localStorage filled to a real `QuotaExceededError` with `filler*` keys (the technique in `capture-storage-full.mjs`).
- Large text: `html{font-size:200%!important}` injected at DOMContentLoaded.

## Probes (sha256 in `probes-sha256.txt`; copies in `probes/`)

All under `/home/user/wt/rv6-r6/kettle/.tmp/L3/` (git-ignored); copied unedited to `L3/probes/`. Hashes at the end of the run:

```
d4e3e519…  back.mjs          9fa79e47…  back2.mjs         9dd06c80…  blink.mjs        146fe45c…  blink2.mjs
32076a43…  cls.mjs           d8ad6465…  flash.mjs         185e6467…  flash2.mjs       e36e04f1…  focus.mjs
74340cb5…  g.mjs             392fdb46…  kbd.mjs           cc8e837a…  lib.mjs          80a5e5dc…  m1.mjs
4d381473…  nextbrew.mjs      b258229d…  scrollhold.mjs    9ef8f4a9…  sweep.mjs
batches: run-3a.sh 89b92152…  B1.sh 29efb6c5…  B2.sh e0fe2a5c…  B3.sh 151dd2f7…  B4.sh 44f78190…  B5.sh 931ebb62…
```

(Full 64-hex values: `probes-sha256.txt`.)

Two honest caveats about those hashes:
- `m1.mjs` gained an `--only` suffix on its output names (after B2; no scenario changed) and `B5.sh` ran the gap fillers; `focus.mjs` gained scenario C6 and a log-name change after batch B2 had run; `lib.mjs` gained the recorder-v2 export (appended) after batch B1 had started. The earlier text of those two files is not preserved; the additions are append-only and the B2/B1 scenarios are unchanged.
- The Checker's and M2's probes were not used; these are my own.

## Runs (every run: URL, port, revision, probe, input, configuration, result)

Browser for every run: Playwright Chromium (headless shell, SwiftShader args), emulated viewports (phones `isMobile`+touch, dpr 2; desktop dpr 1). Raw logs are the `*.log` / `*.json` files named below, under `L3/<check>/`; the batch drivers' stdout (B1 = `smoke.out`, run-3a, B2–B5) is in `L3/batch-logs/`. Batch order and times (UTC): 3a matrix 19:35–19:40; B1 (3a cause, 3b v1, 3d v1, 3e v1) 21:44–21:58; B2 (1, 2) 21:49–22:10; B3 (3a sweep, 3g, 3f, 3c) 22:05–22:20; B4 (3b v2, 3d v2, 3e v2, C6) 22:20–22:40; B5 (gap fillers) 22:41–22:44.

| Check | Probe | Rev / URL | Input and configuration | Result files |
|---|---|---|---|---|
| 1 | `m1.mjs --vp=phone` and `--vp=desktop` | R6 :5301, INT :5303 | 375×667 and 1440×900, light, 100 %. Real clicks, file chooser, End sheet. 9 scenarios each | `1/m1-{R6,INT}-{phone,desktop}.{json,log}`, PNGs |
| 2 | `focus.mjs` (C1–C5, F3a–F3d), then `focus.mjs --only=C6` | R6, INT | 375×667 phone and 1440×900 for F3a; 100 % and 200 % | `2/focus-{R6,INT}.{json,log}`, `2/*C6*` |
| 3a | `kbd.mjs` | R6, INT | 375×667; 100 % and 200 %; Tab and Shift+Tab; light, and dark for Tab; 500 ms gap, up to 45 presses; 50 ms state series | `3a/kbd-*.{json,log}`, PNGs, 4 webm |
| 3a (cause) | `scrollhold.mjs`, `sweep.mjs` | R6, INT | 375×667, 100 %, real wheel in 25 px steps (down, then up) with the warning up | `3a/*-scrollhold-*`, `3a/*-sweep-*` |
| 3b | `blink.mjs` (frame sampling), `blink2.mjs` (DOM events) | R6, INT | 375×667, 200 %, Tab until Save backup, 5 and 6 fresh contexts | `3b/blink-*`, `3b/blink2-*`, webm |
| 3c | `nextbrew.mjs` | R6, INT | autoStartFocus on; seed veteran (also celebrate, newbie, atRisk, blank on R6 375×667); 375×667, 390×844, 1440×900 | `3c/nextbrew-*`, webm |
| 3d | `flash.mjs` (frames), `flash2.mjs` (frames + DOM-change samples) | R6, INT | start 375×667 @200 %; resume 1440×900 @200 %; start 1440×900 @200 %; resume2 (warning up on Today first) 1440×900 @200 % | `3d/flash-*`, `3d/flash2-*`, webm |
| 3e | `back.mjs`, `back2.mjs` | R6, INT | 375×667, 100 % (8 runs, v1 and v2) and 200 % (4 runs, v1 and v2; INT v2 blocked); real `goBack` then real tap on "Back to your brew" | `3e/back-*`, `3e/back2-*`, webm |
| 3f | `cls.mjs` | R6 :5321, INT :5323 (production previews) | 390×844 and 375×667; 200 % and 100 %; normal fonts and woff2 delayed 2.5 s; 3 cold contexts each; veteran seed | `3f/cls-*` |
| 3g | `g.mjs` | R6, INT dev | 375×667, 390×844, 1440×900; light and dark; 100 % and 200 % | `3g/g-*`, PNGs |

## Coverage

Covered, with data on R6 and INT: 1, 2, 3a, 3b, 3c, 3d, 3e, 3f, 3g (all nine). Points where one revision has no numbers are stated inline (3e at 200 % on INT). Everything is a measurement, not a pass or a fail; the lead classifies.

---

## Check 1: M1 behaviour (storage full)

Source: `1/m1-*.json`. "Phone" 375×667, "Desktop" 1440×900. Warning = "Kettle couldn't save your latest changes: this browser's storage is full. Save a backup to keep them."

| Observation | R6 | INT |
|---|---|---|
| Warning appears (storage full, brew started by a real tap) | Phone: held for the whole brew (0 of 16 samples; 0 frames over anything). Desktop: shown from about 1.0 s, beside the panel, 0 ms over the readout or controls. | Phone: shown from about 1.0 s **over the countdown for 6.8 s** (rAF: warning over "24:59 … 24:52"). Desktop: shown from about 2.0 s, 0 ms over the readout. |
| End within the first minute | Phone and desktop: sheet says "under a minute, so there's nothing to save yet". Today shows the warning (phone 26–349 × 385–495, above the dock; desktop 506–919 × 578–650). Sessions 6 → 6, storage unchanged, Save backup downloads a file with 6 sessions. | Desktop: identical, plus 767 ms of the warning over "Put the kettle on" in the recorder. Phone: the first run (`m1-INT-phone.json`) errored ("download" timeout when clicking Save backup); a re-run of that scenario alone (`1/m1-INT-phone-only-endFirstMinute.json`, 22:41Z) passed: warning on Today at 16–359 × 304–421, sessions 6 → 6, storage unchanged, backup file has 6 sessions. In that re-run the recorder (started before the brew) saw the warning over Add 5 / Pause / End and the countdown for 6.45 s during the brew; R6's re-run: 0 ms, same Today result. |
| End later (12 active minutes, storage full) | Sheet: "12 minutes of focus will be saved". Today: "Saved 12 minutes of focus" plus the warning. In memory 6 → 7 sessions, exactly one record for this brew (`completed:false`, 726 s), storage unchanged. Same on desktop. | Same numbers (7 sessions, one record, storage unchanged), phone and desktop. |
| Dismiss the End sheet (Esc, backdrop click at (4,4), Keep brewing) | Brew unchanged after each (status running, same id and `endsAt`), phone and desktop. Phone 0 ms of warning over anything. | Same (all three keep the brew). Phone: **9.0 s** of the warning over the countdown during this scenario (4 segments of 1.5–3.4 s). |
| Brew completes with storage full (whistle, summary, Tea time, break, Skip break, Today) | Summary heading mounted **once** (1 mount of "25 minutes brewed"). In memory exactly 1 record for the brew; storage unchanged at the summary; warning not shown on the whistle or summary (0 ms over controls); Tea time starts the break (`shortBreak`, no warning); after Skip break the warning is on Today (phone 16–359 × 372–489; desktop 493–933 × 357–434). Save backup file contains the brew once. After making room and an export, then a reload: stored sessions 7, record for the brew once, ledger `focus:…`, `full:…` once each. | Summary once; 1 record; storage unchanged at summary; Tea time works. Phone: warning visible during the brew and the whistle, **5.3 s over the countdown and the whistle readout** (`0:04 Almost whistling…`, `Tea's ready!`) and 217 ms over Skip break / Pause break / Start next brew. Phone Today after Skip: warning shown. Desktop Today: **no warning** after Skip break (it was shown during the brew and had run out); Save backup then done through Settings › Export. After making room, export, reload: 7 sessions, one record, same ledger ids. |
| Same with storage OK (control) | Summary once, 1 record, **persisted** (stored sessions include the new id at the summary; after reload 7 sessions, 1 record, ledger `focus:`/`full:` once). | Same. |
| Restore / import, storage full, "Add" | Inline alert (role=alert): "Kettle couldn't save the backup: this browser's storage is full. Nothing was changed." Memory 6 → 6, `s_from_backup` not present, storage unchanged, no second warning toast, not present after reload. | Identical text and result. |
| Restore / import, storage full, "Replace" | Same alert text; nothing changed; not present after reload. | Identical. |
| Import, storage OK, "Add" | Toast "Added 1 brew from your backup." with Undo; memory 6 → 7; present after reload. | Identical. |
| Page errors | 0 in every scenario. | 0 in every scenario. |

Screenshots: `1/*.png` (sheet, Today, summary, break, import states).

## Check 2: focus and announcements

Source: `2/focus-{R6,INT}.json` (+ `.log`), `2/*C6*`. Focus is logged with `focusin` / `focusout` events and a 50 ms sampler.

**Focus survives a transient toast expiring (R6 = INT).**
- C1, Settings: "Export a backup" raises "Saved kettle-backup-….json" (real timer, 3.3 s). Real Tab moved focus to "Import a backup"; after the toast expired, focus was on the same control. R6 and INT identical.
- C2, Today with "Kettle's off" (3.2 s): focus in the text box, typed "abc", toast expired, typed "def": value "abcdef", no `focusout` to body after the box took focus. R6 and INT identical.
- C3, Today with the 12 s warning plus "Kettle's off": same. No focus loss on either toast expiring (warning expired 11.1 s after typing on R6, 8.8 s on INT). Value "abcdef".
- C3b, same at 200 %: same result. Playwright's click on the text box did not complete until the warning had left (17 s after Today appeared on both revisions), which I infer means the warning overlaps that box at 200 % on Today (not separately hit-tested).

**Focus inside a toast that expires (the warning's "Save backup").**
- 200 %, Tab (R6 reached after 16 presses; INT after 17): while focus is in "Save backup" the toast's timer is paused: the warning was up in 40 of 40 samples over 16 s, on both. After leaving with Tab, focus goes to `body` (the warning is the last tab stop): the warning then expired 12.2 s later (R6) / 5.7 s later (INT) and focus stayed on `body`.
- 100 %, Shift+Tab (7 presses on both): 40 of 40 samples up while focused. Leaving to "Change brew length": **R6** withdrew the warning 349 ms later and re-showed it 101 ms later (fresh 12 s, gone after 12.2 s); **INT** removed it 285 ms after leaving and did not re-show. Focus stayed on "Change brew length" on both.
- C5, Enter on "Save backup" (R6, 200 %): the download starts; the warning is dismissed and focus drops to `body`; the next Tab goes to the top ("Skip to content"). On INT at 200 % Save backup was **not reached in 40 presses** in this run.
- C6, focus inside "Save backup" (100 %, Shift+Tab, 7 presses) and then real wheel scrolls of 100 px: the warning is withdrawn when the dock reaches the 60 % boundary and **focus drops to `body`** (`focusout` to body, then the `li` removed 1 ms later), on both revisions. R6 at scrollY 300 (focus lost) took the warning away and re-showed it twice (removed 9212 ms, re-added 9293; removed 9713, re-added 10295); INT removed it once (9086) and re-showed it 1.1 s later (10163). Absent at scrollY 400 and 500 on both, present at 600+. Focus stayed on `body` afterwards: the keyboard user loses their place if the warning is withdrawn under focus (present on both).

**Announcements (MutationObserver over every `aria-live` / `role=status|alert|log` region; 15 s windows).**

| Window | R6 warning added to the Notifications live region | INT |
|---|---|---|
| F3a desktop 1440×900 @100 %, brew running (countdown re-rendering every second), warning up beside the panel | **1** addition, 0 text mutations, removed at 13.7 s (its own 12 s timer) | 1 addition, 0 text mutations, removed at 13.9 s |
| F3a2 desktop @200 % | 0 (held during the brew) | 1 |
| F3b phone Today with warning (re-rendering at rest) | 1 (plus "Kettle's off" 1) | 1 (plus "Kettle's off" 1) |
| F3c phone, brew running | 0 (held) | 1 (shown over the countdown; removed at 13.5 s) |
| F3d phone Today, Tab cycle (warning taken away and re-shown) | 2 (initial, plus re-show at 15.5 s) | 2 |
| C3b/C4/C5 phone Today @200 % with "Kettle's off" (6–17 s) | 2–3 additions | **5–6 additions** (taken away and re-shown about every 0.7 s for the first 5 s) |

The "status[polite]" live region that announces "Kettle's on. Focus session started" received one addition in every run. In no run did a re-render change the text of an existing warning (0 `characterData` mutations). Each removal and re-show of the warning is one extra addition, i.e. one extra announcement.

---

## Check 3: known residuals, R6 and INT

### 3a. Tab and "Save backup" at 375×667

Raw evidence (all in `3a/`): per-Tab focus order, focused box, scroll position, document height, the warning box, the replica of `toastLiftBottom()` (lift value), M1's zone and the controls it overlaps, plus a 50 ms series of transitions and the `li` added/removed timeline. Files: `kbd-<rev>-375x667-t<text>-<theme>-<key>.{log,json}`.

**Result per configuration**

| Configuration | R6 | INT |
|---|---|---|
| 100 %, Tab, light | **Not reached in 45 presses** (3 full cycles) | **Not reached in 45 presses** |
| 100 %, Tab, dark | Not reached | Not reached |
| 100 %, Shift+Tab, light | Reached after 7 presses; Enter downloads `kettle-backup-…json` | Reached after 7; downloads |
| 200 %, Tab, light | **Reached after 14**; focus ring visible; Enter downloads | **Not reached in 45** (warning taken away at 6.97 s and never re-shown in the window) |
| 200 %, Tab, dark | Reached after 14; ring `solid 3px rgb(143,208,255)`, offset 3 px | Reached after 14 (no removal that run) |
| 200 %, Shift+Tab, light | Reached after 7 | Reached after 7 |
| 200 %, Tab, all attempts (kbd light+dark, blink 5 + blink2 6, C4, C5) | **Reached 15 of 15** | **Reached 6 of 15** |

Visible focus (`:focus-visible` true): `solid 3px rgb(36,119,184)` light (4.55:1 against the page), `solid 3px rgb(143,208,255)` dark (10.0:1), offset 3 px, identical on R6 and INT (`3a/kbd-*-save-backup-focused.png`, and the same as `3g` rings).

**M2's measured cause, from the raw R6 / 100 % / light / Tab run (`kbd-R6-375x667-t100-light-Tab.log`):**

1. Tab 11 "25 min Classic" at scrollY 223. **Tab 12** focuses "Put the kettle on · 25 min"; the page scrolls 223 → **513**.
2. Before: the docked start `[data-toast-above]` at 499–599, lift 178, zone [319,489], hits none. After: dock at about 235–335 in flow; its bottom 335 is not below 60 % of 667 (400.2), so `toastLiftBottom()` is **null**; the zone falls back to the region's stylesheet bottom and becomes [311,481], which overlaps "Change brew length" at 301–325 (`hit: ["Change brew length@301-325"]`).
3. The 50 ms sampler first sees scrollY 513 at 5801 ms (lift already null, zone [319,489]; [311,481] from 5851 ms). The warning's `li` leaves the DOM at 6190 ms (389 ms after the first sample, i.e. one 250 ms watch tick plus the 160 ms exit fade). Tab 12 itself is logged at 6281 ms (the logging round trip lags the key press).
4. Tab 13 focuses "Change brew length"; Tab 14 leaves the document (`body`); Tabs 15–19 skip link and tab bar; Tab 20 is the status bar at scrollY 0.
5. Back at scrollY 0 the lift returns (178), the zone clears and the warning is re-shown at 10015 ms (3.8 s after it was withdrawn). The cycle repeats (second removal 15941, re-show 19767).
6. INT shows the same cycle at 100 % (removed 6485 / re-added 10315 / 16483 / 20810; INT's own zone code differs, so its replica "hit" column is not meaningful).

**Confirmed:** the mechanism (60 % rule → lift null → stylesheet-bottom zone overlapping "Change brew length" → withdraw). **Refuted in one detail:** 513 is **not "the page's end"**. The real wheel sweep (`3a/*-sweep-t100.{log,json}`, 25 px steps, document max scroll **754**) shows the warning is absent only for scrollY ≈ 500–550 going down (R6: 475 present, 500, 525, 550 absent, 575 present) and 504–554 coming up. In that window the dock's bottom (377, 352, 327 at 500/525/550) is no longer below 400.2 (60 % of 667) and "Change brew length" (343–367 … 293–317) lies inside [311,481]; at 575 it is at 268–292, above the zone, and the warning returns. Tab 12 lands at 513, inside the window. So the hold is a scroll **window** (about 480–560 px of a 754 px range), not "the end". **No Tab is needed**: a real wheel scroll through that window withdraws and re-shows the warning too (and `scrollhold.mjs` at 100 px steps saw an `li` removal followed by a re-add 67 ms later on R6 and 76 ms later on INT as the dock started to move at scrollY 300, consistent with the 250 ms lift poll lagging the moving dock; that probe does not distinguish which toast the `li` was).

**R6 against INT:** at 100 % the same (forward Tab never reaches it; Shift+Tab does). At 200 % R6 is better (reached 15 of 15 against 6 of 15 on INT). The sweep window is narrower on R6 (absent 500–550) than on INT (absent from 325 to 550 going down, 304–554 coming up: INT's warning follows the dock less well).

Videos (full-run recordings, not trimmed): `3a/video-3a-{R6,INT}-375x667-t{100,200}-light-Tab.webm`.

### 3b. Blink on Tab at 200 % text (375×667)

- **Frame sampling (`blink.mjs`, 5 runs per revision): found nothing** (0 of 5 on R6; 0 of 5 on INT), because frames stalled under load (max gap 100–733 ms on R6, up to 650 ms on INT). I do not rely on it; the log is kept (`3b/blink-*.log`).
- **DOM events (`blink2.mjs`, 6 runs per revision, no sampling loss):**

| | R6 | INT |
|---|---|---|
| Warning taken away on the Tab press before "Save backup" (press 15 on R6; 15–17 on INT) | 5 of 6 runs | 4 of 6 runs, **never re-shown** |
| Time the `li` is absent (removed → re-added) | **60.9, 72.3, 72.9, 90.6, 91.1 ms** | not re-shown in any of the 4 runs |
| Visible disturbance (opacity below 0.99, exit start → fade-in complete) | 516–550 ms | n/a |
| Entry flicker (taken away and re-shown within 1.1 s of first appearing) | 0 of 6 | 2 of 6 (330 ms and 268 ms absent; 1.8 s and 0.8 s of dip) |
| Reached "Save backup" | 6 of 6 | 2 of 6 |

  R6's absent time matches M2's 73–92 ms. The same blink was also seen in `kbd.mjs` runs (74 ms light, 79 ms dark) and in C4. R6 is better than INT here.
- Videos: `3b/video-3b-{R6,INT}-375x667-t200-Tab.webm` (v1 runs) and `3b/video-3b2-*` (v2 runs).

### 3c. "Next brew" toast over the status line

Probe: `nextbrew.mjs` (veteran seed; the other seeds gave no toast on the next brew: celebrate, newbie, atRisk, blank on R6 375×667). The toast is "Recipe done: Take 2 full tea breaks · +1", raised when the tea break completes while "Next brew" is on, so it lands on the running next brew.

| Viewport | R6 | INT |
|---|---|---|
| 375×667 | Present: toast box 16–359 × 435–491 over the readout (344–493); covers the status line (111–265 × 446–468): **61 frames**, max overlap 3570 px² (the whole status line), the clock 57 frames, the meta line 61 frames. Shown 3.6 s. | Present, same box; status line 93 frames (3.5 s), plus 12–15 px² touching Add 5 / Pause / End for 2 frames |
| 390×844 | Present: box 16–374 × 589–645 over the status line (105–285 × 584–610), 140 frames | Present, same, 148 frames |
| 1440×900 | Not over the status line (toast 521–920 × 470–522, readout at x 1019–1291) | Same |

R6 and INT: same on the status-line overlap (frame counts differ only with the stalled frame rate); R6 has no contact with the control row. Files: `3c/nextbrew-*.json`, end-state PNGs, `3c/video-3c-{R6,INT}-375x667-veteran.webm`.

### 3d. Flash over the countdown at 200 % text

Method: per-frame (v1) and frame-plus-DOM-change (v2) recorder of the warning's effective opacity and its box against the countdown readout (the parent of `role="timer"`), session controls and Today's docked controls. Note: on the session route the recorder also counts the controls of the **leaving** Today layer while it dissolves (names such as "3days warm…", "168 leaves", "INPUT", "Study"); I list those separately from the countdown.

| Scenario | R6 | INT |
|---|---|---|
| Brew start, 375×667 @200 % (warning up on Today, tap "Put the kettle on") | v2, 5 runs: warning over a protected element **163–699 ms** in 5 of 5; only 1 run (run 5) reached the countdown itself (142 ms); the rest is the leaving Today header. v1, 5 runs: 250–684 ms; the countdown itself in 1 of 5 (417 ms, "25:00") | v2: **1.8–2.2 s** in 5 of 5, repeated 160–650 ms segments over "25:00 … 24:57", plus about 0.4 s over the leaving header. v1: 1.3–2.3 s |
| Resume, 1440×900 @200 % (brew started with storage full, Pause, Resume) | **0 of 5 (v1 and v2)**: the warning was never shown during the brew (held), so no flash at Resume | **5 of 5: 5.2–7.4 s** (v1), **6.1–6.9 s** (v2) over the readout for the whole running and paused brew |
| Brew start, 1440×900 @200 % (warning up on Today, tap start) | v2: over a protected element 111–1549 ms in 5 of 5; the countdown itself in 1 of 5 (854 ms); the rest is the leaving Today's text box and chips ("INPUT", "Study", "Read", "Life") | 0.85–4.7 s in 5 of 5, including "Put the kettle on" and the countdown |
| Resume after the warning was up on Today first (`resume2`: End within a minute, Today with warning, tap start, Pause, Resume), 1440×900 @200 %, v2, 5 runs | The countdown was **never** covered (0 of 5). Only the leaving Today layer's text box and chips ("INPUT", "Study") were under the warning for 66–1739 ms around the screen change; nothing at Resume | The countdown covered **5.0–6.2 s** in 5 of 5 (total 6.7–9.3 s with "Put the kettle on" 0.07–1.4 s at the start and the leaving chips 0.3–2.7 s) |

M2's "about 0.25 s over the countdown at brew start" reproduces on R6 in magnitude: the countdown itself was covered in 2 of 10 start runs at 375×667 (142 ms, 417 ms) and the leaving screen's controls for 0.16–0.70 s in the others. The Resume case at 1440×900 did not reproduce on R6 in either variant I ran (warning never shown during the brew; or, with the warning up on Today first, only the leaving screen's controls were covered and nothing at Resume). One run of the 1440×900 start variant covered the countdown for 854 ms.

Videos: `3d/video-3d-{R6,INT}-{start-375x667,resume-1440x900}-t200.webm`. Frame stalls: max gap 0.1–0.5 s (phone), 0.5–4 s (1440×900).

### 3e. Delayed re-check after "Back to your brew"

Real browser Back from a running brew (storage full), wait for the warning on Today, real tap on "Back to your brew", then record the warning against the readout and controls.

| | R6 | INT |
|---|---|---|
| 375×667 @100 %, 8 runs, v2 (frames plus DOM-change samples) | warning over Add 5 / Pause / End in **8 of 8** runs for **134–283 ms** (first overlap 180–592 ms after the tap; plus 1–4 ms over the "Back to your brew" button itself); warning gone from the DOM 353–966 ms after the tap; **the countdown never covered** | controls 133–306 ms **then the countdown 1.63–1.75 s**, 8 of 8 (total 1.80–2.03 s) |
| 375×667 @100 %, 8 runs, v1 (frame recorder, load-limited) | 7 of 8, 83–484 ms | 8 of 8, 1.75–2.00 s |
| 375×667 @200 %, 4 runs, v1 | 283–1049 ms; the countdown in 4 of 4 runs (up to 916 ms) | not run |
| 375×667 @200 %, 4 runs, v2 | 33, 182, 211, 251 ms (the countdown for 134–251 ms in 3 of 4 runs; the first run only the status-bar level pill) | **the real tap could not be made**: Playwright's click on "Back to your brew" timed out (30 s) with `li#toast-kettle:save-failed … intercepts pointer events`, i.e. at 200 % on INT the warning sits over that button on Today (it was withdrawn and re-shown repeatedly); `back2.mjs --rev=INT --text=200` re-run once under the slot gate, same timeout |

The overlap length (≤ 283 ms in v2) is consistent with one 250 ms watch tick plus the 160 ms exit fade. Static check: `flow.ts` calls `recheckSaveWarning()` only from `timer:start`, `timer:complete` and `timer:sync`; `navigate('/focus')` triggers none, so nothing re-checks until the 250 ms interval. R6 is better than INT at 100 %; the residual is present on both.

Videos: `3e/video-3e-{R6,INT}-375x667-t100.webm` (v1) and `3e/video-3e2-*` (v2). Files: `3e/back-*`, `3e/back2-*`.

### 3f. Late layout shift on Today at 200 % text (production previews)

3 cold contexts per cell, `serviceWorkers: block`, veteran seed, `PerformanceObserver('layout-shift', buffered)`; "Chrome-counted" = entries without `hadRecentInput`, "all" = every entry. All entries values were identical in 3 of 3 runs per cell. Chrome's `hadRecentInput` flag fell differently between runs and revisions with no real input in my harness, so the Chrome-counted column is not stable; treat "all" as the reliable one.

| Config | R6 Chrome-counted (3 runs) | R6 all | INT Chrome-counted | INT all |
|---|---|---|---|---|
| 390×844 @200 %, normal fonts | 0.2364, 0, 0 | 0.237 | 0, 0, 0 | 0.262 |
| 390×844 @200 %, fonts +2.5 s | 0.3838 ×3 | 0.384 | 0 ×3 | 0.582 |
| 375×667 @200 %, normal fonts | 0 ×3 | 0.281 | 0 ×3 | 0.327 |
| 375×667 @200 %, fonts +2.5 s | 0.0824 ×3 | 0.363 | 0 ×3 | 0.637 |
| 390×844 @100 %, normal | 0 | 0.098–0.101 | 0 | 0.263 |
| 390×844 @100 %, +2.5 s | 0 | 0.171 | 0 | 0.171 |
| 375×667 @100 %, normal | 0 | 0.122–0.127 | 0 | 0.318–0.422 |
| 375×667 @100 %, +2.5 s | 0 | 0.269 | 0 | 0.269 |

The late shift is present on both revisions. By "all entries" R6 is lower or equal in 8 of 8 cells (for example 0.384 against 0.582 at 390×844 @200 % with delayed fonts). By the Chrome-counted metric R6 is higher in 3 cells (0.236, 0.384, 0.082 against 0), which I attribute to the `hadRecentInput` flag rather than to larger shifts, but I did not isolate that. R6's M2-noted value for 390×844 @200 % with slow fonts (0.384) reproduces exactly. Status-bar mode at 200 % was `wrap` on both. Files: `3f/cls-{R6,INT}.{log,json}` (every entry with its sources).

### 3g. The sky-blue "Change brew length" link

Probe `g.mjs`; identical results on R6 and INT.

| | Result |
|---|---|
| Element | `<button type="button">` (class `linkBtn lengthLink`), no `href`, no `role="link"`. It looks like a link (underlined, 14 px / 800) but is a button: it scrolls the brew-length chooser into view and focuses the chosen length (`showLength`). Name: "Change brew length". |
| Contrast (computed colour against sampled background pixels, text hidden) | Light: `rgb(28,100,151)` on `rgb(255,249,240)` = **6.04:1**. Dark: `rgb(153,208,245)` on `rgb(36,26,45)` = **10.07:1**. Rendered ink pixels agree (6.04 and 10.07). Solid background (dock), not a gradient. |
| Focus ring | `:focus-visible`, `solid 3px`, offset 3 px: light `rgb(36,119,184)` = 4.55:1 against the page; dark `rgb(143,208,255)` = 10.02:1 |
| Target size (CSS px) | 375×667 and 390×844 @100 %: **146 × 24** (meets the 24 px minimum of WCAG 2.5.8; below 44); @200 %: **279 × 42**. 390×844 @100 %: nearest other control 6 px away (the start button); 375×667 @100 %: its box overlaps the page controls scrolled under the docked area (Study / Create chips, which the dock covers). |
| 1440×900 | `display:none` (not in the accessibility tree); the brew length is beside the start |

---

## Comparison summary (present or absent on INT; better, same or worse on R6)

| Item | INT | R6 vs INT |
|---|---|---|
| 1. Warning over the countdown at brew start / during a brew (phone) | Present (6.8 s, 5.3 s through the whistle) | Better (held, 0 ms) |
| 1. Persisted brew, summary once, restore truthfulness, End sheet, End < 1 min / later | Same results | Same |
| 2. Focus survives toasts expiring; focus inside the warning | Same behaviour; focus lost to `body` if the warning is withdrawn under focus (C6) | Same (R6 extra 349 ms take-away and 101 ms re-show when leaving by Shift+Tab at 100 %; C6 same loss) |
| 2. Warning re-announced | 5–6 additions at 200 % on phone Today; 1 over the brew | Better (2–3; 0 when held) |
| 3a Tab never reaches "Save backup" at 100 % | Present | Same |
| 3a at 200 % | Present (unreachable in 9 of 15) | Better (reached 15 of 15) |
| 3a Shift+Tab | Reaches in 7 | Same |
| 3b blink at 200 % | Present as a permanent take-away (4 of 6) and entry flicker (2 of 6) | R6 blinks 61–91 ms in 5 of 6; better overall |
| 3c next-brew toast over the status line | Present | Same |
| 3d flash at brew start 375×667 @200 % | Present (1.8–2.2 s) | Better (0.16–0.70 s; countdown itself 2 of 10) |
| 3d at Resume 1440×900 @200 % | Present (6–7 s over the countdown, 5 of 5, both variants) | Better (countdown not covered in 10 of 10 runs; nothing at Resume) |
| 3e after "Back to your brew" | Present (about 1.8–2.0 s, countdown 1.6–1.75 s); at 200 % the warning blocks the tap itself | Better at 100 % (134–283 ms over the controls, 8 of 8; countdown not covered); at 200 % 33–251 ms, tap works |
| 3f late shift on Today @200 % | Present | All entries: lower or equal; Chrome-counted flag noise |
| 3g link | Present: 6.04 / 10.07:1, button with 146×24 target | Same |

## Not done / limits

- Real phones, real assistive technology, real OS text sizes, Safari and Firefox: not tested (Chromium headless, emulated viewports, `html{font-size}`).
- INT 3e at 200 %: the real tap on "Back to your brew" is blocked by the warning (see 3e), so no overlap numbers exist for INT there.
- 3c: only the veteran seed raises a toast on the next brew in my seeds; other profiles not explored beyond the five named seeds.
- The webm files are whole-run recordings (about 12–40 s each), not trimmed to the event. Frames were cut only for 3d (R6 and INT run 1) and 3e (run 1); the countdown-covered runs on R6 (3d v1 run 4, v2 run 5) were not recorded on video.
- 3f: the Chrome-counted metric differs from run to run through the `hadRecentInput` flag; I did not find why.
- A hold, withdraw and re-show cause for INT's 200 % behaviour was not analysed beyond the events recorded.

## Files in this folder

`RECEIPT.md`, `probes/`, `probes-sha256.txt`, `batch-logs/`, and per check: `1/` (m1 JSON, logs, PNGs), `2/` (focus JSON, logs, PNGs), `3a/` (kbd runs, `*-scrollhold-*`, `*-sweep-*`, 4 webm), `3b/` (v1 and v2, 4 webm), `3c/` (nextbrew JSON, logs, PNGs, 2 webm), `3d/` (flash v1 and v2, 10 webm), `3e/` (back v1 and v2, 4 webm), `3f/` (CLS logs and JSON), `3g/` (g JSON, logs, per-configuration PNGs).
All webm files are Playwright `recordVideo` recordings of the whole context (setup included), not trimmed.

Frames cut from the webm files (`ffmpeg -ss <t> -frames:v 1`; `probes/vdiff.py` found the event times; video time = seconds from context start):
- `3d/frames-INT-start/t11.08.png` (INT, run 1, brew start @200 %): the translucent warning over the countdown "24:59" and the status line, with the message wrapped one word per line. `t10.36 … t12.04` are the neighbouring frames.
- `3d/frames-R6-start/t12.32.png` (R6, run 1, brew start @200 %): the warning fading out over the stage at the top; the countdown "25:00" clear. (That run's 699 ms overlap was with the leaving Today header controls, not the countdown.) `t12.16 … t12.96` are neighbouring frames.
- `3e/frames-R6-back/t7.84.png` (R6, 100 %, just after the tap on "Back to your brew"): the warning over the top half of Add 5 / Pause / End while the session screen fades in; "24:57" visible above it. `t7.04 … t8.00` neighbouring (t7.36 is Today with the warning above the dock; t7.68 the dissolve).
- `3e/frames-INT-back/t8.0.png` (INT, same step): the warning over the countdown area (digits hidden) above Add 5 / Pause / End. `t6.0 … t8.8` neighbouring.
- 3a, 3b, 3c: no frame cuts; see the PNG screenshots (`3a/*-not-reached.png`, `*-save-backup-focused.png`, `*-sweep-t100-end.png`, `3b/*-run1-end.png`, `3c/*-end.png`).

## Processes

At the end of the run no L3 process, browser or slot wait remained (`slots.py status` shows no L3 lines). I never touched the orchestrator's dev servers or previews.

Finished: 2026-10-10T22:46:01Z
