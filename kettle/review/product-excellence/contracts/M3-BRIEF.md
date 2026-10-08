# M3 brief — Activation and progression clarity: I08, I07, I09

**Mission.** A newcomer understands in one glance that Kettle is *focus, then an optional tea break*, starts a real
15-minute brew with one action, and after their first brew understands — once, briefly — what leaves do and where
the earned thing lives. Earned objects must persist and always be recognizable, even when 3D fails.

- Worktree: `/home/user/wt/m3/kettle` (branch `pe/m3`). Dev port **5203**; Playwright `KETTLE_PORT=5223
  KETTLE_PWA_PORT=5233`.
- Read first: `review/product-excellence/PROTOCOL.md`; package `MASTER_EVIDENCE_MATRIX.md` I07, I08, I09 (and I13,
  I15 for boundaries); `PRESERVE_LIST.md` (all; especially 5, 7, 8, 9, 10); `KETTLE_CURRENT_PRODUCT_AUDIT.md`
  ("Four bounded opportunities"); `docs/areas/home.md`, `core-loop.md`, `progress.md`, `scene.md`.
- **File ownership:** `src/screens/welcome/**`, `src/screens/done/**`, `src/screens/nook/**`,
  `src/screens/home/**` (copy only, for I08 consistency), `src/scene/index.tsx` and `src/scene/Fallback.tsx`
  (fallback behavior only), new tests. Read-only: `src/progress/**` (rules must not change).
- BEFORE captures: `/home/user/Vibei/kettle/review/product-excellence/baseline/*/` — states 12 (welcome), 13 (first
  brew), 14 (first-brew summary), 07/08 (routine summary), 11/11b (unlock), 17/18 (Nook early/earned).


## Starting point (finalized against the integrated Wave 1 revision)

- Base: the integration branch at the Wave 1 integration commit (`0d58c5e` = 8f1044a + approved M1 `a6ebe00`
  + approved M2 `2becb78`). Your worktree starts there.
- **BEFORE for your AFTER comparisons** is the integrated revision, captured in
  `/home/user/Vibei/kettle/review/product-excellence/integration/wave1/captures/<config>/` (same 22 states,
  6 configs). The original 8f1044a baseline (`review/product-excellence/baseline/`) stays the pre-rebuild record.
- Approved Wave 1 changes you must preserve (they are approved contracts; changing their behavior needs re-review):
  - M1 (I01–I03): storage-failure warning toast logic in `src/app/flow.ts` (held while whistle/summary/break or
    while it would overlap session controls/docked buttons); storage-full safety in `src/lib/storage.ts`,
    `src/timer/sync.ts`, `src/progress/portability.ts`. Integrity spec: `tests/integrity.spec.ts`.
  - M2 (I04/I05/I14): summary sheet layout-shift fix (`Summary.tsx`/`.module.css`, CLS 0.5 → 0 — keep it 0);
    Home "Change brew length" link beside "Then a 5 min tea break." (checker judged the sky link colour
    acceptable; keep it); StatusBar wrapping at 200% text; toasts float above elements marked `data-toast-above`
    (session controls, Tea time/Skip footer, Home docked start); Nook hint not sticky at desktop; disabled-slider
    contrast; focus rings; Welcome step copy about notifications. Regression gates: `tests/a11y.spec.ts`,
    `tests/whistle.spec.ts`, `review/product-excellence/tools/a11y-audit.mjs`, `review/product-excellence/tools/perf.mjs`.
- Run `tests/a11y.spec.ts` and the integrity spec before submitting if you touched any screen they cover.

## I08 — Plain purpose and immediate first useful brew (P1)

Current: Welcome says "Hi, I'm Chai. Let's start small: one 15-minute brew. I'll keep you company." The tea
metaphor may not tell an unfamiliar user that this is a focus session followed by an optional break.
Change: one brief plain purpose line (e.g. what a brew is and that a tea break follows), keeping the optional task,
the single "Start a 15-min brew" action, "Set things up first" and "I have a backup". No extra screens, no account,
no forced name or task. Success: an unfamiliar reader can say "15 minutes of focus, then an optional break" from
the first screen and start with one action; the duration and the action stay explicit.
References: **K06** `VISUAL_BENCHMARK_LIBRARY/assets/current/r6-context/phone-light/12-hello.png`; **B01**
`VISUAL_BENCHMARK_LIBRARY/assets/official/finch-publisher-04.jpg` (manageable goal tied to the companion —
promotional, not first-run proof); **B04** `VISUAL_BENCHMARK_LIBRARY/assets/official/headspace-today-explore-2023.jpg`
(plain, calm hierarchy). Do not copy their layouts, colors or questionnaire-style onboarding.

## I07 — Explain effort → leaves → level → Nook, once (P1)

Current: Home and the summary show warm days, leaves, levels, goals and recipes with similar weight; the
relationship is never stated. Change: at the **first relevant completion** (the first-ever brew summary, and/or
the first summary that grants leaves) explain the existing relationship **once** in one short line or the existing
details area: minutes brewed earn leaves; leaves raise the cozy level; levels bring things to the Nook. Later
summaries stay exactly as compact as now; arithmetic stays on demand ("How your leaves added up"). Tea time keeps
its visual priority; the sticky footer and final-line clearance stay intact. No new currency, no CLAIM button, no
change to reward arithmetic. Success: a new user can explain what leaves do and locate the earned object; minutes
and bonuses match the existing policy.
References: **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png`; **K03**
`…/assets/current/11b-summary-unlock-settled.png`; **B07** `research/videos/xWGC4Pc3w5E/06-completion-and-quest.png`
(visible 25 XP / 75% / 1:39 facts — transfer: facts stated plainly; **do not** copy the blue CLAIM XP gate or quests).

## I09 — Recognizable persistent Nook outcome and fallback (P1)

Verify: an earned object stays in the Nook (3D room and the "Cozy things" grid) after reload; labels are truthful
("10 of 14 cozy things"); with 3D off (Settings), WebGL unavailable, or the 3D chunk failing to load, the Nook and
the unlock card keep a recognizable drawing and all controls stay usable; reserved media space prevents layout
shift. The accepted unlock sequence (record-player drawing → settled close-up) is protected: do not reopen it.
Repair only actual missing feedback or failed-media behavior.
References: **K03** (above, paired with `…/assets/current/11-summary-unlock.png`); **K08**
`…/assets/current/live-nook.jpg` (inhabited early Nook). Do not add a cabinet, pantry, sharing or new economy.

## Deliverables

`contracts/I08/`, `I07/`, `I09/` READY-FOR-REVIEW packets; REFERENCE/BEFORE/AFTER captures at 390×844, 375×667,
1440×900 in both themes for every changed state (12, 14, 07/08 where touched, 11/11b, 17/18), reduced motion where
relevant; tests for persistence/fallback (e.g. Playwright: earn → reload → object present; 3D chunk blocked via
route abort → drawing + working controls). Commit on `pe/m3`. Return **READY FOR REVIEW**.
