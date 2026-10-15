#!/bin/bash
S=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/scripts
NB=6 $S/QB-probe-load.sh 5478 f1-base-x20-nb6 20 .tmp/q-probes/f1-probe.spec.ts -g 'Q probe two tabs'
FILES=ns-att2 REP=2 $S/QB-att.sh
FILES=ns-base REP=1 $S/QB-att.sh
