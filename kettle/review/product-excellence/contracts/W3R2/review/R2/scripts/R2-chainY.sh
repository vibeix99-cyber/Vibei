#!/bin/bash
# chain Y: the notice suites (two slots, two workers). Submitted to the gate once at most one slot is held by anyone
# (so a waiting two-slot job does not block my own one-slot jobs behind it), or at the latest at 18:50 UTC.
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/scripts/R2-common.sh
while true; do
  held=$(python3 -I $S status | head -1 | sed -n 's/.*held \([0-9]*\).*/\1/p')
  [ "${held:-9}" -le 1 ] && break
  [ "$(date -u +%H%M)" -ge 1850 ] && break
  sleep 10
done
echo "submitting notice at $(date -u +%H:%M:%S), held=$held" > $E/runs/chainY.out.txt
$E/scripts/R2-notice.sh
