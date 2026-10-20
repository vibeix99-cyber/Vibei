import sys, os
from PIL import Image, ImageDraw
K=os.environ.get('K_ROOT','/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K'); SC=os.environ.get('K_SC','/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3')
def montage(tag,state,box,out,z=3,pad=12):
    x0,y0,x1,y1=box; x0=max(0,x0-pad); y0=max(0,y0-pad); x1+=pad; y1+=pad
    ps=[('BEFORE',f'{K}/shots/before/{tag}/{state}.png'),('AFTER',f'{K}/shots/after/{tag}/{state}.png'),('BEFORE2',f'{SC}/before2/{tag}/{state}.png'),('AFTER2',f'{SC}/after2/{tag}/{state}.png')]
    ps=[(n,p) for n,p in ps if os.path.exists(p)]
    w,h=(x1-x0)*z,(y1-y0)*z; s=Image.new('RGB',(len(ps)*(w+4),h+16),(255,0,255)); d=ImageDraw.Draw(s)
    for i,(n,p) in enumerate(ps):
        c=Image.open(p).convert('RGB').crop((x0,y0,x1,y1)).resize((w,h),Image.NEAREST); s.paste(c,(i*(w+4),16)); d.text((i*(w+4)+2,2),f'{n} {tag} {state} @{x0},{y0}',fill=(255,255,255))
    s.save(out)
if __name__=='__main__':
    tag,state,x0,y0,x1,y1,out=sys.argv[1:8]; montage(tag,state,[int(v) for v in (x0,y0,x1,y1)],out)
