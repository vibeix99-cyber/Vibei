# CHECKER W2R2 · Maker T: I10, where notices live

**Verdict: REJECT** `pe/w2r2-toast@4620796` (code `8d0d8a6`, kettle/src `efc44574a4ac7eaab863d8485941e24aa8191dee`). The maker submitted it as WIP at its deadline.

Trial merge `acfe851` = integration `2f67fc1` (which includes P) + `4620796`; kettle/src `7b9634c`; worktree `/home/user/wt/w3tr-t`, dev :5444.

There is **one 90-minute fix round**, followed by a targeted re-review by Lane T (Opus) and me against §6 "Done when".

| | |
|---|---|
| Lead checker | LEAD-2. I implemented none of this work. I wrote the amended design ruling (`DESIGN-GATE-T-RECONFIRM.md`), which this verdict applies |
| Revision checks | `git rev-parse 4620796:kettle/src` = `8d0d8a6:kettle/src` = `efc4457…`. The trial's kettle/src is `7b9634c` (it contains P) |
| Control | `b377c62` dev :5410, used for every control row below |
| Packet | `/home/user/wt/w3t/kettle/review/product-excellence/contracts/W2R2/T-READY-FOR-REVIEW.md` (status WIP; §9 lists the gaps); evidence `…/W2R2/T/` |
| My evidence | `contracts/W2R2/review/LEAD2/T/` (`*.json` per run, `chainT.log`, `summary-*/summary-1500ms.png`, `shots/`). Probe `/home/user/wt/w3-base/kettle/.tmp/LEAD2/t-lead.mjs` |

## 1. What I did

**Read in full:** the packet, §3b/§4/§5/§9 and T's `nz.mjs`. **Reviewed:** the code changes since the design gate (`127526e..8d0d8a6`: the same-task MutationObserver re-measure, the hold-still rule, the top-aligned stage zone, the light-DOM announcer, the loop guard 40).

**My own probe** (`t-lead.mjs`):
- one browser per run, real taps and wheel, setup only through the debug API;
- every ~100 ms it samples, in an animation frame:
  - every drawn notice's box and whether it is whole;
  - every intersection with the brief's protected set (controls, `[data-notice-avoid]`, `[data-save-warning]`, each clipped to its scrolling ancestors);
  - dialog / `#root[inert]`;
  - each action's size and 9-point hit test;
  - the zones;
  - waiting notices.

Runs on the fix (trial :5444) and the control (:5410):

| Run | Config | Fix | Control |
|---|---|---|---|
| End → Today → wheel Mark done into view → hold 6 s → tap Mark done | 390×844 @200 | 154 samples: **0** hit samples; "Crossed off · Undo" drawn **190 ms** after the tap, as a tall notice (message scrolls inside, Undo 95×40, 9/9) | 172 samples: **134** hit samples (field, clear, Mark done, tags, Brew length) |
| same | 375×667 @100 | 126 samples: 0 hits; Undo drawn **160 ms** after the tap, whole, 57×35, 9/9, **at y = 2** | 158 samples: **73** hit samples |
| same | 375×667 @200 | 158 samples: **1 hit sample** (region 145–260 reaches 2 px into the docked start at 258, during Today's entry); Undo **never drawn in 8 s** (1 waiting, 0 drawn), Mark done at y 122, scroll 1,150 | — |
| Stats scrolled to the first page's last row (3,120 px) → Edit → Delete → confirm | 390×844 @100 | dialog gone at 1.76 s; "Brew deleted · Undo" **never drawn** (0 of 75 samples; 1 waiting); the brew is deleted (10 → 9 rows) | drawn **1.5 s** after the tap, with Undo (over the tab bar and rows: 46 hit samples) |
| Summary (T + P), two notices raised | 390×844 @100 routine and task day; 375×667 @100 task day | 0 hits; the stack is top-aligned over the window; Chai's face and the kettle's gauge are clear (frames); **notice top at y = 0** | 390 @100: notices above the footer, over the card, 1 hit sample (the details toggle) |
| All fix runs | | **0** samples with a notice drawn while a dialog or `#root[inert]` exists | 1–5 per run |

One harness gap: my 375×667 @200 History run did not open the Edit sheet. The 390×844 @100 pair is decisive.

**Opened (full size):**
- my summary frames `review/LEAD2/T/summary-fix-390x844-light-100/summary-1500ms.png` and `summary-task-fix-375x667-light-100/summary-1500ms.png`;
- the Stats/Settings scrolled frames `review/LEAD2/T/shots/{stats,settings}-390x844-t100.png`;
- K02 `07-summary.png`;
- BEFORE `390x844-light-t100/06-break-over-0.6s.png` and `375x667-light-t100/05-break.png`.

## 2. What works (kept; not to be undone in the fix round)

- **Invariant 1 broadly holds** (End → Today, scrolled and not): 0 hit samples in my 390 @200 and 375 @100 runs, against 134/172 and 73/158 hit samples on the control.
- **(b) The frozen End sheet is gone.** On the fix, no sample has a notice while a dialog or inert root exists. T's 15 s traces show the dialog and `#root[inert]` absent from the first Today sample; on the control they persist for 112–562 ms.
- **A (top-aligned stage), on the T + P summary:** the stack hangs over the window. Chai and the kettle (gauge, flame, steam) are whole at 390×844 @100. P's arrival composition is kept.
- **D (light-DOM announcer)** and **E1 (guard 40 ≥ 18 per event, derived from `quests.ts`/`badgeEngine.ts`)**: in code as ruled.
- **Maker-reported, read but not re-run by me** (the targeted re-review checks them again):
  - a: `:1090` 9/9;
  - c: Ambience 2/2;
  - e: status line covered 0/32 vs 32/32 on control;
  - f: `break-reach:179` is a real cover on control on Monday and Thursday (recipe days), all 7 days pass on the fix;
  - `toast-room` 14/14; `w2-home` 18/18.

## 3. Defects (each is a REJECT reason; the fix round corrects them)

All corrections are in **T's files only** (`src/ui/**`, `src/app/**`, `src/screens/home/**`, `src/screens/focus/**` except `stage/**`, and T's specs), with **no new design**.

### T-D1 · Ruling B on Today: "Crossed off · Undo" is not drawn where the person raised it
- **What happens:**
  - **375×667 light @200** (my run): Mark done is scrolled into view at y 122 (scroll 1,150) and tapped; the notice waits, and none is drawn in 8 s.
  - **390×844 @200** (T's runs): never drawn at some scroll positions. My run at scroll 880 drew it at 190 ms as a tall notice, so it depends on the scroll position.
  - **375×667 @100 with End's notices still up** (T's run): it waits ≈ 3 s, because End's "Saved …" holds the only band and "a newcomer never withdraws a drawn notice".
- **Required correction:**
  1. `Toast.tsx`: a drawn notice **without an action** yields its place to a notice **with an action raised by the person's tap**, exactly as the persistent update prompt already yields. The yielding notice returns, with its remaining time, when a band frees. Drawn action notices are still never withdrawn by a newcomer (LEAD-D1).
  2. When no band in view holds the action notice whole, the approved rule 4 applies in the nearest Today band ≥ MIN (see R-2).
  3. `screens/home/**`: **whenever Mark done is in view, a Today band ≥ MIN must be in view next to it**, at every phone configuration at 100 and 200 %. T chooses how within the C conditions (e.g. the composer zone's reach or extent, or the carried row's place once it unmounts); never over a control or protected text.
- **Proof:**
  - Configurations: 375×667, 390×844, 844×390 and 667×375 × 100/200 %, light (dark at 200 %).
  - Mark done tapped for real at scroll 0 and at the end-scrolled position, each **with End's notices still up** (tap at +0.6 s) and **after they have gone**.
  - Per row: the first sample with the Undo drawn ≤ 1 frame after the tap (100 ms sampling accepted), its box, 9/9 points on the Undo, then a real tap on Undo that restores "Chapter 3 notes" to the field.
  - 0 hit samples throughout.

### T-D2 · Ruling B on screens without a zone: "Brew deleted · Undo" is never drawn on Stats when scrolled (regression)
- **What happens:**
  - **390×844 light @100** (my run, fix): Stats is scrolled to the first page's last row. After the confirmed delete the notice waits for the whole 8 s observed; the brew is gone and no Undo can be reached.
  - **Control:** drawn at 1.5 s with Undo.
  - Settings' import Undo: no rows at all (T §9).
- **Why there is no band** (frames `shots/stats-390x844-t100.png`, `settings-390x844-t100.png`):
  - Stats mid-list is wall-to-wall row buttons. The day-header gaps are ≈ 45 px, under MIN; a band exists only at the page's end.
  - Settings › Your data does have ≈ 88 px of non-interactive text (the group's footer and the next section label) under the import row.
  - The History and Settings files are not T's, so T cannot give those screens a zone.
- **Lead ruling R-3 (binding for the fix round), required correction in `Toast.tsx`:**
  - On a screen **with no zone**, a person-raised action notice that finds no band in view holding it is drawn **where the base drew notices**: centred above the tab bar (base `bottom: calc(var(--tabbar-h) + 14px + env(safe-area-inset-bottom))`, max 440 px), whole, on top, for its duration.
  - When the viewport has a band at that position (Settings › Your data), the band is used.
  - This is the only exception to invariant 1. It equals the base's behaviour (not worse), keeps the Undo of a destructive action reachable, and is recorded as **FOLLOW-UP F-T1**: the owners of Stats and Settings give those screens a zone or an in-place Undo.
- **Proof:**
  - History delete at Stats scrolled to (i) the first page's last row and (ii) the middle of the list; Settings import with "Your data" in view; at 390×844 and 375×667 @100/@200.
  - Per row: the dialog-leave sample → the first drawn sample (≤ 1 frame); its box; which rule placed it (band or base fallback); 9/9; a real Undo that restores (the row count is back; the import is undone).

### T-D3 · Invariant 1: notices intersect protected controls
- **What happens:**
  - T's own `notice-zone.spec.ts:187` on `8d0d8a6`, 390×844 @200, End → Today: "Saved 3 minutes of focus" ∩ Read, Create, Life and Brew length in **24 of 62** samples.
  - My run at 375×667 light @200: 1 sample during Today's entry where the region (145–260) reaches **2 px into the docked start** (top 258). The band was measured from a layout taken before the dock settled; the next sample is correct (138–250).
- **Required correction** (`Toast.tsx`): find and fix the cause. A band must never come from a layout older than the frame it is painted in, during route entry, scroll or dock settling. 0 intersections, slop included, as the spec measures.
- **Proof:** `notice-zone.spec.ts` green **×3** at all 10 configurations; my probe flows (`t-lead.mjs end-scrolled`) at 375×667 and 390×844 @100/@200 with 0 hit samples.

### T-D4 · Notices are drawn on, or past, the viewport's top edge: no edge margin, no safe-area inset (introduced)
- **What happens:**
  - On the T + P summary at 390×844 and 375×667 @100, the first notice's top is **y = 0** (frames: flush with the screen edge).
  - On Today scrolled (375×667 @100/@200, 390×844 @200), the region starts at **y = −3**: the 3 px "grace" reaches outside the viewport. At 375 @100 the Undo was drawn at y = 2.
  - The base kept `top: calc(env(safe-area-inset-top) + 8px)` and `env(safe-area-inset-bottom)`.
  - With `viewport-fit=cover` (index.html), a top-aligned stack at y = 0 lies under the status bar or notch wherever the inset is non-zero.
- **Required correction** (`Toast.tsx`):
  - every band stays inside the viewport, inset by **8 px + `env(safe-area-inset-*)`** on the top, left and right, and by `env(safe-area-inset-bottom)` at the bottom;
  - the grace never reaches outside that inset box.
- **Proof:**
  - the minimum notice top is ≥ 8 px in every sample of every probe flow: the summary, Today scrolled, the stage at 667×375 and 844×390;
  - with a safe-area inset emulated, ≥ inset + 8. Use CDP `Emulation.setSafeAreaInsetsOverride` if this Chromium has it; otherwise read the inset from a probe element and state that the environment could not emulate it.

### T-D5 · E2 is unproven: summary proofs on the T + P trial are missing
- **What I found:** on `acfe851` the maker's E2 failure (seen on its own `w3t-p` worktree) **does not reproduce**. At 390×844 @100 (routine and task day) and 375×667 @100 (task day), two notices hang over the window, 0 intersections, Chai's face and the gauge clear. But the packet proves none of E2.
- **Required:** the K02/K03/PRESERVE 8 REFERENCE → BEFORE → AFTER triples with notices up, on the **new** trial (integration including P, plus the fix):
  - 390×844 and 375×667 @100/@200, light and dark, and 1440×900;
  - the big day (record player: the card's media box never under a notice);
  - the whistle → summary arrival (Chai and the kettle whole at 390×844 with one and two notices; ruling A).

### T-D6 · Packet proofs missing (LEAD-1 §4 and the reconfirm; each must be produced)
1. **Full chromium on the final code.** Only `c43e30b` ran it (130/132). Also `integrity.spec.ts:637` failed 2/3 on `8d0d8a6` ("summaryBox intercepts pointer events"): rerun ×5 on the fix **and** on control `b377c62`, and either show it is pre-existing or fix it.
2. **Must-pass controls first:** R5-D1 (`20671eb`), LEAD-D1 (`e866118`) and R7-D1 (`b39202f`) reproduced on their own revisions, then the fix rows.
3. **D:** the announcer node from the CDP Accessibility tree (or Playwright's full accessibility snapshot): role `status`, live `polite`, one addition per notice, zero other mutations.
4. **The waits-at-rest table's session rows** (focus, break, Break's over, summary) at all 10 configurations, with a probe that works: the current one is declared unreliable.
5. **Captures:** AFTER for the full BEFORE set; reduced motion wherever motion changed; the K01/K02/K03 triples written out (with T-D5).
6. **R8-F1 measured:** no whole notice clipped for > 0.5 s.

## 4. Lead rulings for the fix round (clarifications; no new design)

- **R-1 (ruling A at 375×667 @100):** a two-line notice reaching the tip of the kettle's handle and a steam wisp by ≈ 2 px is **ACCEPTED**. The gauge, the flame and Chai's face are clear. Not a defect.
- **R-2 (rule 4, tall notices):**
  - Where **no band in view** can hold a notice whole, the approved rule 4 applies: icon and action whole and on top (action ≥ 24×24), the message scrolling inside the box, never clamped, announced in full. An example is Today at 375×667 @200, where the hero band is 112 px and three-line notices are ≈ 140 px.
  - LEAD-1 §4.4's "whole" applies wherever a band in view can hold the notice.
  - A **non-action** notice whose band scrolled away still returns only into a band that holds it whole (LEAD-1 hysteresis), not as a tall notice into a smaller band.
  - ACCEPTED and documented, not a defect.
- **R-3:** the base-position fallback for person-raised action notices on screens with no zone (T-D2).

## 5. Residuals

| # | Item | Class | Owner |
|---|---|---|---|
| T-D1 … T-D6 | above | **BLOCKS** (fix round) | T |
| F-T1 | Stats/Settings have no zone near History's delete or the import: the R-3 fallback covers rows for the Undo's 5–10 s, as the base did | **FOLLOW-UP** | owners of `screens/stats/**` and `screens/settings/**`: a zone or an in-place Undo |
| R-1 | 2 px over the kettle handle's tip at 375×667 @100 (two-line notice) | **ACCEPTED** | — |
| R-2 | tall notices where no band can hold them (375×667 @200 Today) | **ACCEPTED** | — |
| F-T2 | `data-toast-above` in P's `Summary.tsx` is inert | **FOLLOW-UP** | summary area (P's F-5) |
| F-T3 | Real devices, WebKit, Firefox, real AT | **UNKNOWN** (environment) | — |
| Process | The maker reports one `pkill -f` and a broad kill of "playwright test" processes around 09:55 UTC, against the lane rules. It may have cost another lane a run | **noted for the orchestrator** | — |

## 6. Done when (the targeted re-review checks exactly this; Lane T (Opus) and the lead)

1. **Revision:** a new READY revision on `pe/w2r2-toast`, with the fix rows run on a **new trial = integration (with P) + that revision**; `kettle/src` hashes stated.
2. **T-D1 rows all pass:** Undo drawn ≤ 1 frame after the tap, with and without End's notices up, at scroll 0 and end-scrolled, at 4 phone configurations × 100/200 %; 9/9; real Undo restores; 0 hits.
3. **T-D2 rows all pass:** History (end of page and mid-list) and Settings import at 390×844 and 375×667 @100/@200: drawn ≤ 1 frame after the dialog leaves; placed by band or by the R-3 fallback (stated per row); 9/9; real Undo restores.
4. **T-D3:** `notice-zone.spec.ts` green ×3 at all 10 configurations; the lead's `t-lead.mjs end-scrolled` at 375×667 and 390×844 @100/@200 gives 0 hit samples.
5. **T-D4:** minimum notice top ≥ 8 px (and ≥ inset + 8 with an emulated inset, or stated BLOCKED) in every flow; no region outside the viewport.
6. **T-D5:** E2 triples and PRESERVE 8 on the new trial, frames opened and listed.
7. **T-D6:** items 1–6 produced.
8. **Not worse anywhere:** `integrity :1090` 9/9 and `:1004` ×3 at 1440; `toast-room` 14/14; `w2-home` 18/18; `break-reach:179` 7 weekdays ×3 configurations; `a11y`; `statusbar :106` ×3 dark; tsc 0; vitest green; timer/pwa 29 + 2 by design; no `screens/done/**`, `scene/**`, art or `SaveWarning*` change.

---

## Fix-round re-review (final; no second fix round)

**Final verdict: REJECT** `pe/w2r2-toast@6f9756c` (code `887696e`, kettle/src `ed027d6`). Trial `a8fb34a` = integration `2f67fc1` (with P) + `6f9756c`; kettle/src `958ce86`; dev :5446.

**T is not merged this round.** The branch and its evidence are kept for the next toast round. The base keeps its toast behaviour, so the toast residuals stay open as follow-ups: W2H-D1, (b), (d), (e) and `break-reach:179`.

**Sources:**
- Lane T's receipt `review/LT/RECEIPT-LT.md`, read; its spec logs and failure context `review/LT/logs/` checked for the facts I rely on.
- My own runs on `a8fb34a` (`review/LEAD2/T/fix/*.json`, `chainT3.log`).
- The maker's fix packet `/home/user/wt/w3t/kettle/review/product-excellence/contracts/W2R2/T-FIX-READY-FOR-REVIEW.md` (status WIP).

### Decisive: invariant 1 still fails (T-D3 not fixed)

The brief's first invariant is that no notice ever covers a protected control. It still fails, intermittently, in two independent runs on the final code:

| Run | Who | Config | Result |
|---|---|---|---|
| `notice-zone.spec.ts` ×3 | Lane T | 390×844 @200 (`:150`, End → Today, repeat 2) | **1 of 57 failed.** "Saved 3 minutes of focus" ∩ Read, Create, Life and Brew length; 15 of 20 samples had a notice (`review/LT/logs/notice-zone-x3.log`, `logs/nz-fail/error-context.md`) |
| Full chromium on `887696e` | Maker | 375×667 @100 | "Saved 3 minutes of focus" over the task field, its clear button and Mark done; 15 of 20 samples had a notice (fix packet §7.1) |

- The maker reports the cause **not found**.
- My `end-scrolled` probe (4 runs on `a8fb34a`) and Lane T's (4 runs) show 0 hit samples. The control shows 32 / 19 / 33 / 125.
- So the violation is intermittent, in the spec's End → Today path, where Mark done is tapped while End's notices are up. An intermittent cover of the task field and Mark done is exactly the defect class this round exists to remove: W2H-D1, D4 and F2.
- A REJECT under the protocol, with no fix round left.

### Also not met (packet proofs required by §6)

- **T-D5:** the K02/K03/PRESERVE 8 REFERENCE → BEFORE → AFTER triples are missing. Also missing: @200, dark, 1440, the record-player big day and the whistle → summary arrival with notices. Lane T and I confirmed only 390×844 and 375×667 @100 light: 0 hits, the stack over the window, and Chai's face and the gauge clear.
- **T-D6:**
  - item 2: the R5-D1, LEAD-D1 and R7-D1 controls were not rerun on their own revisions;
  - item 4: the session rows of the waits-at-rest table are missing;
  - item 5: the full capture set and reduced motion are missing;
  - item 6: R8-F1 was not measured.
- **T-D1 row 667×375 @200:** none was produced. Mark done was never on top: below the viewport at scroll 0, under the docked start when scrolled. Whether the Undo is reachable there is unproven.

### What the fix round achieved (verified; kept on the branch for the next round)

| Item | Evidence | Result |
|---|---|---|
| T-D1, Undo on Today | Lane T: every tappable row, at portrait and landscape @100/@200 except 667×375 @200. Mine: 375×667 @100 ×2, 375×667 @200, 390×844 @200 | Undo drawn 75–227 ms after the tap (455 / 784 ms when End's notices held the band at scroll 0; the yield is slow but works); 9/9; a real Undo restores the task; 0 hits. Mine: 128–187 ms, Undo 57–94 × 35–40 px, 9/9 |
| T-D2, History and import (R-3) | Lane T: 390×844 @100/@200 and 375×667 @100, History end of page and mid-list, plus import. Mine: History mid-list 390×844 @100 | Drawn 0–119 ms after the dialog left (mine: at 1,122 ms, the moment the dialog left); placed by band or the R-3 fallback; 9/9; a real Undo restores. The fallback's cover of rows is the declared exception (F-T1) |
| T-D4, edge inset | Lane T, with CDP `Emulation.setSafeAreaInsetsOverride` 47 px top. Mine | Minimum top 8 px with no inset (mine: 8–19 px on Today, 11 px on the summary). With the 47 px inset: 58 px on the summary, 55 px on Today. Nothing outside the viewport |
| D, announcer | Maker's CDP AX dump | Role `status`, `polite`, `additions`, one child and one mutation per notice. `aria-atomic="false"` was added afterwards; the dump was not repeated |
| `integrity :637` | Lane T, 3/3 on both fix and control; maker, 3/5 fix vs 4/5 control | Pre-existing (whistle → summary timing under load); not T's |
| Not worse | Lane T | `:1090` 9/9; `:1004` @1440 3/3; `toast-room` + `w2-home` 32/32; `statusbar` dark 3/3; `break-reach` Monday and Thursday 3/3 each |

Not run in the re-review: `a11y`, tsc, vitest and a full suite on the trial. The maker reports tsc 0, vitest 275/275, timer/pwa 29 + 2 by design, and full chromium 128/132 on `887696e` (including the T-D3 failure).

### For the next toast round (owner: I10 / toasts)

1. **Find the cause of the intermittent cover in `notice-zone.spec.ts:150`** (End → Today, Mark done tapped while End's notices are up; 390×844 @200 and 375×667 @100) and make the spec green ×5 at all 10 configurations. This is the one item that blocks merging T.
2. Produce the missing proofs: T-D5 (triples, @200, dark, 1440, the record-player day, the arrival) and T-D6 items 2, 4, 5 and 6.
3. Produce the 667×375 @200 Undo row, or show that Mark done can be reached there.
4. Keep the rulings: R-1, R-2, R-3 (with F-T1), and amendments A–E.

**The control still has these defects, now measured, while T stays unmerged (FOLLOW-UP, owner I10):**
- End's notices over Today's field, Mark done, tags and Brew length: 32–134 hit samples per run in my probes on `b377c62`;
- the frozen End sheet (b);
- the fold (d);
- the recipe notice over the running status line (e);
- `break-reach:179` on recipe days (f).
