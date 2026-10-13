import sys, hashlib, difflib, numpy as np
from PIL import Image
a, b = sys.argv[1:3]
def rows(p):
    A = np.asarray(Image.open(p).convert('L'))
    A = (A // 24)  # coarse quantise to ignore tiny AA noise
    return [hashlib.md5(r.tobytes()).hexdigest() for r in A], A.shape
ra, sa = rows(a); rb, sb = rows(b)
print('shapes trial', sa, 'ctrl', sb)
sm = difflib.SequenceMatcher(None, ra, rb, autojunk=False)
tot = 0
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal' and (i2 - i1) >= 40: print(f'equal  trial rows {i1}-{i2}  ctrl rows {j1}-{j2}  (offset trial-ctrl {i1-j1})')
    elif tag != 'equal': print(f'{tag:8s} trial rows {i1}-{i2}  ctrl rows {j1}-{j2}')
print('ratio', round(sm.ratio(), 4))
