#!/bin/bash
# LEAD-5 · Q Phase B checks on :5547 (trial d7f9126). Load: --workers=2 plus 2 CPU burners of mine (bounded, own PIDs).
cd /home/user/wt/w5tr-qb/kettle
burn() { for i in 1 2; do timeout $1 sh -c 'while :; do :; done' & done; }
echo "== start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
burn 900
KETTLE_PORT=5547 npx playwright test tests/notice-strip.spec.ts -g '\(1440×900 light 200 % reduced motion\)$' --repeat-each=6 --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qb-ns6 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/QB/ns-1440-light-200-rm-x6-load.log 2>&1; echo "ns x6 exit $? load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5547 npx playwright test tests/integrity.spec.ts -g 'I03 storage-full warning is a banner in the page \(phone 390×844\) › nothing over the brew' --repeat-each=10 --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qb-x1 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/QB/x1-i03-x10-load.log 2>&1; echo "x1 exit $? load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5547 npx playwright test tests/w2-room.spec.ts -g 'WebGL context lost' --repeat-each=3 --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qb-w2r > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/QB/w2room-webgl-x3-load.log 2>&1; echo "w2room exit $? load $(cut -d' ' -f1-3 /proc/loadavg)"
wait
echo "== burners done $(date -u +%T)"
KETTLE_PORT=5547 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qb-nsall > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/QB/notice-strip-all.log 2>&1; echo "ns all exit $?"
W3_LOAD=1 KETTLE_PORT=5547 npx playwright test tests/w3-notices-load.spec.ts --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qb-w3l > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/QB/w3-notices-load-all.log 2>&1; echo "w3load exit $?"
echo "== end $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
