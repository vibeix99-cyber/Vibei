#!/bin/bash
# relaunch: remaining jobs after the queued X job (chain9c's parent killed; X stays queued). Re-prioritised: Y (check 3), Zb (setup b repetitions on R7), W (R5-D1 touch 375x667 dark).
cd /home/user/wt/rv7-r7/kettle/.tmp/A
EV=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
CF="375x667@200:light,375x667@200:dark,844x390@200:light"
until grep -q "END.*series=markdone-cases/int-setupa " $EV/runs/series.log; do sleep 3; done
$S bash -c './one.sh readwarn-r7 readwarn.mjs 5301 GESTURE=wheel -- {BASE} {REV} {OUT} 844x390 light 200; ./one.sh readwarn-int readwarn.mjs 5303 GESTURE=wheel -- {BASE} {REV} {OUT} 667x375 dark 200; ./one.sh readwarn-r7 readwarn.mjs 5301 GESTURE=wheel -- {BASE} {REV} {OUT} 667x375 dark 200; ./spec2.sh 5303 a11y.spec.ts "toasts never cover the break-over controls, carried task included \(375×667\)"'
echo CHAIN9D-Y DONE $(date -u +%FT%TZ)
$S ./one.sh markdone-cases/r7-setupb-rep2 markdone-a4.mjs 5301 SETUP=b -- {BASE} {REV} {OUT} $CF,$CF 0 6
echo CHAIN9D-Zb DONE $(date -u +%FT%TZ)
$S ./one.sh r5d1-touch-r7-375D natural-a2.mjs 5301 GESTURE=touch -- {BASE} R7 {OUT} 375x667 dark 200 0,300,600,900,1200,1500,1800,2400,3000,4000 1
echo CHAIN9D-W DONE $(date -u +%FT%TZ)
