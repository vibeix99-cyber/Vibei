import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 analyze_float.py <dir> <label> <cfg> <mode>  -> per start: DOM float frames, first-layer ms, still-loaded ms, still-painted ms (screencast warm-wall test), float screencast frames (layers visible, wall not painted)
import json, base64, io, sys
import numpy as np
from PIL import Image
d, label, cfg, mode = sys.argv[1:5]
W, H = [int(x) for x in cfg.split('@')[0].split('x')]
res = json.load(open(f'{d}/{label}-{cfg}-{mode}.json'))
rows = []
for s in res['starts']:
    i = s['i']; fl = s.get('fl'); 
    if not fl: print('start', i, 'no data', s.get('err')); continue
    tap = fl['tap']; ev = fl['ev']
    host = next((e for e in ev if e[1] == 1), None)
    if not host: print('start', i, 'no host'); continue
    hostT = host[0]; rect = host[6] or [0, 0, W, 300]
    first_layer = next((e[0] for e in ev if e[2] > 0), None)
    still_loaded = next((e[0] for e in ev if e[4] is True), None)
    frames = sorted(json.load(open(f'{d}/{label}-{cfg}-{mode}-s{i}.frames.json')), key=lambda f: f['ts'])
    first_vis = first_warm = None; fl_frames = []; keep = []
    for f in frames:
        t = f['ts']
        if t < hostT - 50: continue
        im = Image.open(io.BytesIO(base64.b64decode(f['data']))).convert('RGB'); iw, ih = im.size; sx, sy = iw / W, ih / H
        hx, hy, hw, hh = rect
        def crop(a, b, c, e): return np.asarray(im.crop((int((hx + hw * a) * sx), int((hy + hh * b) * sy), int((hx + hw * c) * sx), int((hy + hh * e) * sy)))).astype(float)
        wall = crop(0.04, 0.41, 0.09, 0.48).mean(axis=(0, 1)); rb = wall[0] - wall[2]; warm = rb > 25; sky = rb < -5  # still painted: R-B ~ +31; bare sky gradient: ~ -14; Home/transition (cream, ~ +15): neither
        sh = crop(0.08, 0.10, 0.45, 0.40).mean(axis=2); vis = (float((sh < 150).mean()) > 0.03) and (warm or sky)
        if vis and first_vis is None: first_vis = t
        if warm and first_warm is None: first_warm = t
        if vis and sky: fl_frames.append(round(t - tap))
        keep.append((round(t - tap), bool(warm), bool(vis), bool(sky), f['data']))
    # stable painted: first warm frame after which no later frame shows the bare sky
    last_sky = max([k[0] for k in keep if k[3]], default=-10**9)
    stable = next((k[0] for k in keep if k[1] and k[0] > last_sky), None)
    rows.append(dict(stillPaintedStableFrameMs=stable, i=i, cpu=s['cpu'], domFloatFrames=fl['floatFrames'], domFloatSpanMs=(round(fl['floatLast'] - fl['floatFirst']) if fl['floatFirst'] else 0), layerFrames=fl['layerFramesTotal'], hostMs=round(hostT - tap), firstLayerMs=None if first_layer is None else round(first_layer - tap), stillLoadedMs=None if still_loaded is None else round(still_loaded - tap), firstLayerVisibleFrameMs=None if first_vis is None else round(first_vis - tap), stillPaintedFrameMs=None if first_warm is None else round(first_warm - tap), floatScreencastFrames=len(fl_frames), floatFrameTimesMs=fl_frames, screencastFrames=len(frames)))
    json.dump([dict(t=k[0], warm=k[1], vis=k[2], sky=k[3]) for k in keep], open(f'{d}/{label}-{cfg}-{mode}-s{i}.frameclass.json', 'w'))
for r in rows: print(json.dumps(r))
json.dump(rows, open(f'{d}/{label}-{cfg}-{mode}.analysis.json', 'w'), indent=1)
