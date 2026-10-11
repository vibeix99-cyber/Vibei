#!/bin/bash
# copy the Check-4 evidence into the receipt folder and regenerate the tables
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/C
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C/close
P=/home/user/wt/rv7-r7/kettle/.tmp/C
mkdir -p $R/check4-close/ctl-49ea1de-5305 $R/check4-close/r7-b39202f-5301 $R/check4-close/m7b-toastcheck-unchanged $R/check4-close/logs
cp -u $S/ctl/* $R/check4-close/ctl-49ea1de-5305/ 2>/dev/null
cp -u $S/r7/* $R/check4-close/r7-b39202f-5301/ 2>/dev/null
cp -u $S/toastcheck/*.jsonl $R/check4-close/m7b-toastcheck-unchanged/ 2>/dev/null; (cd $R/check4-close/m7b-toastcheck-unchanged && for f in $S/toastcheck/*.png; do [ -e "${f%.png}.jpg" ] || true; done; node $P/tojpg.mjs . $S/toastcheck/*.png > /dev/null 2>&1)
cp -u $S/toastcheck.log $R/check4-close/m7b-toastcheck-unchanged/ 2>/dev/null
cp -u $S/*.log $R/check4-close/logs/ 2>/dev/null
python3 -I $P/closesum.py $S/ctl/closecheck2-49ea1de.jsonl > $R/check4-close/TABLES-control-49ea1de.md
python3 -I $P/closesum.py $S/r7/closecheck2-b39202f.jsonl > $R/check4-close/TABLES-R7-b39202f.md
cp -u $P/runC4.sh $R/probes/runC4.sh.NEVER-RAN; cp -u $P/m7b/toastcheck.mjs $R/probes/m7b-toastcheck.mjs; cp -u $P/gen4c.py $P/runC3.sh $R/probes/; cp -u $P/closecheck2.mjs $P/closecheck-lead.mjs $P/closesum.py $P/runC1.sh $P/runC2.sh $P/publish_c4.sh $R/probes/
(cd $R/probes && sha256sum *.mjs *.py *.sh > SHA256SUMS.txt)
du -sh $R
