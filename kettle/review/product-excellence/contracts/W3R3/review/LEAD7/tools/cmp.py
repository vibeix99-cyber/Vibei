import json,sys
S=sys.argv[1]; th=sys.argv[2]
b=json.load(open(f'{S}/shots/fp-before-{th}.json')); a=json.load(open(f'{S}/shots/fp-after-{th}.json'))
for k in b:
  print(f'== {k}')
  for st in b[k]:
    B,A=b[k][st],a[k][st]
    if not B or not A: print(st,'MISSING',bool(B),bool(A)); continue
    d=lambda f: A['ink'][f]-B['ink'][f]
    print(f"{st:20s} pose {B['pose']}->{A['pose']} file {A['src'][:14]} {A['natural']} | box dx,dy,dw,dh "+' '.join(f'{A["box"][i]-B["box"][i]:+.2f}' for i in range(4))+
      f" | ink dTop {d('top'):+.2f} dBottom(baseline) {d('bottom'):+.2f} dCx {d('cx'):+.2f} dW {d('w'):+.2f} dH {d('h'):+.2f} | ink after w,h {A['ink']['w']},{A['ink']['h']} bottom {A['ink']['bottom']} | shadowY {B['shadowY']}->{A['shadowY']} | dev px per file px {B['devPxPerFilePx']}->{A['devPxPerFilePx']}")
  # pose-switch within AFTER: baseline & top drift across states
  bots=[a[k][s]['ink']['bottom'] for s in a[k] if a[k][s]]; cxs=[a[k][s]['ink']['cx'] for s in a[k] if a[k][s]]
  bb=[b[k][s]['ink']['bottom'] for s in b[k] if b[k][s]]
  print(f'   switch spread AFTER: baseline {max(bots)-min(bots):.2f}  centre-x {max(cxs)-min(cxs):.2f}   (BEFORE baseline spread {max(bb)-min(bb):.2f})')
