#!/bin/bash
# L1 runner: run1.sh <series> <probe> <port> -- <probe args; {BASE} {OUT} {REV}>   (1 browser per invocation)
set -u
SER=$1; PROBE=$2; P=$3; shift 4
case $P in 5301) REV=b39202f;; 5302) REV=20671eb;; 5303) REV=0d58c5e;; 5304) REV=e866118;; 5305) REV=49ea1de;; 5306) REV=9ff0d04;; *) REV=unknown;; esac
EV=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round8-review/L1/runs
O=$EV/$SER; mkdir -p $O
cd /home/user/wt/r8-trial/kettle/.tmp/L1
echo "### START $(date -u +%FT%TZ) series=$SER url=http://127.0.0.1:$P port=$P rev=$REV probe=$PROBE sha256=$(sha256sum $PROBE | cut -c1-16) env=GESTURE:${GESTURE:-}/STOP_ON_FAIL:${STOP_ON_FAIL:-}/KEY:${KEY:-} args=$* load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
A=(); for a in "$@"; do a=${a//\{BASE\}/http://127.0.0.1:$P}; a=${a//\{OUT\}/$O}; a=${a//\{REV\}/$REV}; A+=("$a"); done
env REV=$REV node $PROBE "${A[@]}" >> $O/stdout.txt 2>&1; rc=$?
echo "### END   $(date -u +%FT%TZ) series=$SER rc=$rc load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
