#!/bin/bash
# one gate slot, run in sequence (so one queue wait covers them): integrity whole, integrity:309 x10, timer-harness/timer-app/pwa, w2-home. All on the trial :5591.
# A failed test is rerun once on :5591 and once on :5560 (classification), inside the same slot, right after its run.
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2
W=/home/user/wt/w8tr-g/kettle
W6=/home/user/wt/w6-int/kettle
P=$W/.tmp/R2-pw
cd $W
run() { # run <name> <port> <cwd> <playwright args...>
  local name=$1 port=$2 cwd=$3; shift 3
  {
    echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"
    echo "### cmd: (cd $cwd) KETTLE_PORT=$port KETTLE_PWA_PORT=5498 npx playwright test $* --workers=1 --reporter=list,json"
    ( cd $cwd && env KETTLE_PORT=$port KETTLE_PWA_PORT=5498 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/$name.json npx playwright test "$@" --workers=1 --reporter=list,json --output=$P/$name )
    echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"
  } > $E/runs/$name.log.txt 2>&1
}
one() { # one <name> <project args and files...> ; reruns failures once on 5591, once on 5560
  local name=$1; shift
  run $name 5591 $W "$@"
  local f; f=$(node $E/scripts/R2-failed.mjs $E/json/$name.json)
  if [ -n "$f" ]; then
    local g; g=$(echo "$f" | cut -f2- | sed 's/^[ \t]*//')
    echo "failed in $name: $f" >> $E/runs/failures.txt
    local args=() ; for a in "$@"; do case "$a" in -g|--repeat-each=*) ;; *) args+=("$a");; esac; done
    # drop the value that followed -g in the original arguments
    local skip=0; args=(); for a in "$@"; do if [ $skip = 1 ]; then skip=0; continue; fi; case "$a" in -g) skip=1;; --repeat-each=*) ;; *) args+=("$a");; esac; done
    run $name-rerun-5591 5591 $W "${args[@]}" -g "$g"
    run $name-control-5560 5560 $W6 "${args[@]}" -g "$g"
  fi
}
one integrity-5591 tests/integrity.spec.ts --project=chromium
one integrity309-x10-5591 tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --project=chromium --repeat-each=10
one timer-pwa-5591 --project=timer-harness --project=timer-app --project=pwa
one w2-home-5591 tests/w2-home.spec.ts --project=chromium
echo done > $E/runs/bundle.done
