#!/usr/bin/env python3
"""Remove rejected ZESTRY F01 hero artwork and playback, awaiting owner upload.

This script operates strictly on the existing ZESTRY review_bundle ZIP.
It deletes both original F01 compositions, scrubs F01 mounts/runtime/loader,
preserves all other 56 asset payloads verbatim, and inserts a non-artwork 1-frame
validation sentinel for the EXISTING fixed Render build command. The actual
standalone F01 source file must be git rm'd by release CI after browser QA.

Do not use this script to modify F02/F03/F04/F05/F06/F07 animations.
"""
from __future__ import annotations
import hashlib,io,json,zipfile,re
from pathlib import Path

ROOT=Path("projects/restaurant-demo")
BUNDLE=ROOT/"review_bundle"
STAMP="ZESTRY_F01_REMOVED_AWAITING_OWNER_20261118"
OLD_SOURCE_SHA="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
OLD_V16_SHA="14f781c6568a15fd1593b7a906c95f87b9c445bd7573cf8741bbded92ca6660d"

# Non-visual, one-frame stub ONLY because the existing Render build command
# hard-codes JSON validation for 'f01'. It has NO drawable shape or artwork.
RENDER_COMPAT_STUB={
    "v":"5.12.2","fr":1,"ip":0,"op":1,"w":1,"h":1,
    "nm":"F01_REMOVED__EMPTY_RENDER_BUILD_VALIDATION_ONLY",
    "layers":[{
      "ty":3,"ind":1,"nm":"EMPTY_NONRENDERING_SENTINEL_NOT_ORIGINAL_ART",
      "ip":0,"op":1,"st":0,
      "ks":{
        "o":{"a":0,"k":0},"r":{"a":0,"k":0},
        "a":{"a":0,"k":[0,0,0]},"p":{"a":0,"k":[0,0,0]},
        "s":{"a":0,"k":[100,100,100]}
      }
    }]
}
HERO_BEFORE='<div class="hero-image hero-visual" aria-label="Original pasta bowl animation within a circular yellow hero visual">   <div class="hero-pasta hero-clip"><div class="anim" data-animation="f01" aria-label="Illustrated pasta being prepared"></div></div> </div>'
HERO_AFTER='<div class="hero-image hero-visual" aria-label="Reserved space for replacement hero artwork"><div class="hero-artwork-placeholder" role="status" aria-live="polite"><span>Hero artwork awaiting replacement</span></div></div>'
CSS="""
/* ZESTRY_F01_REMOVED_AWAITING_OWNER_20261118.
   Temporary non-artwork placeholder; the rejected F01 cannot render. */
.hero-artwork-placeholder{position:absolute;inset:14% 10% 12%;display:flex;
  align-items:center;justify-content:center;text-align:center;z-index:1;
  border:2px dashed rgba(80,29,15,.45);border-radius:50%;
  padding:30px;background:rgba(255,251,241,.15);
  color:#54251d;font-size:13px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase}
@media(max-width:760px){.hero-artwork-placeholder{inset:12%;font-size:11px}}
"""
def replace_once(s,old,new,label):
    assert s.count(old)==1,(label,s.count(old))
    return s.replace(old,new,1)

def strip_original_hero(s):
    assert STAMP not in s,"Already removed: this is a one-time migration"
    s=replace_once(s,HERO_BEFORE,HERO_AFTER,"hero markup")
    s=replace_once(s,"</style>",CSS+"</style>","placeholder styling")
    start=s.find("/* The source F01 is a 1984x1134 widescreen composition.")
    assert start>=0,"F01 runtime comment missing"
    end=s.find("async function play(name,container,loop=false)",start)
    assert end>start,"F01 helper endpoint missing"
    s=s[:start]+s[end:]
    s=replace_once(s,"if(name==='f01'||name==='f03'||name==='f07')loop=false;",
                   "if(name==='f03'||name==='f07')loop=false;","removed loop special case")
    s=replace_once(s,"name==='f01'?'f01-v16':name","name","remove F01 filename mapper")
    s=replace_once(s,
      "if(name==='f01'){const broth=v.layers.find(x=>x.ind===28&&x.nm.startsWith('Broth /'));if(!broth||!broth.masksProperties)throw new Error('Approved F01 broth layer missing');broth.hasMask=true;}",
      "","remove rejected F01 broth runtime")
    s=replace_once(s,
      "if(name==='f01'){mountF01WoodBackdrop(l,container);mountF01V16FixedSize(l,container);}",
      "","remove rejected F01 SVG mounts")
    s=replace_once(s,"if(name==='f01'||name==='f03')l.addEventListener(",
                   "if(name==='f03')l.addEventListener(","remove completion hook")
    s=replace_once(s,
      "['f01','f02-orbit','f02-cooking','f03','f06','f07']",
      "['f02-orbit','f02-cooking','f03','f06','f07']",
      "remove F01 from animation bootstrap")
    assert 'data-animation="f01"' not in s
    assert 'f01-v16' not in s
    assert 'mountF01' not in s
    assert "name==='f01'" not in s
    assert "['f02-orbit','f02-cooking','f03','f06','f07']" in s
    assert "play(name,c,name!=='f06')" in s, "Existing Render build rewriting sentinel required"
    assert 'assets/f05_book.html' in s
    assert '<div class="hero-artwork-placeholder"' in s
    assert STAMP in s
    return s

def main():
    parts=sorted(BUNDLE.glob("part-*.bin"))
    assert len(parts)>20
    data=b"".join(f.read_bytes() for f in parts)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        assert z.testzip() is None
        entries={info.filename:z.read(info.filename) for info in z.infolist()}
    originals={name:hashlib.sha256(blob).hexdigest() for name,blob in entries.items()}
    assert originals["assets/lottie/f01.json"]==OLD_SOURCE_SHA
    assert originals["assets/lottie/f01-v16.json"]==OLD_V16_SHA
    assert hashlib.sha256((ROOT/"assets/lottie/f01.json").read_bytes()).hexdigest()==OLD_SOURCE_SHA
    new=strip_original_hero(entries["index.html"].decode("utf-8"))
    entries["index.html"]=new.encode("utf-8")
    entries.pop("assets/lottie/f01-v16.json")
    entries["assets/lottie/f01.json"]=json.dumps(RENDER_COMPAT_STUB,separators=(",",":")).encode()
    assert len(entries)==57
    modified={k for k,blob in entries.items() if originals.get(k)!=hashlib.sha256(blob).hexdigest()}
    assert modified=={"index.html","assets/lottie/f01.json"}
    assert originals.keys()-entries.keys()=={"assets/lottie/f01-v16.json"}
    for name in ("f02-orbit.json","f02-cooking.json","f03.json","f04.json","f06.json","f07.json"):
        old=originals["assets/lottie/"+name]
        assert hashlib.sha256(entries["assets/lottie/"+name]).hexdigest()==old
    write=io.BytesIO()
    with zipfile.ZipFile(write,"w") as out:
        for name,blob in entries.items():
            compress=zipfile.ZIP_STORED if Path(name).suffix in (".jpg",".png",".webp",".lottie",".woff",".woff2",".gif") else zipfile.ZIP_DEFLATED
            out.writestr(name,blob,compress_type=compress,compresslevel=6 if compress==zipfile.ZIP_DEFLATED else None)
    result=write.getvalue()
    with zipfile.ZipFile(io.BytesIO(result)) as z:
        assert z.testzip() is None
        assert "assets/lottie/f01-v16.json" not in z.namelist()
        assert 'F01_REMOVED__EMPTY_RENDER_BUILD_VALIDATION_ONLY' in z.read('assets/lottie/f01.json').decode()
        assert z.read("index.html")==entries["index.html"]
    for p in parts:p.unlink()
    for i,start in enumerate(range(0,len(result),512_000)):
        (BUNDLE/f"part-{i:03d}.bin").write_bytes(result[start:start+512_000])
    print("F01_REMOVAL_PACKAGE_PASS",json.dumps({
      "removedOriginalF01JSON_SHA":OLD_SOURCE_SHA,
      "removedOriginalF01Derived_SHA":OLD_V16_SHA,
      "changedZipEntries":sorted(modified),
      "deletedZipEntries":["assets/lottie/f01-v16.json"],
      "untouchedAssets":len(entries)-len(modified),
      "buildStubBytes":len(entries['assets/lottie/f01.json']),
      "binaryZipBytes":len(result),
      "rawSourceToDeleteFromGit":"projects/restaurant-demo/assets/lottie/f01.json"
    }),flush=True)

if __name__=="__main__":main()
