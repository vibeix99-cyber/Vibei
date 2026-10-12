## 3. Hint

All on the production previews. `veteran` seed, real tap on the Nook tab, 3 s settle, hint read from the DOM (`p` inside `section[aria-label="The room"]`), screenshot, then a real tap on the stage (pointerdown dismisses), then reload and back to the Nook.

### 3a. Control reproduces the false drag hint (390×844 light 100 %, control :5330, this session)
- 3D off (`scene:'off'`): hint text **"Drag to look around · tap things"**, eye icon, `data-static` absent, flags after the tap `kettle:nook-hint-seen=1`; the room is the static drawing (no canvas).
- No WebGL (init script makes `getContext('webgl*')` return null): the same text and eye icon over the same static drawing.
- At **375×667 with 200 % text** the control's hint is one line 440 px wide at x = −32.5…407.5 inside a 343 px stage: **it runs past both edges of the stage and past the viewport** (`insideStage:false`).

### 3b. Trial
| State | Control | Trial |
|---|---|---|
| 3D off, 390×844 light | "Drag to look around · tap things", eye icon (svg 424 chars), 1 line | **"A drawing of your room"**, nook icon (svg 600 chars, `data-static="true"`), 1 line, inside the stage |
| No WebGL, 390×844 light | same drag text, eye | **"A drawing of your room"**, nook icon, 1 line |
| 3D on (live), 390×844 light, after the engine is ready | "Drag to look around · tap things", eye (424 chars, same path data) | **identical**: same text, same icon svg path, same pill |
| Dismissal, 3D on (real drag on the canvas) | hint gone, `kettle:nook-hint-seen=1`, not shown after reload | **identical** (hint gone, `kettle:nook-hint-seen=1`, `kettle:nook-static-hint-seen` null, not shown after reload) |
| Dismissal, 3D off / no WebGL (real tap on the stage) | gone, `kettle:nook-hint-seen=1` | gone, **`kettle:nook-static-hint-seen=1`** (the 3D flag stays null); not shown after reload |
| 375×667 @ 200 %, 3D off | one line, **overflows the stage and viewport** | **"A drawing of your room" on 2 lines, inside the stage** (pill 315×90 css px at x 30…345 in the 343 px-wide stage; `white-space: normal`); same at no WebGL. At this size the two-line pill covers the lower part of the drawing (the table, rug and cat area; `runs/sheets/hint-375x667-t200-ctrl-vs-trial.jpg`). Dismissal sets `kettle:nook-static-hint-seen=1`, not shown after reload |
- Nook stage in 3D off: the screenshots of control and trial are pixel-identical outside the hint pill (differing pixels > 8/255 lie in x 72–317, y 377–408 css px, the pill), i.e. the static drawing and its items are unchanged (`runs/sheets/` `ctrl-390x844-nook-static-nowebgl-live3d-unlock.jpg`; trial frames in `runs/room2/trial/390x844-light-t100/`).
- In the 3D-on Nook the **control and trial hints are the same node text and icon**. While three.js loads, the static room shows with the 3D hint by design (not exercised separately).
- Not run: the 3D-on hint at 375×667 @ 200 %; the 844×390 hint wrap at 200 % (queued behind other lanes; see the run log).

## 4. Preserve

- **Record-player unlock (`celebrate` seed, PRESERVE 8), 390×844 light:** tap brew, `finish()`, summary. Control vs trial **settled frames (4.5 s after the summary opens) are pixel-identical**: mean absolute difference 0.0 over the whole frame, over the top 40 % (live room + kettle + Chai) and over the bottom 60 % (the card with the record-player drawing). The backdrop in both is the live engine (`data-scene-ready=true`, canvas), no still, no layers. The unlock card passes its own `still` (`Summary.tsx:327`) so `WindowStill` is not reached by this path (code read). The same stages occur in the same order in both (Focus, "0:00 Tea's ready!" whistle with steam and sparkles, summary with the "Record player is in your nook" card; sampled frames: `runs/sheets/unlock-sampled-frames-ctrl.jpg` and `-trial.jpg`; the raw screencast files, 2 MB each, are not kept). **Partly covered:** the finer *drawing-then-close-up* sequence inside the card was not resolved: the screencast delivered 24 frames (control) and 10 (trial) under load, so I cannot say frame by frame that the sequence is unchanged; I can say the end state and the order of stages are. Other configurations of the unlock: not run.
- **Static Nook still shows every earned item:** the static room frames (control vs trial, 390×844 light 3D off) differ only inside the hint pill (above), so the drawing and the items in it are unchanged and complete as before ("10 of 14 cozy things" in both). 375×667 @200 % trial frame: the drawing shows the same items as the control; the pill covers its lower part (see above).
- **3D Nook drag and tap:** real CDP touch drag across the canvas at 390×844: the stage frame changes by a mean absolute 32.4/255 on the trial and 32.6/255 on the control (the camera moves in both); the hint dismisses in both. A grid of real taps on the canvas opens item story cards on both: **control** opened Paper lantern, Trailing pothos; **trial** opened Paper lantern, Trailing pothos, Tea set, Knitted blanket (the tap sequence is not identical between the two because the camera ends the drag at slightly different angles, so the same fractions hit different objects; the list of stories is in `room2-meta.json` `r.live.taps`). I did not demonstrate identical hit-testing at a fixed camera.
- **Reserved media space and layout shift:** the backdrop host rect equals between control off, trial off and live at all 12 configurations (`[x,y,w,h]` e.g. 390×844: −2,−2,390,328; 375×667: −2,−2,375,223; 844×390: 10,10,480,261; 1440×900: 22,22,846,698). The layers are an absolutely positioned `<svg>` inside the existing host (code read: `position:absolute; inset:0`). CLS values in §1 and §2.

## 5. The 375×667 question ("the room behind Chai disappears")

Path (both servers, preview, 375×667 @2 touch, light, 100 %, frozen clock, fresh context per run): `veteran` → real tap on "Put the kettle on" → 4.5 s (reference Focus frame) → `finish()` → wait for `#/done` → capture at **1.5 s, 4.5 s and 10 s** after the summary opens. Three runs each. Per sample: viewport screenshot, backdrop-only screenshot, DOM (host `data-scene-ready`, canvas size, still `img`, layers).

| Server | Run | 1.5 s | 4.5 s | 10 s | Backdrop DOM at every sample | Backdrop-only mean abs diff vs the same run's Focus frame |
|---|---|---|---|---|---|---|
| control :5330 | 1 / 2 / 3 | room (top-fifth colour spread 30.0 / 34.5 / 34.5) | room (30.8 ×3) | room (30.8 ×3) | `ready=true`, canvas 468×279, no still | **0.0** at all 9 samples |
| trial :5350 | 1 / 2 / 3 | room (34.5 ×3) | room (30.8 ×3) | room (30.8 ×3) | `ready=true`, canvas 468×279, no still, 0 layers | **0.0** at all 9 samples |

- **Facts: the room behind Chai was never blank in 18 samples (3 runs × 3 samples × 2 servers).** The backdrop-only frame is identical to the Focus frame in every sample.
- **The probe's sensitivity to a known blank:** applied to the audit's raw frame (`scratchpad/aud2/int/375x667-light/07-summary.png`, the plain sky gradient behind Chai) the same top-fifth colour spread reads **23.7** (vs 30.0–34.5 for the room on my frames; the audit's `05-end-sheet` 17.4, `06-whistle` 34.2). The blank therefore separates from the room on this metric; see `runs/sheets/p375-audit-blank-frame-vs-ctrl.jpg`. **The defect itself did not reproduce on the control** in these runs (as N also reports), so these zeros do not show that the trial fixes anything for that report; they show it was absent on both.
- Not run: the audit's longer path (pause/resume/End sheet/whistle), CPU throttling, `chrome://gpucrash`, dark theme, 200 % text for this question.

## 6. Budget

- **Size of `src/scene/stills/items/`** (trial worktree): 40 files, **391,542 bytes** (`du -sb`, and the sum of file sizes) = expected. All 40 are referenced by `items.json` (96 state→file entries, no orphan, none missing). `git diff 90a11e5..HEAD` touches **0** of the 12 base `window-*.webp` stills.
- **Build:** production build `/tmp/rv7-servers/dist-w2t-n` vs control `dist-w2base`: 36 of the 40 layer files are emitted as hashed assets (380,188 B); the **4 shelf files (11,354 B) are under Vite's 4 KB inline limit and are inlined as `data:image/webp` in `assets/scene-*.js`**, which is part of the eager graph (a dependency of the Home, Focus and Nook screen chunks and of `index`). That chunk grows 8,786 → 33,087 B raw, **3,797 → 17,304 B gzip (+13.5 KB gzip)**, loaded with the Home screen (the manifest JSON is in it too). Total JS gzip across `assets/*.js`: 458,961 → 473,818 B. Net: see below for what the browser requested.
{{NET}}
- **Service worker precache (from the built `sw.js` and `vite.config.ts`):** `injectManifest.globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}']`, `maximumFileSizeToCacheInBytes: 6 MB`; the manifest entries are `{revision:null,url:'assets/<hash>.webp'}`. Control `sw.js`: 80 entries, **2,505.3 KiB**; trial: 116 entries, **2,900.8 KiB** (+36 entries, +395.5 KiB: the 36 emitted layer files 380,188 B + the +24 KB `scene` chunk). The glob is not changed by N; the layers are picked up by the existing `webp` pattern, so **all 36 emitted layer files are precached at service-worker install, for every user, whether or not 3D is on and whether or not they own the items** (workbox precache fetches the whole manifest at install; I read this from the code and the built manifest and did not run an install). I ran with `serviceWorkers:'block'`, so no run exercised the offline behaviour of the layers.

## Not run / partial

- **Partial, check 1:** lighting states other than day-rain and night-rain; the `high`-tier live comparison exists for night-rain at 390×844 only (day-rain HQ, morning-clear, dusk-snow HQ jobs were queued and withdrawn for time). Items not visible in the window (cushion, blanket, painting, lantern) were not isolated one by one in the live engine. The matrix used the production preview only; the dev servers were not used for pixel checks (the dev/debug API path on :5340 was only used for the optional net probe, see the run log).
- **Partial, check 2:** loading measured at 4 light/100 % configurations; dark and 200 % configurations not run; the handover distance metric is indicative (sparse screencast); no throttled-CPU or slow-network run, so how long the "items over plain sky" interval lasts on real devices is not measured.
- **Partial, check 3:** the 3D-on hint and its dismissal at 390×844 light only; wrapping at 375×667 @ 200 % was measured for 3D off and no WebGL (control vs trial, §3b); 844×390 @ 200 % and 390×844 @ 200 % not run.
- **Partial, check 4:** unlock frame-by-frame sequence (see §4); unlock at other configurations; fixed-camera hit-test comparison.
- **Not run:** N's own probes; the maker's test suites; the audit's pause/resume/End path at 375×667; the offline/SW install behaviour.

## Run log (per run: URL, port, revision, probe sha256 prefix, input, result)

Probe shas (full list `runs/probes-mine.sha256`): `backdrop.mjs` 1c847cb4a2416696, `common.mjs` dc8d81b84e13d3b6, `room2.mjs` b0531d43dc849dd6, `p375.mjs` 9b949ce4b738f228, `net.mjs` ed7f54fdee59a110, `analyze.py` a07e525ce47b664f, `analyze3.py` a7010732df1b33b7, `handover.py` a5e5f4a38a7e3300, `p375_analyze.py` ffd621b4fafe5c88, `unlock_cmp.py` 6953882d159d70d5 (these are the final shas; earlier invocations ran earlier revisions of `backdrop.mjs`/`room2.mjs`/`common.mjs` as disclosed in §0).

| Run | URL · port · revision | Probe | Input | Result |
|---|---|---|---|---|
| backdrop `ctrl` × 12 configs (390×844@3, 375×667@2, 844×390@3, 1440×900@2 × light/dark × 100 %; 375×667 and 844×390 also 200 %) | http://127.0.0.1:5330 · `90a11e5` preview | `backdrop.mjs` (groups `off`,`live`; `loading` at the 4 light 100 % configs) | seed `veteran`, `scene:off` + reload, real tap/click on brew, capture 4 s; scene auto, real tap, engine ready + 4 s | 0 layers at 12/12 (3D off); live engine at 12/12; 0 errors; `runs/backdrop/ctrl/` |
| backdrop `trial` × 12 (same) | http://127.0.0.1:5350 · `2acc218` preview | same | same | 5 layers at 12/12; live engine at 12/12; 0 errors; `runs/backdrop/trial/` |
| backdrop `trialHQ-night-rain` | :5350 · `2acc218` | `backdrop.mjs --extra &nookq=high --nolayers 1` | 390×844 dark; **its `off` group is invalid** (`nookq=high` forces the live tier over `scene:off`), only its `live` frame is used | live-HQ night frame for §1 |
| `analysis` | scratch | `analyze.py`, `analyze3.py`, `handover.py`, `table.py` | — | `runs/analysis/` |
| room2 `ctrl` 390×844 light 100 | :5330 · `90a11e5` | `room2.mjs` (static, nowebgl, live, unlock) | real tap Nook tab, tap stage, CDP touch drag, tap grid 5×4; unlock path | §3, §4 (a first control invocation timed out in `live`; the second, kept, ran clean) |
| room2 `trial` 390×844 light 100 | :5350 · `2acc218` | same | same | §3, §4 |
| room2 `ctrl` / `trial` 375×667 light 200 | :5330 / :5350 | `room2.mjs --groups static,nowebgl` | same | §3 wrap |
| p375 `ctrl` ×3, `trial` ×3 | :5330 / :5350 | `p375.mjs --runs 3` | tap brew, `finish()`, summary samples 1.5/4.5/10 s | §5 |
| net `trial`, `ctrl` | :5350 / :5330 | `net.mjs` | Home idle 6 s, brew | §6 (see Net) |
