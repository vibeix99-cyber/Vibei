#!/bin/bash
# The same w2-room context-loss test, branch (5423) and control (5410) at the SAME time (equal CPU contention),
# 3 repeats each. Two browsers: run under slots.py --n 2.
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
cd /home/user/wt/w3c/kettle
echo "start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)"
for port in 5423 5410; do
  KETTLE_PORT=$port timeout 900 npx playwright test tests/w2-room.spec.ts --project=chromium --workers=1 -g "3D failure \(WebGL context lost\)" --repeat-each=3 --output=test-results/ctx-$port > $C/runs/ctxloss-parallel-$port.txt 2>&1 &
done
wait
echo "end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)"
for port in 5423 5410; do echo "== $port"; sed 's/\x1b\[[0-9;]*m//g' $C/runs/ctxloss-parallel-$port.txt | grep -E "✓|✘|passed|failed|Error:" | cut -c1-120; done
