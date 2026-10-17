#!/bin/bash
# R2-runs.sh: for each run log, the gate-side start/end/load lines and the Playwright JSON summary
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2
for l in $E/runs/*.log.txt; do
  n=$(basename $l .log.txt)
  case $n in tsc|vitest|smoke*) continue;; esac
  echo "== $n"; grep -E "^### (start|end)" $l | sed 's/load: *[0-9: ]*up [^,]*,.*load average/load/' | cut -c1-160
  [ -f $E/json/$n.json ] && node $E/scripts/R2-jsum.mjs $E/json/$n.json
done
