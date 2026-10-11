#!/bin/bash
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
$S ./spec2.sh 5303 a11y.spec.ts "never covers? the (session controls|break-over controls)"
echo CHAIN7 DONE $(date -u +%FT%TZ)
