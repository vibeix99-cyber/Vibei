#!/bin/bash
cd /home/user/wt/rv6-r6/kettle/.tmp/L3
for rev in R6 INT; do
  for text in 100 200; do
    node kbd.mjs --rev=$rev --text=$text --key=Tab --max=45 --video 2>&1 | grep -E "^(RUN|RESULT)"
    node kbd.mjs --rev=$rev --text=$text --key=Shift+Tab --max=45 2>&1 | grep -E "^(RUN|RESULT)"
  done
  node kbd.mjs --rev=$rev --text=200 --theme=dark --key=Tab --max=45 2>&1 | grep -E "^(RUN|RESULT)"
  node kbd.mjs --rev=$rev --text=100 --theme=dark --key=Tab --max=45 2>&1 | grep -E "^(RUN|RESULT)"
done
