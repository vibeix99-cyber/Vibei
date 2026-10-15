#!/bin/bash
# sourced: gate helper. run <name> <slots> <env...> -- <playwright args>
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1
W=/home/user/wt/w6-int/kettle
P=$W/.tmp/LR-pw
mkdir -p $P
# gated NAME SLOTS cmd... : waits for the slots, logs uptime at the start and the end of the run itself
gated() {
  local name=$1 n=$2; shift 2
  python3 -I $S run --lane LR --n $n -- bash -c '
    L=$1; shift
    echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)" > $L
    echo "### cmd: $*" >> $L
    "$@" >> $L 2>&1
    rc=$?
    echo "### end $(date -u +%H:%M:%S) UTC; exit=$rc; load: $(uptime)" >> $L
    exit $rc' _ $E/runs/$name.log.txt "$@"
}
