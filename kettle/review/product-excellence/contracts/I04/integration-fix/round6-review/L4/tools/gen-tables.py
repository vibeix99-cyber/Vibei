import os, json
R='/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4'
S='/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4'
runs={}
for l in open(f'{S}/logs/warning-runs.tsv'):
    p=l.strip().split('\t')
    runs[(p[0],p[1])]=(p[4][6:],p[5][4:])
std={}
for l in open(f'{S}/logs/standard-runs.tsv'):
    p=l.strip().split('\t'); std[(p[0],p[1])]=(p[4][6:],p[5][4:],p[2])
out=[]
out.append('### Standard sets\n')
out.append('| Rev | Port | Set (path under `captures/<rev>/`) | PNGs | page errors | start (UTC) | end (UTC) |')
out.append('|---|---|---|---|---|---|---|')
for rev in ('R6','INT'):
    d=f'{R}/captures/{rev}'
    for cfg in sorted(os.listdir(d)):
        if cfg=='warning': continue
        m=json.load(open(f'{d}/{cfg}/capture-meta.json'))
        n=len([x for x in os.listdir(f'{d}/{cfg}') if x.endswith('.png')])
        s=std[(rev,cfg)]
        out.append(f"| {rev} | {m['base'].split(':')[-1]} | `{cfg}` ({m['viewport']['w']}x{m['viewport']['h']}@{m['dpr']}, {m['theme']}{', reduced motion' if m['reducedMotion'] else ''}; rev {m['revision']}) | {n} | {len(m['errors'])} | {s[0][11:19]} | {s[1][11:19]} |")
out.append('')
out.append('### Warning sets\n')
out.append('Cell = toasts on screen after the shot / `W` if the storage-full warning was one of them (`-` if not) / attempts used. `!` = flagged (see notes).\n')
out.append('| Rev | Set (path under `captures/<rev>/warning/`) | PNGs | a home | b focus | c break-over | d level-up | c2 (storage ok) | d2 (storage ok) | page errors | first run start-end (UTC) |')
out.append('|---|---|---|---|---|---|---|---|---|---|---|')
flag={('INT','1440x900-light-100pct','a-home-warning'),('INT','375x667-dark-200pct','b-focus-warning-toasts'),('INT','375x667-light-200pct','b-focus-warning-toasts'),('INT','390x844-dark-200pct','b-focus-warning-toasts'),('INT','390x844-light-200pct','b-focus-warning-toasts')}
tot=0
for rev in ('R6','INT'):
    d=f'{R}/captures/{rev}/warning'
    order=[f'{v}-{t}-{x}pct' for v in ('390x844','375x667','1440x900','844x390') for t in ('light','dark') for x in (100,200)]
    for cfg in order:
        m=json.load(open(f'{d}/{cfg}/meta.json'))
        n=len([x for x in os.listdir(f'{d}/{cfg}') if x.endswith('.png')]); tot+=n
        cells=[]
        for k in ('a-home-warning','b-focus-warning-toasts','c-breakover-toasts','d-summary-levelup','c2-breakover-toasts-storage-ok','d2-summary-levelup-storage-ok'):
            v=m['states'][k]
            t=len(v['toastsAfter']); w='W' if any(x['id']=='toast-kettle:save-failed' for x in v['toastsAfter']) else '-'
            cells.append(f"{t}/{w}/{v.get('attempt')}{' !' if (rev,cfg,k) in flag else ''}")
        r=runs.get((rev,cfg),('',''))
        out.append(f"| {rev} | `{cfg}` | {n} | "+' | '.join(cells)+f" | {len(m['errors'])} | {r[0][11:19]}-{r[1][11:19]} |")
out.append(f'\nWarning PNGs total: {tot}')
open(f'{S}/tables.md','w').write('\n'.join(out))
print('\n'.join(out)[:3000])
