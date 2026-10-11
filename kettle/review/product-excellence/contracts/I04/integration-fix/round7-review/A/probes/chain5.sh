#!/bin/bash
# D3 / R2-D3 / R4-D1 analogue: is every line of the storage-full warning readable, Save backup reachable + working, by real wheel / touch at large text. INT (control) then R7, per config and input.
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
for g in wheel touch; do
for c in "375x667 light 200" "375x667 dark 200" "390x844 light 200" "844x390 light 200" "667x375 dark 200"; do set -- $c
  $S ./one.sh readwarn-int readwarn.mjs 5303 GESTURE=$g -- {BASE} {REV} {OUT} $1 $2 $3
  $S ./one.sh readwarn-r7 readwarn.mjs 5301 GESTURE=$g -- {BASE} {REV} {OUT} $1 $2 $3
done; done
echo CHAIN5 DONE $(date -u +%FT%TZ)
