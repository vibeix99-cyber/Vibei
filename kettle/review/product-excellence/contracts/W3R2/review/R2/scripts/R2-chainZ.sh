#!/bin/bash
# chain Z: the bundle (integrity, integrity:309 x10, timer-pwa, w2-home) in one gate slot
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/scripts/R2-common.sh
python3 -I $S run --lane R2 --n 1 -- bash $E/scripts/R2-bundle.sh
