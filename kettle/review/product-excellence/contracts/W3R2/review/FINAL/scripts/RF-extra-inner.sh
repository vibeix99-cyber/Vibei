#!/bin/bash
# inside one gate call (--n 2): the two full-run failures x5 each at --workers=2 with 4 CPU burners (own PIDs, killed at the end)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
W=/home/user/wt/w6-int/kettle
cd $W
PIDS=""
for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
trap 'kill $PIDS 2>/dev/null; wait 2>/dev/null; echo "burners stopped $(date -u +%T): $PIDS"' EXIT
echo "burners: $PIDS start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/rerun/F12-x5-loaded-5560.json npx playwright test tests/integrity.spec.ts tests/w3-settings.spec.ts --project=chromium --workers=2 --repeat-each=5 --reporter=list,json --output=$W/.tmp/RF-pw/F12-loaded -g 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew|preferences persist across a reload; Reset everything returns each to its default'
echo "--- end $(date -u +%T) exit=$? load $(cut -d' ' -f1-3 /proc/loadavg)"
