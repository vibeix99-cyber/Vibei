#!/bin/bash
cd /home/user/wt/rv6-r6/kettle/.tmp/L1
for g in fling fine kbd; do python3 -I pair.py --series pilotg-$g --probe natural-g.mjs --env GESTURE=$g -- '{BASE}' '{LABEL}' '{OUT}' 375x667 light 200 1200 1; done
