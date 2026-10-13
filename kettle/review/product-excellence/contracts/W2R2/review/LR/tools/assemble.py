#!/usr/bin/env python3
import sys, os, json, shutil, glob
EV = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LR'
CAP = '/tmp/claude-0/lr2-scratch/cap'
tags = sys.argv[1:]
tot = 0
for tag in tags:
    jf = f'{EV}/logs/pdiff-{tag}.json'
    if not os.path.exists(jf): print('no pdiff', tag); continue
    rows = json.load(open(jf))
    for side in ('trial', 'ctrl'):
        d = f'{EV}/capture/{side}/{tag}'; os.makedirs(d, exist_ok=True)
        for f in ('capture-meta.json', 'freeze.json', 'run.log'):
            s = f'{CAP}/{side}/{tag}/{f}'
            if os.path.exists(s): shutil.copy(s, d)
    pd = f'{EV}/pairs/{tag}'
    for x in rows:
        if x['status'] == 'MISSING' or x['pct_tol'] > 0.5 or x['pct_strict'] > 0.5 or x['status'] == 'SIZE':
            os.makedirs(pd, exist_ok=True)
            n = x['name'][:-4]
            for side in ('trial', 'ctrl'):
                s = f'{CAP}/{side}/{tag}/{x["name"]}'
                if os.path.exists(s): shutil.copy(s, f'{pd}/{n}-{side}.png'); tot += os.path.getsize(s)
            s = f'{CAP}/diff/{tag}/{n}-diff.png'
            if os.path.exists(s): shutil.copy(s, f'{pd}/{n}-diff.png'); tot += os.path.getsize(s)
print('pair bytes copied', tot)
