"""Encode the rendered window stills (.tmp/stills/*.png) to WebP in src/scene/stills/. Needs Pillow."""
from pathlib import Path
from PIL import Image
src, dst = Path('.tmp/stills'), Path('src/scene/stills')
dst.mkdir(parents=True, exist_ok=True)
for f in sorted(src.glob('window-*.png')):
    out = dst / (f.stem + '.webp')
    Image.open(f).convert('RGBA').save(out, quality=74, method=6)  # alpha: the open top shows the host backdrop
    print(out, out.stat().st_size // 1024, 'KB')
