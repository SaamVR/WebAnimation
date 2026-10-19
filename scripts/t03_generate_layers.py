"""Derived T03 Stage A layers from two owner-supplied images; no generation."""
from PIL import Image,ImageDraw
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]/"site/threads/assets"
closed=Image.open(root/"t03-backpack-closed-original.png").convert("RGBA")
opened=Image.open(root/"t03-backpack-open-original.png").convert("RGBA")
# 2D affine alignment estimated from unchanged lower bag hardware / shoe / bottle.
a,b,tx,c,d,ty=.956807994,.0103104195,16.81042,-.0103104195,.956807994,-34.00166
det=a*d-b*c
inv=(d/det,-b/det,(b*ty-d*tx)/det,-c/det,a/det,(c*tx-a*ty)/det)
aligned=opened.transform(closed.size,Image.AFFINE,inv,Image.BICUBIC)
crop=(270,0,1360,1024)
def save(name,im):
 cropped=im.crop(crop)
 pixels=np.asarray(cropped).copy()
 pixels[pixels[:,:,3]==0,:3]=0
 Image.fromarray(pixels).save(root/("t03-"+name+".png"),optimize=True)
save("closed-crop",closed)
save("open-aligned",aligned)
def crop_mask(image,polygon):
 mask=Image.new("L",image.size,0)
 ImageDraw.Draw(mask).polygon(polygon,fill=255)
 out=image.copy()
 out.putalpha(Image.fromarray(np.minimum(np.asarray(image.getchannel("A"),dtype=np.uint16),np.asarray(mask,dtype=np.uint16)).astype('uint8')))
 return out
save("closed-flap",crop_mask(closed,[(573,132),(645,118),(911,129),(1009,167),(1041,305),(1010,391),(638,391),(564,324),(553,220)]))
save("open-flap",crop_mask(aligned,[(520,0),(1040,0),(1062,52),(1059,186),(1002,243),(572,244),(527,171)]))
save("buckle-left",crop_mask(closed,[(665,271),(749,259),(766,393),(687,408)]))
save("buckle-right",crop_mask(closed,[(903,286),(977,272),(999,419),(928,432)]))
print("T03 derived artwork installed in",root)
