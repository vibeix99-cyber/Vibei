# W3R1 · Maker F · fix round (CHECKER-W3R1-F §6) — FIX READY

- **Branch:** `pe/w3-notices-polish` (`/home/user/wt/w5f`), from `5ee3e7c`. Local commits only.
- **Code commits:** `1130a13` (the fix) + `14703f3` (above the view, the same idle rule; found by the fling probe, §5 (e)) · **final kettle/src tree `8b42b9b`**. Dev :5501 `verify.sh`: `PORT 5501 serves 14703f3 (src 8b42b9b): VERIFIED`. Later commits add only tests/evidence/this packet.
- **Which src each result is on:** `f075a7a` (= `1130a13`) for `fix/*` at the folder's top level; `8b42b9b` (final) for everything under `fix/final/`.
- **Evidence:** `contracts/W3R1/F/fix/`.

## 1. Check 1 — ownership and scope ◆

`git diff --stat 5ee3e7c 1130a13 -- kettle/` (`fix/diffstat.txt`):

| File | § 6 allowance | Change |
|---|---|---|
| `src/ui/Toast.tsx` | F-D1 | The kept room is given back on the same screen once touch and scroll are idle (rule below). `moment.ts` unchanged. |
| `src/screens/focus/FocusScreen.module.css` | F-D2 | The F-T2-8 wrap **reverted**: the file is identical to `4d36939` (`git diff 4d36939 -- …FocusScreen.module.css` is empty). F-T2-8 returns to FOLLOW-UP. |
| `src/screens/home/StatusBar.tsx` | F-D3 | The warm-days button gets `aria-label` "N day(s) warm[, today not brewed yet]. Show details"; the sr span is gone; the visible pill is unchanged. |
| `tests/whistle.spec.ts` | C-1, line 203 only | Asserts `/If Kettle is closed or your phone has paused it by then, no nudge comes\./`. |
| `tests/notice-strip.spec.ts` | F-R4, `press()` only | After each wheel, waits until the element and `scrollY` are still across two frames (≤ 1.5 s) before the on-top check. Nothing removed or loosened. |
| `tests/w3-notices.spec.ts` | own spec | Updated for the idle rule; new pointer-held test; new accessible-name test (§4). |

### The F-D1 rule as implemented (`Toast.tsx`, `decide()`, the room branch)
A kept room is given back when **all** hold, confirmed in a fresh animation frame (`confirmRestInFrame`):
- `now − roomLeftAt ≥ QUIET_MS` (1.2 s since the notice left; `roomLeftAt` is stamped by the commit that keeps the room);
- `atRest(now)`: no pointer down and no input of any kind for `QUIET_MS` — `moment.ts` already stamps pointer down/up/move (mouse), click, wheel, touchstart/move/end, keydown **and `scroll`** (window capture, so the session panel's and every inner scroller's scroll events count; a fling or a smooth scroll still running is activity);
- `!inputPending()` (`navigator.scheduling.isInputPending({ includeContinuous: true })`).

Above the view (`14703f3`): a notice that **leaves** there keeps its room like anywhere else (no height change), and any other change there (a notice arriving or swapping) waits for rest, confirmed in a fresh frame. Then `commit({ room: 0, hold: above ? holdView(el) : holdTop(el), why: above ? 'above' : 'idle' })`: in view the band closes once (content below moves up by the band's height); above the view the page is scrolled by as much in the same frame (nothing in view moves). The clock ticks every 100 ms while a room is kept, so the room goes ≈ 1.2–1.4 s after the later of the leave and the last input. Unchanged: the band itself (a leave moves nothing), the next notice drawn in the room, a new screen / `ENTRY_MS` / the hidden page giving it back, and the session panel's `reach` rule.

## 2. Check 5 — F-D2 ◆ (top bar at 200 % landscape)

Closed by the first alternative §6 allows: **the base's top bar restored**. `src/screens/focus/FocusScreen.module.css` at `1130a13` is byte-identical to `4d36939` (`git diff 4d36939 1130a13 -- kettle/src/screens/focus/FocusScreen.module.css` empty), so the session controls are where the base puts them at every size (844×390 / 667×375 @200: top ≤ 352, visible 38.5 / 23.5 px; @100 one line, controls at 248 / 239). **F-T2-8 returns to FOLLOW-UP** (the task label is squeezed at 200 % landscape, as on the base). Measured frames (Lane I2's `LI2-topbar2.mjs`, fix :5501 and base :5478): `fix/topbar2/` — see §5 for the numbers.

## 3. Check 6 — F-D3 ◆ (status button name)

`StatusBar.tsx`: the button carries `aria-label={`${n} ${n === 1 ? 'day' : 'days'} warm${atRisk ? ', today not brewed yet' : ''}. Show details`}`; the sr-only span is removed; the visible pill (count + "day(s) warm") is unchanged, and the label contains the visible text (label-in-name).
Spec `tests/w3-notices.spec.ts` › "the status bar warm-days button is named …" asserts with `toHaveAccessibleName`:
- veteran (today brewed): **"23 days warm. Show details"**;
- atRisk: **"5 days warm, today not brewed yet. Show details"**;
- blank + one full brew: **"1 day warm. Show details"**.
Result: **passed twice** (`fix/w3-notices-x2.log`, 18/18).

## 4. Check 7 — C-1 ◆

`tests/whistle.spec.ts:203` now reads `await expect(page.getByText(/If Kettle is closed or your phone has paused it by then, no nudge comes\./)).toBeVisible();` (one line changed, nothing else in the file). G's sentence is not on this branch, so `:203` fails on :5501 by design (shown in `fix/owned-specs.log`); the lead proves `whistle.spec.ts` 8/8 on the fix trial (integration with G + this fix).

## Check 8 — preserve list and wording
No visible, sr, `title` or `aria-*` "streak" in F's files (the new `aria-label` says "days warm"); no other copy changed in this round.

## 5. Check 2 — F-D1, the band's lifetime ◆

**Own probe** `tests/w3-notices-idle.spec.ts` (an in-page tracker that records every strip commit with its time, `why`, room, pointer state, ms since the last input of any kind — pointer, touch, touchmove, wheel, key, **scroll** — and the greeting's visible top before/after), fix :5501 src `f075a7a`, 18:44 UTC: **12/12 passed** (`fix/idle-own.log`; frames `fix/idle-own/**/<cfg>-<case>-{1-band,2-after-collapse}.png`). A 3 s notice raised with `__kettle.toast` leaves at rest; then:

| Config | (a) no input: collapse after leave | (b) scroll down & back (phones: CDP finger drag, 12 steps × 16 ms; 1440: wheel), then idle: room during scroll → collapse after last input | (c) pointer held 3 s: room while down → collapse after release | (d) commits between leave and collapse | visible move at collapse |
|---|---|---|---|---|---|
| 390×844 light @100 | **1271 ms** | room 68 kept (scrolled to sy 497 and back, 3.6 s) → **1328 ms** | 68 kept (down = 1) → **1274 ms** | exactly 1 (the collapse), pointer up, since-input 5764 / 1328 / 1274 ms | 68 = band (once) |
| 390×844 dark @200 reduced | **1280** | 113 kept (sy 444, 3.0 s) → **1265** | 113 kept → **1293** | 1 each; up; 5850 / 1265 / 1293 | 113 = band |
| 1440 light @100 | **1289** | 68 kept (wheel; page scrolls only 11 px) → **1246** | 68 kept → **1261** | 1 each; up; 5823 / 1246 / 1261 | 68 = band |
| 1440 dark @200 reduced | **1300** | 113 kept (sy 300, 2.5 s) → **1285** | 113 kept → **1259** | 1 each; up; 5817 / 1285 / 1259 | 113 = band |

Every collapse: `why: idle`, pointer up, ≥ 1200 ms since any input, ≥ 1200 ms after the leave, ≤ 1.33 s after the later of the leave and the last input (limit 4 s), on the same screen (`#/`).

**Lane I2's probes on the fix** (`/home/user/wt/w5tr-f/kettle/.tmp/LI2/`, run read-only against :5501):
- `LI2-idle.mjs fix … idle` → `fix/idle/idle-fix.{json,log}` + frames `fix/idle/<cfg>-{0-no-notice,1-notice,2-band-at-leave,3-band-after-45s-idle,4-…}.png`: at every config the band is present at the leave (`leave.move 0`) and **room 0 by the first 1 s sample after the 1.2 s window** (`why: idle`); frame 3 shows the page closed up. (Its later scroll/pointer steps then run without a band; (b)/(c) are measured by the own probe above.) Note: the server was restarted by someone else at 18:22:10 during its first config (390 light @100), whose samples show `why: screen`.
- `LI2-idle2.mjs fix … idle` (real finger drag) → `fix/idle2/`.
- **(e) fling** `LI2-idle3.mjs fix … above 390x844-light-t200` (finger drag 600 px released into momentum) — **on `f075a7a` it failed**: `fix/idle3-above/idle3-above-fix.log`, both reps: a commit `why: above, room 0` **463 / 528 ms after the last input**, visible move **−153.5 px** — not the kept band but the notice itself leaving above the view mid-fling through the pre-existing "above" path (free collapse with `holdView`, whose compensation the momentum scroll undid). Fixed in `14703f3` (a leave above the view keeps its room; other above-view changes wait for rest). Re-run on the final src: `fix/final/idle3-above/` (PENDING-FLING2).

## 6. Check 3 — F-T2-1 kept ◆

Lane I2's aimed-tap probe `LI2-probe2.mjs fix http://127.0.0.1:5501 … '' L1,L2` → `fix/probes2/probe2-fix.{json,log}`: **16 configurations** (390×844, 375×667, 844×390, 1440×900 × @100/@200 × light/dark), L1 and L2, pointerdown + click: **64 events, 0 off target, 0 px moved** (max |moved| 0).

## 7. Check 5 numbers — F-D2

`LI2-topbar2.mjs` on fix :5501 and base :5478 (`fix/topbar2/topbar2-{fix,base}.log`, frames `fix/topbar2/{fix,base}-*-session-running.png`): **identical**. 844×390 @200 light/dark: Add 5 / Pause / End top **352**, visible **38.5** px; 667×375 @200: top **352**, visible **23.5** px; @100: one line, controls at **248** (844×390) / **239** (667×375).

## 8. Check 4 — specs

| Suite | Result | Src | Log |
|---|---|---|---|
| tsc | exit 0 | `8b42b9b` | `fix/final/tsc.log` |
| vitest | **31 files, 297/297** | `8b42b9b` | `fix/final/vitest.log` |
| `w3-notices` ×2 (9 tests: 5 aimed-tap configs, the renamed "…stays while the page is scrolled, and goes on the same screen once idle" — still asserts nothing moves by layout during the scroll —, the new pointer-held test, new screen, accessible name) | **18/18** | `f075a7a` | `fix/w3-notices-x2.log` |
| `w3-notices-idle` (band lifetime, 12) | **12/12** | `f075a7a` | `fix/idle-own.log` |
| `notice-strip:275` 1440 dark 200 % ×3 | **3/3** | `f075a7a` | `fix/ns275-1440-dark-200-x3.log` |
| `notice-strip:275` 1440 light 200 % reduced ×3, twice | run A: 2/3 — #1 **invalid** (my :5501 was restarted by someone else at 18:22:10 mid-test; "Kettle's off" = the brew lost on reload); run B: 2/3 — #1 failed at **"the Undo is the deleted row … 111 px" = N-2** (S's `History.tsx` focus scroll, pre-existing; Mark done passed). Error contexts: `fix/failure-context/ns275-1440-light-x3-run{1,2}-1-error-context.md` | `f075a7a` | `fix/ns275-1440-light-200-reduced-x3{,-run2}.log` |
| `notice-strip` 25 (workers 1) | **25/25** (incl. 1440 light 200 % reduced and 1440 dark 200 % once each) | `8b42b9b` | `fix/final/notice-strip-full.log` |
| `toast-room`, `a11y`, `summary-notice`, `break-reach`, `w2-home`, `whistle` | PENDING-OWNED | `8b42b9b` | `fix/final/owned-specs.log` |

`whistle.spec.ts:203` is expected to fail on :5501 (G's sentence is not on this branch; C-1).
