import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
S=sys.argv[1]
def lab_L(rgb):
    c=rgb/255.0; c=np.where(c<=0.04045,c/12.92,((c+0.055)/1.055)**2.4)
    Y=c@np.array([0.2126,0.7152,0.0722]); return np.where(Y>0.008856,116*np.cbrt(Y)-16,903.3*Y)
def report(path,bgs):
    a=np.asarray(Image.open(path).convert('RGBA')).astype(float); al=a[...,3]/255
    edge=(a[...,3]>0)&(a[...,3]<255); solid=a[...,3]==255
    _,idx=ndi.distance_transform_edt(~solid,return_indices=True); inner=a[idx[0],idx[1],:3]
    Lr=lab_L(a[...,:3])[edge]; Li=lab_L(inner)[edge]
    out={'rim':int(edge.sum()),'dL_straight_mean':(Lr-Li).mean(),'dL_p99':np.percentile(Lr-Li,99),'frac_rim_lighter_than_inner_by5':((Lr-Li)>5).mean()}
    for name,bg in bgs.items():
        bg=np.array(bg,float)
        comp=a[...,:3]*al[...,None]+bg*(1-al[...,None]); Lc=lab_L(comp)[edge]; Lb=lab_L(bg[None,:])[0]
        ideal=inner*al[...,None]+bg*(1-al[...,None]); Lid=lab_L(ideal)[edge]
        halo=Lc>np.maximum(Lb,Li)+2   # rim composite lighter than both its bg and its own interior: a light fringe
        out[name]={'halo_px_frac':halo.mean(),'halo_px':int(halo.sum()),'mean_|dL|_vs_ideal':np.abs(Lc-Lid).mean(),'p99_dL_vs_ideal':np.percentile(Lc-Lid,99)}
    return out
bgs={'#241a2d(app dark --bg)':(0x24,0x1a,0x2d),'#221829':(0x22,0x18,0x29),'#1d1525(bg-sunken)':(0x1d,0x15,0x25),'black':(0,0,0)}
for p in ['reading','sipping','cheering']:
    for tag in ['old','new']:
        r=report(f'{S}/{tag}/chai-{p}.webp',bgs)
        print(f"{p:9s} {tag}: rim={r['rim']} straight dL(rim-inner) mean={r['dL_straight_mean']:+.2f} p99={r['dL_p99']:+.2f} frac>+5={r['frac_rim_lighter_than_inner_by5']:.4f}")
        for k in bgs: v=r[k]; print(f"      on {k:24s} halo px={v['halo_px']:5d} ({v['halo_px_frac']*100:.2f}%)  mean|dL*| vs ideal={v['mean_|dL|_vs_ideal']:.2f}  p99 dL*={v['p99_dL_vs_ideal']:+.2f}")
