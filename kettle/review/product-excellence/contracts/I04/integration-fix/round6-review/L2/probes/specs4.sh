#!/bin/bash
# repeat of the R6 "short screen" a11y test (it failed once on R6 with Settings entries): twice more on R6, once more on INT with R6's spec file
O=$1; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen" --workers=1 --repeat-each=2 --output $O/pw-output-r6 --reporter=list
