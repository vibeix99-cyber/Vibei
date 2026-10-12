import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
import json, os, numpy as np
from PIL import Image
S = '/tmp/claude-0/ln-scratch/fix'
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def d(a, b): 
    if a.shape != b.shape: return None, None
    x = np.abs(a - b).mean(axis=2); return round(float(x.mean()), 3), int((np.abs(a - b).max(axis=2) > 8).sum())
for tag in ('390x844-light-t100', '375x667-dark-t100'):
    print('==', tag)
    mc = json.load(open(f'{S}/acc/fxc/{tag}/meta.json')) if os.path.exists(f'{S}/acc/fxc/{tag}/meta.json') else None
    mf = json.load(open(f'{S}/acc/fxf/{tag}/meta.json')) if os.path.exists(f'{S}/acc/fxf/{tag}/meta.json') else None
    if mc and mf:
        for k in ('off', 'loading05', 'loadingEnd'):
            c, f = mc['states'].get(k), mf['states'].get(k)
            if c and f: print(k, 'ctrl', c['backdrop']['static'], c['backdrop']['still'], len(c['backdrop']['layers']), c['backdrop']['rect'], '| fix', f['backdrop']['static'], f['backdrop']['still'], len(f['backdrop']['layers']), f['backdrop']['rect'], '| cls', c['cls'], f['cls'])
        print('timeline ctrl', [(e['t'], e['rd'], e['cv'], e['im'], e.get('ic')) for e in mc['timeline']]); print('timeline fix ', [(e['t'], e['rd'], e['cv'], e['im'], e.get('ic')) for e in mf['timeline']])
        print('errors', mc['errors'], mf['errors'])
        for n in ('off', 'off-back', 'off-raw'):
            try: print(n, 'fix vs ctrl (mean abs, px>8):', d(load(f'{S}/acc/fxc/{tag}/{n}.png'), load(f'{S}/acc/fxf/{tag}/{n}.png')))
            except Exception as e: print(n, 'n/a', e)
    r2c, r2f = f'{S}/acc2/fxc/{tag}/room2-meta.json', f'{S}/acc2/fxf/{tag}/room2-meta.json'
    if os.path.exists(r2c) and os.path.exists(r2f):
        c, f = json.load(open(r2c)), json.load(open(r2f))
        for g in ('static', 'nowebgl'):
            print(g, 'hint ctrl:', c['r'][g]['before']['text'], c['r'][g]['before']['lines'], '| fix:', f['r'][g]['before']['text'], f['r'][g]['before']['lines'], f['r'][g]['before']['insideStage'], '| flags after tap fix', f['r'][g]['afterTap']['ls'])
            try: print(g + '-nook', 'fix vs ctrl (mean abs, px>8):', d(load(f'{S}/acc2/fxc/{tag}/{g}-nook.png'), load(f'{S}/acc2/fxf/{tag}/{g}-nook.png')))
            except Exception as e: print(g, 'n/a', e)
        print('unlock', 'ctrl', c['r']['unlock']['hash'], c['r']['unlock']['backdrop'] and c['r']['unlock']['backdrop']['ready'], '| fix', f['r']['unlock']['hash'], f['r']['unlock']['backdrop'] and f['r']['unlock']['backdrop']['ready'], '| frames', c['r']['unlockFrames'], f['r']['unlockFrames'])
        try: print('unlock-summary fix vs ctrl (mean abs, px>8):', d(load(f'{S}/acc2/fxc/{tag}/unlock-summary.png'), load(f'{S}/acc2/fxf/{tag}/unlock-summary.png')))
        except Exception as e: print('unlock n/a', e)
        print('errors', c['errors'], f['errors'])
