#!/bin/bash
# lane 1 (one slot): timer/pwa, integrity (all), integrity:309 x10, race spec, w2-home. Dev server :5560 (integration).
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
pw() { local name=$1; shift; gated $name 1 env KETTLE_PORT=5560 KETTLE_PWA_PORT=5499 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/$name.json npx playwright test "$@" --workers=1 --reporter=list,json --output=$P/$name; }
pw timer-pwa --project=timer-harness --project=timer-app --project=pwa
pw integrity-5560 tests/integrity.spec.ts --project=chromium
pw integrity309-x10 tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --project=chromium --repeat-each=10
pw race-5560 tests/w3-intention-race.spec.ts --project=chromium
pw w2-home tests/w2-home.spec.ts --project=chromium
echo done > $E/runs/lane1.done
