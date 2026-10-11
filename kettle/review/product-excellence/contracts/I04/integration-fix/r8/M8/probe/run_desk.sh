#!/bin/sh
# Desktop sanity rows (geom mode, wheel): 1440x900 at 100 % and 200 %, the fix and the control.
E=review/product-excellence/contracts/I04/integration-fix/r8/M8/geom-desktop
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
CFG='1440x900@100:light,1440x900@200:light,1440x900@200:dark'
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/accept.mjs http://127.0.0.1:5208 "$1" $E "$CFG" geom
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/accept.mjs http://127.0.0.1:5301 b39202f $E "$CFG" geom
