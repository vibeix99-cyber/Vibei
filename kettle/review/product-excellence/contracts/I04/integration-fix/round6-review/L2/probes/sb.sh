#!/bin/bash
# status-bar family (D1, R2-D1, D2, R4-D2) on one revision: sb.sh <base> <rev> <outdir>
B=$1; R=$2; O=$3; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle/.tmp/L2
node d1.mjs $B $R $O 2
node d1race.mjs $B 2
node d2.mjs $B $R $O light,dark
node zoom.mjs $B $R $O 3 200,150 light,dark
