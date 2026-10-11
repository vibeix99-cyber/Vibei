#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
EVR=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/runs/close
cd /home/user/wt/r7a/kettle/.tmp/M7a/probes
C="375x667@200:light,375x667@200:dark,390x844@200:light:close,844x390@200:light:close+all,375x667@100:light:close,390x844@100:light:close,844x390@100:light:close,1440x900@100:light:close"
echo "### $(date -u +%FT%TZ) closecheck (locator fix) sha256=$(sha256sum closecheck.mjs | cut -c1-16)" >> $EVR/series.log
python3 -I $SL run --lane M7a --n 1 -- node closecheck.mjs http://127.0.0.1:5226 CTL-49ea1de $EVR "375x667@200:light:all,375x667@200:dark:all,844x390@200:light:all" wheel,touch > $EVR/CTL-49ea1de-all.txt 2>&1 &
python3 -I $SL run --lane M7a --n 1 -- node closecheck.mjs http://127.0.0.1:5206 FINAL $EVR "$C" wheel,touch > $EVR/FINAL.txt 2>&1 &
wait
echo "### $(date -u +%FT%TZ) done" >> $EVR/series.log
