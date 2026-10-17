#!/bin/bash
# sourced: gate helper for lane R2. gated <name> <slots> <cmd...>  (writes the uptime header and trailer into runs/<name>.log.txt)
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2
W=/home/user/wt/w8tr-g/kettle
P=$W/.tmp/R2-pw
mkdir -p $P
gated() {
  local name=$1 n=$2; shift 2
  python3 -I $S run --lane R2 --n $n -- bash -c '
    L=$1; shift
    echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)" > $L
    echo "### cmd: $*" >> $L
    "$@" >> $L 2>&1
    rc=$?
    echo "### end $(date -u +%H:%M:%S) UTC; exit=$rc; load: $(uptime)" >> $L
    exit $rc' _ $E/runs/$name.log.txt "$@"
}
# pw <name> <slots> <port> <workers> <playwright args...>
pw() {
  local name=$1 n=$2 port=$3 workers=$4; shift 4
  ( cd $W && gated $name $n env KETTLE_PORT=$port KETTLE_PWA_PORT=5498 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/$name.json npx playwright test "$@" --workers=$workers --reporter=list,json --output=$P/$name )
}
