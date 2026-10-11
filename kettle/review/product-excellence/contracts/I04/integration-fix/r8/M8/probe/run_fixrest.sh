#!/bin/sh
# Fix-only rows for revision $1 (:5208): portrait geometry, desktop geometry, the lead's probe, AFTER captures.
E=review/product-excellence/contracts/I04/integration-fix/r8/M8
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/accept.mjs http://127.0.0.1:5208 "$1" $E/geom '375x667@100:light,375x667@100:dark,375x667@200:light,375x667@200:dark,390x844@100:light,390x844@100:dark,390x844@200:light,390x844@200:dark' geom
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/accept.mjs http://127.0.0.1:5208 "$1" $E/geom-desktop '1440x900@100:light,1440x900@200:light,1440x900@200:dark' geom
for k in update arrive; do
  python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/toastroom2.mjs http://127.0.0.1:5208 "$1" $E/lead-probe '667x375@200:light,667x375@200:dark,844x390@200:light,844x390@200:dark' $k
done
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/capture.mjs http://127.0.0.1:5208 "AFTER-$1" $E/captures '667x375@200:light,667x375@200:dark,844x390@200:light,844x390@200:dark,375x667@200:light,390x844@200:light'
