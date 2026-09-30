#!/usr/bin/env bash
# Rebuild the compositor's working folder from the saved sources (no re-recording, no paid generation).
# usage (from marketing/ad-02-chais-deal): build/extract.sh <work-dir>   e.g. ../../.tmp/ad2
# The drawn layers (ov/) come from render-stage.mjs; this script covers the app masters and the generated clips.
set -euo pipefail
W=${1:?work dir}; FF=${FFMPEG:-ffmpeg}
for s in a-home-focus b-whistle c-break; do
  mkdir -p "$W/rec/$s"
  "$FF" -hide_banner -loglevel error -y -i "sources/app/$s.mp4" -q:v 2 -start_number 0 "$W/rec/$s/f%04d.jpg"
done
cp sources/app/events.json "$W/rec/"
# Generated clips at their native 24 fps (f0001 = first frame); compose.mjs retimes them.
for c in g1:g1-opening g2:g2-pencil-mug g2r:g2r-first-line; do
  mkdir -p "$W/${c%%:*}f"
  "$FF" -hide_banner -loglevel error -y -i "generated/${c#*:}-0.mp4" -q:v 2 "$W/${c%%:*}f/f%04d.jpg"
done
echo "work folder ready: $W"
