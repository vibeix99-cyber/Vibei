import re, os, sys
R = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LRC'
def inc(path, missing='(not produced)'):
    p = path if path.startswith('/') else f'{R}/{path}'
    return open(p).read().rstrip() + '\n' if os.path.exists(p) else missing + '\n'
t = open('/home/user/wt/w4tr-c/kettle/.tmp/LR/receipt.tpl.md').read()
t = re.sub(r'\{\{include:([^}]+)\}\}', lambda m: inc(m.group(1)), t)
open(f'{R}/RECEIPT-LRC.md', 'w').write(t)
print(len(t), 'bytes')
