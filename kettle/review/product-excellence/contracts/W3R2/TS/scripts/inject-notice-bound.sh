#!/bin/bash
# The bound of the re-aim in the new press(): a transient cover of 1500 ms passes (it is gone within the ~2 s window),
# one of 3500 ms fails (it outlasts it), with the same words as a permanent one.
cd /home/user/wt/w8q/kettle || exit 9
run() { # <variant> <COVER mode> <COVER_MS>
  local v=$1 m=$2 ms=$3
  echo "######## $v COVER=$m COVER_MS=$ms: KETTLE_PORT=5583 npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 -g 'real input \(844×390 dark 200 %\)'"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5583 COVER=$m COVER_MS=$ms npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=.tmp/ts-out/nb-$v-$m-$ms -g 'real input \(844×390 dark 200 %\)'
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
run new transient 3500
run new transient 1500
