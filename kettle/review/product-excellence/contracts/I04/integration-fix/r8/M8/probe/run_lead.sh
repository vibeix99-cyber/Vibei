#!/bin/sh
# The lead's toastroom2.mjs (unedited copy, sha256 7123da04...) on the fix (:5208) and on INT 0d58c5e (:5303).
E=review/product-excellence/contracts/I04/integration-fix/r8/M8/lead-probe
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
CFG='667x375@200:light,667x375@200:dark,844x390@200:light,844x390@200:dark'
for k in update arrive; do
  python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/toastroom2.mjs http://127.0.0.1:5208 "$1" $E "$CFG" $k
done
for k in update arrive; do
  python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/toastroom2.mjs http://127.0.0.1:5303 0d58c5e $E "$CFG" $k
done
