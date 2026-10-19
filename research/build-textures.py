from PIL import Image, ImageFilter, ImageChops, ImageStat, ImageDraw
from pathlib import Path
import math
base=Path(__file__).resolve().parent
assets=base.parent/'dist/assets'
source=Image.open(base/'scroll-original-38414.jpg')
water_box=(26000,1100,26512,1612)
silk_box=(26020,1465,26148,1593)
water_color=source.crop(water_box)
silk_color=source.crop(silk_box)
water_color.save(base/'water-source-color.png')
silk_color.save(base/'silk-source-color.png')

def normalize_gray(im,blur,base_level,gain,low,high):
    gray=im.convert('L')
    smooth=gray.filter(ImageFilter.GaussianBlur(blur))
    out=Image.new('L',gray.size)
    out.putdata([max(low,min(high,round(base_level+(v-b)*gain))) for v,b in zip(gray.getdata(),smooth.getdata())])
    return out

def join_edges(im,border):
    # Complementary border pairs converge to the same value at all four tile edges.
    w,h=im.size
    pix=im.load()
    for k in range(border):
        amount=(1-k/(border-1))**2 * .5
        for y in range(h):
            a,b=pix[k,y],pix[w-1-k,y]
            pix[k,y]=round(a*(1-amount)+b*amount)
            pix[w-1-k,y]=round(b*(1-amount)+a*amount)
    for k in range(border):
        amount=(1-k/(border-1))**2 * .5
        for x in range(w):
            a,b=pix[x,k],pix[x,h-1-k]
            pix[x,k]=round(a*(1-amount)+b*amount)
            pix[x,h-1-k]=round(b*(1-amount)+a*amount)
    return im

silk=normalize_gray(silk_color,3.5,243,.8,216,255)
silk=join_edges(silk,16)
silk_patch=silk.copy()
silk=Image.new('L',(512,512))
for ty in range(4):
    for tx in range(4):silk.paste(silk_patch,(tx*128,ty*128))
silk.save(assets/'silk-grain.png',optimize=True)
water=normalize_gray(water_color,24,242,1.45,198,255)
water=join_edges(water,48)
water.save(assets/'water-ink.png',optimize=True)
water.convert('RGB').save(assets/'water-ink.jpg',quality=94,subsampling=0,optimize=True)
# A warm-paper preview exaggerates grain contrast a little to aid visual inspection.
preview=Image.new('RGB',(2048,1055),'#eee9da')
for j,img in enumerate([silk,water]):
    paper=Image.new('RGB',img.size,(209,190,151))
    tex=ImageChops.multiply(paper,img.convert('RGB'))
    for y in range(2):
        for x in range(2):preview.paste(tex,(j*1024+x*512,y*512+31))
ImageDraw.Draw(preview).text((10,8),'silk-grain.png - 2x2 repeat, paper multiply',fill='#332c20')
ImageDraw.Draw(preview).text((1034,8),'water-ink.jpg - 2x2 repeat, paper multiply',fill='#332c20')
preview.save(base/'texture-repeat-preview.jpg',quality=94)
for name,im in [('silk',silk),('water',water)]:
    w,h=im.size;p=im.load()
    lr=max(abs(p[0,y]-p[w-1,y]) for y in range(h))
    tb=max(abs(p[x,0]-p[x,h-1]) for x in range(w))
    print(name,im.size,'range',im.getextrema(),'mean',ImageStat.Stat(im).mean[0],'max seam delta',lr,tb)
print('Source boxes:',water_box,silk_box)
