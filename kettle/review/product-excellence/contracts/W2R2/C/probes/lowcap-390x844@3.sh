#!/bin/bash
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
cd $C/probes
for look in light:day dark:day light:night; do
  ex=""; [ "$look" = "light:night" ] && ex="&nooktime=night"
  timeout 900 node capture.mjs --base http://127.0.0.1:5430 --label BEFORE --out $C/low/captures/BEFORE --cfg 390x844@3:$look --tier default --extra "$ex"
  timeout 900 node capture.mjs --base http://127.0.0.1:5433 --label AFTER --out $C/low/captures/AFTER --cfg 390x844@3:$look --tier default --extra "$ex"
done
