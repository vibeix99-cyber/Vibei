#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a
cd /home/user/wt/r7a/kettle/.tmp/M7a/probes
step() { python3 -I $SL run --lane M7a --n 1 -- ./one.sh "$@"; }
# wait for the lead-ap run already in flight
while pgrep -f "actionpair-b.mjs http://127.0.0.1:5206" > /dev/null; do sleep 3; done
step lead-pp pwapair-b.mjs M7a 5206 -- '{BASE}' '{LABEL}' '{OUT}' "375x667@200:light,667x375@150:dark"
for c in "375x667 light" "844x390 light" "375x667 dark"; do set -- $c
  step r5d1-$1-$2 natural-b.mjs M7a 5206 -- '{BASE}' '{LABEL}' '{OUT}' $1 $2 200 600,900,1200,1500,1800 2
done
mkdir -p $EV/m7b-on-final
for c in "375x667 light" "844x390 dark"; do set -- $c
  python3 -I $SL run --lane M7a --n 1 -- node toastcheck.mjs http://127.0.0.1:5206 FINAL $EV/m7b-on-final/toast-check $1 $2 >> $EV/m7b-on-final/toastcheck.log 2>&1
done
python3 -I $SL run --lane M7a --n 1 -- node reach.mjs http://127.0.0.1:5206 FINAL $EV/m7b-on-final/reach 375x667 light,dark 200 >> $EV/m7b-on-final/reach.log 2>&1
echo "ALL P5 DONE $(date -u +%FT%TZ)"
