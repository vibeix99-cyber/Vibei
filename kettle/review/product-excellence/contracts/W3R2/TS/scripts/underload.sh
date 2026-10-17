#!/bin/bash
# underload.sh <timer|notice|timer-whole|notice-whole>: timer, notice: 2 Playwright workers plus 4 CPU burners (own PIDs, killed by PID at the end), as in
# contracts/W3R1/review/FINAL/scripts/LR-stress.sh. Run through the gate with --n 2 (gate.sh 2 <log> underload.sh <what>).
# Dev server :5583 (worktree /home/user/wt/w8q, branch pe/w3r2-test-stability). Load average (1, 5, 15 min) before and after each run.
WHAT=$1
cd /home/user/wt/w8q/kettle || exit 9
OUT=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/logs
PIDS=""
cleanup() { [ -n "$PIDS" ] && kill $PIDS 2>/dev/null; wait $PIDS 2>/dev/null; echo "burners stopped $(date -u +%T): $(for p in $PIDS; do kill -0 $p 2>/dev/null && echo "$p ALIVE" || echo "$p gone"; done | tr '\n' ' ')"; PIDS=""; }
trap cleanup EXIT
W=2
case $WHAT in
  timer|notice|diag)  # under load: 4 burners
    for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
    echo "burners:$PIDS started $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
    sleep 5 ;;
  timer-whole) W=1; echo "no burners (whole-file run, the config's default of one worker)" ;;
  notice-whole) echo "no burners (whole-file run, --workers=2 as the spec's header says)" ;;
esac
run() { # <name> <args...>
  local name=$1; shift
  echo "######## $name: env KETTLE_PORT=5583 PLAYWRIGHT_JSON_OUTPUT_NAME=$OUT/$name.json npx playwright test $* --workers=$W --reporter=list,json --output=.tmp/ts-out/$name"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5583 PLAYWRIGHT_JSON_OUTPUT_NAME=$OUT/$name.json npx playwright test "$@" --workers=$W --reporter=list,json --output=.tmp/ts-out/$name
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
case $WHAT in
  timer)
    run load-timer156 tests/timer.spec.ts --project=timer-app --project=timer-harness --repeat-each=10 -g 'background: the worker'
    run load-timer183 tests/timer.spec.ts --project=timer-app --project=timer-harness --repeat-each=10 -g 'hidden page: completion'
    ;;
  notice)
    run load-notice338 tests/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 dark 200 %\)'
    ;;
  diag)
    W=1
    run diag-notice338 -c .tmp/ts-pw.config.ts ts/diag/notice-strip.spec.ts --project=chromium --repeat-each=8 -g 'real input \(844×390 dark 200 %\)'
    ;;
  timer-whole)
    run whole-timer tests/timer.spec.ts --project=timer-app --project=timer-harness
    ;;
  notice-whole)
    run whole-notice tests/notice-strip.spec.ts --project=chromium
    ;;
esac
