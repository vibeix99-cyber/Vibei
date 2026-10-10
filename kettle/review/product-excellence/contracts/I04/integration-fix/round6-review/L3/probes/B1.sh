#!/bin/bash
# B1: timing-sensitive probes (sequential, one browser): 3a cause, 3b blink, 3d flash, 3e back
cd /home/user/wt/rv6-r6/kettle/.tmp/L3
Q='cut -c1-700'
run() { echo "##### $(date -u +%H:%M:%S) $*"; "$@" 2>&1 | grep -E "^(RUN|SUMMARY|END|SCENARIO)|Error|error" | $Q; }
run node scrollhold.mjs --rev=R6 --text=100
run node scrollhold.mjs --rev=INT --text=100
run node blink.mjs --rev=R6 --runs=5 --video
run node blink.mjs --rev=INT --runs=5 --video
run node flash.mjs --rev=R6 --scenario=start --runs=5 --video
run node flash.mjs --rev=INT --scenario=start --runs=5 --video
run node flash.mjs --rev=R6 --scenario=resume --runs=5 --video
run node flash.mjs --rev=INT --scenario=resume --runs=5 --video
run node back.mjs --rev=R6 --runs=8 --text=100 --video
run node back.mjs --rev=INT --runs=8 --text=100 --video
run node back.mjs --rev=R6 --runs=4 --text=200
run node back.mjs --rev=INT --runs=4 --text=200
echo "##### $(date -u +%H:%M:%S) B1 done"
