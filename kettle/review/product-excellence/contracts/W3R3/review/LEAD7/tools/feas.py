import importlib.util, numpy as np, sys
from PIL import Image
spec=importlib.util.spec_from_file_location('ex','/home/user/wt/w9c/kettle/scripts/export-chai-2d.py'); ex=importlib.util.module_from_spec(spec); spec.loader.exec_module(ex)
import os
def build_u(pose,k=ex.DENSITY):
    rgb=np.asarray(Image.open(os.path.join(ex.SRC,f'chai-{pose}.png')).convert('RGB'))
    rgba,_=ex.cut(rgb); x0,y0,x1,y1=ex.bbox_of(rgba[...,3])
    crop=Image.fromarray(rgba[y0:y1,x0:x1].round().astype(np.uint8),'RGBA')
    lw,lh=ex.LOGICAL[pose]; ox0,oy0,ox1,oy1=ex.OLD_INK[pose]; W,H=round(lw*k),round(lh*k)
    s=(oy1-oy0)*k/crop.height; nw=round(crop.width*s); nh=round(crop.height*s)
    cx=(ox0+ox1)/2*k; X0=round(cx-nw/2); Y1=round(oy1*k); Y0=Y1-nh
    ink=crop.resize((nw,nh),Image.LANCZOS); can=Image.new('RGBA',(W,H),(0,0,0,0)); can.paste(ink,(X0,Y0))
    asp=((nw/nh)/(crop.width/crop.height)-1)*100
    return can,dict(X0=X0,X1=X0+nw,W=W,margin_l=X0,margin_r=W-X0-nw,aspect_err_pct=asp,ink_w_logical=nw/k,old_w=ox1-ox0)
tot=0
for p in ex.LOGICAL:
    img,i=build_u(p); b=ex.encode(img); tot+=len(b); img.save(f'{sys.argv[1]}/feas/u-{p}.png')
    h=ex.halo_report(b)
    print(p,len(b),'B',i,'pull',round(h['mean_pull_to_cream'],4))
print('total',tot)
