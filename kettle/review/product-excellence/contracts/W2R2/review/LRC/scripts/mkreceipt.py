import re, os, sys
R = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LRC'
def inc(path, missing='(not produced)'):
    p = path if path.startswith('/') else f'{R}/{path}'
    if not os.path.exists(p): return missing + '\n'
    return re.sub(r'(?m)^#{2,3} ', '#### ', open(p).read().rstrip()) + '\n'
t = open('/home/user/wt/w4tr-c/kettle/.tmp/LR/receipt.tpl.md').read()
t = re.sub(r'\{\{include:([^}]+)\}\}', lambda m: inc(m.group(1)), t)
open(f'{R}/RECEIPT-LRC.md', 'w').write(t)
print(len(t), 'bytes')
