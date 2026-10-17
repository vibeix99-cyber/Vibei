#!/bin/bash
# LEAD-6 fix-round reruns of W3R2 item 3 (TS), one slot-gate job (--n 2), trial 2 41b3424 (= integration 34daff1, app 7cb3242,
# src 07df367, + pe/w3r2-test-stability@89396e8, tests 1f5feee), worktree /home/user/wt/w8tr-q2/kettle, dev :5560.
#   U  under load (2 workers + 4 CPU burners, own PIDs, killed by PID): notice 844x390 dark 200 % x10; 844x390 light 200 %
#      reduced motion x10; the maker's diagnostic copy (mkdiag3.py) x10; timer :156 x10 in timer-app and timer-harness
#   I  injections (1 worker, no burners; the maker's mkinject.py copies): v2 (21e5644) vs new (89396e8) dock and sheet;
#      new transient, permanent-abs, permanent; R3 bite (2.5 s freeze delay); alongside it, the whole timer.spec.ts (1 worker)
#   W  the whole notice-strip.spec.ts once (--workers=2, no burners)
K=/home/user/wt/w8tr-q2/kettle; L=$K/.tmp/lead6
OUT=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/LEAD6/TS/r2
cd $K || exit 9
PIDS=""
burn_on() { for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done; echo "burners:$PIDS started $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"; sleep 5; }
burn_off() { [ -n "$PIDS" ] && kill $PIDS 2>/dev/null; wait $PIDS 2>/dev/null; echo "burners stopped $(date -u +%T): $(for p in $PIDS; do kill -0 $p 2>/dev/null && echo "$p ALIVE" || echo "$p gone"; done | tr '\n' ' ')"; PIDS=""; }
trap burn_off EXIT
run() { # <name> <workers> <args...>
  local name=$1 w=$2; shift 2
  echo "######## $name: KETTLE_PORT=5560 COVER=${COVER:-} npx playwright test $* --workers=$w"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/out/$name.json npx playwright test "$@" --workers=$w --reporter=list,json --output=$L/out/$name
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
{
  echo "served src check $(date -u +%T): $(curl -s http://127.0.0.1:5560/src/ui/Toast.tsx | grep -c 'useIsPresent') useIsPresent refs in served Toast.tsx"
  burn_on
  run U-dark844-x10 2 tests/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 dark 200 %\)'
  run U-light844red-x10 2 tests/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 light 200 % reduced motion\)'
  run U-diag3-x10 2 -c .tmp/lead6/ts-pw.config.ts ts/diag3/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 dark 200 %\)'
  run U-timer156-x10 2 tests/timer.spec.ts --project=timer-app --project=timer-harness --repeat-each=10 -g 'background: the worker'
  burn_off
} > $OUT/U-underload.log.txt 2>&1
{
  run I-timer-whole 1 tests/timer.spec.ts --project=timer-harness --project=timer-app > $OUT/I-timer-whole.log.txt 2>&1 &
  TW=$!
  for vm in v2:dock new:dock new:transient new:permanent-abs new:permanent new:sheet v2:sheet; do
    v=${vm%%:*}; export COVER=${vm##*:}
    run I-notice-$v-$COVER 1 -c .tmp/lead6/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium -g 'real input \(844×390 dark 200 %\)'
  done
  unset COVER
  run I-r3-bite 1 -c .tmp/lead6/ts-pw.config.ts ts/r3/timer.spec.ts --project=timer-harness -g 'background: the worker'
  wait $TW
} > $OUT/I-inject.log.txt 2>&1
run W-notice-whole 2 tests/notice-strip.spec.ts --project=chromium > $OUT/W-notice-whole.log.txt 2>&1
