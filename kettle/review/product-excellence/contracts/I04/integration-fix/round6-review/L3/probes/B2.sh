#!/bin/bash
# B2: check 1 (m1) and check 2 (focus / announcements)
cd /home/user/wt/rv6-r6/kettle/.tmp/L3
Q='cut -c1-500'
run() { echo "##### $(date -u +%H:%M:%S) $*"; "$@" 2>&1 | grep -E "^(RUN|SUMMARY|END|SCENARIO)|Error|error" | $Q; }
run node m1.mjs --rev=R6 --vp=phone
run node m1.mjs --rev=INT --vp=phone
run node m1.mjs --rev=R6 --vp=desktop
run node m1.mjs --rev=INT --vp=desktop
run node focus.mjs --rev=R6
run node focus.mjs --rev=INT
echo "##### $(date -u +%H:%M:%S) B2 done"
