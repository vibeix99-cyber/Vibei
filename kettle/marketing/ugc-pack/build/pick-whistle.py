"""Keep the whistle candidate where Chai and "Tea's ready" are most visible (highest detail inside the ring)."""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image

d = Path(sys.argv[1])
best, score = None, -1
for f in sorted((d / '.whistle').glob('c*.png')):
    a = np.asarray(Image.open(f).convert('L'), dtype=np.float32)
    h, w = a.shape
    ring = a[int(h * 0.53):int(h * 0.78), int(w * 0.25):int(w * 0.75)]  # inside the green ring
    s = float(ring.std())
    print(f.name, round(s, 1))
    if s > score:
        best, score = f, s
shutil.copy(best, d / '03a-whistle.png')
shutil.rmtree(d / '.whistle')
print('kept', best.name)
