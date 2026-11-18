#!/usr/bin/env python3
"""Remove BOTH F02 chef visuals/auto-loader only from current ZESTRY website.

Owner will provide the replacement Lottie later. Preserve original historic
F02 source files and all bundled JSON intact, because they were NOT requested
to be deleted. In particular, do not disturb the just-approved F01 V4 source.

Deliberately DOES NOT deploy, edit Render config, or touch other projects.
"""
from pathlib import Path
import io,zipfile,hashlib,json,re

ROOT=Path("projects/restaurant-demo")
BUNDLE=ROOT/"review_bundle"
MARKER="ZESTRY_BOTH_F02_REMOVED_PENDING_OWNER_FILE_20261119"
CHEF_SECONDARY='<div class="chef-secondary"><div class="anim" data-animation="f02-cooking" aria-label="Chef tossing a pan while cooking"></div></div>'
CHEF_PRIMARY='<div class="chef-primary"><div class="anim" data-animation="f02-orbit" aria-label="Chef at work with animated kitchen details"></div></div>'
CHEF_SLOT='<div class="chef-primary chef-awaiting-replacement" aria-label="Reserved for one updated chef illustration"><p>New chef illustration coming soon</p></div>'
ORIGINAL_LIST="['f01','f02-orbit','f02-cooking','f03','f06','f07']"
NEW_LIST="['f01','f03','f06','f07']"
CSS="""
/* ZESTRY_BOTH_F02_REMOVED_PENDING_OWNER_FILE_20261119
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

def replace_one(s,old,new,desc):
    assert s.count(old)==1,(desc,s.count(old))
    return s.replace(old,new,1)

def main():
    parts=sorted(BUNDLE.glob("part-*.bin"))
    assert len(parts)>=20,len(parts)
    with zipfile.ZipFile(io.BytesIO(b"".join(x.read_bytes() for x in parts))) as z:
        assert z.testzip() is None
        names=z.namelist()
        payload={x.filename:z.read(x.filename) for x in z.infolist()}
    original_hashes={n:hashlib.sha256(b).hexdigest() for n,b in payload.items()}
    assert original_hashes["assets/lottie/f01.json"]=="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
    assert original_hashes["assets/lottie/f02-orbit.json"]=="adfca93e752627a83ae06d44cc667d7baf655a79f9370f07ca3306ca10567a64"
    assert original_hashes["assets/lottie/f02-cooking.json"]=="5e341a2d8229a5dc762c720da8458608d456fd57f8d3aca83c95de5a9efc390e"
    html=payload["index.html"].decode()
    assert MARKER not in html
    assert html.count('data-animation="f02-orbit"')==1
    assert html.count('data-animation="f02-cooking"')==1
    html=replace_one(html,CHEF_SECONDARY,"","remove old secondary chef illustration")
    html=replace_one(html,CHEF_PRIMARY,CHEF_SLOT,"replace primary chef with one neutral slot")
    html=replace_one(html,ORIGINAL_LIST,NEW_LIST,"remove both from bootstrap")
    html=replace_one(html,"</style>",CSS+"</style>","append minimal placeholder style")
    assert html.count(MARKER)==1
    assert 'data-animation="f02-orbit"' not in html
    assert 'data-animation="f02-cooking"' not in html
    assert "f02-orbit" not in html and "f02-cooking" not in html
    assert html.count("chef-awaiting-replacement")>=2
    assert html.count('id="kitchen"')==1
    assert html.count('data-animation="f01"')==1
    assert 'ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118' in html
    assert "play(name,c,name!=='f06')" in html
    assert "['f01','f03','f06','f07']" in html
    assert 'data-animation="f03"' in html and 'data-animation="f06"' in html and 'data-animation="f07"' in html
    payload["index.html"]=html.encode()
    changed=[n for n in names if hashlib.sha256(payload[n]).hexdigest()!=original_hashes[n]]
    assert changed==["index.html"],changed
    with io.BytesIO() as buffer:
      with zipfile.ZipFile(buffer,"w") as out:
        for name,blob in payload.items():
          ext=Path(name).suffix
          comp=zipfile.ZIP_STORED if ext in (".jpg",".webp",".png",".lottie",".woff",".woff2",".gif") else zipfile.ZIP_DEFLATED
          out.writestr(name,blob,compress_type=comp,compresslevel=6 if comp==zipfile.ZIP_DEFLATED else None)
      packed=buffer.getvalue()
    with zipfile.ZipFile(io.BytesIO(packed)) as check:
      assert check.testzip() is None
      assert check.namelist()==names
      for name in names:
        assert check.read(name)==payload[name],name
    for p in parts:p.unlink()
    for i,start in enumerate(range(0,len(packed),512_000)):
      (BUNDLE/f"part-{i:03d}.bin").write_bytes(packed[start:start+512_000])
    print("ZESTRY_F02_REMOVE_PASS",json.dumps({
      "onlyChangedZipEntry":changed,
      "removedVisuals":["f02-orbit","f02-cooking"],
      "remainingAnimationBootstrap":["f01","f03","f06","f07"],
      "replacementSlot":"one placeholder, no Lottie loaded",
      "all58ZipFileEntriesPreserved":len(payload)==58,
      "unchangedAssets":len(payload)-1,
      "sourceJsonPreserved":True,
      "renderDeploymentTriggered":False,
      "parts":len(list(BUNDLE.glob('part-*.bin')))
    }),flush=True)

if __name__=="__main__":main()
