#!/bin/bash
# relaunch 2026-10-11 (after LEAD's exclusive run): item 5 (banner after Mark done), then check 3 leftovers, then R5-D1 touch 375x667 dark (last)
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
CF="375x667@200:light,375x667@200:dark,844x390@200:light"
# item 5: first pass with clips
$S ./one.sh markdone-cases/r7-setupb markdone-a4.mjs 5301 SETUP=b -- {BASE} {REV} {OUT} $CF 1 6
$S ./one.sh markdone-cases/r7-setupa markdone-a4.mjs 5301 SETUP=a -- {BASE} {REV} {OUT} $CF 1 6
$S ./one.sh markdone-cases/int-setupa markdone-a4.mjs 5303 SETUP=a -- {BASE} {REV} {OUT} $CF 1 6
echo CHAIN9B-PHASE1 DONE $(date -u +%FT%TZ)
