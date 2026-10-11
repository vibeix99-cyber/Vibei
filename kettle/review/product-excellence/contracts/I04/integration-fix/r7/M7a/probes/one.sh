#!/bin/bash
# Run one probe invocation on ONE revision (1 browser; call under slots --n 1).
# one.sh <series> <probe.mjs> <label> <port> -- <probe args with {BASE} {LABEL} {OUT}>
set -u
SER=$1; PROBE=$2; L=$3; P=$4; shift 5
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/runs/$SER
O=$EV/$L; mkdir -p $O
cd /home/user/wt/r7a/kettle/.tmp/M7a/probes
echo "### $(date -u +%FT%TZ) $SER $L :$P $PROBE sha256=$(sha256sum $PROBE | cut -c1-16) load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
A=(); for a in "$@"; do a=${a//\{BASE\}/http://127.0.0.1:$P}; a=${a//\{LABEL\}/$L}; a=${a//\{OUT\}/$O}; A+=("$a"); done
node $PROBE "${A[@]}" >> $O/stdout.txt 2>&1; echo "$L rc=$? $(date -u +%FT%TZ) load=$(cut -d' ' -f1-3 /proc/loadavg)" | tee -a $EV/series.log
