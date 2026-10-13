#!/bin/bash
# Suites, one browser at a time (slots.py --lane C --n 1). pwa uses my port 5433 (my preview is stopped first).
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
cd /home/user/wt/w3c/kettle
for proj in timer-harness timer-app; do
  echo "== $proj $(date -u +%T)"; KETTLE_PORT=5423 timeout 1800 npx playwright test --project=$proj --workers=1 > $C/runs/$proj.txt 2>&1; echo "$proj exit $?"; tail -3 $C/runs/$proj.txt
done
kill 14331 14305 14285 2>/dev/null; sleep 2; echo "preview 5433 stopped"
echo "== pwa $(date -u +%T)"; KETTLE_PORT=5423 KETTLE_PWA_PORT=5433 timeout 1800 npx playwright test --project=pwa --workers=1 > $C/runs/pwa.txt 2>&1; echo "pwa exit $?"; tail -3 $C/runs/pwa.txt
