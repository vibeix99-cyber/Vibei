D='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/'
s='\n'.join(open(D+f).read() for f in ['RECEIPT-LT-FIX.md.head','RECEIPT-LT-FIX.md.keys','RECEIPT-LT-FIX.md.method','RECEIPT-LT-FIX.md.r1','RECEIPT-LT-FIX.md.r2','RECEIPT-LT-FIX.md.r3','RECEIPT-LT-FIX.md.end'])
import os
sub={'CTLTABLE':'/tmp/claude-0/lt4-ctl-both.md','MATRIXTABLE':'/tmp/claude-0/lt4-matrix.md','INVTABLE2':'/tmp/claude-0/lt4-inv.md','SUITES':'/tmp/claude-0/lt4-suites.md'}
for k,f in sub.items(): s=s.replace(k, open(f).read().strip() if os.path.exists(f) else f'(missing {k})')
open(D+'RECEIPT-LT-FIX.md','w').write(s); print(len(s))
