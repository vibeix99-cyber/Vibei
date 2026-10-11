#!/bin/sh
# BEFORE (b39202f :5301) and AFTER (the fix :5208) captures, same session, frozen clock.
E=review/product-excellence/contracts/I04/integration-fix/r8/M8/captures
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
CFG='667x375@200:light,667x375@200:dark,844x390@200:light,844x390@200:dark,375x667@200:light,390x844@200:light'
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/capture.mjs http://127.0.0.1:5301 BEFORE-b39202f $E "$CFG"
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/capture.mjs http://127.0.0.1:5208 "AFTER-$1" $E "$CFG"
