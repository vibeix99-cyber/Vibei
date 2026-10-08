# I04 — Access and short-screen reachability · CHECKER r1

**Verdict: APPROVE**

- **Reviewed commit:** `2becb78` (branch `pe/m2`), diff base `6ddcdaa` (app code = `8f1044a`).
- **Checker worktrees:** `/home/user/wt/chk-m2` (detached `2becb78`), `/home/user/wt/chk-m2-base` (detached `6ddcdaa`); dev
  servers 5253/5254 (private Vite cache dir), production builds (`vite build`) previewed on 5273 (fix) / 5274 (base).
- **Proposed state accepted:** FIXED for everything Chromium can measure; screen-reader, real on-screen keyboard, real
  OS text size and real touch remain honestly **BLOCKED** (`docs/REAL_DEVICE_CHECKLIST.md` §9).

## What I ran (results)

| Command / probe | Result |
|---|---|
| `npx tsc --noEmit --pretty false` | clean |
| `npx vitest run` | 24 files, 256 passed |
| `KETTLE_PORT=5253 KETTLE_PWA_PORT=5263 npx playwright test tests/a11y.spec.ts --project=chromium` | **9 passed** (8.1 min): axe light + dark, targets, 375×667 reach, keyboard journey with focus trap/Esc/restore (92 stops, 0 without a visible focus change, 0 obscured), welcome by keyboard, quiet live regions, toast clear of controls at 390×844 and 375×667 |
| `… tests/whistle.spec.ts` | 8 passed |
| `… --project=timer-harness --project=timer-app --project=pwa` | 29 passed, 2 skipped (unchanged suites) |
| `node review/product-excellence/tools/a11y-audit.mjs --base http://127.0.0.1:5273 --configs 390x844@2,375x667@2 --themes light,dark` (all suites) on the **2becb78 production build** | axe: **0 serious/critical** in 68 main states (+1 scroll-dependent target-size per config, the same nodes the packet lists; they pass when scrolled clear); 0 moderate/minor. Measured contrast: 165 rows, 159 pass, 6 incidental (`aria-hidden` art numerals repeating adjacent text), **0 FAIL** (the packet's "· Work" 3.64 sampling artifact did not reproduce). Targets: 762 measured, 754 ≥ 44, 8 in 24–44 (Change brew length 146×24, a Stats history row ~39×192), **0 < 24**. Reach/main: 0 covered, 0 horizontal scroll. 320×568 reflow: 0 covered, 0 hscroll. 200 % text (390/375/1440): 0 covered, 0 hscroll; only clipped item is the task field's placeholder hint (label carries the name). Keyboard-open 390×508 and 375×376: focused field visible, 0 covered (Skip link off-screen by design). Reduced motion: 0 facts missing in 17 states |
| Own keyboard probe (production build, 375×667, both themes) | Tab order reaches "Change brew length" after "Put the kettle on · 25 min", 3 px focus outline visible (`:focus-visible`); Enter moves focus to the checked "25 min" radio (focus visible, 239–284 px, clear of the dock at 330, hit-test is the radio); ArrowRight → "Put the kettle on · 50 min" |
| Own contrast/target spot-check (computed colours) | link 6.04:1 light / 10.07:1 dark; dock note 6.74 / 10.21; disabled slider labels/values 5.65 / 6.35 (label is outside the faded `.row`); Sounds/Nudges descriptions 6.95 / 9.1; tab items 92×68, stats 48 high, tag chips ≥ 78×44, brew-length radios 71×46 |
| Own regression probe: summary geometry base vs fix at 768×1024, 360×740, 320×568, 844×390 | identical box and Tea time position in all four (F1 does not move anything outside the CLS fix) |
| Own unlock probe (three.js chunk held back by route interception) 390×844 and 1440×900, both themes | record-player **drawing** shown while 3D loads, then the 3D close-up in the same media box; Tea time enabled throughout |
| Own landscape check 844×390 | "Change brew length" shows (width < 900) and brings Brew length into view above the dock (50–151 vs dock 183) |
| Recaptured the review set on 2becb78 with `tools/capture.mjs` (dev server 5253): 390×844 (01, 01b, 07, 08, 11, 11b), 375×667 (01, 01b, 02–05, 07, 08), 1440×900 (01, 01b, 07, 08, 11, 11b, 18, 19), both themes | vs the maker's AFTER: ≤ 0.6 % changed pixels everywhere except live-stage/timing states (375 dark 02 steam 3.95 %, 11 unlock timing 5–30 %, 1440 dark 18 3D 2.6 %) — the committed AFTER set is representative of 2becb78 |

## What I opened (Read tool)

- REFERENCE: K01 `…/assets/current/01-home.png`, K02 `…/07-summary.png`, K03 `…/11b-summary-unlock-settled.png`,
  K09 `…/live-settings.jpg`.
- BEFORE (`/home/user/Vibei/kettle/review/product-excellence/baseline/`): 390×844 light 01, 07, 11b; 390×844 dark 01,
  01b, 08, 11; 375×667 light 01, 01b, 03, 08; 375×667 dark 01, 04; 1440×900 light 01, 07, 11, 18, 19; 1440×900 dark 01, 08.
- AFTER (`contracts/I04/after/`): 390×844 light 01, 07, 11b; 390×844 dark 01b, 08, 11; 375×667 light 01, 01b, 02, 03,
  08; 375×667 dark 01, 04, 05; 1440×900 light 01, 07, 11, 11b, 18, 19; 1440×900 dark 01, 08, 11.
- `contracts/I04/fixes/`: nook-hint-1440 light before/after; toast-focus-375 light before/after; toast-summary 390 dark
  and 375 light after; text200-home-390 before/after; keyboard-open-home-375x376 before/after;
  change-brew-length-tapped 375 dark and 320 light; summary-details-focus-390 dark after; focus-task-chip-320 after;
  settings-muted-volumes-390 dark before/after.
- My own 2becb78 captures: 390 dark 01, 390 light 11, 1440 light 11, 375 dark 02, unlock loading/settled (390 dark,
  1440 light), keyboard-focused link (375 light), landscape 844×390 before/after tap, Home with Custom selected
  (existing "Edit" link next to the new link) 390 light + dark.

## Per-criterion findings (matrix I04 observable success + brief items 1–7)

| Criterion | Finding |
|---|---|
| All controls and the last summary line reachable at 375×667 / 390×844, keyboard open, 200 % text | PASS — audit reach 0 covered in all those suites; final expanded summary line clears the persistent Tea time/Skip footer (08 at 390 and 375, both themes, identical to BEFORE). Keyboard-open fix F5 verified (field visible at 375×376). |
| Editable duration unmistakable without undoing wrapping or the sticky footer | PASS — see the dedicated decision below. Five categories still wrap; 15/25/50/Custom kept; docked start keeps "· 25 min"; no onboarding added. |
| Critical journey by keyboard + screen-reader semantics | PASS for keyboard and DOM/ARIA (spec + own probe; sheets trap focus, Esc closes, focus returns to Custom / End session / Ambience chip). Countdown is one `role=timer`; nothing announced over 8 s. Real screen readers BLOCKED, honestly stated. |
| Contrast measured | PASS — measured from pixels where axe can't decide; 0 FAIL on 2becb78; the disabled-slider (F2) and hover (F3) failures are fixed with existing tokens; identity colours unchanged. |
| Targets ≥ 24 (primary 44) | PASS — 0 < 24; primary controls all ≥ 44; the two 24–44 targets are a secondary inline link and a Stats row. |
| Reduced motion keeps every fact | PASS — 0 missing (OS and in-app setting). |
| F1 summary CLS | PASS — see I14 verdict: phone whistle → summary 0.50 → 0.003 (390) / 0.004–0.02 (375), desktop unchanged 0.016; summary visuals identical to BEFORE. |
| F6 200 % text, F7 task chip, F12 Nook, F11 toasts | PASS — no sideways scroll at 200 %; chip shows the full "Chapter 3 notes · Work" on two lines (orange kettle, Chai, countdown surface untouched); Nook room now scrolls with the page, hint visible, level card no longer slides over the room, full-page capture identical; toasts float above the session controls and the summary footer (spec passes at both phone sizes). |

### Decision: does the sky-blue "Change brew length" link weaken orange-focus / blue-rest semantics? — **No; acceptable.**

Compared REFERENCE K01 → BEFORE `baseline/*/01-home.png` → AFTER (maker's `after/*/01-home.png` and my 2becb78
recaptures) at 390×844, 375×667 and 1440×900, both themes:

1. **The focus action is unchanged and still the only orange call to action.** "Put the kettle on · 25 min" keeps its
   size, colour, position and "· 25 min" label at every size (the dock moved up 3 CSS px for the 24 px link line). The
   link is 14 px text at the end of the ink-2 note; it starts nothing and only scrolls to the existing control.
   Colouring it orange would put a second orange focus-coloured target directly under Start and dilute K01's "one clear
   Start" hierarchy.
2. **Sky-ink is Kettle's existing text-link colour on this very card, for this very kind of action.** `.linkBtn`
   (`color: var(--sky-ink)`, weight 800, unchanged by the diff, present since 8f1044a) already renders "Edit" beside the
   Custom brew length — i.e. the existing focus-setup link that opens the brew-length sheet — and "Mark … done" for a
   carried task; I captured "Edit" and the new link side by side on 2becb78 (identical `rgb(28,100,151)` light /
   `rgb(153,208,245)` dark). The summary's "Wait" link uses the same sky-ink + underline treatment. Neutral-ink
   underlined links exist too (Welcome "I have a backup", Settings data inline link), and the keyboard focus ring is the
   same blue on focus screens. Blue = rest is carried by solid sky actions and surfaces (Tea time button, break clock),
   not by small link text; the new link reuses an established component instead of inventing a colour.
3. **Desktop is untouched** (link `display: none` ≥ 900 px; 01 identical to BEFORE at 1440×900 both themes).

Residual risk (not a defect): the link follows "Then a 5 min tea break." so a reader could momentarily associate it with
the break; its label says "brew length" (Kettle's word for focus) and it lands on the Brew length control.

## Notes (not defects; no correction required for this verdict)

- **Evidence provenance is overstated in the packet.** The standard AFTER set records `651bc54+dirty` in its
  `capture-meta.json`; 16 of 27 `fixes/*-after.png` were committed at WIP `87393e7` (the toast AFTER images still show
  the pre-F7 truncated chip at 375 px); `audit-after` records `f28d803`. The packet says "from this revision". I
  re-ran the audit and recaptured the review set on `2becb78`; results match, so this verdict rests on my 2becb78
  evidence. Future packets should regenerate evidence at the final commit or state the capture revision.
- The maker's 1440 `after/*/11-summary-unlock.png` were taken mid-transition (summary card still fading in); my 2becb78
  recapture shows the drawing state matching BEFORE (0.10–0.43 % diff).
- Polish only: the link's square focus outline overlaps the full stop of "tea break."; at 320 px `text-wrap: balance`
  breaks the note as "Then a 5 min tea / break."; solid-button hover is now very subtle (`saturate(1.1)`).
  Pre-existing, outside this diff: "Then a 8 min tea break." grammar for 8/11/18-minute breaks.
