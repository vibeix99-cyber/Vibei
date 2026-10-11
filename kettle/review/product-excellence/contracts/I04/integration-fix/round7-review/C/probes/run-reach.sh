#!/bin/bash
# usage: run-reach.sh <base> <rev> <outdir> <runtag>
base=$1; rev=$2; out=$3; tag=$4
mkdir -p $out
for sz in 375x667 390x844 844x390; do
  echo "== $(date -u +%H:%M:%S) $rev $sz start" 
  node /home/user/wt/rv7-r7/kettle/.tmp/C/m7b/reach.mjs $base $rev $out $sz light,dark 200
  echo "== $(date -u +%H:%M:%S) $rev $sz exit $?"
done
