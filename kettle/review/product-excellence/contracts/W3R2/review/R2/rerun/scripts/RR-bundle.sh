#!/bin/bash
# one gate slot, in sequence: race+stale-tab, integrity whole, integrity:309 x10, timer-harness/timer-app/pwa, w2-home. All on trial 2 :5601.
# A failed test is rerun once on :5601 and once on the control :5560 (same tests from the trial tree), inside the same slot.
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/rerun
W=/home/user/wt/w8tr-g2/kettle
P=$W/.tmp/RR-pw
cd $W
run() { # run <name> <port> <playwright args...>
  local name=$1 port=$2; shift 2
  {
    echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"
    echo "### cmd: KETTLE_PORT=$port KETTLE_PWA_PORT=5498 npx playwright test $* --workers=1 --reporter=list,json"
    env KETTLE_PORT=$port KETTLE_PWA_PORT=5498 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/$name.json npx playwright test "$@" --workers=1 --reporter=list,json --output=$P/$name
    echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"
  } > $E/runs/$name.log.txt 2>&1
}
one() { # one <name> <args...>
  local name=$1; shift
  run $name 5601 "$@"
  local f; f=$(node $E/scripts/RR-failed.mjs $E/json/$name.json)
  if [ -n "$f" ]; then
    local g; g=$(echo "$f" | cut -f2- | sed 's/^[ \t]*//')
    echo "failed in $name: $f" >> $E/runs/failures.txt
    local skip=0 args=(); for a in "$@"; do if [ $skip = 1 ]; then skip=0; continue; fi; case "$a" in -g) skip=1;; --repeat-each=*) ;; *) args+=("$a");; esac; done
    run $name-rerun-5601 5601 "${args[@]}" -g "$g"
    run $name-control-5560 5560 "${args[@]}" -g "$g"
  fi
}
one race-staletab-5601 tests/w3r2-stale-tab.spec.ts tests/w3-intention-race.spec.ts --project=chromium
one integrity-5601 tests/integrity.spec.ts --project=chromium
one integrity309-x10-5601 tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --project=chromium --repeat-each=10
one timer-pwa-5601 --project=timer-harness --project=timer-app --project=pwa
one w2-home-5601 tests/w2-home.spec.ts --project=chromium
echo done > $E/runs/bundle.done
