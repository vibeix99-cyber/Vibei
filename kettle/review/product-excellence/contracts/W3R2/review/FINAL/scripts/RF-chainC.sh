#!/bin/bash
# chain C (one gate slot per job, sequential): timer/pwa, 2-tab, console
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
$E/scripts/RF-pwa.sh
$E/scripts/RF-twotab.sh rf-5560 5560 3 g,e,f,a,b,c,d
$E/scripts/RF-console.sh
echo done > $E/runs/chainC.done
