# W2R2 · Maker T · I10 toast architecture: packet

**Status: WIP.** Amended ruling B (an action notice drawn where the person raised it) is not met at 200 % text and for History / Settings, and E2 (summary proofs on the T + P trial) fails on the trial. §9 lists exactly what is missing. Everything else below is measured.

| | |
|---|---|
| Branch | `pe/w2r2-toast` (local only; not pushed) |
| Code revision | `8d0d8a6` (`kettle/src` tree `efc44574a4ac7eaab863d8485941e24aa8191dee`; the full suite ran on `c43e30b`, see §6.2) |
| Packet revision | the commit that adds this file (see `git log -1 -- kettle/review/product-excellence/contracts/W2R2/T-READY-FOR-REVIEW.md`) |
| Diff base | `b377c62` (`kettle/src` `e0aebbf`) |
| Design | `T/TOAST-ARCHITECTURE.md` @ `dabc8f3`, approved with rulings (`DESIGN-GATE-T.md`) |
| Trial merge | `git merge-tree --write-tree claude/wizardly-galileo-uy89d9 c43e30b` → `ac893c1`, exit 0, no conflicts (integration head `d7ee690`, merge base `b377c62`; integration has no `kettle/src` change since `b377c62`) |
| Servers | fix dev :5421 (`.tmp/w2.vite.config.ts`, `hmr:false, watch:null`); W2H-D1 control `acf1c6a` dev :5424 from a detached sparse worktree `/home/user/wt/w3t-h`; base control `b377c62` dev :5410 (shared, read-only, not started or stopped by me) |
| Environment | 4 CPUs shared by four lanes; every browser through `slots.py --lane T`; headless Chromium (SwiftShader); large text as `html{font-size:200%}`; frozen dates with `page.clock.install` + `resume` |
| Evidence | `T/` (tools, runs, after captures), about 8 MB |

## 1. What changed (files; no `screens/done/**`, `scene/**`, `public/**`, art, `SaveWarning*`, dependencies)

| File | Change |
|---|---|
| `src/ui/Toast.tsx` | Rewritten placement. Zones (`[data-notice-zone]`, ranked, never in a leaving route layer) → free bands = zone ∩ viewport minus every protected box (`PROTECTED`: every control incl. disabled, `[data-notice-avoid]`, `[data-save-warning]`, +6 px slop) → region box = the chosen band (clips). No band while `[role="dialog"]` exists or `#root[inert]`. Whole notices only, queued in order (timed action first, then timed, then persistent), timers run only while drawn, no withdrawal by a newcomer (newcomers stack above, the oldest stays put), withdrawn-by-band ones return only with 12 px hysteresis, the persistent update prompt yields to a waiting timed notice, a notice taller than any band scrolls inside its own box. Announcer: one polite line per notice on arrival (message + action label) in a light-DOM visually hidden `role="status" aria-live="polite"` element (`data-notices-said`, from boot; amendment D); drawn list `role="group" aria-label="Notifications"`, not live. Removed: `toastLiftBottom`, `toastRoomTop`, `topBarBottom`, `toastDock`, `foldToFit`, the 3-notice store cap (a loop guard of 40 remains, E1). The stage is top-aligned (A). A `MutationObserver` re-measures in the same task when any element is added or removed under the notices or `#root` turns inert; a new notice is drawn only into a band that held still for one measure. Measured in every scroll event, on resize/hashchange, every frame for 1.2 s after a change, and every 100 ms. No layout animation; entry/exit only fade and scale about the notice's centre; a leaving notice is pinned out of flow where it is |
| `src/ui/Toast.module.css` | Region = band box (`overflow: clip`, container `toast-room`); list bottom-aligned, oldest lowest; fold CSS and `body:has([data-toast-above])` lift removed; sizer (waiting notices, off screen, `aria-hidden`, `inert`, `data-notices-waiting`); announcer host |
| `src/app/App.tsx` | Route layers that are leaving carry `data-route-leaving` (`useIsPresent`) |
| `src/app/debug.ts` | `__kettle.toast` and `__kettle.noticesSaid()` (probes and specs; debug builds only) |
| `src/screens/focus/FocusScreen.tsx` / `.module.css` | Stage = the session's notice zone in every layout (`data-toast-dock` / `--toast-dock` removed). `data-notice-avoid` on the top bar (chip, dots, Close/Ambience/Mute), the readout (flag, digits, status, meta), the panel's cycle dots, Break's over title, sentence and action group, the controls rows, the summary box. **(b)** the End and Ambience sheets are rendered outside the frozen frame and not at all once the session has ended |
| `src/screens/home/Hero.tsx` | Hero (greeting, Chai, bubble) = Today's zone (rank 1); goal card `data-notice-avoid` |
| `src/screens/home/Composer.tsx`, `HomeScreen.tsx`, `Home.module.css` | H's Brew length restored (`7a961b7`: dock on portrait phones, column head in landscape, card on tablet/desktop; 44 px options; measured `--home-dock-h`). The composer's section = Today's second zone (rank 2: its heading). Dock `data-notice-avoid` + `data-start-dock`. "Change brew length" dropped in every `lengthAt === 'dock'` configuration (kept at the column head and in the card), measured first (§5.1) |
| `tests/notice-zone.spec.ts` (new) | Invariants 1, 2, 4, announcer, waiting-keeps-time, Ambience sheet, Next brew (§6) |
| `tests/w2-home.spec.ts` | H's spec restored unchanged (`7a961b7`) |
| `tests/toast-room.spec.ts`, `tests/a11y.spec.ts` | Retargeted from `[data-toast-above]` to the protected set / named elements; queue semantics (§6.1, each changed assertion listed) |
| `tests/break-reach.spec.ts` | Date frozen (Monday 2026-10-12, a recipe day; `KETTLE_AT` overrides) |
| `tests/statusbar.spec.ts` | R8-F5: waits for `nav[aria-label="Your progress"]` after `open()` (real state); no assertion touched |

## 2. Cause notes

- **Root (all of a–f):** on `b377c62` the stack is placed against proxies: 10 px above the highest on-screen `[data-toast-above]` (`Toast.tsx` `toastLiftBottom`), under a page-level `<header>` (`toastRoomTop`/`topBarBottom`), and in a landscape-only dock (`toastDock`). Nothing checks what is actually under the stack.
- **a · W2H-D1:** H's Brew length row sits inside the `[data-toast-above]` dock (+60 px), so the lift puts End's stack over Mark done (CHECKER-W2-H §4). Now the dock is just protected; End's notices go to the Hero (rank-1 zone), or to the composer heading (rank 2) when the person has scrolled down to the task.
- **b · F2/F3:** `FocusScreen` batches `setEndOpen(false)` with `endFocusEarly()`. The render that sees `view === 'none'` returns the frozen previous element tree, which still has `<EndSheet open>`. The portalled sheet (dialog, `#root[inert]`) therefore lives as long as the outgoing route layer: Mark done's centre hit-tests to the sheet's header or footer, and `#root` stays inert. Now the sheets are not part of the frozen frame and are not rendered once the session has ended, so dialog and inert go in the same commit as the route change.
- **c · R8-F3:** `--z-toast` (200) is above `--z-modal` (110), and an open sheet voided the dock, so the stack went back to the room above the sheet. Now nothing is drawn while `[role="dialog"]` exists or `#root[inert]`. The notices wait with their timers paused and come back whole after Close.
- **d:** `foldToFit()` plus `.region[data-docked] .toast[data-folded]` hid the icon and clamped the message to one line, which cut off "+15 leaves". Both are removed. Notices are whole or they wait.
- **e:** with Next brew on, a break that ends on the break screen starts the next brew. The recipe the break finished ("Take a full tea break") was then lifted above the `.controls` `[data-toast-above]`, which put it on the countdown and status line. Now the readout is `data-notice-avoid` and the zone is the stage.
- **f · `break-reach.spec.ts:179`:** the spec did not freeze the date. On recipe days (Monday "Take a full tea break", and Thursday) Break's over raises "Recipe done … +10 leaves". At 200 % in portrait the D4 lift draws it across the middle of the session panel (375×667: 416–554 in panel 313–667; 390×844: 525–663 in panel 422–844, BEFORE meta). That is exactly where the spec aims its real wheel, and where a person scrolls. The notice's own scroll box (`overscroll-behavior: contain`) takes the wheel and the panel never scrolls, so "Put the kettle on" stays below the edge (y 730 of 667, 838 of 844). **Ruling: a real user-facing cover (D4 pattern), not a test artefact.** For its whole life the notice sits over the panel's words and eats the scroll gesture that is the only way to reach the action at 200 %. Fixed by the architecture: the panel is never a zone. The spec now freezes Monday 2026-10-12 (a recipe day); `KETTLE_AT` overrides it.

## 3. Rulings of the design gate: how each is met

| Ruling | Where |
|---|---|
| Hero (greeting, Chai, bubble) is a zone; bottom-aligned; the bubble deliberately unprotected (comment) | `Hero.tsx` (`data-notice-zone`, comment), `Toast.tsx` (bottom-aligned in the lowest band) |
| The goal card is not a zone; its text is protected | `Hero.tsx` `GoalCard` `data-notice-avoid` |
| Stage in portrait, bottom-aligned; top bar's controls, words and the zen-faded chrome protected | `FocusScreen.tsx` stage `data-notice-zone`; header `data-notice-avoid` (opacity is not consulted: faded chrome stays protected) |
| Summary card protected (K03 unlock inside it) | `FocusScreen.tsx` summary box `data-notice-avoid-content` → the card and footer (`[data-notice-avoid-content] > * > * > *`) |
| Waiting only in (i) modal open or exiting, (ii) zone scrolled off by the person, (iii) summary filling the stage at 200 % | `Toast.tsx` (no band ⇒ wait). At rest every screen has a band (§5.2). One addition: Today's composer heading is a rank-2 zone, so a person scrolled down to the task still gets "Crossed off · Undo" drawn right above the field (it was the only way `integrity.spec.ts:1090` @375 could pass with nothing covered) |
| No viewport fallback on a zone screen | `Toast.tsx`: the viewport is an area only when the screen declares no zone |
| Timers pause while waiting; announcement on arrival names the action; nothing dropped on a route change | `remaining` map; `spoken()`; the store is global and the queue survives route changes; the 3-notice cap is removed |
| The persistent prompt yields to a waiting timed notice | `Toast.tsx` (yield when the next timed notice does not fit beside it) |
| A drawn notice is never withdrawn by a newcomer; re-drawing uses hysteresis | newcomers are only appended when they fit; a band-withdrawn notice needs `HYST` = 12 px spare |
| Modal = `[role="dialog"]` present or `#root[inert]` | `Toast.tsx` `modal` |
| Never a zone from an exiting popLayout layer | `App.tsx` `data-route-leaving`; zones filtered |
| Re-measure every frame during transitions | every frame for 1.2 s after a notice arrives/leaves, a hashchange or a resize; in every scroll event; every 100 ms otherwise |
| Bound the clip (R8-F1 not worse) | no layout animation at all; entry/exit = opacity + scale about the centre; a leaving notice is pinned out of flow; the region clips to its band. The R8-F1 mechanism (a `layout` animation inside a clipped scroll list) no longer exists |
| One announcement per notice, no further live-region mutations | light-DOM announcer (amendment D); `notice-zone.spec.ts` counts mutations = lines said |
| Protected (a) includes disabled controls; slop 6 px | `PROTECTED`, `SLOP` |
| Protected (b): readout (flag, digits, status, meta) in every view, top bar chip and dots, Break's over title and sentence, storage banner | `FocusScreen.tsx` `Readout` root, header, `.dotsPanel`, `overTitle`, `overSub`, `overDock`; `[data-save-warning]` by selector |
| Reduced motion | fade only (0.12 s); everything else identical |
| Scope: no `screens/done/**`, `scene/**`, art, deps; no assertion of `integrity.spec.ts` changed | `git diff --name-only b377c62..HEAD` (§1); `integrity.spec.ts` differs from `b377c62` only by four locator scopes required by amendment D (§3b, §6.1) |
| Decision 3: "Change brew length" dropped in every `lengthAt === 'dock'` configuration; measured first; options Tab-reachable; `w2-home.spec.ts` unchanged | measured: with the link, End's "Saved 3 minutes of focus" at 375×667 @200 was drawn not whole in a 78 px band (`runs/link-measure/end-375x667-200-with-link.json`: `notWhole` 33/33 samples); without it the band is 112 px and every notice of the worst day is whole (§5.3). `w2-home.spec.ts` 18/18 with no change |

## 3b. Amended ruling (LEAD-2, `DESIGN-GATE-T-RECONFIRM.md`): status of each point

| | Change | Status |
|---|---|---|
| **A** stage top-aligned | `FocusScreen.tsx` stage `data-notice-align="start"`; `Toast.tsx` picks the highest band holding the stack in a start-aligned zone and hangs the region from the band's top (`data-align="start"`, list in arrival order downward: the oldest is highest and stays put; `GRACE` reaches into the slop below, not above). Hero and composer remain bottom-aligned | done (`8981b7c`); proofs §4.3 |
| **B** action notices drawn where raised | Today: "Crossed off · Undo" lands in the Hero band, else the composer heading band (rank 2). Within one frame of the dialog leaving: a `MutationObserver` on `<body>` children and `#root[inert]` re-measures in the same task (`0616fd2`); a new notice is drawn once its band held still for one measure (`a0aa512`, ≤ 1 frame in the per-frame burst) | **partial**, see §9 |
| **C** composer zone conditions | rank 2 (used only when no Hero band holds the next notice); everything in the card but the heading is protected (field, clear, Mark done, Carried row, Recent, tags; Brew length and the dock are protected and outside the section); the stack keeps its band while it holds it (no jump Hero ↔ composer unless the band goes) | done; proof in B's Mark done rows |
| **D** light-DOM announcer | `<div role="status" aria-live="polite" aria-relevant="additions" data-notices-said>` rendered by the Toaster from boot, visually hidden; lines appended once per notice, old lines dropped only in the same task as a new one. Text queries for notice text are scoped to `[aria-label="Notifications"]`: `integrity.spec.ts` l.558, 582, 812, 1127 (`page.getByText(x)` → `page.locator('[aria-label="Notifications"]').getByText(x)`; the assertions are unchanged; without the scope the same text in the announcer makes the locator ambiguous) and `notice-zone.spec.ts` | done (`8981b7c`); proof: role and politeness are the element's own attributes (`role="status" aria-live="polite"`), it is the `- status` node in the accessibility snapshots of the failing-test contexts (e.g. `integrity…/error-context.md`: `- status [ref=e153]`); one addition per notice and no other mutation: `notice-zone.spec.ts` counts MutationObserver records on `toast.said()` = lines said (stage-queue test), and `runs/amendB-8d0d8a6/*.json` `live` rows. The CDP accessibility-tree dump the ruling names was not taken (§9) |
| **E1** loop guard | most notices one real event can raise = **18** (3 recipes a day `quests.ts`; 12 badge kinds, highest new tier per badge `badgeEngine.ts`; 1 level-up; 1 "Saved …"/"Kettle's off"/"Break's over" `flow.ts`; 1 update prompt); a finished brew raises none (`store.ts announce`). Guard raised from 12 to **40** | done (`c43e30b`) |
| **E2** summary proofs on a T + P trial | detached worktree `/home/user/wt/w3t-p` = `8981b7c` + merge of `pe/w2r2-summary@dc7a28d` (merge commit `9848e62`, local only, kettle/src `c573d1a`), dev :5424. P's `Summary.tsx` keeps `div[role=region] > div.scroll > div.sheet` and `motion.footer` (l.232–234, 306): the selector matches the card and the footer's children | **fails on the trial** (§9): the probe finds no stage zone on the summary there (no `[data-notice-zone] [role=img]`), the notices fall back to the viewport and at 390×844 @100 lie over P's card ("How your leaves added up", 56–67 of 57–68 samples; `runs/trialP-summary/`, frame `summary2-390x844…/summary2-1500ms.png`). Cause not found in the time left |

## 4. Control-first runs (raw numbers; files under `T/runs/`)

### 4.1 Defects a–f

| | Control (same session) | Fix |
|---|---|---|
| **a** W2H-D1 | `acf1c6a` :5424: Mark done's centre under the End sheet at the first Today sample (220 ms after the tap), End's notices over the Create/Life chips in **50/50** samples with a notice (`runs/c6h-control-acf1c6a/end-390x844@2:light:100.json`); same on `b377c62` (`runs/c6-control-b377c62/`) | `integrity.spec.ts:1090` 9/9 (390×844, 375×667, 1440×900 × 3; `runs/specs-e44818e/i1090x3.log`); probe `end` 390×844 @100: Mark done on top at every sample, real tap at +0.6 s crosses it off (`runs/nz3-fix/end-390x844…json`); `w2-home.spec.ts` 18/18 (Brew length wholly visible, 9/9 points, ≥ 44 px, real taps, keyboard, at 12 phone configurations) |
| **b** frozen frame | `b377c62` :5410, 390×844 @100: 0.8 s after the real End tap Today is shown with `[role=dialog]` present, `#root[inert]`, Mark done's centre hit-tests to the sheet's `_header` (`runs/c6-control-b377c62/end-390x844@2:light:100.json`); BEFORE meta 0.6 s: footer/header over Mark done | fix: the first sample after the route change has no dialog and `#root` not inert; Mark done on top; taps cross off (`notice-zone.spec.ts` asserts dialog/inert gone 100 ms after the route change at 10 configurations) (table in §4.4) |
| **c** R8-F3 | BEFORE meta `844x390-*-t200-mon` / R8 receipts (toasts above the sheet) | `notice-zone.spec.ts` Ambience tests (844×390, 667×375 @200): 0 samples with a notice while the dialog exists; Close and a sound button on top; real Close tap; the notices back whole (2/2 pass) |
| **d** fold | `b377c62` 667×375 @200, three notices: folded ("Recipe done: Tak…", no icon) (R8 receipt, BEFORE frames) | whole or waiting: `queue` probe 375×667 @200: every drawn notice with its icon and full text; `toast-room` R7-D1 rows: every drawn notice whole with its action on top |
| **e** Next brew | `b377c62` :5410: the recipe notice lies on the running brew's status line in **32/32** samples at 390×844 @100 and **32/32** at 375×667 @200 (and over Skip break 4 samples) (`runs/nz3-control-b377c62/nextbrew-*.json`) | **0/32** and **0/32**, 0 intersections (`runs/nz3-fix/nextbrew-*.json`); `notice-zone.spec.ts` Next brew tests 2/2 (inside the stage, not on the status line) |
| **f** `break-reach:179` | `b377c62` :5410, frozen dates: Mon 12 ✘✘✓, Tue ✓✓✓, Wed ✓✓✓, **Thu 15 ✘✘✓**, Fri ✓✓✓, Sat ✓✓✓, Sun 11 ✓✓✓ (375×667, 390×844, 844×390); both failures "wheel: Put the kettle on not brought into view" | fix: 7/7 days ✓✓✓ (`runs/break-reach-weekdays/`) |

### 4.4 Frozen frame (b): 15 s traces, control first

| Run | rev | first sample on #/ (ms after tap) | dialog / inert at that sample | last sample with dialog or inert | Mark done not on top (ms: first–last, n) | taps (+0.6 s, +2 s) |
|---|---|---|---|---|---|---|
| 390x844@2:light:100 end | 5410 | 562 | (True, True) | 562 | (562, 562, 1) | [{'at': 600, 'crossed': 1, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 390x844@2:light:200 end | 5410 | 337 | (True, True) | 337 | (337, 11648, 102) | [{'at': 600, 'crossed': 0, 'markGone': False}, {'at': 2000, 'crossed': 0, 'markGone': False}] |
| 375x667@2:light:100 rm end | 5410 | 112 | (True, True) | 338 | (112, 1345, 12) | [{'at': 600, 'crossed': 0, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 375x667@2:light:200 rm end-scrolled | 5410 | 124 | (True, True) | 448 | (124, 896, 8) | [{'at': 600, 'crossed': 0, 'markGone': False}, {'at': 2000, 'crossed': 1, 'markGone': True}] |
| 390x844@2:light:100 end | 5424 | 220 | (True, True) | 220 | (220, 220, 1) | [{'at': 600, 'crossed': 1, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 390x844@2:light:100 end | 5421 | 685 | (False, False) | none | none | [{'at': 600, 'crossed': 2, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 375x667@2:light:100 end-scrolled | 5421 | 896 | (False, False) | none | (896, 1345, 5) | [{'at': 600, 'crossed': 2, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 375x667@2:light:200 end-scrolled | 5421 | 1233 | (False, False) | none | (1233, 2016, 8) | [{'at': 600, 'crossed': 2, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 390x844@2:light:200 end-scrolled | 5421 | 1795 | (False, False) | none | (1795, 3360, 15) | [{'at': 600, 'crossed': 2, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 390x844@2:light:100 end | 5421 | 336 | (False, False) | none | none | [{'at': 600, 'crossed': 1, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 375x667@2:light:100 rm end | 5421 | 225 | (False, False) | none | (225, 559, 4) | [{'at': 600, 'crossed': 0, 'markGone': True}, {'at': 2000, 'missing': True}] |
| 375x667@2:light:200 rm end-scrolled | 5421 | 224 | (False, False) | none | (224, 336, 2) | [{'at': 600, 'crossed': 1, 'markGone': True}, {'at': 2000, 'missing': True}] |

Control `b377c62` (:5410) and W2H control `acf1c6a` (:5424): the first Today sample still has the dialog and `#root` inert (112–562 ms after the tap; until 338–448 ms in reduced motion). Fix: never (first Today sample has neither). "Mark done not on top" on the fix rows is the docked start while the page scrolls Mark done into view (`end-scrolled`), never a notice (0 intersections).

### 4.3 Amendment A: stage top-aligned (one and two notices)

| Configuration | Flow | Server | Samples | With notice | ∩ protected | ∩ kettle box (role=img, incl. its empty headroom) | ∩ upper half of Chai's box | Notice boxes (x, y, w, h) | Art boxes |
|---|---|---|---|---|---|---|---|---|---|
| 375x667@2:light:100 | break1 | 5421 | 49 | 48 | **0** | 48 | 48 | [(8, 60, 359, 57)] | kettle [-33, 23, 272, 250], Chai [229, 93, 105, 171] |
| 390x844@2:light:100 | break1 | 5421 | 57 | 56 | **0** | 0 | 0 | [(8, 60, 374, 57)] | kettle [-34, 120, 283, 260], Chai [238, 193, 110, 178] |
| 390x844@2:light:100 | break2 | 5421 | 58 | 56 | **0** | 56 | 0 | [(8, 60, 374, 57), (68, 125, 254, 52)] | kettle [-34, 120, 283, 260], Chai [238, 193, 110, 178] |
| 667x375@2:dark:100 | break2 | 5421 | 54 | 53 | **0** | 52 | 0 | [(20, 12, 287, 57), (37, 77, 254, 52)] | kettle [-14, 128, 220, 202], Chai [197, 185, 85, 138] |
| 375x667@2:light:100 | nextbrew | 5421 | 36 | 28 | **0** | 28 | 28 | [(8, 60, 359, 57)] | kettle [-33, 23, 272, 250], Chai [227, 95, 108, 170] |
| 390x844@2:light:100 | nextbrew | 5421 | 37 | 28 | **0** | 0 | 0 | [(8, 60, 374, 57)] | kettle [-34, 120, 283, 260], Chai [236, 195, 113, 177] |
| 375x667@2:light:100 | over1 | 5421 | 57 | 56 | **0** | 56 | 56 | [(8, 60, 359, 57)] | kettle [-33, 23, 272, 250], Chai [231, 114, 100, 151] |
| 390x844@2:light:100 | over1 | 5421 | 64 | 63 | **0** | 0 | 0 | [(8, 60, 374, 57)] | kettle [-34, 120, 283, 260], Chai [240, 214, 104, 157] |
| 1440x900@1:light:100 | over2 | 5421 | 65 | 63 | **0** | 0 | 0 | [(252, 24, 391, 52), (320, 84, 254, 52)] | kettle [71, 380, 464, 426], Chai [521, 535, 171, 258] |
| 375x667@2:light:100 | over2 | 5421 | 50 | 49 | **0** | 49 | 49 | [(8, 60, 359, 57), (61, 125, 254, 52)] | kettle [-33, 23, 272, 250], Chai [231, 114, 100, 151] |
| 375x667@2:light:200 | over2 | 5421 | 74 | 72 | **0** | 71 | 71 | [(8, 60, 359, 138), (8, 206, 359, 97)] | kettle [-33, 23, 272, 250], Chai [231, 114, 100, 151] |
| 390x844@2:dark:200 | over2 | 5421 | 74 | 71 | **0** | 71 | 71 | [(8, 60, 374, 138), (8, 206, 374, 97)] | kettle [-34, 120, 283, 260], Chai [240, 214, 104, 157] |
| 390x844@2:light:100 | over2 | 5421 | 55 | 54 | **0** | 54 | 0 | [(8, 60, 374, 57), (68, 125, 254, 52)] | kettle [-34, 120, 283, 260], Chai [240, 214, 104, 157] |
| 844x390@2:light:100 | over2 | 5421 | 63 | 62 | **0** | 62 | 0 | [(57, 12, 391, 52), (125, 72, 254, 52)] | kettle [-6, 38, 318, 293], Chai [303, 144, 118, 177] |
| 375x667@2:light:100 | summary1 | 5424 | 71 | 69 | **0** | 0 | 0 | [(16, 463, 343, 57)] | kettle None, Chai None |
| 390x844@2:light:100 | summary1 | 5424 | 68 | 67 | **67** | 0 | 0 | [(16, 639, 358, 57)] | kettle None, Chai None |
| 375x667@2:light:200 | summary2 | 5424 | 74 | 72 | **0** | 0 | 0 | [(16, 223, 343, 138), (16, 368, 343, 97)] | kettle None, Chai None |
| 390x844@2:light:100 | summary2 | 5424 | 57 | 56 | **56** | 0 | 0 | [(16, 580, 358, 57), (68, 644, 254, 52)] | kettle None, Chai None |

- 390×844 @100: one and two notices end at y ≤ 177; the painted steam starts ≈ 205 and Chai's face ≈ 230 (frames `runs/amendA-8d0d8a6/*/…-1500ms.png`; the `role=img` box of the kettle reaches up to y 120 because it includes empty headroom, so the "∩ kettle box" column over-counts). Chai and the kettle whole: **met**.
- 375×667 @100: one two-line notice (60–117) touches the tip of the kettle's handle and steam (≈ 115–120) by ≈ 2 px (frame `over1-375x667…/over1-1500ms.png`); a one-line notice (52 px, ends 112) clears them. **Not fully met** (§9).
- 844×390, 1440×900: top of the stage column, clear of the kettle and Chai. @200: the taller cover is transient (frames in `runs/amendA-8d0d8a6`).
- Summary rows (`hP`, trial T + P): see §9 / E2.

### 4.2 Must-pass reruns

| Item | Result on the fix | Control |
|---|---|---|
| W2H-D1 | above (a) | `acf1c6a` Mark done's centre under the End sheet at the first Today sample (220 ms after the tap), End's notices over the Create/Life chips in **50/50** samples with a notice (`runs/c6h-control-acf1c6a/end-390x844@2:light:100.json`); same on `b377c62` (`runs/c6-control-b377c62/`) |
| R7-D1 | `toast-room.spec.ts` R7-D1 rows (667×375 wheel light, 844×390 touch dark): pass in `runs/specs-e44818e/toast-room.log` (update prompt whole, Update on top, Undo/Update real taps) | `b39202f`: not rerun this round (BLOCKED by browser-slot time; reproduced in round 8 by the lead) |
| R5-D1 / LEAD-D1 | `toast-room.spec.ts` banner rows (375×667, 844×390, 667×375 @200, wheel + touch; endless prompt × light/dark): pass (banner never left, never faded, drift ≤ 0.5 px) | `20671eb` / `e866118`: not rerun (BLOCKED, as above) |
| D4 | `a11y.spec.ts` "toasts never cover the break-over controls" (390×844, 375×667) and `break-reach.spec.ts:179` (f) | f's control table |
| R8-F1 | mechanism removed (no layout animation, no scroll list) | — |
| R8-F3 | (c) | — |
| R8-F5 | `statusbar.spec.ts:106` dark ×3: 3/3 (`runs/specs-e44818e/statusbar106x3.log`) | — |
| R7-7 / F1 | `integrity.spec.ts:1004` @1440 ×3: 3/3; `:1090` 9/9 (incl. 1440 ×3) — no spec change needed: the F1 failure was the frozen End sheet keeping `#root` inert (b) | — |
| round-6 #8 | (e): 0 samples with a notice on the readout | (e) control |

## 5. Invariants and tables

### 5.1 Invariant 1 / 2 / 4
`tests/notice-zone.spec.ts` (sampling in animation frames, ≥ 100 ms apart — what is painted; protected boxes clipped to their clipping ancestors, as drawn): End → Today at 390×844, 375×667, 844×390, 667×375, 1440×900 × 100/200 % (dark at 200 %): 0 intersections in 9 of 10 configurations on `8d0d8a6` (✘ 390×844 @200, §9.10), 0 samples drawn while a dialog / inert root, every drawn notice whole unless taller than its whole band (annotated), Undo ≥ 24×24, one announcement per notice. Stage queue at 375×667 @200, 390×844 @100 (reduced motion), 667×375 @200, 844×390 @200 (reduced motion): 0 intersections, Undo on top at 9/9 points, real taps on Undo and Update act, all notices drawn in turn, announcer mutations = lines said. Results: §6.2.

### 5.2 Waiting at rest (`8d0d8a6`, `runs/rest-8d0d8a6/`; one probe notice raised at rest per screen; band = where it was drawn; "tall" = flagged not whole by the probe)

| Configuration | today | stats | settings | nook | welcome | focus | break | breakOver | summary |
|---|---|---|---|---|---|---|---|---|---|
| 1440x900@1:light:100 | 95–296 (201 px) | 5–229 (224 px) | 661–754 (93 px) | 5–892 (887 px) | 5–671 (666 px) | 754–879 (125 px) tall | 792–879 (87 px) tall | 792–879 (87 px) tall | 792–879 (87 px) tall |
| 1440x900@1:light:200 | 117–468 (351 px) | 5–365 (360 px) | 256–438 (182 px) | 5–892 (887 px) | 728–820 (92 px) | 328–618 (290 px) tall | 328–580 (252 px) tall | 328–618 (290 px) tall | 328–618 (290 px) tall |
| 375x667@2:light:100 | 61–213 (152 px) | 5–577 (572 px) | 178–348 (170 px) | 162–593 (431 px) | 5–438 (433 px) | 66–230 (164 px) tall | 64–197 (133 px) tall | 60–197 (137 px) tall | 64–197 (133 px) tall |
| 375x667@2:light:200 | 135–250 (115 px) | 5–582 (577 px) | 235–477 (242 px) | 271–582 (311 px) | 5–659 (654 px) | 141–316 (175 px) tall | 141–213 (72 px) tall | 60–213 (153 px) tall | 138–213 (75 px) tall |
| 390x844@2:dark:100 | 61–213 (152 px) | 631–716 (85 px) | 666–768 (102 px) | 162–684 (522 px) | 5–615 (610 px) | 64–230 (166 px) tall | 64–230 (166 px) tall | 60–365 (305 px) tall | 64–230 (166 px) tall |
| 390x844@2:light:200 | 135–427 (292 px) | 5–759 (754 px) | 235–477 (242 px) | 271–759 (488 px) | 5–770 (765 px) | 141–425 (284 px) tall | 138–280 (142 px) tall | 60–280 (220 px) tall | 138–280 (142 px) tall |
| 667x375@2:light:100 | 107–278 (171 px) | 5–367 (362 px) | 176–318 (142 px) | 75–367 (292 px) | 294–367 (73 px) | **waits** | **waits** | **waits** | **waits** |
| 667x375@2:light:200 | 145–375 (230 px) | 5–367 (362 px) | 231–367 (136 px) | 75–367 (292 px) | 85–177 (92 px) | **waits** | **waits** | **waits** | **waits** |
| 844x390@2:dark:100 | 59–188 (129 px) | 5–196 (191 px) | 176–318 (142 px) | 75–329 (254 px) | 301–382 (81 px) | **waits** | **waits** | **waits** | **waits** |
| 844x390@2:dark:200 | 145–390 (245 px) | 5–340 (335 px) | 231–382 (151 px) | 75–382 (307 px) | 82–174 (92 px) | **waits** | **waits** | **waits** | **waits** |

- **Today, Stats, Settings, Nook, Welcome:** a band at rest in every row. The first four have no zone and use the viewport; Today uses the Hero.
- **Session-screen columns (focus, break, Break's over, summary):** this probe is not reliable. Its landscape "waits" and portrait "tall" contradict the direct runs on the same code. In `runs/amendA-8d0d8a6/`, notices are drawn whole at the stage's top at 844×390, 667×375 and 1440 on Break's over and the break, with 0 intersections. The zone dump `tools/dbg2.mjs` shows focus with a free band of 60–422 at 390×844 @100 and 12–363 at 667×375 @200. The session rows of this table are therefore **unverified** (§9.6); the probe raises and dismisses the same id in quick succession and was not debugged.

### 5.3 Queue, worst weekday (Monday, End with a recipe + badge + level + the update prompt) at 375×667 @200
Interim run (`runs/nz3-fix/queue-375x667@2:light:200.json`, before the final 2 px fit spare): Today's hero band 138–250 (112 px); drawn one at a time, in order, each whole with its icon and full text and amount: the update prompt (0.1 s) → yields → "Saved 25 minutes of focus" (0.5–3.7 s) → "Recipe done: Take a full tea break · +15 leaves" (3.7–6.9 s) → "Recipe done: Name what you’re brewing · +10 leaves" (7.0–10.1 s) → "New badge: Steady Sipper" (10.2–13.3 s) → "Cozy level 5!" (13.4–16.5 s) → the update prompt back (16.6 s, until acted on). Drain 16.5 s; 0 intersections; no notice withdrawn by a newcomer; no withdraw/re-draw cycle. Final code (`a0aa512`, `runs/probes-a0aa512/queue-375x667@2:light:200.json`): 0 intersections, the same order and drain; the two recipe notices and the update prompt (3 lines at 200 %) are taller than the 112 px band and are drawn with their message scrolling inside the box (60 of 127 samples not whole). **Not met** for those three (§9).

## 6. Tests

### 6.1 Changed assertions (before → after)
- `a11y.spec.ts:346` `overlap('[data-toast-above]')` → `overlap('[data-focus-view] main [data-notice-avoid]:has(button)')` (the same session controls row; the attribute no longer exists in my files).
- `a11y.spec.ts:356` `overlap('footer[data-toast-above]')` → `overlap('[data-focus-view] footer')` (P's attribute is inert; same footer).
- `toast-room.spec.ts:102`, `:203` dock top from `[data-toast-above]` → `[data-start-dock]` (the same docked start).
- `toast-room.spec.ts:297` controls checked against the leaving notice: only those inside `[data-toast-above]` → **every** control on screen (stronger).
- `toast-room.spec.ts` three-toast test: `lis.length === 3` → `lis.length ≥ 1 && drawn + waiting === 3` (queue: as many drawn whole as the stage holds, none lost); `toHaveCount(3)` before Close → drawn + waiting = 3 and one drawn; the "nothing left from the break" wait counts waiting notices too.
- `toast-room.spec.ts` R7-D1 test: `three` `toHaveLength(3)` → ≥ 1 drawn and drawn + waiting = 3, every drawn one whole with its action on top; before each real tap on Undo / Update a wait until it is drawn, and the whole-check again.
- `break-reach.spec.ts`: date frozen (no assertion change). `statusbar.spec.ts`: readiness wait (no assertion change).
- `integrity.spec.ts` l.558, 582, 812, 1127 and `notice-zone.spec.ts`: `page.getByText(t)` → `page.locator('[aria-label="Notifications"]').getByText(t)` (amendment D: the light-DOM announcer holds the same words; same assertion, scoped to the drawn notice).

### 6.2 Suites on the final revision
| Suite | Revision | Result |
|---|---|---|
| `npx tsc --noEmit` | `8d0d8a6` | exit 0 |
| `npx vitest run` | `a0aa512` (src unchanged in vitest scope since) | 28/28 files, 275/275 |
| chromium, full, `--workers=2` | `c43e30b` (`runs/suite-c43e30b/chromium.log`) | **130/132**. ✘ `integrity.spec.ts:637` (whistle → `#/done` not within 15 s under 3-browser load; the summary was rendered at failure; rerun below). ✘ `notice-zone.spec.ts:226` 375×667 @200: the update prompt drawn over the top bar for some samples when Break's over's taller top bar replaced the break's (cause: no re-measure on that DOM change) → fixed in `8d0d8a6` (MutationObserver on any element added/removed); rerun below |
| timer-harness + timer-app + pwa | `c43e30b` | 29 passed, 2 skipped by design (`timer.spec.ts:295` "infra is exercised in the harness", `:439` "render counter lives in the harness") |
| earlier full run | `127526e` (`runs/suite-127526e/`) | 130/132 (✘ `integrity.spec.ts:768` pill read = known R7-12; ✘ notice-zone Ambience 1 sample → fixed in `0616fd2`); timer/pwa 29 + 2 skipped |
| targeted reruns, `8d0d8a6` (`runs/specs-8d0d8a6/`) | `8d0d8a6` | `toast-room.spec.ts` **14/14**; `integrity.spec.ts:1090` ×3 at 390/375/1440 **9/9**; `:768` ×3 **3/3**; `:637` ×3 **2/3** (✘ once: `summaryBox intercepts pointer events` on "Long tea break" click under load; the same test failed differently on `c43e30b` and passed on `127526e`; not traced, §9); `notice-zone.spec.ts` **18/19** (✘ End → Today at 390×844 @200: after Mark done is scrolled into view, "Saved 3 minutes of focus" intersects the tag chips and Brew length in 24 of 62 painted samples; the probe `end-scrolled 390×844 @200` on the same code had 0. **Invariant 1 violation, not yet traced**, §9) |


## 7. Captures
Captured with the orchestrator's own `r2before.mjs`, unedited (copy in `.tmp/`), against the fix (dev :5421, `8d0d8a6`). Same frozen date and clock as BEFORE (`--at 2026-10-12T07:40Z` for `-mon`), same states and `meta.json` facts (toasts, covered controls). AFTER folders are in `T/after/<cfg>/`; BEFORE is `/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/BEFORE-b377c62/<cfg>/`.

- **Taken:** home + summary at 390×844 light @100, 375×667 light @200, 390×844 dark @200, 1440×900 light @100 and dark @200. The Monday flows (End → Today, Break's over, Next brew) as far as the job reached before the hard stop (see the folder list). The summary on the T + P trial at 390×844 @100, 375×667 @200 and 1440 @100 is in `T/after-trial-P/` (finished brews raise no notices, so these show the summary with nothing over it).
- **Read side by side, 390×844 light @100 Monday (`meta.json`):**
  - **BEFORE `03-today-after-end-0.6s`:** the End sheet is still a dialog over Today, and "Saved 3 minutes of focus" is at y 606, over the Create and Life chips.
  - **AFTER:** no dialog; the notice is at y 161 over Chai and the bubble; nothing is covered.
  - **BEFORE `06-break-over-0.6s`:** "Recipe done…" is at y 546, over the panel.
  - **AFTER:** it is at y 60, at the top of the stage under the Close button.
- **At 375×667 @200 (`T/after/375x667-light-t200/01-home.png`):** Brew length is in the dock (2×2 options) above "Put the kettle on · 25 min", and the note "Then a 5 min tea break." no longer has the link.
- **Missing:** the full configuration set, reduced motion, and the REFERENCE → BEFORE → AFTER triples written out for K01, K02 and K03 (§9.8).

## 8. Residuals / disclosures
- Today in landscape at 200 % text: End's single notice is taller than the pinned greeting column's free band. It is drawn with its message scrolling inside its own box: no clamp, nothing covered. The spec annotates it as `drawn taller than the whole band`.
- `data-toast-above` remains in `screens/done/Summary.tsx` (P's file) and is inert.
- `integrity.spec.ts:768` (R7-12 pill read) failed once on `127526e`; it is rerun ×3 in §6.2.
- UNKNOWN: real devices, WebKit and Firefox, and real assistive technology. Announcements were counted as live-region mutations.

## 9. WIP: exactly what is missing

1. **Amendment B (REJECT-level as it stands).** Only "Crossed off · Undo" at scroll 0 at 390×844 @100 is drawn at once (Hero band; 9/9 points; `runs/amendB-8d0d8a6/end-390x844…`).
   - At 375×667 @100 with Mark done scrolled into view, it waits ≈ 3 s, until End's "Saved …" leaves the composer band.
   - At 375×667 and 390×844 @200 scrolled, it never draws: no band ≥ its height is in view. The Hero has scrolled off, and the composer heading band is shorter than a 200 % Undo notice (≈ 140 px). See `runs/amendB-8d0d8a6/end-scrolled-*`.
   - History delete ("Brew deleted · Undo") and the Settings import ("Backup restored · Undo") have no zone and no rows. Nothing implements "a zone near the action" for Stats or Settings yet.
   - The B proof rows (dialog-leave frame → first draw frame ≤ 1, box, 9/9, real Undo restoring) are not produced.
2. **Amendment E2.** Summary proofs on the T + P trial fail (see §3b E2). On the trial no stage zone is found on the summary, and notices sit over P's card at 390×844 @100. The cause has not been found yet. K02 and K03 with notices, and PRESERVE 8, are therefore not proven.
3. **Amendment A.** At 375×667 @100, a two-line notice touches the kettle's handle and steam tip by ≈ 2 px (one-line notices clear).
4. **Amendment D.** A CDP accessibility-tree dump of the announcer was not taken. Role and politeness are shown by attributes and the accessibility snapshot only.
5. **Queue (gate §4.4).** At 375×667 @200 on Today, the three-line notices (two recipes and the update prompt) scroll inside a 112 px band instead of being whole.
6. **"Waits at rest = none" table: session screens unverified** (§5.2). The non-session screens are done at 10 configurations. The session rows need a fixed probe.
7. **Full chromium suite on the final code `8d0d8a6`.** It ran on `c43e30b` (130/132). `8d0d8a6` adds the subtree MutationObserver only, plus the targeted reruns in §6.2.
8. **Captures.** AFTER covers 11 configurations (`T/after/`), not the full BEFORE set. Reduced motion and the written K01/K02/K03 REFERENCE → BEFORE → AFTER triples are missing (§7).
9. **Must-pass controls rerun on their own revisions.** R5-D1 (`20671eb`), LEAD-D1 (`e866118`) and R7-D1 (`b39202f`) were not rerun; their specs pass on the fix (§4.2). D4's control is the weekday table (f).
10. **Invariant 1 at 390×844 @200 after Mark done is scrolled into view** (`notice-zone.spec.ts` End → Today, `runs/specs-8d0d8a6/notice-zone.log`): "Saved …" over the tags / Brew length in 24/62 samples. Cause not traced. Also `integrity.spec.ts:637` 2/3 (summary CTA click intercepted by the summary box once).
11. **R8-F1 measured "not worse".** Argued only (the layout animation and the scroll list are gone); no clip measurement was taken.
