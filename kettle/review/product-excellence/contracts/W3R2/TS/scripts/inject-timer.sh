#!/bin/bash
# The injected race for the timer pair: old / mid (observer first only) / new, same injection, both projects, 2 rounds each.
# One browser at a time (run through the gate with --n 1), dev server :5583 (worktree /home/user/wt/w8q).
cd /home/user/wt/w8q/kettle || exit 9
for v in old mid new; do
  echo "######## $v: KETTLE_PORT=5583 npx playwright test -c .tmp/ts-pw.config.ts ts/$v/timer.spec.ts --project=timer-app --project=timer-harness --repeat-each=2 -g 'background: the worker|hidden page: completion'"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5583 npx playwright test -c .tmp/ts-pw.config.ts ts/$v/timer.spec.ts --project=timer-app --project=timer-harness --repeat-each=2 --reporter=list --output=.tmp/ts-out/$v -g 'background: the worker|hidden page: completion'
  echo "### end $(date -u +%T) exit=$? load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
done
