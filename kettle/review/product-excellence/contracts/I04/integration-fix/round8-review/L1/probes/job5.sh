#!/bin/bash
# Check 3a: R5-D1 race (natural-a2), wheel, 200 %, 375x667 light then dark: control R5 :5302 (STOP at first strict, <=15), then R8 :5306 6 runs
R=/home/user/wt/r8-trial/kettle/.tmp/L1/run1.sh
for c in "375x667 light 375L" "375x667 dark 375D"; do set -- $c
  STOP_ON_FAIL=1 GESTURE=wheel $R r5d1-ctl-$3 natural-a2.mjs 5302 -- {BASE} R5 {OUT} $1 $2 200 600,900,1200,1500,1800 3
  GESTURE=wheel $R r5d1-r8-$3 natural-a2.mjs 5306 -- {BASE} R8 {OUT} $1 $2 200 0,600,1200,1800,2400,3000 1
done
