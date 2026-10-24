"""Tighten transparent padding on owner-provided cap photographs, losslessly.
No resampling, color changes, synthetic imagery, or CSS scaling.
Run from repository root after source assets are present.
"""
from pathlib import Path
from PIL import Image
from hashlib import sha256
import json
ROOT = Path(__file__).resolve().parents[1] / "site/threads/assets/products"
IDS = ("f2","hat-01","hat-04")
PARTS = ("cover","front","profile","rear")
items = []
for pid in IDS:
    for part in PARTS:
        path = ROOT / pid / f"{part}.webp"
        before = path.read_bytes()
        image = Image.open(path).convert("RGBA")
        bounds = image.getchannel("A").getbbox()
        if not bounds:
            raise ValueError(f"Empty alpha channel: {path}")
        l,t,r,b = bounds
        w,h = r-l,b-t
        # ~4% transparent gutter *on each side* protects the full crown,
        # brim, top button and real shadow, while matching existing cap crops.
        pad_x=max(10,round(w*.04))
        pad_y=max(10,round(h*.04))
        crop=(max(0,l-pad_x),max(0,t-pad_y),
              min(image.width,r+pad_x),min(image.height,b+pad_y))
        if (crop[2]-crop[0])<300 or (crop[3]-crop[1])<250:
            raise AssertionError(f"Unexpectedly small crop: {pid}/{part}")
        trimmed=image.crop(crop)
        if trimmed.getchannel("A").getbbox() is None: raise AssertionError("Alpha unexpectedly removed")
        # WebP lossless guarantees original decoded pixel colors/opacity do not change.
        trimmed.save(path,"WEBP",lossless=True,method=6,exact=True)
        items.append({"product":pid,"view":part,"originalSize":list(image.size),"originalBounds":list(bounds),
         "newSize":list(trimmed.size),"originalSHA256":sha256(before).hexdigest(),
         "newSHA256":sha256(path.read_bytes()).hexdigest()})
print(json.dumps(items,indent=2))
