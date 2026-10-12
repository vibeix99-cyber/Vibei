#!/bin/bash
# One slot job (n 2), in priority order. Logs to $L; one line per step on stdout.
L=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w2/S/pw
P=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w2/S/probe
OUT=/home/user/wt/w2s/kettle/review/product-excellence/contracts/W2/S/captures
CFGS=390x844@2:light:100,390x844@2:dark:100,390x844@2:light:200,390x844@2:dark:200,375x667@2:light:100,375x667@2:dark:100,375x667@2:light:200,375x667@2:dark:200,844x390@2:light:100,844x390@2:dark:100,844x390@2:light:200,844x390@2:dark:200,1440x900@1:light:100,1440x900@1:dark:100,1440x900@1:light:200,1440x900@1:dark:200
cd /home/user/wt/w2s/kettle
echo "start $(date -u +%T)"
# 1. the new spec on 90a11e5 (:5310) — must fail
KETTLE_PORT=5310 KETTLE_PWA_PORT=5231 timeout 600 npx playwright test tests/w2-summary.spec.ts --project=chromium --workers=2 --output $L/ctl > $L/spec-on-90a11e5.log 2>&1; echo "spec-on-90a11e5 exit $? $(date -u +%T)"
# 2. on the branch (:5211) — must pass
KETTLE_PORT=5211 KETTLE_PWA_PORT=5231 timeout 600 npx playwright test tests/w2-summary.spec.ts --project=chromium --workers=2 --output $L/mine > $L/spec-on-branch.log 2>&1; echo "spec-on-branch exit $? $(date -u +%T)"
# 3. AFTER big-day captures on the final build (:5231) alongside the existing a11y spec (one browser each)
(cd $P && timeout 1200 node cap.mjs --base http://127.0.0.1:5231 --rev "cdc6035 (kettle/src 6750571)" --days bigday --out $OUT/AFTER --cfgs $CFGS > $L/cap-bigday.log 2>&1; echo "after-bigday exit $? $(date -u +%T)") &
KETTLE_PORT=5211 KETTLE_PWA_PORT=5231 timeout 1200 npx playwright test tests/a11y.spec.ts --project=chromium --workers=1 --output $L/a11y > $L/a11y.log 2>&1; echo "a11y exit $? $(date -u +%T)"
wait
# 4. the whole chromium suite on the branch
pkill -f "vite preview --config .tmp/w2.vite.config.ts --outDir .tmp/dist-after --port 5231"; sleep 1
KETTLE_PORT=5211 KETTLE_PWA_PORT=5231 timeout 2400 npx playwright test --project=chromium --workers=2 --output $L/chromium > $L/chromium.log 2>&1; echo "chromium exit $? $(date -u +%T)"
# 5. timer + pwa
KETTLE_PORT=5211 KETTLE_PWA_PORT=5231 timeout 1500 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=2 --output $L/timerpwa > $L/timerpwa.log 2>&1; echo "timer/pwa exit $? $(date -u +%T)"
# 6. same-session BEFORE captures on 90a11e5 (:5330)
(cd $P && timeout 1800 node cap.mjs --base http://127.0.0.1:5330 --rev "90a11e5 (kettle/src 42e106d), production preview" --out $OUT/BEFORE-90a11e5 --cfgs $CFGS > $L/cap-before.log 2>&1); echo "before-caps exit $? $(date -u +%T)"
