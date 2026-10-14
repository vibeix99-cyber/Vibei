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

CHECKS_PLACEHOLDER
