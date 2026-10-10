#!/usr/bin/env python3
"""L1 post-processing. python3 -I analyze.py <scratch L1 dir> -> runs.json (per run), prints tables.
Uniform R5-D1 definition applied to every probe's raw frames (independent of each probe's own verdict):
  readHide  : the warning element removed and re-added within 1 s (M1's re-show), outside the entry phase (< warning first shown + 1.2 s)
  readFade  : warning below 0.98 opacity (or absent) after it first reached 0.98, before its own timed end (a removal not followed by a re-add)
  below     : warning layout box bottom > the room's bottom (+0.5 px)
  overDock  : warning layout box bottom > top of the docked start / first protected control (+0.5 px)
  entry     : same removal+re-add within 1.2 s of the warning first being shown (the pre-existing 'entry flicker', not R5-D1)
"""
import json, os, re, sys, glob

ROOT = sys.argv[1]
WARN = 'toast-kettle:save-failed'


def load_jsonl(p):
    out = []
    if os.path.exists(p):
        for ln in open(p):
            ln = ln.strip()
            if ln:
                try:
                    out.append(json.loads(ln))
                except Exception:
                    pass
    return out


def first_num(s):
    return float(s.split()[0]) if s else None


def analyse(kind, rec):
    """kind: natural | race | repro (repro6 / gesture6). Returns metrics dict."""
    f = rec['frames']
    ev = rec['ev']
    wev = [e for e in ev if e[2] == WARN]
    adds = [e[0] for e in wev if e[1] == '+']
    # natural / repro6 / gesture6 record from before End: the first '+' of the warning is its first appearance.
    # race.mjs starts recording ~1.7 s after the warning appeared: its first '+' (if any) is a re-show, so there is no entry phase.
    initial = kind != 'race'
    if not initial:
        adds_for_entry = []
        t_first = f[0][0] if f else 0
    else:
        adds_for_entry = adds
        t_first = adds[0] if adds else (rec.get('tWarn') if kind == 'repro' else (f[0][0] if f else 0))
    m = {'frames': len(f), 'span_ms': (f[-1][0] - f[0][0]) if f else 0}
    if f:
        dts = sorted(b[0] - a[0] for a, b in zip(f, f[1:]))
        m['fps_median_dt'] = dts[len(dts) // 2] if dts else None
        m['max_dt'] = dts[-1] if dts else None
    # indices per kind
    if kind == 'natural':
        iop, itop, ibot, idock, iroom, ilst, iwst = 2, 3, 4, 5, 6, 7, None
    elif kind == 'race':
        iop, itop, ibot, idock, iroom, ilst, iwst = 2, 3, 4, 5, 6, 7, 8
    else:
        iop, itop, ibot, idock, iroom, ilst, iwst = 2, 3, 4, 11, 5, 6, 7
    # entry phase: 1.2 s after the warning first appears, extended to 0.9 s after the last re-show that happens within the first 2 s
    # (the pre-existing 'entry flicker': M1's rule takes the freshly entered warning away and re-shows it, which then enters again)
    entry_end = (max(t_first + 1200, max([a_ for a_ in adds_for_entry if a_ - t_first <= 2000] + [0]) + 900)) if adds_for_entry else -1
    # removals / re-adds
    resets_entry = resets_read = removals_final = 0
    reset_times = []
    for e in wev:
        if e[1] == '-' and (e[0] > t_first or not adds_for_entry):
            back = [x for x in wev if x[1] == '+' and x[0] > e[0] and x[0] - e[0] < 1000]
            if back:
                if adds_for_entry and e[0] < entry_end:
                    resets_entry += 1
                else:
                    resets_read += 1
                    reset_times.append(e[0])
            else:
                removals_final += 1
                m.setdefault('final_removal_t', e[0])
    m.update(resets_entry=resets_entry, resets_read=resets_read, final_removals=removals_final, reset_times=reset_times)
    # timed end: first fading frame before a final removal
    t_end = float('inf')
    if removals_final:
        e = m['final_removal_t']
        win = [x for x in f if e - 700 <= x[0] < e]
        first = next((x for x in win if x[iop] < 0.98), None)
        t_end = (first[0] - 1) if first else e
    t_full = next((x[0] for x in f if x[0] >= (t_first if adds_for_entry else 0) and x[iop] >= 0.98), None)
    judged = [x for x in f if t_full is not None and x[0] >= t_full and x[0] <= t_end]
    # fade/absent frames outside the entry phase
    fade = [x for x in judged if x[iop] < 0.98 and (not adds_for_entry or x[0] >= entry_end)]
    m['fade_frames_read'] = len(fade)
    below = [x for x in judged if x[ibot] is not None and x[iroom] is not None and x[ibot] > x[iroom] + 0.5 and (not adds_for_entry or x[0] >= entry_end)]
    m['below_frames'] = len(below)
    m['max_below_px'] = max([x[ibot] - x[iroom] for x in below], default=0)
    if kind in ('natural', 'race'):
        od = [x for x in judged if x[ibot] is not None and x[idock] is not None and x[ibot] > x[idock] + 0.5 and (not adds_for_entry or x[0] >= entry_end)]
    else:
        od = [x for x in judged if x[ibot] is not None and x[idock] is not None and x[ibot] > x[idock] + 0.5 and (not adds_for_entry or x[0] >= entry_end)]
    m['over_dock_frames'] = len(od)
    m['max_over_dock_px'] = max([x[ibot] - x[idock] for x in od], default=0)
    # entry-phase fade frames (for information)
    m['fade_frames_entry'] = len([x for x in judged if x[iop] < 0.98 and adds_for_entry and x[0] < entry_end])
    m['below_frames_entry'] = len([x for x in judged if x[ibot] is not None and x[iroom] is not None and x[ibot] > x[iroom] + 0.5 and adds_for_entry and x[0] < entry_end])
    lst = [x[ilst] for x in f if x[ilst] is not None]
    m['list_min'] = min(lst) if lst else None
    m['list_max'] = max(lst) if lst else None
    if iwst is not None:
        w = [x[iwst] for x in f if x[iwst] is not None]
        m['warn_scroll_max'] = max(w) if w else None
    if kind == 'repro':
        post = lambda x: (not adds_for_entry) or x[0] >= entry_end
        m['protected_box_frames'] = len([x for x in f if t_full is not None and x[0] >= t_full and x[0] <= t_end and x[8] and post(x)])
        m['drawn_over_frames'] = len([x for x in f if t_full is not None and x[0] >= t_full and x[9] and post(x)])
        m['hit_fail_frames'] = len([x for x in f if t_full is not None and x[0] >= t_full and x[10] and post(x)])
        m['protected_box_frames_entry'] = len([x for x in f if t_full is not None and x[0] >= t_full and x[0] <= t_end and x[8] and not post(x)])
    # older toast expiries
    m['older_gone'] = [e[0] for e in ev if e[1] == '-' and e[2] != WARN]
    # was the list scrolled (|scrollTop| > 1) at the moment each older toast left? (the R5-D1 trigger condition)
    sc = 0
    for te in m['older_gone']:
        # the list is clamped in the frame the toast leaves the DOM, so look at the 300 ms before it
        win = [x[ilst] for x in f if te - 300 <= x[0] <= te and x[ilst] is not None]
        if win and max(abs(v) for v in win) > 1:
            sc += 1
    m['older_expiry_while_scrolled'] = sc
    m['older_expiries'] = len(m['older_gone'])
    # did the PAGE behind scroll (the docked start / first protected control rose by more than 10 px after the warning was settled)?
    jd = [x[idock] for x in judged if x[idock] is not None and (not adds_for_entry or x[0] >= entry_end)]
    ref = jd[0] if jd else None
    m['page_scroll_px'] = (ref - min(jd)) if jd else 0
    m['page_scrolled'] = m['page_scroll_px'] > 10
    t_pm = next((x[0] for x in judged if x[idock] is not None and (not adds_for_entry or x[0] >= entry_end) and ref is not None and ref - x[idock] > 10), None)
    ev_t = list(reset_times) + [x[0] for x in fade] + [x[0] for x in below] + [x[0] for x in od]
    m['t_page_moved'] = t_pm
    m['first_evidence_t'] = min(ev_t) if ev_t else None
    # evidence that starts only after the page behind began to scroll (the dock rose under the toast region) is that mechanism, not R5-D1's
    m['page_induced'] = bool(ev_t and t_pm is not None and min(ev_t) >= t_pm - 200)
    any_ev = bool(resets_read or fade or below or od or (kind == 'repro' and (m['protected_box_frames'])))
    m['d1_any'] = any_ev
    # (B) wider reading: any of the same evidence (including entry-type flicker) that happens after the person's first input began
    all_removals = []
    for e in wev:
        if e[1] == '-':
            if [x for x in wev if x[1] == '+' and x[0] > e[0] and x[0] - e[0] < 1000]:
                all_removals.append(e[0])
    jb = [x for x in f if t_full is not None and x[0] >= t_full and x[0] <= t_end]
    evB = list(all_removals) + [x[0] for x in jb if x[iop] < 0.98] + [x[0] for x in jb if x[ibot] is not None and x[iroom] is not None and x[ibot] > x[iroom] + 0.5] + [x[0] for x in jb if x[ibot] is not None and x[idock] is not None and x[ibot] > x[idock] + 0.5]
    if kind == 'repro':
        evB += [x[0] for x in jb if x[8]]
        t_in = rec['inputs'][0] if rec.get('inputs') else 0
    elif kind == 'natural':
        t_in = (adds[0] + 600) if adds else 0     # natural*.mjs: first wheel / touch / key ~0.6 s after the warning appeared
    else:
        t_in = 0                                  # race*.mjs records only the reading phase
    m['t_first_input'] = t_in
    evB = [t for t in evB if t >= t_in]
    m['d1_B_any'] = bool(evB)
    m['d1_B'] = bool(evB) and not m['page_induced']
    m['d1'] = any_ev and not m['page_induced']
    m['d1_parts'] = [k for k, v in (('hide/reset', resets_read), ('faded/absent', len(fade)), ('below room', len(below)), ('over dock/control', len(od) or (m.get('protected_box_frames') or 0))) if v]
    return m


RESULT_RE = re.compile(r'^(?P<label>.+?): (?P<res>OK|FAIL|ERROR)\b(?P<rest>.*)$')


def stdout_results(path):
    res = []
    if not os.path.exists(path):
        return res
    for ln in open(path):
        if ln.startswith('###') or ln.startswith('SUMMARY') or ln.startswith('  frames'):
            continue
        mm = RESULT_RE.match(ln.rstrip('\n'))
        if mm and not re.match(r'^\S+: \d+ failures in \d+ runs', ln):
            res.append((mm.group('label'), mm.group('res'), mm.group('rest')))
    return res


def main():
    runs = []
    for sdir in sorted(glob.glob(f'{ROOT}/*/')):
        series = os.path.basename(sdir.rstrip('/'))
        if series.startswith('pilot') and '--pilot' not in sys.argv:
            continue
        for rev in ('R5', 'R6'):
            d = f'{sdir}{rev}'
            if not os.path.isdir(d):
                continue
            rl = load_jsonl(f'{d}/runs.jsonl')
            sr = stdout_results(f'{d}/stdout.txt')
            jl = []
            for p in sorted(glob.glob(f'{d}/*.jsonl')):
                if os.path.basename(p) == 'runs.jsonl':
                    continue
                jl += [(p, x) for x in load_jsonl(p)]
            probe = rl[0]['probe'] if rl else '?'
            kind = 'natural' if probe.startswith('natural') else 'race' if probe.startswith('race') else 'repro'
            # map jsonl records to result lines by label/tag
            jmap = {}
            for p, x in jl:
                jmap.setdefault(x.get('tag') or x.get('label'), []).append(x)   # labels repeat when an index is run twice: keep order
            used = {}
            for k, r in enumerate(rl):
                row = {'series': series, 'rev': rev, 'revision': r['revision'], 'port': r['port'], 'probe': probe, 'probe_sha256': r['probe_sha256'], 'run': r['run'],
                       'start_utc': r['start']['utc'], 'end_utc': r['end']['utc'], 'load_start': first_num(r['start']['loadavg']), 'load_end': first_num(r['end']['loadavg']),
                       'loadavg_start': r['start']['loadavg'], 'loadavg_end': r['end']['loadavg'], 'uptime_start': r['start']['uptime'], 'uptime_end': r['end']['uptime'],
                       'video': r.get('video')}
                if k < len(sr):
                    label, res, rest = sr[k]
                    row.update(label=label, probe_result=res, probe_text=(res + rest)[:300])
                    lst_ = jmap.get(label) or []
                    ui = used.get(label, 0)
                    x = lst_[ui] if ui < len(lst_) else None
                    used[label] = ui + 1
                    if x:
                        row.update(analyse(kind, x))
                        row['probe_bad'] = x.get('bad')
                        if 'timing' in x:
                            row['input'] = x['how'] if 'how' in x else ''
                            row['timing'] = x['timing']
                            row['inputs_ms'] = [x['inputs'][0], x['inputs'][-1], len(x['inputs'])] if x.get('inputs') else None
                            row['tWarn'] = x.get('tWarn')
                        if 'tRel' in x:
                            row['tRel'] = x['tRel']
                        if 'tTop' in x:
                            row['tTop'], row['tDown'] = x['tTop'], x['tDown']
                    else:
                        row['no_frames'] = True
                else:
                    row['probe_result'] = 'MISSING'
                runs.append(row)
    json.dump(runs, open(f'{ROOT}/runs.json', 'w'), indent=0)
    print(len(runs), 'runs')


main()
