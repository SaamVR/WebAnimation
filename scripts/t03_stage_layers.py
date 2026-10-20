"""T03 viewport-safe optimization only: all seven originals are retained unchanged.
All output sprites use the exact same pixel rectangle; no painting/regeneration."""
from PIL import Image
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"site/threads/assets"
crop=(470,225,1555,1070)
names=("closed","body","rim-interior","flap-exterior","flap-underside","buckle-left","buckle-right")
for key in names:
 src=Image.open(p/f"t03-layer-{key}.png").convert("RGBA")
 assert src.size==(2048,1572), (key,src.size)
 bbox=src.getbbox()
 assert bbox is not None and bbox[0]>=crop[0] and bbox[1]>=crop[1] and bbox[2]<=crop[2] and bbox[3]<=crop[3],(key,bbox)
 output=p/f"t03-stage-{key}.png"
 src.crop(crop).save(output,optimize=True)
 print(key,src.size,bbox,"=>",(crop[2]-crop[0],crop[3]-crop[1]))
