import sys; sys.path.insert(0, "/tmp/claude-0/ln-pylib")
# python3 sheet.py out.jpg height label=path label=path ...   (side-by-side, scaled to the same height)
from PIL import Image, ImageDraw
out, h = sys.argv[1], int(sys.argv[2]); ims = []
for a in sys.argv[3:]:
    lab, p = a.split('=', 1); im = Image.open(p).convert('RGB'); w = round(im.width * h / im.height); im = im.resize((w, h)); ims.append((lab, im))
W = sum(i.width for _, i in ims) + 6 * (len(ims) - 1); S = Image.new('RGB', (W, h + 16), (40, 40, 40)); x = 0
d = ImageDraw.Draw(S)
for lab, i in ims: S.paste(i, (x, 16)); d.text((x + 2, 2), lab, fill=(255, 255, 255)); x += i.width + 6
S.save(out, quality=82)
