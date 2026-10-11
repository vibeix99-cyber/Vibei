import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 unlock_cmp.py ctrl_frames.json trial_frames.json : the record-player unlock card sequence, control vs trial
import json, base64, io
import numpy as np
from PIL import Image
def load(p):
    d = json.load(open(p)); t0 = d['tTap']; out = []
    for f in d['frames']:
        im = Image.open(io.BytesIO(base64.b64decode(f['data']))).convert('RGB'); out.append((int(f['ts'] - t0), im))
    return out
def keyframes(fr, thr=1.5):
    keys = []; prev = None
    for t, im in fr:
        a = np.asarray(im.resize((185, 400))).astype(np.int16)
        if prev is None or np.abs(a - prev).mean() > thr: keys.append((t, a)); prev = a
    return keys
c, t = load(sys.argv[1]), load(sys.argv[2])
kc, kt = keyframes(c), keyframes(t)
print('frames', len(c), len(t), '| keyframes (frame-to-frame change > 1.5/255 on 185x400):', len(kc), len(kt))
print('ctrl key times ms:', [k[0] for k in kc]); print('trial key times ms:', [k[0] for k in kt])
n = min(len(kc), len(kt))
print('aligned keyframe mean abs diff ctrl vs trial (by order):', [round(float(np.abs(kc[i][1] - kt[i][1]).mean()), 2) for i in range(n)])
fc, ft = np.asarray(c[-1][1].resize((185, 400))).astype(np.int16), np.asarray(t[-1][1].resize((185, 400))).astype(np.int16)
print('final frame mean abs diff', round(float(np.abs(fc - ft).mean()), 2), '| top 40% (backdrop + Chai)', round(float(np.abs(fc[:160] - ft[:160]).mean()), 2), '| bottom 60% (card)', round(float(np.abs(fc[160:] - ft[160:]).mean()), 2))
# the record-player card: first frame where the 'drawing' card then 'close-up': report how many distinct keyframes fall in the first 6 s
print('keyframes within first 6 s of the finish call: ctrl', sum(1 for k in kc if k[0] < 6000), 'trial', sum(1 for k in kt if k[0] < 6000))
