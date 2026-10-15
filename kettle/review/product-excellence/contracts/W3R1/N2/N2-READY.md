# N2 — the History focus scroll (N-2): packet

**Branch** `pe/w3r1-n2-history` (worktree `/home/user/wt/w7n`), base `5f78af1` (src `b74e6b3`). Dev :5565; controls :5560 / :5570 (the base) and :5478 / :5488 (old base `4d36939`).
**Status: STAGES 1–3 of 6 (root cause; change; tests).** The brief's rule applies — *"if the root cause lies outside `History.tsx`, stop, write it up with evidence, and hand back"* — and it applies in the strongest form: **there is no product scroll to fix.** Nothing in `src/` has been changed.

## §1 Root cause, with the trace

### The one-line answer

**Tapping a History row does not scroll the page on the base, in any configuration I could build.** The "110 px focus scroll" in `CHECKER-W2R3-T2.md` (N-2) and the "page's own focus scroll" comment in `tests/notice-strip.spec.ts` are an artifact of the lead's own probe: the 110 px is **the probe's own wheel step** in its `press()` helper, which ran between the `before tap` and `edit open` snapshots.

### A. The product, frame by frame (rAF), real pointer / touch input, on the base :5560

`evidence/scripts/probe.mjs` → `evidence/probe-base-matrix.json` (and `.out.log.txt`). The page is scrolled (instant, by script) to put the 3rd History row of the `veteran` seed at three places — **mid screen, near the bottom (half under the phone tab bar / off the bottom edge) and near the top (half under the compact title bar)** — at six configurations; the row is tapped at a point where it really is the hit target (mouse down/up on desktop sizes, a touch tap on phones); the Edit sheet is left open for 1.5 s; Escape closes it; 1.2 s later it is read again. Every animation frame from the tap to the end records `scrollY` and the row's `top`. `window.scrollTo/scroll/scrollBy`, `Element.scrollIntoView/scrollIntoViewIfNeeded` are wrapped and every `scroll` event is logged.

| config | place | row top / `scrollY` seen | sheet open, settled | after Escape | max frame \|Δ`scrollY`\| | max frame \|Δtop\| | scroll calls | scroll events |
|---|---|---|---|---|---|---|---|---|
| 1440×900 @200 % reduced, light | mid | 400.2 / 2956 | 400.2 / 2956 | 400.2 / 2956, focus on the row | 0 | 0 | 0 | 0 |
| 〃 | near bottom | 870.2 / 2486 | same | same | 0 | 0 | 0 | 0 |
| 〃 | near top | 59.2 / 3297 | same | same | 0 | 0 | 0 | 0 |
| 1440×900 @100 %, light | mid / bottom / top | 399.5 / 1700 · 869.5 / 1230 · 52.5 / 2047 | same | same | 0 | 0 | 0 | 0 |
| 1440×900 @200 %, dark | mid / bottom / top | 400.2 / 2956 · 870.2 / 2486 · 53.2 / 3303 | same | same | 0 | 0 | 0 | 0 |
| 390×844 @100 %, light, touch | mid / bottom / top | 372.1 / 2956 · 744.1 / 2584 · 37.1 / 3291 | same | same | 0 | 0 | 0 | 0 |
| 390×844 @200 %, light, touch | mid / bottom / top | 372.3 / 6135 · 733.3 / 5774 · 37.3 / 6470 | same | same | 0 | 0 | 0 | 0 |
| 375×667 @200 % reduced, light, touch | mid / bottom / top | 283.7 / 6524 · 556.7 / 6251 · 42.7 / 6765 | same | same | 0 | 0 | 0 | 0 |

**18 of 18: the page and the row never move by a single pixel** (not 0.5, exactly 0) from the tap through the open sheet to after the close; no programmatic scroll call, no `scroll` event. The base does not move in **any** of the three configurations the brief names (1440 @200 % reduced light, 1440 @100 %, 390 phone touch), nor in the other three.

### B. What the page does on a tap, call by call (`evidence/base-1440-200r.json`, 1440×900 @200 % reduced, mouse)

```
pointerdown (row title span)            scrollY 2906
mousedown   → focusout main, focusin <button.sessionRow>   :focus-visible false   scrollY 2906   (the browser's own mouse focus)
pointerup / mouseup / click                                scrollY 2906
Sheet.tsx:107  input.focus({preventScroll:true})   scrollY 2906      (the only focus() call; preventScroll)
body += .layer ; #root[inert] ; html.kettle-modal-open ; html style overflow:hidden       scrollY 2906
   … 1.2 s open, rAF: scrollY 2906, row top 450.16 on every frame …
Escape → #root[inert] removed ; html overflow back
Sheet.tsx:120  row.focus({preventScroll:true})   scrollY 2906        focus is back on the row
```

Zero `scroll` events, zero `scrollTo/scrollBy/scrollIntoView` calls in the whole run. The browser's own focus of the pressed button (`focusin` at mousedown) does not scroll (Chromium does not scroll for pointer-initiated focus); the two `focus()` calls the app makes both pass `{preventScroll:true}`; the sheet's scroll lock (`html{overflow:hidden}`) freezes, never moves, the page. None of the brief's candidates scrolls: focus on the row (no), the Sheet's opening / scroll lock / focus return (no), `keepStill` / `holdTop` (they act on **delete**, not on open; not called), a layout change above the row (the rAF `top` and `scrollY` are constant), `scroll-padding` / `scroll-margin` (`html` on phones only; it shapes a scroll that something asks for, and nothing asked: the near-bottom and near-top rows under the phone chrome did not move either).

The same, with the notice-strip's own pre-steps (a "Brew updated" notice raised, a real wheel round trip ±4×90, then real wheels until the first row is on top, then the tap): `evidence/base-1440-200r-notice.json` (dTop 0, dScrollY 0) and without the notice `…-wheel.json` (0, 0).

### C. Where the "110 px" comes from (`evidence/historytrace-instr-*.json`)

LEAD-5's `historytrace` (`W2R3/review/LEAD/T2/runs/historytrace-390x844-light-100.json`):

```
trace: before tap   scrollY 2500  row 754
       edit open    scrollY 2610  row 644
steps: … tap "history row" at [195, 677] size [318, 68]   ← the centre of a row whose top is 643, not 754
```

Read his script (`W2R3/review/LEAD/T2/t2-lead.mjs`, flow `historytrace`):

1. it wheels in 100 px steps **at most 25 times** looking for the 4th row (`for (let i = 0; i < 25; i++) … wheel(0, ±100)`): **25 × 100 = 2500** — that is the `scrollY 2500`; the loop ended on its count, not on finding the row (the row was still at 754, 0.89 of the screen, outside his 0.3–0.6 window);
2. `before tap` is recorded **before** `press(row)`;
3. `press()` requires the row **wholly on top at 9 of 9 points**; at 754 the row (754–822) lies under the 68 px tab bar (top 776), so it is not, and `press()` **wheels `110 × pos`**, `pos = +1` — **2500 + 110 = 2610**, the row at 754 − 110 = **644**; only then does it tap, at the new centre 677 (= 643 + 34);
4. `edit open` is recorded after that.

So 2500 → 2610 is **his wheel**, not a focus scroll, and "then the Undo exactly where the row was" is true because nothing but his wheel moved.

I replayed his script unchanged (copy with an event log added, `evidence/scripts/t2-lead-instr.mjs`) against the base: **390×844 light @100 (touch)** and **1440×900 light @200 reduced (mouse)**. Both reproduce *his pattern*: `before tap` is `scrollY` **2500** exactly (the 25 × 100 loop), the row still below the screen's usable part; then `press()` wheels the row on top (three wheels of 110 on this seed, so `edit open` reads 2830 where his seed needed one, 2610). The event log is unambiguous: **every `scroll` event comes within 1–13 ms of a `wheel` event the probe sent** (the 25 loop wheels, then the `press()` wheels), **and after the `history row` pointerdown / click there is no `scroll` event and no scroll call at all** (70 and 66 logged events; the last scroll event is about 0.35 s before the tap).

And what a wheel that has not yet landed does to a tap, with nothing of the product involved: `evidence/race-1440-200r.json` (`wheel(0,40)` sent immediately before the click): the row moves by exactly the 40 px of the wheel, in the frame of the wheel event; **no further scroll event after the sheet opens** (the scroll lock holds).

### D. What this says about the two reports

* **N-2 (T2 checker, W2R3):** not a product scroll. The 110 px is the lead's own `press()` wheel. The product is unchanged by T2 here (as the checker said) — and by anything else.
* **F's Run B ("Undo 111 px from the row", old `notice-strip` before X-11):** the old spec read "where the person saw the row" right after `press()` returned, i.e. before the sheet opened; `press()` has a documented wheel race (X-11: "a wheel event the browser has received but not yet handed to the page leaves everything still") and under load a late wheel lands between that read and the Undo read. 111 px ≈ the wheel steps of `press()`, and = the 200 % row height (111); either way a harness wheel. It is the same class as the `press()` race F's checker already recorded for the Mark done failure; X-11's test-only fix (`e00b5fa`, already on the base) is the right fix and needs no product counterpart. (I cannot reproduce Run B itself without that load; the claim here is that the product has no scroll source for it — §1 A–C.)

### E. Therefore

* The root cause lies **outside the product** — in a probe's wheel and in a spec's read timing — so there is no `History.tsx` change that fixes it, and any change I made to `History.tsx` would be a no-op dressed as a fix (it cannot be shown to turn a failing test into a passing one, because on the base nothing fails).
* **I have not changed `src/`.** The branch's src tree is the base's (`b74e6b3`).
* What I did add: the brief's deterministic test as a **guard of the invariant** (`tests/w3-history-focus-scroll.spec.ts`), which passes on the base — §3.

## §2 The change

**None to the product.** `git diff 5f78af1 -- kettle/src` is empty: the branch's src tree is `b74e6b3`, the base's. `History.tsx` and its CSS module are untouched.

Why not "some" change to `History.tsx`: on the base the tap does not move the page at all (§1 A, 18 of 18 at exactly 0 px, no scroll call, no scroll event), so no edit can turn a failing check into a passing one. A defensive edit (for example an explicit `focus({preventScroll:true})` on `pointerdown`) would change how focus reaches the row — the one thing the Sheet's focus return and the keyboard path depend on (`:focus-visible`, `History.tsx:180`) — to guard against a movement nothing shows, and would be indistinguishable from the base in every check. I judged that the wrong trade and did not make it. If LEAD-5 rules otherwise, the guard below is the test to hold such a change to.

The branch carries **one new file**: `kettle/tests/w3-history-focus-scroll.spec.ts` (commit `2280e7d`; 14 tests). Nothing else is touched: not `Sheet.tsx`, not `moment.ts`, not `notice-strip.spec.ts`, no CSS.

## §3 Tests: fail on the base, pass on the fix

**It cannot fail on the base, because the base does not move** (§1). What the file does, and what I can honestly show:

**What it asserts** (8 tests, pointer and touch; `IDX = 2`, the target row placed mid-screen by an instant script scroll, a real mouse down/up or a real touch tap on its middle):
* from the tap through the Edit sheet being open (700 ms spring + five still frames) the row's top never differs from where it was seen by more than **2 px**, and `scrollY` never differs **at all**, on **every animation frame** (not only at the end);
* then the same through **Close (×)** and through **Escape**, with focus back on the row, and finally the row where it was seen;
* **Save**: the row's top never differs by more than 2 px. (`scrollY` is *not* asserted here: Saving raises "Brew updated" in the notice strip above the list, and `Toast.tsx:521` → `keepStill` scrolls the page by the strip's height in the same frame to keep what is in view still — the I10 rule. Measured: +68 px at 1440 @100 and 390, +73 px at 1440 @200; the row's top changes by 0 / −0.5 / 0 px — `evidence/save-*.json`. It is recorded as a test annotation.)
* configurations: **1440×900 @200 % reduced motion, light** (where X-11 was found); **1440×900 @100 %**; **390×844 phone, touch, light**; **390×844 phone, touch, dark**.

**Which configurations move on the base: none.** Base :5560: 42 of 42 (the 14 tests × 3), `logs/spec-base-5560-x3.log.txt`. Branch dev :5565 (the same code): 42 of 42, `logs/spec-branch-5565-x3.log.txt`. (The first base run, `logs/spec-base-5560-first-run-…log.txt`, had 13 of 14: my own Save assertion on `scrollY` was too strict and caught the notice strip's `keepStill` above; I corrected the test, not the product.)

**That the test would catch the movement if there were one** — a mutation check, in a throw-away copy outside the repo (`evidence/scripts/mutant.spec.ts.txt`, the same file with one init script: a `click` listener on a History row that calls `window.scrollBy({top:110, behavior:'instant'})` in the next task, i.e. exactly the 110 px the finding describes): run against the base, **8 of 8 pointer / touch tests fail** (`logs/spec-MUTANT-scrollBy110-on-base-5560.log.txt`: "Received: 110" in all 8; at open / close for the four configurations, and at Save for the four). The test is as sensitive as the brief asks; it is the base that has nothing to show it.

**Kept (the preserve list, §4)** — the other 6 tests (1440 @200 reduced and 390 touch), 3× on the base and 3× on the branch: all pass.

*(§4–§6 follow.)*
