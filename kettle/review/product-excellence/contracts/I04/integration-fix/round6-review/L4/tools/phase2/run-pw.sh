#!/bin/bash
# usage: run-pw.sh <name> <playwright args...>
NAME=$1; shift
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review
P=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4/p2
cd /home/user/wt/rv6-r6/kettle
echo "START $(date -u +%FT%TZ)" > $P/$NAME.log
echo "CMD (cwd /home/user/wt/rv6-r6/kettle): KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 python3 -I slots.py run --lane L4 --n 2 -- npx playwright test $* --workers=2 --output $P/out-$NAME" >> $P/$NAME.log
KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 python3 -I $R/tools/slots.py run --lane L4 --n 2 -- npx playwright test "$@" --workers=2 --output $P/out-$NAME >> $P/$NAME.log 2>&1
echo "EXIT $? $(date -u +%FT%TZ)" >> $P/$NAME.log
