#!/bin/bash
# LEAD-D1: control e866118 (case 1 Mark done, case 2 + endless update toast), 4 configs, with clips; then R7 3 runs per config and case (first with clip)
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
CF="375x667@200:light,375x667@200:dark,844x390@200:light,667x375@150:dark"
$S ./one.sh leadd1-case1-ctl-a2 markdone-a2.mjs 5304 -- {BASE} {REV} {OUT} $CF 0 0 7
$S ./one.sh leadd1-case2-ctl markdone-a2.mjs 5304 -- {BASE} {REV} {OUT} $CF 1 1 11
$S ./one.sh leadd1-case1-r7 markdone-a2.mjs 5301 -- {BASE} {REV} {OUT} $CF 0 1 7
$S ./one.sh leadd1-case2-r7 markdone-a2.mjs 5301 -- {BASE} {REV} {OUT} $CF 1 1 11
$S ./one.sh leadd1-case1-r7 markdone-a2.mjs 5301 -- {BASE} {REV} {OUT} $CF,$CF 0 0 7
$S ./one.sh leadd1-case2-r7 markdone-a2.mjs 5301 -- {BASE} {REV} {OUT} $CF,$CF 1 0 11
echo CHAIN3 DONE $(date -u +%FT%TZ)
