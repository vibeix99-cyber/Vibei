#!/bin/bash
# a11y.spec.ts is serial: a failed test skips the rest. (1) R6: the four toast-over-control tests alone. (2) INT: its own "short screen" test (its worktree's spec) to see whether the Settings entries that fail on R6 also fail there.
O=$1; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 npx playwright test --project=chromium tests/a11y.spec.ts -g "never cover" --workers=1 --output $O/pw-output-r6-toasts --reporter=list
cd /home/user/wt/rv6-int/kettle
KETTLE_PORT=5303 KETTLE_PWA_PORT=5313 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen" --workers=1 --output $O/pw-output-int-short --reporter=list
# (3) R6's own spec file against the INT server: do the Settings entries fail on the INT app too?
cd /home/user/wt/rv6-r6/kettle
KETTLE_PORT=5303 KETTLE_PWA_PORT=5313 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen" --workers=1 --output $O/pw-output-r6spec-on-int --reporter=list
