"""Refit ONLY owner-provided f2/hat-01/hat-04 gallery canvas margins to the
median unchanged hat canvas occupancy per camera view.

No photo replacement, no resampling, no CSS zoom. All non-transparent pixels
and every alpha value are retained at their exact original resolution.
Idempotent: reference occupied fractions are calculated from unchanged hats.
"""
from pathlib import Path
from statistics import median
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]/"site/threads/assets/products"
TARGETS=("f2","hat-01","hat-04")
REFERENCES=("hat-02","hat-03","hat-05","hat-06")
VIEWS=("cover","front","profile","rear")

def occupancy(path):
    im=Image.open(path).convert("RGBA")
    bbox=im.getchannel("A").getbbox()
    if bbox is None: raise ValueError("Empty alpha: "+str(path))
    l,t,r,b=bbox
    return ((r-l)/im.width,(b-t)/im.height)

reference_fractions={
    view:tuple(median(occupancy(ROOT/ref/(view+".webp"))[axis]
                       for ref in REFERENCES) for axis in (0,1))
    for view in VIEWS
}
report=[]
for pid in TARGETS:
    for view in VIEWS:
        src=ROOT/pid/(view+".webp")
        im=Image.open(src).convert("RGBA")
        old_size=im.size
        bbox=im.getchannel("A").getbbox()
        l,t,r,b=bbox
        tight=im.crop(bbox)
        target_x,target_y=reference_fractions[view]
        new_w=max(tight.width,round(tight.width/target_x))
        new_h=max(tight.height,round(tight.height/target_y))
        x=(new_w-tight.width)//2
        y=(new_h-tight.height)//2
        result=Image.new("RGBA",(new_w,new_h),(0,0,0,0))
        result.paste(tight,(x,y))
        result.save(src,format="WEBP",lossless=True,method=6,exact=True)
        reread=Image.open(src).convert("RGBA")
        actual_box=reread.getchannel("A").getbbox()
        if actual_box is None or reread.getchannel("A").crop(actual_box).tobytes()!=tight.getchannel("A").tobytes():
            raise AssertionError(f"Alpha changed: {src}")
        # Ensure all visible source RGB values are exact. Hidden RGB where
        # alpha=0 need not be preserved, as they are invisible.
        import numpy as np
        before=np.asarray(tight,dtype=np.uint8)
        after=np.asarray(reread.crop(actual_box),dtype=np.uint8)
        assert before.shape==after.shape, src
        visible=before[:,:,3]>0
        if not np.array_equal(before[:,:,:3][visible],after[:,:,:3][visible]):
            raise AssertionError(f"Visible owner photograph changed: {src}")
        frac=occupancy(src)
        for a,b in zip(frac,reference_fractions[view]):
            if abs(a-b)>0.004: raise AssertionError(f"Reference mismatch: {src} {frac} vs {reference_fractions[view]}")
        report.append({"product":pid,"view":view,"from":old_size,"to":reread.size,
                       "reference_subject_fill":tuple(round(x,4) for x in reference_fractions[view]),
                       "result_subject_fill":tuple(round(x,4) for x in frac),
                       "visible_pixels_and_alpha":"exact"})
print(json.dumps({"reference_fractions":reference_fractions,"assets":report},indent=2))
