#!/bin/bash
cd /home/user/wt/w8t/kettle || exit 9
echo "### start $(date -u +%T)"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane TH --n 1 -- env PAR=3 PAIRS=1440x900-dark-t100/session-running,1440x900-dark-t100/stats-brew-updated,1440x900-dark-t200/session-running,1440x900-dark-t200/today-after-end-notice,1440x900-light-t200/session-running,375x667-dark-t100/end-sheet,375x667-light-t100/end-sheet,390x844-dark-t200/end-sheet,390x844-dark-t200/stats-brew-updated,844x390-light-t200/session-running node .tmp/th/capture3.cjs after2=5582,before3=5560,after3=5582,before4=5560 /home/user/wt/w8t/kettle/.tmp/th/shots3-recap 390x844,375x667,844x390,1440x900
echo "### end $(date -u +%T) exit=$?"
