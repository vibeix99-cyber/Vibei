#!/bin/bash
# the pwa project again on trial 2, on a clean PWA port (5496): the first run and its two reruns used 5498, where a preview server left over from the first pass (PID 409, worktree w8tr-g) was still listening
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/rerun
W=/home/user/wt/w8tr-g2/kettle
cd $W
name=pwa-5601-clean-port
{
  echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"
  echo "### cmd: KETTLE_PORT=5601 KETTLE_PWA_PORT=5496 npx playwright test --project=pwa --workers=1"
  env KETTLE_PORT=5601 KETTLE_PWA_PORT=5496 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/$name.json npx playwright test --project=pwa --workers=1 --reporter=list,json --output=$W/.tmp/RR-pw/$name
  echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"
  echo "leftover preview servers on 5496 after the run:"; ps aux | grep "[v]ite preview.*5496" | cut -c1-200
} > $E/runs/$name.log.txt 2>&1
echo done > $E/runs/pwa2.done
