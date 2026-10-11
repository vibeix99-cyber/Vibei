import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 p375_analyze.py <root> : per run, per sample: SD of the top fifth of the viewport screenshot (N's method; blank sky < ~6 on a plain gradient, room 20-40),
# plus, on the backdrop-only shot: SD, and mean|diff| vs the same run's Focus 4.5 s backdrop (the room, as a reference).
import json, glob, os
import numpy as np
from PIL import Image
root = sys.argv[1]
def sd_top(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32); h = a.shape[0]; t = a[: int(h * 0.2)]
    return float(max(t[..., k].std() for k in range(3)))
def arr(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
for lab in ('ctrl', 'trial'):
    lp = f'{root}/{lab}/log.json'
    if not os.path.exists(lp): print(lab, 'no log'); continue
    log = json.load(open(lp))
    for run in log['runs']:
        i = run['i']; d = f'{root}/{lab}/run{i}'
        ref = arr(f'{d}/focus-4p5-back.png'); out = []
        out.append(('focus4.5', round(sd_top(f'{d}/focus-4p5.png'), 1), round(float(np.asarray(ref).std()), 1), 0.0, run['focus']['host']))
        for s in run['samples']:
            at = s['at']; a = arr(f'{d}/summary-{at}-back.png')
            diff = float(np.abs(a - ref).mean()) if a.shape == ref.shape else None
            out.append((f'sum{at}', round(sd_top(f'{d}/summary-{at}.png'), 1), round(float(a.std()), 1), None if diff is None else round(diff, 1), s['host']))
        print(lab, 'run', i, run.get('err') or '')
        for o in out: print('   ', o)
