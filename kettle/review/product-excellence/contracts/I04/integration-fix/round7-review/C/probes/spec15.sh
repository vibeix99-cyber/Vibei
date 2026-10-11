#!/bin/bash
# Lane C third slot (one browser at a time):
#  (1) check 1 footer + panel-end frames: resid.mjs footer group (INT and R7) into $S/resid2
#  (2) item 15: a11y "short screen (375x667)" x3 on R7 (5301, its own spec) and INT (5303, its own spec)
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C
echo "== $(date -u +%H:%M:%S) footer group"; node /home/user/wt/rv7-r7/kettle/.tmp/C/resid.mjs $S/resid2 footer > $S/resid2.log 2>&1; echo "footer exit $?"
cd /home/user/wt/rv7-r7/kettle && echo "== $(date -u +%H:%M:%S) R7 b39202f :5301" && KETTLE_PORT=5301 KETTLE_PWA_PORT=5391 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen" --repeat-each=3 --workers=1 --retries=0 --output $S/spec/out-R7 --reporter=list > $S/spec/R7-a11y-short.log 2>&1; echo "R7 exit $?"
cd /home/user/wt/rv7-int/kettle && echo "== $(date -u +%H:%M:%S) INT 0d58c5e :5303" && KETTLE_PORT=5303 KETTLE_PWA_PORT=5393 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen" --repeat-each=3 --workers=1 --retries=0 --output $S/spec/out-INT --reporter=list > $S/spec/INT-a11y-short.log 2>&1; echo "INT exit $?"
echo "== $(date -u +%H:%M:%S) done"
