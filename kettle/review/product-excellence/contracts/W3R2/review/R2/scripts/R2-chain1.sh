#!/bin/bash
# chain 1 (one slot per job, one worker): item 4, item 3, item 2 on the trial :5591
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/scripts/R2-common.sh
pw race-staletab-5591 1 5591 1 tests/w3r2-stale-tab.spec.ts tests/w3-intention-race.spec.ts --project=chromium
pw w2-home-5591 1 5591 1 tests/w2-home.spec.ts --project=chromium
pw integrity-5591 1 5591 1 tests/integrity.spec.ts --project=chromium
pw integrity309-x10-5591 1 5591 1 tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --project=chromium --repeat-each=10
pw timer-pwa-5591 1 5591 1 --project=timer-harness --project=timer-app --project=pwa
echo done > $E/runs/chain1.done
