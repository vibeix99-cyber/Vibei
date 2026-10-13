# I10 · Where notices live (design note, Maker T, W2R2)

Base `b377c62` (kettle/src `e0aebbf`). This note covers design only. No app code changes until the lead approves it.

## The root cause in one line
Today a toast is placed relative to a proxy: 10 px above the highest `[data-toast-above]` dock, under the session top bar, and in a landscape-only dock (`Toast.tsx` `toastLiftBottom`, `toastRoomTop`, `toastDock`). Nothing checks the invariant itself. So any change in dock height, text size, orientation or date (the number of recipe toasts) moves the stack onto something: W2H-D1, R7-D1, D4, R8-F3, and defects b–f.

## The architecture: notices sit in a clear zone and are checked against the invariant itself

1. **Zones.** Each screen marks the parts of its layout that hold nothing to tap or read live, with `data-notice-zone`. A notice may be drawn only inside a zone.
   - **Today:** the Hero (greeting, Chai, speech bubble) and the goal card. Portrait puts them at the top. Landscape and desktop pin them in the left column.
   - **Session screen** (focus, break, whistle, Break's over, summary): the stage `div`. It is aria-hidden art with no control, in every layout: the top half when stacked, the left column side by side. Round 8's landscape dock becomes the rule for every orientation.
   - **Screens with no zone** (Stats, Settings, Nook, Welcome) use the viewport as their zone.
2. **Protected elements.** These are concrete and are measured each time:
   - **(a) Every visible control:** `button, a[href], input, select, textarea, [role=button|link|radio|checkbox|switch|tab|slider|option|menuitem], [tabindex≥0], [contenteditable]`. It must have a non-zero box and must not be inside `[aria-hidden=true]` or `[inert]`. Its box is grown by 6 px for its touch slop. This covers the tab bar and rail, Today's docked start and Brew length, the task field and its clear button, Mark done, tag chips, the status-bar buttons, Close / Ambience / Mute, +5 / Pause / End, Skip / Next brew, the Break's over group and the summary footer.
   - **(b) Live text a person reads**, marked `data-notice-avoid`:
     - the session readout (flag, countdown, status line, meta);
     - the session top bar's words ("Next: brew 2 of 4", the task chip);
     - the summary card;
     - the storage banner and note. These are matched by their existing `[data-save-warning]`. The banner itself is not edited.
   - **(c) Any open modal** (`[role=dialog][aria-modal]`, including while it animates out). While one is open, no notice is drawn.
3. **Placement.** For the first zone on screen:
   - Take the zone's rectangle within the viewport, inset by 8 px.
   - Remove every protected box that overlaps its column. What is left is a set of free vertical bands.
   - The stack goes bottom-aligned into the lowest band that holds the next notice whole. If no band does, it goes into the tallest band of at least `MIN` (one line plus padding at the current text size). The stack is never wider than its zone (max 440 px).
   - If no zone has such a band, the viewport is tried the same way.
   - The bands are re-measured in each scroll event, on resize, on layout change (ResizeObserver) and when a notice arrives or leaves. The region's box *is* the band, so nothing it draws can reach outside the band.
4. **Whole notices, queued, never folded.** A notice is drawn whole: icon, full text, reward amount and action.
   - As many as fit are drawn: action notices first (Undo, Update), then in order of arrival. The rest wait, with their timers paused, and come in as others leave.
   - A single notice taller than the tallest band scrolls its message inside its own box, with the action held in view. This is the existing D3 behaviour. Its text is never clamped.
   - If there is no band at all, notices wait. Examples: Today scrolled at 375×667 @200, the summary card filling the stage at 200 %, or an open sheet.
   - Timers run only while a notice is drawn. Hover and focus still pause them.
   - The store's drop of everything past three toasts is removed (it lost facts). A notice is dropped only by its own time-out or by the person.
5. **Announcement is separate from drawing.** Each notice is announced once, politely, when it arrives, through a visually hidden announcer. Waiting therefore never delays or loses what a screen reader says. The drawn list keeps `aria-label="Notifications"` and its actions stay in the tab order, but it is no longer a second live region.
6. **What is removed:**
   - `data-toast-above`, `toastLiftBottom`, `toastRoomTop`, `topBarBottom`, `toastDock` and `foldToFit`;
   - the `body:has([data-toast-above])` lift CSS;
   - the fold CSS.

   The summary footer's `data-toast-above` (Maker P's file) becomes inert. P may delete it. Its buttons are protected by rule (a).

**Why this holds whatever the dock, text size, orientation or date.** The stack's box is a subset of a band, and a band is by construction disjoint from every protected box measured at that moment.
- A taller dock, 200 % text or a rotation can only shrink or move a band, which changes how many notices fit. It can never put one on a control.
- More recipe toasts on a given weekday only lengthen the queue.

**Invariants:**
1. No notice box ever intersects a protected box, and none is drawn while a modal is open.
2. Every action is drawn whole inside a band of at least `MIN` (56 px at 200 %), so it keeps its 36 px+ height and stays on top. It is always ≥ 24×24 and tappable.
3. The storage banner is not touched (same component, same flow position). It becomes protected, which also resolves R7-4.
4. Under reduced motion, notices fade only. Placement, queue, timers, icon, text, reward, action and announcement are identical.

## Alternatives rejected
- **Patching the lift again:** it keeps the proxy. Every past round fixed one geometry and broke the next.
- **A fixed top lane:** it sits over status-bar and top-bar controls, and page content scrolls under it.
- **In-flow notices like the storage banner:** they move content under the finger (CLS), which is the very thing `integrity.spec.ts:1090` forbids.
- **Free bands anywhere, with no zones:** they land on readouts and summary text and jump about as content scrolls. This is kept only as the fallback for screens with no zone.
- **Folding or clamping to fit:** it hides facts (defect d).
- **Toasts above or inside sheets:** they cover the sheet's controls (defect c).

## Defects: how the architecture resolves each, and how I will prove it
Every proof is control-first: reproduce on the named control in the same session, then measure the fix with real taps, wheel and keys, sampling every ≤ 100 ms for the life of the notices. The new spec `tests/notice-zone.spec.ts` asserts invariants 1–4 in every state below at 390×844, 375×667, 844×390, 667×375 and 1440×900, at 100 and 200 % text.

| | Resolved by | Proof (control → fix) |
|---|---|---|
| **a** W2H-D1 | Restore H's Brew length (`7a961b7`: dock on portrait phones, column head in landscape). End's notices go to Today's Hero zone. Mark done, the field, Brew length and start are protected, so none can be under a notice. If the 375×667 @200 hero band cannot hold one two-line notice whole, the dock drops its now-redundant "Change brew length" link (the options sit right there); I will measure this, not guess | `acf1c6a` (own build, :5424/:5434) vs fix: `integrity.spec.ts:1090` ×3 at 390 / 375, the restored `w2-home.spec.ts`, Mark done's centre on top at every sample, real taps at +0.6 s and +2 s cross it off, End's notices never over a Brew length option or the start (12 phone configurations plus 1440, at rest ≥ 24×24 and 9/9 hit points) |
| **b** | The notices are not on Mark done (a). **F2/F3 cause (to confirm):** `FocusScreen` returns its frozen last frame once the view is `none`, and that frame still has `EndSheet open`. The portalled sheet stays mounted and hit-testable while the outgoing layer lives (seconds under load). Fix: sheets render outside the frozen frame, closed once the view is `none` | `b377c62` at 390×844 and 375×667 @200: hit-test at Mark done every 100 ms for 15 s after a real End; then real taps |
| **c** R8-F3 | Rule 2(c): no notice is drawn while the Ambience sheet is open. They return whole after it closes, with timers intact | `b377c62` 844×390 @200: 3 notices, open Ambience by tap; Close and Turn on on top, then a real tap on each |
| **d** | No fold. Whole notices, the rest queued | `b377c62` 667×375 @200 with 3 notices (folded "Recipe done: Tak…"); fix: every drawn notice has its icon, `scrollHeight == clientHeight` and its reward text, and the queued one appears after |
| **e** | The running session's zone is the stage. The readout and status line are protected (2b) | `b377c62` with Settings › Next brew on and a recipe at break end, 390×844 / 375×667 (100 and 200 %): notice ∩ status line > 0; fix: 0 at every sample |
| **f** | The Break's over panel is never a zone, so no notice can sit on its controls in any orientation | Run `break-reach.spec.ts:179` on `b377c62` with frozen dates Mon–Sun and on recipe-completion days. Record which days fail and what is on top at the failing step. Freeze the date in the spec. Decide whether it is real (D4 pattern) or an artefact, with the frames as evidence |

Rerun must-passes (controls first): R5-D1 (`20671eb`), LEAD-D1 (`e866118`), R7-D1 (`b39202f`), D4 and W2H-D1. Test fixes: `integrity.spec.ts:1004` / `:1090` at 1440 wait for End's notices to have been drawn and gone (real state), and `statusbar.spec.ts:106` waits for `nav[aria-label="Your progress"]`. No assertion is weakened. The `toast-room` and `a11y` specs keep every no-cover assertion, retargeted from `[data-toast-above]` to the protected set.
