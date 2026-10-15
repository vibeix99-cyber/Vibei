import zlib, struct, sys
def load(p):
    b=open(p,'rb').read(); assert b[:8]==b'\x89PNG\r\n\x1a\n'
    i=8; idat=b''; 
    while i<len(b):
        n,=struct.unpack('>I',b[i:i+4]); t=b[i+4:i+8]; d=b[i+8:i+8+n]; i+=12+n
        if t==b'IHDR': w,h,bd,ct,_,_,il=struct.unpack('>IIBBBBB',d)
        elif t==b'IDAT': idat+=d
    assert bd==8 and il==0
    bpp={2:3,6:4,0:1,4:2}[ct]; raw=zlib.decompress(idat); stride=w*bpp
    out=bytearray(h*stride); prev=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; p+=1; line=bytearray(raw[p:p+stride]); p+=stride
        if f==1:
            for x in range(bpp,stride): line[x]=(line[x]+line[x-bpp])&255
        elif f==2:
            for x in range(stride): line[x]=(line[x]+prev[x])&255
        elif f==3:
            for x in range(stride): line[x]=(line[x]+(((line[x-bpp] if x>=bpp else 0)+prev[x])>>1))&255
        elif f==4:
            for x in range(stride):
                a=line[x-bpp] if x>=bpp else 0; bb=prev[x]; c=prev[x-bpp] if x>=bpp else 0
                pa=abs(bb-c); pb=abs(a-c); pc=abs(a+bb-2*c)
                pr=a if (pa<=pb and pa<=pc) else (bb if pb<=pc else c)
                line[x]=(line[x]+pr)&255
        out[y*stride:(y+1)*stride]=line; prev=line
    return w,h,bpp,out
a=load(sys.argv[1]); b=load(sys.argv[2])
assert a[:3]==b[:3], (a[:3],b[:3])
w,h,bpp,A=a; B=b[3]
nd=0; x0=y0=10**9; x1=y1=-1; mx=0
for y in range(h):
    ra=A[y*w*bpp:(y+1)*w*bpp]; rb=B[y*w*bpp:(y+1)*w*bpp]
    if ra==rb: continue
    for x in range(w):
        pa=ra[x*bpp:(x+1)*bpp]; pb=rb[x*bpp:(x+1)*bpp]
        if pa!=pb:
            nd+=1; x0=min(x0,x); x1=max(x1,x); y0=min(y0,y); y1=max(y1,y); mx=max(mx,max(abs(i-j) for i,j in zip(pa,pb)))
print(f'{sys.argv[1].split("/")[-1]}: {w}x{h}  differing pixels {nd} ({100*nd/(w*h):.4f}%)  bbox x{x0}-{x1} y{y0}-{y1}  max channel delta {mx}')
