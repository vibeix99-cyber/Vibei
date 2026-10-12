# Wave 2 round 1: packet gates (orchestrator)

**Base:** `90a11e5`, where Wave 1 closed.
**BEFORE set:** `contracts/W2/BEFORE-90a11e5/`. 16 configurations × 15 states, frozen clock, 0 errors.
**Control servers** (`90a11e5`): dev :5310 (debug API), preview :5330.

## Maker N: room and Nook (I09 + I06 prep). GATE PASSED, 22:58 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w2n/kettle/review/product-excellence/contracts/W2/N-READY-FOR-REVIEW.md`. Evidence is in `…/W2/N/` (147.5 MB), and CHAI-3D-SPEC is at `…/W2/N/CHAI-3D-SPEC.md` |
| Revision | Branch `pe/w2-room@fc9f6d8`, which is code commit `5d7bb23` plus the packet. `kettle/src` is `81cd36ea83419e210f9360efea397153e1de7860` for both |
| **Trial merge** | **`2acc218`** = integration `cb79496` + `fc9f6d8`. Sparse detached worktree `/home/user/wt/w2t-n`. src `81cd36e` (equal to the branch) |
| Files (ownership OK) | `src/scene/Fallback.tsx`, `src/scene/index.tsx`, `src/scene/stills/items.json`, `src/scene/stills/items/*.webp` (40 files, 391,542 B), `src/screens/nook/NookScreen.tsx` and `.module.css`, `scripts/stills/render-item-layers.mjs`, `scripts/stills/window.html`, `tests/w2-room.spec.ts`. **No** engine, art, UI, summary, Home or FocusScreen file changed. The 12 base stills are byte-identical |
| Control-first | `w2-room.spec` on `90a11e5`: 5 failed, 1 passed (the 3D-on guard). On `5d7bb23`: 6/6 |
| Suites (maker) | tsc pass; vitest 267/267; chromium 72 passed + 1 failed (`a11y.spec.ts:109`, a load-timing failure) + 7 not run (the serial file). a11y rerun 11/11. timer/pwa 29 passed + 2 skipped by design |
| 375×667 room-disappears report | Not reproducible on `90a11e5` (67 samples, including throttled runs). No change. The maker attributes it to a capture-environment context loss in the audit run |
| Servers | Trial N dev **:5340** (served `Fallback.tsx` verified against the commit), preview **:5350** |
| Archive | `archive/pe-w2-room-fc9f6d8.incremental.bundle.part-00..02` (+ `.sha256`). Reassembled and verified |

## Maker H: Home and first visit (I08 + #2). Submitted as WIP with a disclosed blocker, 23:03 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w2h/kettle/review/product-excellence/contracts/W2/H-WIP.md`. Evidence is in `…/W2/H/` (48 MB) |
| Revision | Branch `pe/w2-home@acf1c6a`, which is code `7a961b7` plus evidence. `kettle/src` is `6d5fbaf9fd598eee1abe52833faaabcd25193de4` |
| **Trial merge** | **`4921ee4`** = integration `a2caeb8` + `acf1c6a`. Sparse worktree `/home/user/wt/w2t-h`. src `6d5fbaf` |
| Files (ownership OK) | `src/screens/home/{Composer.tsx,HomeScreen.tsx,Home.module.css}`, `src/screens/welcome/{WelcomeScreen.tsx,Welcome.module.css}`, `tests/w2-home.spec.ts` (new, 18 tests), `tests/a11y.spec.ts` (one line, H-owned: Today at rest no longer excuses a "partially obscured" target-size) |
| Control-first | #2 reproduced on `90a11e5` at all 12 phone configurations. The new spec fails 18/18 on `90a11e5` |
| Acceptance (maker) | All 12 phone configurations: every option is wholly visible at rest, on top at 9/9 points, and ≥ 62.6×44. axe 0 serious and 0 target-size. Real taps on 15/25/50/Custom. Keyboard reach (radio group: Tab, then arrow keys). First visit fits 375×667 @100 |
| Suites (maker) | tsc pass; vitest 267/267; chromium **90/92**: `integrity :309` (load; passes alone) and **`integrity.spec.ts:1090` @390×844, which fails alone too**. It passes 3/3 on `90a11e5`. timer/pwa 29 passed + 2 skipped |
| **Disclosed blocker** | The taller portrait dock, which now holds Brew length, raises the toast lift by about 60 px. After End, the two toasts ("Saved…", "Recipe done…") cover Today's **"Mark done"** (centre y 538.6) and the frozen test's tap lands on a toast. Same class as R7-7 (follow-up #9). The maker offered 3 options and took none |
| Servers | Trial H dev **:5342** (served `Composer.tsx` verified), preview **:5352** |
| Archive | `archive/pe-w2-home-acf1c6a.incremental.bundle` (44 MB, verified) |

**The orchestrator's handling:** H is a complete, reviewable revision with one disclosed blocker. It goes to the lead for a verdict now. On REJECT, H gets its one 90-minute fix round, followed by a targeted re-review (Lane H) of the fix revision.

## Maker S: Summary (I07 + #1). Submitted as WIP: code final, evidence gaps, 23:10 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w2s/kettle/review/product-excellence/contracts/W2/S-READY-FOR-REVIEW.md` (status WIP, §9 lists what is missing). Evidence is in `…/W2/S/` (54 MB): `captures/AFTER/`, `control/`, `probes/`, `suites/`, `tools/` (`cap.mjs`, `caps.sh`), `acceptance-AFTER.md`, `facts-*.md` |
| Revision | Branch `pe/w2-summary@e0f511a`. The last code commit is `f95e0be` (a harness fix to the maker's own spec); after it come only evidence and the packet. `kettle/src` is `67505713c6c04c6c9e536617b52f3b2549f2e918` |
| **Trial merge** | **`3726a71`** = integration `d62c4a4` + `e0f511a`. Sparse worktree `/home/user/wt/w2t-s`. Dev **:5341** (served `Summary.tsx` verified against the commit), preview **:5351** |
| Files (ownership OK) | `src/screens/done/{summary.ts,Summary.tsx,Summary.module.css}`, `src/screens/done/rank.test.ts` (new, 8 tests), `tests/w2-summary.spec.ts` (new, 8 tests). It does **not** touch `FocusScreen.*`, toasts, `src/ui`, Home or the scene |
| Design | One highlight at most, by rank: unlock (the existing close-up) > level > best streak > badge > Tea Cozy. Everything else stays as the compact pills in the model's order, and nothing is dropped (`summary.test.ts` is untouched and green). Fix for #1: the opening lift is snapped so the fold falls between lines, and the fade drops from 22 to 14 px |
| Control-first | On `90a11e5` (:5310), 375×667, settled: lines cut on arrival (the third pill row half under the footer). `w2-summary.spec` fails on `90a11e5` and passes on the branch (per the packet, §3 and §7) |
| Suites (maker) | tsc pass; vitest 275/275; chromium 80/82: `:768` (load) and **`integrity.spec.ts:1090`, which failed twice** (Today flow, no summary; **not checked on `90a11e5`**). timer/pwa 29 passed + 2 skipped |
| **Missing for READY** | (1) big-day AFTER captures on the final build for 13 of 16 configurations; 3 were retaken on `cdc6035` and 13 are from `da5f452`, which had an extra pill row on some sizes; (2) same-session BEFORE captures; (3) `:1090` on `90a11e5` |
| Residual (maker) | At 844×390 @100 on the big day, the record-player close-up picture (no text) starts under the fold on arrival. The same happens on `90a11e5` |
| Archive | `archive/pe-w2-summary-e0f511a.incremental.bundle` (40.9 MB, verified) |

**The orchestrator's handling:** the code is final, and the gaps are evidence only. S goes to the lead now. Lane S takes
the missing same-session BEFORE/AFTER big-day captures at all 16 configurations on :5330 and :5351. Lane S also runs
`:1090` in isolation on `90a11e5` and on the S trial, so the lead can grade the S revision as it stands.

## Combined trial for Lane R (every packet past the gate except H)

**`248415c`** = `1215061` (integration `d62c4a4` + `pe/w2-room@fc9f6d8`) + `pe/w2-summary@e0f511a`. Sparse worktree
`/home/user/wt/w2t-c`. src `5b0bc778ba020b122804fcd3eb568b5229236bb0`. Dev **:5345**, preview **:5355**. Served
`Summary.tsx` and `Fallback.tsx` were verified against the commit. H joins only if it is approved; if H is merged, Lane R
reruns on the merged tree.

## Economy resume, 2026-10-12 (Vibei's rulings)

### N fix round (N-F1, items floating on the bare sky). GATE PASSED, 01:12 UTC
- Revision: `pe/w2-room@92241c2`. Code `c381ccb`, src `4b49254`. Packet `/home/user/wt/w2n/…/contracts/W2/N-FIX-READY-FOR-REVIEW.md`.
- Changed: `src/scene/Fallback.tsx` (+22/−2: layers wait for the base still's `img.decode()`) and `tests/w2-room.spec.ts` (+1 test). Ownership is OK.
- Maker's results: under CPU 6× with a cold cache, items floated in 6 of 6 brew starts on `fc9f6d8` (13 frames) and 0 of 6 on the fix. `w2-room.spec` passed 7/7; the new test fails on the old `Fallback.tsx`. tsc 0; vitest 267/267.
- **Trial merge `55eb968`** = integration `3f78e0c` + `92241c2`, worktree `/home/user/wt/w2t-n2`, dev **:5346**, preview **:5356**. Served `Fallback.tsx` verified. Control: the old N trial `2acc218` on :5340 / :5350.
- Archive: `archive/pe-w2-room-fix-92241c2.incremental.bundle`.

### H split (Vibei: the fix round was cut off, so H is split)
- **First visit only:** `pe/w2-firstvisit@1b38509`, src `58aac00`, made by the orchestrator as a mechanical split.
  - `src/screens/welcome/{WelcomeScreen.tsx, Welcome.module.css}` are byte-identical to H's `7a961b7`.
  - `tests/w2-firstvisit.spec.ts` is H's first-visit test from `w2-home.spec.ts`, unchanged, with only the helpers it uses.
  - Content: the Hello line becomes "Kettle is focus time, then a tea break if you want one."; one primary action, the 15-minute brew; "Set things up first" and "I have a backup" become quiet links.
  - vitest 267/267; tsc 0.
  - Spec, base first: `90a11e5` **0/6** (6 failed), split **6/6** (`review/FV/spec/`).
  - Matched AFTER captures: `review/FV/AFTER-1b38509-5353/` at 16 configurations (first visit, plus full page), 0 errors. BEFORE: `contracts/W2/BEFORE-90a11e5/<cfg>/00-first-visit*.png`.
  - Servers: dev **:5343**, preview **:5353**.
- **Brew length (#2): withdrawn.** It is recorded as a structural coupling for the I10 toast round: toasts anchor to the start panel's height (`[data-toast-above]`), so a taller dock lifts End's toasts over Today's Mark done (W2H-D1). H's branch `pe/w2-home` (`acf1c6a`, fix WIP `4baf228`) stays archived and unmerged.
