#!/bin/bash
# runs INSIDE the gate (one slot): probe the PWA port, run timer-harness + timer-app + pwa with the PWA spec on that port, sample who serves it, kill only my own leftover by explicit PID, probe again
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL
W=/home/user/wt/w6-int/kettle
PORT=5495
cd $W
echo "### port check $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg); HEAD $(git rev-parse --short HEAD) src $(git rev-parse --short HEAD:kettle/src) dirty=$(git status --short | wc -l)"
for p in $PORT 5193; do if curl -s -m 2 -o /dev/null http://127.0.0.1:$p/; then echo "PORT $p ANSWERS before the run"; else echo "port $p free before the run (curl: no answer)"; fi; done
if curl -s -m 2 -o /dev/null http://127.0.0.1:$PORT/; then echo "ABORT: port $PORT in use"; exit 3; fi
echo "listeners on $PORT per /proc/net/tcp: $(awk -v P=$(printf '%04X' $PORT) 'NR>1 && toupper(substr($2,index($2,":")+1,4))==P && $4=="0A"{n++} END{print n+0}' /proc/net/tcp)"
( for i in $(seq 1 1500); do for p in $(ls /proc | grep -E '^[0-9]+$'); do c=$(tr '\0' ' ' </proc/$p/cmdline 2>/dev/null); case "$c" in *"preview --outDir"*"--port $PORT"*) echo "$(date -u +%T) serving pid $p cwd $(readlink /proc/$p/cwd) :: ${c:0:150}";; esac; done 2>/dev/null; sleep 3; done ) > $E/runs/timer-pwa.listener.txt &
SAMP=$!
env KETTLE_PORT=5560 KETTLE_PWA_PORT=$PORT PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/timer-pwa.json npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list,json --output=$W/.tmp/RF-pw/timer-pwa
rc=$?
kill $SAMP 2>/dev/null
echo "### playwright exit=$rc; after the run $(date -u +%T)"
for p in $(ls /proc | grep -E '^[0-9]+$'); do c=$(tr '\0' ' ' </proc/$p/cmdline 2>/dev/null); case "$c" in *"--port $PORT"*) if [ "$(readlink /proc/$p/cwd)" = "$W" ]; then echo "killing my leftover pid $p :: ${c:0:120}"; kill $p; fi;; esac; done 2>/dev/null
sleep 2
if curl -s -m 2 -o /dev/null http://127.0.0.1:$PORT/; then echo "port $PORT STILL ANSWERING after cleanup"; else echo "port $PORT free after cleanup"; fi
exit $rc
