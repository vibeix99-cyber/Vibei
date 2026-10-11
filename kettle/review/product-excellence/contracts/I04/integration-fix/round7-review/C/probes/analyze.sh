#!/bin/bash
# Lane C: turn whatever pix / resid / spec15 produced into receipt evidence (safe to re-run; partial output is fine)
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C
C=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/C
T=/home/user/wt/rv7-r7/kettle/.tmp/C
mkdir -p $C/check3-pixels $C/check2-residuals $C/logs
if [ -f $S/pix/pix.jsonl ]; then
  cp $S/pix/pix.jsonl $S/pix/run.log $C/check3-pixels/
  python3 -I $T/pixsum.py $S/pix/pix.jsonl > $C/check3-pixels/SHOTS.md
  node $T/pngdiff.mjs $S/pix $S/pix/diff > $C/check3-pixels/PIXDIFF-all.jsonl 2>&1
  # full-size JPEGs of every capture and every diff map (PNG originals stay in $S/pix)
  node $T/tojpg.mjs $C/check3-pixels/shots $S/pix/*.png > /dev/null
  [ -d $S/pix/diff ] && node $T/tojpg.mjs $C/check3-pixels/diffmaps $S/pix/diff/*.png > /dev/null
fi
if [ -f $S/resid/resid.jsonl ]; then
  cp $S/resid/resid.jsonl $S/resid/run.log $C/check2-residuals/
  python3 -I $T/residsum.py $S/resid/resid.jsonl > $C/check2-residuals/SUMMARY.txt
  ls $S/resid/*.png > /dev/null 2>&1 && node $T/tojpg.mjs $C/check2-residuals/shots $S/resid/*.png > /dev/null
  for d in $S/resid/video-*; do [ -d "$d" ] && mkdir -p $C/check2-residuals/clips && for v in $d/*.webm; do cp "$v" $C/check2-residuals/clips/$(basename $d).webm; done; done
fi
if [ -f $S/resid2/resid.jsonl ]; then
  cp $S/resid2/resid.jsonl $C/check2-residuals/resid2-footer-pend.jsonl; cp $S/resid2.log $C/check2-residuals/resid2.log 2>/dev/null
  python3 -I $T/residsum.py $S/resid2/resid.jsonl > $C/check2-residuals/SUMMARY-footer-pend.txt
  ls $S/resid2/*.png > /dev/null 2>&1 && node $T/tojpg.mjs $C/check2-residuals/shots-footer-pend $S/resid2/*.png > /dev/null
fi
if [ -f $S/resid3/resid.jsonl ]; then
  cp $S/resid3/resid.jsonl $C/check2-residuals/resid3-flash.jsonl; cp $S/resid3.log $C/check2-residuals/resid3.log 2>/dev/null
  ls $S/resid3/*.png > /dev/null 2>&1 && node $T/tojpg.mjs $C/check2-residuals/shots-flash $S/resid3/*.png > /dev/null
fi
if [ -d $S/spec ]; then mkdir -p $C/check2-residuals/spec15; cp $S/spec/*.log $C/check2-residuals/spec15/ 2>/dev/null; fi
du -sh $C
