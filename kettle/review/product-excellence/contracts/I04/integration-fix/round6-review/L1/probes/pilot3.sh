#!/bin/bash
cd /home/user/wt/rv6-r6/kettle/.tmp/L1
python3 -I pair.py --series pilot3-race-x --probe race-x.mjs --env POST=100 -- '{BASE}' '{LABEL}' '{OUT}' 375x667 light 200 wheel 3
