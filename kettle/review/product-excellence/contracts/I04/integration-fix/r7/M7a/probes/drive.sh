#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
P=/home/user/wt/r7a/kettle/.tmp/M7a/probes
cd $P
step() { python3 -I $SL run --lane M7a --n 2 -- ./pair.sh "$@"; }
step lead-ap actionpair-b.mjs E866 5304 -- '{BASE}' '{LABEL}' '{OUT}' "375x667@200:light,375x667@200:dark,844x390@200:light,667x375@150:dark,375x667@150:light,390x844@100:light,375x667@100:light,1440x900@100:light"
step lead-pp pwapair-b.mjs E866 5304 -- '{BASE}' '{LABEL}' '{OUT}' "375x667@200:light,667x375@150:dark"
step r5d1-375L natural-b.mjs R5 5302 -- '{BASE}' '{LABEL}' '{OUT}' 375x667 light 200 600,900,1200,1500,1800 2
step r5d1-844L natural-b.mjs R5 5302 -- '{BASE}' '{LABEL}' '{OUT}' 844x390 light 200 600,900,1200,1500,1800 2
step r5d1-375D natural-b.mjs R5 5302 -- '{BASE}' '{LABEL}' '{OUT}' 375x667 dark 200 600,900,1200,1500,1800 2
step lead-ap2 actionpair-b.mjs E866 5304 -- '{BASE}' '{LABEL}' '{OUT}' "375x667@200:light,375x667@200:dark,844x390@200:light,667x375@150:dark"
echo "ALL PROBES DONE $(date -u +%FT%TZ)"
