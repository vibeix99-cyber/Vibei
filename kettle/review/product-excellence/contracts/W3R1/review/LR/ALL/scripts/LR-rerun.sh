#!/bin/bash
# LR-rerun.sh <label> <port> <worktree-for-tests> <spec-file> <grep-regex> : one failing test alone, one gate slot, own --output.
# usage: runs from the given worktree's kettle/ (its tests/ and playwright.config.ts), against the dev server on <port>.
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL/rerun
label=$1; port=$2; wt=$3; spec=$4; grep=$5
cd $wt/kettle || exit 2
out=/home/user/wt/w5tr-all/kettle/.tmp/LR-pw/rerun-$label
rm -rf "$out"
python3 -I $S run --lane LR --n 1 -- env KETTLE_PORT=$port PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$label.json npx playwright test $spec -g "$grep" --project=chromium --workers=1 --reporter=list,json --output=$out > $E/$label.log 2>&1
echo "[$label] exit $? at $(date -u +%T)"
