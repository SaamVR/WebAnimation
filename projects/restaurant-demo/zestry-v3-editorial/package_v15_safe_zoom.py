#!/usr/bin/env python3
"""ZESTRY V15: 35% enlarged hero foreground with frame-synchronized safe entry.
Preserves original approved F01 JSON, F04 etc; updates only index runtime and CSS.
Do NOT merge/deploy until real Chromium pixel and functional QA pass.
"""
from pathlib import Path
import io,zipfile,hashlib
SOURCE=Path(__file__).resolve().parent
PROJECT=SOURCE.parent
PARTS=PROJECT/'review_bundle'
CSS=SOURCE/'zestry-owner-v8.css'
DATA=CSS.read_text()
APPEND="""

/* ZESTRY V15: 35% F01 foreground enlargement after safe ingredient entry.
   The large 756.6px circular wood background and subtle yellow accent remain
   EXACTLY V14. The original 84% F01 viewport stays centered, but only its
   outer wrapper allows the SVG's 1.35x camera enlargement to extend beyond
   that viewport; the SVG native source canvas retains internal clipping.
   The frame-synchronized zoom is applied to the F01 SVG by JS; no Lottie
   artwork, keyframe, easing, layer order or duration is modified. */
.hero .hero-image.hero-visual .hero-pasta .anim {
  overflow:visible!important;
}
.hero .hero-image.hero-visual .hero-pasta .anim svg {
  overflow:hidden!important;
  transform-origin:50% 50%!important;
}
"""
assert 'width:84%!important' in DATA
assert 'width:min(100%,756.6px)!important;max-width:756.6px!important' in DATA
if 'ZESTRY V15: 35% F01 foreground' not in DATA:
    DATA+=APPEND
    CSS.write_text(DATA)
INPUT=sorted(PARTS.glob('part-*.bin'))
assert len(INPUT)>=20
with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in INPUT))) as z:
    assert z.testzip() is None
    assets={item.filename:z.read(item.filename) for item in z.infolist()}
    meta={item.filename:item for item in z.infolist()}
    assert len(assets)==57
assert hashlib.sha256(assets['assets/lottie/f01.json']).hexdigest()=='7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37'
assert hashlib.sha256(assets['assets/lottie/f04.json']).hexdigest()=='e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0'
page=assets['index.html'].decode('utf8')
needle="if(name==='f01')mountF01WoodBackdrop(l,container);"
if 'function mountF01V15SafeZoom' not in page:
    assert page.count(needle)==1
else:
    assert page.count('mountF01V15SafeZoom(l,container)')==1
addon = """function mountF01V15SafeZoom(animation,container){
 const apply=()=>{
   const svg=container.querySelector('svg');if(!svg)return;
   const frame=Math.max(0,Math.min(260,Number(animation.currentFrame)||0));
   const t=Math.max(0,Math.min(1,(frame-92)/36));
   const ease=t*t*(3-2*t);
   const zoom=1+0.35*ease;
   svg.style.setProperty('transform','scale('+zoom.toFixed(6)+')','important');
   svg.style.setProperty('transform-origin','center center','important');
   container.dataset.heroZoom=zoom.toFixed(6);
   container.dataset.heroZoomFrame=frame.toFixed(2);
 };
 animation.addEventListener('DOMLoaded',apply);
 animation.addEventListener('enterFrame',apply);
 animation.addEventListener('complete',apply);
 apply();
}
"""
anchor='async function play(name,container,loop=false){'
assert page.count(anchor)==1
if 'function mountF01V15SafeZoom' not in page:
    page=page.replace(anchor,addon+anchor)
    page=page.replace(needle,"if(name==='f01'){mountF01WoodBackdrop(l,container);mountF01V15SafeZoom(l,container);}")
assets['index.html']=page.encode()
assets['assets/zestry-owner-v8.css']=DATA.encode()
output=io.BytesIO()
with zipfile.ZipFile(output,'w') as z:
  for name,data in assets.items():z.writestr(meta[name],data)
data=output.getvalue()
with zipfile.ZipFile(io.BytesIO(data)) as z:
 assert z.testzip() is None
 assert b'function mountF01V15SafeZoom' in z.read('index.html')
 assert z.read('assets/zestry-owner-v8.css')==DATA.encode()
 assert z.read('assets/lottie/f01.json')==assets['assets/lottie/f01.json']
for part in INPUT:part.unlink()
for i in range(0,len(data),512_000):(PARTS/f'part-{i//512000:03d}.bin').write_bytes(data[i:i+512000])
print('V15_BUILD_READY',len(data), 'zip_parts',len(list(PARTS.glob('part-*.bin'))),flush=True)
