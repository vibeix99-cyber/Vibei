#!/usr/bin/env python3
"""RF-digits.py: contact sheet of the countdown readout of every Focus frame (states 03 and 04, all sides, run 1 and run 2), to show that its seconds digit differs between any two captures."""
from PIL import Image, ImageDraw
rows = []
specs = [('390x844@1-light', (90, 495, 300, 575)), ('390x844@1-dark', (90, 495, 300, 575)), ('1440x900@1-light', (990, 325, 1340, 440))]
for root, label in [('/home/user/wt/w6-int/kettle/.tmp/RF-cap2', 'run2'), ('/home/user/wt/w6-int/kettle/.tmp/RF-cap', 'run1')]:
    for tag, box in specs:
        for n in ['03-focus-mid.png', '04-focus-paused.png']:
            ims = []
            for side in ['before', 'before2', 'after', 'after2']:
                try: ims.append((side, Image.open(f'{root}/{side}/{tag}/{n}').convert('RGB').crop(box)))
                except Exception: pass
            w, h = box[2] - box[0], box[3] - box[1]
            sheet = Image.new('RGB', (w * 4 + 30, h + 14), (255, 255, 255)); d = ImageDraw.Draw(sheet)
            for i, (s, im) in enumerate(ims): sheet.paste(im, (i * (w + 10), 14)); d.text((i * (w + 10) + 2, 0), f'{label} {tag} {n[:2]} {s}', fill=(0, 0, 0))
            rows.append(sheet)
W = max(s.width for s in rows); H = sum(s.height + 4 for s in rows)
big = Image.new('RGB', (W, H), (255, 255, 255)); y = 0
for s in rows: big.paste(s, (0, y)); y += s.height + 4
big.save('/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/cap/readout-digits.png'); print(big.size)
