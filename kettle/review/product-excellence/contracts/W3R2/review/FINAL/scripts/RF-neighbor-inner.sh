#!/bin/bash
# inside one gate call (--n 2): process B = the I03 storage-full banner test ("nothing over the brew", the three viewports) x4 (1 worker); process A = a 3D-heavy neighbour at the same time
# (a11y.spec.ts "toast" tests, the ones that were running beside F1 in the first full run), 1 worker, repeated until B is done.
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
W=/home/user/wt/w6-int/kettle
cd $W
echo "start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/rerun/N-neighbor-a11y-toast-5560.json npx playwright test tests/a11y.spec.ts --project=chromium --workers=1 --repeat-each=6 --reporter=list,json --output=$W/.tmp/RF-pw/N-a11y -g 'toast' > $E/runs/rerun-N-neighbor-a11y.log.txt 2>&1 &
APID=$!
sleep 20
env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/rerun/N-I03-x4-with-neighbor-5560.json npx playwright test tests/integrity.spec.ts --project=chromium --workers=1 --repeat-each=4 --reporter=list,json --output=$W/.tmp/RF-pw/N-I03 -g 'I03 storage-full warning is a banner in the page .* nothing over the brew'
echo "--- B end $(date -u +%T) exit=$? load $(cut -d' ' -f1-3 /proc/loadavg)"
wait $APID; echo "--- A end $(date -u +%T) exit=$?"
