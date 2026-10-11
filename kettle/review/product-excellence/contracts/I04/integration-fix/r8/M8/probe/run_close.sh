#!/bin/sh
# Lane C's closecheck2.mjs (unedited copy, sha256 863c0a92...): Close / Ambience / Mute and panel controls, landscape @200.
E=review/product-excellence/contracts/I04/integration-fix/r8/M8/closecheck
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
python3 -I $SLOTS run --lane M8 --n 1 -- node .tmp/M8/closecheck2.mjs http://127.0.0.1:5208 "$1" $E '667x375@200:light,844x390@200:dark,667x375@200:dark,844x390@200:light'
