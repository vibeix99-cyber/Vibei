# RECEIPT · Lane I (interaction and visuals) · W3R1 Maker G (Settings and shared controls, I11)

Raw evidence only. No verdict. LEAD-4 decides. Lane I implemented none of this work.

- **Under review:** `pe/w3-settings@808421d` (src `6b14238`). **Trial** `3d91793` (integration + G) at `/home/user/wt/w5tr-g`. Checked: `git rev-parse HEAD:kettle/src` = `6b14238…`.
- **Base:** `4d36939` (src `5cd9a44`) at `/home/user/wt/w4-final`.
- **Servers:**
  - My audits used the previews: trial **:5533**, base **:5488**, both with `?debug`. The served `index-*.js/css` names match `/tmp/rv7-servers/dist-w5tr-g` and `dist-w4final`. The trial bundle contains the new copy and `--focus-gap`.
  - The notice-strip tests used the dev servers, as instructed: trial **:5523**, base **:5478**.
- **Method:**
  - Frozen clock `2026-10-12T07:40:00Z`, then `resume()`. Seed `veteran` (Welcome: `fresh&onboarded=0`).
  - DPR 1, `reducedMotion: reduce`, real Tab, mouse and clicks.
  - Every browser run went through `slots.py --lane LI --n 1`, each with its own `--output`. I killed one PID of my own (my queued smoke waiter, 2670) and nothing else.
- **Time:** 12:20 to 13:30 UTC, of which about 35 min was spent waiting for slots.
- **Evidence** (49 MB) is in this folder. Tools are in `tools/` (`LI-audit.mjs`, `LI-compare.mjs`, `LI-seg.mjs`, `LI-nudge.mjs`, `LI-crop.mjs`, `LI-zoom.mjs`). Base vs trial numbers are in `LI-compare.txt`.

## 1. Shared control states (controls first: base, then trial)

**Tab traversal** (`*/focus-<screen>-<size>-<theme>[-forced].{png,json}`):
- 7 screens: Today (composer), session controls, End sheet, Stats, History "Edit brew" sheet, Welcome, Settings.
- 4 configs each: 390×844 and 1440×900, light and dark. Plus forced colours at 390×844 light.
- That makes 35 traversals per build, with 4–30 stops each.
- At every stop the ring is measured from screenshot pixels on the central 40 % of each edge, at the band itself, 2 px outside it and 1.5 px inside the offset edge. The sheets (`focus-*.png`) show every stop at full size.

| Finding | BASE 4d36939 | TRIAL 3d91793 |
|---|---|---|
| Stops per screen (all 35 configs) | identical count | identical count |
| **TextField focus** (Today composer, Settings name, Welcome name, History edit): outline? | **no outline** on all 4 screens × 4 configs (ring = box-shadow) | outline on `.box`, 3 px, +3 px gap; ring vs outside **4.48–4.69 light, 8.58–9.49 dark** |
| **TextField focus in forced colours** | **NONE** (box-shadow dropped, no visible focus) | outline drawn in system colour, contrast 20–21 |
| **Segmented options** (Today brew length, Settings Preset/Theme/Motion/3D, Stats 30 days) | ring +3 px; vs outside 3.87 light / 6.98 dark, vs inside gap 3.83–3.87 / 6.91 | ring **+1 px**; vs outside 3.87 / 6.98 (same); vs inside gap **3.04–3.07 light** / 5.76–5.81 dark |
| **Selected segment / chip in forced colours** | selected segment: **no border**; selected chip: tick only, no ring (`BEFORE…/states-390x844-light-forced.png`) | segment thumb has a Highlight border; chip has a Highlight ring (`AFTER…/states-390x844-light-forced.png`) |
| Pressed vs hover, unselected segment (`states-*.json`) | **pressed = hover**: light `oklab(0.959 0.0039 0.0176)`, dark `oklab(0.317 0.028 −0.038)` | pressed `oklab(0.879 0.0087 0.037)` light / `oklab(0.381 0.033 −0.044)` dark ≠ hover; also 1 px sink |
| Nudges row, switch blocked: cursor rest/hover/press | `pointer` | `auto` |
| Disabled control reached by Tab (any screen) | none | none |
| Ring clipped by an overflow ancestor (any stop) | none | none |
| **Control size at rest** (w×h of every button, radio, switch, spinbutton, slider, input; 36 screen/config pairs) | n/a | **0 changed** (all identical to base; `LI-compare.txt`, "sizes at rest") |
| Toggle, slider, stepper, ListRow and Button rings | 3 px, same pixels | same (the `_track` class hash changed only) |

**Flags present on both builds, unchanged by G** (all in other owners' files):
- **Session controls over the scene:** "Ambience: Rain. Change" and "Turn sound on" have ring vs actual background **2.53–2.94 light** (3.36–3.37 dark). Identical on base. These are F's focus files.
- **Active nav item at 1440:** "Today" on Today and "Settings" on Settings. The inset ring (−2 px) is painted over by the absolutely positioned `.indicator`, giving 0 ring pixels and 2.75 contrast. Identical on base (`Shell.module.css` `.tab:focus-visible` / `.indicator`, F's file).
- **Skip link:** the ring's bottom edge reads as the pill colour on both builds (`Shell.module.css`, F's file).
- **"Change brew length", "Delete this brew", Welcome buttons:** the ring vs outside is 1.11 on one edge only, where the ring sits next to an orange surface. It is 4.5+ on the other edges. Same on base.
- **ListRow button rows (Export / Import / Reset):** the row divider overpaints the top 2 of 3 px of the −3 px inset ring. 1440: identical on both. 390: the sampled band lands on ring on base and on divider on the trial, which is sub-pixel position. Zoom `LI-z-trial-imp.png`: the ring top edge is present but about 1 px thick. G did not change the −3 px value.
- **Forced colours, both builds:** unselected chips, segments and the Pause button have no visible boundary. The muted volume slider track is not drawn.

**Pre-existing intermittent bug in G's file `ui/SegmentedControl.tsx`, seen on both builds** (`segment-thumb-rerun/`):
- The selected thumb (framer-motion `layoutId`) sometimes sticks **48 px below its option**: `transform: matrix(1,0,0,1,0,48)`. It was present at load and still there at 2.5 s and after a wheel scroll.
- The selected option then shows no thumb, and the cream thumb covers the bottom edge of its focus ring.
- In the rerun, base had it in 1 of 4 configs (1440 light, reduce) and the trial in 1 of 4 (1440 dark, reduce).
- In the full audits it appeared on the trial at 1440 light and on base at 1440 dark.
- Frame: `segment-thumb-rerun/base-1440x900-light-reduce-t2500.png`. Zooms: `LI-z-trial-seg.png` (trial) and `LI-z-base-seg.png` (normal).
- Not caused by G's diff; it reproduces on base.

**Hover, pressed and selected** (computed values plus crops; `*/states-<cfg>.png` and the `states-<cfg>/` folders):
- Chip pressed bg = hover bg on both builds, but pressed sinks 3 px. G did not change this.
- Session Pause rest ≠ hover on both builds.
- My Nudges-row locator read a constant background on both builds. The maker's claimed hover-fill removal is therefore shown by me only as cursor `pointer` → `auto`; the fill itself is **unproven by me**.
- My "theme unselected" probe in light configs actually hit the selected option ("Light", set by `?theme=light`). The dark configs are valid.

## 2. Settings persistence and reset (`*/persist.json`; disposable context; real clicks and keys)

Steps:
- Night, Deep, then Brew length ↑ (rhythm becomes `custom`, 55/10/20/3), Motion Reduced, 3D Low, Sounds off, ambience Forest, name "Robin". (Daily goal was already "A pot" for veteran, so it did not change.)
- Then reload.
- Then **Reset everything**: the row, then the "Start fresh?" sheet, then **Reset everything**.

| | BASE | TRIAL |
|---|---|---|
| After reload: stored `kettle:settings`, `html[data-theme/motion]`, radios, spinbuttons | all kept | all kept (theme dark, custom 55/10/20/3, motion reduce, scene low, muted true, ambient forest; `html` dark/reduce) |
| After reset, then reload | defaults: theme auto, classic 25/5/15/4, motion system, scene auto, muted false, rain, goal 30, name "", onboarded false; hash `#/welcome` | **identical** |
| Reset sheet text | "…your brews, warm streak, leaves…" | "…your brews, warm days, leaves, recipes and settings on this device. It can't be undone." |

Shortcuts are a static list (`SHORTCUTS` from `lib/shortcuts`), with no field in the settings store, so there is nothing to persist.

## 3. Copy honesty (code at trial; files are read-only to G)

| New line (`SettingsScreen.tsx`) | Code (quoted) | Finding |
|---|---|---|
| **Sounds on** (l.134): "The whistle, effects and ambience play while Kettle is open, in a tab or as the app, after your first tap. Closed, Kettle is silent. A phone's silent switch or lock screen can quiet it too." | `engine.ts:219-223`: `// Never create a context before the user has interacted (autoplay policy).` `if (… !hasActivation()) return;` · `engine.ts:157-160`: `if (!ctx \|\| ctx.state !== 'running' \|\| this.busy()) return; … if (hidden \|\| performance.now() - this.lastActivity > IDLE_SUSPEND_MS) { void ctx.suspend()` · `flow.ts:195`: `audio.play('complete');` on `timer:complete` · `sw.ts` has only `message` (l.54) and `notificationclick` (l.58) listeners; `grep pushManager\|'push'` in src: 0 | "after your first tap" and "Closed, Kettle is silent" match. "while Kettle is open, in a tab" depends on the page's JS running. **On iOS/iPadOS** a backgrounded tab or home-screen app is suspended, so a brew ending with another app in front is not heard (only the lock screen and silent switch are named). On desktop Chromium a hidden tab plays, possibly late (`store.ts:378`, `whileAway`). **On an iOS Safari tab the same screen contradicts itself:** `'Notification' in window` is false there (`notify.ts:26`), so Nudges shows the unchanged "This browser can't show notifications. With sound on, Kettle chimes while it's on screen." (`SettingsScreen.tsx:182`) under a Sounds line saying "in a tab". F's Welcome says "chimes while it's on screen" too (`welcome/steps.tsx:236, 241`). Not tested on hardware. |
| **Nudges on** (l.187): "On. When a brew or tea break ends while Kettle is open but out of sight, I'll nudge you. With Kettle closed, no nudge can come. A locked phone may hold the nudge until you're back." | `notify.ts:165-167`: `return opts.enabled && opts.status === 'granted' && !opts.pageVisible && !opts.otherTabVisible;` · `notify.ts:174`: `// timer:complete only fires in the one tab that completed the phase.` · `notify.ts:178-179`: on visible, `clearTimerNotifications()` | "open but out of sight" and "closed: no nudge" match. **"A locked phone may hold the nudge until you're back"** is carried over from base and is not what the code does. Nothing holds a nudge. If the page was frozen while away (iOS app, Android after a while), completion is detected on return with the page visible, `shouldNotify` is false, and **no nudge is ever shown**. A shown nudge is closed on return. |
| **Nudges off / default** (l.188-189): "…while Kettle is out of sight." / "…while Kettle is open but out of sight. Your browser will ask first." | as above; `notify.ts:39-57` asks from a gesture | Match. |
| **Keep awake** (l.233): "Stops your screen dimming while a brew is on screen." | `wakeLock.ts:19-20`: `return status === 'running' && keepAwake && visible;` (status is phase-agnostic: `types.ts:4` `'idle' \| 'running' \| 'paused'`) | "on screen" = `visible`, which matches. The lock is **released while a brew is paused** (still on screen) and **held during a running tea break**. |
| **Haptics** (l.240): "Little buzzes for key moments, on devices that can vibrate." | `haptics.ts:69-73`: `if (!getSettings().haptics) return; … typeof navigator.vibrate !== 'function') return; … visibilityState === 'hidden') return; … !ua.hasBeenActive) return;` | Matches; it hedges desktop `navigator.vibrate` without a motor. The unchanged unsupported line "This device can't vibrate." shows on iPhones (WebKit has no `navigator.vibrate`), whose hardware does vibrate. That line is pre-existing, in G's file. |

**Rendering:**
- In headless Chromium `Notification.permission` is `denied` even after `grantPermissions(['notifications'])` (`nudge-granted-attempt/`, `LI-nudge.log`).
- So **only the Blocked line renders** in any capture. The new On, Off and default Nudges lines are verified **in code only, not on screen**.
- Keep awake and Haptics render as quoted, on both sizes.

## 4. Warm-days wording in G's files

- **Base: 11 visible "streak" strings** in G's files:
  - `SettingsScreen.tsx:105`;
  - `DataSection.tsx:235`;
  - `Gallery.tsx:115, 191, 193, 497, 500, 527, 590, 637, 691`.
- **Trial: 0.** Remaining hits are identifiers only (`SettingsScreen.tsx:5, 40, 56`; `:56` renders "N days warm").
- **Rendered Settings `<main>` and body text** (`LI-full-*.log`, `[settings]` lines):
  - base: "Your warm streak only needs one brew a day" at all 16 size/theme/text configs;
  - trial: **none**.
- **Attributes:** on both builds, the only rendered `title`/`aria-*` with "streak" is **`title="Warm streak"` from `app/Rail.tsx:233`**, plus sr text "…warm streak" at `Rail.tsx:236`. That is F's file, not G's, and is still present at trial `3d91793`.
- **New strings against the glossary:**
  - "One finished brew makes a warm day. The goal is just for you."
  - Reset sheet: "…brews, warm days, leaves…"
  - Gallery (dev `#/kit`): "Tea Cozy used. The kettle stayed warm.", "A Tea Cozy keeps the kettle warm through one missed day." (verbatim glossary), "Warm days", "Days warm", "Warmest run", "Another warm day", "Keeps the kettle warm through one missed day", "…your brews, warm days and nook…".
  - None of them uses lose/break/don't-miss framing.

## 5. REFERENCE (K09) → BEFORE → AFTER, Settings top to bottom

Files:
- REFERENCE: `reference/K09-live-settings.jpg`.
- Full pages: `BEFORE-base-4d36939/settings/` and `AFTER-trial-3d91793/settings/`. Each folder has 16 PNGs: 390×844, 375×667, 844×390 and 1440×900 × light/dark × 100/200 %. They are full-page at DPR 1, not `isMobile`, so there is no stitching artefact.
- Side by side: `before-after/<name>-partNN.png`, BEFORE on the left and AFTER on the right, sliced at full size.

| Size | Page height BEFORE → AFTER (100 % / 200 %) |
|---|---|
| 390×844 | 4276 → 4335 (+59) / 9015 → 9250 (+235) |
| 375×667 | 4358 → 4436 (+78) / 9433 → 9707 (+274) |
| 844×390 | 3699 → 3718 (+19) / 5949 → 6066 (+117) |
| 1440×900 | 3739 → 3759 (+20) / 5840 → 5918 (+78) |

- **Top 1000 px:** pixel-identical at threshold 30 in the 3 configs checked (844×390 light 100, 390×844 dark 200, 1440×900 dark 200). The byte-level "first differing row" in `LI-compare.txt` is sub-threshold anti-aliasing.
- **Horizontal fit:** `scrollWidth ≤ clientWidth` everywhere, on both builds.
- **Frames I looked at:**
  - `settings-390x844-light-100-part01`: footer and Sounds 5 → 7 lines; no overlap.
  - `settings-375x667-dark-200-part02`.
  - `settings-1440x900-dark-100-part01`: Sounds 2 → 3 lines.
  - `settings-844x390-light-200-part03`.
  - Trial 1440 light top vs K09: same structure; the rail reads "23 days warm".
- **375×667 @200 %:** the Sounds description goes from **12 to 17 lines** in a column about 130 px wide. The row is roughly one viewport tall, and its switch sits mid-row, about 330 px below the "Sounds" label. On base the same pattern holds at 12 lines.
- **Visible differences** are copy only: the Daily goal footer, Sounds, Keep awake and Haptics. No control moved size (see section 1).

## 6. The maker's two `notice-strip.spec.ts` failures at 200 %

I ran exactly `-g "\((375×667 dark 200 %|844×390 light 200 %)\)$"` (2 tests, `--list` checked) once on each build. The spec and config are byte-identical in both worktrees.

| Build | 375×667 dark 200 % | 844×390 light 200 % | Log |
|---|---|---|---|
| TRIAL :5523 (12:38–12:41) | ✓ 1.9 m | ✓ 1.1 m | `notice-strip/LI-ns-trial.log` |
| BASE :5478 (13:00–13:03) | ✓ 2.0 m | ✓ 1.1 m | `notice-strip/LI-ns-base.log` |

- The trial did not fail, so I did not investigate a cause.
- The maker's runs took 1.6 m and 4.0 m (= the 240 s timeout) while F held 2 slots.
- Mine ran with LEAD/S/F jobs also holding slots.

## Unproven / not done

- **The new Nudges On/Off/default lines on screen.** Headless Chromium keeps the permission `denied`. Verified in code only.
- **Device behaviour.** No claims were tested on iOS or Android hardware: background audio, frozen-page nudges, `vibrate`, wake lock. Section 3 reasons from the code plus known platform behaviour.
- **Keyboard traversal on a touch context** (`isMobile`/`hasTouch`). My 390×844 runs used a desktop context at phone size.
- **Forced colours** only at 390×844 light. There is no forced-colours dark run, and no 1440 forced run.
- **The Nudges-row hover/press fill change.** I proved only the cursor change (see section 1).
- **Disabled/inert controls in the kit section** (`#/kit` "Inert controls") were not exercised. The disabled-in-Tab-order check covers only states on the 7 screens: the blocked Nudges switch, and the volume sliders while muted.
- **The full chromium suite and the specs the maker did not run** (integrity, summary-notice, toast-room, statusbar, w2-summary, w2-room, chai3d) were not run by me.
- **How often the stuck segment thumb occurs.** Each build: 1 of 4 configs in the rerun and 1 of 4 Today configs in the full audit. Its trigger is not isolated.
