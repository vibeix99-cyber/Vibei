#!/bin/bash
# LEAD-D1 case 2 at 844x390 @200 % by keyboard (Tab… Enter): control e866118 first, then R7 x3 (first with clip)
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
$S ./one.sh leadd1-case2key-ctl markdone-a3.mjs 5304 KEY=1 -- {BASE} {REV} {OUT} 844x390@200:light 1 1 11
$S ./one.sh leadd1-case2key-r7 markdone-a3.mjs 5301 KEY=1 -- {BASE} {REV} {OUT} 844x390@200:light 1 1 11
$S ./one.sh leadd1-case2key-r7 markdone-a3.mjs 5301 KEY=1 -- {BASE} {REV} {OUT} 844x390@200:light,844x390@200:light 1 0 11
echo CHAIN8 DONE $(date -u +%FT%TZ)
