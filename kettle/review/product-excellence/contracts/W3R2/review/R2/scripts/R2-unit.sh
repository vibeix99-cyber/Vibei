#!/bin/bash
# tsc and full vitest in the trial worktree (not browser runs, no gate)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2
cd /home/user/wt/w8tr-g/kettle
{ echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; echo "### cmd: git rev-parse HEAD; npx tsc --noEmit -p ."; git rev-parse --short HEAD; git rev-parse --short HEAD:kettle/src; git status --short | wc -l; npx tsc --noEmit -p . ; echo "exit=$?"; echo "### end $(date -u +%H:%M:%S) UTC; load: $(uptime)"; } > $E/runs/tsc.log.txt 2>&1
{ echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; echo "### cmd: npx vitest run"; npx vitest run; echo "exit=$?"; echo "### end $(date -u +%H:%M:%S) UTC; load: $(uptime)"; } > $E/runs/vitest.log.txt 2>&1
echo done > $E/runs/unit.done
