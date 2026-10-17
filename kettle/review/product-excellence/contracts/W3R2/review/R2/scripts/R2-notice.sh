#!/bin/bash
# the notice suites on the trial :5591, two workers, two gate slots
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/scripts/R2-common.sh
pw notice-suite-5591 2 5591 2 tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium
echo done > $E/runs/notice.done
