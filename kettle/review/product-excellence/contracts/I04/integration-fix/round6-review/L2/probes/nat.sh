#!/bin/bash
# R5-D1 retest: natural sequence with real toast timers. nat.sh <base> <rev> <outdir>
B=$1; R=$2; O=$3; mkdir -p $O
cd /home/user/wt/rv6-r6/kettle/.tmp/L2
for W in 600 1200 1800; do
  NAT=1 NATWAIT=$W node read.mjs $B $R $O 375x667,844x390,667x375 light,dark 200 stack wheel20 1 2
done
NAT=1 NATWAIT=1200 node read.mjs $B $R $O 667x375,844x390 light,dark 150 stack wheel20 1 2
NAT=1 NATWAIT=1200 node read.mjs $B $R $O 844x390,667x375 light,dark 200 stack touch 1 2
