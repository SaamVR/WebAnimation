#!/usr/bin/env python3
"""Read-only audit of F02 chef views and related animation wiring in current ZIP."""
from pathlib import Path
import io,zipfile,re,hashlib,json
p=Path("projects/restaurant-demo/review_bundle")
parts=sorted(p.glob("part-*.bin"))
with zipfile.ZipFile(io.BytesIO(b"".join(x.read_bytes() for x in parts))) as z:
 assert z.testzip() is None
 html=z.read("index.html").decode()
 print("ZIP_FILE_COUNT",len(z.namelist()),"PARTS",len(parts))
 print("F02_ZIP_ASSETS",json.dumps([{"name":n,"bytes":z.getinfo(n).file_size,"sha256":hashlib.sha256(z.read(n)).hexdigest()} for n in z.namelist() if "f02" in n.lower()]))
 print("ORIGINAL_F01_SHA",hashlib.sha256(z.read("assets/lottie/f01.json")).hexdigest())
 for match in re.finditer(r"f02-orbit|f02-cooking|chef|Chef|the-kitchen|kitchen|Kitchen|Meet Our",html,re.I):
  print("HIT",json.dumps({"term":match.group(),"at":match.start(),"context":html[max(0,match.start()-600):match.end()+1050].replace("\n"," ")[:1800]}))
  if match.start()>80000:break
 print("F02_OCCURRENCES",json.dumps({k:html.count(k) for k in ["f02-orbit","f02-cooking","data-animation=\"f02","['f01','f02-orbit','f02-cooking'","data-animation","<section"]}))
 print("ANIMATION_CONTAINERS",json.dumps(re.findall(r'<[^>]+data-animation="[^"]+"[^>]*>',html)))
 print("ALL_LOTTIE_ASSETS",json.dumps([n for n in z.namelist() if n.startswith("assets/lottie/")]))
