import json, sys
SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/M7a'
V = json.load(open(f'{SC}/vals.json')) if len(sys.argv) > 1 else {}
def v(k, d='PENDING'):
    return V.get(k, d)

T = {}
T['template'] = open('/home/user/wt/r7a/kettle/.tmp/M7a/template.md', encoding='utf-8').read()

T['HASHES'] = f"""| | |
|---|---|
| **Final code revision** | `{v('rev')}` on `pe/r7-banner` — the combined revision (my banner work + the merge of `pe/r7-break@38fc9c6` + the Close fix). `kettle/src` tree **`{v('src')}`**. The packet commit on top of it changes review files only (same `kettle/src`); its hash is in the commit log and in my report. |
| My revision before the merge | `77ba760` (`kettle/src` `3f71d2c`); after the note CSS: `49ea1de` = the **unfixed combined revision** used as the Close control. |
| M7b | `pe/r7-break@38fc9c6` (`kettle/src` `ba4707c`), merged with `git merge --no-ff pe/r7-break` → `eea543d`; no overlapping files, no conflicts. |
| **Trial merge** onto the current integration HEAD `f3b70d3` (scratch worktree, removed afterwards) | `{v('trial')}`; `kettle/src` **`{v('trialsrc')}`** (equal to the final revision's: the integration branch's app code is still `0d58c5e`'s). |
| Controls | R5 `20671eb` :5302 (R5-D1), e866118 :5304 (LEAD-D1), INT `0d58c5e` :5303 (BEFORE), unfixed combined `49ea1de` served by me on :5226 from a scratch worktree (Close). |"""

T['CLOSE_TEXT'] = """**Defect** (found by M7b; introduced in round 7 by the combination — M7b made Break's over scroll at 200 % text, and
round 6's toast room ran from the top safe edge down to the lift above the action group): at 375×667 @200 %, Break's
over scrolled to its end, a 3-toast stack fills the room up over the top bar and covers **Close**; a real tap on Close
lands on a toast.

**Fix** (`src/ui/Toast.tsx` only; no CSS rule changed). `toastRoomTop()` looks for a visible page-level `<header>` (the
banner landmark: not inside `main`/`section`/`article`/`aside`/`nav`, not `aria-hidden`/`inert`, in the top 40 % of
the screen, not faded out such as the zen chrome) and, **only if one of its controls sits above the toasts' column**,
starts the room 24 px below that control's bottom (the list's 20 px shadow padding, which its scrollport covers, plus
4 px). The room never folds: it keeps at least 56 px above the lift, and where even that would be above the
stylesheet's own top the stylesheet's top is kept. A stack taller than the room scrolls inside it as in round 6.
Screens without such a bar (Today, Stats, Nook, Settings) never get a `top`: their room is exactly as before. The room
is now measured in a layout effect, so a new stack is never painted for a frame in the old room; the 250 ms
re-measure and the resize listener are unchanged.

**Probe** `r7/M7a/probes/closecheck.mjs` (new): fresh context per run; seed, brew and finish through the debug API
(setup); a real tap on "Tea time"; the panel scrolled to its end by **real wheel** or **CDP touch drags**; three toasts
raised through the app's own `toast()` with its default timers (labelled setup; nothing held); every animation frame for
1.2 s — Close, "Mark it done, start fresh", "Put the kettle on" and "That's all for now" hit-tested at their centres and
their boxes checked against every toast box clipped by the list's scrollport; then a **real tap / click** at one
control's centre while the three toasts are still up, recording the click's target. One run per control and input, so
every control is really tapped. Control: the unfixed combined revision `49ea1de` on :5226. `r7/M7a/runs/close/`.

**Regression test** (`tests/toast-room.spec.ts`, light and dark): against `49ea1de` it **fails in both themes** — Close
covered in 26 of 31 and 42 of 50 frames (`r7/M7a/runs/close/regression-test-on-CTL-49ea1de.txt`); on the final
revision it passes (see (d))."""

T['M7B_TEXT'] = f"""## M7b (break reach) — merged, included by reference

- **M7b's packet:** `pe/r7-break@38fc9c6` (`kettle/src` `ba4707c`),
  `/home/user/wt/r7b/kettle/review/product-excellence/contracts/I04/ROUND7-M7b-READY-FOR-REVIEW.md`; its evidence came
  in with the merge under `contracts/I04/integration-fix/r7/M7b/`. I make none of M7b's claims; I re-ran its spec and
  probes on the final combined revision so they can be checked after the merge.
- **`break-reach.spec.ts`** ran inside the chromium project on the final revision (see (d)).
- **M7b's toast check** (`toastcheck.mjs`, unchanged; paused break and Break's over with a task, panel at its top and
  wheeled to its end, 1 and 3 toasts; Close, Ambience, Mute and every panel control): {v('toastcheck')}
- **M7b's reach probe** (`reach.mjs`, unchanged; wheel, touch and Tab at 200 %): {v('reach')}"""

T['C_INTRO'] = """Every run: its own Chromium launch through `tools/slots.py --lane M7a --n 1`, a fresh context (disposable profile),
SwiftShader, DPR 2 and touch under 900 px wide. Inputs are real (`page.mouse.wheel`, CDP touch via `locator.tap()` /
`Input.dispatchTouchEvent`, real clicks). Toast timers are real and nothing is held: no synthetic `pointerenter`, no
programmatic scrolling, no test-only timer changes; the debug API is used for setup only (seed, quota fill,
`startFocus`, `ff`, `end`, `finish`). "Final" = the final combined revision on my dev server :5206, restarted on that
tree; controls on the orchestrator's servers (and :5226 for the Close control).

**Probe adaptation.** Each probe measures *whichever element presents the warning*: the toast
`li#toast-kettle:save-failed` (judged exactly as before) or the banner `section[data-save-warning]` (judged for being
taken away or faded, moving within the page — `top + scrollY` — and its Save backup outside its box or clipped by an
ancestor). Both count every addition of the warning's text to a live region. Diffs against the round-6 originals:
`r7/M7a/probes/natural-b.diff`, `actionpair-b.diff`, `pwapair-b.diff` (originals beside them; `SHA256.txt`). One
setup change in the LEAD probes, on control and revision alike: **no newbie seed** — after midnight UTC the seed's
sessions sort after the new brew, so Today offers no "Mark done" (the original's own guard throws); the brew, End,
quota fill and real tap are unchanged."""

T['R5_INTRO'] = """Storage full, End after 12 minutes with a level-up, 200 % text. The pointer rests on the toast stack, wheels up to the
oldest toast, waits 600–1800 ms, wheels back down in 20 px notches; real timers, nothing synthetic. I used
**natural-x**, not race-x, because race-x holds the toasts with synthetic `pointerenter`, which this round excludes.
5 waits × 2 runs = 10 runs per configuration and revision. `r7/M7a/runs/r5d1-*/`."""

T['ANNOUNCE_TEXT'] = """**Announced once.** On the final revision every run has at most one live-region addition. Where the R5-D1 window
(which starts just before End) shows 0, the one announcement came earlier: an app save failed while the probe was
still filling storage on Today, so the banner showed and was said then; back on Today after End it was not said again
(`r7/M7a/runs/announce-timing.txt`: three page-load-to-end traces, exactly one addition each). The integrity spec counts
the additions across brew → summary → Today → Settings → Today and requires exactly 1 (see (d))."""

T['LATE_TEXT'] = f"""`late.mjs`: Today with a carried task, storage then filled, a **real tap on "Mark done"**; every frame: the task field
(next to the finger), the docked start, the element at the tap point, the banner's top; layout-shift entries.
Counterfactual `CF=1`: `scrollBy` made a no-op in the page (no app code changed). `r7/M7a/cls/`.

{v('late_table')}

- With the compensation the task field moves ≤ 0.2 px; without it, 157–352 px, and at 844×390 "Save backup" lands
  under the finger. Layout-shift entries in this window all have `hadRecentInput` (0 counted towards CLS); part of them
  is "Mark done"'s own line collapse, on every revision.
- **The price, stated plainly (lead point 2):** where the person has scrolled down into the composer, keeping the
  finger's control still puts the new banner **above the view** (375×667 @100 %: −200 px; @200 %: −772 px; 844×390:
  −141 px); at 390×844 @100 % it lands at y 99 (in view); at 1440 it is in the other column (in view, nothing moved).
  The person learns it (1) by the one polite announcement, (2) by scrolling up to the top of Today, (3) on every later
  visit to Today and in Settings › Your data, and (4) on the next summary (the note). **INT** in the same tap shows its
  warning toast in view at once (`superseded-217489c/BEFORE-INT-earlier-session/lead-d1-*.png`, and the LEAD's INT
  runs), but at 200 % INT's toast rises past the top of the screen one word per line (old D3), and on R6 it looped.
  I chose "never move the control under the finger" over "always in view at once"; this is for the reviewer to judge.

**CLS on Today load (100 % text).** `clsload.mjs`: 5 reloads of a seeded profile per configuration, layout shifts over
4 s after load, on the final revision, on e866118 and on INT:

{v('clsload_table')}

The same intermittent late reflows (status bar / categories, `Home.module.css` sources) on all three, and 0 at 1440;
nothing from the banner. With storage full and a failed save, Today mounted by a real tap on the Today tab shows the
banner in its first layout: CLS {v('cls_b')} (`cls.mjs` (b); the 1440 / 844 entries are toasts' own shifts with
`hadRecentInput`). After a reload with storage still full no save has failed yet, so no banner (and nothing claims
anything) until the next failed save."""

T['TSC'] = v('tsc', 'clean (exit 0)')
T['VITEST'] = v('vitest', '27 files, 267 / 267 passed')
T['TESTS_NOTES'] = v('tests_notes', '')

T['CAPTURES_TEXT'] = v('captures_text')
T['LEAD_POINTS'] = v('lead_points')
T['F_EXTRA'] = v('f_extra', '')
T['G_TEXT'] = """- **LEAD-D1, R5-D1, R4-D1 and the warning-placement class** (r6 follow-ups 1, 2, 13, 14, 16, 18, 19): **FIXED by
  construction** — there is no warning toast to order, lift, scroll, anchor, withdraw or re-show; no geometry decides
  whether it shows. Controls reproduced; zeros on the final revision. (16: the banner leaves only when storage has
  room again; focus on its button would then fall back to the page — not handled. 10 is the toasts' own lift lag and
  is not claimed.)
- **Close under three toasts (round 7, combined):** **FIXED**, control reproduced 100 % at 375×667 @200 %, regression
  test added.
- **I03 (truthful storage consequences):** **FIXED**, pending independent review, on the screens I own; two
  pre-existing "saved" wordings outside my files are disclosed in the lead points (End sheet, `announce.ts`).
- **I04:** this round's parts **FIXED**; I04 overall **PARTLY BLOCKED** (real devices, real AT, WebKit/Firefox, OS text
  size — see (f))."""

json.dump(T, open(f'{SC}/packet-text.json', 'w'), ensure_ascii=False)
print('ok')
