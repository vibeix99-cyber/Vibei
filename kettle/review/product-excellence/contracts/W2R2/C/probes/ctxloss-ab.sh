#!/bin/bash
# w2-room "3D failure (WebGL context lost)" test, alternating branch dev (5423) and control dev (5410), 2 rounds.
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
cd /home/user/wt/w3c/kettle
for round in 1 2; do for port in 5423 5410; do
  echo "== round $round port $port $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)"
  KETTLE_PORT=$port timeout 600 npx playwright test tests/w2-room.spec.ts --project=chromium --workers=1 -g "3D failure \(WebGL context lost\)" > $C/runs/ctxloss-r$round-$port.txt 2>&1
  echo "exit $?"; sed 's/\x1b\[[0-9;]*m//g' $C/runs/ctxloss-r$round-$port.txt | grep -E "passed|failed|Error:" | head -3
done; done
