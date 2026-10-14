#!/bin/bash
# The three full-run failures under load: 2 workers (as in the full run) plus 4 CPU burners (own PIDs, killed at the end).
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL/rerun
cd /home/user/wt/w5-final/kettle
PIDS=""
for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
echo "burners: $PIDS start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" > $E/stress.log.txt
rm -rf .tmp/LR-pw/stress
env KETTLE_PORT=5540 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/stress.json npx playwright test tests/integrity.spec.ts tests/w2-room.spec.ts --project=chromium --workers=2 --repeat-each=6 --trace=on --reporter=list,json --output=.tmp/LR-pw/stress -g 'two tabs, the leading one frozen across the end|I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew|3D failure \(WebGL context lost\): the still that takes over carries the same items' > $E/stress-run.log.txt 2>&1
echo "playwright exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/stress.log.txt
kill $PIDS 2>/dev/null; wait 2>/dev/null
echo "burners stopped $(date -u +%T)" >> $E/stress.log.txt
