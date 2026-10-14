# RECEIPT · Lane I (interaction and visuals) · W3R1 Maker S (Stats and History, I12; F-T2-4; the backup test)

Raw evidence only. No verdict. LEAD-5 decides. Lane I implemented none of this work. A previous Lane I instance was cut by a usage limit; its two integrity logs are reused (§6).

- **Under review:** `pe/w3-stats@344069c` (code `8158134`, src `20a4698`). **Trial** `c7a6b8f` at `/home/user/wt/w5tr-s`; checked `git rev-parse HEAD:kettle/src` = `20a4698…`. Dev **:5522**, preview :5532.
- **Base:** `4d36939` (src `5cd9a44`), dev **:5478**, preview :5488. **Combined** (F+S+G+N) `e478604` (src `07c26ff`), dev **:5520**.
- **Method:** frozen clock `2026-10-12T07:40:00Z` (Monday) then `resume()`, unless a section states another time. Seed `veteran` unless stated. en-GB, UTC, DPR 1. Phones (w < 900): `hasTouch` + `isMobile`, real taps (`locator.tap`, `touchscreen.tap`); 1440: mouse. Real Tab / Shift+Tab / Enter / Escape. 200 % = `html{font-size:200%!important}` at DOMContentLoaded.
- Every browser run went through `slots.py run --lane LI --n 1` (the reused repeat run used `--n 2`), each with its own `--output`. I killed only PIDs of my own probes (two runs of `LI-sheets.mjs` that had a script bug; their logs are kept as `*-run1-*`).
- **Tools** (`tools/`, also in `/home/user/wt/w5tr-s/kettle/.tmp/LI/`): `LI-sheets.mjs` (F-T2-4 and every sheet), `LI-weekboundary.spec.ts` + `LI-pw.config.ts` (§3), `LI-truth.mjs` (§4), `LI-words.mjs` (§5), `LI-cap.mjs` (§7), runner `.sh` files.
- **Time:** 16:53 → see the end. Slots were shared with LR, LI2 and the lead throughout.

