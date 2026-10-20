import sys, numpy as np
from PIL import Image
S=sys.argv[1]; M='/home/user/Vibei/kettle/art-src/chai/2d-v2'
sys.path.insert(0,'/home/user/wt/w9c/kettle/scripts')
def box(a,thr=8):
    ys,xs=np.where(a>thr); return xs.min(),ys.min(),xs.max()+1,ys.max()+1
import importlib.util
spec=importlib.util.spec_from_file_location('ex','/home/user/wt/w9c/kettle/scripts/export-chai-2d.py'); ex=importlib.util.module_from_spec(spec); spec.loader.exec_module(ex)
masters={}
for p in ['reading','sipping','cheering']:
    rgb=np.asarray(Image.open(f'{M}/chai-{p}.png').convert('RGB'))
    rgba,bg=ex.cut(rgb)
    mb=box(rgba[...,3]); masters[p]=mb
    o=np.asarray(Image.open(f'{S}/old/chai-{p}.webp').convert('RGBA')); n=np.asarray(Image.open(f'{S}/new/chai-{p}.webp').convert('RGBA'))
    ob=box(o[...,3]); nb=box(n[...,3])
    mw,mh=mb[2]-mb[0],mb[3]-mb[1]; ow,oh=ob[2]-ob[0],ob[3]-ob[1]; nw,nh=nb[2]-nb[0],nb[3]-nb[1]
    print(p,'master',rgb.shape[1],rgb.shape[0],'ink',mb,'w/h=%.4f'%(mw/mh),'| old',o.shape[1],o.shape[0],'ink',ob,'w/h=%.4f'%(ow/oh),'| new',n.shape[1],n.shape[0],'ink',nb,'w/h=%.4f'%(nw/nh),'aspect err vs master %+.2f%%'%(((nw/nh)/(mw/mh)-1)*100))
    print('   scale master->new: sx=%.4f sy=%.4f'%(nw/mw,nh/mh), ' new ink in logical px: w=%.1f h=%.1f'%(nw/1.25,nh/1.25))
# relative scale across poses in master space (shared canvas): heights
print('master ink heights',{p:masters[p][3]-masters[p][1] for p in masters},'bottoms',{p:masters[p][3] for p in masters},'tops',{p:masters[p][1] for p in masters})
