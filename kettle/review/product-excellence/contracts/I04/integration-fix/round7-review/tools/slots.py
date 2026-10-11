#!/usr/bin/env python3
"""Browser-slot gate for the round-7 review (max nproc-1 browser processes across all lanes).

  python3 slots.py run --lane A --n 2 -- <command ...>   # waits for n slots, runs the command, frees them
  python3 slots.py status                                   # who holds / waits

Count every browser process a command starts: one per Chromium launch, plus one per extra Playwright worker
(e.g. `npx playwright test --workers=2` needs --n 2). Waiters are served by lane priority, then arrival:
FAIR SHARE (changed 2026-10-11 03:58 UTC after Lane A starved the others): waiters are served first by how
many slots their lane already holds (fewest first), then by arrival time. A lane holds at most one job at a time
while any other lane is waiting. A waiter that does not fit blocks the waiters behind it.
"""
import fcntl, json, os, subprocess, sys, time

DIR = '/tmp/rv7-slots'
MAX = max(1, (os.cpu_count() or 4) - 1)
RANK = {}  # fair share: every lane rank 0 (see docstring)

def alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False

def locked(fn):
    os.makedirs(DIR, exist_ok=True)
    with open(f'{DIR}/lock', 'a+') as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        try:
            st = json.load(open(f'{DIR}/state.json'))
        except Exception:
            st = {'hold': [], 'wait': []}
        st['hold'] = [h for h in st['hold'] if alive(h['pid'])]
        st['wait'] = [w for w in st['wait'] if alive(w['pid'])]
        out = fn(st)
        json.dump(st, open(f'{DIR}/state.json', 'w'), indent=1)
        return out

def run(lane, n, cmd):
    me = {'pid': os.getpid(), 'lane': lane, 'n': n, 'rank': RANK.get(lane, 0), 't': time.time(), 'cmd': ' '.join(cmd)[:200]}
    if n > MAX:
        sys.exit(f'slots: --n {n} exceeds the limit {MAX}')
    locked(lambda st: st['wait'].append(me))
    while True:
        def try_take(st):
            used = sum(h['n'] for h in st['hold'])
            held = {}
            for h in st['hold']:
                held[h['lane']] = held.get(h['lane'], 0) + 1
            others_waiting = any(w['lane'] != lane for w in st['wait'])
            if held.get(lane, 0) >= 1 and others_waiting:
                return False   # one job per lane while another lane waits
            q = sorted(st['wait'], key=lambda w: (held.get(w['lane'], 0), w['rank'], w['t']))
            for w in q:
                if w['pid'] == me['pid']:
                    if used + n <= MAX:
                        st['wait'] = [x for x in st['wait'] if x['pid'] != me['pid']]
                        st['hold'].append({**me, 'since': time.time()})
                        return True
                    return False
                if used + w['n'] > MAX:   # a higher-priority waiter that does not fit yet blocks us
                    return False
                used += w['n']            # it would fit: leave room for it
            return False
        if locked(try_take):
            break
        time.sleep(2)
    print(f'[slots] {lane} took {n}/{MAX} at {time.strftime("%H:%M:%S")}: {me["cmd"]}', file=sys.stderr, flush=True)
    try:
        rc = subprocess.call(cmd)
    finally:
        locked(lambda st: st.__setitem__('hold', [h for h in st['hold'] if h['pid'] != me['pid']]))
        print(f'[slots] {lane} freed {n} at {time.strftime("%H:%M:%S")}', file=sys.stderr, flush=True)
    sys.exit(rc)

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'status':
        st = locked(lambda st: st)
        print(f'max {MAX}; held {sum(h["n"] for h in st["hold"])}')
        for h in st['hold']:
            print('HOLD', h['lane'], h['n'], h['pid'], h['cmd'][:120])
        for w in sorted(st['wait'], key=lambda w: (w['rank'], w['t'])):
            print('WAIT', w['lane'], w['n'], w['pid'], w['cmd'][:120])
    elif a and a[0] == 'run' and '--' in a:
        i = a.index('--')
        opts = dict(zip(a[1:i:2], a[2:i:2]))
        run(opts.get('--lane', '?'), int(opts.get('--n', '1')), a[i + 1:])
    else:
        sys.exit(__doc__)
