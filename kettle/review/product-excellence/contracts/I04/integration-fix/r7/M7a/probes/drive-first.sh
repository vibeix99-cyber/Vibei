#!/bin/bash
# Each probe invocation on my revision (:5206) and on its control, one browser at a time.
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
cd /home/user/wt/r7a/kettle/.tmp/M7a/probes
step() { python3 -I $SL run --lane M7a --n 1 -- ./one.sh "$@"; }
AP="375x667@200:light,375x667@200:dark,844x390@200:light,667x375@150:dark,375x667@150:light,390x844@100:light,375x667@100:light,1440x900@100:light"
step lead-ap actionpair-b.mjs E866 5304 -- '{BASE}' '{LABEL}' '{OUT}' "$AP"
step lead-ap actionpair-b.mjs M7a 5206 -- '{BASE}' '{LABEL}' '{OUT}' "$AP"
step lead-pp pwapair-b.mjs E866 5304 -- '{BASE}' '{LABEL}' '{OUT}' "375x667@200:light,667x375@150:dark"
step lead-pp pwapair-b.mjs M7a 5206 -- '{BASE}' '{LABEL}' '{OUT}' "375x667@200:light,667x375@150:dark"
for c in "375x667 light" "844x390 light" "375x667 dark"; do
  set -- $c
  step r5d1-$1-$2 natural-b.mjs R5 5302 -- '{BASE}' '{LABEL}' '{OUT}' $1 $2 200 600,900,1200,1500,1800 2
  step r5d1-$1-$2 natural-b.mjs M7a 5206 -- '{BASE}' '{LABEL}' '{OUT}' $1 $2 200 600,900,1200,1500,1800 2
done
AP2="375x667@200:light,375x667@200:dark,844x390@200:light,667x375@150:dark"
step lead-ap2 actionpair-b.mjs E866 5304 -- '{BASE}' '{LABEL}' '{OUT}' "$AP2"
step lead-ap2 actionpair-b.mjs M7a 5206 -- '{BASE}' '{LABEL}' '{OUT}' "$AP2"
echo "ALL PROBES DONE $(date -u +%FT%TZ)"
