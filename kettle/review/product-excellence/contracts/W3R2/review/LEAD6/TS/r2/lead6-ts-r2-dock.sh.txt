#!/bin/bash
# LEAD-6: COVER=dock on the fix (89396e8), three separate invocations (the injection is once per worker), 1 worker, :5560,
# trial 2. Reason: in I-inject the first new/dock run's injection did not take (the dock read `sticky` right after data-tall
# was set: the app's own settle removed it), so that run proved nothing.
K=/home/user/wt/w8tr-q2/kettle; L=$K/.tmp/lead6; cd $K || exit 9
for i in 1 2 3; do
  echo "######## J-new-dock-$i: KETTLE_PORT=5560 COVER=dock npx playwright test -c .tmp/lead6/ts-pw.config.ts ts/new/notice-strip.spec.ts --project=chromium --workers=1 -g 844x390 dark 200"
  echo "### start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
  env KETTLE_PORT=5560 COVER=dock npx playwright test -c .tmp/lead6/ts-pw.config.ts ts/new/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=$L/out/J-new-dock-$i -g 'real input \(844×390 dark 200 %\)'
  echo "### end $(date -u +%T) exit=$? load $(cut -d' ' -f1-3 /proc/loadavg)"
  echo
done
