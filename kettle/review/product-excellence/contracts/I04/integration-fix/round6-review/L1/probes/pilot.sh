#!/bin/bash
# pilot: one run of each probe on both revs (375x667 light)
cd /home/user/wt/rv6-r6/kettle/.tmp/L1
P="python3 -I pair.py"
$P --series pilot-natural-x --probe natural-x.mjs --video -- '{BASE}' '{LABEL}' '{OUT}' 375x667 light 200 1200 1
$P --series pilot-race --probe race.mjs --env POST=100 -- '{BASE}' '{LABEL}' '{OUT}' 375x667 light 200 wheel 1
$P --series pilot-race-x --probe race-x.mjs --env POST=100 --video -- '{BASE}' '{LABEL}' '{OUT}' 375x667 light 200 wheel 1
$P --series pilot-repro6-sel --probe repro6-sel.mjs --env IDX=8 -- '{BASE}' '{LABEL}' '{OUT}' '375x667@200 light' 1 0
for g in fling fine kbd; do $P --series pilot-gesture-$g --probe gesture6.mjs --env GESTURE=$g -- '{BASE}' '{LABEL}' '{OUT}' '375x667@200 light' 1 0; done
