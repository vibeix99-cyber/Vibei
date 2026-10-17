#!/bin/bash
# Fix round: <dark|light|diag3|whole|timer>. dark/light/diag3/timer: 2 workers + 4 CPU burners (own PIDs, killed by PID), as in
# W3R1/review/FINAL/scripts/LR-stress.sh; whole: --workers=2, no burners. Dev server :5560 (integration HEAD, app 7cb3242) unless
# KETTLE_PORT is set. Spec: the worktree /home/user/wt/w8q (branch pe/w3r2-test-stability). Load average at each start and end.
WHAT=$1
PORT=${KETTLE_PORT:-5560}
cd /home/user/wt/w8q/kettle || exit 9
OUT=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/logs/r2
PIDS=""
cleanup() { [ -n "$PIDS" ] && kill $PIDS 2>/dev/null; wait $PIDS 2>/dev/null; echo "burners stopped $(date -u +%T): $(for p in $PIDS; do kill -0 $p 2>/dev/null && echo "$p ALIVE" || echo "$p gone"; done | tr '\n' ' ')"; PIDS=""; }
trap cleanup EXIT
case $WHAT in
  dark|light|diag3|timer)
    for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
    echo "burners:$PIDS started $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
    sleep 5 ;;
  whole) echo "no burners (whole-file run, --workers=2 as the spec's header says)" ;;
esac
run() { # <name> <args...>
  local name=$1; shift
  echo "######## $name: env KETTLE_PORT=$PORT PLAYWRIGHT_JSON_OUTPUT_NAME=$OUT/$name.json npx playwright test $* --workers=2 --reporter=list,json --output=.tmp/ts-out/r2-$name"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=$PORT PLAYWRIGHT_JSON_OUTPUT_NAME=$OUT/$name.json npx playwright test "$@" --workers=2 --reporter=list,json --output=.tmp/ts-out/r2-$name
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
case $WHAT in
  dark)  run r2-dark844-x20 tests/notice-strip.spec.ts --project=chromium --repeat-each=20 -g 'real input \(844×390 dark 200 %\)' ;;
  light) run r2-light844reduced-x10 tests/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 light 200 % reduced motion\)' ;;
  diag3) run r2-diag3-x10 -c .tmp/ts-pw.config.ts ts/diag3/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 dark 200 %\)' ;;
  whole) run r2-whole-notice tests/notice-strip.spec.ts --project=chromium ;;
  timer) run r2-timer156-x10 tests/timer.spec.ts --project=timer-app --project=timer-harness --repeat-each=10 -g 'background: the worker' ;;
esac
