#!/usr/bin/env python3
# BD-pd.py <a.png> <b.png> [diff-out.png]: strict / tol(>16) percent of differing pixels, plus bbox (as pdiff.py of Lane R)
import sys
sys.path.insert(0, '/tmp/claude-0/lr-pylib')
import numpy as np
from PIL import Image
a, b = sys.argv[1:3]
A = np.asarray(Image.open(a).convert('RGB')).astype(np.int16)
B = np.asarray(Image.open(b).convert('RGB')).astype(np.int16)
h = min(A.shape[0], B.shape[0]); w = min(A.shape[1], B.shape[1])
d = np.abs(A[:h, :w] - B[:h, :w]).max(axis=2)
tot = max(A.shape[0]*A.shape[1], B.shape[0]*B.shape[1]); extra = tot - h*w
strict = (int((d > 0).sum()) + extra) / tot * 100
tol = (int((d > 16).sum()) + extra) / tot * 100
mean = float(np.abs(A[:h,:w]-B[:h,:w]).mean())
# mean colour of the wall patch (left of the window) and of the window, for a level read
def patch(X, x0, y0, x1, y1): return [round(float(v), 1) for v in X[y0:y1, x0:x1].reshape(-1, 3).mean(axis=0)]
print(f"{a.split('/')[-2]} vs {b.split('/')[-2]}: strict {strict:.3f} / tol {tol:.3f} size {A.shape[1]}x{A.shape[0]} / {B.shape[1]}x{B.shape[0]} meanabs {mean:.2f}")
if len(sys.argv) > 3:
    m = d > 16
    base = (A[:h, :w]*0.35 + 255*0.65).astype(np.uint8); base[m] = [255, 0, 0]
    Image.fromarray(base).save(sys.argv[3])
