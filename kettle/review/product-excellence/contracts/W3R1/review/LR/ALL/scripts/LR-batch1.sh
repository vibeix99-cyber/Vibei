#!/bin/bash
# LR-batch1.sh: every failure of the union rerun alone, one playwright process each, sequential, inside ONE gate slot
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL/rerun
W=/home/user/wt
run() { # label port worktree grep
  local label=$1 port=$2 wt=$3 g=$4
  cd $wt/kettle || return
  local s=$(date +%s)
  rm -rf /home/user/wt/w5tr-all/kettle/.tmp/LR-pw/rr-$label
  env KETTLE_PORT=$port PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$label.json npx playwright test --project=chromium --workers=1 --reporter=list,json --output=/home/user/wt/w5tr-all/kettle/.tmp/LR-pw/rr-$label -g "$g" > $E/$label.log 2>&1
  echo "[$(date -u +%T)] $label port=$port tests-from=$(git -C $wt rev-parse --short HEAD) exit=$? wall=$(( $(date +%s) - s ))s"
}
G1='I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
G2='a pressed segment reads as pressed'
G3='the room a gone notice keeps stays while the page is scrolled'
G4='Delete this brew\? at 390×844 with 200 % text both choices'
run T1-comb-5520 5520 $W/w5tr-all "$G1"
run T2-comb-5520 5520 $W/w5tr-all "$G2"
run T3-comb-5520 5520 $W/w5tr-all "$G3"
run T4-comb-5520 5520 $W/w5tr-all "$G4"
run T1-base-5478 5478 $W/w5tr-all "$G1"
run T2-base-5478 5478 $W/w5tr-all "$G2"
run T3-base-5478 5478 $W/w5tr-all "$G3"
run T4-base-5478 5478 $W/w5tr-all "$G4"
run T1-S-5522 5522 $W/w5tr-s "$G1"
run T1-F-5521 5521 $W/w5tr-f "$G1"
run T2-G-5523 5523 $W/w5tr-g "$G2"
run T3-F-5521 5521 $W/w5tr-f "$G3"
run T4-S-5522 5522 $W/w5tr-s "$G4"
