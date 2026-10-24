"""Extract ONLY supplied real product views from two owner collages.
No generative operations, fabricated camera angles, recoloring or relabeling.
Source panels have unequal widths; crop boundaries follow actual source columns.
"""
from PIL import Image
from pathlib import Path
import hashlib, sys
base=Path(__file__).resolve().parents[1]/"site/threads/assets/products"
sources=[
 ("f3",Path(sys.argv[1]),(2048,1422),"0484aca7f8cedbef16ee06233fdc4dfad5e9a97c5848652de31c6cc7c4f86853",[
  ("front",(20,40,875,1235)),("side",(883,40,1375,1235)),("angled",(1385,35,2030,1235))
 ]),
 ("f4",Path(sys.argv[2]),(2048,1143),"32051674ebce5debf9df6863a491aab8c29a6246e4017ce9f3b375fbff278024",[
  ("front",(48,45,678,948)),("profile",(709,45,1029,948)),("side",(1032,45,1430,948)),("angled",(1435,45,2005,948))
 ])
]
for product,path,size,digest,views in sources:
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,(product,"wrong owner file")
 original=Image.open(path).convert("RGB")
 assert original.size==size,(product,original.size)
 target=base/product;target.mkdir(parents=True,exist_ok=True)
 for name,rect in views:
  # Pixel crop alone. Do not resize, tint, draw text or touch existing covers.
  crop=original.crop(rect)
  output=target/(name+".webp")
  crop.save(output,"WEBP",quality=92,method=6)
  print(product,name,crop.size,output.stat().st_size,output)
