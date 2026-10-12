import sys; sys.path.insert(0, "/tmp/claude-0/ln-scratch/../ln-pylib"); sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 float_sheet.py <dir> <label> <cfg> <mode> <start> <out.jpg> : early frames of one brew start (bare sky, items-on-sky, still painted), cropped to the top of the screen
import json, base64, io
from PIL import Image, ImageDraw
d, label, cfg, mode, i, out = sys.argv[1:7]
base = f'{d}/{label}-{cfg}-{mode}-s{i}'
fr = sorted(json.load(open(base + '.frames.json')), key=lambda f: f['ts']); cl = json.load(open(base + '.frameclass.json'))
res = json.load(open(f'{d}/{label}-{cfg}-{mode}.json')); tap = res['starts'][int(i) - 1]['fl']['tap']
rows = [(round(f['ts'] - tap), f) for f in fr if f['ts'] >= tap - 300]
cls = {c['t']: c for c in cl}
sel = []
sky = [r for r in rows if cls.get(r[0], {}).get('sky') and not cls.get(r[0], {}).get('vis')]
flo = [r for r in rows if cls.get(r[0], {}).get('vis') and cls.get(r[0], {}).get('sky')]
war = [r for r in rows if cls.get(r[0], {}).get('warm')]
if sky: sel.append(('bare sky', sky[len(sky) // 2]))
if flo: sel += [('items on sky (first)', flo[0]), ('items on sky (mid)', flo[len(flo) // 2]), ('items on sky (last)', flo[-1])]
if war: sel.append(('still painted', war[0]))
vw = [r for r in rows if cls.get(r[0], {}).get('vis') and cls.get(r[0], {}).get('warm')]
if vw: sel.append(('items drawn on painted still (first)', vw[0]))
ims = []
for lab, (t, f) in sel:
    im = Image.open(io.BytesIO(base64.b64decode(f['data']))).convert('RGB'); w, h = im.size; im = im.crop((0, 0, w, int(h * 0.42))); ims.append((f'{lab} @{t} ms', im))
if not ims: print('no frames'); sys.exit()
H = max(i.height for _, i in ims); W = sum(i.width for _, i in ims) + 4 * len(ims); S = Image.new('RGB', (W, H + 14), (40, 40, 40)); x = 0; dr = ImageDraw.Draw(S)
for lab, i2 in ims: S.paste(i2, (x, 14)); dr.text((x + 2, 1), lab, fill=(255, 255, 255)); x += i2.width + 4
S.save(out, quality=78); print('wrote', out, [l for l, _ in ims])
