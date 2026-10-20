# C2-READY: W3R3, new 2D Chai masters (reading, sipping, cheering)

Branch `pe/w3r3-chai-2d` (worktree `/home/user/wt/w9c`), base `f034205`. Stages are appended as they are finished.

## 1. Inventory (written before any change to the app tree)

### 1a. Where the three images are defined, imported and sized

| # | file:line | what |
|---|---|---|
| 1 | `kettle/src/art/chai/chai-reading.webp` (20,900 B, 311x487), `chai-sipping.webp` (19,950 B, 302x491), `chai-cheering.webp` (20,626 B, 312x428) | the shipped files; 61,476 B together |
| 2 | `kettle/src/art/PaintedChai.tsx:14-16` | the only three imports (Vite-hashed URLs) |
| 3 | `kettle/src/art/PaintedChai.tsx:25` | `PaintedPose` union (`reading`, `sipping`, `cheering`) |
| 4 | `kettle/src/art/PaintedChai.tsx:28-31` | `PAINTED`: logical size per pose, 311x487 / 302x491 / 312x428 (`w`, `h` in sheet px). This is the layout footprint; every place below derives from it. |
| 5 | `kettle/src/art/PaintedChai.tsx:36-47` | `SHEET_REF_H` (500) and `SHEET_MARGIN` (4); `paintedBox(pose,size)` = `PAINTED.w|h * size/500` |
| 6 | `kettle/src/art/PaintedChai.tsx:62-82` | `PaintedChai`: a `span` of `paintedBox` size (`transform-origin: 50% 100%`), one `<img width height>` at 100% x 100% |
| 7 | `kettle/src/art/painted.module.css:1-14` | `.pose` (inline-block, `line-height:0`) and `.img` (`display:block; width/height:100%`; no `object-fit`, so the file is stretched to the box) |
| 8 | `kettle/src/art/painted.module.css:16-30` | `.live` breathing (existing, untouched; reduced motion turns it off) |
| 9 | `kettle/src/art/index.ts:3-4` | re-exports `PAINTED`, `paintedBox`, `SHEET_REF_H`, `SHEET_MARGIN` |
| 10 | `kettle/src/art/Mascot.tsx:599-611` | `PAINTED_POSE`: `focus` -> `reading` (602), `sip` -> `sipping` (604), `cheer` -> `cheering` (605) |
| 11 | `kettle/src/art/Mascot.tsx:617-622` | `Mascot`: square `size` x `size` box, `inline-flex`, `align-items:flex-end`, centred; feet sit on the box floor |
| 12 | `kettle/src/screens/focus/FocusScreen.tsx:55-61` | Stage pose map: `focus` -> `reading` (56), `whistle` -> `cheering` (57), `summary` -> `cheering` (58), `break` -> `sipping` (59). Passed at `:293`. |
| 13 | `kettle/src/screens/focus/stage/Stage.tsx:48,54-58,105-107` | `CHAI_SIZE = 186`; `chaiW/chaiH/chaiDrop` from `PAINTED[pose]`, `SHEET_REF_H`, `SHEET_MARGIN`; `<PaintedChai size={186} faceBelow={0}>` |
| 14 | `kettle/src/screens/focus/stage/Stage.module.css:4,155-166,209-214` | `--u: min(0.25cqw, 0.3cqh, 1.6px)`; `.chai` box = `--chai-w/h * --u`, bottom at counter line + 4u (the 4 sheet-px margin); `.cShadow` ground shadow in CSS (width `chai-w * 0.78`, theme-aware ink, `[data-night]` darker). `img` forced 100% x 100% (`:163-166`). |
| 15 | `kettle/src/screens/done/Summary.tsx:562-566` | reads the stage figure box via `[data-stage-figure]` (the Chai wrapper), so it depends on the same box |

No other module imports the three files. No `<picture>`, `srcset`, CSS `url()` or `object-fit` refers to them. Docs/tests: `kettle/art-src/chai/README.md:14-16` (table), `kettle/docs/areas/art.md:8-11`, `kettle/docs/areas/core-loop.md:116`; tests: none assert on these files or their sizes (`tests/w2-summary.spec.ts:157` only reads `[data-pose]` in the focus view).

PWA precache: `kettle/vite.config.ts:44` `globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2,glb}']`. The three WebPs are precached by hash today; same file names and format keep that unchanged.

### 1b. Every screen and state where each pose shows (pose mapping must not change)

| Pose | Surface | file:line | State / condition | Size (CSS px, `Mascot size` or `CHAI_SIZE`) |
|---|---|---|---|---|
| reading | Focus stage | `FocusScreen.tsx:56,293` -> `Stage.tsx:106` | focus view: running and paused | 186 units x `--u` (<= 1.6 px) |
| reading | Home hero | `home/chai.ts:87` -> `Hero.tsx:38` | a brew is running/paused (`mood: live`, `pose: focus`) | 76 landscape / 152 wide / 88 narrow / 112 default |
| reading | Kit gallery | `art/Gallery.tsx:17,72,81,105-106` | `#/kit?part=art&view=chai` (all poses) and `view=pose&pose=focus&size=N` | `size` param / `sz` |
| sipping | Focus stage | `FocusScreen.tsx:59,293` | tea break | 186 units |
| sipping | Home hero | `home/chai.ts:90,103,144,147,156,162` -> `Hero.tsx:38` | break live; evening: goal met, progress, hello, idle | 76 / 152 / 88 / 112 |
| sipping | Settings, About | `SettingsScreen.tsx:329` | static `pose="sip"` | 72 |
| sipping | Welcome | `WelcomeScreen.tsx:288` -> `:206` | sound step | 148 wide / 84 compact / 108 |
| sipping | Kit gallery | `art/Gallery.tsx:17,72,81,105-106` | as above, `pose=sip` | `size` param / `sz` |
| cheering | Focus stage | `FocusScreen.tsx:57,58,293` | whistle (hop animation) and summary | 186 units |
| cheering | Welcome | `WelcomeScreen.tsx:291,294` -> `:206` | notify granted; ready step | ready: 200 wide / 120 compact / 168; notify: 148 / 84 / 108 |
| cheering | Kit gallery | `art/Gallery.tsx:17,72,81,105-106` | as above, `pose=cheer` | `size` param / `sz` |

Not reaching these three images: `StatsScreen.tsx:46` (`proud|think|sleep|idle`), `EndSheet/History/DataSection` (`concerned`), `Recipes/StatusBar/EmptyState` (`peek`), `Nook`/`Fallback.tsx:23` (vector `ChaiArt` and 3D, out of scope).

### 1c. Current display footprint rule (the same for every place)

Footprint of a place = `span.pose` box = `PAINTED[pose].w|h * size / 500` CSS px, `<img>` 100% x 100% (no `object-fit`; the box is the contract), bottom-aligned (`Mascot`: `align-items:flex-end`; Stage: bottom at the counter line + 4u). The art inside the box is a tight crop with a 4 sheet-px transparent margin. Measured ink boxes of the files being replaced (alpha > 8, sheet px): reading x 5..306, y 4..483; sipping x 4..298, y 5..487; cheering x 4..308, y 5..424.

Numbers per place, before vs after, are in section 4.
