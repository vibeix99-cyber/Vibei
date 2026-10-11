#!/bin/bash
# Lane B RELAUNCH worker (copy of worker.sh without the fair-share exit): while it holds one slot (one browser at a time)
# it takes the next task from tasks2.txt; stops when tasks2.stop exists or the list ends.
D=/home/user/wt/rv7-r7/kettle/.tmp/B
echo "worker2 start $(date -u +%FT%TZ)"
while true; do
  [ -f $D/tasks2.stop ] && { echo "worker2 stop file $(date -u +%T)"; break; }
  n=$( (flock 9; c=$(cat $D/tasks2.next 2>/dev/null || echo 0); echo $((c+1)) > $D/tasks2.next; echo $((c+1))) 9>$D/tasks2.lock )
  line=$(sed -n "${n}p" $D/tasks2.txt)
  [ -z "$line" ] && break
  echo "worker2 task $n start $(date -u +%T): ${line:0:170}"
  (cd $D && bash -c "$line")
  echo "worker2 task $n end $(date -u +%T) rc=$?"
done
echo "worker2 end $(date -u +%FT%TZ)"
