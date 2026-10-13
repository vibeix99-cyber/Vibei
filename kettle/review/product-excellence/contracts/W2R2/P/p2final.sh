#!/bin/sh
# W2R2 Maker P — same-session BEFORE (control preview :5430, b377c62) / AFTER (my preview :5432) summary captures and
# measurements: routine day (08), task day (04), big day (09) at every given configuration. One browser per
# configuration (run under the slot gate, --n 1); in it, day by day, BEFORE and AFTER pages run side by side
# (--par pair). 375x667 light @100 was taken serially, 375x667 dark @100 and light @200 with all six pages at once
# (--par 1, which later crashed a renderer under load and was dropped): same probe and states, same numbers.
#   sh p2final.sh <out> <cfg> [<cfg> ...]      e.g. 390x844@2:light:100
OUT=$1; shift
DIR=$(dirname "$0")
for c in "$@"; do
  # skip a configuration whose BEFORE and AFTER are both complete (all three days measured, no error)
  n=$(echo "$c" | sed -E 's/^([0-9]+x[0-9]+)@[0-9]+:([a-z]+):([0-9]+)$/\1-\2-t\3/')
  if node -e 'const f=require("fs");process.exit(["BEFORE","AFTER"].every(s=>{try{const m=JSON.parse(f.readFileSync(process.argv[1]+"/"+s+"/"+process.argv[2]+"/probe.json"));return !m.errors.length&&["routine","task","big"].every(d=>m.days[d]&&m.days[d].end)}catch{return false}})?0:1)' "$OUT" "$n"; then echo "skip $n (complete)"; continue; fi
  timeout 900 node "$DIR/p2probe.mjs" --runs BEFORE@http://127.0.0.1:5430,AFTER@http://127.0.0.1:5432 --par pair --out "$OUT" --cfg "$c" --days routine,task,big
done
