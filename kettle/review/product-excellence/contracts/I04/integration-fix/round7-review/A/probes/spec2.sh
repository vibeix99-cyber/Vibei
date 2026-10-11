#!/bin/bash
# spec.sh <port> <spec> : runs one repo spec (chromium project, 1 worker) against the server on <port>; log into A/specs/
P=$1; SPEC=$2; G=$3; case $P in 5301) REV=b39202f;; 5303) REV=0d58c5e;; *) REV=unknown;; esac
EV=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A/specs; mkdir -p $EV
N=$(basename $SPEC .spec.ts)-$REV-g
cd /home/user/wt/rv7-r7/kettle
echo "### START $(date -u +%FT%TZ) spec=$SPEC grep="$G" sha256=$(sha256sum tests/$SPEC | cut -c1-16) port=$P rev=$REV load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/specs.log
KETTLE_PORT=$P KETTLE_PWA_PORT=5312 npx playwright test --project=chromium tests/$SPEC -g "$G" --workers=1 --output /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/A/pw-$N > $EV/$N.log 2>&1; rc=$?
echo "### END   $(date -u +%FT%TZ) spec=$SPEC port=$P rev=$REV rc=$rc load=$(cut -d' ' -f1-3 /proc/loadavg) | $(grep -E '^ +[0-9]+ (passed|failed|skipped|flaky)' $EV/$N.log | tr -s ' ' | tr '\n' ' ')" | tee -a $EV/specs.log
