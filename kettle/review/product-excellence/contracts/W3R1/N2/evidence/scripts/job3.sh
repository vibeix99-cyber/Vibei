#!/bin/bash
cd /home/user/wt/w7n/kettle
B=http://127.0.0.1:5560
for cfg in "1440 900 100 0 0" "1440 900 200 1 0" "390 844 100 0 1"; do
  set -- $cfg
  CLOSE=save MODE=mid IDX=2 node .tmp/n2/trace.mjs $B $1 $2 $3 $4 $5 /tmp/n2/save-$1-$3-r$4.json >> /tmp/n2/save.out.txt 2>&1
done
echo done > /tmp/n2/job3.done
