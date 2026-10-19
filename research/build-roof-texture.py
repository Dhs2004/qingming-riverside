from pathlib import Path
from PIL import Image,ImageFilter,ImageStat
base=Path(__file__).resolve().parent
im=Image.open(base/'bridge-original-3600.jpg')
# Original detail is 3600x1800; coordinates first expressed on its 1280x640 preview.
ul=(745,471); ur=(839,506.5); lr=(801,561); ll=(709,520)
quad=tuple(v*2.8125 for p in [ul,ll,lr,ur] for v in p)
patch=im.transform((512,512),Image.Transform.QUAD,quad,Image.Resampling.BICUBIC)
patch.save(base/'roof-source-rectified.jpg',quality=95)
g=patch.convert('L');smooth=g.filter(ImageFilter.GaussianBlur(26))
out=Image.new('L',g.size)
out.putdata([max(154,min(253,round(231+(a-b)*1.18))) for a,b in zip(g.getdata(),smooth.getdata())])
pix=out.load();w,h=out.size;border=30
for k in range(border):
    amount=.5*(1-k/(border-1))**2
    for y in range(h):
        a,b=pix[k,y],pix[w-1-k,y];pix[k,y]=round(a*(1-amount)+b*amount);pix[w-1-k,y]=round(b*(1-amount)+a*amount)
    for x in range(w):
        a,b=pix[x,k],pix[x,h-1-k];pix[x,k]=round(a*(1-amount)+b*amount);pix[x,h-1-k]=round(b*(1-amount)+a*amount)
out.save(base.parent/'dist/assets/roof-ink.png',optimize=True)
canvas=Image.new('RGB',(1024,1024))
for x in [0,512]:
    for y in [0,512]:canvas.paste(out,(x,y))
canvas.save(base/'roof-tile-repeat.jpg',quality=90)
