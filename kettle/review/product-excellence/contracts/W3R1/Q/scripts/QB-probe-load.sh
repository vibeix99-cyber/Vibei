#!/bin/bash
# F1 (I01 two tabs) and X-1 (I03 banner) instrumented probes under load: --workers=2 plus 4 CPU burners (own PIDs,
# stopped at the end), as review/FINAL/scripts/LR-stress.sh. Usage: QB-probe-load.sh <port> <tag> <rep> <specs...>
P=$1; TAG=$2; REP=$3; shift 3
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/probe
mkdir -p $E
cd /home/user/wt/w5q/kettle
PIDS=""
for i in $(seq 1 ${NB:-4}); do ( while :; do :; done ) & PIDS="$PIDS $!"; done
echo "$TAG burners:$PIDS start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
env KETTLE_PORT=$P PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$TAG.json npx playwright test --config .tmp/q-probes/pw.config.ts "$@" --workers=2 --repeat-each=$REP --reporter=list,json --output=.tmp/Q-pw/probe-$TAG > $E/$TAG.log.txt 2>&1
echo "$TAG exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
kill $PIDS 2>/dev/null; wait 2>/dev/null
echo "$TAG burners stopped $(date -u +%T)" >> $E/chain.log.txt
