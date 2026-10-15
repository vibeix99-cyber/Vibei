#!/bin/bash
BD=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/BACKDROP/scripts
out=/tmp/w6bd-cap/hq; mkdir -p $out
(cd /home/user/wt/w4-final/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $BD/BD-freeze.mjs $BD/BD-hq.mjs --base http://127.0.0.1:5488 --out $out --q $1) > $out/hq-$1.log 2>&1
cat $out/hq-$1.log
