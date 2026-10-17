#!/bin/bash
# repro.sh <base|fix> <port>
cd /home/user/wt/w8t/kettle || exit 9
L=$1; P=$2; D=/home/user/wt/w8t/kettle/.tmp/th
rm -f $D/logs/repro-$L-console.jsonl
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane TH --n 1 -- \
  env KETTLE_PORT=$P TH_TESTDIR=$D TH_CONSOLE_LOG=$D/logs/repro-$L-console.jsonl NODE_OPTIONS="--require $D/console-hook.cjs" \
  npx playwright test -c .tmp/th/pw.config.ts repro.spec.ts --project=chromium --workers=1 --output /tmp/th-out-repro-$L
