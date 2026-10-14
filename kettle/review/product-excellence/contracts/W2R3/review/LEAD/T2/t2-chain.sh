#!/bin/bash
# LEAD3 T2 probe chain: one browser per job through the slot gate. Usage: [KIND=x] t2-chain.sh <base> <outdir> <job...> (job = flow@cfg)
BASE=$1; OUT=$2; shift 2
G=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
for job in "$@"; do
  flow=${job%@*}; cfg=${job#*@}; kind=${KIND:-}
  f="$OUT/${flow}${kind:+-$kind}-${cfg//:/-}.json"
  timeout 1800 python3 -I $G run --lane LEAD --n 1 -- node /home/user/wt/w4-base/kettle/.tmp/LEAD3/t2-lead.mjs --base $BASE --cfg $cfg --flow $flow ${kind:+--kind $kind} --out $f 2>&1 | grep -v "^\[slots\]" | tail -2
done
echo CHAIN-DONE
