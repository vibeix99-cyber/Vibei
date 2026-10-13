#!/bin/bash
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LT/logs
R=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LT/runs
cd /home/user/wt/w3tr-t2/kettle/.tmp/LT && ./batch.sh listD $R/D.jsonl
run() { name=$1; dir=$2; port=$3; shift 3; echo "== $(date -u +%T) $name: KETTLE_PORT=$port npx playwright test $*" >> $L/specs-index.log; (cd $dir && KETTLE_PORT=$port timeout 900 npx playwright test "$@" --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/lt-scratch/pw-$name > $L/spec-$name.log 2>&1); echo "   rc=$? $(date -u +%T) $(grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped)' $L/spec-$name.log | tr -s ' ' | tr '\n' ';')" >> $L/specs-index.log; }
FX=/home/user/wt/w3tr-t2/kettle; CT=/home/user/wt/w3-base/kettle
run int1090 $FX 5446 tests/integrity.spec.ts:1090 --repeat-each=3
run int1004-1440 $FX 5446 tests/integrity.spec.ts:1004 --grep 1440 --repeat-each=3
run toastroom-w2home $FX 5446 tests/toast-room.spec.ts tests/w2-home.spec.ts
run statusbar114-dark $FX 5446 tests/statusbar.spec.ts:114 --grep dark --repeat-each=3
run int637-fix $FX 5446 tests/integrity.spec.ts:637 --repeat-each=3
run int637-control $CT 5410 tests/integrity.spec.ts:637 --repeat-each=3
run breakreach184-mon $FX 5446 tests/break-reach.spec.ts:184
