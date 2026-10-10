#!/usr/bin/env python3
"""Package the L1 lane: logs, clips, probes, tables into the receipt dir. python3 -I package.py <scratch L1> <receipt L1 dir>"""
import glob, json, os, shutil, sys

SC, DST = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(f'{SC}/runs.json'))
os.makedirs(DST, exist_ok=True)

# --- raw logs (probe stdout, per-run load log, per-frame jsonl) -----------------------------------------------
n = 0
for sdir in sorted(glob.glob(f'{SC}/*/')):
    series = os.path.basename(sdir.rstrip('/'))
    if series.startswith('pilot'):
        continue
    for rev in ('R5', 'R6'):
        d = f'{sdir}{rev}'
        if not os.path.isdir(d):
            continue
        out = f'{DST}/logs/{series}/{rev}'
        os.makedirs(out, exist_ok=True)
        for p in glob.glob(f'{d}/*'):
            if os.path.isfile(p) and not p.endswith(('.png',)):
                shutil.copy(p, out)
                n += 1
shutil.copy(f'{SC}/pairs.jsonl', f'{DST}/logs/pairs.jsonl')
for f in ('driver.log', 'driver2.log', 'driver3.log', 'driver3b.log', 'driver3c.log'):
    if os.path.exists(f'{SC}/{f}'):
        shutil.copy(f'{SC}/{f}', f'{DST}/logs/{f}')
print('log files', n)

# --- clips -------------------------------------------------------------------------------------------------
os.makedirs(f'{DST}/clips', exist_ok=True)
clips = []


def video_of(series, rev, run):
    g = glob.glob(f'{SC}/{series}/{rev}/video/run{run}/*.webm')
    return g[0] if g else None


CFG = {'375L': '375x667-light', '375D': '375x667-dark', '844L': '844x390-light'}
for c in ('375L', '375D', '844L'):
    # R5: a reproducing run (uniform definition), preferring race-x (video series), then natural-x (video series)
    pick5 = None
    for pre in ('racex', 'naturalx'):
        cand = [r for r in runs if r['series'] == f'{pre}-{c}' and r['rev'] == 'R5' and r.get('d1') and r.get('probe_result') == 'FAIL' and video_of(r['series'], 'R5', r['run'])]
        if cand:
            pick5 = cand[0]
            break
    # R6: natural-x video series (no synthetic events), first run in which the list was scrolled; else race-x
    pick6 = None
    for pre in ('naturalx', 'racex'):
        cand = [r for r in runs if r['series'] == f'{pre}-{c}' and r['rev'] == 'R6' and (r.get('list_max') or 0) > 1 and video_of(r['series'], 'R6', r['run'])]
        if cand:
            pick6 = cand[0]
            break
    for rev, pk in (('R5', pick5), ('R6', pick6)):
        if not pk:
            clips.append({'cfg': c, 'rev': rev, 'clip': None})
            continue
        src = video_of(pk['series'], rev, pk['run'])
        name = f"clip-{rev}-{CFG[c]}-{pk['series'].split('-')[0]}-run{pk['run']}.webm"
        shutil.copy(src, f'{DST}/clips/{name}')
        clips.append({'cfg': c, 'rev': rev, 'clip': name, 'series': pk['series'], 'run': pk['run'], 'label': pk.get('label'), 'result': pk.get('probe_result'),
                      'd1': pk.get('d1'), 'd1_parts': pk.get('d1_parts'), 'list': [pk.get('list_min'), pk.get('list_max')], 'bytes': os.path.getsize(src)})
json.dump(clips, open(f'{DST}/clips/clips.json', 'w'), indent=1)
print(json.dumps(clips, indent=1)[:3000])

# --- probes, tools, tables ----------------------------------------------------------------------------------
os.makedirs(f'{DST}/probes', exist_ok=True)
for f in sorted(glob.glob(f'{HERE}/*')):
    b = os.path.basename(f)
    if b in ('L1',) or os.path.isdir(f):
        continue
    if b.endswith(('.mjs', '.py', '.sh', '.diff')):
        shutil.copy(f, f'{DST}/probes/{b}')
shutil.copy(f'{SC}/runs.json', f'{DST}/runs.json')
for t in glob.glob(f'{SC}/tables/*.md'):
    shutil.copy(t, DST)
os.system(f'cd {DST}/probes && sha256sum *.mjs *.py *.sh > SHA256.txt')
os.system(f'du -sh {DST}')
