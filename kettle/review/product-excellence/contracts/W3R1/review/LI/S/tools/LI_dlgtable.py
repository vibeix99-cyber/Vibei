# Lane I: markdown table from LI-sheets.mjs dlg results (base vs trial).
import json, sys
def load(p):
    out = {}
    for l in open(p):
        l = l.strip()
        if l.startswith('{'):
            d = json.loads(l); out[d['cfg']] = d
    return out
b, t = load(sys.argv[1]), load(sys.argv[2])
def short(d):
    if d is None: return 'not run'
    tab = (d.get('tab') or '').replace(' > ', '→')
    return tab
print('| Config | BASE tap Keep it / Delete | BASE Tab ×5 | TRIAL tap Keep it / Delete (tight) | TRIAL Tab ×5 | TRIAL Shift+Tab ×5 | TRIAL trap Tab/Shift |')
print('|---|---|---|---|---|---|---|')
for k in t.keys() | b.keys():
    pass
order = [f'{s}-{th}-{p}' for s in ['390x844','375x667','844x390','1440x900'] for th in ['light','dark'] for p in ['100','200']]
for k in order:
    B, T = b.get(k), t.get(k)
    bt = f"{B.get('keep')} / {B.get('del')}" if B else 'not run'
    tt = f"{T.get('keep')} / {T.get('del')} ({'tight' if T.get('tight') else '-'})" if T else 'not run'
    print(f"| {k} | {bt} | {short(B)} | {tt} | {short(T)} | {(T or {}).get('shift','').replace(' < ','←')} | {(T or {}).get('trap')} |")
print()
print('| Config | BASE Escape → dialogs:focus | BASE outside tap → | BASE Enter on initial focus → dialogs:focus:sessions | BASE Tab+Enter "Delete" → | BASE tap Delete → | TRIAL Escape → | TRIAL outside → | TRIAL Enter on Keep it → | TRIAL tap Keep it → | TRIAL Tab+Enter Delete → | TRIAL tap Delete → |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for k in order:
    B, T = b.get(k) or {}, t.get(k) or {}
    f = lambda d, x: (d.get(x) or '—')
    print(f"| {k} | {f(B,'esc')} | {f(B,'outside')} | {f(B,'kbKeep')} | {f(B,'kbDel')} | {f(B,'ptrDel')} | {f(T,'esc')} | {f(T,'outside')} | {f(T,'kbKeep')} | {f(T,'ptrKeep')} | {f(T,'kbDel')} | {f(T,'ptrDel')} |")
errs = [(k, (b.get(k) or {}).get('error'), (t.get(k) or {}).get('error')) for k in order]
for k, e1, e2 in errs:
    if e1 or e2: print(f'- {k}: base error: {e1}; trial error: {e2}')
