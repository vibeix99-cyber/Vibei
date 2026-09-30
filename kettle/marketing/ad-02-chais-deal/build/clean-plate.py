#!/usr/bin/env python3
"""Make the first frame for the G2 replacement: G2's own first frame with the pre-written handwriting removed.

usage: PYTHONPATH=<numpy/scipy/pillow> python3 build/clean-plate.py <in.jpg> <out.png>

Only dark pencil strokes inside the handwriting box are replaced (stroke mask: darker than the local paper
level), filled by normalized convolution from the surrounding paper and given back the paper's own grain.
The hand, pencil, shadows and everything outside the box are untouched pixels.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, dst = sys.argv[1:3]
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float64)
H, W, _ = img.shape
lum = img @ [0.299, 0.587, 0.114]

# Handwriting box (the two pre-written lines), excluding the pencil (tip at about (452, 905), running up-right)
# and the fingers.
box = np.zeros((H, W), bool)
box[500:980, 20:640] = True
yy, xx = np.mgrid[0:H, 0:W]
a, b = np.array([440.0, 918.0]), np.array([760.0, 610.0])
d = b - a
k = np.clip(((xx - a[0]) * d[0] + (yy - a[1]) * d[1]) / (d @ d), 0, 1)
dist = np.hypot(xx - (a[0] + k * d[0]), yy - (a[1] + k * d[1]))
protect = (dist < 34) | ((xx > 525) & (yy < 700))
box &= ~protect

paper = ndi.median_filter(lum, size=31)
strokes = box & (lum < paper - 9)
strokes = ndi.binary_dilation(strokes, iterations=4) & box

# Fill by normalized convolution from the non-stroke pixels (several scales, finest wins).
known = (~strokes).astype(np.float64)
out = img.copy()
fill = np.zeros_like(img)
wsum = np.zeros((H, W))
for sigma in (40, 16, 6):
    w = ndi.gaussian_filter(known, sigma)
    for c in range(3):
        fill[..., c] = ndi.gaussian_filter(img[..., c] * known, sigma) / np.maximum(w, 1e-6)
    ok = w > 0.35
    out[strokes & ok] = fill[strokes & ok]
# Paper grain: reuse the fine texture of the clean paper just below the text.
grain = img[1100:1100 + 480, 20:640] - ndi.gaussian_filter(img[1100:1100 + 480, 20:640], (6, 6, 0))
g = np.zeros_like(img)
g[500:980, 20:640] = grain
soft = ndi.gaussian_filter(strokes.astype(np.float64), 1.5)[..., None]
out = img * (1 - soft) + (out + g * 0.9) * soft
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst)
print('cleaned', int(strokes.sum()), 'stroke pixels →', dst)
