import json, glob, os, re
SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/M7a'
EV = '/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a'
V = json.load(open(f'{SC}/vals.json'))
V.update(rev='980ef2a', src='6db18ada524d3ca6354151ee59a5e3e8c239c604', trial='d413a1fa580047e812dd40d0780ba27470f79d06', trialsrc='6db18ada524d3ca6354151ee59a5e3e8c239c604')

def jl(p):
    out = []
    for f in glob.glob(p):
        for l in open(f, encoding='utf-8'):
            if l.startswith('{'):
                out.append(json.loads(l))
    return out

# late
rows = jl(f'{EV}/cls/late.jsonl')
lab = 'FINAL' if any(r['label'] == 'FINAL' for r in rows) else None
src_note = ''
if not lab:
    rows = jl(f'{EV}/cls/superseded-49ea1de/late.jsonl'); src_note = ' (run on `49ea1de`; the banner and Today code are identical on the final revision — the later commits touch only the toast room, which has no top bar on Today)'
    lab = 'M7a'
t = [f'| Config | with compensation: task field moved · docked start moved · banner top after · scrollY before→after · CLS (all / without recent input) | counterfactual (no scroll): task field moved · under the finger after |', '|---|---|---|']
for r in rows:
    if r['label'] != lab:
        continue
    cf = next((x for x in rows if x['label'] == lab + '-CF' and x['W'] == r['W'] and x['H'] == r['H'] and x['text'] == r['text']), None)
    t.append(f"| {r['W']}×{r['H']} @{r['text']} | {r['fieldMovedPx']} px · {r['dockMovedPx']} px · {r['bannerTop']} · {r['scrollY'][0]}→{r['scrollY'][1]} · {r['cls']} / {r['clsNoRecentInput']} | " + (f"{cf['fieldMovedPx']} px · {cf['underFingerAfter']} |" if cf else 'PENDING |'))
V['late_table'] = '\n'.join(t) + ('\n\n' + src_note.strip() if src_note else '')

# clsload
cl = jl(f'{EV}/cls/clsload.jsonl')
by = {}
for r in cl:
    by.setdefault((r['label'], r['W'], r['H']), []).append(r['cls'])
labs = [l for l in ['FINAL', 'E866', 'INT'] if any(k[0] == l for k in by)]
t = ['| Config | ' + ' | '.join({'FINAL': 'final (49ea1de tree for Today)', 'E866': 'e866118', 'INT': 'INT'}[l] for l in labs) + ' |', '|---|' + '---|' * len(labs)]
for W, H in [(390, 844), (375, 667), (1440, 900), (844, 390)]:
    t.append(f'| {W}×{H} | ' + ' | '.join(', '.join(str(x) for x in by.get((l, W, H), [])) for l in labs) + ' |')
V['clsload_table'] = '\n'.join(t)
b = [r for r in jl(f'{EV}/cls/cls.jsonl') if r['label'] in ('M7a',)] or jl(f'{EV}/cls/superseded-49ea1de/cls.jsonl')
V['cls_b'] = ', '.join(f"{r['W']}×{r['H']}: {r['b_todayAfterFailure']['cls']} (without recent input {r['b_todayAfterFailure']['clsNoInput']})" for r in b)

# toastcheck
tc = f'{EV}/m7b-on-final/toastcheck.log'
if os.path.exists(tc):
    lines = [l.strip() for l in open(tc) if l.startswith('FINAL')]
    cov = [l for l in lines if 'COVERED' in l]
    V['toastcheck'] = f"{len(lines)} rows on the final revision ({', '.join(sorted({' '.join(l.split()[1:3]) for l in lines}))}); **{len(cov)} with a control covered**" + (':\n' + '\n'.join(f'  - `{l[:200]}`' for l in cov) if cov else ' — Close, Ambience, Mute and every panel control clear with 1 and with 3 toasts, at the top and at the end of the panel.') + ' `r7/M7a/m7b-on-final/toast-check/`.'
rc = f'{EV}/m7b-on-final/reach.log'
if os.path.exists(rc):
    txt = open(rc).read()
    tail = [l for l in txt.splitlines() if re.search(r'fail|FAIL|runs|reached|summary', l)][-6:]
    V['reach'] = 'final revision, 375×667 light and dark: ' + ('; '.join(f'`{l.strip()[:160]}`' for l in tail) if tail else 'see `r7/M7a/m7b-on-final/reach.log`') + '.'

# summary-end
se = []
for r in jl(f'{EV}/captures/AFTER-final/notes-FINAL.jsonl'):
    if r.get('summaryEnd'):
        s = r['summaryEnd']; se.append(f"{r['tag']}: last line bottom {s['lastLineBottom']} vs footer top {s['footerTop']} → {'clears' if s['clears'] else '**does not clear**'}")
if se:
    V['summary_end'] = 'measured on every AFTER configuration (`summary-end-*.png`, `notes-FINAL.jsonl`): ' + '; '.join(se)
# brew
bl = f'{EV}/captures/brew100/log.txt'
if os.path.exists(bl):
    done = [l for l in open(bl) if 'rc=' in l]
    V['brew'] = f"`captures/brew100/<rev>-<WxH>-<theme>[-rm]/` (the repo's `tools/capture.mjs --only 02,03,04,13`: focus start, mid, paused, first brew), INT and final: {len(done)} of 14 runs done ({'; '.join(l.strip() for l in done)})."
json.dump(V, open(f'{SC}/vals.json', 'w'), ensure_ascii=False)
print({k: (v[:80] if isinstance(v, str) else v) for k, v in V.items()})
