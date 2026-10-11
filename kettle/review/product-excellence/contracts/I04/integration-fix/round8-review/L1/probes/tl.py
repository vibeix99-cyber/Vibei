# l1dock2 timeline: bad toast frames grouped by phase (runs of consecutive frames)
import json, glob
for f in sorted(glob.glob('/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round8-review/L1/runs/c1-l1dock2-r8/l1dock2-*.jsonl')):
    for l in open(f):
        r = json.loads(l); fr = r.get('frames') or {}
        print(f"## {r['rev']} {r['W']}x{r['H']} @{r['text']} {r['theme']} {r['input']} utc {r['utc'][11:19]} err={r.get('error')} frames={fr.get('frames')} ctlBad={fr.get('ctlBad')} toastBad={fr.get('toastBad')}/{fr.get('toastBadSettled')} taps={[ (t['where'],t['label'],t.get('activated')) for t in r['taps']]}")
        runs = []
        for x in fr.get('toastAll', []):
            key = (x['phase'], tuple(s.split(':')[0] for s in x['ts']))
            if runs and runs[-1]['key'] == key and x['t'] - runs[-1]['t1'] < 120:
                runs[-1]['t1'] = x['t']; runs[-1]['n'] += 1; runs[-1]['vals'].add(';'.join(x['ts'])); runs[-1]['s1'] = x['since']
            else:
                runs.append({'key': key, 't0': x['t'], 't1': x['t'], 'n': 1, 'vals': {';'.join(x['ts'])}, 's0': x['since'], 's1': x['since'], 'stack': x['n'], 'docked': x['docked']})
        for g in runs:
            print(f"  phase={g['key'][0]!r} t={g['t0']}-{g['t1']}ms frames={g['n']} since={g['s0']}-{g['s1']} stack={g['stack']} docked={g['docked']} vals={sorted(g['vals'])[:4]}")
