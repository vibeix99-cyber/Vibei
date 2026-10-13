import sys, os, json, itertools
sys.path.insert(0, '/tmp/claude-0/lr-pylib')
import numpy as np
from PIL import Image
root = sys.argv[1]
cfgs = sorted({d.rsplit('-r', 1)[0] for s in ('control', 'trial') if os.path.isdir(f'{root}/{s}') for d in os.listdir(f'{root}/{s}')})
for cfg in cfgs:
    dpr = 2 if cfg.startswith('390') else 1
    runs = {}
    for side in ('control', 'trial'):
        for rep in (1, 2):
            d = f'{root}/{side}/{cfg}-r{rep}'
            if os.path.exists(f'{d}/meta.json') and os.path.exists(f'{d}/ready+3.5s.png'):
                m = json.load(open(f'{d}/meta.json'))
                if m.get('facts'): runs[f'{side[0]}{rep}'] = (m, Image.open(f'{d}/ready+3.5s.png').convert('RGB'))
    print(f'### {cfg}\n')
    print('| run | side | ready after finish() ms | shot at ms | engine in unlock section | chai kind (field) | root.userData.model | .glb requests | card host ready | canvas rect (css px) | scrollY | page errors |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|')
    for k, (m, _) in runs.items():
        f = m['facts']
        print(f"| {k} | {m['side']} | {m.get('readyAtMs')} | {m.get('shotAtMs')} | {f['engineInUnlockSection']} | {f['chaiKind']} | {f['rootUserDataModel']} | {len(m['glb'])} | {f['hostReady']} | {f['canvasRect']} | {f['scrollY']} | {len(m['errors'])} |")
    print('\nCard-canvas crop, pixel difference between two runs (each crop at that run\'s own canvas rect, same size):\n')
    print('| pair | kind of pair | % px diff > 16 | % px diff > 0 | max channel diff |')
    print('|---|---|---|---|---|')
    def crop(k):
        m, im = runs[k]; r = m['facts']['canvasRect']
        x, y, w, h = [v * dpr for v in r]
        return np.asarray(im.crop((x, y, x + w, y + h))).astype(int), (w, h)
    for a, b in itertools.combinations(sorted(runs), 2):
        (A, sa), (B, sb) = crop(a), crop(b)
        kind = 'control vs control (baseline)' if a[0] == b[0] == 'c' else 'trial vs trial' if a[0] == b[0] == 't' else 'control vs trial'
        if sa != sb: print(f'| {a} vs {b} | {kind} | size differs {sa} {sb} | | |'); continue
        d = np.abs(A - B).max(axis=2)
        print(f'| {a} vs {b} | {kind} | {100*(d>16).sum()/d.size:.3f} | {100*(d>0).sum()/d.size:.3f} | {d.max()} |')
    print()
