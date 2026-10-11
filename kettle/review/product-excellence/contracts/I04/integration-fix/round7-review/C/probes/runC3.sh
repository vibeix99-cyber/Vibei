#!/bin/bash
# Lane C relaunch job 3 (lowest priority, additions):
#  (1) control 49ea1de :5305, paused break + focus running (Ambience / Mute frames and taps) at 667x375 @200 light and 375x667 @200 light
#  (2) M7b's own tests/break-reach.spec.ts on R7 (:5301), its own spec, one worker, no retries
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C/close
mkdir -p $S/spec
cd /home/user/wt/rv7-r7/kettle
echo "== $(date -u +%T) CONTROL 49ea1de :5305 paused,focus @200 light 667x375, 375x667"
node /home/user/wt/rv7-r7/kettle/.tmp/C/closecheck2.mjs http://127.0.0.1:5305 49ea1de $S/ctl "667x375@200:light,375x667@200:light" paused,focus measure,tap > $S/ctl-p2.log 2>&1; echo "ctl p2 exit $?"
echo "== $(date -u +%T) R7 b39202f :5301 break-reach.spec.ts"
KETTLE_PORT=5301 KETTLE_PWA_PORT=5392 npx playwright test --project=chromium tests/break-reach.spec.ts --workers=1 --retries=0 --output $S/spec/out-breakreach --reporter=list > $S/spec/R7-break-reach.log 2>&1; echo "R7 exit $?"
echo "== $(date -u +%T) done"
