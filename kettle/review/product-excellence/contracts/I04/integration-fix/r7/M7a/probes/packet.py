#!/usr/bin/env python3
"""Compose ROUND7-READY-FOR-REVIEW.md from the parts and the run data."""
import json, glob, os, re, sys
ROOT = '/home/user/wt/r7a/kettle'
EV = f'{ROOT}/review/product-excellence/contracts/I04/integration-fix/r7/M7a'
SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/M7a'
P = json.load(open(f'{SC}/packet-parts.json'))
T = json.load(open(f'{SC}/packet-text.json'))  # hand-written sections


def jl(path):
    out = []
    for f in glob.glob(path):
        for l in open(f, encoding='utf-8'):
            l = l.strip()
            if l.startswith('{'):
                out.append(json.loads(l))
    return out


def cfgname(label):
    m = re.search(r'(\d+)x(\d+)@(\d+) (\w+)', label)
    return f'{m[1]}×{m[2]} @{m[3]} {m[4]}'


# ---- LEAD-D1 tables
def lead_rows(series, rev):
    rows = {}
    for r in jl(f'{EV}/runs/{series}/{rev}/*pair-*.jsonl'):
        rows[cfgname(r['label'])] = r
    return rows


ctl = lead_rows('lead-ap', 'E866'); fin = lead_rows('lead-ap', 'M7a')
order = ['375×667 @200 light', '375×667 @200 dark', '844×390 @200 light', '667×375 @150 dark', '375×667 @150 light', '390×844 @100 light', '375×667 @100 light', '1440×900 @100 light']
lt = ['| Config | e866118: adds/removals · frames at full opacity · toast box over the dock · live-region additions | Final: adds/removals · frames at full opacity · banner drift · Save backup cut · live-region additions |', '|---|---|---|']
for k in order:
    c = ctl.get(k); f = fin.get(k)
    cs = f"{'**' if c and c['warnAdds'] > 1 else ''}{c['warnAdds']}/{c['warnRemovals']}{'**' if c and c['warnAdds'] > 1 else ''} · {c['framesFullOpacity']}/{c['judgedFrames']} · {c['framesBoxOverDock']} · {c['liveRegionAdditions']}" if c else 'not run'
    fs = f"{f['warnAdds']}/{f['warnRemovals']} · {f['framesFullOpacity']}/{f['judgedFrames']} · {f['bannerDriftPx']} px · {f['framesSaveBackupCut']} · {f['liveRegionAdditions']}" if f else 'PENDING'
    lt.append(f'| {k} | {cs} | {fs} |')
LEADTABLE = '\n'.join(lt)

ctl = lead_rows('lead-pp', 'E866'); fin = lead_rows('lead-pp', 'M7a')
pt = ['| Config | e866118 | Final |', '|---|---|---|']
for k in ['375×667 @200 light', '667×375 @150 dark']:
    c = ctl.get(k); f = fin.get(k)
    cs = f"**{c['warnAdds']}/{c['warnRemovals']}**, last removal {c['lastWarnRemoval']/1000:.1f} s, {c['framesFullOpacity']}/{c['judgedFrames']} frames at full opacity, {c['framesBoxOverDock']} with its box over the dock, **{c['liveRegionAdditions']}** live-region additions" if c else 'not run'
    fs = f"**{f['warnAdds']}/{f['warnRemovals']}**, {f['framesFullOpacity']}/{f['judgedFrames']} at full opacity, drift {f['bannerDriftPx']} px, Save backup cut in {f['framesSaveBackupCut']} frames, **{f['liveRegionAdditions']}** live-region addition" if f else 'PENDING'
    pt.append(f'| {k} | {cs} | {fs} |')
PPTABLE = '\n'.join(pt)

# ---- R5-D1
rt = ['| Config (200 % text) | R5 `20671eb` (:5302): failing runs (details) · live-region additions per run | Final: failing runs · banner adds/removals · additions per run |', '|---|---|---|']
for cfg, nm in [('375x667-light', '375×667 light'), ('844x390-light', '844×390 light'), ('375x667-dark', '375×667 dark')]:
    cells = []
    for rev in ['R5', 'M7a']:
        rs = jl(f'{EV}/runs/r5d1-{cfg}/{rev}/natural-*.jsonl')
        if not rs:
            cells.append('PENDING'); continue
        fails = [r for r in rs if r['bad']]
        said = {}
        for r in rs:
            n = len(r.get('said', [])); said[n] = said.get(n, 0) + 1
        sd = ', '.join(f'{k} ({v})' for k, v in sorted(said.items()))
        if rev == 'R5':
            WRE = re.compile(r'wait=(\d+)')
            det = '; '.join('wait ' + WRE.search(r['tag'])[1] + ': ' + ' & '.join(r['bad']) for r in fails)
            cells.append(f"**{len(fails)}/{len(rs)}** ({det}) · {sd}")
        else:
            ar = {f"{r.get('adds')}/{r.get('rems')}" for r in rs}
            cells.append(f"**{len(fails)}/{len(rs)}** · {', '.join(sorted(ar))} · {sd}")
    rt.append(f'| {nm} | {cells[0]} | {cells[1]} |')
R5TABLE = '\n'.join(rt)

# ---- Close
ct = ['| Configuration | Input | Unfixed combined `49ea1de` (:5226): runs failing · controls covered (frames) · real tap received | Final: runs failing · covered · tap received |', '|---|---|---|---|']
def close_rows(lab):
    d = {}
    for r in jl(f'{EV}/runs/close/closecheck-{lab}.jsonl'):
        if r.get('error'):
            continue
        d.setdefault((r['W'], r['H'], r['text'], r['theme'], r['how']), []).append(r)
    return d
C = close_rows('CTL-49ea1de'); F = close_rows('FINAL')
def summ(rows):
    if not rows:
        return 'PENDING'
    bad = [r for r in rows if not r['ok']]
    cov = {}
    for r in rows:
        for k, v in (r.get('covered') or {}).items():
            cov[k] = cov.get(k, 0) + v
    taps = ', '.join(f"{r['target']}: {'yes' if r['tapReceived'] else '**no** (' + ','.join(r['clicks']) + ')'}" for r in rows)
    return f"{len(bad)}/{len(rows)} · {json.dumps(cov) if cov else 'none'} · {taps}"
for k in sorted(set(C) | set(F), key=lambda k: (-k[2], k[0], k[3], k[4])):
    ct.append(f'| {k[0]}×{k[1]} @{k[2]} {k[3]} | {k[4]} | {summ(C.get(k))} | {summ(F.get(k))} |')
CLOSETABLE = '\n'.join(ct)
geo = []
for k in sorted(set(C) & set(F)):
    c, f = C[k][0], F[k][0]
    geo.append(f"| {k[0]}×{k[1]} @{k[2]} {k[3]} {k[4]} | {c.get('region')} | {f.get('region')} | {'identical' if c.get('toastRects') == f.get('toastRects') else 'DIFFER'} |")
GEOTABLE = '| Configuration | Room top–bottom, unfixed | Room top–bottom, final | Three toasts\' boxes |\n|---|---|---|---|\n' + '\n'.join(geo)

# ---- tests
def tline(pr):
    f = f'{SC}/tests-final-{pr}.log'
    if not os.path.exists(f):
        return 'PENDING'
    t = open(f, encoding='utf-8', errors='replace').read()
    m = re.findall(r'^\s+(\d+) (passed|failed|skipped|flaky|did not run)', t, re.M)
    return ', '.join(f'{a} {b}' for a, b in m) or 'PENDING'
fails = []
f = f'{SC}/tests-final-chromium.log'
if os.path.exists(f):
    fails = [l.strip()[:220] for l in open(f, encoding='utf-8', errors='replace') if '✘' in l]
TESTS = '\n'.join([
    f"| chromium (all specs except timer/pwa) | {tline('chromium')} |",
    f"| timer-harness | {tline('timer-harness')} |",
    f"| timer-app | {tline('timer-app')} |",
    f"| pwa | {tline('pwa')} |",
]) + ('\n\nFailures in the chromium run: \n' + '\n'.join(f'- `{x}`' for x in fails) if fails else '')

text = T['template']
for k, v in dict(LEADTABLE=LEADTABLE, PPTABLE=PPTABLE, R5TABLE=R5TABLE, CLOSETABLE=CLOSETABLE, GEOTABLE=GEOTABLE, TESTS=TESTS, **{f'P_{k}': v for k, v in P.items()}).items():
    text = text.replace('{{' + k + '}}', v)
for k, v in T.items():
    if k != 'template':
        text = text.replace('{{' + k + '}}', v)
open(f'{ROOT}/review/product-excellence/contracts/I04/ROUND7-READY-FOR-REVIEW.md', 'w', encoding='utf-8').write(text)
left = re.findall(r'\{\{\w+\}\}', text)
print('written; placeholders left:', left, '; PENDING count:', text.count('PENDING'))
