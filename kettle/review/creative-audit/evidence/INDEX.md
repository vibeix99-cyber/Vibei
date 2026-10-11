# Evidence index: creative audit phase 2

**Build:** integration app code `0d58c5e`, production preview on :5323, captured 2026-10-11 11:12–11:57 UTC.

| Path | What |
|---|---|
| `probes/walk2.mjs` | Walkthrough capture script. Each run gets a fresh profile, a frozen start clock and `animations:'disabled'`. Flags: `rm`, `static`, `land`, `celebrate`, `video`, `axe`. |
| `probes/runall.sh` | Runs the configuration matrix through the slot gate (`slots.py`, lane AUD, at most 3 browsers). |
| `probes/sheets.sh` | Contact-sheet builder; it uses `review/contact.mjs`. |
| `probes/crop.mjs` | Side-by-side crops. |
| `probes/endsheet-anim.mjs` | Probe: End sheet stability under reduced motion at 1440. |
| `probes/static-nook.mjs` | Probe: static-Nook affordance. Its first run errored before taking measurements, so the finding rests on code plus the capture. |
| `SHA256SUMS.txt` | sha256 of every probe. |
| `meta/<config>.json` | One file per run. Per state it records: visible images (src, box, natural size, fit, **upscale**, clipping), canvases (**pixelRatio**), headings, buttons with rects, axe violations (at 390 light and 820 dark), Home type sizes, summary chips, landscape `brewLength` and `statusLine`. Files prefixed `rerun-` come from desktop runs repeated alone at DPR 1. |
| `sheets/*.png` | Contact sheets (viewport states, labelled), for 8 configurations. The others timed out under load; their frames are listed below. |
| `crops/chai-compare.png` | Chai three ways: the approved painted pose in Focus, the 3D Nook Chai at low tier, and the static SVG Nook Chai. |
| `crops/backdrop-3d-vs-still.png` | The Focus backdrop with 3D on (live engine, earned items present) and 3D off (pre-rendered still, items missing), at 390×844 dark. |
| `frames/*.png` | Full-size key frames that the report cites. |
| `audio/` | Offline audio check (`scripts/audio-check.mjs` on :5323): `report.json`, `audio-check-output.txt` and a spectrogram PNG per sound. WAVs are not committed. |

**Not committed** (size): every full-size capture (23 per complete run) and the webm motion clips. They are in the
session scratchpad, `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/aud2/int/<config>/` (and `rerun/`), and are listed in each `meta.json`.

**The critic's probe results:** see `../CRITIC.md` (header table).
