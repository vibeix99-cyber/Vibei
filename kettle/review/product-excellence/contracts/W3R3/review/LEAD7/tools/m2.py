import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
S=sys.argv[1]; M='/home/user/Vibei/kettle/art-src/chai/2d-v2'
def yuzu(img, scale):
    a=np.asarray(img.convert('RGBA')).astype(int); r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    m=(r>215)&(g>120)&(g<215)&(b<90)&(al>128)
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); k=np.argmax(sizes)+1
    ys,xs=np.where(lab==k)
    return (xs.max()-xs.min()+1)/scale,(ys.max()-ys.min()+1)/scale,ys.max()/scale
def feet(img, scale):
    # dark brown foot blobs in bottom 15% (R 100-150, G 55-90, B 30-60)
    a=np.asarray(img.convert('RGBA')).astype(int); h=a.shape[0]
    r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    m=(r>95)&(r<150)&(g>50)&(g<95)&(b>25)&(b<70)&(al>128)
    m[:int(h*0.78)]=False
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1)); ks=np.argsort(sizes)[-2:]+1
    out=[]
    for k in ks:
        ys,xs=np.where(lab==k); out.append(((xs.max()-xs.min()+1)/scale,(ys.max()-ys.min()+1)/scale))
    return out
for p in ['reading','sipping','cheering']:
    m=Image.open(f'{M}/chai-{p}.png'); o=Image.open(f'{S}/old/chai-{p}.webp'); n=Image.open(f'{S}/new/chai-{p}.webp')
    print(p,'yuzu w,h,bottom  master(px) %.0f %.0f %.0f'%yuzu(m,1),'| old(logical) %.1f %.1f %.1f'%yuzu(o,1),'| new(logical) %.1f %.1f %.1f'%yuzu(n,1.25))
    print('   feet master',['%.0fx%.0f'%f for f in feet(m,1)],'old',['%.1fx%.1f'%f for f in feet(o,1)],'new',['%.1fx%.1f'%f for f in feet(n,1.25)])
