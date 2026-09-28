# Timer engine & reliability (+ PWA, notifications, shortcuts) — log

Owner: timer area. Files: `src/timer/**`, `src/pwa/**`, `src/lib/shortcuts.ts`, PWA section of
`vite.config.ts`, `playwright.config.ts`, `tests/timer.spec.ts`, `tests/harness/**`,
`tests/e2e.vite.config.ts`. Dev port 5183.

## What "reliable" means here (and how each part is guaranteed)

| Promise | Mechanism |
|---|---|
| No drift | While running, `endsAt` (epoch ms) is the only truth; remaining = `endsAt − clock.now()`. Nothing accumulates per tick. |
| On time in background tabs | `tick.worker.ts` keeps the time: dedicated-worker timers aren't throttled the way main-thread timers are. The ticker wakes once per **displayed second**, aligned to the `ceil` display flip, and exactly at `endsAt`. Main-thread fallback if the worker can't start or dies. Also wakes on visibility, focus, pageshow, online and Page Lifecycle `resume`, with a 1 s watchdog. |
| Survives reload / close / sleep | State is persisted on every action. `sanitizeTimer` repairs whatever storage holds (corrupt JSON, running without an anchor, remaining > plan). A phase that ended while closed completes at its **real** end (`record.endedAt = endsAt`, `day` = local day it ended), and gets `whileAway: true` if it's detected more than 10 s late. |
| Clock jumps | `Date.now()` is compared with monotonic `performance.now()` on every wake. **Back** more than 2 s (manual change) → `rebase(skew)`, so the countdown stays continuous. **Ahead** (sleep) → real time passed: complete if due, after a short settle. Remaining can never exceed the plan (this is also checked on restore). The debug fast-forward uses the app clock offset, so it never looks like a jump. |
| Never double-complete | Four layers: (1) only the **leader** tab may complete; (2) an atomic **IndexedDB claim** per session id (readwrite transactions are serialised across tabs); (3) right before completing, the tab **re-reads storage** (`mirrorTimerFromStorage`) and checks `lastEnded` plus BroadcastChannel "completed" notices; (4) progress dedupes by record id. A tab that just became leader, or just resumed from freeze/sleep, **settles 300 ms** first, so other tabs' writes land. |
| All tabs live | A `storage` event rehydrates the timer (`persist.rehydrate()` reads the *current* value, so racing writes converge), settings, and any store registered with `registerTabSync`. Progress syncs itself (rev-aware). Changes from another tab are re-emitted as `timer:sync {kind: start|pause|resume|addTime|complete|stop|reset}` so UI can react without re-recording, re-playing sounds or re-notifying. |
| Exactly one tab has side effects | Web Locks leader (`kettle:leader`). The tab you **look at steals** leadership (on visible/focus), so the tab with audio permission plays the whistle. Frozen or bfcached tabs release it. A follower that sees a phase overdue by 4 s takes over; at 12 s any tab may complete, still gated by the IDB claim. Fallback without Web Locks: a localStorage lease, confirmed over two heartbeats. |

## Modules
`store.ts` (state + actions + pure math + sanitize + completion guard) · `ticker.ts` (wake loop,
jump detection, leader/claim wiring, hooks, `initTimer`) · `scheduler.ts` + `tick.worker.ts` ·
`view.ts` (per-second snapshots) · `leader.ts` · `claims.ts` · `sync.ts` · `notify.ts` ·
`wakeLock.ts` · `tabPresence.ts` (title + favicon) · `mediaSession.ts` · `announce.ts` +
`TimerAnnouncer.tsx` · `src/lib/shortcuts.ts` · `src/pwa/{sw,register,index}.ts`.

## Public API (all from `@/timer` unless noted)
- Engine (stable): `useTimer` (`startFocus/startBreak/pause/resume/toggle/addTime/end/tick/reset/setIntention`
  plus new `rebase`, `syncIdleLength`), `getTimer`, `remainingAt`, `progressAt`, `nextBreakKind`, `phaseLengthMs`,
  plus `isDue`, `elapsedActiveMs`, `MIN_RECORDABLE_MS`, `MAX_PHASE_MS` (4 h).
- `useRemaining()` → `{status, phase, sessionId, plannedMs, remainingMs, seconds, progress, due}`. It
  re-renders only when the displayed second changes (1×/s; e2e-verified). `useProgressFrame(cb)` gives
  per-frame ring progress with no re-render (60 fps via rAF, paused in hidden tabs). `useSmoothProgress(fps)`.
- `notificationStatus()`, `requestNotificationPermission()` (a granted/denied result flips `settings.notifications`),
  `showTimerNotification(kind)` (for a "test" button), `notificationsSupported()`.
- `<TimerAnnouncer/>` (polite live region), `announce(text)`, `lastAnnouncement()`.
- `isTimerLeader()` / `onLeaderChange(fn)` (aliases `isLeaderTab` / `onLeaderTabChange`): only the leader tab
  should play session ambience and completion sounds. Leadership follows the tab the user is looking at.
- `registerTabSync(store)`: mirror another persisted zustand store across tabs.
- `timerDiagnostics()` (also exposed as `__kettle.timerInfo()`), `__kettle.timerView()`, and
  `__kettle.pwa.{state,update}`. These are debug-only; use the stable APIs above in app code.
- `@/lib/shortcuts`: `useShortcut(keys, handler, {enabled, allowInInputs, allowInDialogs, allowRepeat, preventDefault})`,
  `bindShortcut`, `SHORTCUTS` registry `{id, keys, label, where}`, `displayKey`, `useShortcutHelp()` /
  `openShortcutHelp()` (`?` toggles it; `initShortcuts()` runs at boot).
- `@/pwa`: `registerPwa()` (boot), `usePwaUpdate()` → `{needRefresh, offlineReady, update(), dismiss()}`.
  A `ui:toast` also announces updates and offline-ready.

## Behaviour details worth knowing
- `startFocus/startBreak` over an active phase **end it properly first** (focus ≥1 min is saved as
  a `timer:stop` record).
- `pause()` / `end()` on a phase already at 0:00 complete it instead. In a follower tab they are
  refused, because the leader completes it a moment later.
- `addTime` clamps: remaining never below 0 (removing too much completes now), never beyond 4 h.
  It's ignored once due.
- A skipped long break stays owed: `nextBreakKind` uses `completedInCycle >= longBreakEvery`.
- Idle length follows `settings.focusMin` (in any tab); a running phase is never touched.
- Title: `12:34 · Focusing — Kettle`, `4:10 · Tea break — Kettle`, `10:00 · Long tea break — Kettle`,
  `12:34 · Paused — Kettle`, `4:10 · Break paused — Kettle`. A hidden tab that just completed shows
  `Tea’s ready — Kettle` / `Break’s over — Kettle` until you return. The page's own title is restored
  when idle, and route titles set by others are respected.
- Favicon: a 64 px canvas ring (persimmon for focus, sky for breaks, grey with pause bars when paused)
  around a mug. It's redrawn only when one of 60 ring steps changes, and restores `favicon.svg` when idle.
- Media Session: `Focusing · 18 min left` / artist `Kettle` / album = intention, plus position state and
  play/pause → resume/pause. Cleared when idle.
- Notifications: only in the completing tab, when `settings.notifications` is on, permission is granted
  and **no Kettle tab is visible** (BroadcastChannel query). They go through `registration.showNotification`
  when a SW is active (Android), otherwise `new Notification`. Tag `kettle-timer` with renotify.
  Clicking focuses or opens the app (SW `notificationclick`). They're closed when you come back.
- Wake lock: held while running + visible + `keepAwake`, released on pause/idle/setting off,
  and re-acquired on visibility after the browser drops it.
- Announcer: start, pause/resume, +time, every 5-min mark, 1 min left, completion and end
  (terminal messages go to an app-level region so they survive the focus screen unmounting).
  Big jumps (restore, fast-forward) announce nothing.
- PWA: `injectManifest` (`src/pwa/sw.ts`, Workbox precache of 55 entries ≈1.9 MB: shell, fonts, icons,
  three chunk, tick worker), navigation → `index.html`, `registerType: 'prompt'` (SKIP_WAITING on request),
  no SW in dev. Manifest "Kettle — cozy focus timer" / "Kettle", `#fff9f0`, standalone,
  icons from `public/icons/*`.

## Tests
- Unit (`npx vitest run src/timer`): **70 tests / 4 files**. `store.test.ts` covers the math, addTime,
  end early ≥1 min / <1 min, paused-time exclusion, completion while away, idempotency, the guard,
  the long-break cycle, record.day across midnight, restore/rehydrate from a storage mock,
  corrupt storage, sanitize, idle length and rebase. `dst.test.ts` runs in America/New_York for
  spring forward and fall back. `multitab.test.ts` runs two "tabs" as separate module graphs sharing
  storage and a fake Web Locks: one completion, handover, steal at the completion instant,
  simultaneous start, follower End at 0:00, stale-tab end, split-brain resolved by the claim,
  plus lock and lease election. `presentation.test.ts` covers title, favicon, media, announcer,
  notification rules, wake-lock rule, cross-tab diff, completion rule and shortcut parsing.
- E2E (`npx playwright test --project=timer-harness --project=timer-app`): **14 tests** on the isolated
  harness (`/tests/harness/timer.html`) and **12** in the real app (two are harness-only), 26/26 green. They cover
  reload mid-session (running + paused), a phase that ended 3 h ago, reload at 0:00, completion
  driven by the worker with main-thread timers dead (on time within 400 ms on the harness), the
  hidden-page notification and title, a frozen tab across the end (CDP), two tabs live and one record,
  two tabs pressing start at once, closing the leader, a frozen leader, render budget, wake lock,
  media session and keyboard infra. The e2e server has HMR off (`tests/e2e.vite.config.ts`),
  because edits from other agents were reloading pages mid-test.
- PWA e2e (`npx playwright test --project=pwa`, 3 tests): production build + `vite preview` on 5193.
  Checks that the manifest is installable (its icons exist); that the precache includes the shell,
  fonts, three chunk and tick worker; that an offline reload boots and times a brew with the worker;
  and the update flow: the new SW waits, `needRefresh` fires, nothing reloads mid-brew, applying
  reloads, and the same brew is still running.
- Also verified by probes (not in CI): 4 tabs × 3 cycles of ~15 random cross-tab pause/resume/+time
  actions gave exactly one completion per session, identical state in all tabs and always one leader.

## Iterations
1. **Engine rebuild.** Built the worker scheduler, per-second view store and `useRemaining`,
   Web Locks leader, storage-event mirroring + `timer:sync`, the completion guard, notifications,
   wake lock, title/favicon, media session, announcer, shortcuts and the PWA. 68 unit tests.
   Harness e2e 11/11 on the first run. App-mode e2e failed: other agents' edits triggered **Vite
   full reloads mid-test**, and pages were CPU-starved (load average 26 on 4 cores).
2. **Hardening.** Added the HMR-free e2e server. Found that under heavy jank a follower's 4 s
   takeover could overlap a slow (not dead) leader, and localStorage gives no cross-tab atomicity.
   Added **IndexedDB claims** (test-and-set per session id, with a 5 s grace so a crashed claimer
   can't lose a session). Changed the "late wake ⇒ suspended" heuristic from 2 s to 10 s so a janky
   main thread can't keep pushing the settle window. Made e2e assertions relative to `endsAt`, and
   ran the app target with the 3D scene off and longer phases. Result: 21/21 across both targets.
3. **Adversarial pass.** Clock set back 1 h mid-session: continuous (58 s → 56 s). Clock +30 min
   ("sleep"): completes at the real end with whileAway. Toggle spam ×101: consistent. localStorage
   throwing (private mode): in-memory timer still completes, 1 session. Back/forward nav: restored
   and leader again. Settings changed in another tab: running phase untouched, idle follows.
   Fixed the announcer reading a ≤1 s stale view after +time ("5 minutes 59 seconds" is now exact).
   Added wake-lock (fake API: headless shell always denies), media-session and shortcut e2e tests,
   `isLeaderTab()` for audio, and `M` in the registry. Deduped the precache (includeAssets duplicated the glob).

4. **PWA + integration pass.** Added a reproducible PWA project. Found that `updateSW(true)`
   doesn't reload when the update arrives during the *first* (install) visit, because
   workbox-window only reloads if the page was controlled at registration. `applyPwaUpdate()` now
   also reloads on `controllerchange` (with a 4 s fallback). Verified on both first and return visits.
   Added `isTimerLeader()` / `onLeaderChange()` for audio (it was reading the diagnostics API).

## Known gaps / notes
- Headless can't show real OS throttling or real wake locks. They're simulated: dead main-thread
  timers, CDP freeze, fake `wakeLock`. A real-device pass on Android Chrome (SW notification path)
  and iOS Safari (the page is suspended in background, and completion happens on return with whileAway) is still worth doing.
- The BroadcastChannel "any tab visible?" query adds ≤160 ms before a notification.
- Workbox packages are used by `src/pwa/sw.ts` but come in transitively via `vite-plugin-pwa`.
- Back/forward cache isn't used (the worker/locks/IDB make pages ineligible); a fresh load restores exactly.

## Requests for other areas
- **orchestrator:** add `workbox-precaching`, `workbox-routing`, `workbox-core` (7.x) to
  `devDependencies` (they're imported by `src/pwa/sw.ts`, currently hoisted from vite-plugin-pwa).
- **audio:** switch `src/audio/session.ts` from `timerDiagnostics().leader` to `isTimerLeader()` /
  `onLeaderChange()` (a stable API; the diagnostics shape may change).
- **home/settings/shell:** render a shortcuts help sheet from `SHORTCUTS` bound to
  `useShortcutHelp()` (`?` already toggles it). Show an "Update" affordance from `usePwaUpdate()`
  (a toast is emitted already).
- **core-loop:** `timer:sync` is already handled in flow. `useRemaining().due` is true at 0:00
  while the leader completes (≤ ~0.3 s normally), which is useful for a "whistling…" state in follower tabs.
