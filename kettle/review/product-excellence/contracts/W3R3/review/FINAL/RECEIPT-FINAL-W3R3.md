# RECEIPT-FINAL-W3R3: Lane RF3, full regression on the merged tree, raw evidence

Raw evidence only: counts, error lines and signatures, no verdicts. Times are UTC, 2026-10-20. Task received 04:02, hard stop 08:00, last run finished 04:57. `*.log` is git-ignored, so logs are saved as `.log.txt`. No product or test edits, no pushes. Only my own PIDs were started; none is left (section 10).

## 0. What was tested

| | |
|---|---|
| Tree | integration `7e4056d`, app merge `041dd25`, kettle/src `731e565`, worktree `/home/user/wt/w6-int` (`git status` empty at start and at end) |
| Dev | **:5560**, `verify.sh /home/user/wt/w6-int 5560` at 04:02: "serves 7e4056d (src 731e565): VERIFIED" |
| Preview | **:5570**, `/tmp/rv7-servers/dist-w6int`, files written **04:02:08** (the task note said about 05:12; the file times say 04:02) |
| Control | **:5583** dev, `/home/user/wt/w9base`, `f034205` (src `5f504d4`): VERIFIED |
| Gate | every Playwright and browser script through `slots.py run --lane RF3` (full run `--n 2`, the rest `--n 1`; at most 3 held, `status` shows `held 0` at the end). Load average 9 to 15 during the long runs (full, notice-strip, load, pwa, 2-tab, console ran beside each other, as in the W3R2 receipt) |
| Machine clock | **04:00 to 04:57 UTC, so the browser's local hour is before 10:00.** This matters for one failure (section 6) |
| Scripts | `scripts/`: the W3R2 `RF-*` scripts adapted to the W3R3 paths and lane `RF3` (`RF-common.sh`, `RF-basics.sh`, `RF-full.sh`, `RF-pwa*.sh`, `RF-twotab.sh`, `RF-2tab.mjs` unchanged, sha256 prefix `cc66cf8be408cdd4`), plus new `RF-notice.sh`, `RF-load.sh`, `RF3-console.{sh,mjs}`, `RF3-offline.{sh,mjs}`, `RF3-rerun*.sh`, `RF3-rep-load.sh` |
| Test list | chromium **289 tests in 21 files** (264 in 20 files without `notice-strip`); all projects **320** (chromium 289, timer-harness 14, timer-app 14, pwa 3): same counts as W3R2 |

## 1. Basics (`runs/tsc.log.txt`, `vitest.log.txt`, `build.log.txt`)

| Command | Result |
|---|---|
| `npx tsc --noEmit -p .` | exit 0, no output (2 s) |
| `npx vitest run` | exit 0; **34 files, 342/342 passed** (6 s) |
| `npx vite build --config .tmp/w2.vite.config.ts --outDir .tmp/RF3-dist-build --emptyOutDir` | exit 0, precache 119 entries (3076.76 KiB) |

**Build against the :5570 preview** (`runs/dist-*`): all-file lists identical (152 each); hashed `.js`/`.css` lists identical (45 each); sha256 of every non-sourcemap file identical (120 each); `index.html` names the same entry chunk `assets/index-DRclqLMb.js` in both; the three shipped images are `chai-reading-CMLk2MAx.webp`, `chai-sipping-DwyPxpxw.webp`, `chai-cheering-ZKPXRG7z.webp` in both. The `.map` file list is the same.

## 2. Full chromium project on :5560, without `notice-strip` (`runs/full.log.txt`, `json/full.json`)

`--project=chromium --workers=2`, 04:03:42 to 04:42:37 (38.9 min). **264 announced: 237 passed, 2 failed, 25 skipped (`w3-notices-load`, gated on `W3_LOAD=1`), 0 flaky.**

| Spec file | Passed | Failed | Skipped |
|---|---|---|---|
| a11y | 11 | 0 | 0 |
| break-reach | 17 | 0 | 0 |
| chai3d | 10 | 0 | 0 |
| integrity | 23 | **2** | 0 |
| statusbar | 9 | 0 | 0 |
| summary-notice | 14 | 0 | 0 |
| toast-room | 14 | 0 | 0 |
| w2-firstvisit | 6 | 0 | 0 |
| w2-home | 18 | 0 | 0 |
| w2-room | 7 | 0 | 0 |
| w2-summary | 18 | 0 | 0 |
| w3-history-focus-scroll | 14 | 0 | 0 |
| w3-intention-race | 2 | 0 | 0 |
| w3-notices-idle | 12 | 0 | 0 |
| w3-notices-load | 0 | 0 | 25 |
| w3-notices | 9 | 0 | 0 |
| w3-settings | 10 | 0 | 0 |
| w3-stats | 30 | 0 | 0 |
| w3r2-stale-tab | 5 | 0 | 0 |
| whistle | 8 | 0 | 0 |
| **total** | **237** | **2** | **25** |

`w3-settings:39` and `chai3d:197` passed. The two failures are in section 6.

## 3. `notice-strip` whole (`runs/notice-strip.log.txt`, `json/notice-strip.json`)

`--workers=1`, 04:03:44 to 04:32:35 (28.8 min): **25 passed, 0 failed, 0 skipped.**

## 4. `w3-notices-load` with `W3_LOAD=1` (`runs/w3-notices-load.log.txt`, `json/w3-notices-load.json`)

`--workers=1`, 04:32:43 to 04:56:05 (23.3 min): **24 passed, 1 failed** (844×390 dark 200 %, `#0`). Classification in section 6.

## 5. timer-harness, timer-app, pwa (`runs/timer-pwa.log.txt`, `json/timer-pwa.json`)

`KETTLE_PORT=5560 KETTLE_PWA_PORT=5495 --workers=1`, 04:42:46 to 04:46:12 (3.4 min): **29 passed, 2 skipped, 0 failed**. `timer-harness` 14 passed; `timer-app` 12 passed, 2 skipped (`timer.spec.ts:305`, `:449`, by design); `pwa` 3 passed. Same as W3R2.

**PWA port.** 5495 is the port the W3R2 receipt used. Inside the gated job before the run: curl to 5495 and 5193 got no answer, and `/proc/net/tcp` showed 0 listeners on 5495. After the run I killed my own leftover by explicit PID (21946) and the port was free again ("port 5495 free after cleanup"; confirmed again at the end, section 10).

## 6. Failures (3 in all): reruns and classification

First error lines are from `json/full.json`, `runs/w3-notices-load.log.txt` and the rerun logs. Traces and error contexts are in `rerun/`.

### F1 `integrity.spec.ts:543` I02 "End early after 12 active minutes (with a pause)"
- **First error (full run, worker 1, 18.0 s):** `expect(locator).toBeVisible() failed` / `Locator: locator('main').getByText('Saved 12 minutes of focus')` / `Expected: visible` / `Timeout: 10000ms` / `Error: element(s) not found`, at `integrity.spec.ts:558`.
- **Rerun once on :5560** (`runs/rerun-F1-543.log.txt`): **fails again**, the same lines.
- **Run on :5583** (pre-round `f034205`, `runs/rerun-F1-543-5583.log.txt`): **fails**, the same lines at :558.
- **Page at failure** (`rerun/F1-543-error-context.md`): Today's notice list in `main` holds only "New badge: Nook Builder". The live region (outside `main`) holds, in order: "Recipe done: Name what you're brewing · +10 leaves", "**Recipe done: Start a brew before 10 am · +15 leaves**", "New badge: Nook Builder", "Cozy level 2!", "Saved 12 minutes of focus". "Saved 12 minutes of focus" exists on the page but is not in `main`'s strip.
- **Cause visible in the code:** the recipe "Start a brew before 10 am" (`src/progress/quests.ts:59`, `closesAtHour: 10`) completes when the brew starts at a local hour before 10. The machine clock was 04:xx UTC, so the browser's local time is before 10:00 and the extra notices are produced.
- **Time-zone control** (same test, same :5560, only `TZ` set for the Playwright process): `TZ=America/Los_Angeles` (21:44 local) **pass** (16.9 s); `TZ=Asia/Tokyo` (13:44 local) **pass** (17.4 s). Logs `runs/rerun-F1-543-tz{LA,Tokyo}.log.txt`.
- **Not a known W3R2 flake signature.** It is a new signature, but it reproduces on the pre-round control and depends on the local hour. The W3R2 runs were at 21:25 to 00:30, outside that window.

### F2 `integrity.spec.ts:1048` I03 storage-full banner (phone 390×844)
- **First error (full run, worker 2, 44.8 s):** `Error: every failed save has gone through` / `- Array []` / `+ Array [ "kettle:home:lastVisit" ]` / `Timeout 10000ms exceeded while waiting on the predicate`.
- **Matches the known W3R2 signature** (`integrity:1048` I03, Today's lazy chunk, `lastVisit` unsaved).
- **Rerun once on :5560** (`-g 'phone 390'`, `runs/rerun-F2-i03-phone390.log.txt`): **pass** (33.9 s). No :5583 run needed.

### F3 `w3-notices-load.spec.ts` "no notice overlaps ... (844×390 dark 200 %) #0"
- **First error (1.5 s into the test, load about 13):** `Error: getByRole('textbox', { name: /What are you brewing/ }) still on top as the tap is aimed` / `expect(received).not.toBeNull()` / `Received: null`, at `w3-notices-load.spec.ts:322` (`press`), called from :372.
- **Rerun once on :5560** (`W3_LOAD=1`, `runs/rerun-L1-844dark200.log.txt`): **pass** (54.2 s). Extra, quiet: ×3 (`runs/rep-L1-844dark200x3.log.txt`): **3/3 pass** (53.5 to 55.2 s).
- **Not a known W3R2 flake signature** (not in the W3R2 list). It failed once, beside the pwa, 2-tab and console jobs, and has not repeated in 4 later runs.

## 7. 2-tab check with real clicks, :5560, R2's cases (a) to (g), 3 iterations each (`runs/manual-2tab-rf3-5560.log.txt`, `manual/rf3-5560-*.json`)

`scripts/RF-2tab.mjs` unchanged (sha256 prefix `cc66cf8be408cdd4`), one gate slot, 04:45 to 04:51. **Cases g, e, f, a, b, c, d: each pass 3/3, so 21 of 21 iterations; page errors 0 in all.** (More than the two requested; the template used 3.)

## 8. Console check on the preview :5570 (`console/console-preview5570-{desktop,phone}.json`, plus dev `console-dev5560-desktop.json`)

`scripts/RF3-console.mjs` (the W3R2 script with a probe of every `[data-pose]` image and of every Chai image response). Steps by real input: Today; start a brew; Pause, Resume, Add 5 minutes; End session (sheet); a second brew finished to the summary; Tea time; Stats (scrolled); Settings. 7 of 7 steps ok in all three runs.

| Run | console messages | `error` | `warning` | pageerror | failed requests | HTTP >= 400 |
|---|---|---|---|---|---|---|
| preview 1280×800 | 1 (info: `[chai3d] model ready`) | **0** | **0** | 0 | 0 | 0 |
| preview 390×844 touch | 1 (the same info) | **0** | **0** | 0 | 0 | 0 |
| dev :5560 1280×800 (extra) | 4 (2 debug `[vite]`, 2 info) | 0 | 0 | 0 | 0 | 0 |

**Chai images on the preview:** every request for a Chai webp answered 200 (served by the service worker after its first activation), with no 404 and no failed request. The poses on screen, each image `complete` with a non-zero natural size: **reading** (`chai-reading-CMLk2MAx.webp`, 389×609) on Focus with the brew running; **cheering** (`chai-cheering-ZKPXRG7z.webp`, 390×535) on the summary `#/done`; **sipping** (`chai-sipping-DwyPxpxw.webp`, 378×614) on the tea break and again on Today and in Settings; Stats showed `chai-happy`. Same on dev (`/src/art/chai/chai-{reading,sipping,cheering}.webp`, 200).

## 9. Offline on the preview (`console/offline-preview5570.json`, `runs/offline-preview5570.log.txt`)

`scripts/RF3-offline.mjs`: the service worker was `activated` and controlling the page; the cache holds `chai-reading-CMLk2MAx.webp`, `chai-sipping-DwyPxpxw.webp` and `chai-cheering-ZKPXRG7z.webp`. Then `context.setOffline(true)` (`navigator.onLine` false):
- `fetch()` of the three URLs: **200, `image/webp`, 19,178 / 19,968 / 19,078 bytes**; each decodes as an image (`imgOk` true).
- Reload offline: the app boots. Brew started and ended by real clicks, offline: **reading, cheering and sipping all rendered** (`ok=true`), their responses `fromServiceWorker` 200. Console: 0 error, 0 warning, 0 pageerror, 0 failed request, 0 HTTP >= 400 (only info `[chai3d] model ready`).
- **Earlier runs of this check, kept for honesty** (`console/offline-preview5570-run*`): run 1 had a cache-busting query on one probe `Image` (`?off=...`), which is not in the cache, so it logged 3 `ERR_INTERNET_DISCONNECTED` errors (my probe's, not the app's); I removed that probe. Runs 2 and 3 had the final step's Tea time click time out in my script (after an extra 90 s clock move I had added before finishing); I removed that line to follow the console script's flow. Run 4 is the one above (7 of 7 steps ok).

## 10. Cleanup

At the end: `slots.py status` shows `held 0`; no `playwright`, `RF3`, `slots.py`, chromium or `RF-2tab` process of mine is running. The only listeners are the servers that were there at the start (:5560, :5570, :5583; none started by me). **Port 5495 is free** (curl: no answer). The worktree `w6-int` has `git status` empty. Nothing was killed except PID 21946 (the pwa spec's leftover preview, by explicit PID).
