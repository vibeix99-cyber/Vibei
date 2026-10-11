import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# HQ states: baseline = the same run's still with layers hidden (offbase). python3 analyze2.py <bd root> <label>...
import json, numpy as np
from PIL import Image
root = sys.argv[1]
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def mad(a, b, m=None):
    d = np.abs(a - b).mean(axis=2); return float(d[m].mean()) if m is not None else float(d.mean())
for lab in sys.argv[2:]:
    d = f'{root}/{lab}/390x844-light-t100'
    import glob, os
    dd = [x for x in glob.glob(f'{root}/{lab}/*') if os.path.isdir(x)][0]
    try:
        off, base, live = load(f'{dd}/off-raw.png'), load(f'{dd}/offbase-raw.png'), load(f'{dd}/live-raw.png')
        offb, baseb, liveb = load(f'{dd}/off-back.png'), load(f'{dd}/offbase-back.png'), load(f'{dd}/live-back.png')
    except Exception as e:
        print(lab, 'missing', e); continue
    chg = np.abs(live - base).max(axis=2) > 30
    lay = np.abs(off - base).max(axis=2) > 30
    inter = (lay & chg).sum()
    meta = json.load(open(f'{dd}/meta.json'))
    print(f"{lab:26s} still={meta['states']['off']['backdrop']['still'][:22]} layers={len(meta['states']['off']['backdrop']['layers'])} | changed {chg.mean()*100:4.1f}% | raw mad on changed: base {mad(base,live,chg):5.1f} -> with layers {mad(off,live,chg):5.1f} | within40 {float((np.abs(base-live).max(axis=2)[chg]<=40).mean()):.2f} -> {float((np.abs(off-live).max(axis=2)[chg]<=40).mean()):.2f} | seen mad all: {mad(baseb,liveb):5.1f} -> {mad(offb,liveb):5.1f} | covered {inter/max(1,chg.sum()):.2f} | layers outside changed {float((lay&~chg).sum()/max(1,lay.sum())):.2f}")
