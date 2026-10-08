# I05 — Real whistle, mute and ambience expectations · CHECKER r1

**Verdict: APPROVE**

- **Reviewed commit:** `2becb78` (branch `pe/m2`), diff base `6ddcdaa` (app code = `8f1044a`).
- **Checker worktrees:** `/home/user/wt/chk-m2` (detached at `2becb78`), `/home/user/wt/chk-m2-base` (detached at `6ddcdaa`),
  `node_modules` symlinked from the main checkout. Dev servers 5253 (fix) / 5254 (base) with a private Vite cache dir;
  production builds of both revisions (`vite build`) served by `vite preview` on 5273 (fix) / 5274 (base).
- **Proposed state accepted:** PARTLY BLOCKED — everything Chromium can prove passes; real-phone audio/notification
  behaviour is honestly BLOCKED with manual steps in `docs/REAL_DEVICE_CHECKLIST.md` §8.

## What I ran (results)

| Command / probe | Result |
|---|---|
| `npx tsc --noEmit --pretty false` | clean (exit 0) |
| `npx vitest run` | 24 files, 256 tests passed (incl. `notify.shouldNotify`) |
| `KETTLE_PORT=5253 KETTLE_PWA_PORT=5263 npx playwright test tests/whistle.spec.ts --project=chromium` | **8 passed** (52.8 s) |
| `… --project=timer-harness --project=timer-app --project=pwa` | 29 passed, 2 skipped (same as packet) |
| Own probe on the **production** build (not the maker's spec): `AudioScheduledSourceNode.prototype.start` and `AudioContext` constructor instrumented, 390×844 touch | no AudioContext before the first tap (0 → 1 after tap); **sound on: 38 sources started after `finish()`; muted: 0**; muted run still shows steam, notes, "Tea's ready!", 0:00 and the summary (screenshot read: `muted-whistle-390x844-dark.png` in my scratch) |
| Own probe, real Chromium Notification API (headless reports `denied`) | `Notification.requestPermission` called **0 times** through welcome → "Start a 15-min brew" → whistle → summary; Settings → Nudges is off + disabled, "Blocked in your browser settings." and "To turn nudges on: open your browser's menu, find Site settings … set Notifications to Allow, then reload." |
| Code reading: `src/audio/engine.ts`, `src/audio/index.ts`, `src/timer/notify.ts`, `SettingsScreen.tsx` `DeviceGroup`/`SoundGroup`, `welcome/steps.tsx` | packet's "what exists" table is accurate: unlock only on `pointerdown`/`keydown`/`touchend`; `play()` returns before scheduling when muted (haptic only); context suspended when hidden and silent; no `navigator.audioSession` override, so the iOS silent switch claim is plausible |

## What I opened (Read tool)

- K09 `VISUAL_BENCHMARK_LIBRARY/assets/current/live-settings.jpg` (grouped Settings rows with one description line).
- BEFORE `/home/user/Vibei/kettle/review/product-excellence/baseline/desktop-1440x900-light/19-settings.png` → AFTER
  `contracts/I04/after/desktop-1440x900-light/19-settings.png` (Sound + Notifications rows; muted copy; disabled sliders).
- `contracts/I05/captures/settings-nudges-unsupported-390x844-light-after.png`, `…-dark-before.png`.
- `contracts/I04/fixes/settings-muted-volumes-390x844-dark-{before,after}.png`.

## Per-criterion findings (matrix I05 observable success + M2 brief)

| Criterion | Finding |
|---|---|
| Normal: whistle when the brew ends | PASS in Chromium: one `complete` request and one scheduled whistle (spec 2); 38 audio sources started on my production probe. Real speaker output BLOCKED (checklist 8.1). |
| Muted: no sound, visual whistle remains | PASS: 0 sources started (my probe), 0 scheduled (spec 5); steam/"Tea's ready!"/0:00 and summary shown (my screenshot). Settings says "Everything's quiet. The kettle still shows when it whistles." — literally true. |
| Denied permission: correct state + browser path + later re-enable | PASS: real Chromium `denied` state renders the disabled switch, "Blocked in your browser settings." and the path; spec 7 flips the (stand-in) permission, the switch re-enables on `focus` without reload and a test nudge is sent. Real browser prompts BLOCKED/UNKNOWN as stated. |
| Unsupported | PASS: "This browser can't show notifications. With sound on, Kettle chimes while it's on screen." — true (whistle needs an on-screen page with an unlocked context); the old "Kettle will chime instead" over-promise is gone. Welcome callouts corrected the same way. |
| Permission only from a user action, never a gate | PASS: 0 requests through welcome → first brew → summary (my probe + spec 6); only the Nudges switch or the optional setup "Allow" button ask. "Start a 15-min brew" asks nothing. |
| Late return does not duplicate the whistle | PASS in Chromium (spec 3: clock jumped 20 min past the end, one whistle, "whistled while you were away", nothing on 4 later visibility changes). Exactly-once logic itself is M1's; real locked-phone return BLOCKED (8.4). |
| Limits explained once, at the relevant control, Kettle's voice, no push campaign, no lock-screen promise | PASS: Sounds row (audio limit), Nudges row (locked-phone delivery limit), two welcome callouts; no new prompt, primer or gate; "may hold the nudge" hedges, nothing promises background audio. |
| Preservation | Copy-only change inside existing `ListRow` descriptions; Settings grows 34 px; identity, layout, preferences and storage unchanged; no M1 file touched. |
| BLOCKED/UNKNOWN honesty | Honest: real-phone audio (ringer/silent/Bluetooth/locked), nudge timing on a locked phone, and real permission prompts are BLOCKED with concrete steps (checklist §8.1–8.8); the stand-in `Notification` is disclosed in the spec. |

## Notes (not defects)

- The new Sounds description ("…while Kettle is open. A phone's silent switch or lock screen can keep them quiet.") is
  long on desktop where the phone clause is irrelevant; acceptable, it is one line of existing description text.
- "Chimes while it's on screen" is conservative: the spec shows a desktop background tab still schedules the whistle.
  Under-promising is the honest direction.
