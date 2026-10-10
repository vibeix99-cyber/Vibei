#!/bin/bash
# extra R6 reading runs: landscape 125/150 % stacks (R2-D3), 568x320 @100 % (R2-D3), 667x375 @200 % by touch / flick. extra.sh <base> <rev> <outdir>
B=$1; R=$2; O=$3; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle/.tmp/L2
node read.mjs $B $R $O 667x375 light,dark 125,150 alone,stack wheel20 1 1
node read.mjs $B $R $O 568x320 light,dark 100 alone,stack wheel20,touch 1 1
node read.mjs $B $R $O 667x375 light,dark 200 alone,stack touch,flick 1 1
