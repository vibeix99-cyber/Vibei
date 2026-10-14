# CHECKER W3R1 · Maker G: Settings and shared controls (I11)

**Verdict: REJECT** `pe/w3-settings@808421d` (app and spec `876bf18`; kettle/src `6b14238`), as gated in trial `3d91793`. There is one 90-minute fix round, text only and in G's files only (Vibei, `VB-DECISIONS-RESUME.md` §4). After it, the verdict is final.

**Defects** (§3; the fix-round packet is §6):
- **G-D1:** the new Sounds line contradicts the Nudges line on an iOS Safari tab.
- **G-D2:** the Sounds line is too long at 375×667 @200 % (12 → 17 lines).
- **G-D3:** "A locked phone may hold the nudge until you’re back." is untrue. It predates G; Vibei ruled it into this round.
- **G-D4:** "This device can’t vibrate." must read "Vibration isn’t available in this browser." It predates G; Vibei ruled it into this round.

Everything else verifies (§2):
- the shared-control states and tokens;
- persistence and reset;
- the warm-days wording;
- the Nudges Off/default, Keep awake and Haptics (supported) lines.

Nothing else blocks.

| | |
|---|---|
| Lead checker | LEAD-5 (replaces LEAD-4, cut by a usage limit). I implemented none of this work |
| Under review | `pe/w3-settings@808421d`. `git rev-parse 3d91793:kettle/src` = `6b142387d961…` (checked). `SettingsScreen.tsx` at the trial = at `808421d` (checked byte for byte) |
| Trial | `3d91793` = integration + `808421d`; worktree `/home/user/wt/w5tr-g`. `git diff --stat 4d36939 3d91793 -- kettle/src kettle/tests kettle/public kettle/package.json kettle/vite.config.ts` = G's 15 files only. Dev :5523, preview :5533 |
| Base / control | `4d36939` (src `5cd9a44`); worktree `/home/user/wt/w4-final`; dev :5478, preview :5488 |
| Packet | `/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G-READY-FOR-REVIEW.md`; evidence `…/W3R1/G/` |
| Lane I | `review/LI/G/RECEIPT-LI-G.md` (COMPLETE; committed in `20b388e`), raw evidence beside it |
| My evidence | `contracts/W3R1/review/LEAD/G/`:<br>• `tiles/` (native-size tiles of the maker's control-state sheets);<br>• `sample-rowfill.py` → `rowfill.json` (row fills at rest / hover / pressed);<br>• `pairs.py`, `pngdiff.py` (LEAD-4's stdlib crop and decode tools, copied) |

## 1. What I did

### Read
- `PLAN.md`, `BRIEF-G.md`, `VB-DECISIONS-RESUME.md`, `review/INVENTORY-RESUME.md`, `review/GATE.md`, the preserve list, the house style (`W2R3/CHECKER-W2R3-T2.md`, `CHECKER-W3R1-N.md`).
- The packet in full.
- Lane I's receipt in full.
- The full src/tests diff `4d36939..3d91793` (15 files, +432 −39).
- The code the new copy describes. All read-only to G:
  - `src/timer/notify.ts`: `shouldNotify`; `initNotifications` closes nudges when the page becomes visible;
  - `src/timer/ticker.ts`: completion on wake, `freeze`/`resume`;
  - `src/timer/store.ts:378`: `whileAway`;
  - `src/app/flow.ts:192–195`: `audio.play('complete')` on every focus completion;
  - `src/audio/engine.ts:140–240`: no context before activation; suspend when hidden and idle; `play` resumes;
  - `src/timer/wakeLock.ts`, `src/lib/haptics.ts`.
- The tests that assert G's strings:
  - `tests/w3-settings.spec.ts:282–311` (G's own);
  - `tests/whistle.spec.ts:183–214` (F's).
- `docs/REAL_DEVICE_CHECKLIST.md` §2, §8.

### Ownership
Every changed file is in G's set:
- `src/screens/settings/{SettingsScreen,DataSection}.tsx`;
- `src/styles/{tokens,global}.css`;
- `src/ui/{Card,Chip,ListRow,NumberStepper,SegmentedControl,Slider,TextField,Toggle}.module.css`;
- `src/ui/{ListRow,Gallery}.tsx`;
- `tests/w3-settings.spec.ts`.

Nothing changed in `ui/Sheet.*`, `ui/Stat.tsx`, `ui/Toast*`, `ui/InlineUndo.tsx`, `ui/moment.ts`, `ui/WeekStrip.tsx` or `ui/index.ts`. There is no colour or font token change: `tokens.css` only adds `--focus-w` 3px, `--focus-gap` 3px, `--focus-gap-inset` −3px and `--disabled-opacity` 0.5.

### The code, judged against the brief
- **One ring.** The global `:focus-visible` (`global.css:106`) and `Toggle` / `Slider` / `NumberStepper` now read the tokens. The values are the same as the base's (3px ring, 3px gap), so they are equivalent.
- **TextField.** Its focus is now an outline (`TextField.module.css` `.box:focus-within`) instead of a 2px inset box-shadow plus halo, which forced colours drop. `.invalid .box` still comes later at equal specificity, so an invalid field keeps its berry border while focused.
- **SegmentedControl.**
  - The ring is drawn 1px out instead of 3px, so it stays inside the track.
  - A pressed unselected option gets a darker, sunk fill (`color-mix(surface-3, line-strong 70%)`), distinct from hover.
  - In forced colours the thumb gets a `Highlight` border; the same media query gives a selected Chip a `Highlight` ring.
- **ListRow.** `toggleLive = !!toggle && !disabled && !toggle.disabled`. A row whose switch cannot change no longer gets `.interactive` (pointer, hover and press fill) and no longer gets a row `onClick`. Button rows (`onClick && !toggle`) are as before.
- **One inert opacity.** Every `opacity` 0.5 / 0.55 / 0.6 is now `--disabled-opacity` 0.5. The NumberStepper's −/+ no longer fade twice. Button keeps its own outlined inert face (W2 decision; maker's ACCEPTED note).
- **Copy.** `SettingsScreen.tsx:105, 134, 187–189, 233, 240`; `DataSection.tsx:235`; dev-only `Gallery.tsx` (`#/kit`, lazy-loaded from `KitRoute.tsx`).

### Opened at full size
**References:**
- K09 `review/LI/G/reference/K09-live-settings.jpg`.

**Lane I's side-by-side slices** (`review/LI/G/before-after/`, BEFORE left, AFTER right):
- `settings-375x667-light-200-part02.png`, `-part03.png` (Sounds and Nudges at 375×667 @200);
- `settings-1440x900-light-100-part01.png` (Daily goal footer, Sounds).

**The maker's control-state sheets,** 1440×900@2, in native tiles (`review/LEAD/G/tiles/`):
- `after-light-0-0` vs `base-light-0-0` (rest / hover / focus, Settings and Today rows);
- `after-light-1170-0` vs `base-light-1170-0` (focus / pressed / disabled);
- `after-light-0-1380` vs `base-light-0-1188` (session controls);
- `after-light-1170-1380` (the kit's inert set with computed opacity and Tab order).

### My own check: the blocked row's hover and press fill
Lane I could prove only the cursor change (receipt §1, "unproven by me"). I sampled the maker's state sheets at the same pixel in each column (`rowfill.json`):

| Sheet | Nudges row, blocked: rest / hover / pressed | Tea breaks row, live: rest / hover / pressed |
|---|---|---|
| Base light | 255,253,250 / **252,244,233** / **243,230,211** | 255,253,250 / 252,244,233 / 243,230,211 |
| Trial light | 255,253,250 / **255,253,250** / **255,253,250** | 255,253,250 / 252,244,233 / 243,230,211 |
| Base dark | 46,35,57 / **55,42,68** / **65,51,79** | 46,35,57 / 55,42,68 / 65,51,79 |
| Trial dark | 46,35,57 / **46,35,57** / **46,35,57** | 46,35,57 / 55,42,68 / 65,51,79 |

The blocked row no longer reacts; a live row keeps both fills. This closes Lane I's open item.

## 2. What verifies (kept for the fix round)

| Item | Result | Source |
|---|---|---|
| **Controls first** | `w3-settings.spec.ts` fails 9/9 on base :5478, passes 9/9 on the maker's :5503. Lane I reproduced each inconsistency on base by its own probe:<br>• the field has no outline;<br>• in forced colours there is no field focus and no selected-segment border;<br>• pressed = hover on segments;<br>• the blocked row has hover and press fills | Packet; Lane I §1 |
| **Focus visible, light and dark** | 35 Tab traversals per build (7 screens × 4 configs + forced). The stop counts are identical. No ring is clipped, and no disabled control is a Tab stop.<br>**TextField:** an outline now, ring vs outside 4.48–4.69 light, 8.58–9.49 dark; in forced colours, a system-colour outline (base: none).<br>**Segments:** ring vs outside unchanged (3.87 / 6.98); vs the inner gap 3.04–3.07 light (base 3.83), still ≥ 3:1 (§4, G-R2) | Lane I §1 |
| **Pressed ≠ hover ≠ selected** | Pressed unselected segment `oklab(0.879 …)` light / `oklab(0.381 …)` dark, unlike hover; the base had pressed = hover. Selected segment and chip survive forced colours | Lane I §1; my tiles (`after-light-1170-0`, pressed column) |
| **Disabled reads disabled** | One opacity, 0.5, on every inert control except Button (by design). None is in the Tab order; not-allowed cursor | Maker's kit sheet (`after-light-1170-1380`); Lane I §1 |
| **No control moved** | 0 size changes at rest across 36 screen/config pairs | Lane I `LI-compare.txt` |
| **Persistence and reset** | In a disposable context, with real clicks and keys: theme, rhythm (custom 55/10/20/3), motion, 3D, sounds, ambience and name survive a reload; **Reset everything** returns every default and `#/welcome`. Identical to base. Shortcuts are a static list with nothing to persist | Lane I §2; packet test 1 |
| **Warm-days wording in G's files** | 11 visible "streak" strings on base → 0 at trial; identifiers only remain. Rendered Settings text has none at all 16 configs. The new strings follow the glossary verbatim, with no loss framing. The remaining `title="Warm streak"` is `app/Rail.tsx:233`, F's file | Lane I §4; my diff read |
| **Honest copy, the lines that are right** | **Nudges Off / default:** "…while Kettle is out of sight" / "…open but out of sight" match `shouldNotify`.<br>**Haptics, supported:** "…on devices that can vibrate" hedges desktop `navigator.vibrate` without a motor.<br>**"Closed, Kettle is silent" / "no nudge can come":** no push, and the service worker has only `message` and `notificationclick` | Lane I §3; my reading of `notify.ts`, `engine.ts`, `sw.ts` |
| **Settings top to bottom, REFERENCE → BEFORE → AFTER** | 16 configs per build, full page.<br>• **Visible differences:** copy only (Daily goal footer, Sounds, Keep awake, Haptics).<br>• **Top 1000 px:** identical at threshold 30.<br>• **Horizontal fit:** no overflow.<br>• **K09 structure:** kept.<br>• **The cost:** the Sounds row grows everywhere, worst at 375×667 @200 (G-D2) | Lane I §5; my full-size reads of the slices |
| **The maker's two `notice-strip` failures at 200 %** | Lane I ran exactly those two tests once on each build: trial ✓ 1.9 m / 1.1 m, base ✓ 2.0 m / 1.1 m. The maker's failures were slot contention (one hit the 240 s timeout while F held 2 slots). G changes nothing on Today's layout (outlines and opacity take no space) | Lane I §6 |
| **Suites** | tsc clean; vitest 290/290; `w3-settings` 9/9; the specs touching G's controls 52/52 (whistle 8, w2-home 18, a11y 11, w2-firstvisit 6, w3-settings 9); break-reach 17/17 | Packet |
| **Preserve list** | No palette, font, chrome, setting, dependency or behaviour change. Destructive tests ran in disposable contexts only | Diff; packet |

## 3. Defects

All four are text in `kettle/src/screens/settings/SettingsScreen.tsx`, G's file. Line numbers are at `808421d` (= trial `3d91793`). Strings are quoted exactly; the file writes apostrophes as U+2019 (’).

### G-D1 · The Sounds line says sound plays "in a tab", while on an iOS Safari tab the Nudges line on the same screen says Kettle chimes only "while it’s on screen" (BLOCKS, introduced; Vibei §4)

**Where.** `SettingsScreen.tsx:134`, the unmuted Sounds description:

> `The whistle, effects and ambience play while Kettle is open, in a tab or as the app, after your first tap. Closed, Kettle is silent. A phone’s silent switch or lock screen can quiet it too.`

**The contradiction.**
- On an iOS Safari tab, `'Notification' in window` is false (`notify.ts:26`), so the Nudges row shows `SettingsScreen.tsx:182`, unchanged from base:
  > `This browser can’t show notifications. With sound on, Kettle chimes while it’s on screen.`
- F's Welcome says the same (`welcome/steps.tsx:236, 241`).
- Two rows apart, the Sounds line promises play "in a tab".

**What the code does.** Sound plays only while the page's JavaScript runs:
- `engine.ts` suspends an idle context when hidden;
- `play` resumes it, and `flow.ts:195` plays the whistle on every focus completion.

On iOS/iPadOS a backgrounded tab or home-screen app is frozen, so a brew ending with another app in front is not heard then. On desktop Chromium a hidden tab does play (`whistle.spec.ts:100`).

So "in a tab" is true on a computer and untrue on the iPhone, the one platform where the screen also shows the "on screen" line. The base line ("…while Kettle is open. A phone’s silent switch or lock screen can keep them quiet.") made no background claim, so this contradiction is new.

**Required.**
- The Sounds line must not claim, as a general rule, that sound plays while Kettle is in a background tab or out of sight.
- It must agree with `:182` and with F's Welcome lines. For example, it can say a phone can quiet sounds when it is locked, on silent or Kettle is out of sight.
- Leave `:182` as it is: F's `whistle.spec.ts:213` asserts it word for word, and F's Welcome echoes it.

### G-D2 · At 375×667 @200 % the Sounds description runs to 17 lines, from 12 on base (BLOCKS, introduced; Vibei §4)

**Where.** The same string as G-D1: 189 characters, against the base's 125.

**Measured.**
- **375×667 @200 %** (`review/LI/G/before-after/settings-375x667-light-200-part02.png`, opened at full size): base 12 lines, trial 17, in a column about 130 px wide. The switch sits mid-row, about 330 px below the "Sounds" label.
- **Other configs:** 1440 @100 from 2 to 3 lines (`…-1440x900-light-100-part01.png`). Page height +59 / +78 px at 100 % and +235 / +274 px at 200 % on the phones (Lane I §5).

**Required.**
- At 375×667 @200 %, light and dark, the Sounds description takes **no more lines than on base (12)**.
- In every one of the 16 configs it is no taller than the trial's current line.
- One rewrite fixes G-D1 and G-D2 together.

### G-D3 · The Nudges On line says "A locked phone may hold the nudge until you’re back.", which is untrue: no nudge comes if the brew ends while the page is frozen (BLOCKS, ruled by Vibei §4; the sentence predates G)

**Where.** `SettingsScreen.tsx:187`, the On line (the status is granted and Nudges is on):

> `On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. With Kettle closed, no nudge can come. A locked phone may hold the nudge until you’re back.`

**What the code does.** Nothing holds a nudge:
- A nudge is raised only from `timer:complete`, only while no Kettle tab is visible (`notify.ts:165–167, 175, 183–189`).
- If the phone has frozen the page (locked, or Kettle in the background long enough), the ticker completes the phase on wake (`ticker.ts:144–150, 287–293`), when the page is visible again. `shouldNotify` is then false, and **no nudge is ever shown**.
- A nudge that was shown is closed when the person comes back (`notify.ts:178–179`).
- A phone that has not yet frozen the page (Android Chrome, soon after locking) can still show the nudge at the end. So the honest condition is "your phone has paused Kettle", not "your phone is locked".

**Required.**
- Remove the "may hold the nudge" sentence.
- Say what happens: if the phone has paused Kettle (for example, locked) when the brew or tea break ends, no nudge comes. Optionally add that Kettle shows it when you’re back.
- Keep the two true parts ("open but out of sight", "closed: no nudge").
- The new On line is **no longer than now** (180 characters) and no taller in rendered lines at 375×667 @200 %. Nobody has rendered it yet: headless Chromium keeps the permission denied, so it needs the permission fake that `whistle.spec.ts` uses.

**A cross-owner effect the maker must not fix in F's file:** `tests/whistle.spec.ts:203` (F's) asserts `/A locked phone may hold the nudge until you’re back/` (see §6, C-1).

### G-D4 · "This device can’t vibrate." must say "Vibration isn’t available in this browser." (BLOCKS, ruled by Vibei §4; the line predates G)

**Where.** `SettingsScreen.tsx:240`, the Haptics description when `'vibrate' in navigator` is false:

> `This device can’t vibrate.`

**Why it is wrong.** It shows on every iPhone (WebKit has no `navigator.vibrate`), whose hardware does vibrate. What is missing is the browser API, not the device.

**Required:** exactly `Vibration isn’t available in this browser.` (U+2019 apostrophe, as the file writes every other one). The supported line, `Little buzzes for key moments, on devices that can vibrate.`, stays.

**No other defect.** I found nothing else introduced or worsened by G. The near misses are in §4.

## 4. Residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | My check | Class | Owner |
|---|---|---|---|---|
| G-D1 | Sounds "in a tab" vs Nudges "while it’s on screen" (iOS Safari) | §3 | **BLOCKS** | G (fix round) |
| G-D2 | Sounds description 12 → 17 lines at 375×667 @200 % | §3 | **BLOCKS** | G (fix round) |
| G-D3 | "A locked phone may hold the nudge until you’re back." is untrue | §3 | **BLOCKS** (Vibei) | G (fix round) |
| G-D4 | "This device can’t vibrate." → "Vibration isn’t available in this browser." | §3 | **BLOCKS** (Vibei) | G (fix round) |
| G-R1 | **Keep awake:** "Stops your screen dimming while a brew is on screen." The lock is held while the timer is `running` and the page is visible (`wakeLock.ts:19–20`). So it is released while a brew is paused on screen, and held during a running tea break | The base line ("…during a brew.") had the same pause gap; G's line adds the true visibility condition and is not worse | **FOLLOW-UP** (pre-existing). Optional in the fix round, not required: "…while a brew runs on screen." | G / I11 |
| G-R2 | **Segment ring vs its inner gap:** 3.04–3.07 light (base 3.83), dark 5.76–5.81 | Still ≥ 3:1. The 1px offset keeps the ring inside the track instead of over the neighbouring option, as the maker intends | **ACCEPTED** | — |
| G-R3 | **The selected segment's thumb sometimes sticks 48 px below its option** (framer-motion `layoutId`, `translate(0,48)`), covering the bottom of its focus ring | Lane I: base 1/4 and trial 1/4 configs in the rerun, on both builds (`segment-thumb-rerun/`). Not in G's diff (CSS only; `SegmentedControl.tsx` unchanged) | **FOLLOW-UP** (pre-existing) | G's file, next round |
| G-R4 | **Nudges Off / default lines** promise a nudge "while Kettle is (open but) out of sight" without the frozen-page limit | The limit is stated once, on the On line the person sees after turning it on (`whistle.spec.ts:202`: "stated once at the switch"). G-D3 makes that statement true | **ACCEPTED** (design) | — |
| G-R5 | **Focus flags in other owners' files, identical on base:**<br>• session "Ambience" / "Turn sound on" rings 2.53–2.94 over the scene (light);<br>• the active nav item's inset ring painted over by `.indicator` at 1440;<br>• the skip link's bottom edge;<br>• a 1.11 edge where a ring meets an orange surface ("Change brew length", "Delete this brew", Welcome) | Lane I §1 | **FOLLOW-UP** (pre-existing) | F (`Shell.module.css`, focus files) / S (History) |
| G-R6 | **ListRow button rows:** the divider overpaints the top 2 of 3 px of the −3px inset ring | Same at 1440 on both builds; at 390 a sub-pixel position. G kept the value (now the token) | **FOLLOW-UP** (pre-existing) | G / I11 |
| G-R7 | **Forced colours, both builds:** unselected chips, segments and Pause have no boundary; the muted volume track is not drawn | Lane I §1 | **FOLLOW-UP** (pre-existing; G improved the selected states) | G / I11 |
| G-R8 | **`ui/Toast.module.css:75` uses the non-token `var(--focus, var(--sky))`** | Maker's cross-owner note | **FOLLOW-UP** | F |
| G-R9 | `docs/REAL_DEVICE_CHECKLIST.md` rows 2.3 and 8.5 repeat the locked-phone claim ("it may only show up once you unlock"; "Settings → Nudges says a locked phone may hold it") | Will be stale once G-D3 lands. `docs/` is not G's | **FOLLOW-UP** | Orchestrator at merge |
| E-1 | **Evidence gaps,** not defects:<br>• the Nudges On / Off / default lines never rendered (headless keeps `denied`; the fix round must render the new On line, §6);<br>• forced colours only at 390 light;<br>• keyboard on a touch context;<br>• the kit's inert section not exercised by Tab;<br>• real devices;<br>• the full chromium suite on G's trial (the combined trial's Lane R run covers it, §5) | — | Noted | Fix round / final regression |

## 5. Lane I receipt (`review/LI/G/RECEIPT-LI-G.md`), and my checks of it

**Read in full.** I checked each fact I rely on:
- **Revision and servers.**
  - The receipt names src `6b14238`, which equals my `git rev-parse 3d91793:kettle/src`.
  - It audited the previews :5533 / :5488 and ran the notice-strip tests on the dev servers :5523 / :5478, as instructed.
- **Copy (§3).** I re-read each quoted code line against the trial:
  - `notify.ts:26, 165–167, 174–179`;
  - `engine.ts` (the suspend and resume paths);
  - `flow.ts:195`.

  Its two contradictions are the code's: the iOS "in a tab" vs "on screen" (G-D1), and the locked-phone hold (G-D3). The receipt also found the "can’t vibrate" line wrong on iPhones (G-D4). I agree with each.
- **Line counts (§5).** I opened `settings-375x667-light-200-part02.png` at full size and counted 12 lines (base) and 17 (trial) in the Sounds description. The 1440 slice shows 2 → 3.
- **Warm days (§4).** My diff read agrees: the 11 base strings are gone from G's files, and the remaining `title="Warm streak"` is F's `Rail.tsx:233`.
- **States (§1).** I confirmed the pressed-fill and blocked-row claims on the maker's sheets myself (§1, `rowfill.json`), which closes the receipt's "fill unproven".
- **notice-strip (§6).** The logs are present (`notice-strip/LI-ns-{trial,base}.log`). The run times match the table.

**What it leaves open:** see §4 E-1. None of it bears on a defect except the unrendered Nudges lines. The fix round must close that for the new On line.

**Combined trial (Lane R):** `review/LR/ALL/RECEIPT-LR-ALL.md` has not landed. The cross-effects attributable to G, if any, will be ruled in my cross-effects note when it does. Of the combined failures seen so far, none touches a G file:
- `integrity:1017` (the storage-full banner);
- `w3-stats:98` ("Delete this brew?");
- `w3-notices:252`.
