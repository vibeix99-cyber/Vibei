#!/usr/bin/env python3
"""Run one probe invocation on R5 (5302) and R6 (5301) at the same time (call me under slots.py --n 2).
python3 -I pair.py --series S --probe probe.mjs [--env K=V ...] [--video] [--revs R5,R6] -- <probe args with {BASE} {LABEL} {OUT}>"""
import json, os, subprocess, sys, threading, time, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L1'
REV = {'R5': (5302, '20671eb'), 'R6': (5301, 'e866118')}
a = sys.argv[1:]
i = a.index('--')
opts, cmd = a[:i], a[i + 1:]
series = probe = None; extra = {}; video = False; revs = ['R5', 'R6']
k = 0
while k < len(opts):
    if opts[k] == '--series': series = opts[k + 1]; k += 2
    elif opts[k] == '--probe': probe = opts[k + 1]; k += 2
    elif opts[k] == '--env': kv = opts[k + 1].split('=', 1); extra[kv[0]] = kv[1]; k += 2
    elif opts[k] == '--video': video = True; k += 1
    elif opts[k] == '--revs': revs = opts[k + 1].split(','); k += 2
    else: sys.exit('bad opt ' + opts[k])
sha = hashlib.sha256(open(os.path.join(HERE, probe), 'rb').read()).hexdigest()
def snap():
    return {'utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'loadavg': open('/proc/loadavg').read().strip(),
            'uptime': subprocess.run(['uptime'], capture_output=True, text=True).stdout.strip()}
os.makedirs(SC, exist_ok=True)
pr = {'series': series, 'probe': probe, 'sha256': sha, 'revs': revs, 'cmd': cmd, 'env': extra, 'start': snap()}
procs = {}
def go(rev):
    port, sha_r = REV[rev]
    out = f'{SC}/{series}/{rev}'
    os.makedirs(out, exist_ok=True)
    env = dict(os.environ, **extra)
    env['L1_META'] = json.dumps({'series': series, 'rev': rev, 'revision': sha_r, 'port': port, 'url': f'http://127.0.0.1:{port}', 'probe': probe, 'probe_sha256': sha})
    env['L1_RUNLOG'] = f'{out}/runs.jsonl'
    if video: env['L1_VIDEO_DIR'] = f'{out}/video'
    c = ['node', '--import', './L1hook.mjs', probe] + [x.replace('{BASE}', f'http://127.0.0.1:{port}').replace('{LABEL}', rev).replace('{OUT}', out) for x in cmd]
    with open(f'{out}/stdout.txt', 'a') as so:
        so.write(f'### {time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())} {" ".join(c)} env={json.dumps(extra)}\n'); so.flush()
        p = subprocess.Popen(c, cwd=HERE, env=env, stdout=so, stderr=subprocess.STDOUT)
        procs[rev] = p.wait()
ts = [threading.Thread(target=go, args=(r,)) for r in revs]
[t.start() for t in ts]; [t.join() for t in ts]
pr['end'] = snap(); pr['rc'] = procs
open(f'{SC}/pairs.jsonl', 'a').write(json.dumps(pr) + '\n')
print(json.dumps({'series': series, 'rc': procs, 'start': pr['start'], 'end': pr['end']}))
