#!/usr/bin/env python3
# BD-class.py <capdir-glob-prefix> ...: classify each 13-first-brew.png against the two reference frames
# (A = the pre-rendered still showing, B = the live canvas showing; references are the t0-base1 and t0-base2 captures)
import sys, glob, os, json
sys.path.insert(0, '/tmp/claude-0/lr-pylib')
import numpy as np
from PIL import Image
ROOT = os.environ.get('CAPROOT', '/tmp/w6bd-cap')
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def pct(a, b):
    d = np.abs(a - b).max(axis=2)
    return (d > 0).mean() * 100, (d > 16).mean() * 100
A = load(f'{ROOT}/t0-base1/13-first-brew.png'); B = load(f'{ROOT}/t0-base2/13-first-brew.png')
# the room only (top 850 px of 1688): the timer digits below tick and are not the finding
top = lambda x: x[:850]
rows = []
for pat in sys.argv[1:]:
    for d in sorted(glob.glob(f'{ROOT}/{pat}')):
        f = d + '/13-first-brew.png'
        if not os.path.exists(f): continue
        X = load(f)
        sa, ta = pct(top(X), top(A)); sb, tb = pct(top(X), top(B))
        cls = 'A' if ta < 0.5 else ('B' if tb < 0.5 else 'X')
        rows.append((os.path.basename(d), cls, round(sa, 2), round(ta, 2), round(sb, 2), round(tb, 2)))
for r in rows: print('%-22s %s  vsA strict/tol %6.2f/%6.2f  vsB %6.2f/%6.2f' % r)
