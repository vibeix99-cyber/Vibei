# I05 — Real whistle, mute and ambience expectations · READY FOR REVIEW

- **Maker:** M2 · branch `pe/m2` · worktree `/home/user/wt/m2/kettle`
- **Revision:** the commit that adds this file (`I04 I05 I14 READY FOR REVIEW: …`; `git log -1 pe/m2`).
  **Diff base:** `6ddcdaa` (app code identical to `8f1044a`); partial work of this maker preserved in `ccb4ae4` (WIP).
- **Proposed state:** **PARTLY BLOCKED** — everything Chromium can prove passes (two copy fixes made); what a real
  phone *plays and shows* is BLOCKED here and is on `docs/REAL_DEVICE_CHECKLIST.md` §8.

## What exists (verified by reading the code and running it)

| Concern | Actual behaviour | Where |
|---|---|---|
| Audio unlock | No `AudioContext` until the first `pointerdown`/`keydown`/`touchend`; that gesture creates/resumes it and plays an iOS silent buffer. Listener stays to revive "interrupted" contexts | `src/audio/engine.ts` `unlock()`, `src/audio/index.ts` `initAudio` |
| Hidden tab / locked phone | Context suspends when silent and hidden; a completion while hidden still requests and schedules the whistle (desktop background tab). A locked phone freezes the page: nothing runs until return, then the late-return path below | `engine.ts` `onVisibility`/`maybeSuspend`; timer worker |
| Late return | One `complete` request, the "whistled while you were away" summary, nothing more on later hide/show | timer (M1) + `src/screens/done/Summary.tsx` |
| Muted | Nothing scheduled into WebAudio; the visual whistle (`data-state="whistle"`) and the summary remain | `settings.muted` → engine |
| Notification permission | Asked **only** from a tap: Settings → Nudges switch, or the optional "Allow" in the skippable setup. Never on load, never before or after the first brew | `SettingsScreen.tsx` `DeviceGroup`, `WelcomeScreen.tsx` `askNotifications` |
| Denied | Switch off + disabled, "Blocked in your browser settings.", plus steps for how Kettle is open (installed app / phone browser / computer); re-checks on `focus`/`visibilitychange`, so allowing it in the browser and coming back re-enables the switch without a reload | `SettingsScreen.tsx` `deniedHelp()`, `useNotificationStatus` |
| Unsupported (e.g. iPhone Safari tab) | Switch off + disabled: "This browser can’t show notifications. Kettle will chime instead." | same |
| Notification firing | Only in the tab that completed, only when enabled + granted + no Kettle tab visible | `src/timer/notify.ts` `shouldNotify` (unit-tested) |

## Measured gap → fix

The controls never stated the one genuine platform limit, and muted didn't say the whistle is still shown:

| Control | Before | After |
|---|---|---|
| Settings → Sound → **Sounds** (on) | "Effects, the kettle’s whistle and ambience." | "Effects, the kettle’s whistle and ambience, while Kettle is open. A phone’s silent switch or lock screen can keep them quiet." |
| **Sounds** (muted) | "Everything’s quiet." | "Everything’s quiet. The kettle still shows when it whistles." |
| Notifications & device → **Nudges** (on) | "On. I’ll nudge you when a brew or tea break ends." | "On. I’ll nudge you when a brew or tea break ends. A locked phone may hold the nudge until you’re back." |

Each limit is said once, at its control, in Kettle's voice; no new prompt, primer, gate or campaign; no promise of
lock-screen or background audio. The welcome notification step's claim ("…even in another tab") is accurate and
unchanged. File: `src/screens/settings/SettingsScreen.tsx` (two strings).

Visual evidence: `contracts/I04/after/*/19-settings.png` (Sound + Notifications rows, both themes, 3 sizes) vs
BEFORE `/home/user/Vibei/kettle/review/product-excellence/baseline/*/19-settings.png`. The copy wraps inside the
existing `ListRow` description; no layout change.

## Commands and results (all on this revision)

```
KETTLE_PORT=5222 KETTLE_PWA_PORT=5232 npx playwright test tests/whistle.spec.ts --project=chromium   → 8 passed
npx vitest run                                                                                        → 256 passed (notify.shouldNotify etc.)
npx tsc --noEmit --pretty false                                                                       → clean
```
(Port 5222 was served by `npx vite --config .tmp/m2/vite.m2.config.ts --port 5222` — the repo config plus the real
path of the symlinked `node_modules` on Vite's allow list so self-hosted fonts load; Playwright reuses it.)

`tests/whistle.spec.ts` (sound counted at the engine: `play` requests and voices actually scheduled):
1. no audio context before the first gesture; the first tap unlocks it
2. the whistle sounds once at completion, and not again after a reload of the summary
3. late return (clock jumps 20 min past the end, then a tick): one whistle, the while-away summary, nothing more on 4 later hide/show changes
4. **new:** page hidden (another tab in front) at completion: the whistle is still requested and scheduled exactly once
5. muted: nothing scheduled, visual whistle + summary remain; **new:** Settings → Sounds says the whistle still shows
6. permission asked only from the Nudges switch: 0 requests through welcome → first brew → summary; 1 after the tap
7. denied: disabled switch, "Blocked…", browser path shown; after the browser allows it and the tab regains focus the switch works, a test nudge is sent; **new:** the locked-phone limit is stated at the switch
8. unsupported: switch disabled, says Kettle will chime

Exactly-once is asserted at the app level only; M1 owns the timer's completion logic (`src/timer/**`). I did not
read or change M1's branch.

## References opened

- K04 `VISUAL_BENCHMARK_LIBRARY/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg` — transfers:
  the whistle stays readable as a still state (steam, "Tea’s ready!", 0:00) without sound. Do not copy: a silent clip
  proves nothing about audio or FPS.
- K09 `…/assets/current/live-settings.jpg` — transfers: grouped Settings rows with a one-line description; the
  limits go into the existing description line, no new card. Do not copy: nothing else.
- Q01 (page lifecycle: frozen/hidden pages), Q08 (contextual permission) via `REFERENCE-GUIDE.md`.

## Preservation

Voluntary first action untouched (no permission gate; Start a 15-min brew asks nothing). Sound/notification
preferences and their storage unchanged. No new dependency, no push service.

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** whether the whistle is *heard* on real phones (normal, silent switch, low media volume, Bluetooth),
  whether anything plays while locked, when a nudge appears on a locked phone, and real denied/allowed flows in
  Safari/Chrome on iOS/Android. Manual steps: `docs/REAL_DEVICE_CHECKLIST.md` §8 (8.1–8.8, added in this revision),
  plus existing §1 and §2.
- **UNKNOWN:** Chromium's real permission prompt cannot be answered in a test; the spec uses a controllable
  `Notification` stand-in (documented in the spec).
