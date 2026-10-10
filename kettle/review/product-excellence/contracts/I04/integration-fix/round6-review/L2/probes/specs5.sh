#!/bin/bash
# the remaining a11y.spec.ts tests that the serial mode skipped after the first dark-axe failure
O=$1; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 npx playwright test --project=chromium tests/a11y.spec.ts -g "pointer targets|keyboard-only|welcome: first brew|live regions" --workers=1 --output $O/pw-output --reporter=list
