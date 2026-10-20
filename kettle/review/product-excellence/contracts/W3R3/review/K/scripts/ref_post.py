# Lane K task 1: REFERENCE. The three masters as they are (copied byte for byte) + each master downscaled to its on-screen size,
# side by side with the BEFORE and AFTER shipped files shown at the same on-screen size (plates: cream, dark).
import json, re, shutil, os
import numpy as np
from PIL import Image, ImageDraw
K='/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K'
M='/home/user/Vibei/kettle/art-src/chai/2d-v2'
os.makedirs(f'{K}/reference',exist_ok=True)
for p in ('reading','sipping','cheering'): shutil.copyfile(f'{M}/chai-{p}.png',f'{K}/reference/master-chai-{p}.png')
mi=json.load(open(f'{K}/json/master-ink.json'))
def boxes(tag):
    m={}
    for line in open(f'{K}/shots/after/states.log.txt'):
        mm=re.match(r'(\S+) (\S+) (\[.*\])$',line.strip())
        if mm and mm.group(1)==tag: m[mm.group(2)]=[[float(v) for v in s.split(':')[1].split(',')] for s in json.loads(mm.group(3))][0]
    return m
STATE={'reading':'focus-running','cheering':'summary','sipping':'focus-break'}
def inkbox(path):
    a=np.asarray(Image.open(path).convert('RGBA'))[...,3]; ys,xs=np.where(a>8); return xs.min(),ys.min(),xs.max()+1,ys.max()+1
CREAM=(255,249,240); DARK=(34,24,41)
def font(): return None
for place,tag in (('stage-390x844','390x844-dark'),('stage-1440x900','1440x900-dark')):
    bx=boxes(tag)
    for scale in (1,2):
        for pose,st in STATE.items():
            if st not in bx: continue
            x,y,w,h=bx[st]; S=scale
            W,H=int(round(w*S)),int(round(h*S)); pad=int(24*S)
            mink=mi[pose]['ink_box']; mw=mink[2]-mink[0]; mh=mink[3]-mink[1]
            # the AFTER file is fitted to the box (ink to ink): the master is scaled UNIFORMLY so its ink HEIGHT equals the AFTER ink height on screen
            ax0,ay0,ax1,ay1=inkbox(f'{K}/assets-served/after-chai-{pose}.webp'); aim=Image.open(f'{K}/assets-served/after-chai-{pose}.webp')
            sy=H/aim.size[1]; ink_h=(ay1-ay0)*sy; k=ink_h/mh
            master=Image.open(f'{M}/chai-{pose}.png').convert('RGB')
            ms=master.resize((int(round(master.size[0]*k)),int(round(master.size[1]*k))),Image.LANCZOS)
            panels=[]
            def plate(bg,draw_fn,label):
                im=Image.new('RGB',(W+2*pad,H+2*pad+18),bg); draw_fn(im); d=ImageDraw.Draw(im); d.text((4,3),label,fill=(0,0,0) if bg==CREAM else (255,255,255)); return im
            def put_master(im):
                # ink bottom of the master on the baseline of the AFTER ink bottom; horizontally centred on the box
                bx_=pad+W/2-(mink[0]+mw/2)*k; by_=pad+18+ay1*sy-mink[3]*k
                im.paste(ms,(int(round(bx_)),int(round(by_))))
            def put_file(side):
                def f(im):
                    a=Image.open(f'{K}/assets-served/{side}-chai-{pose}.webp').convert('RGBA').resize((W,H),Image.LANCZOS); im.paste(a,(pad,pad+18),a)
                return f
            row1=[plate(CREAM,put_master,f'MASTER x{k:.3f} (uniform, ink h = AFTER ink h)'),plate(CREAM,put_file('before'),'BEFORE on cream'),plate(CREAM,put_file('after'),'AFTER on cream')]
            row2=[plate(DARK,lambda im:None,'(master has no alpha)'),plate(DARK,put_file('before'),'BEFORE on dark #221829'),plate(DARK,put_file('after'),'AFTER on dark #221829')]
            pw,ph=row1[0].size; sheet=Image.new('RGB',(3*pw+2*4,2*ph+4),(128,128,128))
            for i,pnl in enumerate(row1): sheet.paste(pnl,(i*(pw+4),0))
            for i,pnl in enumerate(row2): sheet.paste(pnl,(i*(pw+4),ph+4))
            out=f'{K}/reference/compare-{place}-{pose}-x{scale}.png'; sheet.save(out,optimize=True); print(out,sheet.size,round(k,4))
