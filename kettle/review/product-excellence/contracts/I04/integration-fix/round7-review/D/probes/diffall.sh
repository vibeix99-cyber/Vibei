#!/bin/bash
# usage: diffall.sh <root containing R7/ and INT/> <outfile.jsonl> <diffdir>   (node only, no browser)
ROOT=$1; OUT=$2; DD=$3
: > $OUT
for d in $(ls $ROOT/R7); do
  [ -d $ROOT/INT/$d ] || { echo "{\"cfg\":\"$d\",\"missing\":\"INT dir\"}" >> $OUT; continue; }
  node /home/user/wt/rv7-r7/kettle/.tmp/D/pixdiff-node.cjs $ROOT/R7/$d $ROOT/INT/$d --diffdir $DD/$d | sed "s/^{/{\"cfg\":\"$d\",/" >> $OUT
done
