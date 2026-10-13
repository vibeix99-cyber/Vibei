#!/bin/bash
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
cd /home/user/wt/w3c/kettle
G='200 % text, 375×667 light: Break|200 % text, 390×844 dark: Break|rapid live resizes at large text leave the page unzoomed \(dark\)|3D failure \(WebGL context lost\)'
for port in 5423 5410; do
  echo "== port $port $(date -u +%T)"
  KETTLE_PORT=$port timeout 1200 npx playwright test tests/break-reach.spec.ts tests/statusbar.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 -g "$G" > $C/runs/rerun4-$port.txt 2>&1; echo "exit $?"; tail -8 $C/runs/rerun4-$port.txt | sed 's/\x1b\[[0-9;]*m//g'
done
