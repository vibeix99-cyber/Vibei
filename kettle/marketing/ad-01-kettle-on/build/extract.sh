#!/usr/bin/env bash
# Rebuild the compositor's working folder from the saved masters (no re-recording, no paid generation).
# usage (from marketing/ad-01-kettle-on): build/extract.sh <work-dir>   e.g. ../../.tmp/ad
set -euo pipefail
W=${1:?work dir}; FF=${FFMPEG:-ffmpeg}
for s in a-home-focus b-whistle c-break; do
  mkdir -p "$W/rec/$s"
  "$FF" -hide_banner -loglevel error -y -i "sources/app/$s.mp4" -q:v 2 -start_number 0 "$W/rec/$s/f%04d.jpg"
done
cp sources/app/events.json "$W/rec/"
mkdir -p "$W/genf" "$W/ov/end"
"$FF" -hide_banner -loglevel error -y -i generated/g1-desk-0.mp4 -vf fps=30 "$W/genf/f%04d.png"
cp sources/art/overlays/* "$W/ov/"
"$FF" -hide_banner -loglevel error -y -i sources/art/endcard.mp4 -start_number 0 "$W/ov/end/f%04d.png"
echo "work folder ready: $W"
