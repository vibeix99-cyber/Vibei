#!/bin/bash
# Proof under load (--workers=2 plus 4 CPU burners, own PIDs): X-1 (integrity I03 390x844 banner) x10, then
# notice-strip :292 at 1440 light 200 % reduced x6. Real spec files (tests/), :5545.
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/proof
mkdir -p $E
cd /home/user/wt/w5q/kettle
PIDS=""
for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
run() { local n=$1; shift
  echo "$n start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
  env KETTLE_PORT=5545 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$n.json npx playwright test "$@" --project=chromium --workers=2 --reporter=list,json --output=.tmp/Q-pw/$n > $E/$n.log.txt 2>&1
  echo "$n exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
}
run x1-i03-x10-load tests/integrity.spec.ts --repeat-each=10 -g 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
run ns292-x6-load tests/notice-strip.spec.ts --repeat-each=6 -g '1440×900 light 200 % reduced motion'
kill $PIDS 2>/dev/null; wait 2>/dev/null
echo "burners stopped $(date -u +%T)" >> $E/chain.log.txt
