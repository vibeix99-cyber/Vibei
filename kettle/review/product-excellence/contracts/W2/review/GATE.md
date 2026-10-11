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
