#!/bin/bash
# timer-harness, timer-app and pwa (pwa on port 5495, probed free first; the serving process is sampled during the run; my own leftover killed by explicit PID)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
PORT=5495
LOG=$E/runs/timer-pwa.pre-post.txt
{
echo "### $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg); HEAD $(git -C $W rev-parse --short HEAD) src $(git -C $W rev-parse --short HEAD:kettle/src)"
for p in $PORT 5193; do if curl -s -m 2 -o /dev/null http://127.0.0.1:$p/; then echo "PORT $p ANSWERS before the run"; else echo "port $p free before the run"; fi; done
if curl -s -m 2 -o /dev/null http://127.0.0.1:$PORT/; then echo "ABORT: $PORT in use"; exit 3; fi
} > $LOG 2>&1
grep -q ABORT $LOG && exit 3
( for i in $(seq 1 1500); do for p in $(ls /proc | grep -E '^[0-9]+$'); do c=$(tr '\0' ' ' </proc/$p/cmdline 2>/dev/null); case "$c" in *"preview --outDir"*"--port $PORT"*) echo "$(date -u +%T) serving pid $p cwd $(readlink /proc/$p/cwd) :: ${c:0:150}";; esac; done 2>/dev/null; sleep 3; done ) > $E/runs/timer-pwa.listener.txt &
SAMP=$!
KETTLE_PWA_PORT=$PORT pw timer-pwa 1 5560 1 --project=timer-harness --project=timer-app --project=pwa
kill $SAMP 2>/dev/null
{
echo "### after the run $(date -u +%T)"
for p in $(ls /proc | grep -E '^[0-9]+$'); do c=$(tr '\0' ' ' </proc/$p/cmdline 2>/dev/null); case "$c" in *"--port $PORT"*) if [ "$(readlink /proc/$p/cwd)" = $W ]; then echo "killing my leftover pid $p :: ${c:0:120}"; kill $p; fi;; esac; done 2>/dev/null
sleep 1
if curl -s -m 2 -o /dev/null http://127.0.0.1:$PORT/; then echo "port $PORT STILL ANSWERING after cleanup"; else echo "port $PORT free after cleanup"; fi
} >> $LOG 2>&1
echo done > $E/runs/timer-pwa.done
