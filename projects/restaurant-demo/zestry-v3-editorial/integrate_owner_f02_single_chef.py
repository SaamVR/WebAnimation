#!/usr/bin/env python3
"""Integrate only owner's FINAL 360° F02 Lottie into the existing ZESTRY kitchen.

Original JSON is reconstructed byte-for-byte and SHA verified by
rebuild_owner_f02_360_exact.py. No owner keyframe/artwork modifications,
no new orbital choreography, no ping-pong reversal, NO DEPLOYMENT.
"""
from __future__ import annotations
import hashlib,io,json,zipfile
from pathlib import Path

ROOT=Path("projects/restaurant-demo")
BUNDLE=ROOT/"review_bundle"
OWNER_SHA="e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa"
F01_SHA="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
OLD_ORBIT_SHA="adfca93e752627a83ae06d44cc667d7baf655a79f9370f07ca3306ca10567a64"
OLD_COOK_SHA="5e341a2d8229a5dc762c720da8458608d456fd57f8d3aca83c95de5a9efc390e"
MARK="ZESTRY_F02_OWNER_FULL360_SINGLE_20261119"
OLD_SLOT='<div class="chef-primary chef-awaiting-replacement" aria-label="Reserved for one updated chef illustration"><p>New chef illustration coming soon</p></div>'
NEW_SLOT='<div class="chef-primary chef-single-360" aria-label="Chef in Action full clockwise vegetable orbit"><div class="anim" data-animation="f02-chef-full360" aria-label="Chef tossing food as colorful vegetables complete one clockwise revolution"></div></div>'
OLD_NAMES="['f01','f03','f06','f07']"
NEW_NAMES="['f01','f02-chef-full360','f03','f06','f07']"
OLD_ONESHOT="if(name==='f01'||name==='f03'||name==='f07')loop=false;"
NEW_ONESHOT="if(name==='f01'||name==='f02-chef-full360'||name==='f03'||name==='f07')loop=false;"
OLD_STYLES="""/* ZESTRY_BOTH_F02_REMOVED_PENDING_OWNER_FILE_20261119
   Temporary site-only single slot, no replacement animation loaded. */
#kitchen .chef-primary.chef-awaiting-replacement{
 display:grid;place-items:center;min-height:340px;
 border:2px dashed rgba(127,63,44,.3);border-radius:18px;
 background:rgba(255,244,227,.55);padding:24px;text-align:center
}
#kitchen .chef-awaiting-replacement p{
 font-weight:700;font-size:13px;letter-spacing:.04em;
 color:#865647;margin:0
}
@media(max-width:680px){#kitchen .chef-awaiting-replacement{min-height:240px}}
"""
NEW_STYLES="""/* ZESTRY_F02_OWNER_FULL360_SINGLE_20261119
   Single artist-supplied 2268-square vector composition, no crop or zoom.
   All 13 decorative garnish rigs and the chef pan toss come from the
   ORIGINAL uploaded Lottie, not CSS or JS animation. */
#kitchen .chef-primary.chef-single-360{
 position:relative;isolation:isolate;width:100%;max-width:615px;
 margin-inline:auto;min-width:0;
}
#kitchen .chef-primary.chef-single-360:before{
 inset:8% 5% 6%;border-radius:51% 49% 45% 55%;transform:rotate(5deg);
 background:#ffe3b0;
}
#kitchen .chef-single-360 .anim{
 display:block;position:relative;width:100%;height:auto;aspect-ratio:1 / 1;
 min-height:0;overflow:visible;
}
#kitchen .chef-single-360 .anim svg{
 display:block;width:100%!important;height:100%!important;
 max-width:100%;max-height:100%;overflow:visible;
}
#kitchen .chef-copy .chef-whisper{text-align:left;margin:18px 0 0}
@media(max-width:760px){
 #kitchen .chef-primary.chef-single-360{width:100%;max-width:490px;}
 #kitchen .chef-single-360 .anim{height:auto;min-height:0}
}
@media(max-width:680px){
 #kitchen .chef-primary.chef-single-360{width:min(100%,450px);margin:4px auto 0}
 #kitchen .chef-copy .chef-whisper{text-align:left}
}
"""
def replace_once(s,needle,new,desc):
 assert s.count(needle)==1,(desc,s.count(needle))
 return s.replace(needle,new,1)

def main():
 source=ROOT/"assets/lottie/f02-chef-full360.json"
 assert source.is_file()
 new_asset=source.read_bytes()
 assert hashlib.sha256(new_asset).hexdigest()==OWNER_SHA,"Owner F02 JSON was altered!"
 doc=json.loads(new_asset)
 assert (doc["w"],doc["h"],doc["ip"],doc["op"],doc["fr"],len(doc["layers"]))==(2268,2268,0,210,30,84)
 parts=sorted(BUNDLE.glob("part-*.bin"));assert parts
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  data={x.filename:z.read(x.filename) for x in z.infolist()}
 previous={k:hashlib.sha256(v).hexdigest() for k,v in data.items()}
 for name,sha in [("assets/lottie/f01.json",F01_SHA),
                  ("assets/lottie/f02-orbit.json",OLD_ORBIT_SHA),
                  ("assets/lottie/f02-cooking.json",OLD_COOK_SHA)]:
  assert previous[name]==sha,("Unexpected source asset",name)
 assert "assets/lottie/f02-chef-full360.json" not in data
 original=data["index.html"].decode()
 assert MARK not in original
 assert "data-animation=\"f02-orbit\"" not in original
 assert "data-animation=\"f02-cooking\"" not in original
 page=replace_once(original,OLD_SLOT,NEW_SLOT,"single chef slot")
 page=replace_once(page,OLD_STYLES,NEW_STYLES,"remove outdated placeholder CSS")
 page=replace_once(page,OLD_NAMES,NEW_NAMES,"chef loader")
 page=replace_once(page,OLD_ONESHOT,NEW_ONESHOT,"match owner no-loop dotLottie manifest")
 page=replace_once(page,"A kitchen full of <em>character.</em>",
                   "One chef. <em>Plenty of flair.</em>","one-chef kitchen headline")
 page=replace_once(page,
   "Every memorable meal starts with a little curiosity, generous ingredients, and a chef who loves what they do.",
   "A little pan-toss magic, a full circle of colorful ingredients, and one chef putting heart into every move.",
   "single chef copy")
 page=replace_once(page,
   "And yes, we have a little fun along the way.",
   "Fresh ideas in motion, from the first toss to the final flourish.",
   "single chef closing line")
 assert MARK in page and "data-animation=\"f02-chef-full360\"" in page
 assert "chef-awaiting-replacement" not in page
 assert "data-animation=\"f02-orbit\"" not in page and "data-animation=\"f02-cooking\"" not in page
 assert 'data-animation="f01"' in page and "ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118" in page
 assert "play(name,c,name!=='f06')" in page,"Existing Render build compatibility sentinel changed"
 assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in page
 data["index.html"]=page.encode()
 data["assets/lottie/f02-chef-full360.json"]=new_asset
 changed={k for k in data if k not in previous or hashlib.sha256(data[k]).hexdigest()!=previous[k]}
 assert changed=={"index.html","assets/lottie/f02-chef-full360.json"},changed
 with io.BytesIO() as output:
  with zipfile.ZipFile(output,"w") as archive:
   for name,blob in data.items():
    comp=zipfile.ZIP_STORED if Path(name).suffix in (".jpg",".png",".webp",".lottie",".woff",".woff2",".gif") else zipfile.ZIP_DEFLATED
    archive.writestr(name,blob,compress_type=comp,compresslevel=6 if comp==zipfile.ZIP_DEFLATED else None)
  result=output.getvalue()
 with zipfile.ZipFile(io.BytesIO(result)) as check:
  assert check.testzip() is None
  assert hashlib.sha256(check.read("assets/lottie/f02-chef-full360.json")).hexdigest()==OWNER_SHA
  assert all(hashlib.sha256(check.read(n)).hexdigest()==h for n,h in previous.items() if n!="index.html")
 for p in parts:p.unlink()
 for i,start in enumerate(range(0,len(result),512000)):
  (BUNDLE/f"part-{i:03d}.bin").write_bytes(result[start:start+512000])
 print("SINGLE_F02_INTEGRATED",json.dumps({
  "ownerSourceSha256":OWNER_SHA,
  "unchangedExistingZipEntries":len(previous)-1,
  "changed":"index.html","added":"assets/lottie/f02-chef-full360.json",
  "restOfSite":"unchanged",
  "loop":False,
  "deployment":False}),flush=True)
if __name__=="__main__":main()
