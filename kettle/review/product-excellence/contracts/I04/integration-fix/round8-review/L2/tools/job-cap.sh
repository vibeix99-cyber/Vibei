#!/bin/bash
cd /home/user/wt/r8-trial/kettle
date -u +"queued %T"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane L2 --n 2 -- .tmp/L2/capjob.sh
echo "exit $?"; date -u +"done %T"
