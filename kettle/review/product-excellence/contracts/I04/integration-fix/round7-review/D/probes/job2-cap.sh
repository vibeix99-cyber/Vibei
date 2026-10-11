#!/bin/bash
cd /home/user/wt/rv7-r7/kettle
date -u +"queued %T"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane Dcap --n 1 -- .tmp/D/capjob.sh
echo "exit $?"; date -u +"done %T"
