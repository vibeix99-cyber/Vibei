#!/bin/bash
# The injected cover for press(): old / new x transient (~300 ms) / permanent, the test at 844x390 dark 200 %, workers=1.
# The scratch copies add a positioned element over the target just before the re-check read of the first press (the field).
cd /home/user/wt/w8q/kettle || exit 9
run() { # <variant> <COVER mode>
  local v=$1 m=$2
  echo "######## $v COVER=$m: KETTLE_PORT=5583 COVER=$m npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 -g 'real input \(844×390 dark 200 %\)'"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5583 COVER=$m npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=.tmp/ts-out/n-$v-$m -g 'real input \(844×390 dark 200 %\)'
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
run old transient
run new transient
run old permanent
run new permanent
