#!/bin/bash
# sourced: gate helper for lane RF (W3R3 full regression on the merged tree 7e4056d)
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL
W=/home/user/wt/w6-int/kettle
P=$W/.tmp/RF3-pw
mkdir -p $P $E/runs $E/json
# gated <name> <slots> <cmd...>: through slots.py; writes the uptime header and trailer into runs/<name>.log.txt
gated() {
  local name=$1 n=$2; shift 2
  python3 -I $S run --lane RF3 --n $n -- bash -c '
    L=$1; shift
    echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)" > $L
    echo "### cmd: $*" >> $L
    "$@" >> $L 2>&1
    rc=$?
    echo "### end $(date -u +%H:%M:%S) UTC; exit=$rc; load: $(uptime)" >> $L
    exit $rc' _ $E/runs/$name.log.txt "$@"
}
# pw <name> <slots> <port> <workers> <playwright args...>   (runs in the merged-tree worktree)
pw() {
  local name=$1 n=$2 port=$3 workers=$4; shift 4
  ( cd $W && gated $name $n env KETTLE_PORT=$port KETTLE_PWA_PORT=${KETTLE_PWA_PORT:-5495} PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/$name.json npx playwright test "$@" --workers=$workers --reporter=list,json --output=$P/$name )
}
