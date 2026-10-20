#!/usr/bin/env python3
"""Cut out and export the three 2D Chai poses (reading, sipping, cheering) from the v2 masters.

Build-time tool, not an app dependency. Needs Pillow (with WebP), numpy and scipy:
    python3 -m venv /tmp/c2venv && /tmp/c2venv/bin/pip install pillow numpy scipy
    /tmp/c2venv/bin/python kettle/scripts/export-chai-2d.py [--out DIR] [--report FILE]

Input : kettle/art-src/chai/2d-v2/chai-{reading,sipping,cheering}.png (992x1586 RGB, cream ground + soft ground shadow).
Output: kettle/src/art/chai/chai-{pose}.webp (transparent, tight crop with a 4 sheet-px margin, same logical
        size as the art it replaces, so the display footprint and the feet baseline do not move).

Cut-out (no halo):
  1. The background (cream, darkened by the ground shadow) is a single hue line: colour = cream * k.
     Pixels on that line that connect to the image border are background (this also removes the shadow).
  2. A 3 px band around the background is the anti-aliased rim. For each band pixel the local background B is the
     nearest background pixel and the foreground F the nearest interior pixel; alpha is the projection of
     (C - B) on (F - B). The rim keeps the colour F (never cream mixed in), alpha carries the edge.
  3. Resize is done on premultiplied colour, so nothing bleeds in from the (transparent) background.
The ground shadow is NOT baked into the art. The app draws it in CSS (Stage contact shadow), so it follows the theme.
"""
import argparse, io, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # kettle/
SRC = os.path.join(ROOT, 'art-src', 'chai', '2d-v2')
OUT = os.path.join(ROOT, 'src', 'art', 'chai')

# Logical (CSS-layout) size of each pose in sheet px, as consumed by src/art/PaintedChai.tsx (PAINTED): unchanged.
LOGICAL = {'reading': (311, 487), 'sipping': (302, 491), 'cheering': (312, 428)}
# Ink box (alpha > 8, x0, y0, x1, y1, sheet px) of the art that these files replace. The new art is scaled uniformly to
# this box's height and aligned to its feet and centre, so the display footprint, the centre and the feet baseline stay where they were (preserve list #2).
OLD_INK = {'reading': (5, 4, 306, 483), 'sipping': (4, 5, 298, 487), 'cheering': (4, 5, 308, 424)}
DENSITY = 1.25      # shipped pixels per logical sheet px (display need at the 1.6 px Stage cap on a 2x screen is 1.19)
QUALITY = 82        # WebP colour quality
ALPHA_QUALITY = 80  # alpha: max error 1/255 at this setting, 70 already shows 9/255 steps on the rim
CREAM = np.array([254.0, 249.0, 240.0])
CREAM_DIR = CREAM / np.linalg.norm(CREAM)


def cut(rgb):
    """rgb: HxWx3 uint8 -> (HxWx4 float RGBA straight alpha, bg mask)."""
    c = rgb.astype(np.float64)
    k = c @ CREAM_DIR                       # position along the cream hue line
    perp = np.linalg.norm(c - k[..., None] * CREAM_DIR, axis=-1)
    cand = (perp < 9.0) & (k > 0.78 * np.linalg.norm(CREAM)) & (k < 1.02 * np.linalg.norm(CREAM))
    lab, n = ndi.label(cand)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    bg = np.isin(lab, border)
    # rim band: up to 3 px from the background
    near = ndi.binary_dilation(bg, iterations=3)
    band = near & ~bg
    core = ~near
    # nearest background / interior colour for every pixel
    _, ib = ndi.distance_transform_edt(~bg, return_indices=True)
    _, ic = ndi.distance_transform_edt(~core, return_indices=True)
    B = c[ib[0], ib[1]]
    F = c[ic[0], ic[1]]
    d = F - B
    den = np.maximum((d * d).sum(-1), 1.0)
    a = np.clip(((c - B) * d).sum(-1) / den, 0, 1)
    alpha = np.where(bg, 0.0, np.where(band, a, 1.0))
    # tiny alpha is noise: drop it; near-full alpha snaps to 1
    alpha = np.where(alpha < 0.03, 0.0, alpha)
    alpha = np.where(alpha > 0.97, 1.0, alpha)
    out = np.where(band[..., None], F, c)
    return np.dstack([out, alpha * 255.0]), bg


def bbox_of(alpha, thr=8):
    ys, xs = np.where(alpha > thr)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def build(pose, k=DENSITY):
    """Cut the master and place it in the logical box (scaled by k). Returns (RGBA PIL image, info dict)."""
    rgb = np.asarray(Image.open(os.path.join(SRC, f'chai-{pose}.png')).convert('RGB'))
    rgba, _ = cut(rgb)
    x0, y0, x1, y1 = bbox_of(rgba[..., 3])
    crop = Image.fromarray(rgba[y0:y1, x0:x1].round().astype(np.uint8), 'RGBA')
    lw, lh = LOGICAL[pose]
    ox0, oy0, ox1, oy1 = OLD_INK[pose]
    W, H = round(lw * k), round(lh * k)
    mw, mh = crop.width, crop.height
    # ONE uniform scale, set by the old ink height: the art keeps the master's own proportions. Feet (ink bottom)
    # and the horizontal ink centre go where the old art's were; box, baseline, top and centre do not move.
    oh = round((oy1 - oy0) * k)
    sc = oh / mh
    iw = round(mw * sc)
    fit = 'height'
    cx = (ox0 + ox1) / 2 * k
    X0 = round(cx - iw / 2)
    Y0 = round(oy1 * k) - oh
    if X0 < 1 or X0 + iw > W - 1 or Y0 < 1:  # does not fit the canvas with 1 file px margin: contain-fit instead
        sc = min((W - 2) / mw, (H - 2) / mh, sc)
        iw, oh = round(mw * sc), round(mh * sc)
        X0 = min(max(round(cx - iw / 2), 1), W - 1 - iw)
        Y0 = round(oy1 * k) - oh
        fit = 'contain'
    # Pillow resizes RGBA on premultiplied colour, so the clear background cannot bleed into the rim.
    ink = crop.resize((iw, oh), Image.LANCZOS)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    canvas.paste(ink, (X0, Y0))
    aspect_err = (iw / oh) / (mw / mh) * 100 - 100
    return canvas, dict(master_ink=(x0, y0, x1, y1), scale=sc, fit=fit, aspect_err_pct=aspect_err, size=(W, H),
                        ink_box_file_px=(X0, Y0, X0 + iw, Y0 + oh), old_ink_width=ox1 - ox0, new_ink_width_sheet_px=iw / k)


def encode(img):
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=QUALITY, alpha_quality=ALPHA_QUALITY, method=6)
    return buf.getvalue()


def halo_report(webp_bytes, bg=(0x22, 0x18, 0x29)):
    """Rim check on the dark theme. For every edge pixel (0 < alpha < 255) compare its colour with the nearest
    opaque interior colour (the character's own colour there). Cream contamination would show as a pull towards
    (254,249,240)."""
    a = np.asarray(Image.open(io.BytesIO(webp_bytes)).convert('RGBA')).astype(np.float64)
    al = a[..., 3]
    edge = (al > 0) & (al < 255)
    solid = al == 255
    _, idx = ndi.distance_transform_edt(~solid, return_indices=True)
    inner = a[idx[0], idx[1], :3]
    d = np.linalg.norm(a[..., :3] - inner, axis=-1)[edge]
    over = (a[..., :3] * (al / 255)[..., None] + np.array(bg) * (1 - al / 255)[..., None])
    ideal = (inner * (al / 255)[..., None] + np.array(bg) * (1 - al / 255)[..., None])
    dc = np.linalg.norm(over - ideal, axis=-1)[edge]
    # lightness of the rim against the interior it belongs to (positive = lighter = cream-ward)
    lum = lambda c: c @ np.array([0.299, 0.587, 0.114])
    dl = (lum(a[..., :3]) - lum(inner))[edge]
    cream = np.array([254.0, 249.0, 240.0])
    towards = (((a[..., :3] - inner) * (cream - inner)).sum(-1) / np.maximum(((cream - inner) ** 2).sum(-1), 1))[edge]
    return dict(edge_px=int(edge.sum()), mean_rim_vs_inner_rgb=float(d.mean()), p99_rim_vs_inner_rgb=float(np.percentile(d, 99)),
                mean_composite_dark_vs_ideal=float(dc.mean()), mean_lightness_shift=float(dl.mean()),
                mean_pull_to_cream=float(towards.mean()))


def naive_control(pose):
    """Control: the same alpha as the shipped cut, but the rim colours left as the master has them (cream mixed in,
    no un-mixing). Same crop, same halo metric; nothing shipped. It shows the halo that the un-mixing removes."""
    rgb = np.asarray(Image.open(os.path.join(SRC, f'chai-{pose}.png')).convert('RGB'))
    rgba, _ = cut(rgb)
    raw = np.dstack([rgb.astype(np.float64), rgba[..., 3]])
    img = Image.fromarray(raw.round().astype(np.uint8), 'RGBA')
    b = io.BytesIO(); img.save(b, 'PNG')
    return halo_report(b.getvalue())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--report', help='write a JSON report here')
    ap.add_argument('--dry', action='store_true', help='do not write the webp files')
    args = ap.parse_args()
    rep, total = {}, 0
    for pose in LOGICAL:
        img, info = build(pose)
        data = encode(img)
        if not args.dry:
            with open(os.path.join(args.out, f'chai-{pose}.webp'), 'wb') as f:
                f.write(data)
        total += len(data)
        rep[pose] = dict(info, bytes=len(data), halo=halo_report(data), halo_naive_control=naive_control(pose))
        print(f"{pose}: {img.size[0]}x{img.size[1]} px, {len(data)} B, aspect err {info['aspect_err_pct']:+.2f}% ({info['fit']} fit, ink w {info['new_ink_width_sheet_px']:.1f} vs old {info['old_ink_width']} sheet px), halo {rep[pose]['halo']['mean_pull_to_cream']:+.4f} (naive {rep[pose]['halo_naive_control']['mean_pull_to_cream']:+.4f})")
    rep['total_bytes'] = total
    print('total', total, 'budget 61476')
    if args.report:
        with open(args.report, 'w') as f:
            json.dump(rep, f, indent=2, default=float)


if __name__ == '__main__':
    main()
