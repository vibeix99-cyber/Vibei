#!/bin/bash
# console check on the preview :5570 (desktop and phone), plus dev :5560 desktop (extra); one gate slot each
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
mkdir -p $E/console
for spec in "preview5570-desktop http://127.0.0.1:5570 desktop" "preview5570-phone http://127.0.0.1:5570 phone" "dev5560-desktop http://127.0.0.1:5560 desktop"; do
  set -- $spec
  gated console-$1 1 node $E/scripts/RF3-console.mjs $1 $2 $E/console $3
done
echo done > $E/runs/console.done
