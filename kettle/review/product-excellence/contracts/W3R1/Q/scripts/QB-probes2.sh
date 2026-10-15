#!/bin/bash
S=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/scripts
NB=6 $S/QB-probe-load.sh 5545 f1-x20-nb6 20 .tmp/q-probes/f1-probe.spec.ts -g 'Q probe two tabs'
