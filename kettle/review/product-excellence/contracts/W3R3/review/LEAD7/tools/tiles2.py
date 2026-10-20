import sys
from PIL import Image
S=sys.argv[1]; BG=(0x24,0x1a,0x2d)
def comp(p):
    im=Image.open(f'{S}/new/chai-{p}.webp').convert('RGBA'); b=Image.new('RGBA',im.size,BG+(255,)); b.alpha_composite(im); return b.convert('RGB')
sel=[('cheering',(330,170,390,250)),('cheering',(40,60,100,120)),('cheering',(90,480,150,535)),('reading',(30,95,90,155)),('sipping',(290,0,350,60)),('sipping',(330,330,378,390))]
tiles=[comp(p).crop(b).resize(((b[2]-b[0])*6,(b[3]-b[1])*6),Image.NEAREST) for p,b in sel]
out=Image.new('RGB',(3*370+20, 2*370+10),(128,128,128))
for i,t in enumerate(tiles): out.paste(t,((i%3)*375,(i//3)*375))
out.save(f'{S}/out/edges-closeup-x6-dark.png'); print(out.size)
