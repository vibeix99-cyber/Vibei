#!/bin/bash
# runs INSIDE one gate call (--n 2): 4 CPU burners (own PIDs, killed at the end), then four playwright invocations at --workers=2 on :5560
# (LR-stress.sh recipe): integrity:309 x10; w3r2-stale-tab x3; notice-strip 844x390 dark 200 % x5; timer.spec.ts:156 x5 (timer-harness and timer-app)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
W=/home/user/wt/w6-int/kettle
cd $W
PIDS=""
for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
trap 'kill $PIDS 2>/dev/null; wait 2>/dev/null; echo "burners stopped $(date -u +%T): $PIDS"' EXIT
echo "burners: $PIDS start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
one() { # label then playwright args
  local label=$1; shift
  echo "--- $label start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/stress-$label.json npx playwright test "$@" --workers=2 --reporter=list,json --output=$W/.tmp/RF-pw/stress-$label
  echo "--- $label end $(date -u +%T) exit=$? load $(cut -d' ' -f1-3 /proc/loadavg)"
}
one integrity309 tests/integrity.spec.ts --project=chromium --repeat-each=10 -g 'two tabs, the leading one frozen across the end'
one stale-tab tests/w3r2-stale-tab.spec.ts --project=chromium --repeat-each=3
one notice-844x390-dark200 tests/notice-strip.spec.ts --project=chromium --repeat-each=5 -g '844×390 dark 200.%\)'
one timer156 tests/timer.spec.ts:156 --project=timer-harness --project=timer-app --repeat-each=5
