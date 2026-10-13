#!/bin/bash
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
until grep -q "freed" $C/perf/perf-390x844.log; do sleep 5; done
cd /home/user/wt/w3c/kettle && npx vite build --config .tmp/w2.vite.config.ts --outDir /tmp/rv7-servers/dist-w3c > $C/runs/build-after.txt 2>&1; echo "build exit $?"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane C --n 1 -- $C/probes/chain1.sh
