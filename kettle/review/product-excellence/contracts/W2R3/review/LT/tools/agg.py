#!/usr/bin/env python3
"""Aggregate ltprobe JSON files into markdown tables (facts only)."""
import json, sys, glob, os, collections

d = sys.argv[1]
files = sorted(glob.glob(os.path.join(d, '*.json')))
rows_inv, rows_undo, rows_bl, rows_misc, hits_drawn = [], [], [], [], []
DRAWN = ('notice', 'other')
for fn in files:
    r = json.load(open(fn))
    name = os.path.basename(fn)[:-5]
    tot = collections.Counter(); n_samples = 0; ns = 0; modal = 0; seen = set(); cut = 0; errs = []
    for g, f in r['groups'].items():
        s = f.get('sampler') or {}
        if f.get('error'): errs.append(f'{g}: {f["error"][:140]}')
        n_samples += s.get('samples', 0); ns += s.get('nSamples', 0); modal += s.get('modalSamples', 0); cut += s.get('cut', 0)
        for k in (s.get('seen') or {}): seen.add(k[:28])
        for k, v in (s.get('geoTop') or {}).items():
            kind, _, top = k.partition('|')
            if kind.startswith('efp9'):
                tot['efp9 modal' if 'modal' in kind else 'efp9 NONMODAL'] += v
                continue
            m = 'modal' in kind
            if top in ('offViewport', 'noticeClippedAway', 'otherClippedAway'):
                tot['clipped/offscreen'] += v
            elif top.startswith('underSheet'):
                tot['under a sheet'] += v
            elif m:
                tot['modal, drawn, top=' + ('notice' if top == 'notice' else 'other/third')] += v
            else:
                key = 'NONMODAL drawn top=notice' if top == 'notice' else ('NONMODAL drawn top=other' if top == 'other' else 'NONMODAL drawn top=third')
                tot[key] += v
                tot['nm-' + kind.split('@')[0].split('+')[0]] += v
        for h in (s.get('hits') or []):
            if 'modal' in h.get('kind', '') or h.get('kind') == 'efp9' and h.get('state', '').endswith('modal'):
                continue
            t = h.get('top', '')
            if h.get('kind') == 'efp9' or t in DRAWN or t.startswith('third'):
                hits_drawn.append((name, g, h))
    rows_inv.append((name, n_samples, ns, modal, tot['NONMODAL drawn top=notice'], tot['NONMODAL drawn top=other'], tot['NONMODAL drawn top=third'], tot['nm-ctl'], tot['nm-text'], tot['nm-row'], tot['efp9 NONMODAL'], tot['modal, drawn, top=notice'] + tot['modal, drawn, top=other/third'], tot['under a sheet'], tot['efp9 modal'], tot['clipped/offscreen'], cut, len(seen), '; '.join(errs)))
    gs = r['groups']
    e = gs.get('end', {})
    mu = e.get('markUndo') or {}
    mx = e.get('markUndoExpire') if isinstance(e.get('markUndoExpire'), dict) else {}
    a06 = e.get('markDoneAt06') or {}
    live_md = [x for x in (e.get('markUndoLive') or []) if x.get('region') == 'said' or 'Crossed' in x.get('text', '')]
    rows_undo.append((name, 'Mark done',
                      f"{a06.get('n')}/9 inView={a06.get('inView')}", f"{(e.get('markDoneTap') or {}).get('tapMs')} ms scrolled={(e.get('markDoneTap') or {}).get('scrolled')}",
                      mu.get('appearFromDownMs'), mu.get('box'), (mu.get('nine') or {}).get('n'), f"{mu.get('sy0')}->{mu.get('syAppear')}", (mu.get('restored') or {}), mx.get('shownMs'), len(live_md)))
    for w in ('mid', 'end'):
        h = gs.get('stats', {}).get(f'history_{w}') or {}
        rows_undo.append((name, f'History {w}', f"row top {h.get('rowTop')}", h.get('how'), h.get('appearFromDownMs'), h.get('box'), (h.get('nine') or {}).get('n'), f"{h.get('syBefore')}->{h.get('syAppear')} (undo row top {h.get('undoRowTop')})", h.get('restored'), (h.get('expire') or {}).get('shownMs'), len([x for x in (gs.get('stats', {}).get('historyLive') or []) if x.get('state') == f'history-{w}'])))
    for w in ('undo', 'expire'):
        h = gs.get('import', {}).get(f'import_{w}') or {}
        rows_undo.append((name, f'Import {w}', f"row top {h.get('rowTop')} err={h.get('err')}", f"sessions {h.get('sessionsAfterImport')}", h.get('appearFromDownMs'), h.get('box'), (h.get('nine') or {}).get('n'), f"{h.get('sy0')}->{h.get('syAppear')} (undo row top {h.get('undoRowTop')})", f"after undo {h.get('sessionsAfterUndo')}" if w == 'undo' else '', (h.get('expire') or {}).get('shownMs'), len([x for x in (gs.get('import', {}).get('importLive') or []) if x.get('state') == f'import-{w}'])))
    bl = (gs.get('home') or {}).get('brewLength') or {}
    opts = bl.get('opts') or []
    rows_bl.append((name, len(opts), sum(1 for o in opts if o['inView']), sum(1 for o in opts if o['ge24']), sum(1 for o in opts if o['nine'] == 9), ' '.join(f"{o['name']}:{o['box']}" for o in opts), bl.get('scrollY')))
    up = (gs.get('update') or {}).get('update') or {}
    q = gs.get('queue') or {}
    rows_misc.append((name, ' / '.join(up.get('timeline', [])[::3])[:200], up.get('tapped'), up.get('onClickCount'), len(q.get('queueSeen') or []), [x['ms'] for x in q.get('queueOrder') or []], len((q.get('queueAfterRoute') or {}).get('queue') or []), (gs.get('break') or {}).get('breakoverNotices'), json.dumps((gs.get('break') or {}).get('ambience'))[:160]))

def table(head, rows):
    out = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
    for r in rows: out.append('| ' + ' | '.join(str(x).replace('|', '/') for x in r) + ' |')
    return '\n'.join(out)

print('### Invariant (100 ms samples)\n')
print(table(['config', 'samples', 'samples with a notice', 'of which a sheet open', 'NON-MODAL drawn overlaps, top=notice', 'top=other', 'top=third', 'ctl', 'text', 'row', '9-pt control points covered by a notice (non-modal, controls)', 'modal drawn intersections', 'under a sheet', '9-pt covered, sheet open (controls)', 'clipped/off-viewport intersections', 'cut notice samples', 'distinct notices seen', 'errors'], rows_inv))
print('\n### Inline Undo\n')
print(table(['config', 'surface', 'before', 'action', 'appear ms (from pointerdown)', 'Undo row box', 'Undo 9/9', 'scrollY before->at appear', 'restored', 'shown ms when left to run out', 'said entries'], rows_undo))
print('\n### Brew length at rest (veteran)\n')
print(table(['config', 'options', 'wholly in view', '>=24x24', '9/9 on top', 'boxes', 'scrollY'], rows_bl))
print('\n### Update prompt, queue, Break\'s over, Ambience\n')
print(table(['config', 'update timeline (every 1.5 s)', 'Update tapped', 'onClick count', 'queue: notices seen of 4', 'queue: change times ms', 'queue length after route change', 'Break\'s over notices', 'Ambience'], rows_misc))
print('\n### Non-modal drawn overlap records (first per config/group/kind/what)\n')
seenk = set()
for name, g, h in hits_drawn:
    k = (name, g, h.get('kind'), h.get('what', '')[:30], h.get('top'))
    if k in seenk: continue
    seenk.add(k)
    print(f"- {name} {g} [{h.get('state')}] {h.get('kind')} top={h.get('top')} points={h.get('points')} notice={h.get('notice')} {h.get('nbox')} vs {h.get('what')} {h.get('box')} sy={h.get('sy')} hash={h.get('hash')}")
