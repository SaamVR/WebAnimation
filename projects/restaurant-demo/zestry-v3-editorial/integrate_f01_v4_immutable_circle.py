#!/usr/bin/env python3
"""Integrate user's immutable F01 Pasta Bowl Final V4 into existing ZESTRY circle.

The uploaded V4 JSON SHA-256 matches GitHub historic master blob c2267ebc,
restored verbatim at assets/lottie/f01.json. Never modify the source JSON,
vectors, keyframes, masks, duration, frame interpolation, or positions.

The one renderer-only compatibility hint is applied to a parsed TEMPORARY
browser copy to make native Lottie-web render the *existing* Broth mask.
It changes no authored animation file, vectors, transforms, keyframes or art.
No duplicated wood layers, SVG definition clones, or F01 zoom animation.
"""
from pathlib import Path
from hashlib import sha256
import io,json,re,zipfile

ROOT=Path("projects/restaurant-demo")
BUNDLE=ROOT/"review_bundle"
SOURCE=ROOT/"assets/lottie/f01.json"
SHA="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
MARKER="ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118"

HERO_OLD='<div class="hero-image hero-visual" aria-label="Reserved space for replacement hero artwork"><div class="hero-artwork-placeholder" role="status" aria-live="polite"><span>Hero artwork awaiting replacement</span></div></div>'
HERO_NEW='<div class="hero-image hero-visual" aria-label="Pasta bowl V4 original animation within a circular frame"><div class="f01-v4-circle" aria-label="Original Pasta Bowl V4 food preparation"><div class="anim" data-animation="f01" aria-label="Pasta Bowl V4; original 8.7 second animation"></div></div></div>'

CSS=r"""
/* ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118
 * Circle is a SITE-level display mask, never a Lottie/SVG path edit.
 * Keep the full 1984:1134 source composition intact, centered in a
 * stable square frame throughout the complete 261-frame original.
 */
#home .hero-image.hero-visual{
  display:block;position:relative;aspect-ratio:1 / 1;width:100%;height:auto;
  min-height:0;min-width:0;max-width:780px;margin-inline:auto;isolation:isolate;
}
#home .hero-image.hero-visual .f01-v4-circle{
  position:absolute;inset:0;border-radius:50%;overflow:hidden;
  clip-path:circle(50% at 50% 50%);-webkit-clip-path:circle(50% at 50% 50%);
  isolation:isolate;z-index:1;
  background:#ecad7e url('assets/f01-v4-wood-fill.webp') center center/100% 100% no-repeat;
}
#home .hero-image.hero-visual .f01-v4-circle > .anim{
  position:absolute;left:50%;top:50%;
  width:122.48%;height:70%;margin:0;padding:0;
  transform:translate(-50%,-50%);transform-origin:center center;
  overflow:visible;pointer-events:none;
}
#home .hero-image.hero-visual .f01-v4-circle > .anim > svg{
  display:block;width:100%!important;height:100%!important;
  max-width:none!important;max-height:none!important;
}
@media(max-width:760px){
  #home .hero-image.hero-visual{
    width:min(100%,530px);aspect-ratio:1 / 1;min-height:0;
  }
}
"""
def replace_once(text,old,new,label):
    n=text.count(old)
    assert n==1,(label,n)
    return text.replace(old,new,1)

def integrate(page):
    assert MARKER not in page
    page=replace_once(page,HERO_OLD,HERO_NEW,"owner-placeholder hero")
    page=replace_once(page,"</style>",CSS+"\n</style>","site-level circle CSS")
    page=replace_once(page,
         "async function play(name,container,loop=false){if(name==='f03'||name==='f07')loop=false;",
         "async function play(name,container,loop=false){if(name==='f01'||name==='f03'||name==='f07')loop=false;",
         "F01 one-shot playback policy")
    # A copy is already parsed by fetch JSON; the only player compatibility
    # addition is transient mask detection for the ORIGINAL broth layer.
    # We do not change the source file or redraw any SVG/clip paths.
    snippet="""if(name==='f01'){
       const sourceIntegrity=v.layers.length===32&&v.fr===30&&v.op===261&&
         v.w===1984&&v.h===1134;
       if(!sourceIntegrity)throw new Error('Unexpected F01 original V4 source');
       const broth=v.layers.find(l=>l.ind===28&&l.nm.startsWith('Broth /'));
       if(!broth||!broth.masksProperties?.length)
         throw new Error('Original F01 native broth mask missing');
       // Native Lottie-web misdetects this existing mask without the hint.
       // Parsed in-memory player metadata ONLY; source bytes never changed.
       broth.hasMask=true;
     }
     """
    page=replace_once(page,
         "let v=await response.json();if(name==='f03'){",
         "let v=await response.json();"+snippet+"if(name==='f03'){",
         "player-only Broth mask compatibility")
    page=replace_once(page,
         "if(name==='f03')l.addEventListener('complete',",
         "if(name==='f01'||name==='f03')l.addEventListener('complete',",
         "one-shot completed scene hold")
    page=replace_once(page,
         "['f02-orbit','f02-cooking','f03','f06','f07']",
         "['f01','f02-orbit','f02-cooking','f03','f06','f07']",
         "deferred F01 player load")
    assert page.count(MARKER)==1
    assert 'data-animation="f01"' in page
    assert 'assets/f05_book.html' in page
    assert "play(name,c,name!=='f06')" in page # Render build command exact sentinel
    assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in page
    assert "mountF01" not in page
    assert "f01-v16" not in page
    assert "scale(1.755" not in page
    assert 'broth.hasMask=true' in page
    assert 'clip-path:circle(50% at 50% 50%)' in page
    return page

def main():
    assert sha256(SOURCE.read_bytes()).hexdigest()==SHA, "Owner V4 source changed"
    master=json.loads(SOURCE.read_bytes())
    assert (master["w"],master["h"],master["fr"],master["op"])==(1984,1134,30,261)
    assert len(master["layers"])==32
    files=sorted(BUNDLE.glob("part-*.bin"))
    assert len(files)>=20
    with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in files))) as z:
        assert z.testzip() is None
        data={i.filename:z.read(i.filename) for i in z.infolist()}
    assert "assets/lottie/f01-v16.json" not in data
    old=json.loads(data["assets/lottie/f01.json"])
    assert old["nm"]=="F01_REMOVED__EMPTY_RENDER_BUILD_VALIDATION_ONLY"
    original={k:sha256(v).hexdigest() for k,v in data.items()}
    assert len(data)==57,len(data)
    data["assets/lottie/f01.json"]=SOURCE.read_bytes() # EXACT owner V4 unchanged
    wood=ROOT/"assets/f01-v4-wood-fill.webp"
    assert wood.is_file() and wood.stat().st_size>1000,"Derived original wood fill required"
    assert wood.read_bytes()[:4]==b'RIFF' and wood.read_bytes()[8:12]==b'WEBP'
    data["assets/f01-v4-wood-fill.webp"]=wood.read_bytes()
    data["index.html"]=integrate(data["index.html"].decode()).encode()
    changed=[p for p in data if p not in original or original[p]!=sha256(data[p]).hexdigest()]
    assert set(changed)=={"assets/lottie/f01.json","index.html","assets/f01-v4-wood-fill.webp"},changed
    result=io.BytesIO()
    with zipfile.ZipFile(result,"w") as out:
        for name,blob in data.items():
            typ=zipfile.ZIP_STORED if Path(name).suffix in (".jpg",".png",".webp",".lottie",".woff",".woff2",".gif") else zipfile.ZIP_DEFLATED
            out.writestr(name,blob,compress_type=typ,
                compresslevel=6 if typ==zipfile.ZIP_DEFLATED else None)
    payload=result.getvalue()
    with zipfile.ZipFile(io.BytesIO(payload)) as check:
        assert check.testzip() is None
        assert len(check.namelist())==58
        assert sha256(check.read("assets/lottie/f01.json")).hexdigest()==SHA
        assert check.read("assets/lottie/f01.json")==SOURCE.read_bytes()
        assert all(sha256(check.read(k)).hexdigest()==v
                   for k,v in original.items() if k not in changed)
    for p in files:p.unlink()
    for idx,start in enumerate(range(0,len(payload),512000)):
        (BUNDLE/f"part-{idx:03d}.bin").write_bytes(payload[start:start+512000])
    print("F01_V4_IMMUTABLE_INTEGRATION",json.dumps({
        "originalSha":SHA,"sourceUntouched":True,"changedArchiveFiles":changed,
        "untouchedArchiveFiles":len(data)-len(changed),
        "newArchiveBytes":len(payload),"newParts":len(list(BUNDLE.glob('part-*.bin'))),
        "mask":"site CSS circular clip, one fixed fit throughout full playback",
        "player":"native Lottie-web; one-shot final hold; only transient Broth mask detection"
    }),flush=True)

if __name__=="__main__":main()
