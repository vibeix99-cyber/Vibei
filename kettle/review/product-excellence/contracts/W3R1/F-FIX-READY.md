# W3R1 · Maker F · fix round (CHECKER-W3R1-F §6) — FIX READY

- **Branch:** `pe/w3-notices-polish` (`/home/user/wt/w5f`), from `5ee3e7c`. Local commits only.
- **Code commit:** `1130a13` · **kettle/src tree `f075a7a`**. Dev :5501 `verify.sh`: `PORT 5501 serves 1130a13 (src f075a7a): VERIFIED`. Later commits on top add only this packet and `contracts/W3R1/F/fix/` evidence.
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

Then `commit({ room: 0, hold: above ? holdView(el) : holdTop(el), why: above ? 'above' : 'idle' })`: in view the band closes once (content below moves up by the band's height); above the view the page is scrolled by as much in the same frame (nothing in view moves). The clock ticks every 100 ms while a room is kept, so the room goes ≈ 1.2–1.4 s after the later of the leave and the last input. Unchanged: the band itself (a leave moves nothing), the next notice drawn in the room, a new screen / `ENTRY_MS` / the hidden page giving it back, and the session panel's `reach` rule.

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
