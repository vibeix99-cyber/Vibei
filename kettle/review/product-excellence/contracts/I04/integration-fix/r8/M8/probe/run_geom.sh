#!/bin/sh
# Portrait geometry rows (geom mode) on the fix (:5208) then the control b39202f (:5301), one browser at a time.
E=review/product-excellence/contracts/I04/integration-fix/r8/M8
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
CFG='375x667@100:light,375x667@100:dark,375x667@200:light,375x667@200:dark,390x844@100:light,390x844@100:dark,390x844@200:light,390x844@200:dark'
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/accept.mjs http://127.0.0.1:5208 "$1" $E/geom "$CFG" geom
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/accept.mjs http://127.0.0.1:5301 b39202f $E/geom "$CFG" geom
