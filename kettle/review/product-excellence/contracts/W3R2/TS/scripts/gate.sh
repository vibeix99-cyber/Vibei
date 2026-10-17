#!/bin/bash
# gate.sh <n slots> <logfile> <cmd...>: run <cmd...> in /home/user/wt/w8q/kettle through the slot gate (lane TS),
# writing "### start / ### end" lines with the time, the exit code and the load average (1, 5, 15 min) around it.
N=$1; LOG=$2; shift 2
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
export WT=/home/user/wt/w8q/kettle
python3 -I "$SLOTS" run --lane TS --n "$N" -- bash -c '
  cd "$WT" || exit 9
  echo "### start $(date -u +%T) load $(cut -d" " -f1-3 /proc/loadavg)"
  echo "### cmd: $*"
  "$@"; rc=$?
  echo "### end $(date -u +%T) exit=$rc load $(cut -d" " -f1-3 /proc/loadavg)"
  exit $rc' _ "$@" > "$LOG" 2>&1
