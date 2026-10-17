#!/bin/bash
# LEAD-6 stage F: the diagnostic copy plus the Today dock's state (data-tall, position, box, --home-dock-h) at the first read
# of the composer field, after the walk, and at every not-on-top read; under the same load (2 workers + 4 burners, killed
# by PID), 844x390 dark 200 % x10, :5560.
K=/home/user/wt/w8tr-q/kettle; L=$K/.tmp/lead6; cd $K || exit 9
PIDS=""; for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
echo "burners:$PIDS started $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"; sleep 5
echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/out/F-diag3.json npx playwright test -c .tmp/lead6/ts-pw.config.ts ts/diag3/notice-strip.spec.ts --project=chromium --repeat-each=10 -g 'real input \(844×390 dark 200 %\)' --workers=2 --reporter=list,json --output=$L/out/F-diag3
echo "### end $(date -u +%T) exit=$? load $(cut -d' ' -f1-3 /proc/loadavg)"
kill $PIDS 2>/dev/null; wait $PIDS 2>/dev/null
echo "burners stopped $(date -u +%T): $(for p in $PIDS; do kill -0 $p 2>/dev/null && echo "$p ALIVE" || echo "$p gone"; done | tr '\n' ' ')"
