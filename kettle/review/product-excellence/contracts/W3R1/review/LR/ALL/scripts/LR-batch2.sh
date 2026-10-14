#!/bin/bash
# LR-batch2.sh: repeat runs of the failures that passed alone (flake evidence), natural machine load, one playwright process each
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL/rerun
W=/home/user/wt
run() { # label port worktree repeat grep
  local label=$1 port=$2 wt=$3 rep=$4 g=$5
  cd $wt/kettle || return
  local s=$(date +%s)
  rm -rf /home/user/wt/w5tr-all/kettle/.tmp/LR-pw/rr-$label
  env KETTLE_PORT=$port PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$label.json npx playwright test --project=chromium --workers=1 --reporter=list,json --repeat-each=$rep --output=/home/user/wt/w5tr-all/kettle/.tmp/LR-pw/rr-$label -g "$g" > $E/$label.log 2>&1
  local rc=$?
  echo "[$(date -u +%T)] $label port=$port tests-from=$(git -C $wt rev-parse --short HEAD) repeat=$rep playwright-exit=$rc wall=$(( $(date +%s) - s ))s load=$(cut -d' ' -f1 /proc/loadavg)"
}
G1='I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
G2='a pressed segment reads as pressed'
G3='the room a gone notice keeps stays while the page is scrolled'
G4='Delete this brew\? at 390×844 with 200 % text both choices'
run R2-comb-5520 5520 $W/w5tr-all 8 "$G2"
run R2-G-5523 5523 $W/w5tr-g 8 "$G2"
run R1-comb-5520 5520 $W/w5tr-all 4 "$G1"
run R3-comb-5520 5520 $W/w5tr-all 4 "$G3"
run R4-comb-5520 5520 $W/w5tr-all 4 "$G4"
