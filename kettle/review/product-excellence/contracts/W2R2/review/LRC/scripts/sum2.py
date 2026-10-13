import json, sys
print('| viewport | variant | resolved tier (settings.scene) | .glb requests | chai kind at end (engine field / root.userData.model / childCount) | chai3d status | scene-graph samples (every rAF): total / no visible chai | first 3 s after the engine appears: samples / no chai | renderer.render calls: total / no chai / model / procedural | swap procedural -> model seen | page errors | console error/warn (SW-blocked noise excluded) |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for f in sys.argv[1:]:
    d = json.load(open(f))
    for r in d['runs']:
        fa = r.get('facts') or {}
        pr = r.get('probe') or {'engines': []}
        glb = '; '.join(f"{g['url'].split('/')[-1]} {g.get('status','no response (aborted)')} at {g['at']} ms on #{g['nav']}" for g in r['glb']) or 'none'
        e = (pr['engines'] or [{}])[0]
        n = len(pr['engines'])
        sw = f"yes: sample #{e['swapFrame']}, {e['swapAt']} ms after the engine appeared" if e.get('swapFrame') is not None else f"no (first kind sampled: {e.get('kindFirst')}, last: {e.get('lastKind')})"
        rn = f"{e.get('renders')} / {e.get('rendersNoChai')} / {e.get('rendersModel')} / {e.get('rendersProcedural')}" if e.get('renders') is not None else 'not recorded in this run'
        cons = [c for c in r['console'] if 'Service Worker' not in c and '[pwa]' not in c and 'chai3d' not in c.lower()]
        chai_log = [c.split(': ', 1)[-1][:60] for c in r['console'] if 'chai3d' in c.lower()]
        sg = fa.get('sceneGraphChai') or {}
        kind = f"{fa.get('chaiKind')} / {fa.get('rootUserDataModel', 'not recorded')} / {sg.get('childCount')}"
        st = fa.get('chai3dStatus') or {}
        stt = ', '.join(f"{k}={v}" for k, v in st.items())
        print(f"| {r['vp']} | {r['variant']} | {fa.get('resolvedTier')} ({fa.get('scenePref')}) | {glb} | {kind} | {stt} | {e.get('sampled')} / {e.get('noChai')} ({n} engine) | {e.get('framesIn3s')} / {e.get('noChaiIn3s')} | {rn} | {sw} | {len(r['errors'])} {r['errors'] or ''} | {cons or 'none'} {r['failedReq'] or ''} |")
