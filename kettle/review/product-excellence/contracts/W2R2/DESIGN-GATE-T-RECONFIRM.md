# DESIGN GATE · Maker T (I10) — re-confirmation by the new lead (LEAD-2)

**Ruling: AMEND.** LEAD-1's APPROVE of `TOAST-ARCHITECTURE.md` @ `pe/w2r2-toast@dabc8f3` (`DESIGN-GATE-T.md`) stands, with every binding ruling and every packet proof in it, **except for the five changes A–E below.** T follows the amended ruling. A packet that does not meet an amended condition is a REJECT of the packet.

| | |
|---|---|
| Lead | LEAD-2. I implemented none of this work and did not write LEAD-1's gate |
| Note | `/home/user/wt/w3t/kettle/review/product-excellence/contracts/W2R2/T/TOAST-ARCHITECTURE.md` @ `dabc8f3` (design only; parent `b377c62`) |
| Gate re-judged | `contracts/W2R2/DESIGN-GATE-T.md` (LEAD-1), read in full |
| Base | `b377c62` (kettle/src `e0aebbf`), worktree `/home/user/wt/w3-base` |
| Evidence I read myself | base `src/ui/Toast.tsx` (all of it), `src/ui/Sheet.tsx` l.60–200 and l.247–260, `screens/focus/FocusScreen.tsx` (frozen frame l.221, EndSheet l.481–493), `screens/home/{Hero,Composer}.tsx`, `app/{flow.ts,ShellOverlays.tsx,App.tsx}`, `screens/stats/History.tsx` (delete + Undo), `screens/settings/DataSection.tsx` (import + Undo), `timer/TimerAnnouncer.tsx`, every `toast(` / `ui:toast` call site; BEFORE `meta.json` for `03-today-after-end-*` at 390×844 @100/@200 and 375×667 @200; frames K02 `07-summary.png`, BEFORE `390x844-light-t100/06-break-over-0.6s.png`, `375x667-light-t100/05-break.png`; `PRESERVE_LIST.md` |
| Also read (context only, not judged here) | T's implementation so far, `127526e` (`src/ui/Toast.tsx`, `Composer.tsx`, `FocusScreen.tsx` zone markers), to see which open questions the code has already answered. The design is judged on its merits, not on what is built |

## 1. What I re-confirm unchanged

I checked each of these against the base code and the BEFORE evidence myself.

- **Root cause.** The brief's root cause is that toasts were positioned relative to whatever is docked at the bottom. Base `toastLiftBottom()` (10 px above the highest `[data-toast-above]` in the lower 40 % of the viewport), `toastRoomTop()`/`topBarBottom()` (under a page `<header>`) and `toastDock()` are all proxies, and nothing checks the invariant. The note answers this directly: notices are placed against the protected set itself. This is the right fix.
- **Architecture.** Declared zones, a measured protected set, free bands, whole notices, a queue, and announcing kept apart from drawing. Invariant 1 holds by construction: the stack's box is a subset of a band, and a band is disjoint from every protected box measured at that moment.
- **Defect (b) diagnosis, confirmed in code.** In `FocusScreen.tsx`, `onEnd` calls `setEndOpen(false)` and `endFocusEarly()` in one batch. The next render has `view === 'none'` and returns `frozen.current`, whose tree still holds `<EndSheet open>`. The `Sheet` stays present, so it keeps `aria-modal="true"`, keeps its stack entry, and leaves `#root` **inert**. The BEFORE meta at 390×844 @100 0.6 s agrees: the old focus screen's +5, Pause and End hit-test to `div._footer_4dq2b_142`. LEAD-1's addition holds: while that frame lives, Mark done cannot be tapped whatever the notices do.
- **Ruling 3.1, selector.** `Sheet.tsx` sets `aria-modal={isPresent ? 'true' : undefined}` and puts `inert` on the exiting layer. Its stack entry is released on exit, so `#root` is *not* inert during a normal exit animation. "Any `[role="dialog"]` present, or `#root[inert]`" is therefore the correct test for "a modal is open or leaving".
- **Rulings 3.2–3.9.** These cover exiting route layers, measurement cadence, clipping, announcing once, the protected set, protected text, reduced motion and scope.
- **Decision 1, Today.** Notices bottom-aligned over the greeting, Chai and the bubble are accepted as a transient cover of art and flavour copy. The **goal card is not a zone** and its text is protected. I agree: "28 min brewed · 2 min to go" is the very fact that changes when End's notices arrive.
- **Decision 2, waiting.** This is a bounded rule: never at rest; no viewport fallback on a screen that has a zone; timers run only while a notice is drawn; a newcomer never withdraws a notice; hysteresis on return; the persistent prompt yields. **Amended for action notices by B.**
- **Decision 3, the dock-mode "Change brew length" link.** Measured, and consistent across every configuration where the length sits in the dock.
- **Decision 4.** P's `data-toast-above` becomes inert; T does not touch `screens/done/**`.
- **§4 packet proofs 1–11 and §5 residual map.** Unchanged, plus the proofs added below.

Checked against the brief's invariants:

| Invariant | How the design meets it |
|---|---|
| No toast ever covers a protected control or an open sheet's interactive element | Invariant 1, plus "no notice while any dialog is present" |
| Every toast action ≥ 24×24 CSS px and tappable | Whole notices only, in a band ≥ MIN. **Completed by B**, so that an action is also *there* when the person needs it |
| Storage banner in-flow and untouched | Protected via `[data-save-warning]`; no edit to `SaveWarning*` |
| Reduced motion keeps every fact | Fade only; placement, queue, timers, icon, text, reward, action and announcement unchanged |

## 2. Amendments (binding; T follows these)

### A. The session screen's stage zone is **top-aligned**, not bottom-aligned (amends Decision 1, "over the stage art")

**Why.** LEAD-1 put the stack "bottom-aligned (over the counter line and the kettle's base, not the window)". On the frames, the stage's lower part is where the state-bearing art stands: Chai and the kettle with its gauge, flame and glow (PRESERVE 2 and 3). Its upper part is the wall and window, which are scenery.

- K02 `07-summary.png` and BEFORE `390x844-light-t100/06-break-over-0.6s.png` (stage ≈ 0–420 CSS px):
  - Close / top bar: ≈ 10–55;
  - wall and window: ≈ 60–200;
  - steam: ≈ 205–260;
  - kettle (gauge ≈ 290–330) and Chai's face: ≈ 210–370.
- Bottom-aligned, one notice of 52–57 px covers the kettle's stand and flame and Chai's feet. Two notices (≈ 117 px) cover the gauge and Chai's face.
- Top-aligned under the top bar, one or two notices (≈ 61–178) cover only the window. Chai, the kettle and the steam stay whole.
- At 375×667 (`375x667-light-t100/05-break.png`: stage ≈ 0–313, Chai's face ≈ 130–200, gauge ≈ 175–220) both alignments touch the art when two notices are up. Top alignment is no worse there and clearly better everywhere the stage has room. That covers 390×844, the landscape stage columns and 1440×900.
- This also makes LEAD-1's own §4.6 requirement achievable on the session screen ("nothing hidden: Chai's face, the kettle's gauge"). It protects the whistle → summary arrival that Maker P's brief is about: Chai and the kettle whole above the sheet. It also keeps the flame clear in defect (e)'s case, where a notice arrives while a "Next brew" focus is running (PRESERVE 3: the flame shows heating).

**Ruling.**
- In the session screen's stage zone, the stack is drawn at the **top of the highest band that holds it**, directly below the top bar's protected boxes plus slop. It grows downward. The oldest notice sits highest and stays put; newcomers are drawn below it.
- This keeps the gate's "no reshuffle under the finger" rule, mirrored.
- Today's Hero stays bottom-aligned, as LEAD-1 ruled. There the two alignments trade the greeting against Chai's feet and are a wash at 390×844 @100. Today's composer zone (C) is bottom-aligned too.
- How alignment is declared per zone is T's choice, e.g. `data-notice-align="start"` on the stage zone.

**Proof (added to §4.6).**
- One and two notices at 390×844 and 375×667 @100: whistle → summary (on the P trial, see E), break, Break's over (Monday's recipe), and a running "Next brew" focus (defect e).
- **At 390×844 @100, neither one nor two notices may reach the kettle (gauge, flame, steam) or Chai's face. At 375×667 @100, one notice may not.**
- 844×390, 667×375 and 1440×900: one and two notices, top of the stage column.
- @200 and reduced motion: frames in the packet. A taller cover there is accepted as transient.
- The REFERENCE → BEFORE → AFTER triple uses K02 for the summary.

### B. An action notice is drawn where the person raised it (narrows Decision 2's waiting state ii)

**Why.** Waiting while "the zone has been scrolled off screen" is harmless for a fact, but not for an Undo.
- "Brew deleted · Undo" (`History.tsx`) arrives as the Edit sheet closes over Stats, scrolled to that brew's row.
- The import's "Backup restored / Added … · Undo" (`DataSection.tsx`, 10 s) arrives as the import sheet closes over Settings › Your data, which sits low on the page.
- "Crossed off · Undo" (`Composer.tsx`) is raised from Mark done, below the Hero at 200 % text.

If any of these waits, the announcer says "… Undo" while no Undo button exists. A sighted person sees nothing until they scroll somewhere unrelated. That breaks the brief's "every toast action stays … tappable" and regresses the base, which drew these at the bottom of the viewport (covering rows, which is the defect being fixed, but visible).

**Ruling.** A timed notice with an action, raised by the person's own tap, must be drawn whole (≥ 24×24, on top, 9/9 hit points) on the screen where it was raised:
- at the scroll position the person is at, without them scrolling;
- within one frame of the triggering sheet's dialog leaving the DOM;
- at every configuration × 100/200 %.

How it is met:
- If the screen has no band there, the screen provides one: a zone near the action, as T's ranked composer zone does on Today (C). It is never met by covering a control.
- Waiting state (ii) still applies after the person scrolls the notice's band away *after* it was drawn. It then returns by the hysteresis rule.
- The update prompt is not raised by a tap. It may wait, and it yields as LEAD-1 ruled.

**Proof (added to §4.2/§4.5).**
- Mark done tapped at every scroll offset where Mark done is on screen (at least scroll 0 and Today scrolled to its end), 375×667 and 390×844 @100/@200.
- History: delete the brew in the last row of a populated History with Stats scrolled to its end, at every configuration @100/@200.
- Settings: import from "Your data" scrolled into view, at every configuration @100/@200.
- For each: the frame the dialog leaves, the first frame the notice is drawn (delta ≤ 1 frame), its box, 9/9 hit points, and a real tap on Undo that restores the state.
- A row that waits is a REJECT of the packet.

### C. Today's second, ranked zone (the composer heading) is approved (amends "the Today zone is the Hero only")

T added `data-notice-zone="2"` on the composer section, reaching 24 px over the gap above it. This was not in the note. I approve it, because it is how B is met on Today, under these conditions:
- **Order.** It is used only when no Hero band holds the next notice.
- **What it may cover.** Only the heading "What are you brewing? (optional)" and the whitespace above it.
  - It must never cover the field, its clear button, Mark done, the "Carried from your last brew" row, Recent, the tag chips, Brew length or the docked start. All of these are protected.
  - Covering the heading for a moment is accepted: the field keeps its accessible label and placeholder, and after Mark done it is empty and focused.
- **No jumps.** The stack never moves between the Hero and the composer while drawn, unless its band goes (scroll).
- **Proof.** It is in the W2H-D1 trace and in B's Mark done rows.

### D. The announcer is an ordinary light-DOM visually hidden live region (binding implementation ruling)

**Why.** T's code (`127526e`) puts the announcer's `role="status"` live region inside a **closed shadow root**. The stated reason is that page text search and test text queries then find each notice only once.
- That is a test convenience deciding a production accessibility mechanism.
- Nothing in this environment can prove that screen readers announce a live region inside a closed shadow root. We have headless Chromium only and no screen reader.
- The app's known-good pattern is a light-DOM, visually hidden `role="status" aria-live="polite"` element: base `TimerAnnouncer.tsx` (`data-kettle-announcer`), and the base Toaster's own region.

**Ruling.**
- The announcer is a light-DOM, visually hidden live region, present from boot.
- Tests scope their text queries (exclude `[data-notices-said]`, or read `toast.said()`); they do not change the mechanism.
- Packet proof:
  - the region's accessible role and politeness, from Playwright's accessibility snapshot or the CDP accessibility tree;
  - one addition per notice;
  - zero further mutations on draw, withdraw, re-draw or leave.

### E. Two clarifications that close gaps (binding)

1. **The loop guard.** T's `MAX_NOTICES = 12` drops the oldest timed notice past 12. That contradicts "a notice is dropped only by its own time-out or by the person", unless no real use can reach it.
   - T states the most notices one real event can raise: End or whistle with every recipe that can complete at once, badge tiers, level-up, "Saved", and the update prompt. The figure comes from `progress/` and the recipe/badge tables, not from a guess.
   - T shows that figure is well below 12. If it is not, the guard is raised.
2. **The summary protection is a structural selector into P's DOM** (`[data-notice-avoid-content] > * > * > *`), because T may not edit `screens/done/**`.
   - Maker P changed `Summary.tsx` this round, so T's summary proofs (invariant 1 at whistle → summary, §4.6 K02 and K03, PRESERVE 8) must run on a **trial merge of T with the P revision that is approved or merged when T's packet is gated**, not on `b377c62` alone.
   - If the selector no longer matches the card and footer on that tree, it is a packet REJECT.

## 3. What is unchanged for the packet

LEAD-1 §4 items 1–11 (the per-sample invariant runs, the 9-point hit-tests and real taps, the queue at the worst weekday, the "waits at rest = none" table, the reference look, defect (b)'s 15 s trace, defects a–f with controls first, the must-pass reruns R5-D1 / LEAD-D1 / R7-D1 / D4 / W2H-D1, the suites, and packet hygiene) all stand, with A–E's proofs added. §5's residual map stands, with the following additions:

| Item | Expected class after T | How it is checked |
|---|---|---|
| Notices over the stage art | ACCEPTED, now **top-aligned** (A); Chai and the kettle clear at 390×844 for 1–2 notices | A's frames |
| Undo hidden while it waits | must not occur (B) | B's rows |
| Composer heading as rank-2 zone | ACCEPTED under C | C, B |
| Announcer mechanism | light DOM (D) | D's proof |
