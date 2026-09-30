#!/usr/bin/env python3
"""Ad 02 sound: original synthesized cues + the app's own sounds, mixed on the edit timeline.

usage (from marketing/ad-02-chais-deal): PYTHONPATH=<numpy/scipy> python3 build/sound.py <out-dir>
  writes <out-dir>/mix.wav (48 kHz stereo, pre-loudness) and the synthesized stems <out-dir>/synth-{motif,sfx}.wav (encode.sh keeps FLAC copies in sources/audio)

Every cue time lives in build/cues.json (seconds on the 18 s timeline). The app sounds come from
sources/audio/*.flac, rendered through Kettle's own audio graph (scripts/audio-check.mjs). The synthesized
sounds (pencil taps, ceramic clink, pencil on paper, paper settle, mug, the motif) are generated here from
sine partials and filtered noise, so there is nothing to license. Seeded, therefore reproducible.
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DUR = 18.0
OUT = sys.argv[1] if len(sys.argv) > 1 else '../../.tmp/ad2/audio'
os.makedirs(OUT, exist_ok=True)
FF = os.environ.get('FFMPEG', 'ffmpeg')
C = json.load(open('build/cues.json'))
rng = np.random.default_rng(7)


def t(n):
    return np.arange(int(n * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, hi, order=2):
    return sosfilt(butter(order, hi, btype='low', fs=SR, output='sos'), x)


def hp(x, lo, order=2):
    return sosfilt(butter(order, lo, btype='high', fs=SR, output='sos'), x)


def norm(x, peak=0.9):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def db(v):
    return 10 ** (v / 20)


def load(name):
    """Decode one of the app's FLACs to float stereo."""
    raw = subprocess.run([FF, '-v', 'error', '-i', f'sources/audio/{name}.flac', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def stereo(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], axis=1)


# ------------------------------------------------------------------ one-shots
def pencil_tap(v=1.0):
    n = t(0.09)
    click = bp(rng.standard_normal(len(n)), 1800, 6500) * np.exp(-n / 0.004)
    wood = np.sin(2 * np.pi * 820 * n) * np.exp(-n / 0.018) * 0.5 + np.sin(2 * np.pi * 1570 * n) * np.exp(-n / 0.01) * 0.25
    return norm(click * 0.8 + wood) * v


def clink(v=1.0, f0=2130.0, dec=0.5):
    # small ceramic: inharmonic partials, fast attack, bright short decay
    n = t(1.2)
    parts = [(1.0, 1.0, dec), (2.76, 0.55, dec * 0.6), (5.40, 0.35, dec * 0.35), (8.93, 0.18, dec * 0.2)]
    x = sum(a * np.sin(2 * np.pi * f0 * r * n + rng.uniform(0, 6)) * np.exp(-n / d) for r, a, d in parts)
    x += bp(rng.standard_normal(len(n)), 3000, 9000) * np.exp(-n / 0.003) * 0.6
    return norm(x * np.minimum(1, n / 0.001)) * v


def paper_settle(v=1.0, dur=0.5):
    n = t(dur)
    env = np.sin(np.pi * np.minimum(1, n / dur)) ** 2
    return norm(bp(rng.standard_normal(len(n)), 500, 4000) * env) * v


def scribble(strokes, dur):
    """Pencil on paper: band-limited noise shaped by stroke envelopes [(start, length, level), …]."""
    n = t(dur)
    x = bp(rng.standard_normal(len(n)), 1400, 7000, 3) * 0.8 + bp(rng.standard_normal(len(n)), 300, 1200) * 0.25
    grain = 1 + 0.5 * np.sin(2 * np.pi * 23 * n + 3 * np.sin(2 * np.pi * 3.1 * n))  # stroke texture
    env = np.zeros_like(n)
    for s, L, lvl in strokes:
        a = (n >= s) & (n < s + L)
        k = (n[a] - s) / L
        env[a] = np.maximum(env[a], lvl * np.sin(np.pi * k) ** 0.6)
    return norm(x * grain * env)


def tock(v=1.0):
    n = t(0.12)
    x = np.sin(2 * np.pi * 310 * n) * np.exp(-n / 0.03) + bp(rng.standard_normal(len(n)), 900, 4000) * np.exp(-n / 0.006) * 0.5
    return norm(x) * v


# ------------------------------------------------------------------ the motif
def note(f, dur, v=1.0, bright=1.0):
    """Soft felt-piano / kalimba hybrid: a few harmonics, fast attack, long gentle decay."""
    n = t(dur + 1.6)
    x = (np.sin(2 * np.pi * f * n) + 0.32 * bright * np.sin(2 * np.pi * 2 * f * n) * np.exp(-n / 0.5)
         + 0.12 * bright * np.sin(2 * np.pi * 3 * f * n) * np.exp(-n / 0.25) + 0.05 * np.sin(2 * np.pi * 4.2 * f * n) * np.exp(-n / 0.08))
    env = np.minimum(1, n / 0.006) * np.exp(-n / (0.9 + 110 / f))
    rel = np.clip((dur + 1.6 - n) / 0.3, 0, 1)
    return x * env * rel * v


def pad(freqs, dur, v=1.0):
    n = t(dur)
    x = sum(np.sin(2 * np.pi * f * n + i) + 0.2 * np.sin(2 * np.pi * 2 * f * n) for i, f in enumerate(freqs))
    env = np.minimum(1, n / 0.8) * np.minimum(1, (dur - n) / 1.0)
    return lp(x, 1800) * env * v


N = {k: 440 * 2 ** ((i - 9) / 12 + o - 4) for o in range(2, 7) for i, k0 in enumerate(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']) for k in [f'{k0}{o}']}


def place(buf, x, at, gain=1.0, pan=0.0):
    x = stereo(x, pan) if x.ndim == 1 else x
    i = int(at * SR)
    j = min(len(buf), i + len(x))
    if j > i:
        buf[i:j] += x[: j - i] * gain


def reverb(x, secs=1.8, mix=0.28):
    n = t(secs)
    ir_l = rng.standard_normal(len(n)) * np.exp(-n / (secs / 5))
    ir_r = rng.standard_normal(len(n)) * np.exp(-n / (secs / 5))
    ir_l, ir_r = lp(ir_l, 5000), lp(ir_r, 5000)
    wet = np.stack([fftconvolve(x[:, 0], ir_l)[: len(x)], fftconvolve(x[:, 1], ir_r)[: len(x)]], axis=1)
    wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return x * (1 - mix) + wet * mix


L = int(DUR * SR)
music = np.zeros((L, 2))
sfx = np.zeros((L, 2))
room = np.zeros((L, 2))
syn = np.zeros((L, 2))  # synthesized one-shots only (kept apart from the app's sounds for the stem)

# Motif in F major: a small rising question, an answer that lifts, a resolve on the end card.
m = C['motif']
for at, name, v in m['notes']:
    place(music, note(N[name], 0.6, v, bright=1.0), at, 1.0, pan=0.18 if N[name] > 500 else -0.12)
for at, chord, dur, v in m['pads']:
    place(music, pad([N[c] for c in chord], dur, v), at, 1.0)
music = reverb(music, 2.2, 0.32)

# ------------------------------------------------------------------ app sounds and room
rain = load('ambient-rain')
simmer = load('ambient-simmer')
r0 = rain[: L]
env = np.ones(L)
for a, b, g0, g1 in C['room_rain_env']:
    i, j = int(a * SR), int(b * SR)
    env[i:j] = np.linspace(db(g0), db(g1), j - i)
room += r0 * env[:, None]
s0, s1 = C['simmer']
seg = simmer[: int((s1 - s0) * SR)] * np.minimum(1, np.minimum(t(s1 - s0), (s1 - s0) - t(s1 - s0)) / 0.6)[:, None]
place(room, seg * db(C['simmer_db']), s0)

for name, at, g in C['app_sfx']:
    place(sfx, load(name), at, db(g))

# ------------------------------------------------------------------ synthesized one-shots
for at, v in C['pencil_taps']:
    place(syn, pencil_tap(v), at, db(-6), pan=-0.25)
place(syn, clink(1.0), C['clink'], db(-18), pan=0.2)
place(syn, paper_settle(1.0), C['settle'], db(-24))
sc = C['scribble']
place(syn, scribble(sc['strokes'], sc['dur']), sc['at'], db(sc['db']), pan=0.1)
if 'scribble2' in C:
    sc2 = C['scribble2']
    place(syn, scribble(sc2['strokes'], sc2['dur']), sc2['at'], db(sc2['db']), pan=0.1)
place(syn, tock(1.0), C['pencil_down'], db(-15), pan=0.1)
place(syn, clink(1.0, f0=1180, dec=0.35), C['mug'], db(-19), pan=0.25)

# Music ducks under the whistle; everything fades out at the very end.
duck = np.ones(L)
for a, b, g in C['music_duck']:
    i, j = int(a * SR), int(b * SR)
    ramp = int(0.25 * SR)
    seg_ = np.full(j - i, db(g))
    seg_[:ramp] = np.linspace(1, db(g), ramp)
    seg_[-ramp:] = np.linspace(db(g), 1, ramp)
    duck[i:j] = np.minimum(duck[i:j], seg_)
mix = music * db(C['music_db']) * duck[:, None] + sfx + syn + room * db(C['room_db'])
fade = np.minimum(1, (DUR - t(DUR)) / 0.5)[:, None]
mix *= fade
mix = hp(mix.T, 30).T  # remove sub-rumble

wavfile.write(f'{OUT}/mix.wav', SR, (np.clip(mix, -1, 1) * 32767 * 0.5).astype(np.int16))
for name, x in [('motif', music), ('sfx', syn)]:
    wavfile.write(f'{OUT}/synth-{name}.wav', SR, (norm(x, 0.7) * 32767).astype(np.int16))
print('wrote', f'{OUT}/mix.wav', 'peak', round(float(np.max(np.abs(mix))), 3))
