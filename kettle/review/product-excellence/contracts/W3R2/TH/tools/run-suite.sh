#!/bin/bash
# run-suite.sh <base|fix> <port> : the notice suite (real specs from tests/) with the console hook, through the slot gate
cd /home/user/wt/w8t/kettle || exit 9
L=$1; P=$2; D=/home/user/wt/w8t/kettle/.tmp/th
rm -f $D/logs/$L-console.jsonl
echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg) lane=$L port=$P src=$(git rev-parse --short HEAD:kettle/src) dirty=$(git status --porcelain kettle/src | wc -l)"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane TH --n 2 -- \
  env KETTLE_PORT=$P TH_CONSOLE_LOG=$D/logs/$L-console.jsonl NODE_OPTIONS="--require $D/console-hook.cjs" PLAYWRIGHT_JSON_OUTPUT_NAME=$D/logs/$L-report.json \
  npx playwright test -c .tmp/th/pw.config.ts tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts \
  --project=chromium --workers=2 --reporter=list,json --output /tmp/th-out-$L
echo "### end $(date -u +%T) exit=$?"
