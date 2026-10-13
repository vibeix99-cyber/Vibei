import json, statistics as st, sys
f = sys.argv[1]
d = json.load(open(f))
rs = d['results']
print(f"vp {d['vp']}, rounds {d['rounds']}, frames/round {d['frames']}, warm-up {d['warm']}\n")
print('### Per run\n')
print('| round | variant | chai kind | root.userData.model | .glb requests (aborted) | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | ready ms | final ms | long tasks (n / max ms) | load 1m/5m/15m | errors |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for r in rs:
    fr = r.get('frame', {}); rn = r.get('render', {}); me = r.get('memory', {}); lt = r.get('longTasks', {})
    print(f"| {r['round']} | {r['variant']} | {r.get('chaiKind')} | {r.get('rootUserDataModel')} | {len(r['glbRequests'])} ({r['aborted']}) | {fr.get('median')} | {fr.get('mean')} | {fr.get('p90')} | {fr.get('min')} | {fr.get('max')} | {rn.get('calls')} | {rn.get('triangles')} | {me.get('geometries')} | {me.get('textures')} | {me.get('programs')} | {r.get('heapMB')} | {r.get('readyMs')} | {r.get('finalMs')} | {lt.get('count')} / {lt.get('maxMs')} | {r.get('load1m')} | {r['errors']} |")
print('\n### Per variant (medians over rounds)\n')
print('| variant | runs | frame median ms: per-run medians | median of medians | median of means | median p90 | draw calls | triangles | geometries | textures | programs | JS heap MB (per run) | median heap |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for v in ('model', 'procedural'):
    x = [r for r in rs if r['variant'] == v and r.get('frame')]
    if not x: continue
    med = [r['frame']['median'] for r in x]
    g = lambda k, sub: sorted({r[sub][k] for r in x})
    print(f"| {v} | {len(x)} | {med} | {st.median(med):.2f} | {st.median([r['frame']['mean'] for r in x]):.2f} | {st.median([r['frame']['p90'] for r in x]):.2f} | {g('calls','render')} | {g('triangles','render')} | {g('geometries','memory')} | {g('textures','memory')} | {g('programs','memory')} | {[r['heapMB'] for r in x]} | {st.median([r['heapMB'] for r in x]):.2f} |")
