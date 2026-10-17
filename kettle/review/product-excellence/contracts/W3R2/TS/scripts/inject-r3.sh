#!/bin/bash
# R3 bites: scratch copy of the fixed timer.spec.ts whose in-page wait before the freeze is 2500 ms instead of 100 ms (a page that
# stalls for most of a 3 s brew): the freeze lands <1 s before the end, so the new assertion fails. Harness project, :5583.
cd /home/user/wt/w8q/kettle || exit 9
echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
env KETTLE_PORT=5583 npx playwright test -c .tmp/ts-pw.config.ts ts/r3/timer.spec.ts --project=timer-harness --reporter=list --output=.tmp/ts-out/r3 -g 'background: the worker'
rc=$?
echo "### end $(date -u +%T) exit=$rc load $(cut -d' ' -f1-3 /proc/loadavg)"
