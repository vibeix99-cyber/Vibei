#!/bin/bash
# Same-session BEFORE (base preview :5480, 61aba17) / AFTER (fix preview :5481) full-size captures, Monday (recipe day).
cd "$(dirname "$0")/.."
for cfg in 390x844@2:light:100 375x667@2:dark:200 844x390@2:light:200 667x375@2:light:200 1440x900@1:light:100 390x844@2:dark:200; do
  for s in 5480:before 5481:after; do
    node tools/capture.mjs --base http://127.0.0.1:${s%%:*} --out shots/${s##*:} --cfg $cfg --at 2026-10-12T07:40:00.000Z --groups home,end,breakover,summary --rev ${s##*:}
    node tools/states.mjs --base http://127.0.0.1:${s%%:*} --out shots/${s##*:} --cfg $cfg
  done
done
for s in 5480:before 5481:after; do
  node tools/capture.mjs --base http://127.0.0.1:${s%%:*} --out shots/${s##*:}-reduced --cfg 390x844@2:light:100 --at 2026-10-12T07:40:00.000Z --groups end,breakover --reduced 1 --rev ${s##*:}
done
