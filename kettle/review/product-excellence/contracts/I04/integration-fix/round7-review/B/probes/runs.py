#!/usr/bin/env python3
"""Lane B relaunch: per-run table (URL/port, revision, probe + sha256, input, start/end) from every probe jsonl.
usage: python3 -I runs.py <B scratch dir> <probe dir> > runs.md"""
import json, glob, os, sys, hashlib, re, datetime
S, P = sys.argv[1], sys.argv[2]
def sha(f):
    return hashlib.sha256(open(os.path.join(P, f), 'rb').read()).hexdigest()
def mt(f):
    return datetime.datetime.utcfromtimestamp(os.path.getmtime(os.path.join(P, f))).strftime('%H:%M:%S')
PROBE = {'read': 'read.mjs', 'cover': 'cover.mjs', 'behave': 'behave.mjs', 'markdone': 'markdone-LEAD.mjs', 'truth': 'truth.mjs', 'hold': 'hold.mjs', 'sum4': 'sum4.mjs'}
# worker log windows for markdone (jsonl carries no timestamps)
def worker_windows():
    w = []
    for f in glob.glob(os.path.join(S, '**', 'job1.log'), recursive=True) + glob.glob(os.path.join(S, '**', 'worker2.log'), recursive=True):
        cur = None
        for l in open(f, errors='replace'):
            m = re.match(r'worker2? (?:\d+ )?task (\d+) start (\d\d:\d\d:\d\d): (.*)', l)
            if m: cur = [m.group(2), None, m.group(3)]
            m = re.match(r'worker2? (?:\d+ )?task (\d+) end (\d\d:\d\d:\d\d)', l)
            if m and cur: cur[1] = m.group(2); w.append(tuple(cur)); cur = None
    return w
W = worker_windows()
def win(kind, base, outdir=None):
    for a, b, cmd in W:
        if cmd.split()[1].startswith(kind) and base in cmd and (outdir is None or outdir in cmd):
            return a, b
    return '', ''
rows = []
for kind in ('read', 'cover', 'behave', 'markdone', 'truth', 'hold', 'sum4'):
    for f in sorted(glob.glob(os.path.join(S, '**', f'{kind}-*.jsonl'), recursive=True)) + sorted(glob.glob(os.path.join(S, '**', f'{kind}2-*.jsonl'), recursive=True)):
        sup = 'superseded' in f
        rel = os.path.relpath(f, S)
        for line in open(f):
            line = line.strip()
            if not line: continue
            try: r = json.loads(line)
            except Exception: continue
            tag = r.get('tag', '?')
            st = (r.get('started') or '')[11:19]; en = (r.get('ended') or '')[11:19]
            if not st and kind == 'markdone':
                st, en = win('markdone', r.get('base', '').split(':')[-1], None)
                st = (st + ' (task)') if st else ''; en = en or ''
            inp = r.get('method') or ('touch (CDP) + wheel' if kind in ('cover', 'sum4') else '')
            if kind == 'cover' or kind == 'sum4': inp = 'real tap/touch drag (phone) or wheel/click (desktop)'
            if kind == 'behave': inp = 'real nav taps + wheel/touch'
            if kind == 'markdone': inp = 'real touch drag + tap (phone) / wheel + click'
            if kind == 'hold': inp = 'none (observation only)'
            if kind == 'truth': inp = 'real taps'
            pf = PROBE[kind]
            late = ''
            try:
                if en and (en < mt(pf)) and not sup: late = f' (ran before last edit of probe, mtime {mt(pf)})'
            except Exception: pass
            res = r.get('error') or ''
            rows.append((kind, rel, tag, r.get('base', ''), r.get('rev', ''), pf, sha(pf)[:12] if os.path.exists(os.path.join(P, pf)) else '', inp, st, en, res + late, sup))
print('| probe | file | run | URL | rev | probe file (sha256 prefix) | input | start UTC | end UTC | note |')
print('|---|---|---|---|---|---|---|---|---|---|')
for k, rel, tag, base, rev, pf, sh, inp, st, en, note, sup in rows:
    print(f"| {k}{' (superseded)' if sup else ''} | {rel} | {tag} | {base} | {rev} | {pf} {sh} | {inp} | {st} | {en} | {note} |")
