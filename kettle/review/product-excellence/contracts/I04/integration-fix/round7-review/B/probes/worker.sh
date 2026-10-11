#!/bin/bash
# Lane B worker: while it holds a slot (one browser at a time), takes the next task from tasks.txt (prioritised) and runs it.
# Fair share (orchestrator, 03:58): a lane holds at most one job while another lane waits. My waiters were queued before the
# gate changed (old slots.py code), so this worker enforces it itself: if another Lane B worker is already running and
# any other lane is waiting, it exits at once and gives the slot back.
D=/home/user/wt/rv7-r7/kettle/.tmp/B
exec 8>$D/worker.lock
if ! flock -n 8; then
  if python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py status | grep -q "^WAIT [^B]"; then
    echo "worker $1 exits at once $(date -u +%T): another Lane B worker holds a slot and other lanes wait (fair share)"; exit 0
  fi
fi
echo "worker $1 start $(date -u +%FT%TZ)"
while true; do
  n=$( (flock 9; c=$(cat $D/tasks.next 2>/dev/null || echo 0); echo $((c+1)) > $D/tasks.next; echo $((c+1))) 9>$D/tasks.lock )
  line=$(sed -n "${n}p" $D/tasks.txt)
  [ -z "$line" ] && break
  echo "worker $1 task $n start $(date -u +%T): ${line:0:160}"
  (cd $D && bash -c "$line")
  echo "worker $1 task $n end $(date -u +%T) rc=$?"
done
echo "worker $1 end $(date -u +%FT%TZ)"
