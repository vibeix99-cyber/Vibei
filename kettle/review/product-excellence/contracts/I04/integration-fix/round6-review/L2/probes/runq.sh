#!/bin/bash
# usage: runq.sh <jobs-file> <parallel>   (each line: "<name>|<command>", run through the slot gate, lane L2, n=1)
JOBS=$1; P=${2:-2}
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L2
GATE=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/tools/slots.py
mkdir -p $S/logs
run_one() {
  name="${1%%|*}"; cmd="${1#*|}"
  cd /home/user/wt/rv6-r6/kettle/.tmp/L2
  echo "[$(date -u +%H:%M:%S)] queued $name" >> $S/logs/_queue.log
  eval "python3 -I $GATE run --lane L2 --n 1 -- $cmd" > $S/logs/$name.log 2>&1
  echo "[$(date -u +%H:%M:%S)] finished $name rc=$?" >> $S/logs/_queue.log
}
export -f run_one; export S GATE
cat $JOBS | xargs -d '\n' -P $P -I{} bash -c 'run_one "$@"' _ {}
