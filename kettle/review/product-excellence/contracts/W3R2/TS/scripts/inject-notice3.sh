#!/bin/bash
# Fix round: the injected covers for press(), 844x390 dark 200 %, workers=1, no burners, dev server :5583 (worktree w8q, src 494748b).
# v2 = 21e5644 (rejected tip), new = the fix round's working tree. Scratch copies by scripts/mkinject.py.
cd /home/user/wt/w8q/kettle || exit 9
run() { # <variant> <COVER mode> [COVER_MS]
  local v=$1 m=$2 ms=${3:-300}
  echo "######## $v COVER=$m: KETTLE_PORT=5583 COVER=$m npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 -g 'real input \(844×390 dark 200 %\)'"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5583 COVER=$m COVER_MS=$ms npx playwright test -c .tmp/ts-pw.config.ts ts/$v/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=.tmp/ts-out/r2-$v-$m -g 'real input \(844×390 dark 200 %\)'
  local rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
}
run v2 dock
run new dock
run new permanent-abs
run new permanent
run new sheet
run v2 sheet
run new transient 300
