import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# Lane N · pixel comparison of the Focus backdrop: 3D-off still (control/trial) vs the live 3D backdrop.
# python3 -I analyze.py <scratch/bd> <cfgtag> ...   (PYTHONPATH must hold PIL+numpy)
import sys, json, os
import numpy as np
from PIL import Image
root = sys.argv[1]; tags = sys.argv[2:]
man = json.load(open('/home/user/wt/w2t-n/kettle/src/scene/stills/items.json'))
FW, FH = man['frame']
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def box_to_screen(box, W, H):
    # slice: scale = max(W/FW, H/FH), centred (host has inset -2px so W,H of the back shot are ~ host - 0; good enough: use back shot size)
    s = max(W / FW, H / FH); ox = (W - FW * s) / 2; oy = (H - FH * s) / 2
    x, y, w, h = box
    return [int(round(ox + x * s)), int(round(oy + y * s)), int(round(w * s)), int(round(h * s)), s]
def clipbox(b, W, H):
    x, y, w, h = b[:4]; x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    return x0, y0, x1, y1
def mad(a, b, m=None):
    d = np.abs(a - b).mean(axis=2)
    return float(d[m].mean()) if m is not None and m.any() else float(d.mean())
out = {}
for tag in tags:
    r = {}
    try:
        co = load(f'{root}/ctrl/{tag}/off-raw.png'); to = load(f'{root}/trial/{tag}/off-raw.png')
        cl = load(f'{root}/ctrl/{tag}/live-raw.png'); tl = load(f'{root}/trial/{tag}/live-raw.png')
    except Exception as e:
        print(tag, 'missing', e); continue
    H, W = tl.shape[:2]
    r['size'] = [W, H]
    # the live backdrop: control and trial should agree (same engine; trial changes nothing there)
    r['live_ctrl_vs_trial_mad'] = mad(cl, tl)
    # which pixels do the earned items change in the live view (relative to the item-less still on the control)
    live = tl
    chg = np.abs(live - co).max(axis=2) > 30
    r['changed_px_frac'] = float(chg.mean())
    r['ctrl_off_vs_live_mad_all'] = mad(co, live); r['trial_off_vs_live_mad_all'] = mad(to, live)
    r['ctrl_off_vs_live_mad_changed'] = mad(co, live, chg); r['trial_off_vs_live_mad_changed'] = mad(to, live, chg)
    r['ctrl_off_vs_live_mad_unchanged'] = mad(co, live, ~chg); r['trial_off_vs_live_mad_unchanged'] = mad(to, live, ~chg)
    # fraction of live-changed pixels that the still reproduces to within 40/255 (max channel)
    ok = lambda s: float((np.abs(s - live).max(axis=2)[chg] <= 40).mean()) if chg.any() else None
    r['frac_changed_within40_ctrl'] = ok(co); r['frac_changed_within40_trial'] = ok(to)
    # trial still vs control still: where do the layers paint, and does that overlap the live-changed mask?
    lay = np.abs(to - co).max(axis=2) > 30
    r['layer_px_frac'] = float(lay.mean())
    inter = (lay & chg).sum(); uni = (lay | chg).sum()
    r['iou_layers_vs_live_changed'] = float(inter / uni) if uni else None
    r['live_changed_covered_by_layers'] = float(inter / chg.sum()) if chg.any() else None
    r['layers_outside_live_changed'] = float((lay & ~chg).sum() / lay.sum()) if lay.any() else None
    # per item: residual in the item's screen box, and best (dx,dy) shift of the trial still against live

    # global best shift of the trial still against the live render over the live-changed mask (half resolution)
    def small(x): return x[::2, ::2]
    tl2, to2, ch2 = small(live), small(to), small(chg)
    best = (1e9, 0, 0); h2, w2 = tl2.shape[:2]
    for dy in range(-12, 13):
        for dx in range(-12, 13):
            ys, xs = slice(max(0, dy), h2 + min(0, dy)), slice(max(0, dx), w2 + min(0, dx))
            yl, xl = slice(max(0, -dy), h2 + min(0, -dy)), slice(max(0, -dx), w2 + min(0, -dx))
            m = ch2[yl, xl]
            if m.sum() < 500: continue
            e = float(np.abs(to2[ys, xs] - tl2[yl, xl]).mean(axis=2)[m].mean())
            if e < best[0]: best = (e, dx, dy)
    r['global_best_shift_px_at_half_res(dx,dy)'] = [best[1], best[2]]; r['global_mad_at_best_shift'] = best[0]
    # as the user sees it (blurred + quiet overlay): trial/ctrl still vs live
    try:
        cb, tb, lb = load(f'{root}/ctrl/{tag}/off-back.png'), load(f'{root}/trial/{tag}/off-back.png'), load(f'{root}/trial/{tag}/live-back.png')
        r['seen_mad_ctrl_off_vs_live'] = mad(cb, lb); r['seen_mad_trial_off_vs_live'] = mad(tb, lb)
    except Exception as e: r['seen_err'] = str(e)
    items = {}
    for id in ['pothos','books','fairyLights','shelf','recordPlayer']:
        bx = box_to_screen(man['items'][id]['box'], W, H)
        x0, y0, x1, y1 = clipbox(bx, W, H)
        if x1 - x0 < 8 or y1 - y0 < 8: continue
        sub_live = live[y0:y1, x0:x1]; sub_c = co[y0:y1, x0:x1]; sub_t = to[y0:y1, x0:x1]
        ichg = (np.abs(sub_live - sub_c).max(axis=2) > 30)
        if ichg.sum() < 200: items[id] = {'live_changed_px': int(ichg.sum()), 'note': 'no live change in box (item not visible in this window view)'}; continue
        best = (1e9, 0, 0)
        for dy in range(-16, 17, 2):
            for dx in range(-16, 17, 2):
                ys0, ys1, xs0, xs1 = max(0, y0 + dy), min(H, y1 + dy), max(0, x0 + dx), min(W, x1 + dx)
                hh, ww = min(ys1 - ys0, y1 - y0), min(xs1 - xs0, x1 - x0)
                if hh < 8 or ww < 8: continue
                a = to[ys0:ys0 + hh, xs0:xs0 + ww]; bb = live[y0:y0 + hh, x0:x0 + ww]
                m = ichg[:hh, :ww]
                e = np.abs(a - bb).mean(axis=2)[m].mean()
                if e < best[0]: best = (float(e), dx, dy)
        e0 = float(np.abs(sub_t - sub_live).mean(axis=2)[ichg].mean())
        items[id] = {'live_changed_px': int(ichg.sum()), 'mad_ctrl_still': float(np.abs(sub_c - sub_live).mean(axis=2)[ichg].mean()), 'mad_trial_still': e0, 'best_shift_dx_dy': [best[1], best[2]], 'mad_at_best_shift': best[0], 'scale': bx[4]}
    r['items'] = items
    out[tag] = r
    print(tag, json.dumps({k: (round(v, 3) if isinstance(v, float) else v) for k, v in r.items() if k != 'items'}))
    for k, v in items.items(): print('   ', k, json.dumps({a: (round(b, 2) if isinstance(b, float) else b) for a, b in v.items()}))
json.dump(out, open(f'{root}/analysis-{"-".join(tags)[:60]}.json', 'w'), indent=1)
