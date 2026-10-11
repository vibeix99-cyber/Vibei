#!/bin/bash
# Lane A: run ONE probe invocation (1 browser) and log it. one.sh <series> <probe> <port> [env assignments...] -- <probe args; {BASE} {OUT}>
set -u
SER=$1; PROBE=$2; P=$3; shift 3
ENVS=(); while [ "$1" != "--" ]; do ENVS+=("$1"); shift; done; shift
case $P in 5301) REV=b39202f;; 5302) REV=20671eb;; 5303) REV=0d58c5e;; 5304) REV=e866118;; *) REV=unknown;; esac
EV=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A/runs
O=$EV/$SER; mkdir -p $O
cd /home/user/wt/rv7-r7/kettle/.tmp/A
echo "### START $(date -u +%FT%TZ) series=$SER port=$P rev=$REV probe=$PROBE sha256=$(sha256sum $PROBE | cut -c1-16) env=${ENVS[*]:-} load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
A=(); for a in "$@"; do a=${a//\{BASE\}/http://127.0.0.1:$P}; a=${a//\{OUT\}/$O}; a=${a//\{REV\}/$REV}; A+=("$a"); done
env REV=$REV "${ENVS[@]}" node $PROBE "${A[@]}" >> $O/stdout.txt 2>&1; rc=$?
echo "### END   $(date -u +%FT%TZ) series=$SER rc=$rc load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
