#!/bin/bash
# chain E (one gate slot per capture run, sequential): 390x844 light, 390x844 dark, 1440x900 light, DPR 1, 100 %
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
for cfg in 390:844:1:light 390:844:1:dark 1440:900:1:light; do
  tag=$(echo $cfg | awk -F: '{print $1"x"$2"@"$3"-"$4}')
  gated cap-$tag 1 bash $E/scripts/RF-cap.sh $cfg
done
echo done > $E/runs/chainE.done
