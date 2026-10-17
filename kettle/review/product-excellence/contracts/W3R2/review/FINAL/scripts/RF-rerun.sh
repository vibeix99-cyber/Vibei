#!/bin/bash
# RF-rerun.sh <label> <port> <repeat> <spec file> <grep regex> [extra playwright args...]: one failed test, one gate slot, --workers=1, own output dir
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
label=$1; port=$2; rep=$3; spec=$4; g=$5; shift 5
cd $W
mkdir -p $E/rerun
gated rerun-$label 1 env KETTLE_PORT=$port PLAYWRIGHT_JSON_OUTPUT_NAME=$E/rerun/$label.json npx playwright test $spec --project=chromium --workers=1 --reporter=list,json --repeat-each=$rep --output=$P/rr-$label -g "$g" "$@"
