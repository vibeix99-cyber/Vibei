# CHECKER W2 · Maker H (Home and first visit: I08 + Wave-1 follow-up #2) — round 1

**Verdict: REJECT** (one blocker, W2H-D1). Everything else in H's acceptance verifies. One 90-minute fix round applies.

| | |
|---|---|
| Lead checker | Opus 5.5 (`claude-opus-5-5`), newly launched; implemented none of this work |
| Revision | `pe/w2-home@acf1c6a` = code `7a961b7` + evidence/packet commits |
| `kettle/src` | `6d5fbaf9fd598eee1abe52833faaabcd25193de4` (`git rev-parse` of `acf1c6a`, `7a961b7` and the trial merge: equal) |
| Trial merge | `4921ee4` = integration `a2caeb8` + `acf1c6a`; served dev :5342, preview :5352. `a2caeb8` vs `90a11e5` and `4921ee4` vs `acf1c6a` differ only in `kettle/review/**` (checked) |
| Base / control | `90a11e5` (src `42e106d`), dev :5310, preview :5330 |
| Packet | `/home/user/wt/w2h/kettle/review/product-excellence/contracts/W2/H-WIP.md` (WIP with a disclosed blocker) |
| My notes and raw data | `contracts/W2/review/LEAD/H/` (spec logs, toast probe JSON + frames); scratch frames in the session scratchpad `w2/LEAD/H/` |

## 1. What I verified myself, and what I took from others

**Myself (raw rows, frames and logs):**
- Diff review of `90a11e5..7a961b7` (all code and test files; §2).
- Frozen `integrity.spec.ts:1090` ("a banner that appears while Today is open moves nothing under the finger"),
  identical on both sides (`git diff --quiet 90a11e5 4921ee4 -- kettle/tests/integrity.spec.ts`), run through the slot gate
  against trial dev :5342 and control dev :5310 (§4).
- A real-input probe of End → Today → Mark done on both servers (`/home/user/wt/w2t-n/kettle/.tmp/LEAD/h-toast.mjs`),
  sampling every ~100 ms what is hit-tested at Mark done's centre and where End's toasts are (§4).
- An independent acceptance probe of #2 and I08 on trial preview :5352 at 6 phone configurations
  (`.tmp/LEAD/h-home.mjs`): option rects, 9-point hit test, real taps on 15/50/25/Custom, keyboard reach, first visit
  copy, height and a real tap on "Start a 15-min brew" (§3).
- Visual gate at full size (§5).

**From the maker (read, spot-checked, not re-run by me):** tsc, vitest 267/267, the chromium suite (90/92), a11y 11/11,
toast-room 14/14, timer/pwa 29 + 2 skips, the 16-configuration AFTER table and axe 0 target-size, the control run of
`w2-home.spec` (18/18 failing on `90a11e5`), the 1440 and 844×390 rows I did not re-probe. Logs: `…/W2/H/{suites,control,after}/`.
**From lanes:** nothing yet (Lane H has not run; Lane R does not include H).

## 2. Diff review (`90a11e5..7a961b7`)

| File | Owner | Finding |
|---|---|---|
| `screens/home/Composer.tsx` | H | `lengthAt` (`dock`/`top`/`card`); `RhythmPicker` rendered **inside `.ctaDock`, which carries `data-toast-above`**, on portrait phones; `--home-dock-h` measured by a ResizeObserver; "Change brew length" focuses without scrolling when docked; rhythm sublabels dropped on phones |
| `screens/home/HomeScreen.tsx` | H | `lengthAt` from existing media queries + `(max-width: 719px)`; the desktop branch is untouched (desktop keeps `card`) |
| `screens/home/Home.module.css` | H | 44 px options in dock/top; sliding highlight `pointer-events: none`; scroll-padding uses the measured dock height (never less than before) |
| `screens/welcome/WelcomeScreen.tsx`, `Welcome.module.css` | H | Purpose line; "Set things up first" becomes a quiet link beside "I have a backup" |
| `tests/w2-home.spec.ts` (new), `tests/a11y.spec.ts` (one condition) | H | a11y: Today at rest no longer excuses a "partially obscured" target-size. Stricter, not looser |

Ownership OK. No `src/ui/**`, toast, art, Three.js, summary, focus, scene or Nook change. No change to any frozen spec.
Cause notes for #2 (the Brew length row is the last child of the composer card, under the sticky opaque dock) match
the `90a11e5` source.

## 3. Acceptance (brief) — verified on the trial

Trial preview :5352, fresh context per group, frozen start clock, real touch taps (mouse at desktop), `seed=veteran`
for Home and `seed=fresh&onboarded=0` for first visit. Raw: scratch `w2/LEAD/H/trial/home-*.json`, frames per config.

| Config | Options (CSS y top–bottom, w×h) vs dock | Wholly visible · on top (of 9) | Real taps → start label | Custom | Keyboard (Tab from top) | First visit: line · doc height / vh · tap "Start a 15-min brew" |
|---|---|---|---|---|---|---|
| 390×844 light 100 | 620–664, 84.5×44, dock 616–776 | 4/4 · 9/9 | 15→15, 50→50, 25→25 | sheet "Your own rhythm" | reached, focused option on top | "Kettle is focus time, then a tea break if you want one." · 844/844 · running, 900 000 ms, no task, no name |
| 390×844 dark 200 | 396–445 / 449–499, 173×49.5, dock 392–765 | 4/4 · 9/9 | same | sheet | reached, on top | same line · 1165/844 · same |
| 375×667 light 100 | 443–487, 80.8×44, dock 439–599 | 4/4 · 9/9 | same | sheet | reached, on top | same · **667/667** (fits) · same |
| 375×667 dark 200 | 219–268 / 272–322, 165.5×49.5, dock 215–588 | 4/4 · 9/9 | same | sheet | reached, on top | same · 1083/667 · same |
| 844×390 dark 100 | 20–64, 62.6×44, dock 290–390 | 4/4 · 9/9 | same | sheet | reached, on top | same · 390/390 · same |
| 844×390 light 200 | 69–119 / 122.5–172, 178.6×49.5, dock 182–390 | 4/4 · 9/9 | same | sheet | reached, on top | same · 529/390 · same |

- Brew length: selected option and alternatives fully visible at rest; every option ≥ 44 px tall (goal met), ≥ 62.6 px
  wide. #2 reproduced on `90a11e5` by the maker at all 12 phone configurations (control JSON read; consistent with the
  orchestrator's BEFORE frames, e.g. `BEFORE-90a11e5/375x667-dark-t200/01-home.png`: no option on screen).
- First visit: one plain purpose line, one primary action, task and name optional, 15-minute first brew kept, no extra screen.
- Preserved: five wrapping categories, the docked start (same button, note and "Change brew length"), 15/25/50/custom.

## 4. The disclosed blocker — my ruling

### 4.1 Frozen `integrity.spec.ts:1090`, same spec file both sides, slot-gated, this session

| Side | Phone 390×844 | Phone 375×667 | Desktop 1440×900 | Logs (`review/LEAD/H/`) |
|---|---|---|---|---|
| Control `90a11e5` :5310 | **pass 1/1, then 3/3** | pass 1/1 | pass 1/1, then **2/3 (1 fail)** | `integrity-1090-control-5310-a.log`, `…-390x3-control-5310.log`, `…-1440x3-control-5310.log` |
| Trial `4921ee4` :5342 | **fail 2/2, then 1/3 pass** | pass 2/2 | fail 1/2, then 2/3 (1 fail) | `integrity-1090-trial-5342-{a,b}.log`, `…-390x3-trial-5342.log`, `…-1440x3-trial-5342.log` |
| Maker (`7a961b7` :5212 / control :5310) | fails in suite and alone; control 3/3 pass | pass | pass | `W2/H/suites/*.log`, `W2/H/control/integrity-1090-on-90a11e5.log` |

- **1440×900:** fails 1 in 3 on **control too**, with the same assertion ("Crossed off" never shown). H does not change the
  desktop layout. → pre-existing flake, R7-7 / Wave-1 follow-up #9 (FOLLOW-UP, not H's).
- **390×844:** fails 6 of 7 runs on the trial, passes 16/16 on the base (§4.4). This is the case to rule on.

### 4.2 What a person sees (real End, real tap), 390×844 @100

Probe `h-toast.mjs --prime 1 --scroll 1` (the spec's profile: onboarded, reduced motion, 3D off; typing the task,
**Put the kettle on**, `ff(3 min)` as setup, **End session → End session** in the sheet, Mark done brought into view as the
spec does). Raw: `review/LEAD/H/toast/{control,trial}/390x844-light-t100-scrolled-prime.json` and `-toasts.png`, `-after-tap.png`.

| | Control `90a11e5` | Trial `4921ee4` |
|---|---|---|
| Dock top (settled) | 676 | **616** |
| End's toasts ("Recipe done: Name what you're brewing · +10 leaves", "Saved 3 minutes of focus") | 542–599 and 606–658 | **490–547 and 554–606** |
| "Mark “Chapter 3 notes” done" | 243, 517, 79×44 (centre y 539) | same |
| Mark done's 44 px height under a toast | 19 px (lower part); **centre on top every sample** | **37 px, centre covered** from the lift (1.34 s) until the toasts leave (3.41 s): their whole lifted life |
| Real tap at Mark done's centre | lands on Mark done → "Crossed off. Nice work." | lands on **"Recipe done" toast** (dismisses it) → **not crossed off** |
| Frame | `-toasts.png`: the "Carried from your last brew · Mark done" line is fully visible above the toasts | `-toasts.png`: the toasts cover the whole Mark done line and the lower half of the task field and its clear button |

Other sizes (same probe; `toast/*/…-scrolled-prime.json`):
- 375×667 @100: control clear, trial clear (tap works both).
- 390×844 @200: Mark done's centre is already covered on control (1.07–1.97 s by "Recipe done"); on the trial for longer
  (0.80–3.43 s). Pre-existing there, not improved.
- 375×667 @200: covered on control (1.0–3.4 s by "Saved…", tap eaten); clear on the trial (Mark done moves into the window above the dock).

### 4.3 Ruling

- **Introduced or worsened by H? Yes, at 390×844 @100 (the most common phone size).** On `90a11e5` End's stack sits
  below Mark done's centre (it already clips the lower 19 px of the 44 px target, which is the pre-existing part); on H it
  covers 37 px including the centre for as long as the lifted toasts are up, and a person's tap is consumed by a toast.
  The cause is H's: the Brew length now rides inside the `data-toast-above` dock (+60 px), and the unchanged toast code
  (`src/ui/Toast.tsx:116–126`, `toastLiftBottom`) floats the stack 10 px above that dock's top.
- **Residual class: BLOCKS.** The narrow exception does not apply: the overlap hides a control (Mark done, and part of the
  task field and its clear button) and changes behaviour (the tap dismisses a toast instead of crossing the task off).
- **Can H merge with the frozen spec failing? No.** `integrity.spec.ts:1090` @390×844 is green on the base and red on
  this revision in 6 of 7 runs (I did not trace the one pass; the lift and the toasts' lifetime vary with load, see §4.2 and the default-motion runs), and the red
  reflects the user-visible regression above, not test timing. R7-7 (follow-up #9,
  "wait for End's toasts") is a separate robustness fix owned by M7a; it does not license a regression in H's revision,
  and the spec is frozen for this round.

### 4.4 Rerun counts (filled in when the slot-gated reruns completed)

At 390×844 the count so far is **trial 0/4** (maker: suite + alone; me: runs a and b) and **control 4/4** (maker 3/3 at 22:59Z;
me 1/1). A further `--repeat-each=3` on each side was queued behind Lane R / Lane N jobs at the time of writing
(`review/LEAD/H/integrity-1090-390x3-{control-5310,trial-5342}.log`). The ruling does not depend on it: §4.2 measures the
cause directly with real input. If it lands, its counts are appended here.

Landed since: **control 390×844 `--repeat-each=3`: 3/3 pass**; **trial 390×844 `--repeat-each=3`: 1/3 pass, 2 fail**
(`integrity-1090-390x3-{control-5310,trial-5342}.log`). Trial total at 390×844: **1 pass in 7** (maker 0/2, me 1/5).
Independent corroboration from Lane S (`review/LS/t1090/`, same frozen spec on `90a11e5` :5310, 3 plain + 3 × repeat-each=2
runs): **390×844 9/9 pass, 375×667 9/9 pass, 1440×900 5/9** on the base. So the base's 390×844 record is 16/16 across
maker, Lane S and me, and the 1440×900 failure is a base flake (F1).

## 5. Visual gate — PASS for the layout change; the blocker is behavioural and is shown in §4.2 frames

Opened at full size: K06 `r6-context/phone-light/12-hello.png` → BEFORE `BEFORE-90a11e5/375x667-light-t100/00-first-visit.png`
→ AFTER (trial :5352) `00-first-visit.png`; K01 `01-home.png` → BEFORE `375x667-dark-t200/01-home.png` and
`844x390-light-t200/01-home.png` → AFTER at the same configurations, plus AFTER `390x844-light-t100/01-home.png`.
- First visit: identity, Chai card and order kept; one purpose line; one orange primary; two quiet underlined links; fits 375×667 @100.
- Home: K01 order kept (status → greeting → Chai → goal → composer → start). Portrait phones: the four lengths sit in a
  segmented row directly above "Put the kettle on · N min"; landscape @200: "Brew length" heads the right column above the
  start; tablet/desktop unchanged. No text or control is clipped at rest.
- Accepted trade-off (noted, not a defect): at 375×667 @200 the dock now spans 215–588 px (BEFORE 334–), so the scrolling
  window above it is ~215 px (status bar and the first word of the greeting at rest). The brief requires the options in the
  initial view at this size; focus scroll-padding uses the measured dock height, and content scrolls clear.

## 6. Residual table

| # | Item | Configs | Class | Reason / owner |
|---|---|---|---|---|
| W2H-D1 | End's toasts lifted over Today's "Mark done" (and the task field's lower half) for their lifted life; tap eaten; frozen `integrity.spec.ts:1090` @390×844 red | 390×844 @100 (both themes: geometry is theme-independent) | **BLOCKS** | Introduced by H (dock +60 px carries `data-toast-above`). Owner: Maker H. Packet §7 |
| F1 | `integrity.spec.ts:1090` @1440×900 fails ~1 in 3 | 1440×900 | FOLLOW-UP | Same on control (1/3). R7-7 / Wave-1 #9. Owner: M7a |
| F2 | End's toasts already cover Mark done's centre at 200 % text | 390×844 @200 (longer on H: 2.6 s vs 0.9 s), 375×667 @200 (H clears it) | FOLLOW-UP (watch at re-review: must not be worse than control at 390×844 @200) | Pre-existing on `90a11e5`. Toast placement is M2's (src/ui) |
| F3 | After End, the End sheet's header (`ui/Sheet.module.css .header`) stays the hit target over Today's Mark done for seconds in default-motion runs (control 14.6 s, trial 5.3 s, one run each, SwiftShader under load); a tap there is lost | 390×844 @100 default motion | FOLLOW-UP (needs targeted reproduction) | Pre-existing (control longer). Owner: focus area / M2 (Sheet exit) |
| F4 | Brew length below the dock at rest | 1440×900 @200 | FOLLOW-UP | Same on base; outside this item's required set. Owner: I04 / H |
| A1 | 215 px scrolling window above the dock | 375×667 @200 | ACCEPTED | Required by the brief (options in the initial view); focus clears via measured scroll-padding |
| A2 | Rhythm names (Gentle/Classic/Deep) dropped on phones; landscape reads Brew length before "What are you brewing?" | phones | ACCEPTED | Durations 15/25/50/custom preserved; disclosed; desktop/tablet keep names |
| A3 | `a11y.spec.ts` condition | — | ACCEPTED | Stricter on Today at rest; H-owned |

## 7. Defect packet W2H-D1 (for the one 90-minute fix round)

- **State:** Today, right after a brew with a task is ended early (End → End session), while End's two toasts are up:
  "Recipe done: Name what you're brewing · +10 leaves" and "Saved 3 minutes of focus". The composer shows
  "Carried from your last brew · **Mark done**".
- **Viewport / text / theme:** 390×844 (DPR 2 and 3), 100 % text; light (dark has the same geometry). Watch 390×844 @200.
- **Steps (real input):** fresh onboarded profile (spec PRIME: reduced motion, 3D off) → type "Chapter 3 notes" →
  Put the kettle on → (setup) `__kettle.ff(180000)` → End → End session → on Today, Mark done in view → tap its centre
  within ~0.6–3 s. Or run `KETTLE_PORT=<trial> npx playwright test tests/integrity.spec.ts --grep "phone 390.*moves nothing under the finger"`.
- **Measurement:** control: dock top 676, toasts 542–658, Mark done 517–561, centre on top, tap crosses off. H: dock top
  616, toasts 490–547 / 554–606, Mark done centre covered 1.34→3.41 s, tap dismisses the "Recipe done" toast, no "Crossed off".
- **Cause:** `src/screens/home/Composer.tsx` — `<div ref={dockRef} className={s.ctaDock} data-toast-above="" …>{lengthAt === 'dock' && length}`
  puts the 44 px Brew length row (+16 px) inside the toast-lift anchor; `src/ui/Toast.tsx:116–126` (`toastLiftBottom`, not
  H's, not to be changed) places the stack 10 px above the highest on-screen `[data-toast-above]` top. Mark done lives in
  the same file (`Composer.tsx`, the `.carried` row, ~l. 183–189).
- **Owner:** Maker H. **Constraints:** no `src/ui/**` (toast code), no edit to `integrity.spec.ts` (frozen, M7a's);
  H may change only `screens/home/**`, `screens/welcome/**`, `a11y.spec.ts`, its probes and `w2-home.spec.ts`.
- **On the maker's three options:**
  1. *Change the spec per R7-7:* not available (frozen) and would accept the regression.
  2. *Mark only the start + note as `data-toast-above`:* End's stack (≈ 116 px) would then sit on the Brew length row for
     its life — it trades one covered control for four. Only acceptable if measured not to cover the options or Mark done.
  3. *Shorter dock:* in this geometry any lift beyond ~3 px reaches Mark done's centre, so shortening alone is unlikely to
     pass unless the dock is back to its old height at 390×844 @100. The maker must measure, not estimate.
  Other routes inside `screens/home/**` (e.g. where the "Carried from your last brew · Mark done" row sits relative to the
  band the toasts occupy after End) are the maker's design choice; the frozen test also asserts the task field and its clear
  button do not move when the storage banner appears, so any reflow must keep that.
- **Done when (targeted re-review by Lane H, against control :5310 in the same session):**
  1. `integrity.spec.ts:1090` phone 390×844 passes 3/3 alone on the fix trial (control 3/3); 375×667 3/3. 1440 is F1 (not a gate unless worse than control).
  2. With End's toasts up (sampled ≤ 100 ms for their life), Mark done's centre is on top at 390×844 @100 and a real tap at
     +0.6 s and at +2 s crosses the task off; at 390×844 @200, 375×667 @100/@200 the covered time is not longer than control.
  3. End's toasts do not cover any Brew length option or the start button at any phone configuration (sampled the same way).
  4. All of §3 still holds at the 12 phone configurations (wholly visible, 9/9 on top, ≥ 44 px, real taps, keyboard, first
     visit), axe target-size 0 at rest, and the full chromium suite + timer/pwa are green apart from documented base flakes.

## 8. Follow-ups with owners
F1 → M7a (R7-7). F2 → M2 (toast placement at 200 %). F3 → focus area / M2 (End sheet exit hit-testing; reproduce first).
F4 → I04 / H. Wave-1 #5 (375×667 @200 toast limit) remains relevant to the taller dock → M2 / M8.
