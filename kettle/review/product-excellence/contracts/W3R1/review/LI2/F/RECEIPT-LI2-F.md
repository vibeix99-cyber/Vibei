# RECEIPT · Lane I2 (interaction and visuals) · W3R1 Maker F (notices polish, warm-days wording, I13)

Raw evidence only. No verdict. LEAD-5 decides. Lane I2 implemented none of this work.

- **Under review:** `pe/w3-notices-polish@5ee3e7c` (code `9f30a9b`, src `0acce1a`). **Trial** `e3b9eac` (integration + F) at `/home/user/wt/w5tr-f`.
- **Servers** (each checked with `/tmp/rv7-servers/verify.sh` at 16:57 UTC): trial dev **:5521** serves `e3b9eac` (src `0acce1a`) VERIFIED; base dev **:5478** serves `4d36939` (src `5cd9a44`) VERIFIED; combined dev **:5520** serves `e478604` (src `07c26ff`) VERIFIED.
- **Method:** frozen clock `2026-10-12T07:40:00Z` then `resume()`; seeds via `?debug&seed=…`; DPR 1; 200 % = `html{font-size:200%!important}` at DOMContentLoaded; phones `hasTouch`/`isMobile` with real `touchscreen.tap` and CDP `Input.synthesizeScrollGesture` (touch) scrolls; 1440 real mouse and wheel. Notices in the probes are raised with the app's own `__kettle.toast()` (the app has no on-demand button); everything aimed at is real input.
- **Slots:** every browser run went through `slots.py run --lane LI2 --n 1`, each Playwright run with its own `--output` (`.tmp/LI2/LI2-pw-*`). I killed no process.
- **Reuse:** the previous Lane I2 instance (cut off before its receipt) left valid evidence on the same commits and frozen date in this folder: `runs/`, `probes/`, `shots/`, `combined/`, `topbar/`, `wheel/`. Its scripts are in `/home/user/wt/w5tr-f/kettle/.tmp/LI2/` (`LI2-probe.mjs`, `LI2-wheel.mjs`, `LI2-cap.mjs`, `LI2-comb.mjs`, `LI2-topbar.mjs`, `LI2-sum.py`). I cite it as "prior". New this session: `runs2/`, `idle/`, `topbar2/` and scripts `LI2-idle.mjs`, `LI2-topbar2.mjs`, `LI2-jobE.sh`, `LI2-jobF.sh` in the same scratch folder.
- **Time:** resumed 16:53 UTC.

