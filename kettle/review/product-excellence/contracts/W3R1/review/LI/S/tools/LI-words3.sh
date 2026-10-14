#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
$S sh -c 'ONLY=custom node LI-words.mjs http://127.0.0.1:5522 trial-c /home/user/wt/w5tr-s/kettle/.tmp/LI/out/words; ONLY=custom node LI-words.mjs http://127.0.0.1:5478 base-c /home/user/wt/w5tr-s/kettle/.tmp/LI/out/words' > LI-words-custom.log 2>&1; echo "exit $?" >> LI-words-custom.log
