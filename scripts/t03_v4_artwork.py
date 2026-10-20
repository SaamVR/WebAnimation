"""Restore checkpoint T03 sprites with owner 2026-10-20 color-matched images.
Original image dimensions differ; register unchanged shoe/cap/bottle with a
SIFT/RANSAC-derived similarity map measured against the two uploaded artworks.
No repaint/recolor. All derived PNGs share pixel registration and dimensions.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]/"site/threads/assets"
closed=Image.open(root/"t03-new-closed-20261020.png").convert("RGBA")
opened=Image.open(root/"t03-new-open-20261020.png").convert("RGBA")
assert closed.size==(2048,1572)
assert opened.size==(1536,1024)
# open pixel -> closed pixel, from 81 inlier SIFT landmark matches
a,b,tx,c,d,ty=.768758857,.00801123056,423.677083,-.00801123056,.768758857,267.264128
det=a*d-b*c
inverse=(d/det,-b/det,(b*ty-d*tx)/det,-c/det,a/det,(c*tx-a*ty)/det)
open_registered=opened.transform(closed.size,Image.AFFINE,inverse,Image.BICUBIC,fillcolor=(0,0,0,0))
crop=(470,215,1560,1239)
def save(name,image):
 im=image.crop(crop)
 assert im.size==(1090,1024), im.size
 im.save(root/f't03-v4-{name}.png',optimize=True)
def mask(image,poly):
 alpha=Image.new("L",image.size,0)
 # Coordinates below are in shared crop canvas; offset into the full master.
 xy=[(x+crop[0],y+crop[1]) for x,y in poly]
 ImageDraw.Draw(alpha).polygon(xy,fill=255)
 final=image.copy()
 final.putalpha(Image.fromarray(np.minimum(np.array(image.getchannel("A"),dtype=np.uint16),np.array(alpha,dtype=np.uint16)).astype("uint8")))
 return final
save("closed",closed)
save("open-aligned",open_registered)
# Only overlay the hinged cream flap and the opened upper orange underside.
# A symbolic demo card masks the unattached top edge on the last beat.
save("closed-flap",mask(closed,[(361,152),(410,125),(494,119),(735,138),(785,174),(803,325),(763,380),(395,386),(349,300)]))
save("open-flap",mask(open_registered,[(371,0),(774,0),(796,62),(792,183),(750,266),(373,272),(350,159)]))
save("buckle-left",mask(closed,[(467,260),(530,256),(547,422),(475,432)]))
save("buckle-right",mask(closed,[(663,267),(724,272),(752,435),(677,440)]))
print("Registered source states into 1090 × 1024 canvas; both originals untouched")
