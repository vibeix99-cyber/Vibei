#!/bin/bash
# Same-session BEFORE (:5330, 90a11e5 production preview) then AFTER (:5231, pe/w2-summary production preview), one browser at a time.
cd "$(dirname "$0")"
OUT=/home/user/wt/w2s/kettle/review/product-excellence/contracts/W2/S/captures
CFGS=390x844@2:light:100,390x844@2:dark:100,390x844@2:light:200,390x844@2:dark:200,375x667@2:light:100,375x667@2:dark:100,375x667@2:light:200,375x667@2:dark:200,844x390@2:light:100,844x390@2:dark:100,844x390@2:light:200,844x390@2:dark:200,1440x900@1:light:100,1440x900@1:dark:100,1440x900@1:light:200,1440x900@1:dark:200
REV_AFTER="$1"
node cap.mjs --base http://127.0.0.1:5231 --rev "$REV_AFTER, production preview" --out $OUT/AFTER --cfgs $CFGS
node cap.mjs --base http://127.0.0.1:5330 --rev "90a11e5 (kettle/src 42e106d), production preview" --out $OUT/BEFORE-90a11e5 --cfgs $CFGS
