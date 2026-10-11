import json, glob, os, sys
root = '/tmp/claude-0/ln-scratch/bd'
rows = []
tags = sorted({os.path.basename(p) for p in glob.glob(f'{root}/ctrl/*') + glob.glob(f'{root}/trial/*') if os.path.isdir(p)})
def L(lab, tag):
    p = f'{root}/{lab}/{tag}/meta.json'
    return json.load(open(p)) if os.path.exists(p) else None
for tag in tags:
    c, t = L('ctrl', tag), L('trial', tag)
    def f(m):
        if not m: return 'n/a'
        s = m['states']; o = s.get('off', {}); l = s.get('live', {})
        ob = o.get('backdrop') or {}; lb = l.get('backdrop') or {}
        return f"off:{'still' if ob.get('static') else ob}/{len(ob.get('layers', []))}L cls {round(o.get('cls') or 0, 4)} | live:{'ready' if lb.get('ready') == 'true' and lb.get('hasCanvas') else lb} {m.get('liveReadyAfterTapMs')}ms cls {round(l.get('cls') or 0, 4)} | rect off {ob.get('rect')} live {lb.get('rect')} | err {len(m['errors'])}"
    print(tag); print('  ctrl ', f(c)); print('  trial', f(t))
