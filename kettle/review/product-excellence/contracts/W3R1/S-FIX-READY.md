# W3R1 Maker S: fix round (S-D1), ready for review

- **Branch:** `pe/w3-stats`, from `344069c`. Local commits only.
- **Hash / src tree:** given in the last section (written last).
- **Evidence:** `contracts/W3R1/S/fix/` (probe `S/fix/tools/fitprobe.mjs`, pipeline `S/fix/tools/fixpipe.sh`; every browser run through `slots.py run --lane S --n 1`).

## The defect and the fix

- **S-D1:** with 200 % text, two Overview tiles a row leave about 90 px for the text. "Warmest run" / "23 days" were cut ("Warm… run", "23 day…"). The nowrap values also overflowed: "23h 9m" ran past its tile, and before the web fonts arrived "23 days" pushed a phone page to 408 px (390×844) or 401 px (375×667).
- **Fix (`stats.module.css` only):** the tiles go one a row when the column is narrower than **21rem**. That is 336 px at 100 %, so phones keep two tiles a row exactly as before. At 200 % it is 672 px, so tiles go one a row with the icon beside the text. Nothing else changed: no wording, value, `Stat.*` or `Sheet.*` edit.
- **Tests (`w3-stats.spec.ts`):**
  - the delete-dialog cases (the old `:98`, now `:101`) also run at 390×844 and 375×667 @200 with fonts blocked;
  - new: tile text fits at 390×844, 375×667 and 844×390 @200;
  - new: with fonts blocked (`isMobile`, 390×844 and 375×667 @200), `scrollWidth ≤ innerWidth`, which equals 390 / 375, and the tiles fit.

## Check 1: scope

`git diff --stat 344069c <fix> -- kettle/` lists:
- `kettle/src/screens/stats/stats.module.css` (+15);
- `kettle/tests/w3-stats.spec.ts`;
- this packet and `S/fix/` evidence.
