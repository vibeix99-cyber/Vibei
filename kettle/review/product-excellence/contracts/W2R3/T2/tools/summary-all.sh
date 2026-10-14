#!/bin/bash
# T2-D1 proof: BEFORE base dev :5470 (61aba17; its preview :5480 has no way to raise a notice) and AFTER fix preview :5481.
cd "$(dirname "$0")/.."
for cfg in 375x667@2:light:100 375x667@2:dark:100 375x667@2:light:200 375x667@2:dark:200 390x844@2:light:100 390x844@2:dark:100 390x844@2:light:200 390x844@2:dark:200 844x390@2:light:100 844x390@2:dark:100 667x375@2:light:100 667x375@2:dark:100 1440x900@1:light:100 1440x900@1:dark:100; do
  node tools/summary.mjs --base http://127.0.0.1:${SRV:-5481} --out fix/${OUT:-after} --cfg $cfg ${FIX:+--fix 1}
done
