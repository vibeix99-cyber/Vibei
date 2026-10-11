import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 pack.py <src_root> <dst_root> [q] : copy a scratch tree to evidence, PNG -> JPEG (q), json/txt as-is, frames.json skipped
import os, sys, shutil
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; q = int(sys.argv[3]) if len(sys.argv) > 3 else 80
n = 0; tot = 0
for dp, dn, fn in os.walk(src):
    for f in fn:
        s = os.path.join(dp, f); rel = os.path.relpath(s, src); d = os.path.join(dst, rel)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        if f.endswith('.png'):
            d = d[:-4] + '.jpg'; Image.open(s).convert('RGB').save(d, quality=q)
        elif f == 'frames.json' or f == 'unlock-frames.json': continue
        else: shutil.copy2(s, d)
        n += 1; tot += os.path.getsize(d)
print(n, 'files', round(tot / 1e6, 1), 'MB')
