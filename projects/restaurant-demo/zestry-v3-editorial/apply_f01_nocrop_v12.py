#!/usr/bin/env python3
"""ZESTRY V12—preserve every F01 ingredient inside its circular presentation.
Clones original static wood layer for backdrop; source JSON remains byte-identical.
"""
from pathlib import Path
import hashlib,zipfile,io,argparse
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
PARTS=ROOT/'review_bundle'
CHECK={
 'assets/lottie/f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
 'assets/lottie/f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
 'assets/lottie/f04.json':'e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0',
 'assets/lottie/f07.json':'a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b',
 'assets/f05_book.lottie':'3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645'
}
R_OLD="rendererSettings:{preserveAspectRatio:name==='f01'?'xMidYMid slice':'xMidYMid meet'}"
R_NEW="rendererSettings:{preserveAspectRatio:'xMidYMid meet'}"
HOOK_OLD="container.dataset.loaded='yes';container.dataset.player=name;"
HOOK_NEW="if(name==='f01')mountF01WoodBackdrop(l,container);container.dataset.loaded='yes';container.dataset.player=name;"
HOOK=r"""
/* The source F01 is a 1984x1134 widescreen composition. Its animated
   foreground cannot geometrically cover a 1:1 circle without cropping.
   Reuse the unchanged static wood vector layer as an SVG circle-fill,
   then fit the complete F01 foreground into an inscribed rectangular area.
   NO animation layers/frames/artwork are modified. */
function mountF01WoodBackdrop(animation,container){
 const bind=()=>{
  const host=container.closest('.hero-image.hero-visual');
  const layer=animation.renderer?.elements?.find(e=>
    e?.data?.nm?.startsWith('background-wood-tabletop'));
  const original=layer?.layerElement;
  const sourceSvg=animation.renderer?.svgElement||container.querySelector('svg');
  if(!host||!original||!sourceSvg){
    console.error('ZESTRY F01 background isolation unavailable — leaving original layer intact');
    container.dataset.woodFill='fallback';
    return;
  }
  if(host.querySelector('.f01-wood-fill'))return;
  const ns='http://www.w3.org/2000/svg';
  const wood=document.createElementNS(ns,'svg');
  wood.setAttribute('viewBox','0 0 1984 1134');
  wood.setAttribute('preserveAspectRatio','xMidYMid slice');
  wood.setAttribute('aria-hidden','true');
  wood.classList.add('f01-wood-fill');
  const defs=sourceSvg.querySelector('defs');
  if(defs)wood.appendChild(defs.cloneNode(true));
  wood.appendChild(original.cloneNode(true));
  host.insertBefore(wood,host.firstChild);
  original.style.visibility='hidden';
  container.dataset.woodFill='original-vector';
 };
 animation.addEventListener('DOMLoaded',bind);
 if(animation.renderer?.elements?.length && container.querySelector('svg g'))bind();
}
"""
CSS=r"""
/* V12: original wooden tabletop fills circle; F01 ingredients stay inside.
   The yellow accent is a subtle second circle BEHIND it, never letterboxing. */
.hero .hero-image.hero-visual{
 background:#EDAE7E!important;
 box-shadow:-13px 10px 0 -2px #FFD64E!important;
 isolation:isolate!important;
}
.hero .hero-image.hero-visual .f01-wood-fill{
 display:block!important;
 position:absolute!important;
 inset:0!important;
 width:100%!important;height:100%!important;
 z-index:0!important;
 pointer-events:none!important;
 overflow:hidden!important;
}
.hero .hero-image.hero-visual .hero-pasta.hero-clip{
 position:absolute!important;
 inset:8%!important;
 width:84%!important;
 height:84%!important;
 z-index:1!important;
 margin:0!important;
 transform:none!important;
 overflow:visible!important;
}
.hero .hero-image.hero-visual .hero-pasta .anim{
 width:100%!important;
 height:100%!important;
 min-width:0!important;min-height:0!important;
 overflow:hidden!important;
}
.hero .hero-image.hero-visual .hero-pasta .anim svg{
 overflow:hidden!important;
}
@media(max-width:680px){
 .hero .hero-image.hero-visual{box-shadow:-9px 7px 0 -1px #FFD64E!important}
}
"""
def sha(x):return hashlib.sha256(x).hexdigest()
def once(s,old,new,key):
 assert s.count(old)==1,(key,s.count(old))
 return s.replace(old,new,1)
def build():
 parts=sorted(PARTS.glob('part-*.bin'));assert len(parts)>=20
 with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in parts))) as z:
  assert z.testzip() is None
  files={i.filename:z.read(i.filename) for i in z.infolist()}
  info={i.filename:i for i in z.infolist()}
 for n,h in CHECK.items():assert sha(files[n])==h,n
 html=files['index.html'].decode()
 css=files['assets/zestry-owner-v8.css'].decode()
 html=once(html,R_OLD,R_NEW,'F01 renderer')
 html=once(html,HOOK_OLD,HOOK_NEW,'wood hook')
 html=once(html,'async function play(name,container,loop=false)',HOOK.strip()+"\nasync function play(name,container,loop=false)",'mount function')
 css=css.rstrip()+'\n'+CSS.strip()+'\n'
 assert html.count('mountF01WoodBackdrop(l,container)')==1
 assert 'xMidYMid slice' in html # only cloned wood layer
 assert 'xMidYMid meet' in html
 assert 'data-animation="f04"' not in html and html.count("showConfirm('f04',line)")==1
 assert 'zestry-hero-blob' not in html
 assert html.count('data-animation="f07"')==1
 assert 'aspect-ratio:1 / 1!important' in css
 files['index.html']=html.encode()
 files['assets/zestry-owner-v8.css']=css.encode()
 (HERE/'zestry-owner-v8.css').write_text(css,encoding='utf8')
 for n,h in CHECK.items():assert sha(files[n])==h,n
 return parts,files,info
def main():
 p=argparse.ArgumentParser();p.add_argument('--preview-dir');p.add_argument('--pack',action='store_true');a=p.parse_args()
 parts,files,info=build()
 if a.preview_dir:
  root=Path(a.preview_dir)
  for name,b in files.items():
   target=root/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
  vendor=ROOT/'assets/vendor/lottie.min.js'
  if vendor.exists():
   target=root/'assets/vendor/lottie.min.js';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(vendor.read_bytes())
  print('V12_PREVIEW',root,len(files),'assets')
 if a.pack:
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:
   for name,b in files.items():
    if name in info:z.writestr(info[name],b)
    else:z.writestr(name,b,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  data=out.getvalue()
  with zipfile.ZipFile(io.BytesIO(data)) as z:
   assert z.testzip() is None
   for n,h in CHECK.items():assert sha(z.read(n))==h
  for part in parts:part.unlink()
  for i,at in enumerate(range(0,len(data),512000)):
   (PARTS/f'part-{i:03d}.bin').write_bytes(data[at:at+512000])
  print('V12_PACKED',len(data),'bytes')
 print('V12_MASTER_UNMODIFIED_NO_DEPLOY')
if __name__=='__main__':main()
