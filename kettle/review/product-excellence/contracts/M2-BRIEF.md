# M2 brief — Access and device quality (I04, I05, I14 baseline)

**Mission.** Make Kettle's critical journey genuinely usable for everyone on every supported screen, make the
whistle's real behavior honest, and record the performance baseline before anyone changes art or motion — fixing
only measured failures, with the existing tokens and components.

- Worktree: `/home/user/wt/m2/kettle` (branch `pe/m2`). Dev port **5202**; Playwright `KETTLE_PORT=5222
  KETTLE_PWA_PORT=5232`; production preview for perf on **5242**.
- Read first: `review/product-excellence/PROTOCOL.md`; package `MASTER_EVIDENCE_MATRIX.md` sections I04, I05, I14;
  `PRESERVE_LIST.md` (all; especially 1, 3, 4, 6, 7, 8); `REFERENCE-GUIDE.md`; `docs/ARCHITECTURE.md`,
  `docs/areas/design-system.md`, `audio.md`, `home.md`, `core-loop.md`; `docs/REAL_DEVICE_CHECKLIST.md`.
- **File ownership (exclusive while active):** `src/ui/**`, `src/styles/**`, `src/app/Shell*`, `src/app/Rail*`,
  `src/audio/**`, `src/lib/haptics.ts`, `src/timer/notify.ts`, accessibility/layout fixes inside `src/screens/**`
  (home, welcome, focus, done, nook, stats, settings) **except** `src/screens/settings/DataSection.tsx`, plus new
  tests/tools. Maker M1 concurrently owns `src/timer/**` (other than `notify.ts`), `src/progress/**`,
  `src/app/{flow,intention}.ts`, `src/lib/storage.ts` and `DataSection.tsx` — do not edit those; if you need a
  change there (e.g. `src/timer/announce.ts`), describe it in your packet.
- BEFORE captures (revision 8f1044a, 22 states × 6 configs + reduced motion):
  `/home/user/Vibei/kettle/review/product-excellence/baseline/<phone-390x844|phone-375x667|desktop-1440x900>-<light|dark>/`.

## Step 0 — I14 performance baseline (do this FIRST, on unmodified code)

Before you change anything, measure the current production build (`npx vite build --outDir <tmp dir>` then
`npx vite preview --outDir <tmp dir> --port 5242`). Write a reusable script `review/product-excellence/tools/perf.mjs`
so the identical measurement can be repeated on the integrated AFTER revision. Record, median of ≥3 runs, phone
(390×844, DPR 2, mobile emulation) and desktop (1440×900):
- device/browser/renderer (`nproc`, CPU model, Chromium version, SwiftShader CPU rendering) and conditions;
- startup: TTFB, FCP, LCP, DOMContentLoaded, load, first-interactive proxy (Start enabled and a click handled);
- input responsiveness: Event Timing (`PerformanceObserver` type `event`, `durationThreshold: 16`) for Start,
  Pause, Resume, +5, Tea time; plus click→next-frame time;
- layout shift (CLS) through Home → focus → whistle → summary → break, and on Nook load;
- memory: JS heap (CDP `Performance.getMetrics`) on Home, Focus, Summary, Nook (3D on);
- bytes: JS/CSS/image/3D chunk transfer; 3D first-render time; Chai asset intrinsic size vs CSS size × DPR at
  phone and desktop (this informs I06 — report it, do not change art).
Write `review/product-excellence/perf/BASELINE.md` (+ JSON). Real-phone performance, battery/energy and GPU frame
pacing are **BLOCKED** here (CPU-only container) — say so; never claim 60 FPS.

## I04 — Access and short-screen reachability (P0)

Verify on the real app, both themes, at 390×844, 375×667, 1440×900, plus 320×568 reflow, 200% text, keyboard-open
and reduced motion:
1. **Keyboard + screen reader semantics** of the critical journey: Welcome → first brew; Home → set task, tag,
   duration → start → pause/resume → +5 → End sheet → whistle → summary (Done/Carry, details) → Tea time → break →
   next brew / finish; Stats, Nook, Settings. Visible focus everywhere; logical order; dialogs/sheets trap focus,
   close on Esc and **restore focus** (Q06); accessible names on icon buttons; live regions never announce the
   countdown every second (check `src/timer/announce.ts` behaviour; report, don't edit it).
2. **axe-core** (`@axe-core/playwright` is installed) on every state, both themes: zero serious/critical.
3. **Contrast measured** (not eyeballed): 4.5:1 normal text, 3:1 large text and required control/focus visuals,
   both themes, including text over the stage/scene (`scripts/contrast.mjs` exists — reuse or extend).
4. **Targets:** every pointer target ≥24×24 CSS px or a valid WCAG 2.5.8 exception; primary touch controls aim
   for 44×44. Measure all interactive elements per screen and list failures.
5. **Short screens / keyboard open / 200% text / 320 px reflow:** every control and the final expanded summary
   line stay reachable; no clipped text or horizontal scroll; the persistent Tea time/Skip footer and the docked
   Home start stay usable. Emulate the open keyboard by shrinking viewport height with the task field focused.
6. **Duration discoverability (from the audit):** on initial Home at 390×844 the Brew length control is partly
   covered by the docked "Put the kettle on" button; at 375×667 it is below the fold (see baseline `01-home`,
   `01b-home-scrolled`). Decide from evidence whether the existing editable duration is "unmistakable"; if not,
   improve it with existing components — **keep** the five wrapping categories, all four durations
   (15/25/50/Custom), the docked start and its "· 25 min" label, and no new onboarding.
7. **Reduced motion:** OS setting and in-app Motion preference both keep every fact in still/fade states.

Observable success (matrix): all controls and the last summary line reachable at 375×667 and 390×844, with the
keyboard open and at 200% text; the editable duration unmistakable without undoing wrapping or the sticky footer;
critical journey works with keyboard and screen reader; contrast measured; targets ≥24 px (primary ≥44 px);
reduced motion retains all information.

## I05 — Real whistle, mute and ambience expectations (P0)

Inspect the actual audio and notification implementation (`src/audio/**`, `src/timer/notify.ts`, Settings
Sound and "Notifications & device" rows): when the AudioContext unlocks, what happens when the tab is hidden or
the phone locks, muted state, denied/unsupported notification permission, permission timing (only on a user
action, never a gate before value), and late return (the whistle must not play twice — coordinate with M1's
exactly-once findings by reading their branch only if needed). Verify in Chromium what can be verified (muted →
no sound but the visual whistle remains; denied permission → the UI states it and offers the browser path;
re-enabling later works). Where a genuine platform limit exists, explain it **once, at the relevant control**, in
Kettle's voice — no push campaign, no promise of lock-screen or background audio.
Real-device normal/muted/denied/late-return audio on phones is **BLOCKED** here: record it as such with the exact
manual steps for `docs/REAL_DEVICE_CHECKLIST.md`.

## Concrete benchmarks (open them first)

| ID | File (under `.tmp/pkg/kettle-excellence-integrated/`) | Study | Do not copy |
|---|---|---|---|
| K01 | `VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png` (+ baseline `01b`) | One clear Start, plain time facts, reachable controls | Do not infer unreachable duration from a cropped view; no questionnaire or extra dashboard |
| K02 | `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png` | Minutes and Tea time outrank secondary facts; final-line clearance | No carousel, no forced claim |
| K04 | `VISUAL_BENCHMARK_LIBRARY/assets/current/recordings/whistle-to-summary-phone-dark-reduced-motion.mp4` + `…-frames.jpg` | Continuity; reduced motion keeps information visible | Silent clip proves no audio/FPS |
| K09 | `VISUAL_BENCHMARK_LIBRARY/assets/current/live-settings.jpg` | Existing grouped Settings (Sound, Notifications) | — |
| K03 | `VISUAL_BENCHMARK_LIBRARY/assets/current/11b-summary-unlock-settled.png` | I14: the 3D close-up must not block completion | Do not replace with a whole-room thumbnail |
| Q02/Q03/Q06 | WCAG 2.2, C39 reduced motion, APG modal dialog (links in `REFERENCE-GUIDE.md`) | Normative bars | Selected checks ≠ full conformance |

## Deliverables

- `perf/BASELINE.md` + JSON + `tools/perf.mjs` (Step 0, unmodified code).
- `contracts/I04/READY-FOR-REVIEW.md`, `contracts/I05/READY-FOR-REVIEW.md`, `contracts/I14/BASELINE-READY.md`
  (format in PROTOCOL.md) with: audit tables (axe results, contrast table with measured ratios, target-size table,
  keyboard journey log with focus-restoration results, reflow/200%/keyboard-open results), fixes with BEFORE/AFTER
  captures at 390×844, 375×667, 1440×900 in both themes (+ reduced motion where motion is involved), and
  BLOCKED/UNKNOWN items.
- A reusable automated a11y check (Playwright spec, e.g. `tests/a11y.spec.ts`) covering axe + target sizes +
  keyboard journey + focus restoration, runnable later as a regression gate.
- Commit on `pe/m2` per PROTOCOL.md. Return **READY FOR REVIEW** with the commit hash.
