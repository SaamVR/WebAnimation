"""Normalize selected bag COVER canvas occupancy against unchanged reference covers.

Targets: bag-01 and bag-02 vs bag-04 (everyday backpack); bag-05 vs
median of bag-06 and bag-07 (duffels).
No non-cover gallery assets are touched, no CSS zoom, generation or resampling.
Image pixels/alpha inside the original visible silhouette are preserved.
"""
from pathlib import Path
from statistics import median
from PIL import Image
import numpy as np
import json

BASE=Path(__file__).resolve().parents[1]/"site/threads/assets/products"
TARGETS={"bag-01":("bag-04",),"bag-02":("bag-04",),
         "bag-05":("bag-06","bag-07")}

def rgba(pid):
    return Image.open(BASE/pid/"cover.webp").convert("RGBA")
def bounds(image):
    result=image.getchannel("A").getbbox()
    if result is None:raise ValueError("No product in source")
    return result
def occupancy(image):
    l,t,r,b=bounds(image)
    return (float(r-l)/image.width,float(b-t)/image.height)

stats=[]
for pid,refs in TARGETS.items():
    original=rgba(pid)
    bbox=bounds(original)
    contents=original.crop(bbox)
    want=tuple(median(occupancy(rgba(ref))[i] for ref in refs) for i in (0,1))
    width=max(contents.width,round(contents.width/want[0]))
    height=max(contents.height,round(contents.height/want[1]))
    adjusted=Image.new("RGBA",(width,height),(0,0,0,0))
    adjusted.paste(contents,((width-contents.width)//2,(height-contents.height)//2))
    dest=BASE/pid/"cover.webp"
    adjusted.save(dest,"WEBP",lossless=True,method=6,exact=True)
    loaded=Image.open(dest).convert("RGBA")
    visible_original=np.asarray(contents,dtype=np.uint8)
    visible_result=np.asarray(loaded.crop(bounds(loaded)),dtype=np.uint8)
    assert visible_original.shape==visible_result.shape,pid
    assert np.array_equal(visible_original[:,:,3],visible_result[:,:,3]),pid+" alpha changed"
    mask=visible_original[:,:,3]>0
    assert np.array_equal(visible_original[:,:,:3][mask],visible_result[:,:,:3][mask]),pid+" RGB changed"
    achieved=occupancy(loaded)
    assert max(abs(a-b) for a,b in zip(achieved,want))<.003,(pid,achieved,want)
    stats.append({"product":pid,"references":list(refs),"before":list(original.size),
                  "after":list(loaded.size),"original_visible_bound":list(bbox),
                  "target_occupancy":[round(v,4) for v in want],
                  "new_occupancy":[round(v,4) for v in achieved],
                  "alpha_and_visible_RGB":"identical to original"})
print(json.dumps(stats,indent=2))
