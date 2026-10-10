#!/bin/bash
# control: the same status-bar probes on INT (they must fail there, as in earlier rounds). sb-int.sh <base> <rev> <outdir>
B=$1; R=$2; O=$3; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle/.tmp/L2
node d1.mjs $B $R $O 1
node d1race.mjs $B 1
node d2.mjs $B $R $O light
node zoom.mjs $B $R $O 1 200 light
