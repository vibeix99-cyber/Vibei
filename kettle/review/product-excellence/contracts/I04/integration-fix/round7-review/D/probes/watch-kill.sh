#!/bin/bash
while ! grep -q "INT 390x844@2-light exit" /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/run2/logs/cap.log; do sleep 0.5; done
pid=$(pgrep -f "std2.sh .*390:844:2:light 390:844:2:dark 375:667:2:light" | head -1)
kill $pid; pkill -f "capture.mjs --base .* --w 390 --h 844 --dpr 2 --theme dark"
sleep 1
rm -rf /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/run2/std/R7/390x844@2-dark /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/run2/std/INT/390x844@2-dark
echo "watcher: first std2 killed at $(date -u +%T) pid $pid"
