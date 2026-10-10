#!/bin/bash
# mksbs.sh <config> <id> [BEFORE|INTfresh]  (R6 | other | diff) into L4/diffs/sbs/
CFG=$1; ID=$2; KIND=${3:-BEFORE}
L=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4
B=/home/user/Vibei/kettle/review/product-excellence/integration/wave1/captures
mkdir -p $L/diffs/sbs
F=$(ls $L/captures/R6/$CFG | grep "^$ID-" | head -1)
if [ "$KIND" = BEFORE ]; then OTHER=$B/$CFG/$F; DIFF=$L/diffs/R6-vs-BEFORE/$CFG/$F; JS=$L/diffs/R6-vs-BEFORE-$CFG.json; else OTHER=$L/captures/INT/$CFG/$F; DIFF=$L/diffs/R6-vs-INTfresh/$CFG/$F; JS=$L/diffs/R6-vs-INTfresh-$CFG.json; fi
BB=$(python3 -I -c "import json;r=[x for x in json.load(open('$JS')) if x['file']=='$F'][0];print(' '.join(map(str,r['bbox'])) if r.get('bbox') else '')")
cd /home/user/wt/rv6-r6/kettle && node .tmp/L4/sbs.mjs $L/captures/R6/$CFG/$F $OTHER $DIFF $L/diffs/sbs/$KIND-$CFG-${F%.png}.png $BB
