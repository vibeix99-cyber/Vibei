#!/bin/sh
# W2H-D1 control-first: H's trial acf1c6a (:5474) then the fix (:5471), same configurations, same probe.
cd "$(dirname "$0")/.."
for cfg in 390x844@2:light:100 390x844@2:light:200 375x667@2:light:100 375x667@2:light:200 375x667@2:dark:200 844x390@2:light:100 844x390@2:light:200 667x375@2:light:100 667x375@2:light:200; do
  for s in ${SERVERS:-5474:control-acf1c6a 5471:fix}; do
    node tools/endtap.mjs --base http://127.0.0.1:${s%%:*} --cfg $cfg --out probes/endtap-${s##*:}-$(echo $cfg | tr '@:' '--').json > /dev/null
  done
done
