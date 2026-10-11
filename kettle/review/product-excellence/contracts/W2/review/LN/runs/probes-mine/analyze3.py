import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 analyze3.py name off_with_layers.png off_base.png live.png [off_with_layers_back.png off_base_back.png live_back.png]
import numpy as np
from PIL import Image
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def mad(a, b, m=None):
    d = np.abs(a - b).mean(axis=2); return float(d[m].mean()) if m is not None else float(d.mean())
name, o, b, l = sys.argv[1:5]
off, base, live = load(o), load(b), load(l)
chg = np.abs(live - base).max(axis=2) > 30; lay = np.abs(off - base).max(axis=2) > 30; inter = (lay & chg).sum()
s = f"{name:34s} changed {chg.mean()*100:4.1f}% | raw mad on changed: base {mad(base,live,chg):5.1f} -> with layers {mad(off,live,chg):5.1f} | within40 {float((np.abs(base-live).max(axis=2)[chg]<=40).mean()):.2f} -> {float((np.abs(off-live).max(axis=2)[chg]<=40).mean()):.2f} | raw mad all {mad(base,live):5.1f} -> {mad(off,live):5.1f} | covered {inter/max(1,chg.sum()):.2f} | layers outside changed {float((lay&~chg).sum()/max(1,lay.sum())):.2f}"
if len(sys.argv) >= 8:
    ob, bb, lb = load(sys.argv[5]), load(sys.argv[6]), load(sys.argv[7]); s += f" | seen mad all {mad(bb,lb):5.1f} -> {mad(ob,lb):5.1f}"
print(s)
