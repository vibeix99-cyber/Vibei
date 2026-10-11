#!/bin/bash
# Lane C relaunch job 1: control first (49ea1de :5305), then R7 (:5301) Break's over / Close pass over all 10 configurations
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C/close
P=/home/user/wt/rv7-r7/kettle/.tmp/C/closecheck2.mjs
cd /home/user/wt/rv7-r7/kettle
echo "== $(date -u +%T) CONTROL 49ea1de :5305 375x667@200 light over-carried"
CLOSETAPS=top3,end3,end1 node $P http://127.0.0.1:5305 49ea1de $S/ctl "375x667@200:light" over-carried measure,closetap > $S/ctl.log 2>&1; echo "ctl exit $?"
echo "== $(date -u +%T) R7 pass 1 (over-carried) @200 x 8"
CLOSETAPS=top3,end3 node $P http://127.0.0.1:5301 b39202f $S/r7 "375x667@200:light,375x667@200:dark,390x844@200:light,390x844@200:dark,667x375@200:light,667x375@200:dark,844x390@200:light,844x390@200:dark" over-carried measure,closetap > $S/r7-p1-200.log 2>&1; echo "r7 p1 200 exit $?"
echo "== $(date -u +%T) R7 pass 1 (over-carried) @100 x 2"
CLOSETAPS=top3,end3 node $P http://127.0.0.1:5301 b39202f $S/r7 "375x667@100:light,1440x900@100:light" over-carried measure,closetap > $S/r7-p1-100.log 2>&1; echo "r7 p1 100 exit $?"
echo "== $(date -u +%T) done"
