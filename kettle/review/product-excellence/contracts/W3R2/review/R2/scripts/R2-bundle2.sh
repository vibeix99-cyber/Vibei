#!/bin/bash
# one gate slot: (1) the 2-tab control again on :5560 AFTER the integration change (a1e3d04), cases a,b,c,e x5 with the same script;
# (2) extra case (f) pause on a replaced brew, x5, on :5591 and on :5560 (script v2, which only adds case f)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2
W=/home/user/wt/w8tr-g/kettle
cd $W
t() { echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; }
{ t; echo "### cmd: node .tmp/R2-2tab.mjs control-5560-after http://127.0.0.1:5560 5 $E/manual a,b,c,e"; node .tmp/R2-2tab.mjs control-5560-after http://127.0.0.1:5560 5 $E/manual a,b,c,e; echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"; } > $E/runs/manual-2tab-5560-after.log.txt 2>&1
{ t; echo "### cmd: node .tmp/R2-2tab-v2.mjs fix-5591 http://127.0.0.1:5591 5 $E/manual f"; node .tmp/R2-2tab-v2.mjs fix-5591 http://127.0.0.1:5591 5 $E/manual f; echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"; } > $E/runs/manual-2tab-5591-f.log.txt 2>&1
{ t; echo "### cmd: node .tmp/R2-2tab-v2.mjs control-5560-after http://127.0.0.1:5560 5 $E/manual f"; node .tmp/R2-2tab-v2.mjs control-5560-after http://127.0.0.1:5560 5 $E/manual f; echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"; } > $E/runs/manual-2tab-5560-after-f.log.txt 2>&1
echo done > $E/runs/bundle2.done
