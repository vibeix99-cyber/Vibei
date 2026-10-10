#!/usr/bin/env python3
"""Build the markdown tables for RECEIPT.md from runs.json. python3 -I report.py <scratch L1> <outdir>"""
import json, os, re, sys, collections

SC, OUT = sys.argv[1], sys.argv[2]
runs = json.load(open(f'{SC}/runs.json'))
CFG = {'375L': '375×667 light', '375D': '375×667 dark', '844L': '844×390 light'}


def parse(series):
    name, cfg = series.rsplit('-', 1)
    return name, cfg


GROUP = {  # series prefix -> (group id, human name)
    'natural': ('natural', 'natural.mjs (unedited)'),
    'nx': ('natural-x', 'natural-x.mjs (L1 adaptation: direction-aware)'),
    'ngfling': ('natural-g fling', 'natural-g.mjs GESTURE=fling (L1 extra: natural flow with fast touch flings)'),
    'ngfine': ('natural-g fine', 'natural-g.mjs GESTURE=fine (L1 extra: natural flow with trackpad-like 2-5 px wheel)'),
    'ngkbd': ('natural-g kbd', 'natural-g.mjs GESTURE=kbd (L1 extra: natural flow with keyboard scrolling)'),
    'gflingpage': ('gesture-fling (warning-only classes)', 'gesture6-sel.mjs fling, timing classes 0-2 (warning-only stack)'),
    'dn': ('natural R5-alone (diagnostic)', 'natural.mjs on R5 only (diagnostic)'),
    'drepro': ('repro6-sel R5-alone (diagnostic)', 'repro6-sel.mjs on R5 only (diagnostic)'),
    'dnx6': ('natural-x R6-alone (diagnostic)', 'natural-x.mjs on R6 only, one browser (diagnostic)'),
    'drepro6': ('repro6-sel R6-alone (diagnostic)', 'repro6-sel.mjs on R6 only (diagnostic)'),
    'dnx': ('natural-x R5-alone (diagnostic)', 'natural-x.mjs on R5 only, one browser (diagnostic, beyond the 10-run cap)'),
    'naturalx': ('natural-x+video', 'natural-x.mjs, video hook on (clip series)'),
    'race': ('race', 'race.mjs (unedited, POST=100)'),
    'rx': ('race-x', 'race-x.mjs (L1 adaptation: direction-aware, POST=100)'),
    'racex': ('race-x+video', 'race-x.mjs, video hook on (clip series)'),
    'repro6sel': ('repro6-sel', 'repro6-sel.mjs (L1 adaptation: IDX selection of repro6 run indices)'),
    'repro6': ('repro6', 'repro6.mjs (unedited, 20 runs, R6 only)'),
    'gfling': ('gesture-fling', 'gesture6.mjs GESTURE=fling (L1 extra: fast touch fling)'),
    'gfine': ('gesture-fine', 'gesture6.mjs GESTURE=fine (L1 extra: trackpad-like 2-5 px wheel)'),
    'gkbd': ('gesture-kbd', 'gesture6.mjs GESTURE=kbd (L1 extra: keyboard scrolling of the focused toast list)'),
}
ORDER = ['natural', 'natural R5-alone (diagnostic)', 'natural-x', 'natural-x R5-alone (diagnostic)', 'natural-x R6-alone (diagnostic)', 'natural-x+video', 'race', 'race-x', 'race-x+video', 'repro6-sel', 'repro6', 'gesture-fling', 'gesture-fine', 'gesture-kbd', 'natural-g fling', 'natural-g fine', 'natural-g kbd', 'gesture-fling (warning-only classes)', 'repro6-sel R5-alone (diagnostic)', 'repro6-sel R6-alone (diagnostic)']
for r in runs:
    pre, cfg = parse(r['series'])
    r['group'], r['gname'] = GROUP[pre]
    r['cfg'] = cfg


def agg(rs):
    a = collections.OrderedDict()
    a['runs'] = len(rs)
    a['probe_fail'] = sum(1 for r in rs if r.get('probe_result') != 'OK')
    a['errors'] = sum(1 for r in rs if r.get('probe_result') in ('ERROR', 'MISSING'))
    a['d1_runs'] = sum(1 for r in rs if r.get('d1'))
    a['d1B_runs'] = sum(1 for r in rs if r.get('d1_B'))
    a['hide_reset'] = sum(r.get('resets_read', 0) for r in rs)
    a['hide_reset_runs'] = sum(1 for r in rs if r.get('resets_read', 0))
    a['entry_flicker'] = sum(r.get('resets_entry', 0) for r in rs)
    a['fade_runs'] = sum(1 for r in rs if r.get('fade_frames_read', 0))
    a['below_runs'] = sum(1 for r in rs if r.get('below_frames', 0))
    a['dock_runs'] = sum(1 for r in rs if r.get('over_dock_frames', 0))
    a['prot_runs'] = sum(1 for r in rs if r.get('protected_box_frames', 0) or r.get('drawn_over_frames', 0) or r.get('hit_fail_frames', 0))
    a['scrolled_runs'] = sum(1 for r in rs if r.get('list_min') is not None and (abs(r['list_min']) > 1 or abs(r['list_max']) > 1))
    a['exp_scrolled_runs'] = sum(1 for r in rs if r.get('older_expiry_while_scrolled', 0))
    a['timed_end_runs'] = sum(1 for r in rs if r.get('final_removals', 0))
    a['page_runs'] = sum(1 for r in rs if r.get('page_induced'))
    a['page_scrolled_runs'] = sum(1 for r in rs if r.get('page_scrolled'))
    a['max_below'] = max([r.get('max_below_px', 0) for r in rs] + [0])
    return a


def table(filter_fn, title_cols=True):
    rows = []
    for g in ORDER:
        for c in ('375L', '375D', '844L'):
            for rev in ('R5', 'R6'):
                rs = [r for r in runs if r['group'] == g and r['cfg'] == c and r['rev'] == rev and filter_fn(r)]
                if not rs:
                    continue
                a = agg(rs)
                rows.append((g, CFG[c], rev, a))
    hdr = '| probe | config | rev | runs | probe FAIL/ERROR | R5-D1 runs (uniform def.) | hide/reset events (runs) | entry-flicker re-shows | faded/absent runs | box below room runs (max px) | box over dock/control runs | protected-control overlap runs (repro/gesture only) | list scrolled runs | older toast left while list scrolled (runs) | warning own timed end (runs) | page scrolled behind (runs) / hide-or-overlap caused by it (runs) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n'
    body = ''
    for g, c, rev, a in rows:
        body += f"| {g} | {c} | {rev} | {a['runs']} | {a['probe_fail']} ({a['errors']} err) | **{a['d1_runs']}** | {a['hide_reset']} ({a['hide_reset_runs']}) | {a['entry_flicker']} | {a['fade_runs']} | {a['below_runs']} ({a['max_below']}) | {a['dock_runs']} | {a['prot_runs']} | {a['scrolled_runs']} | {a['exp_scrolled_runs']} | {a['timed_end_runs']} | {a['page_scrolled_runs']} / {a['page_runs']} |\n"
    return hdr + body


def control_matrix():
    # control = R5 d1 runs >= 2 for the same probe/config; R6 zeros count only then
    rows = '| probe | config | R5 runs | R5 R5-D1 runs (A: after entry phase) | R5 events after first input (B) | R5 probe FAIL | control reproduced twice? (A / B) | R6 runs | R6 R5-D1 runs (A) | R6 events after first input (B) | R6 probe FAIL | R6 list scrolled in (runs) | R6 older toast left while scrolled (runs) | R6 page-scroll-induced hide/overlap (runs) | R6 zeros count? |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n'
    for g in ORDER:
        for c in ('375L', '375D', '844L'):
            r5 = [r for r in runs if r['group'] == g and r['cfg'] == c and r['rev'] == 'R5']
            r6 = [r for r in runs if r['group'] == g and r['cfg'] == c and r['rev'] == 'R6']
            if not r5 and not r6:
                continue
            a5, a6 = agg(r5), agg(r6)
            ctl_g = 'repro6-sel' if g == 'repro6' else g
            if g == 'repro6':
                r5 = [r for r in runs if r['group'] == 'repro6-sel' and r['cfg'] == c and r['rev'] == 'R5']
                a5 = agg(r5)
            repro = a5['d1_runs'] >= 2
            reproB = a5['d1B_runs'] >= 2
            zeros = (a6['d1_runs'] == 0)
            zerosB = (a6['d1B_runs'] == 0)
            if 'alone' in g:
                cnt = 'n/a (diagnostic: compare the R5-alone and R6-alone rows of the same probe)'
            elif not r6:
                cnt = 'n/a'
            elif a6['scrolled_runs'] == 0:
                cnt = 'NO (R6 list never scrolled: trigger state not exercised)'
            elif repro:
                cnt = ('YES' if zeros and zerosB else 'YES, but R6 shows events (see runs)' if zeros else 'n/a (R6 shows R5-D1 runs)')
            elif reproB:
                cnt = 'WEAK (control reproduced only under reading B: entry-type flicker after the first input counted)' if zeros else 'n/a'
            else:
                cnt = 'NO (control not reproduced)'
            rows += f"| {g}{' (control = repro6-sel R5)' if g == 'repro6' else ''} | {CFG[c]} | {a5['runs']} | {a5['d1_runs']} | {a5['d1B_runs']} | {a5['probe_fail']} | {'YES' if repro else 'NO'} / {'YES' if a5['d1B_runs'] >= 2 else 'NO'} | {a6['runs']} | {a6['d1_runs']} | {a6['d1B_runs']} | {a6['probe_fail']} | {a6['scrolled_runs']} | {a6['exp_scrolled_runs']} | {a6['page_runs']} | {cnt} |\n"
    return rows


def sr(r):
    return f"{r['rev']}:{r['port']}"


def per_run():
    out = '| # | series | rev:port | run | input | timing / key times (ms) | start→end UTC | load1 start→end | result | R5-D1 detail (uniform) | video |\n|---|---|---|---|---|---|---|---|---|---|---|\n'
    n = 0
    for r in sorted(runs, key=lambda r: (r['start_utc'], r['rev'])):
        n += 1
        lab = r.get('label', '')
        m = re.search(r' (wheel|touch|fling|fine|kbd)\b', lab)
        pre = r['series'].rsplit('-', 1)[0]
        if pre in ('ngfling', 'ngfine', 'ngkbd'):
            inp = {'ngfling': 'touch fling (CDP)', 'ngfine': 'fine wheel 2-5 px', 'ngkbd': 'keyboard'}[pre]
        elif pre in ('gfling', 'gflingpage'):
            inp = 'touch fling (CDP)'
        elif pre == 'gfine':
            inp = 'fine wheel 2-5 px'
        elif pre == 'gkbd':
            inp = 'keyboard'
        elif pre in ('natural', 'nx', 'naturalx', 'dnx', 'dnx6', 'dn'):
            inp = 'wheel 40 px up / 20 px down'
        elif pre in ('race', 'rx', 'racex'):
            inp = 'wheel 20 px (+ one-shot synthetic hold)'
        else:
            inp = (m.group(1) if m else '')
        if 'timing' in r:
            T = r['timing']
            tm = f"{T['cls']} d={T['d']}"
            if r.get('inputs_ms'):
                tm += f"; gesture {r['inputs_ms'][0]}–{r['inputs_ms'][1]} ({r['inputs_ms'][2]} strokes); warn@{r.get('tWarn')}"
        elif 'tTop' in r:
            m2 = re.search(r'wait=(\d+)', lab)
            tm = f"wait={m2.group(1) if m2 else '?'}; top@{r['tTop']}, down@{r['tDown']}"
        elif 'tRel' in r:
            tm = f"release@{r['tRel']}"
        else:
            tm = ''
        if r.get('older_gone'):
            tm += f"; older left {r['older_gone']}"
        d1 = ', '.join(r.get('d1_parts', [])) if r.get('d1') else ''
        if r.get('resets_entry'):
            d1 += (' ' if d1 else '') + f"[entry-flicker x{r['resets_entry']}]"
        if r.get('final_removals'):
            d1 += (' ' if d1 else '') + f"[own end @{r.get('final_removal_t')}]"
        res = r.get('probe_result', '?')
        out += f"| {n} | {r['series']} | {sr(r)} | {r['run']} | {inp} | {tm} | {r['start_utc'][11:19]}→{r['end_utc'][11:19]} | {r['load_start']}→{r['load_end']} | {res} | {'**D1:** ' + d1 if r.get('d1') else d1} | {'yes' if r.get('video') else ''} |\n"
    return out


def series_table():
    pairs = {}
    for r in runs:
        pairs.setdefault((r['series'], r['rev']), r)
    out = '| series | rev | URL | revision | probe | probe sha256 | runs | first start UTC | last end UTC | loadavg at first start / last end |\n|---|---|---|---|---|---|---|---|---|---|\n'
    for (s, rev), r0 in sorted(pairs.items(), key=lambda kv: (kv[1]['start_utc'], kv[0][1])):
        rs = [r for r in runs if r['series'] == s and r['rev'] == rev]
        last = max(rs, key=lambda x: x['end_utc'])
        out += f"| {s} | {rev} | http://127.0.0.1:{r0['port']} | `{r0['revision']}` | {r0['probe']} | `{r0['probe_sha256']}` | {len(rs)} | {min(x['start_utc'] for x in rs)[11:19]} | {last['end_utc'][11:19]} | {r0['loadavg_start']} / {last['loadavg_end']} |\n"
    return out


os.makedirs(OUT, exist_ok=True)
open(f'{OUT}/tables-control.md', 'w').write(control_matrix())
open(f'{OUT}/tables-results.md', 'w').write(table(lambda r: True))
open(f'{OUT}/tables-series.md', 'w').write(series_table())
open(f'{OUT}/tables-perrun.md', 'w').write(per_run())
print('ok', len(runs))
