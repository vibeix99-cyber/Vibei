# Post-process pose-switch JSON: screenshot-diff ink boxes (CSS px), baseline, step deltas, rAF-trace jumps; build strips.
import json, sys, glob, os
import numpy as np
from PIL import Image
def ink_from_diff(Af, Bf, dpr, clip, thr=16):
    A=np.asarray(Image.open(Af).convert('RGB')).astype(int); B=np.asarray(Image.open(Bf).convert('RGB')).astype(int)
    d=np.abs(A-B).max(2); m=d>thr
    ys,xs=np.where(m)
    if len(xs)==0: return None
    return [clip['x']+xs.min()/dpr, clip['y']+ys.min()/dpr, clip['x']+(xs.max()+1)/dpr, clip['y']+(ys.max()+1)/dpr]
