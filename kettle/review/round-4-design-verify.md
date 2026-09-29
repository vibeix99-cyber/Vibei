# Round 4: independent check of the design pass (c14b3b8 + uncommitted follow-ups)

Checked against the live build on :5190 (dist rebuilt 13:52, which includes the three tablet/landscape follow-ups and the "Optional <360px" change) and the baseline 9c3aaa7 build on :5194. Scripts and evidence are in `.tmp/critic-r4d/` (gitignored). I did not edit any tracked file.

How I tested:
- **Transitions.** I paused the route-layer WAAPI animations with `document.getAnimations()` and seeked them to fixed times: 0/16/33/50/67/83/100/150/240 ms (`seek.mjs`, `seekbreak.mjs`). I also recorded per-frame opacities with a rAF sampler (`xf.mjs`, `sampler.mjs`). The seeked frames are deterministic, so the slow software WebGL here doesn't affect them.
- **Layout.** I measured in-page (`overlap.mjs`, `statscols.mjs`, `titles.mjs`, `t2.mjs`, `opt.mjs`, `dupid.mjs`) and took my own screenshots (`shots/`, `long/`, `land-home-*.png`, `crop-744.png`).
- **Functional e2e.** The full suite passed, 97/97 in 7.4 min (`e2e-full.log`).

## Claim-by-claim

### 1. The route dissolve no longer shows two screens' text: PARTLY TRUE, and overstated
- **Today keeps the frame you tapped from: TRUE.** In the rAF trace the outgoing Home layer shows the composer throughout. On the baseline it swaps to "Your kettle's on / Back to your brew" during the fade (sampler flag `KETTLE-ON`).
- **Tail is cleaner: TRUE.** From about 83 ms the old screen is gone:
  - Current, t=83: paper 0.92, and t=90 is clean.
  - Baseline, t=83 and t=100: the old text is still visible at about 12% and 7%.
- **"Never text over text": FALSE for the first ~70 ms.** Neither the paper nor the content is delayed, so the content (ease-out 0.22,1,0.36,1 over 240 ms) is always *ahead* of the paper (linear over 90 ms). Old text visible = 1 − paper. New text visible = content.

  | t | current new | current old | baseline new | baseline old |
  |---|---|---|---|---|
  | 16 ms | 0.28 | 0.82 | 0.28 | 0.72 |
  | 33 ms | 0.52 | 0.63 | 0.52 | 0.48 |
  | 50 ms | 0.69 | 0.44 | 0.69 | 0.31 |
  | 67 ms | 0.81 | 0.26 | 0.81 | 0.19 |

  - For the first 67 ms the old screen is *more* visible than on the baseline.
  - Worst overlap is about the same: time with both texts above 20% is 60 ms now vs 54 ms before. Peak min(new, old) is 0.58 vs 0.49.
  - Reduced motion is worse than baseline: 49 ms vs 32 ms with both texts above 20%, because paper covers in 70 ms while content fades in 140 ms.
  - Seeked frames show clear double exposure in both builds:
    - Home→Focus at t=16/33/50: "What are you brewing?", chips and the CTA under "25:00" and "Chapter 3 notes" (`sheet-seek-hf.png`).
    - Today→Stats at t=33/67: "Good afternoon, Robin" over "Stats", composer over the level card (`sheet-seek-tab.png`).
    - Done→tea break at t=20/45: "Tea time" over "Level 5", "Start tea break" over "Skip break / Start next brew" (`sheet-break.png`).
  - **Fix:** hold the content until the paper has mostly covered. For example, content `delay: cover*0.8` (about 70 ms, or 55 ms reduced), or animate content opacity with an ease-in over [cover, inDur]. That brings the overlap to about 0 and keeps "no blank frame", since paper reaches 1.0 by 90 ms.
- **No blank frame: TRUE.** Content always leads the paper, so there is never a frame of only cream.
- **Focus→Done whistle bloom: OK.** The incoming layer is at paper 1 / content 1 from its first frame. The outgoing Focus fades only after 240 ms. Same as baseline, with no fade from zero.
- **Reduced motion: works.** Timings are 70/140 ms and the reduced-motion e2e passes. The overlap is described above.

### 2. The new item stays out of the Focus room until the celebration reveals it: TRUE on the normal path, with one edge-case regression
- I read the Nook's `items` prop from the React fiber during the flow, seed `celebrate`, `nookq=off`:

  | Build | During the whistle | After "Start tea break" |
  |---|---|---|
  | Current | `…,teaSet` (no `recordPlayer`) | `…,teaSet,recordPlayer` |
  | Baseline | `recordPlayer` already present | `recordPlayer` present |

- **Stats: TRUE.** It reads "Next for your nook: **a surprise** at level 14".
- **Regression (P2).** If you leave the celebration without finishing it, `lastReport` is never cleared and the Focus room hides the item for the whole next brew. Leaving means browser/Android back from `/done`, or `__kettle.navigate('/')`. The Nook tab shows the item at the same time. Repro:
  1. Open `?debug&seed=celebrate&nookq=off#/` and put the kettle on.
  2. Run `__kettle.finish()`, wait about 4 s, then `history.back()`.
  3. Put the kettle on again. The Focus room has no record player, but the Nook tab has one. `lastReport` stays in storage, so the item stays hidden across reloads until the next completion replaces the report.
  - **Fix:** filter only while the route is `/done` or the flow's `celebration` is set, or clear the report when Home mounts without a celebration.

### 3. One page-title size: TRUE
Measured computed font-size on seed `celebrate` (greeting / Stats / Nook / Settings / all 5 celebration titles):

| Viewport | Current | Baseline |
|---|---|---|
| 320×640 | 26 / 30 / 30 / 30 / 30 | — |
| 390×844 | all 30 | 26 / 32 / 32 / 28 / 32 |
| 844×390 and 667×375 | all 28 (follow-up) | 22 / 38 / 24 / 34 / 26 |
| 820×1180 | all 33 | — |
| 1180×820 and 1440×900 | all 36 | — |

The baseline was inconsistent; the current build is consistent everywhere.

**Side-effect (P2).** Today's greeting in short landscape went from 22 to 28 px:
- At 667×375 (iPhone SE landscape), "Good afternoon, Robin" wraps to 2 lines (64 px tall, was 25).
- At 568×320 it wraps to 3 lines (97 px, was 51).

That pushes the daily-goal card further below the fold. At 568×320, the new "Optional" marker also wraps "What are you brewing?" onto 2 lines; the <360 px rule doesn't cover this narrow composer column. Evidence: `sheet-land-small.png`. So "Today's own landscape layout unchanged" is not quite true. Its structure is unchanged, but the title grew 6 px and `.main` lost its max-width at 720–899, so the columns are about 70 px wider at 844.

### 4. Tablet 720–899: PARTLY TRUE, with a P1 overlap on common iPad portrait widths
- **Today at 720–~800 px: P1.** The left column's content is wider than its grid track. Its min-content is about 340 px, set by the status-bar pills, and `.hero` is a grid item with `min-width:auto`. The composer card (colB) is painted over it. Measured right edges vs colB's left edge:

  | Width | Greeting | Status bar | colB starts | Overlap |
  |---|---|---|---|---|
  | 720 | 364 | 372 | 336 | 28–36 px |
  | 744 (iPad mini portrait) | 364 | 372 | 347 | 17–25 px |
  | 768 (classic iPad portrait) | 364 | 372 | 358 | 6–14 px |
  | 800 | — | 372 | 372 | touching |

  Visible effects:
  - At 744 the last letter of "Robin" is clipped.
  - The "Level 12" pill is cut, and Chai's speech bubble runs under the card (`crop-744.png`, `shots/cur-veteran-home-744x1133-light.png`, `…768x1024…`).
  - Even at 820 the status bar spills 15 px into the column gap.
  - The follow-ups (recipes moved left, chips wrap, pill margin) did not change this; I re-measured after the rebuild.
  - The tablet e2e only runs at 820, so it passes.
  - **Fix:** `min-width:0` on `.hero`/`.heroTop`, and let `.statusBar` wrap or shrink (`flex-wrap:wrap`, or `min-width:0` on `.stat` as at <360). Alternatively, start the two-column rule at about 800 px.
- **Today with the follow-ups: good at 768–899.** The columns balance (recipes on the left) and all five tags wrap: Work/Study/Read/Create/Life.
  - Sticky left column works, and at 820×1180 the whole column is shorter than the viewport.
  - Dark theme is fine.
- **Duplicate id (P2).** RecipesCard is now mounted twice, with one copy hidden by `display:none`. `id="home-recipes"` appears twice on every size (390, 820, 844; `dupid.mjs`). On phones `getElementById` resolves to the hidden copy. Accessibility is unaffected in practice (the name is still computed), but it is invalid HTML and doubles the card's render and progress-bar animations. **Fix:** use one instance with CSS grid placement, or `useId`.
- **Stats two-column: TRUE at 744–899 portrait, FALSE at 720–743.** The container query is 680 px; at 720 with a 15 px classic scrollbar the container is 657 px, and on overlay-scrollbar devices about 672 px, so it stays one column.
  - Landscape phones: two columns at 844×390 and 896×414, one column at 720–780×360–400. So "landscape phones in that range" is only partly true.
- **Settings is one column: TRUE.**
- **Layout jump at 899→900 (P2, band is pre-existing).** At 899, Stats and Today are two columns 836–884 px wide. At 900 the sidebar appears and both collapse to a single 589 px column: Today's greeting wraps to 3 lines and Stats is one column until 1024. The new tablet band makes this jump sharper.

### 5. Contrast: TRUE
- Calendar done-day numbers: `#fff` on `--persimmon-strong #c9501f` = **4.52:1** in both themes (was 3.40 on `#e8612b`). It passes, but with no margin.
- Nook hint and caption pills: rgba(31,26,46,.72) under `#fff4e6` text is at least **6.15:1** even over pure white (was 3.5–4.1).

### 6. Copy and small items: TRUE
- Untitled brews: Today shows "Read brew" and History shows "Read brew". `brewTitle()` is used in both places.
- Badges header reads "Every badge started · 25 of 56 tiers" when every badge has a tier.
- "Optional" marker: hidden at 320 and 359, visible at 360 and 390. The field's accessible name still says "(optional)".
- 68ch measure:
  - It applies to `.story p` and ListRow notes.
  - On desktop the column is only 680 px wide, so it hardly matters there.
  - "To turn nudges on…" is not capped (676 px, about 140ch). At tablet, where Settings is about 750 px wide, those uncapped paragraphs run long. (P2, minor.)

### Other regression sweep
- **Focus→Done, Done→break, Welcome, sheets, reload mid-celebration, mid-dissolve navigation:** all e2e green.
  - The Done→break seeked frames match the baseline in the first 45 ms and are cleaner from 90 ms.
  - Pre-existing issue: the Done hand-off's "step aside" does not lower the card heading's opacity before the route changes. The heading was 1.00 until the route switch in both builds, so the comment "the route dissolve never double-exposes" in `DoneScreen.tsx` does not hold.
- **Long intention (80-char URL):** no horizontal overflow on Focus or the finish card at 320×640, 844×390 and 568×320 (`long/`).
  - Focus ellipsizes the line.
  - The finish card wraps it. The composer's maxLength of 80 trims the 81-character test URL to "…final-v", which is expected.
- **Import sheet:**
  - At 320, the Add/Replace labels are not clipped.
  - At 844×390 the "will be swapped" sentence and the Cancel/Replace buttons are in view without scrolling.
  - At 320 the summary box scrolls inside the sheet and its first line is cut at the top edge, which is acceptable.
- **Celebration cards:**
  - At 320 the level-up card's "New in your nook: Record player" is cut by the footer and needs a scroll. Pre-existing: identical in the baseline `.tmp/before`.
  - In landscape the hidden-overflow amounts are identical to the baseline.
- **Desktop 1440 with the right rail:** Settings in light and dark, titles 36 px, no issues.
- **Targets:** buttons in the import sheet are 52 px and the close button is 44 px.
- **Performance:**
  - The Dissolve adds two motion divs per layer, and both of its opacity tweens run as WAAPI.
  - The Focus `items` memo only changes when the report changes.
  - **UNVERIFIED:** real-device frame timing. Only software WebGL is available here.
- **UNVERIFIED:** VoiceOver/TalkBack reading of the duplicated recipes region, and real iPad Safari (overlay scrollbars) at 744/768. The overlap is geometric, so I expect it there too.

## Summary (severity-ranked)
P0: none found. The full e2e suite passes 97/97.

P1-1 Tablet Today overlap at 720–~800 px (iPad mini 744, iPad 768 portrait): the greeting, the "Level 12" pill and Chai's bubble are drawn under the composer card; "Robin" is clipped at 744.
  Repro: `/?debug&seed=veteran#/` at 744×1133 or 768×1024. Greeting right edge is at 364 px, the composer card starts at 347/358. Cause: `.hero` min-content (status bar) of about 340 px exceeds colA (299–310 px).

P2-1 Dissolve claim overstated: for the first ~70 ms both screens' text is visible (t=33 ms: new 0.52, old 0.63). The old screen is *more* visible than on the baseline until 67 ms, and it is worse under reduced motion. Only the tail (≥83 ms) and Today's frame-freeze improved.
  Repro: `node .tmp/critic-r4d/seek.mjs homefocus` (or `/stats`), then look at t016–t067. Fix: delay content until paper ≈ 0.8.

P2-2 The unlocked item stays hidden in the Focus room for the whole next brew if the celebration is left via Back, while the Nook tab shows it.
  Repro: seed `celebrate` → brew → `__kettle.finish()` → `history.back()` → brew again. The room has no `recordPlayer`.

P2-3 Short-landscape greeting grew 22→28 px: 2 lines at 667×375, 3 lines at 568×320. At 568, "Optional" also wraps the composer question. Goal card is pushed below the fold.
  Repro: seed `veteran`, Today at 667×375 / 568×320.

P2-4 Stats stays one column at 720–743 portrait and on 720–780 wide landscape phones (the container query is 680 px), contrary to "720–899 two-column".
  Repro: `/stats` at 720×1000 gives `grid-template-columns: 657px`.

P2-5 Duplicate `id="home-recipes"`: RecipesCard is mounted twice at every size (the hidden copy comes first on phones).
  Repro: `document.querySelectorAll('#home-recipes').length === 2` at 390×844.

P2-6 Layout cliff at 899→900: two full-width columns become a single 589 px column with a 3-line greeting. The band is pre-existing; the new tablet rule sharpens the jump.
  Repro: Today/Stats at 899×1000, then 900×1000.

P2-7 Calendar numbers pass at exactly 4.52:1 (no margin). The "To turn nudges on" Settings paragraph is not capped at 68ch (about 140ch at tablet width).
  Repro: Stats calendar; Settings at 820×1180.

Verified true: Today keeps its tapped frame, the whistle bloom is instant, reduced motion works, the room hides the item until the reveal, Stats says "a surprise", one title scale, tablet Today balanced with wrapping chips at 768–899, Settings is one column, the contrast fixes, one name for untitled brews, the badges header, "Optional" hidden under 360, and the long-intention and import-sheet fixes at 320 and landscape.

---

## Repairs (implementer, after this review)

| Finding | Repair | Evidence |
|---|---|---|
| P1-1 Tablet Today overlaps at 744–800 px | Tablet columns are 50/50; the hero, its row, Chai's row and bubble can shrink (`min-width: 0`); the stat pills may wrap to two rows. | Screens at 744×1133, 768×1024 and 820×1180 (`.tmp/sizes/`): no overlap, no horizontal scroll. |
| P2-1 Double exposure in the first ~70 ms | The paper covers in 80 ms (60 ms reduced), and the new content starts once the paper is 60% of the way. Seek measurement (`seek.mjs homefocus`): at 33 ms paper 0.41 vs new content 0.10 (was 0.52 vs 0.63); old text fully covered by 83 ms; no empty frame. | `.tmp/critic-r4d/seek.mjs` |
| P2-2 Item hidden for later brews after leaving with Back | The unrevealed item is hidden only during the whistle beat that leads into the celebration. | Code (`FocusScreen.tsx`). |
| P2-3 Landscape greeting 28 px wraps | In short landscape the greeting takes `--text-display-m` (22 px), because it heads a narrow column; "Optional" is hidden on landscape phones under 760 px. | 667×375 and 568×320 screenshots. |
| P2-4 Stats one column at 720–743 | The two-column container threshold is 640 px. | 720×1000: two columns. |
| P2-5 Duplicate `#home-recipes` | The recipes card renders once: in the left column on tablets (media query), after the composer elsewhere. | `querySelectorAll('#home-recipes').length === 1` at 744, 768, 820, 667, 568. |
| P2-7 Nudges help ~140ch on tablet | The tinted row keeps its width; its text measure is capped at 68ch (`padding-inline-end`). | Code. |

**Kept:** the 899→900 px jump (the sidebar appears at 900 and Today goes back to one column; the band existed before). Calendar numbers pass at exactly 4.52:1.

Verified after the repairs: tsc clean, 246/246 unit tests, 97/97 functional (3 workers), timer/PWA 29 passed / 2 skipped.
