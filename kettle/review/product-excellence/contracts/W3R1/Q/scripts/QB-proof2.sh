#!/bin/bash
# After the press() rework: :292 1440 light 200 % reduced x6 under load (--workers=2 + 4 burners), then the whole
# notice-strip file (--workers=2), then the load control's two stale cases (W3_LOAD=1), then w2-room's WebGL-lost test x3
# under load. :5545.
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/proof
cd /home/user/wt/w5q/kettle
run() { local n=$1; shift
  echo "$n start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
  env KETTLE_PORT=5545 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$n.json npx playwright test "$@" --project=chromium --workers=2 --reporter=list,json --output=.tmp/Q-pw/$n > $E/$n.log.txt 2>&1
  echo "$n exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
}
burn() { PIDS=""; for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done; echo "burners on:$PIDS $(date -u +%T)" >> $E/chain.log.txt; }
unburn() { kill $PIDS 2>/dev/null; wait $PIDS 2>/dev/null; echo "burners off $(date -u +%T)" >> $E/chain.log.txt; }
burn
run ns292-x6-load-v2 tests/notice-strip.spec.ts --repeat-each=6 -g '1440×900 light 200 % reduced motion'
run w2room-webgl-x3-load tests/w2-room.spec.ts --repeat-each=3 -g 'WebGL context lost'
unburn
run notice-strip-all-v2 tests/notice-strip.spec.ts
export W3_LOAD=1; run w3-notices-load-2cfg tests/w3-notices-load.spec.ts -g '(390×844|375×667) light 200 % reduced motion'
