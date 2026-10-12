# Aggregate perf JSON: per (server, chai, tier): median of the per-run medians, and the memory facts.
import json, sys, statistics as st
d = json.load(open(sys.argv[1]))
groups = {}
for r in d['results']:
    groups.setdefault(r['run'], []).append(r)
print(f"viewport {d['vp']}, {d['renderer']}, runs per variant: {len(next(iter(groups.values())))}")
print("| variant | frame ms median (per-run medians) | frame ms p90 (median) | draw calls | triangles | geometries | textures | programs | JS heap MB after GC | ready ms | Chai final ms | longest task ms |")
print("|---|---|---|---|---|---|---|---|---|---|---|---|")
for k, rs in groups.items():
    med = [r['frame']['median'] for r in rs]; p90 = [r['frame']['p90'] for r in rs]
    lt = [r['longTasks']['maxMs'] for r in rs]
    print(f"| {k} | {st.median(med):.0f} ({', '.join(f'{x:.0f}' for x in med)}) | {st.median(p90):.0f} | {rs[0]['render']['calls']} | {rs[0]['render']['triangles']} | {rs[0]['memory']['geometries']} | {rs[0]['memory']['textures']} | {rs[0]['memory']['programs']} | {st.median([r['heapMB'] for r in rs]):.2f} | {st.median([r['readyMs'] for r in rs]):.0f} | {st.median([r['finalMs'] for r in rs]):.0f} | {st.median(lt):.0f} |")
