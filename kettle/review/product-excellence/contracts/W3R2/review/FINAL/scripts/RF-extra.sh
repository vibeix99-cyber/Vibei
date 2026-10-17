#!/bin/bash
# extras on the two full-run failures: x5 each alone (quiet), then x5 each under 2 workers + 4 burners
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
$E/scripts/RF-rerun.sh F1-integrity-I03-x5-5560 5560 5 tests/integrity.spec.ts 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
$E/scripts/RF-rerun.sh F2-w3-settings-x5-5560 5560 5 tests/w3-settings.spec.ts 'preferences persist across a reload; Reset everything returns each to its default'
cd $W
gated rerun-F12-x5-loaded 2 bash $E/scripts/RF-extra-inner.sh
echo done > $E/runs/extra.done
