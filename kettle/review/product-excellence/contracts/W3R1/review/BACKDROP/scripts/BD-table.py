#!/usr/bin/env python3
# BD-table.py <prefix> <rounds> <build> [<build> ...]: markdown table of the state (A still / B live / X other) of each <prefix><round>-<build> capture, with the machine load at its start
import sys, os, json, subprocess
sys.path.insert(0, '/tmp/claude-0/lr-pylib')
import numpy as np
from PIL import Image
ROOT = os.environ.get('CAPROOT', '/tmp/w6bd-cap')
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
A = load(f'{ROOT}/t0-base1/13-first-brew.png')[:850]; B = load(f'{ROOT}/t0-base2/13-first-brew.png')[:850]
tol = lambda x, y: float(((np.abs(x - y).max(axis=2)) > 16).mean() * 100)
def state(d):
    f = f'{ROOT}/{d}/13-first-brew.png'
    if not os.path.exists(f): return '-', None
    X = load(f)[:850]
    ld = None
    try: ld = float(json.load(open(f'{ROOT}/{d}/freeze.json'))['load'])
    except Exception: pass
    return ('A' if tol(X, A) < 0.5 else 'B' if tol(X, B) < 0.5 else 'X'), ld
pfx, R, builds = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
print('| build | ' + ' | '.join(f'{pfx}{r}' for r in range(1, R + 1)) + ' | A | B | X | load (min to max) |')
print('|---|' + '---|' * (R + 4))
for b in builds:
    cells, ls = [], []
    for r in range(1, R + 1):
        s, l = state(f'{pfx}{r}-{b}'); cells.append(s)
        if l is not None: ls.append(l)
    lr = f'{min(ls):.1f} to {max(ls):.1f}' if ls else ''
    print(f'| {b} | ' + ' | '.join(cells) + f' | {cells.count("A")} | {cells.count("B")} | {cells.count("X")} | {lr} |')
