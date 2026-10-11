#!/bin/bash
# relaunch: smoke of markdone-a4 (setup b, then setup a) at 844x390 only, R7, no video, one slot job
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
$S bash -c './one.sh markdone-cases/smoke-r7-b markdone-a4.mjs 5301 SETUP=b -- {BASE} {REV} {OUT} 844x390@200:light 0 4; ./one.sh markdone-cases/smoke-r7-a markdone-a4.mjs 5301 SETUP=a -- {BASE} {REV} {OUT} 844x390@200:light 0 4'
echo CHAIN9A DONE $(date -u +%FT%TZ)
