import os, re
D='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/'
parts=[open(D+f).read() for f in ['RECEIPT-LT.head.md','RECEIPT-LT.keys.md','RECEIPT-LT.body1.md','RECEIPT-LT.body2.md','RECEIPT-LT.ns.md','RECEIPT-LT.body3.md','RECEIPT-LT.body4.md','RECEIPT-LT.body5.md','RECEIPT-LT.body6.md','RECEIPT-LT.end.md'] if os.path.exists(D+f)]
s='\n'.join(parts)
sub={'INVTABLE':'/tmp/claude-0/lt3-inv.md','UNDOTABLE':'/tmp/claude-0/lt3-undo.md','W2HTABLE':'/tmp/claude-0/lt3-w2h.md','BASEAMB':'/tmp/claude-0/lt3-amb.md','BASEFOLD':'/tmp/claude-0/lt3-fold.md','SUITES56':'/tmp/claude-0/lt3-s56.md','SUITES6':'/tmp/claude-0/lt3-s6.md'}
for k,f in sub.items():
    s=s.replace(k, open(f).read().strip() if os.path.exists(f) else f'(not available: {k})')
open(D+'RECEIPT-LT.md','w').write(s)
print(len(s))
