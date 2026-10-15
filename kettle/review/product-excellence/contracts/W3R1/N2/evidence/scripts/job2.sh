#!/bin/bash
cd /home/user/wt/w7n/kettle
B=http://127.0.0.1:5560
node .tmp/n2/t2-lead-instr.mjs --base $B --cfg 390x844:light:100 --flow historytrace --out /tmp/n2/historytrace-instr-390x844-light-100.json > /tmp/n2/historytrace-instr-390.out.txt 2>&1
node .tmp/n2/t2-lead-instr.mjs --base $B --cfg 1440x900:light:200 --reduced 1 --flow historytrace --out /tmp/n2/historytrace-instr-1440x900-light-200r.json > /tmp/n2/historytrace-instr-1440.out.txt 2>&1
MODE=mid IDX=2 RACE=40 node .tmp/n2/trace.mjs $B 1440 900 200 1 0 /tmp/n2/race-1440-200r.json > /tmp/n2/race.out.txt 2>&1
echo done > /tmp/n2/job2.done
