import subprocess,sys,os,zlib,struct,glob,shutil
F='/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux'
v=sys.argv[1]; W,H=94,166
tmp='/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L3/fr/tmp'
shutil.rmtree(tmp,ignore_errors=True); os.makedirs(tmp)
subprocess.run([F,'-hide_banner','-loglevel','error','-i',v,'-vf',f'scale={W}:{H}','-pix_fmt','gray',f'{tmp}/%04d.png'],check=True)
def png(path):
    b=open(path,'rb').read(); i=8; idat=b''; w=h=0; ct=0
    while i<len(b):
        ln,=struct.unpack('>I',b[i:i+4]); t=b[i+4:i+8]; dat=b[i+8:i+8+ln]; i+=12+ln
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',dat[:10])
        elif t==b'IDAT': idat+=dat
    raw=zlib.decompress(idat); bpp=1 if ct==0 else 3 if ct==2 else 4; stride=w*bpp
    out=[]; prev=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; line=bytearray(raw[p+1:p+1+stride]); p+=1+stride
        for x in range(stride):
            a=line[x-bpp] if x>=bpp else 0; up=prev[x]; c=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+up)&255
            elif f==3: line[x]=(line[x]+((a+up)>>1))&255
            elif f==4:
                pa=abs(up-c); pb=abs(a-c); pc=abs(a+up-2*c)
                pr=a if (pa<=pb and pa<=pc) else (up if pb<=pc else c)
                line[x]=(line[x]+pr)&255
        out.append(line); prev=line
    return b''.join(bytes(l) for l in out)
files=sorted(glob.glob(tmp+'/*.png')); prev=None; diffs=[]
for f in files:
    cur=png(f)
    diffs.append(0 if prev is None else sum(abs(a-b) for a,b in zip(cur,prev))/len(cur)); prev=cur
mx=max(diffs)
print(v,'frames',len(files),'max',round(mx,2))
print([(round(i/25.0,2),round(x,1)) for i,x in enumerate(diffs) if x>0.3*mx])
