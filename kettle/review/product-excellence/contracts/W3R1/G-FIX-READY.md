# W3R1 · Maker G · fix round (G-D1…G-D4): READY FOR REVIEW

- **Branch / worktree:** `pe/w3-settings` · `/home/user/wt/w5g`, from `808421d`. Local commits only, nothing pushed.
- **Fix commit (text + spec):** `0320211` · `kettle/src` tree `a53263f`. The branch head is the commit carrying this packet; later packet/evidence commits do not touch `kettle/src` or `tests/`.
- **Servers:** fix on :5503 (`verify.sh`: `PORT 5503 serves 0320211 (src a53263f): VERIFIED`); BEFORE = trial `3d91793` on :5523; base `4d36939` on :5478.
- **Evidence:** `contracts/W3R1/G/fix/` · tool `contracts/W3R1/G/tools/fix-measure.mjs`.

## The four lines (`kettle/src/screens/settings/SettingsScreen.tsx`)

| # | Line | Before (`808421d`) | After (`0320211`) | Chars |
|---|---|---|---|---|
| G-D1 + G-D2 | `:134` Sounds, unmuted | The whistle, effects and ambience play while Kettle is open, in a tab or as the app, after your first tap. Closed, Kettle is silent. A phone’s silent switch or lock screen can quiet it too. | **The whistle, effects and ambience play after your first tap. A phone can quiet them when locked, on silent or out of sight.** | 189 → 123 (base 125) |
| G-D3 | `:187` Nudges On | On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. With Kettle closed, no nudge can come. A locked phone may hold the nudge until you’re back. | **On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. If Kettle is closed or your phone has paused it by then, no nudge comes.** | 180 → 161 |
| G-R1 (optional) | `:233` Keep awake | Stops your screen dimming while a brew is on screen. | **Stops your screen dimming while a brew runs on screen.** | 52 → 54 |
| G-D4 | `:240` Haptics, unsupported | This device can’t vibrate. | **Vibration isn’t available in this browser.** (U+2019) | 26 → 42 |

`:182` (unsupported Nudges, "…Kettle chimes while it’s on screen.") is unchanged.

**C-1, the key sentence for F's `tests/whistle.spec.ts:203`** (G does not edit it), verbatim:

> `If Kettle is closed or your phone has paused it by then, no nudge comes.`

e.g. `await expect(page.getByText(/If Kettle is closed or your phone has paused it by then, no nudge comes\./)).toBeVisible();`

## Acceptance checks

### 1 · Ownership and scope

`git diff --stat 808421d 0320211 -- kettle/`:

```
 kettle/src/screens/settings/SettingsScreen.tsx |  8 +++----
 kettle/tests/w3-settings.spec.ts               | 31 ++++++++++++++++++++++++--
 2 files changed, 33 insertions(+), 6 deletions(-)
```

In `SettingsScreen.tsx` the 4 −/4 + lines are `:134`, `:187`, `:233`, `:240`, and only their string literals differ
(`git diff 808421d 0320211 -- kettle/src`). No CSS, no other copy, `:182` untouched. **PASS.**

### 2 · G-D1, the iOS Safari tab state

Init script removes `window.Notification` and `Navigator.prototype.vibrate`; Sounds on; 390×844 light @100.
- Visible together: `:182` "This browser can’t show notifications. With sound on, Kettle chimes while it’s on screen." and the new Sounds line.
- The Sounds line contains none of "in a tab", "in the background", "as the app", "while Kettle is open"; it says a phone can *quiet* sound out of sight, which agrees with "chimes while it’s on screen" and with F's Welcome.
- Spec: new test "an iPhone-like Safari tab (no notifications, no vibration API)…" in `tests/w3-settings.spec.ts`.
- Frames: `G/fix/rows/{BEFORE-trial-3d91793,AFTER-fix,BASE-4d36939}-390x844-light-100-safari-sound-group.png` and `…-safari-notifications-group.png`; measures in `G/fix/rows/*-measure.json` (entry `safari-390x844-light-100`). **PASS.**

### 3 · G-D2, length (all 16 configs, BEFORE = trial `3d91793` :5523, AFTER = fix :5503, base `4d36939` :5478)

Rendered lines = description height ÷ computed line-height. Phone configs measured twice: a phone context (`isMobile`, overlay scrollbars) and a desktop context (`isMobile: false`, the 15 px stable scrollbar gutter; this is the context that reproduces the checker's base 12 / trial 17).

| Config | Context | Sounds: base | Sounds: BEFORE (trial) | **Sounds: AFTER** | Nudges On: base* | Nudges On: BEFORE | **Nudges On: AFTER** | AFTER ≤ BEFORE |
|---|---|---|---|---|---|---|---|---|
| 390x844-light-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 390x844-light-200 | phone | 9 | 13 | **9** | 8 | 14 | **12** | yes |
| 390x844-dark-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 390x844-dark-200 | phone | 9 | 13 | **9** | 8 | 14 | **12** | yes |
| 375x667-light-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 375x667-light-200 | phone | 11 | 14 | **10** | 8 | 15 | **13** | yes |
| 375x667-dark-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 375x667-dark-200 | phone | 11 | 14 | **10** | 8 | 15 | **13** | yes |
| 844x390-light-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 844x390-light-200 | desktop | 4 | 6 | **4** | 3 | 6 | **5** | yes |
| 844x390-dark-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 844x390-dark-200 | desktop | 4 | 6 | **4** | 3 | 6 | **5** | yes |
| 1440x900-light-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 1440x900-light-200 | desktop | 4 | 5 | **4** | 3 | 5 | **5** | yes |
| 1440x900-dark-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 1440x900-dark-200 | desktop | 4 | 5 | **4** | 3 | 5 | **5** | yes |
| 375x667-light-100 | desktop ctx | 6 | 8 | **5** | 5 | 8 | **7** | yes |
| 375x667-light-200 | desktop ctx | 12 | 17 | **10** | 9 | 16 | **14** | yes |
| 375x667-dark-100 | desktop ctx | 6 | 8 | **5** | 5 | 8 | **7** | yes |
| 375x667-dark-200 | desktop ctx | 12 | 17 | **10** | 9 | 16 | **14** | yes |

*Base On line: "On. I’ll nudge you when a brew or tea break ends. A locked phone may hold the nudge until you’re back."

- **375×667 @200 %, light and dark: 10 lines (≤ 12)** in both contexts; base 12 (desktop ctx) / 11 (phone ctx); trial 17 / 14.
- Every config: AFTER ≤ BEFORE, and Sounds AFTER ≤ base everywhere.
- Frames (full size, the Sounds row): `G/fix/rows/<BUILD>-<cfg>-sounds.png` for all 16 configs × 3 builds, and `G/fix/rows-nomobile/<BUILD>-375x667-<theme>-<100|200>-sounds.png`; the four asked for: `…-375x667-light-200-sounds.png`, `…-375x667-dark-200-sounds.png`, `…-390x844-light-100-sounds.png`, `…-1440x900-light-100-sounds.png` (BUILD = `BEFORE-trial-3d91793` / `AFTER-fix` / `BASE-4d36939`). **PASS.**

### 4 · G-D3, the On line on screen

Permission faked `granted` (`Object.defineProperty(Notification, 'permission', …)`, as `whistle.spec.ts`'s `fakePermission('granted')`), `notifications: true`.
- The new line is visible at every config (table above; frames `G/fix/rows/<BUILD>-<cfg>-nudges-on.png`, incl. 375×667 @200 light/dark and 390×844 @100 light; desktop-ctx copies in `G/fix/rows-nomobile/`).
- "may hold" appears nowhere on Settings: the spec sweeps the whole Settings text for `/may hold|until you’re back|later/i`.
- Lines at 375×667 @200: **13 vs 15** (phone ctx), **14 vs 16** (desktop ctx). 161 characters vs 180.
- Spec: the "streak" test now asserts the full On line with `exact: true`. **PASS.**

### 5 · G-D4

With `navigator.vibrate` removed, Haptics reads exactly `Vibration isn’t available in this browser.` (U+2019) and its switch is disabled (`hapticsDisabled: true` in `AFTER-fix-measure.json`). Spec asserts both. Frame: `G/fix/rows/AFTER-fix-390x844-light-100-safari-notifications-group.png`. **PASS.**

### 6 · The copy tells the truth

- **Sounds.** `engine.play` refuses to create an AudioContext before user activation (`engine.ts:218–223`, "Never create a context before the user has interacted"), hence "after your first tap"; `maybeSuspend` suspends the context when the page is hidden and nothing is playing (`engine.ts:149–161`), and a frozen iOS/iPadOS page runs no JavaScript at all, so a locked, silenced or out-of-sight phone can quiet them; no background-play promise is made.
- **Nudges On.** A nudge is raised only from `timer:complete` and only while no Kettle tab is visible (`notify.ts:165–189`, `shouldNotify`); a page the phone has frozen completes the phase on wake (`ticker.ts:144–150, 287–293`), when it is visible again, so `shouldNotify` is false and no nudge comes; there is no push (`pwa/sw.ts` handles only `notificationclick`), so a closed Kettle sends none. Hence "If Kettle is closed or your phone has paused it by then, no nudge comes."
- **Haptics.** The row is disabled when `'vibrate' in navigator` is false (`SettingsScreen.tsx`, `vibrateSupported`); that tests the browser API, not the device's motor, hence "Vibration isn’t available in this browser."
- **Keep awake (G-R1).** The lock is wanted only while the timer is `running` and the page is visible (`wakeLock.ts:19–20`), hence "while a brew runs on screen."

CHECKS_PLACEHOLDER

