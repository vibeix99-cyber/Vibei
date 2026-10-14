# Table for check 2 from S/fix/fit/{BASE,TRIAL,FIX}-fit.json: cut/past-the-edge tile texts per config and seed.
import json, os, sys
d = sys.argv[1]
L = {}
for lab in ['BASE', 'TRIAL', 'FIX']:
    p = os.path.join(d, f'{lab}-fit.json')
    L[lab] = {(r['cfg'], r['seed']): r for r in json.load(open(p))['runs']} if os.path.exists(p) else {}
def cell(r):
    if not r: return 'not run'
    if r.get('error'): return 'error: ' + r['error'][:40]
    bad = sorted({b['text'].split('\n')[0] for b in r['bad'] if b['text'] not in ('days',)})
    s = 'fits' if not r['bad'] else '**cut/past:** ' + ', '.join(f'"{t}"' for t in bad)
    return f"{s} ({r['cols']} col, h {r['height']}, page {r['pageW']}/{r['iw']})"
print('| Config | Seed | BASE 4d36939 :5478 | TRIAL c7a6b8f :5522 | FIX :5502 |')
print('|---|---|---|---|---|')
keys = list(L['FIX'].keys()) or list(L['TRIAL'].keys())
for k in keys:
    print(f'| {k[0]} | {"empty" if k[1] == "blank" else k[1]} | {cell(L["BASE"].get(k))} | {cell(L["TRIAL"].get(k))} | {cell(L["FIX"].get(k))} |')
fx = [r for r in L['FIX'].values()]
print(f"\nFIX: {sum(1 for r in fx if not r['bad'] and not r.get('error'))}/{len(fx)} runs with every tile text fitting.")
