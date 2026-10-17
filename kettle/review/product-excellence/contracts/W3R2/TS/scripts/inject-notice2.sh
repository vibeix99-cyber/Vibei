#!/bin/bash
# The injected cover / shift for press(), final code: old / v1 (re-aim only, a6b3790) / new (re-aim + bring back by the wheel).
# The test at 844x390 dark 200 %, workers=1, :5583. The scratch copies add the injection just before the re-check read of the first press.
cd /home/user/wt/w8q/kettle || exit 9
run() { # <variant> <COVER mode> [COVER_MS]
  local v=$1 m=$2 ms=${3:-300}
  echo "######## $v COVER=$m COVER_MS=$ms: KETTLE_PORT=5583 npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 -g 'real input \(844×390 dark 200 %\)'"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5583 COVER=$m COVER_MS=$ms npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=.tmp/ts-out/n2-$v-$m -g 'real input \(844×390 dark 200 %\)'
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
run old shift
run v1 shift
run new shift
run new permanent
run new transient 300
