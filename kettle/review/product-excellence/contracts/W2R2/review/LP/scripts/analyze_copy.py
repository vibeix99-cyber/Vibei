#!/usr/bin/env python3
"""Copy / facts analysis over lp-probe2 output: control (C) vs P, every config run, per day."""
import json, sys, glob, os, re, difflib

dirs = sys.argv[1:]
runs = []
for d in dirs:
    for f in sorted(glob.glob(f'{d}/*/[CP]-*.json')):
        tag = os.path.basename(os.path.dirname(f))
        side, day = os.path.basename(f)[:-5].split('-', 1)
        runs.append((tag, day, side, json.load(open(f))))

def norm(t): return re.sub(r'\s+', ' ', t or '').strip()

def ctx(text, m, n=48):
    b = 'BADGE ' if text[max(0, m.start() - 5): m.end()] == 'Warm Streak' else ''
    return b + norm(text[max(0, m.start() - n): m.end() + n])

def whole(text):
    # attribute values: classify each match
    ms = list(re.finditer(r'streak', text, re.I))
    return ('BADGE ' if ms and all(text[max(0, m.start() - 5): m.end()] == 'Warm Streak' for m in ms) else '') + norm(text)

def snapshots(r):
    out = {}
    for ph in ('arrival', 'settled', 'end'):
        s = r.get(ph)
        if s and 'copy' in s: out[ph] = s
    return out

# ---- 1. is the copy the same across configs, per (day, side)?
print('## Copy stability across configurations (distinct values per day and build; arrival/settled/end)\n')
by = {}
for tag, day, side, r in runs:
    for ph, s in snapshots(r).items():
        c = s['copy']
        sig = {
            'visible': norm(c['visible']), 'textContent': norm(c['textContent']), 'pills': tuple(c['pills']), 'said': c['said'],
            'srOnly': tuple(c['srOnly']), 'aria': tuple(c['aria']), 'footer': c['footer'], 'detailsText': c['detailsText'], 'detailsOpen': c['detailsOpen'],
        }
        by.setdefault((day, side, ph), {}).setdefault(json.dumps(sig, sort_keys=True), []).append(tag)
for k in sorted(by):
    print(f'- {k[0]} / {k[1]} / {k[2]}: {len(by[k])} distinct copy variant(s) across {sum(len(v) for v in by[k].values())} runs' + ('' if len(by[k]) == 1 else '  <- variants: ' + ' | '.join(f"{len(v)} runs e.g. {v[0]}" for v in by[k].values())))

# ---- 2. per day: control vs P (use the first run of each side; the line above shows whether they all agree)
print('\n## Every reward text, number and sentence: control vs P (settled state unless noted; first config run; identical lines omitted)\n')
for day in ['routine', 'task', 'big', 'milestone']:
    cs = [r for t, d, s, r in runs if d == day and s == 'C' and r.get('settled')]
    ps = [r for t, d, s, r in runs if d == day and s == 'P' and r.get('settled')]
    if not cs or not ps: continue
    c, p = cs[0], ps[0]
    print(f'### {day} day (seed {c["seed"]}{", task" if c["task"] else ""})')
    for label, getter in [
        ('visible text (line by line)', lambda s: [norm(x) for x in s['copy']['visible'].split('\n') if norm(x)]),
        ('reward pills (Rewards li textContent)', lambda s: s['copy']['pills']),
        ('sr-only strings', lambda s: s['copy']['srOnly']),
        ('aria-labels in the summary', lambda s: s['copy']['aria']),
        ('live announcement (role=status in the summary)', lambda s: [s['copy']['said']]),
        ('footer', lambda s: [s['copy']['footer']]),
    ]:
        a, b = getter(c['settled']), getter(p['settled'])
        if a == b:
            print(f'- {label}: IDENTICAL ({len(a)} item(s)): {json.dumps(a, ensure_ascii=False)[:600]}')
        else:
            print(f'- {label}: DIFFERENT')
            for l in difflib.unified_diff(a, b, 'control', 'P', lineterm='', n=0):
                if l.startswith(('---', '+++', '@@')): continue
                print(f'    {l}')
    # details (arithmetic) after the real click, end state
    ce, pe = c.get('end'), p.get('end')
    if ce and pe:
        a, b = ce['copy'].get('detailsRows'), pe['copy'].get('detailsRows')
        print(f'- arithmetic rows after the toggle click (aria-expanded control={ce["copy"]["detailsOpen"]} P={pe["copy"]["detailsOpen"]}): ' + ('IDENTICAL' if a == b else 'DIFFERENT'))
        print(f'    control rows: {json.dumps(a, ensure_ascii=False)}')
        if a != b: print(f'    P rows:       {json.dumps(b, ensure_ascii=False)}')
        ta, tb = norm(ce['copy']['detailsText'] or ''), norm(pe['copy']['detailsText'] or '')
        print(f'    control details text: {ta}')
        if ta != tb: print(f'    P details text:       {tb}')
    # toasts
    print(f'- toasts during summary: control {c["settled"]["copy"]["toasts"]} / P {p["settled"]["copy"]["toasts"]}')
    print()

# ---- 3. every "streak" occurrence
print('## Every occurrence of “streak” (case-insensitive) on the summary: where, and the surrounding words\n')
print('Sources: visible text (innerText), textContent (adds sr-only and closed/hidden content), sr-only elements, aria-label/aria-*/alt/title attributes (any non-data attribute), svg title/desc, the summary live region, every document-wide live region/announcer/toast (snapshot), and a MutationObserver log of every live-region text from page load to the end of the run (focus screen + summary).\n')
agg = {}
for tag, day, side, r in runs:
    for ph in ('arrival', 'settled', 'end'):
        s = r.get(ph)
        if not s or 'copy' not in s: continue
        c = s['copy']
        occ = []
        for m in re.finditer(r'streak', c['visible'], re.I): occ.append(('visible text', ctx(c['visible'], m)))
        for m in re.finditer(r'streak', c['textContent'], re.I): occ.append(('textContent (visible + sr-only + hidden)', ctx(c['textContent'], m)))
        for t in c['srOnly']:
            for m in re.finditer(r'streak', t, re.I): occ.append(('sr-only element', ctx(t, m, 80)))
        for t in c['aria']:
            if re.search('streak', t, re.I): occ.append(('aria-label', whole(t)))
        for m in re.finditer(r'streak', c['said'], re.I): occ.append(('summary live region (role=status)', ctx(c['said'], m, 80)))
        for h in s['streakScan']['attrHits']: occ.append((f'attribute {h["attr"]} on <{h["el"]}>', whole(h['value'])))
        for h in s['streakScan']['svgText']: occ.append(('svg title/desc', whole(h)))
        for h in s['streakScan']['liveDoc']: occ.append((f'document live region ({h["where"]}, {h["tag"]})', whole(h['text'])))
        for k in occ: agg.setdefault((day, side, ph), set()).add(k)
    for e in (r.get('live') or []):
        for m in re.finditer(r'streak', e['text'], re.I): agg.setdefault((day, side, 'live-log'), set()).add((f'live-region log at {e["hash"]}', ctx(e['text'], m, 80)))
    # internal data attributes (not user-facing)
    for ph in ('settled',):
        s = r.get(ph)
        if s:
            for h in s['streakScan']['dataHits']: agg.setdefault((day, side, 'internal'), set()).add((f'internal {h["attr"]} on <{h["el"]}> (not user-facing)', h['value']))
def is_badge(txt): return txt.startswith('BADGE ')
for side in 'CP':
    print(f'### {"Control b377c62" if side == "C" else "P trial"}\n')
    print('| day | phases seen | where | words around it (BADGE = the badge name “Warm Streak”) |')
    print('|---|---|---|---|')
    merged = {}
    for k, v in agg.items():
        if k[1] != side: continue
        for where, txt in v: merged.setdefault((k[0], where, txt), set()).add(k[2])
    for (day, where, txt), phs in sorted(merged.items(), key=lambda x: (['routine', 'task', 'big', 'milestone'].index(x[0][0]), x[0][1], x[0][2])):
        print(f'| {day} | {",".join(sorted(phs))} | {where} | {txt} |')
    print()
# totals
print('### Totals of occurrences excluding the badge name “Warm Streak”, distinct (where, text) per day, all phases merged\n')
print('| build | day | non-badge occurrences (visible/sr/aria/attr/live) | badge-name occurrences |')
print('|---|---|---|---|')
for side in 'CP':
    for day in ['routine', 'task', 'big', 'milestone']:
        nb, bd = set(), set()
        for k, v in agg.items():
            if k[0] == day and k[1] == side and k[2] != 'internal':
                for where, txt in v:
                    if where.startswith('textContent'): continue  # superset of the others
                    (bd if is_badge(txt) else nb).add((where.split(' at ')[0], txt))
        if any(k[0] == day and k[1] == side for k in agg) or any(d == day and s == side for t, d, s, r in runs):
            print(f'| {"control" if side == "C" else "P"} | {day} | {len(nb)}{(": " + "; ".join(f"[{w}] {t}" for w, t in sorted(nb))) if nb else ""} | {len(bd)} |')
