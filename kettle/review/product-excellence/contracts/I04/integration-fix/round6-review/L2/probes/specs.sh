#!/bin/bash
# the three repo specs on R6 through one worker (the gate slot is held by the caller): specs.sh <outdir>
O=$1; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 npx playwright test --project=chromium tests/statusbar.spec.ts tests/toast-room.spec.ts tests/a11y.spec.ts --workers=1 --output $O/pw-output --reporter=list
