#!/bin/bash
# Lane C relaunch job 2: R7 (:5301) focus running + paused break (top bar + Ambience/Mute frames and taps), then the unchanged M7b toastcheck.
# Order = value order (so a stop at the budget leaves the most important configurations): the two configurations M7a did not re-run + 375x667 light first.
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C/close
P=/home/user/wt/rv7-r7/kettle/.tmp/C/closecheck2.mjs
cd /home/user/wt/rv7-r7/kettle
run() { echo "== $(date -u +%T) R7 paused,focus $1"; node $P http://127.0.0.1:5301 b39202f $S/r7 "$1" paused,focus measure,tap > $S/r7-p2-$2.log 2>&1; echo "exit $? $(date -u +%T)"; }
run "375x667@200:light,390x844@200:dark,667x375@200:light,667x375@200:dark" a
run "375x667@200:dark,390x844@200:light,844x390@200:light,844x390@200:dark" b
run "375x667@100:light,1440x900@100:light" c
echo "== $(date -u +%T) M7b toastcheck.mjs (unchanged, sha 3380304f) on R7 at the configurations M7a did not re-run"
T=/home/user/wt/rv7-r7/kettle/.tmp/C/m7b/toastcheck.mjs
for c in "390x844 dark" "667x375 light" "667x375 dark"; do node $T http://127.0.0.1:5301 R7 $S/toastcheck $c >> $S/toastcheck.log 2>&1; echo "toastcheck $c exit $?"; done
echo "== $(date -u +%T) done"
