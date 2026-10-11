import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# Lane N · dump screencast frames (frames.json) to jpegs named by ms after the tap; report successive-frame diff.
import sys, json, base64, io, os
import numpy as np
from PIL import Image
src, outdir = sys.argv[1], sys.argv[2]
d = json.load(open(src)); t0 = d['tTap']; os.makedirs(outdir, exist_ok=True)
prev = None; rows = []
for f in d['frames']:
    im = Image.open(io.BytesIO(base64.b64decode(f['data']))).convert('RGB')
    t = int(f['ts'] - t0)
    a = np.asarray(im).astype(np.int16)
    diff = float(np.abs(a - prev).mean()) if prev is not None and prev.shape == a.shape else None
    rows.append((t, im.size, diff)); prev = a
    im.save(f'{outdir}/f{t:06d}.jpg', quality=70)
for r in rows: print(r)
