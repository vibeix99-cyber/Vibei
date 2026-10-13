import json, glob, os, sys, difflib
R = sys.argv[1] if len(sys.argv) > 1 else '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LRC/captures'
cfgs = sorted({os.path.basename(os.path.dirname(p)) for p in glob.glob(R + '/*/*/meta.json')})
def load(side, cfg):
    p = f'{R}/{side}/{cfg}/meta.json'
    return json.load(open(p)) if os.path.exists(p) else None
print('## Nook (4 s after ready)\n')
print('| cfg | side | tier | chai kind (field) | root.userData.model | .glb requests | errors (page/console err) | files |')
print('|---|---|---|---|---|---|---|---|')
for cfg in cfgs:
    for side in ('control', 'trial'):
        m = load(side, cfg)
        if not m: continue
        n = m.get('nook', {}); s = n.get('states', {}).get('nook-3d', {})
        print(f"| {cfg} | {side} | {s.get('quality')} | {s.get('chaiKindField')} | {s.get('rootUserDataModel')} | {len(n.get('glb', []))} | {len(n.get('errors', []))} / {len([c for c in n.get('consoleErr', []) if 'Service Worker' not in c and 'pwa' not in c])} | nook-3d.png |")
print('\n## Summary unlock card (after finish())\n')
print('| cfg | side | capture | hash | engine in unlock section | engine mode | chai kind (field) | root.userData.model | .glb requests so far | actual shot start ms | host (mode/ready/static) |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for cfg in cfgs:
    for side in ('control', 'trial'):
        m = load(side, cfg)
        if not m: continue
        u = m.get('unlock', {})
        for k in ('unlock-4s', 'unlock-10s'):
            s = u.get('states', {}).get(k)
            if not s: print(f'| {cfg} | {side} | {k} | MISSING |'); continue
            hosts = [h for h in s['hosts'] if h['inSection'] and h['inSection'].startswith('Cozy level')]
            print(f"| {cfg} | {side} | {k} | {s['hash']} | {s['engineInUnlockSection']} | {s['engineMode']} | {s['chaiKindField']} | {s.get('rootUserDataModel')} | {s['glbSoFar']} | {s['sinceT0Ms']} | {[(h['mode'], h['ready'], h['static']) for h in hosts]} |")
print('\n## Unlock timing and errors\n')
print('| cfg | side | doneAtMs | mounted after done | ready after done | errors | console err/warn (SW noise excluded) |')
print('|---|---|---|---|---|---|---|')
for cfg in cfgs:
    for side in ('control', 'trial'):
        m = load(side, cfg)
        if not m: continue
        u = m.get('unlock', {}); t = u.get('unlockTiming', {})
        ce = [c for c in u.get('consoleErr', []) if 'Service Worker' not in c and '[pwa]' not in c]
        print(f"| {cfg} | {side} | {u.get('doneAtMs')} | {t.get('mountedAfterDoneMs')} | {t.get('readyAfterDoneMs')} | {u.get('errors')} | {ce} |")
print('\n## Text differences (control vs trial), recorded, not attributed\n')
for cfg in cfgs:
    c, t = load('control', cfg), load('trial', cfg)
    if not c or not t: continue
    for k in ('unlock-4s', 'unlock-10s'):
        a = c['unlock']['states'].get(k, {}); b = t['unlock']['states'].get(k, {})
        for fld in ('unlockText', 'mainText'):
            x, y = a.get(fld) or '', b.get(fld) or ''
            if x != y:
                print(f'- {cfg} {k} {fld}: DIFFERENT')
                print(f'  - control: {x[:600]}')
                print(f'  - trial:   {y[:600]}')
            else:
                print(f'- {cfg} {k} {fld}: identical text')
    a = c['nook']['states'].get('nook-3d', {}); b = t['nook']['states'].get('nook-3d', {})
    x, y = a.get('mainText') or '', b.get('mainText') or ''
    print(f'- {cfg} nook mainText: ' + ('identical text' if x == y else f'DIFFERENT\n  - control: {x[:500]}\n  - trial:   {y[:500]}'))
