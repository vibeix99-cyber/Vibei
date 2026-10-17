#!/bin/bash
# RF-basics.sh: tsc, vitest, build into my own outDir, playwright --list (no browser)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
cd $W
ST=$E/runs/basics-status.txt; : > $ST
t() { # name cmd...
  local n=$1; shift; local s=$(date +%s)
  { echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; echo "### cmd: $*"; "$@"; echo "### exit=$?"; echo "### end $(date -u +%H:%M:%S) UTC; load: $(uptime)"; } > $E/runs/$n.log.txt 2>&1
  local rc=$(grep -o '### exit=[0-9]*' $E/runs/$n.log.txt | tail -1 | cut -d= -f2)
  echo "$n exit=$rc wall=$(( $(date +%s) - s ))s" | tee -a $ST
}
echo "HEAD $(git rev-parse --short HEAD) src $(git rev-parse --short HEAD:kettle/src) dirty=$(git status --short | wc -l)" | tee -a $ST
t tsc npx tsc --noEmit -p .
t vitest npx vitest run
rm -rf .tmp/RF-dist-build
t build npx vite build --config .tmp/w2.vite.config.ts --outDir .tmp/RF-dist-build --emptyOutDir
npx playwright test --project=chromium --list --reporter=json > $E/json/list-chromium.json 2> $E/runs/list-chromium.err.txt; echo "list exit=$?" | tee -a $ST
npx playwright test --list --reporter=json > $E/json/list-all.json 2> $E/runs/list-all.err.txt; echo "list-all exit=$?" | tee -a $ST
