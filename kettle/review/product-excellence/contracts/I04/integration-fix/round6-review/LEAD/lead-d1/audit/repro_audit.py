import json,sys
p=sys.argv[1]
W='toast-kettle:save-failed'
n=0
for line in open(p):
    r=json.loads(line); n+=1
    fr=r['frames']; ev=r['ev']
    ts=[f[0] for f in fr]
    gaps=[b-a for a,b in zip(ts,ts[1:])]
    tW=r['tWarn']
    # frames after warning appears
    post=[f for f in fr if f[0]>=tW]
    full=next((f[0] for f in post if f[2]>=0.98),None)
    judged=[f for f in fr if full is not None and f[0]>=full]
    wev=[e for e in ev if e[2]==W]
    other=[e for e in ev if e[2]!=W]
    maxbelow=max(((f[4]-f[5]) for f in judged if f[4] is not None and f[5] is not None), default=None)
    minop=min((f[2] for f in judged), default=None)
    maxlist=max((f[6] or 0) for f in judged) if judged else None
    box=sum(1 for f in judged if f[8]); drawn=sum(1 for f in judged if f[9]); hit=sum(1 for f in judged if f[10])
    # dock gap: warning bottom vs min ctrl top
    dock=[ (f[11]-f[4]) for f in judged if f[4] is not None and f[11] is not None and f[2]>0]
    print(f"{r['label'][:48]:48s} frames={len(fr):4d} maxgap={max(gaps):4d}ms inputs={len(r['inputs']):2d} last-input→end={fr[-1][0]-r['tLast']:5d} warnEv={[(e[0],e[1]) for e in wev]} olderGone={len([e for e in other if e[1]=='-'])} minOp={minop} max(wb-rb)={maxbelow} maxListTop={maxlist} minDockGap={min(dock) if dock else None} box/drawn/hit={box}/{drawn}/{hit} bad={r['bad']}")
print('runs',n)
