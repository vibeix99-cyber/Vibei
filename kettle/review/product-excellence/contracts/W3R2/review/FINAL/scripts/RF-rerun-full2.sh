#!/bin/bash
# the failures of the second full run, each rerun once on :5560 (alone, one worker), then the neighbour experiment
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
$E/scripts/RF-rerun.sh G1-chai3d-default-tier-5560 5560 1 tests/chai3d.spec.ts 'default tier on this machine \(auto → low on SwiftShader\)'
$E/scripts/RF-rerun.sh G2-integrity-I03-phone390-5560 5560 1 tests/integrity.spec.ts 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
$E/scripts/RF-rerun.sh G3-integrity-I03-desktop1440-5560 5560 1 tests/integrity.spec.ts 'I03 storage-full warning is a banner in the page \(desktop 1440×900\) nothing over the brew'
echo done > $E/runs/rerun-full2.done
