import sys, os, json
sys.path.insert(0, '/tmp/claude-0/lr-pylib')
import numpy as np
from PIL import Image
root = sys.argv[1]
print('| cfg | image | control: card host ready / canvas rect (css px x,y,w,h) | trial: card host ready / canvas rect | crop used (device px) | % px diff > 16 in card canvas | % px diff > 0 | max channel diff |')
print('|---|---|---|---|---|---|---|---|')
for cfg in sorted(os.listdir(f'{root}/control')):
    mc = json.load(open(f'{root}/control/{cfg}/meta.json')); mt = json.load(open(f'{root}/trial/{cfg}/meta.json'))
    dpr = int(cfg.split('x')[0] == '390') + 1  # 390 -> 2, 1440 -> 1
    for name in ('unlock-4s', 'unlock-10s'):
        sc, st = mc['unlock']['states'].get(name), mt['unlock']['states'].get(name)
        if not sc or not st: continue
        rc = [h['ready'] for h in sc['hosts'] if (h['inSection'] or '').startswith('Cozy')]
        rt = [h['ready'] for h in st['hosts'] if (h['inSection'] or '').startswith('Cozy')]
        cr, tr = sc.get('canvasRect'), st.get('canvasRect')
        row = f"| {cfg} | {name} | {rc} {cr} | {rt} {tr} |"
        if not cr or not tr or cr[2:] != tr[2:]:
            print(row + f" size differs or missing | | | |"); continue
        xc, yc, w, h = [v * dpr for v in cr]; xt, yt = tr[0] * dpr, tr[1] * dpr
        A = Image.open(f'{root}/control/{cfg}/{name}.png').convert('RGB'); B = Image.open(f'{root}/trial/{cfg}/{name}.png').convert('RGB')
        if min(xc, yc, xt, yt) < 0 or xc + w > A.size[0] or yc + h > A.size[1] or xt + w > B.size[0] or yt + h > B.size[1]:
            print(row + f" crop outside the viewport shot | | | |"); continue
        a = np.asarray(A.crop((xc, yc, xc + w, yc + h))).astype(int); b = np.asarray(B.crop((xt, yt, xt + w, yt + h))).astype(int)
        x0, y0, x1, y1 = (xc, yc, xc + w, yc + h) if cr == tr else ('own rect', '', '', '')
        d = np.abs(a - b).max(axis=2)
        print(row + f" (control {xc},{yc}; trial {xt},{yt}; {w}x{h}) | {100*(d>16).sum()/d.size:.3f} | {100*(d>0).sum()/d.size:.3f} | {d.max()} |")
