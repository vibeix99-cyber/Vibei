#!/bin/bash
# cap2.sh : before=5560, after=5582, before2=5560 for every configuration x state, back to back per shot, two browsers
# (phones | landscape + desktop) in one gated job of 2 slots.
cd /home/user/wt/w8t/kettle || exit 9
O=/home/user/wt/w8t/kettle/.tmp/th/shots3; D=/home/user/wt/w8t/kettle/.tmp/th
T=before=5560,after=5582,before2=5560
echo "### start $(date -u +%T)"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane TH --n 2 -- bash -c "
  cd /home/user/wt/w8t/kettle
  PAR=3 node $D/capture3.cjs $T $O 390x844,375x667 > $D/logs/cap2-a.log.txt 2>&1 &
  PAR=3 node $D/capture3.cjs $T $O 844x390,1440x900 > $D/logs/cap2-b.log.txt 2>&1 &
  wait"
echo "### end $(date -u +%T) exit=$?"
