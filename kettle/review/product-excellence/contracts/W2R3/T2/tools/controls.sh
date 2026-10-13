#!/bin/bash
# Control-first reproduction of R5-D1, LEAD-D1 and R7-D1: each control revision (dev :5474, its own worktree) runs the
# toast-room spec of the revision that fixed it (copied in as tests/zz-ctl-<fixrev>.spec.ts), on the defect's test only.
OUT=/home/user/wt/w4t2/kettle/review/product-excellence/contracts/W2R3/T2/runs
run() { # rev spec grep name
  d=/home/user/wt/w4t2-c$1/kettle
  cd $d
  nohup npx vite --config .tmp/w2.vite.config.ts --port 5474 --strictPort --host 127.0.0.1 > $OUT/ctl-$1-vite.log 2>&1 &
  for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:5474/ && break; sleep 0.5; done
  KETTLE_PORT=5474 npx playwright test tests/$2 --project=chromium --workers=1 --reporter=list -g "$3" > $OUT/control-$4-$1.log 2>&1
  echo "$4 on $1: exit $?"
  for p in $(pgrep -f "w2.vite.config.ts --port 5474"); do tr '\0' ' ' < /proc/$p/cmdline | grep -q "wt/w4t2-c$1\|port 5474" && kill $p; done
  sleep 1
}
run 20671eb zz-ctl-e866118.spec.ts "an older toast timing out after the list was scrolled" R5-D1
run e866118 zz-ctl-b39202f.spec.ts "toasts timing out, and an endless action toast" LEAD-D1
run b39202f zz-ctl-61aba17.spec.ts "the update prompt and every toast stay whole" R7-D1
