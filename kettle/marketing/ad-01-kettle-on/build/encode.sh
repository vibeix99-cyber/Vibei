#!/usr/bin/env bash
# Ad 01: mix the app's own sounds on the edit timeline and encode the final 1080×1920 / 30 fps / 15 s MP4.
# usage: build/encode.sh <frames-dir> <out.mp4>   (run from marketing/ad-01-kettle-on; FFMPEG may point at a static ffmpeg)
# Loudness: two passes — mix, measure integrated loudness, then ONE linear gain to −14 LUFS + a −1.5 dBTP limiter,
# so the whistle keeps its lift over the rain/lo-fi bed (single-pass loudnorm flattened it).
set -euo pipefail
FRAMES=${1:?frames dir}; OUT=${2:?out.mp4}
FF=${FFMPEG:-ffmpeg}
A=sources/audio
TMP=$(mktemp -d)
# Timeline (seconds): tap 2.20 · focus 2.70–5.70 · time card 5.70 · whistle 7.33 · Chai pops in 12.30 · end 15.00
"$FF" -hide_banner -loglevel error -y \
  -i "$A/ambient-rain.flac" -i "$A/ambient-lofi.flac" -i "$A/ambient-simmer.flac" \
  -i "$A/sfx-start.flac" -i "$A/sfx-whoosh.flac" -i "$A/sfx-complete.flac" -i "$A/sfx-pop.flac" \
  -filter_complex "
    [0:a]atrim=0:15,volume=-12dB,afade=t=in:d=0.25,afade=t=out:st=14.2:d=0.8[rain];
    [1:a]atrim=0:15,volume=-17dB,afade=t=in:d=0.4,afade=t=out:st=14.0:d=1.0[lofi];
    [2:a]atrim=0:3.2,volume=6dB,afade=t=in:d=0.4,afade=t=out:st=2.6:d=0.6,adelay=2700|2700[simmer];
    [3:a]volume=2dB,adelay=2200|2200[start];
    [4:a]volume=-8dB,adelay=5650|5650[whoosh];
    [5:a]volume=4dB,adelay=7330|7330[complete];
    [6:a]volume=0dB,adelay=12300|12300[pop];
    [rain][lofi][simmer][start][whoosh][complete][pop]amix=inputs=7:normalize=0:duration=longest,atrim=0:15[m]" \
  -map "[m]" -ar 48000 "$TMP/mix.wav"
I=$("$FF" -hide_banner -i "$TMP/mix.wav" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness:/{f=1} f&&/I:/{print $2; exit}')
GAIN=$(python3 -c "print(round(-12.9 - float('$I'), 2))")  # −12.9: the limiter trims ~1.1 LU off the whistle; lands at ≈ −14 LUFS
echo "mix integrated ${I} LUFS → gain ${GAIN} dB"
"$FF" -hide_banner -loglevel error -y \
  -framerate 30 -i "$FRAMES/f%04d.jpg" -i "$TMP/mix.wav" \
  -filter_complex "[1:a]volume=${GAIN}dB,alimiter=limit=-1.5dB:level=disabled,aresample=48000[aout]" \
  -map 0:v -map "[aout]" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset slow \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t 15 "$OUT"
rm -rf "$TMP"
echo "wrote $OUT"
