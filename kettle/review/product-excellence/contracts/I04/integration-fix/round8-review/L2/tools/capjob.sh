#!/bin/bash
# Lane 2 capture job (runs inside ONE gate job of --n 2: at most two browsers at a time).
# Phase 1: cap-d.mjs (W,N,T profiles) on R8 and INT side by side (one browser each), same fixed instant.
# Phase 2: standard set (capture.mjs, 21 states) per config, R8 and INT side by side.
cd /home/user/wt/r8-trial/kettle
CFGS="844x390@2:light:200,667x375@2:light:200,390x844@2:light:200,375x667@2:light:200,1440x900@1:light:200,390x844@2:dark:200,375x667@2:dark:200,1440x900@1:dark:200,390x844@2:light:100,1440x900@1:light:100"
echo "[$(date -u +%T)] cap-d start"
node .tmp/L2/cap-d.mjs --profiles W,N,T --sides R8 --cfgs $CFGS --root /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/capd > /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/logs/capd-R8.log 2>&1 &
node .tmp/L2/cap-d.mjs --profiles W,N,T --sides INT --cfgs $CFGS --root /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/capd > /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/logs/capd-INT.log 2>&1 &
wait
echo "[$(date -u +%T)] cap-d end"
echo "[$(date -u +%T)] std start"
.tmp/L2/std-L2.sh /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/std 390:844:2:light 375:667:2:light 1440:900:1:light 390:844:2:dark 375:667:2:dark 1440:900:1:dark
echo "[$(date -u +%T)] capjob end"
