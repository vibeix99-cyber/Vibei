import numpy as np
from PIL import Image
root='/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL/cap/'
for tag in ('390x844@2-dark','390x844@2-light-solo'):
    names=('ctrl-19-settings.png','trial-19-settings.png')
    a=np.asarray(Image.open(root+tag+'/'+names[0]).convert('L')).astype(int); b=np.asarray(Image.open(root+tag+'/'+names[1]).convert('L')).astype(int)
    print(tag,a.shape,b.shape)
    for y0 in range(0,1700,200):
        A=a[y0:y0+200,:]
        best=None
        for dy in range(-12,13):
            y1=y0+dy
            if y1<0 or y1+200>b.shape[0]: continue
            B=b[y1:y1+200,:]
            e=np.abs(A-B).mean()
            if best is None or e<best[0]: best=(e,dy)
        e0=np.abs(A-b[y0:y0+200,:]).mean()
        print('  band',y0,'best dy (device px, trial vs base)',best[1],'err',round(best[0],2),'err at dy=0',round(e0,2))
