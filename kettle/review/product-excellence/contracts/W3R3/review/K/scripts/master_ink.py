# Independent ink segmentation of Vibei's masters (992x1586 RGB on cream, with ground shadow). Writes json + overlay check images.
# bg = pixels near the cream->dark "shadow line" connected to the image border (flood fill, 8-connected); ink = the rest.
import sys, json, numpy as np
from PIL import Image
from collections import deque
M='/home/user/Vibei/kettle/art-src/chai/2d-v2'
out={}
for pose in ['reading','sipping','cheering']:
    im=Image.open(f'{M}/chai-{pose}.png').convert('RGB'); a=np.asarray(im).astype(float); H,W,_=a.shape
    cream=np.median(np.concatenate([a[:6,:6].reshape(-1,3),a[:6,-6:].reshape(-1,3)]),axis=0)
    u=cream/np.linalg.norm(cream)
    proj=a@u; perp=np.linalg.norm(a-proj[...,None]*u,axis=2)
    t=float(sys.argv[1]) if len(sys.argv)>1 else 10.0
    cand=(perp<t)&(proj>0.80*np.linalg.norm(cream)*0.75)   # on the cream line, not darker than a deep shadow
    # connected-to-border flood on cand
    seen=np.zeros((H,W),bool); dq=deque()
    for x in range(W):
        for y in (0,H-1):
            if cand[y,x] and not seen[y,x]: seen[y,x]=True; dq.append((y,x))
    for y in range(H):
        for x in (0,W-1):
            if cand[y,x] and not seen[y,x]: seen[y,x]=True; dq.append((y,x))
    while dq:
        y,x=dq.popleft()
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                yy,xx=y+dy,x+dx
                if 0<=yy<H and 0<=xx<W and cand[yy,xx] and not seen[yy,xx]: seen[yy,xx]=True; dq.append((yy,xx))
    ink=~seen
    # drop specks: keep pixels, but bbox on the rows/cols with >=3 ink px to ignore isolated noise
    cols=np.where(ink.sum(0)>=3)[0]; rows=np.where(ink.sum(1)>=3)[0]
    x0,x1,y0,y1=int(cols[0]),int(cols[-1])+1,int(rows[0]),int(rows[-1])+1
    out[pose]=dict(size=[W,H],cream=[round(c,1) for c in cream],ink_box=[x0,y0,x1,y1],ink_w=x1-x0,ink_h=y1-y0,aspect=round((x1-x0)/(y1-y0),5))
    ov=im.copy(); 
    from PIL import ImageDraw
    d=ImageDraw.Draw(ov); d.rectangle([x0,y0,x1-1,y1-1],outline=(255,0,0),width=3)
    m=Image.fromarray((ink*255).astype('uint8')).convert('RGB')
    Image.fromarray(np.hstack([np.asarray(ov),np.asarray(m)])).resize((W,H//2)).save(f'/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3/master-ink-{pose}.png')
print(json.dumps(out,indent=1))
json.dump(out,open('/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K/json/master-ink.json','w'),indent=1)
