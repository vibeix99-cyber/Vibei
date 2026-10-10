#!/bin/bash
# B5: gap fillers: INT phone "End within the first minute" (errored in B2), 3e at 200 % with the v2 recorder
cd /home/user/wt/rv6-r6/kettle/.tmp/L3
Q='cut -c1-700'
run() { echo "##### $(date -u +%H:%M:%S) $*"; "$@" 2>&1 | grep -E "^(RUN|SUMMARY|END|SCENARIO)|Error|error" | $Q; }
run node m1.mjs --rev=INT --vp=phone --only=endFirstMinute
run node m1.mjs --rev=R6 --vp=phone --only=endFirstMinute
run node back2.mjs --rev=INT --runs=4 --text=200
run node back2.mjs --rev=R6 --runs=4 --text=200
echo "##### $(date -u +%H:%M:%S) B5 done"
