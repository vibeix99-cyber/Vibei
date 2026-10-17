#!/bin/bash
# the two failures of the full run, each rerun once on :5560 (quietly = alone in its process, one worker, no other change)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
$E/scripts/RF-rerun.sh F1-integrity-I03-5560 5560 1 tests/integrity.spec.ts 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
$E/scripts/RF-rerun.sh F2-w3-settings-5560 5560 1 tests/w3-settings.spec.ts 'preferences persist across a reload; Reset everything returns each to its default'
echo done > $E/runs/rerun-full.done
