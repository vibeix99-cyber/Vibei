#!/bin/bash
S=/tmp/claude-0/ln-scratch; cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
CB=http://127.0.0.1:5330; TB=http://127.0.0.1:5350; TD=http://127.0.0.1:5340
run() { python3 -I $SLOTS run --lane LN --n 1 -- "$@" >> $S/chain6.log 2>&1; }
run node .tmp/LN/p375.mjs --base $CB --label ctrl --out $S/p375 --runs 3
run node .tmp/LN/p375.mjs --base $TB --label trial --out $S/p375 --runs 3
run node .tmp/LN/room2.mjs --base $CB --label ctrl --out $S/r2 --cfgs 375x667@2:light:200 --groups static,nowebgl
run node .tmp/LN/room2.mjs --base $TB --label trial --out $S/r2 --cfgs 375x667@2:light:200 --groups static,nowebgl
run node .tmp/LN/net.mjs --base $TB --label trial --out $S/net
run node .tmp/LN/net.mjs --base $CB --label ctrl --out $S/net
run node .tmp/LN/room2.mjs --base $TB --label trial --out $S/r2 --cfgs 390x844@3:light:100
run node .tmp/LN/room2.mjs --base $CB --label ctrl --out $S/r2 --cfgs 844x390@3:light:200 --groups static
run node .tmp/LN/room2.mjs --base $TB --label trial --out $S/r2 --cfgs 844x390@3:light:200 --groups static
run node .tmp/LN/net.mjs --base $TD --label trialdev --out $S/net
echo CHAIN6-DONE >> $S/chain6.log
