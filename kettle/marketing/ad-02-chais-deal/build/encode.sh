#!/usr/bin/env bash
# Ad 02: render the sound (build/sound.py), then encode the final 1080×1920 / 30 fps / 18 s MP4.
# usage (from marketing/ad-02-chais-deal): build/encode.sh <frames-dir> <out.mp4>
#   env: FFMPEG (static ffmpeg with libx264), PYTHONPATH with numpy + scipy
# Loudness: two passes — measure the mix, apply ONE linear gain toward −14 LUFS, then a −1.5 dBTP limiter,
# so the whistle keeps its lift over the bed (single-pass loudnorm would flatten it).
set -euo pipefail
FRAMES=${1:?frames dir}; OUT=${2:?out.mp4}
FF=${FFMPEG:-ffmpeg}
TMP=$(mktemp -d)
FFMPEG="$FF" python3 build/sound.py "$TMP"
for s in motif sfx; do "$FF" -hide_banner -loglevel error -y -i "$TMP/synth-$s.wav" sources/audio/synth-$s.flac; done  # original sound stems
I=$("$FF" -hide_banner -i "$TMP/mix.wav" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness:/{f=1} f&&/I:/{print $2; exit}')
GAIN=$(python3 -c "print(round(-13.9 - float('$I'), 2))")  # the limiter trims the whistle a little; lands at ≈ −14 LUFS
echo "mix integrated ${I} LUFS → gain ${GAIN} dB"
"$FF" -hide_banner -loglevel error -y \
  -framerate 30 -i "$FRAMES/f%04d.jpg" -i "$TMP/mix.wav" \
  -filter_complex "[1:a]volume=${GAIN}dB,alimiter=limit=-1.5dB:level=disabled,aresample=48000[aout]" \
  -map 0:v -map "[aout]" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 17 -preset slow \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t 18 "$OUT"
rm -rf "$TMP"
echo "wrote $OUT"
