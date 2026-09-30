"""
Extract individual Chai poses from the approved sheet (assets/chai/source/chai-sheet-approved.webp)
as transparent images, preserving the painted artwork pixel-for-pixel inside the silhouette.

  PYTHONPATH=<numpy/scipy/pillow> python3 extract-chai.py

Method (no redrawing, no vectorising):
 1. Background = low-saturation, near-cream pixels connected to the crop border. This also takes the sheet's
    baked grey ground shadow (the scene draws its own contact shadows, in one style with the kettle).
 2. Interior pixels are copied untouched (alpha 1): steam wisps, eye glints and book pages stay opaque
    even though they are light, because they are not connected to the outside.
 3. Only the anti-aliased rim (about 2 px) is re-computed: each rim pixel is "un-mixed" against its *local*
    background colour (cream, or the grey shadow near the feet), so no cream or grey halo survives on a dark
    theme. alpha = projection of (pixel - local bg) onto (inner colour - local bg).
Outputs PNG (lossless master) and WebP (with alpha, for the mockups) at native resolution, plus face crops.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/chai/source/chai-sheet-approved.webp'
OUT = ROOT / 'assets/chai'

# pose name -> crop box on the 1254 x 1254 sheet (generous; the neighbour is dropped by connectivity)
POSES = {
    'chai-reading': (0, 96, 322, 612),     # Focus
    'chai-sipping': (318, 96, 632, 612),   # the tea break
    'chai-concerned': (628, 96, 938, 612),  # gentle support only
    'chai-happy': (934, 96, 1254, 612),    # Home greeting (content, eyes closed)
    'chai-cheering': (930, 656, 1254, 1110),  # the whistle / completion
}
# face crops for very small sizes (head + yuzu), relative to the extracted pose image, as fractions
FACES = {'chai-happy': (0.0, 0.0, 1.0, 0.63)}

sheet = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W, _ = sheet.shape
border = np.concatenate([sheet[:6].reshape(-1, 3), sheet[-6:].reshape(-1, 3), sheet[:, :6].reshape(-1, 3), sheet[:, -6:].reshape(-1, 3)])
BG = np.median(border, axis=0)


def extract(box):
    x0, y0, x1, y1 = box
    im = sheet[y0:y1, x0:x1]
    d = np.abs(im - BG).max(axis=2)
    sat = im.max(axis=2) - im.min(axis=2)
    # near-background: cream noise (d < 14), or the grey shadow (low saturation, d < 60)
    near_bg = (d < 14) | ((sat < 18) & (d < 60))
    lab, _ = ndi.label(near_bg)
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    ext = np.isin(lab, edge_labels[edge_labels > 0])

    # shadow residue next to the silhouette: pale, grey-ish pixels within a few px of the outside
    # (the feet sit in the baked shadow, so their rim mixes brown with grey, not cream)
    dist_ext = ndi.distance_transform_edt(~ext)
    pale_grey = (sat < 36) & (im.mean(axis=2) > 160) & (dist_ext <= 7)
    ext = ext | pale_grey

    core = ~ext
    # keep only components that belong to this pose: drop anything touching the crop's left/right border
    # (the neighbouring pose) and specks from compression
    clab, n = ndi.label(core)
    keep = np.zeros_like(core)
    for i in range(1, n + 1):
        m = clab == i
        ys, xs = np.nonzero(m)
        touches_side = xs.min() == 0 or xs.max() == core.shape[1] - 1
        if touches_side or m.sum() < 25:
            continue
        if m.sum() < 400 and sat[m].mean() < 60:  # small, unsaturated leftovers (shadow / compression specks)
            continue
        keep |= m
    # anything that is neither kept foreground nor exterior (e.g. the dropped neighbour) becomes background
    ext = ~keep

    alpha = keep.astype(np.float32)
    rgb = im.copy()

    # rim: kept pixels within 2 px of the exterior, plus exterior pixels touching the kept region
    dist_in = ndi.distance_transform_edt(keep)
    dist_out = ndi.distance_transform_edt(~keep)
    rim = (keep & (dist_in <= 2.0)) | (~keep & (dist_out <= 1.5))

    # local background colour (mean of exterior pixels nearby) and inner colour (mean of solid interior nearby)
    ext_f = (ext & (dist_out > 0.5)).astype(np.float32)
    inner_f = (keep & (dist_in >= 3)).astype(np.float32)
    k = 9

    def local_mean(mask):
        w = ndi.uniform_filter(mask, k)
        s = np.stack([ndi.uniform_filter(im[..., c] * mask, k) for c in range(3)], axis=-1)
        return s / np.maximum(w[..., None], 1e-6), w

    Lbg, wbg = local_mean(ext_f)
    Lin, win = local_mean(inner_f)
    Lbg[wbg < 1e-3] = BG

    ys, xs = np.nonzero(rim)
    for y, x in zip(ys, xs):
        C, Bl, F = im[y, x], Lbg[y, x], Lin[y, x]
        if win[y, x] < 1e-3:
            F = C
        v = F - Bl
        den = float(v @ v)
        a = float((C - Bl) @ v) / den if den > 1 else (1.0 if keep[y, x] else 0.0)
        a = min(1.0, max(0.0, a))
        alpha[y, x] = a
        if a > 0.02:
            rgb[y, x] = np.clip((C - (1 - a) * Bl) / a, 0, 255)

    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    # trim to content with a 4 px margin
    ys, xs = np.nonzero(alpha > 0.01)
    t, b, l, r = max(0, ys.min() - 4), ys.max() + 5, max(0, xs.min() - 4), xs.max() + 5
    return Image.fromarray(out[t:b, l:r], 'RGBA')


OUT.mkdir(parents=True, exist_ok=True)
for name, box in POSES.items():
    img = extract(box)
    img.save(OUT / f'{name}.png', optimize=True)
    img.save(OUT / f'{name}.webp', quality=92, method=6, exact=True)
    print(name, img.size, (OUT / f'{name}.png').stat().st_size // 1024, 'KB png', (OUT / f'{name}.webp').stat().st_size // 1024, 'KB webp')
    if name in FACES:
        fx0, fy0, fx1, fy1 = FACES[name]
        w, h = img.size
        face = img.crop((round(fx0 * w), round(fy0 * h), round(fx1 * w), round(fy1 * h)))
        face.save(OUT / f'{name}-face.png', optimize=True)
        face.save(OUT / f'{name}-face.webp', quality=92, method=6, exact=True)
        print(' face', face.size)
