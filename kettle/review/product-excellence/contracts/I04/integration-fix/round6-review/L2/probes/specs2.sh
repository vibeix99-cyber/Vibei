#!/bin/bash
# a11y.spec.ts runs serially: when the dark axe test fails the rest are skipped, so run the D4-related tests on their own, then the dark axe test again for its error text
O=$1; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen|never cover" --workers=1 --output $O/pw-output-a --reporter=list
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 npx playwright test --project=chromium tests/a11y.spec.ts -g "axe.*dark" --workers=1 --output $O/pw-output-b --reporter=list
