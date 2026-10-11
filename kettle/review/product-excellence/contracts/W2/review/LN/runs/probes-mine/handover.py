import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 handover.py <frames.json> <meta.json> : distance of each screencast frame's backdrop crop to the final live frame, and frame-to-frame jumps in the backdrop
import json, base64, io
import numpy as np
from PIL import Image
fr = json.load(open(sys.argv[1])); meta = json.load(open(sys.argv[2])); t0 = fr['tTap']
rect = meta['states']['loadingEnd']['backdrop']['rect']  # x,y,w,h css
vp = meta['cfg']; 
ims = [(int(f['ts'] - t0), Image.open(io.BytesIO(base64.b64decode(f['data']))).convert('RGB')) for f in fr['frames']]
W, H = ims[-1][1].size
# viewport css size from cfg
import re
m = re.match(r'(\d+)x(\d+)@', vp); vw, vh = int(m.group(1)), int(m.group(2))
sx, sy = W / vw, H / vh
# the backdrop host spans rect; the visible stage-back is above the counter: take the top 60% of the host rect, inside the viewport
x0, y0 = max(0, int(rect[0] * sx)), max(0, int(rect[1] * sy)); x1, y1 = min(W, int((rect[0] + rect[2]) * sx)), min(H, int((rect[1] + rect[3] * 0.6) * sy))
crop = lambda im: np.asarray(im.resize((W, H)).crop((x0, y0, x1, y1))).astype(np.int16)
final = crop(ims[-1][1]); prev = None; tl = meta['timeline']
print('crop', (x0, y0, x1, y1), 'frames', len(ims), 'timeline', [(e['t'], e['st'], e['rd'], e['cv'], e['im'], e['img']) for e in tl])
for t, im in ims:
    a = crop(im); d_final = float(np.abs(a - final).mean()); d_prev = float(np.abs(a - prev).mean()) if prev is not None else None
    print(f'{t:6d}ms  dist_to_final_live {d_final:6.2f}  jump_from_prev {"" if d_prev is None else f"{d_prev:6.2f}"}')
    prev = a
