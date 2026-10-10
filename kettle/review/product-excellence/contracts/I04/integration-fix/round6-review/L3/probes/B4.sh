#!/bin/bash
# B4: DOM-event-based re-measurements (recorder v2): 3b blink2, 3d flash2, 3e back2
cd /home/user/wt/rv6-r6/kettle/.tmp/L3
Q='cut -c1-700'
run() { echo "##### $(date -u +%H:%M:%S) $*"; "$@" 2>&1 | grep -E "^(RUN|SUMMARY|END|SCENARIO)|Error|error" | $Q; }
run node blink2.mjs --rev=R6 --runs=6 --video
run node blink2.mjs --rev=INT --runs=6 --video
run node flash2.mjs --rev=R6 --scenario=start --runs=5 --video
run node flash2.mjs --rev=INT --scenario=start --runs=5 --video
run node flash2.mjs --rev=R6 --scenario=resume --runs=5 --video
run node flash2.mjs --rev=INT --scenario=resume --runs=5 --video
run node flash2.mjs --rev=R6 --scenario=start --w=1440 --h=900 --runs=5
run node flash2.mjs --rev=INT --scenario=start --w=1440 --h=900 --runs=5
run node flash2.mjs --rev=R6 --scenario=resume2 --w=1440 --h=900 --runs=5 --video
run node flash2.mjs --rev=INT --scenario=resume2 --w=1440 --h=900 --runs=5 --video
run node back2.mjs --rev=R6 --runs=8 --text=100 --video
run node back2.mjs --rev=INT --runs=8 --text=100 --video
run node focus.mjs --rev=R6 --only=C6
run node focus.mjs --rev=INT --only=C6
echo "##### $(date -u +%H:%M:%S) B4 done"
