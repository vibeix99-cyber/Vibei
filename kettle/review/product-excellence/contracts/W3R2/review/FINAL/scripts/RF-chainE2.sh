#!/bin/bash
# run 2 of the captures, quiet machine: 390x844 light, 390x844 dark, 1440x900 light; before, after, after again, before again. One slot per config.
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
for cfg in 390:844:1:light 390:844:1:dark 1440:900:1:light; do
  tag=$(echo $cfg | awk -F: '{print $1"x"$2"@"$3"-"$4}')
  gated cap2-$tag 1 env RF_FOUR=1 RF_CAPROOT=/home/user/wt/w6-int/kettle/.tmp/RF-cap2 bash $E/scripts/RF-cap.sh $cfg
done
echo done > $E/runs/chainE2.done
