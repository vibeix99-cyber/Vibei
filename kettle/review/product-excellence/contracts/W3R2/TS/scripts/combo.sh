#!/bin/bash
# Fix round: the remaining acceptance runs in ONE slot hold (2 slots), one after the other: light 200 % reduced x10 under load,
# the diagnostic copy x10 under load, the whole notice file (no burners), :156 x10 under load in both timer projects.
S=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/scripts
for w in light diag3 whole timer; do
  echo "######## combo: $w $(date -u +%T)"
  $S/underload2.sh $w
done
