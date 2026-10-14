#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
$S sh -c 'node LI-overflow.mjs http://127.0.0.1:5520 combined /home/user/wt/w5tr-s/kettle/.tmp/LI/out/overflow; node LI-overflow.mjs http://127.0.0.1:5522 trial /home/user/wt/w5tr-s/kettle/.tmp/LI/out/overflow; node LI-overflow.mjs http://127.0.0.1:5478 base /home/user/wt/w5tr-s/kettle/.tmp/LI/out/overflow' > LI-overflow.log 2>&1; echo "exit $?" >> LI-overflow.log
