#!/usr/bin/env python3
"""Inspect only the currently deployed ZESTRY F01 references before removal."""
from pathlib import Path
import io,zipfile,re,json
p=Path("projects/restaurant-demo/review_bundle")
parts=sorted(p.glob("part-*.bin"))
with zipfile.ZipFile(io.BytesIO(b"".join(x.read_bytes() for x in parts))) as z:
 assert z.testzip() is None
 entries=z.namelist()
 html=z.read("index.html").decode()
 print("ZIP_ENTRIES",len(entries),"F01_FILES",[(n,z.getinfo(n).file_size) for n in entries if "f01" in n.lower() or "hero" in n.lower()])
 print("SOURCE_FILES",[(str(n),n.stat().st_size) for n in Path("projects/restaurant-demo/assets/lottie").glob("*") if "f01" in n.name.lower()])
 print("HERO_BLOCKS")
 for pat in ["hero-pasta","hero-image","hero-visual","data-animation=\"f01\"","mountF01WoodBackdrop","mountF01V16FixedSize","f01-v16","'f01'","\"f01\"","data-motion-complete","play(name,c","const names=","animations.forEach","IntersectionObserver","heroZoom"]:
  print("PATTERN",pat,"COUNT",html.count(pat))
  for match in list(re.finditer(re.escape(pat),html))[:3]:
   print("HIT",pat,match.start(),"CONTEXT",html[max(0,match.start()-750):match.end()+900].replace("\n"," ")[:1720])
 print("PUBLISH_CHECKS")
 print("BUNDLE_SECTIONS",json.dumps([n for n in entries if n.startswith("assets/lottie/")]))
