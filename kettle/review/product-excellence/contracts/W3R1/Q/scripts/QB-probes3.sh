#!/bin/bash
S=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/scripts
NB=6 $S/QB-probe-load.sh 5545 f1-stack-x12-nb6 12 .tmp/q-probes/f1-probe.spec.ts -g 'Q probe two tabs'
