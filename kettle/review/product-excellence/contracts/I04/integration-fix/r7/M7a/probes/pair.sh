#!/bin/bash
# Run one probe invocation on my revision and on its control at the same time (2 browsers; call under slots --n 2).
# pair.sh <series> <probe.mjs> <controlLabel> <controlPort> -- <probe args with {BASE} {LABEL} {OUT}>
set -u
SER=$1; PROBE=$2; CL=$3; CP=$4; shift 5
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/runs/$SER
mkdir -p $EV
cd /home/user/wt/r7a/kettle/.tmp/M7a/probes
echo "### $(date -u +%FT%TZ) $SER $PROBE sha256=$(sha256sum $PROBE | cut -c1-16) load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
go() { local L=$1 P=$2; local O=$EV/$L; mkdir -p $O
  local args=(); for a in "$@"; do :; done
  local A=(); for a in "${ARGS[@]}"; do a=${a//\{BASE\}/http://127.0.0.1:$P}; a=${a//\{LABEL\}/$L}; a=${a//\{OUT\}/$O}; A+=("$a"); done
  node $PROBE "${A[@]}" >> $O/stdout.txt 2>&1; echo "$L rc=$?" >> $EV/series.log; }
ARGS=("$@")
go M7a 5206 & go $CL $CP & wait
echo "### $(date -u +%FT%TZ) done load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
