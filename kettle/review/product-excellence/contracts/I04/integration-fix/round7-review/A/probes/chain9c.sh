#!/bin/bash
# relaunch: after the queued r7-setupb job (chain9b, parent killed so its later jobs were not queued), the remaining jobs as bigger bundles (fewer queue waits, one slot each)
cd /home/user/wt/rv7-r7/kettle/.tmp/A
EV=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
CF="375x667@200:light,375x667@200:dark,844x390@200:light"
until grep -q "END.*series=markdone-cases/r7-setupb " $EV/runs/series.log; do sleep 3; done
# X: item 5 setup a on R7 and INT (clips)
$S bash -c "./one.sh markdone-cases/r7-setupa markdone-a4.mjs 5301 SETUP=a -- {BASE} {REV} {OUT} $CF 1 6; ./one.sh markdone-cases/int-setupa markdone-a4.mjs 5303 SETUP=a -- {BASE} {REV} {OUT} $CF 1 6"
echo CHAIN9C-X DONE $(date -u +%FT%TZ)
# Y: check 3 leftovers: readwarn 844x390 (R7; INT control already run this session), 667x375 dark (INT control, then R7), D4 at 375x667 on INT (control for the spec level)
$S bash -c './one.sh readwarn-r7 readwarn.mjs 5301 GESTURE=wheel -- {BASE} {REV} {OUT} 844x390 light 200; ./one.sh readwarn-int readwarn.mjs 5303 GESTURE=wheel -- {BASE} {REV} {OUT} 667x375 dark 200; ./one.sh readwarn-r7 readwarn.mjs 5301 GESTURE=wheel -- {BASE} {REV} {OUT} 667x375 dark 200; ./spec2.sh 5303 a11y.spec.ts "toasts never cover the break-over controls, carried task included \(375×667\)"'
echo CHAIN9C-Y DONE $(date -u +%FT%TZ)
# Z1: item 5 repetitions on R7: setup b then a, two more passes each (no clips)
$S bash -c "./one.sh markdone-cases/r7-setupb-rep2 markdone-a4.mjs 5301 SETUP=b -- {BASE} {REV} {OUT} $CF,$CF 0 6; ./one.sh markdone-cases/r7-setupa-rep2 markdone-a4.mjs 5301 SETUP=a -- {BASE} {REV} {OUT} $CF,$CF 0 6"
echo CHAIN9C-Z1 DONE $(date -u +%FT%TZ)
# Z2: INT setup a repetition
$S ./one.sh markdone-cases/int-setupa-rep2 markdone-a4.mjs 5303 SETUP=a -- {BASE} {REV} {OUT} $CF 0 6
echo CHAIN9C-Z2 DONE $(date -u +%FT%TZ)
# W: R5-D1 by touch on R7 at 375x667 dark @200 (10 runs; descriptive: control not established)
$S ./one.sh r5d1-touch-r7-375D natural-a2.mjs 5301 GESTURE=touch -- {BASE} R7 {OUT} 375x667 dark 200 0,300,600,900,1200,1500,1800,2400,3000,4000 1
echo CHAIN9C-W DONE $(date -u +%FT%TZ)
