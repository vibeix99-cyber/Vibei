# CHECKER W3R1 · Maker G: Settings and shared controls (I11)

**Final verdict: APPROVE** `pe/w3-settings@7f95c18` (code `0320211`, kettle/src `a53263f`), as gated in fix trial `c8b849e` (integration + `7f95c18`). Final: the one fix round is spent. Any change to the branch after this invalidates it.

**History.**
- **First review:** REJECT `808421d` (§1–§7), with four text defects G-D1…G-D4 (Vibei §4).
- **Fix round (§8):** all four are closed. My own probe and spec runs on :5525 agree with the maker's packet.
- **The optional Keep awake line is kept**, which closes G-R1.

**One cross-owner item stays open, and it is not G's:** C-1. F's `tests/whistle.spec.ts:203` must change to G's key sentence: `If Kettle is closed or your phone has paused it by then, no nudge comes.`

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

**Combined trial (Lane R):** `review/LR/ALL/RECEIPT-LR-ALL.md` has not landed. The cross-effects attributable to G, if any, will be ruled in my cross-effects note when it does. None of the combined failures seen so far is about a G control or G copy:
- `integrity:1017` at 390×844: the storage-full banner (`app/SaveWarning*`, nobody's file) was still there 6 s after room was freed, at a step that writes from Settings;
- `w3-stats:98` ("Delete this brew?", S's Sheet);
- `w3-notices:252` (F's band).

G's changes are copy plus CSS that takes no space and does not touch the save path. Their attribution waits for that receipt and is not a G defect now.

## 6. Fix round (90 minutes, one round; text only, G's files only)

**Where.** Work on `pe/w3-settings` in `/home/user/wt/w5g`, from `808421d`. Commit locally and never push.

**Hand back** `contracts/W3R1/G-FIX-READY.md`, with evidence in `contracts/W3R1/G/fix/` (full-size PNGs), giving:
- the new hash and the `kettle/src` tree hash;
- each acceptance check below with its result and paths.

**Files you may change:**
- `kettle/src/screens/settings/SettingsScreen.tsx`, the strings at `:134` (unmuted Sounds), `:187` (Nudges On) and `:240` (Haptics unsupported). Optionally `:233` too (G-R1, Keep awake: "…while a brew runs on screen.").
- `kettle/tests/w3-settings.spec.ts`.

**Do not change** anything else: no CSS, no other line of copy, and in particular not `:182`, which F's `whistle.spec.ts:213` asserts. Nothing outside G's files.

### What each line must say

| # | Line | Must | Must not | Example (not binding; the maker words it) |
|---|---|---|---|---|
| G-D1 + G-D2 | `:134`, Sounds, unmuted | Say only what the code does on every platform. Agree with `:182` and F's Welcome ("chimes while it’s on screen"), e.g. a phone can quiet sounds when it is locked, on silent or Kettle is out of sight | Claim play "in a tab", in the background or out of sight as a rule. Run longer than base: **≤ 12 lines at 375×667 @200 %** | "The whistle, effects and ambience play after your first tap. A phone can quiet them when locked, on silent or out of sight." (123 characters; base 125) |
| G-D3 | `:187`, Nudges On | Say: if Kettle is closed, or the phone has paused it (e.g. locked) when the brew or break ends, no nudge comes. Keep "open but out of sight" | Say or imply that a nudge is held, delayed or delivered later. Be longer than now (180 characters) | "On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. If Kettle is closed, or your phone has paused it, no nudge comes." (154) |
| G-D4 | `:240`, Haptics, unsupported | Read exactly `Vibration isn’t available in this browser.` (U+2019) | Any other wording | — |

### Acceptance checks (all must hold; I rerun the ones marked ◆)

1. **◆ Ownership and scope.** `git diff --stat 808421d <fix> -- kettle/` lists only `src/screens/settings/SettingsScreen.tsx` and `tests/w3-settings.spec.ts`, plus the packet and evidence. In `SettingsScreen.tsx`, only the string literals at `:134`, `:187`, `:240` (and optionally `:233`) differ.
2. **◆ G-D1, the iOS Safari tab state.** Open Settings with `window.Notification` removed by an init script, Sounds on.
   - Both `:182` ("…chimes while it’s on screen.") and the new Sounds line are visible.
   - The Sounds line does not contain "in a tab", "in the background" or any claim that sound plays while Kettle is out of sight.
   - A spec test asserts this (new or extended in `w3-settings.spec.ts`).
   - Frame: 390×844 light @100, the Sound and Notifications groups.
3. **◆ G-D2, length.** Measure the Sounds description's rendered line count (height ÷ computed line-height) at all 16 configs (390×844, 375×667, 844×390, 1440×900 × light/dark × 100/200 %) on the trial `3d91793` (BEFORE) and on the fix (AFTER). Give the table, with the base's count beside them.
   - **375×667 @200 %, light and dark: ≤ 12.**
   - Every config: no more lines than BEFORE.
   - Frames: BEFORE / AFTER of the Sounds row at full size, at 375×667 @200 light and dark, 390×844 @100 light, 1440×900 @100 light.
4. **◆ G-D3, the On line on screen.** Render it with a faked granted permission, as `whistle.spec.ts`'s `fakePermission('granted')` does, plus `notifications: true`. Do this at 375×667 @200 light and dark and at 390×844 @100 light.
   - The new line is visible.
   - "may hold" appears nowhere.
   - Its line count at 375×667 @200 is ≤ the current line's, rendered the same way on the trial (BEFORE).
   - A spec test asserts the new On line's text.
   - Frames: BEFORE / AFTER at full size.
5. **◆ G-D4.** With `navigator.vibrate` removed by an init script, Haptics shows exactly `Vibration isn’t available in this browser.` and its switch is disabled. A spec test asserts it. Frame at 390×844 light @100.
6. **The copy tells the truth.** One sentence per changed line in the packet, citing the code it rests on:
   - Sounds: `engine.ts` (activation, suspend) and the frozen-page behaviour;
   - On: `notify.ts:165–189` and `ticker.ts` (completion on wake);
   - Haptics: `'vibrate' in navigator`.
7. **◆ The spec is not weakened.**
   - `w3-settings.spec.ts:303–304` now assert the new strings.
   - Every other assertion stays, including the "streak" sweep and the controls tests.
   - On base :5478 it still fails (controls first); on the fix it passes, twice in a row.
8. **Suites.** tsc clean; vitest; `w3-settings` ×2; `whistle.spec.ts` unmodified. **Exactly one** failure is expected in the whistle spec, at `:203`, on the old sentence (C-1). Name it and paste the error; any other failure there is a defect. Also `a11y` and `w2-firstvisit`.
9. **No layout change but the copy.** Settings top to bottom at 375×667 @200 light, full page, BEFORE (trial) vs AFTER. The only visible differences are the changed lines and the page height that follows from them.

### Cross-owner requests (G must not edit these)

- **C-1 · `tests/whistle.spec.ts:203` (F's).** It asserts `/A locked phone may hold the nudge until you’re back/`. Its regex must change to the key sentence of the new On line, which G names verbatim in `G-FIX-READY.md`. The change goes in F's fix round if F has one; otherwise the orchestrator makes this one-line test-text change at merge. I verify it on the merged tree.
- **C-2 · `docs/REAL_DEVICE_CHECKLIST.md` rows 2.3 and 8.5.** Reword to match (orchestrator, at merge).

## 7. BEFORE / AFTER for Vibei (full size)

**REFERENCE:** K09 `contracts/W3R1/review/LI/G/reference/K09-live-settings.jpg`.

**Settings top to bottom** (Lane I, 16 configs per build, `contracts/W3R1/review/LI/G/`):
- BEFORE: `BEFORE-base-4d36939/settings/settings-<size>-<theme>-<100|200>.png`;
- AFTER: `AFTER-trial-3d91793/settings/…` (same names);
- side by side: `before-after/settings-<size>-<theme>-<text>-partNN.png`, BEFORE left.

**The rows this round changes:**
- Sounds at 375×667 @200 (G-D2): `before-after/settings-375x667-light-200-part02.png` (Sounds) and `-part03.png` (Nudges, Blocked);
- 1440 @100: `before-after/settings-1440x900-light-100-part01.png` (Daily goal footer and Sounds).

**Control states,** 1440×900@2, rest / hover / focus / pressed / disabled (the maker's, `/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G/controls/`):
- `base-states-{light,dark}.png` → `after-states-{light,dark}.png`;
- native tiles in `contracts/W3R1/review/LEAD/G/tiles/`.

**Focus, forced colours** (Lane I): `BEFORE-base-4d36939/states-390x844-light-forced.png` → `AFTER-trial-3d91793/states-390x844-light-forced.png`.

The fix round adds its own BEFORE / AFTER for the three changed lines (§6, checks 2–5).

## 8. Fix round: `pe/w3-settings@7f95c18` (code `0320211`, kettle/src `a53263f`)

| | |
|---|---|
| Fix trial | `c8b849e` = integration + `7f95c18`; worktree `/home/user/wt/w5tr-g2`; dev :5525 (all my fix runs), preview :5535 |
| Revision check | `git rev-parse 7f95c18:kettle/src` = `0320211:kettle/src` = `c8b849e:kettle/src` = `a53263f6ebe2…` (checked) |
| Timing | Handed back 17:49 UTC, inside the 17:05–18:35 window (`GATE.md`) |
| Packet | `/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G-FIX-READY.md`; evidence `…/W3R1/G/fix/` |
| BEFORE | G trial `3d91793` on :5523. Base `4d36939` on :5478 |
| My evidence | `contracts/W3R1/review/LEAD/G/fix/`:<br>• `lead-gfix.mjs` (my probe; it does not use the maker's tool);<br>• `shots/lead-gfix-{FIX,BEFORE,BASE}.json` and the row frames `shots/<BUILD>-<cfg>-<line>.png`;<br>• `runs/*.log` (specs) |

### ◆1 · Scope (rerun)
`git diff 808421d 7f95c18 -- kettle/src` changes only `SettingsScreen.tsx`: four string literals at `:134`, `:187`, `:233`, `:240` (read in full). `:182` is unchanged.

`git diff 808421d c8b849e --stat -- kettle/` lists those two code files plus review evidence only. The tests diff changes only `tests/w3-settings.spec.ts`. There is no CSS change and nothing outside G's files. **PASS.**

**The four lines now:**

| # | Line | Now |
|---|---|---|
| G-D1 + G-D2 | `:134` Sounds | "The whistle, effects and ambience play after your first tap. A phone can quiet them when locked, on silent or out of sight." (123 characters; base 125, trial 189) |
| G-D3 | `:187` Nudges On | "On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. If Kettle is closed or your phone has paused it by then, no nudge comes." (161; trial 180) |
| G-R1 (optional) | `:233` Keep awake | "Stops your screen dimming while a brew runs on screen." |
| G-D4 | `:240` Haptics, unsupported | "Vibration isn’t available in this browser." (U+2019, exact) |

**The copy is true to the code** (my reading, §3):
- **Sounds.** No context exists before activation, hence "after your first tap". A frozen phone page runs nothing, so "a phone can quiet them when locked, on silent or out of sight". No background-play promise is made, and the line agrees with `:182` and F's Welcome.
- **Nudges On.** A frozen page completes on wake, when it is visible again, so no nudge comes. There is no push, so a closed Kettle sends none either. Nothing is promised later.
- **Haptics.** The line names the API, not the device.
- **Keep awake.** `wakeLock.ts:19–20` holds the lock only while the timer is `running` and the page is visible, so "runs" is now true for a paused brew.

### ◆2–◆5 · My probe on three builds
Method: a fresh context per config; frozen clock `2026-10-12T07:40Z`, then `resume()`; seed `veteran`; sound on.
- **"granted"** = `Notification.permission` faked as `whistle.spec`'s `fakePermission` does, with Nudges on.
- **"Safari"** = `window.Notification` and `Navigator.prototype.vibrate` removed.
- **Lines** = distinct line boxes of the text node; height ÷ line-height agrees in every cell.
- **desk** = `isMobile: false` (the context Lane I's 12/17 came from). **phone** = `isMobile` + touch.

| Config | Sounds: base / BEFORE / **fix** | Nudges On: base / BEFORE / **fix** | Keep awake: base / BEFORE / **fix** |
|---|---|---|---|
| 375×667 light @200, desk | 12 / 17 / **10** | 9 / 16 / **14** | 5 / 5 / **6** |
| 375×667 dark @200, desk | 12 / 17 / **10** | 9 / 16 / **14** | 5 / 5 / **6** |
| 375×667 light @200, phone | 11 / 14 / **10** | 8 / 15 / **13** | 4 / 5 / **6** |
| 375×667 dark @200, phone | 11 / 14 / **10** | 8 / 15 / **13** | 4 / 5 / **6** |
| 390×844 light @100, phone | 5 / 7 / **5** | 4 / 7 / **6** | 2 / 2 / **2** |
| 1440×900 light @100, desk | 2 / 3 / **2** | 2 / 3 / **3** | 1 / 1 / **1** |

**◆2 · iOS Safari tab, 390×844 light @100 (fix)**, frames `shots/FIX-390x844-light-100-phone-safari-*.png`:
- The Nudges row shows `:182` ("…chimes while it’s on screen."), with its switch disabled.
- The Sounds line shows beside it, with no "in a tab" anywhere on Settings.
- **BEFORE:** the same state shows "in a tab". **PASS.**

**◆3 · Length.**
- **375×667 @200, light and dark: 10 lines** in both contexts. That is ≤ 12, and below base (12 desk / 11 phone).
- Every config I ran is ≤ BEFORE and ≤ base.
- My numbers equal the maker's table in every cell I ran.
- Frames: `shots/{BASE,BEFORE,FIX}-375x667-{light,dark}-200-desk-granted-sounds.png`; I opened them at full size. **PASS.**

**◆4 · Nudges On.**
- On screen in every granted config: 14 lines vs 16 (desk) and 13 vs 15 (phone) at 375×667 @200.
- "may hold" and "until you’re back" appear nowhere on Settings; my sweep is of `main.innerText`. BEFORE and base have both phrases.
- Frame: `shots/FIX-375x667-dark-200-desk-granted-nudgesOn.png` (opened). **PASS.**

**◆5 · Haptics.** With `vibrate` removed, the line reads exactly "Vibration isn’t available in this browser." and the switch is disabled. BEFORE and base read "This device can’t vibrate." Frame: `shots/FIX-390x844-light-100-phone-safari-hapticsUnsupported.png`. **PASS.**

### The optional Keep awake change (G-R1): my ruling, **keep it**
- **It makes the line true.** A paused brew releases the lock, and "runs" now says so.
- **The cost is small.** One extra line, at 375×667 @200 only (5 → 6; at every other config I ran it is the same). That is about 39 px in a page the fix makes about 117 px shorter at that size (packet check 9, the maker's DOM diff).
- **Nothing else moves.** No control moves within its row, and nothing overlaps.
- **It closes G-R1.**

### ◆7 · The spec, rerun by me
**Run 1:** `KETTLE_PORT=5525 npx playwright test tests/w3-settings.spec.ts tests/whistle.spec.ts --project=chromium --workers=1`, from the fix trial's worktree, through the slot gate (`runs/fix-5525-w3settings-whistle.log`):
- **`w3-settings` 10/10 passed**, including the new iOS Safari tab test (`:318`).
- **`whistle` 7/8.** The one failure is `whistle.spec.ts:203`, on the old sentence `/A locked phone may hold the nudge until you’re back/` (C-1, F's file, unmodified), exactly as expected. Every other whistle test passed, including `:208`, which asserts `:182` word for word.

**Run 2, controls first:** the fix's spec against base :5478 (`runs/base-5478-w3settings.log`): **10/10 failed**.

**Spec diff** (`git diff 808421d 7f95c18 -- kettle/tests`, read in full):
- **Removed:** the two old copy regexes only.
- **Added:**
  - exact-text assertions for the new Sounds and On lines;
  - a sweep of the whole Settings text for `/may hold|until you’re back|later/i`;
  - the iOS Safari tab test (`:182` and Sounds visible together, no "in a tab", Nudges and Haptics switches disabled, the exact Haptics line).
- **Unchanged:** every other assertion.

It is stricter, not weaker. **PASS.**

### Checks 6, 8, 9 (the maker's, read)
- **6.** The packet's code citations match my reading (above).
- **8.**
  - tsc clean; vitest 290/290; `a11y` 11/11 and `w2-firstvisit` 6/6 on :5503 (`G/fix/suites-whistle-a11y-firstvisit.txt`).
  - The packet's `w3-settings` ×2, 10/10 each, is consistent with my run.
- **9.** The maker's DOM diff of Settings at 375×667 light @200 (`G/fix/layout-diff-375x667-light-200.json`) finds two changed elements:
  - Sounds: −156 px;
  - Keep awake: +1 line.

  Everything else is identical in text and height. That agrees with my line counts.

### Final residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | Class |
|---|---|---|
| G-D1 | Sounds vs Nudges on an iOS Safari tab | **Closed** (◆2) |
| G-D2 | Sounds length at 375×667 @200 | **Closed:** 10 lines, base 12 (◆3) |
| G-D3 | The locked-phone sentence | **Closed:** the true condition is stated; the line is shorter (◆4) |
| G-D4 | Haptics unsupported line | **Closed:** exact (◆5) |
| G-R1 | Keep awake and a paused brew | **Closed** by the optional change (kept, ruling above) |
| C-1 | F's `whistle.spec.ts:203` still asserts the old sentence. The key sentence for it: `If Kettle is closed or your phone has paused it by then, no nudge comes.` | **Cross-owner, open:** F's fix round, or the orchestrator at merge. I check it on the merged tree. It is not a G defect: G may not edit F's file |
| C-2 | `docs/REAL_DEVICE_CHECKLIST.md` rows 2.3 and 8.5 | **FOLLOW-UP:** orchestrator at merge |
| G-R2…G-R9, E-1 | As in §4 | Unchanged |

No item is introduced or worsened by this change in a way that is a defect, so nothing BLOCKS. The narrow transient-artifact exception is not needed.

**BEFORE / AFTER for the fix** (full size, `contracts/W3R1/review/LEAD/G/fix/shots/`):
- Sounds at 375×667 @200: `{BASE,BEFORE,FIX}-375x667-{light,dark}-200-desk-granted-sounds.png`;
- Nudges On: `{BASE,BEFORE,FIX}-375x667-{light,dark}-200-desk-granted-nudgesOn.png`;
- iOS Safari tab: `{BASE,BEFORE,FIX}-390x844-light-100-phone-safari-{sounds,nudgesUnsupported,hapticsUnsupported}.png`.

The maker's full set is `/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G/fix/rows/`.


*Run logs:* `kettle/.gitignore:6` ignores `*.log`, so every `.log` cited here is committed as a `.log.txt` copy beside it (same name plus `.txt`).
