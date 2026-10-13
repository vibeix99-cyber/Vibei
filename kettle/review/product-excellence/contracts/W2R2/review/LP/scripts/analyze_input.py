#!/usr/bin/env python3
"""Markdown tables from lp-input.mjs output: python3 analyze_input.py <dirA> [<dirB> ...]"""
import json, sys, glob, os

for d in sys.argv[1:]:
    print(f'\n#### {d}\n')
    for f in sorted(glob.glob(f'{d}/*-A.json')):
        r = json.load(open(f))
        print(f'**Session A — {r["tag"]} {r["cfg"]}** (errors: {r["errors"] or "none"})\n')
        print(f'arrival: scrollTop {r["arrival"].get("scrollTop")}, scrollMax {r["arrival"].get("scrollMax")}, sheetTop {r["arrival"].get("sheetTop")}, Chai clear {r["arrival"].get("chaiClear")}, kettle clear {r["arrival"].get("kettleClear")}, heading {r["arrival"].get("headingTop")}–{r["arrival"].get("headingBottom")}, foldTop {r["arrival"].get("foldTop")}, footerTop {r["arrival"].get("footerTop")}')
        if r.get('touchAction'): print(f'\ntouch-action/overflow/overscroll along the ancestor chain: {json.dumps(r["touchAction"])}')
        print('\n| step | scrollTop before → after (max) | sheet top before → after | Chai clear after | kettle clear after | toggle expanded / top–bottom after | panel after | last line → footer after | timer after | note |')
        print('|---|---|---|---|---|---|---|---|---|---|')
        for s in r['steps']:
            b, a = s['before'], s['after']
            if a.get('noSummary'):
                print(f'| {s["what"]} | summary left | | | | | | | hash {a["hash"]} timer {a["timer"]} | {s.get("note") or ""} |')
                continue
            tg = a.get('toggle') or {}
            print(f'| {s["what"]} | {b.get("scrollTop")} → {a.get("scrollTop")} ({a.get("scrollMax")}) | {b.get("sheetTop")} → {a.get("sheetTop")} | {a.get("chaiClear")} | {a.get("kettleClear")} | {tg.get("expanded")} / {tg.get("t")}–{tg.get("b")} | {json.dumps(a.get("panel"))} | {(a.get("lastLine") or {}).get("toFooter")} | {json.dumps(a.get("timer"))} | {s.get("note") or ""} |')
        print(f'\nfinal: {json.dumps(r.get("final"))}\n')
    for f in sorted(glob.glob(f'{d}/*-B?.json')):
        r = json.load(open(f))
        print(f'- **{r["tag"]} {r["cfg"]} {r["session"]}**: hit-test at the button centre = {json.dumps(r.get("hitOk"))}; job: {r.get("job")} in {r.get("ms")} ms; after: {json.dumps(r.get("after"))}; before: hash {r["before"]["hash"]} timer {r["before"].get("timer")}')
    for f in sorted(glob.glob(f'{d}/*-C.json')):
        r = json.load(open(f))
        print(f'\n**Session C (Tab) — {r["tag"]} {r["cfg"]}** (errors: {r["errors"] or "none"})\n')
        print('| stop | element | in summary / footer | :focus-visible | box top–bottom | scrollTop | wholly in visible area | not covered (hit-test = itself) | outline (style width colour offset) | box-shadow | computed-style delta vs unfocused (self; first child) |')
        print('|---|---|---|---|---|---|---|---|---|---|---|')
        for s in r['stops']:
            if s.get('body'):
                print(f'| {s["n"]} | focus left the page content (document.body) | | | | | | | | | hash {s.get("hash")} |')
                continue
            print(f'| {s["n"]} | {s["tag"]} “{s["name"]}” | {s["inSummary"]} / {s["inFooter"]} | {s["focusVisible"]} | {s["box"]["t"]}–{s["box"]["b"]} | {s["scrollTop"]} | {s["inVisibleArea"]} | {s["hitIsSelf"]} | {s["outline"]["style"]} {s["outline"]["width"]} {s["outline"]["color"]} {s["outline"]["offset"]} | {s["boxShadow"]} | {"; ".join(s["selfDelta"] or []) or "none"} ; {"; ".join(s["kidDelta"] or []) or "none"} |')
