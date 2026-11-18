#!/usr/bin/env python3
"""Owner V8 fix: layout only, preserving all approved Lottie JSONs. No deploy."""
from pathlib import Path
import io, zipfile, hashlib, re, argparse
ROOT=Path(__file__).resolve().parent.parent
HERE=Path(__file__).resolve().parent
PARTS=ROOT/'review_bundle'
CHECK={
'assets/lottie/f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
'assets/lottie/f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
'assets/lottie/f07.json':'a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b',
'assets/f05_book.lottie':'3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645'
}
SITE_CSS=r"""
/* Owner V8: entire book and its controls stay below sticky navbar. */
#menu.f05-section{
 --z-header:92px;scroll-margin-top:0!important;
 padding:10px 0 6px!important;overflow:clip;background:#fff9f1
}
#menu.f05-section .wrap{max-width:none!important;width:100%;padding-inline:clamp(8px,2vw,24px)}
#menu .f05-viewport{width:100%;min-height:0;position:relative;overflow:hidden}
#menu .f05-viewport iframe{
 width:100%!important;height:min(760px,calc(100dvh - var(--z-header) - 22px))!important;
 min-height:0!important;max-height:none!important;border:0;display:block;background:transparent;
}
@supports not (height:100dvh){
 #menu .f05-viewport iframe{height:min(760px,calc(100vh - var(--z-header) - 22px))!important}
}
@media(max-width:760px){
 #menu.f05-section{--z-header:72px;padding:8px 0!important}
 #menu .f05-viewport iframe{height:min(525px,calc(100dvh - 92px))!important}
}
@media(max-width:390px){#menu .f05-viewport iframe{height:min(450px,calc(100dvh - 92px))!important}}

/* Organic, intentionally asymmetrical ink-and-paper silhouette, not ellipse. */
.hero .hero-image.hero-visual{
 border-radius:0!important;
 clip-path:url(#zestry-hero-blob)!important;
 -webkit-clip-path:url(#zestry-hero-blob)!important;
 background:#ffd24b!important;overflow:hidden!important
}
.hero-svg-def{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none}

/* Replace duplicate booking/lifestyle section with a real F04 order story. */
#story.pickup-story{padding:clamp(42px,6vw,84px) 0;background:#fff9f1;overflow:hidden}
#story .pickup-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.06fr);align-items:center;gap:clamp(24px,5vw,80px)}
#story .pickup-copy p{max-width:510px}
#story .pickup-visual{width:100%;max-width:490px;justify-self:center;aspect-ratio:1.25;min-width:0}
#story .pickup-visual .anim{width:100%;height:100%;min-height:0}
#story .pickup-note{font-size:.84rem;opacity:.75;margin-top:14px}
@media(max-width:760px){
 #story .pickup-layout{grid-template-columns:1fr;gap:12px}
 #story .pickup-visual{width:min(100%,450px)}
}
"""
BOOK_CSS=r"""
/* The original book canvas, hotspot overlays, photo and controls scale together. */
.viewport{width:100%;height:100%;position:relative;overflow:hidden}
.surface{position:absolute!important;aspect-ratio:3/2;max-width:none!important}
#art{width:100%;height:100%;display:block}
.hotspots button{
 -webkit-tap-highlight-color:transparent!important;
 appearance:none!important;outline:0;box-shadow:none!important;background:transparent!important
}
.hotspots button:focus:not(:focus-visible){outline:0!important;box-shadow:none!important}
.hotspots button:focus-visible{
 outline:2px solid #225238!important;outline-offset:2px!important;
 border-radius:999px!important;background:transparent!important;box-shadow:none!important
}
.hotspots .nav,.hotspots .close{border-radius:999px!important;min-width:34px;min-height:34px}
.hotspots .cat{border-radius:999px!important}
/* Strict inset from the right page's inner gold frame. Never cross page trim. */
.photos,.photos.single{
 left:54.05%!important;top:39.1%!important;width:17.15%!important;
 height:26.45%!important;min-width:0!important;max-width:none!important;
 overflow:hidden!important;grid-template-columns:minmax(0,1fr)!important
}
.dish{
 width:100%!important;height:100%!important;min-height:0!important;max-width:100%!important;
 overflow:hidden!important;grid-template-rows:minmax(0,1fr) auto auto!important;
 gap:clamp(2px,.25vw,5px)!important;padding:clamp(3px,.38vw,6px)!important;
 border:1px solid #ead4ac!important;box-shadow:none!important
}
.dish img{width:100%!important;height:100%!important;min-height:0!important;object-fit:cover!important}
.dish .name{font-size:clamp(12px,1.3vw,20px)!important;line-height:1.07!important}
.dish .price{font-size:clamp(12px,1.15vw,17px)!important;line-height:1.08!important}
.dish .price small{font-size:.62em!important}
.book-page-index{right:5px!important;top:4px!important;bottom:auto!important;z-index:5!important;font-size:clamp(10px,.8vw,13px)!important}
@media(max-width:760px){
 .dish .name{font-size:clamp(11px,3vw,14px)!important}
 .dish .price{font-size:clamp(11px,2.9vw,13px)!important}
 .dish .price small{font-size:.56em!important}
 .hotspots .nav,.hotspots .close{min-width:30px;min-height:30px}
}
@media(max-width:390px){
 .photos,.photos.single{top:38.7%!important;height:27%!important}
 .dish .name,.dish .price{font-size:11px!important}
 .hotspots .nav,.hotspots .close{min-width:28px;min-height:28px}
}
"""
BOOK_JS=r"""
/* Fit a single continuous vector canvas + its real book-control hit targets. */
(()=>{
 'use strict';
 const root=document.querySelector('.viewport'),stage=document.querySelector('.surface');
 if(!root||!stage)return;
 let queued=false;
 function fit(){
  queued=false;
  const W=root.clientWidth,H=root.clientHeight;
  if(W<1||H<1)return;
  // Original F05 coordinate system: stage 1740x1160, visible book about
  // 850x790 with illustrated navigation and close button. Scale BOTH axes.
  const s=Math.max(.15,Math.min((W-20)/900,(H-22)/790,1.3));
  stage.style.width=(1740*s).toFixed(2)+'px';
  stage.style.height=(1160*s).toFixed(2)+'px';
  stage.style.left=((W-850*s)/2-470*s).toFixed(2)+'px';
  stage.style.top=((H-790*s)/2-160*s).toFixed(2)+'px';
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(fit)}}
 if(window.ResizeObserver)new ResizeObserver(queue).observe(root);
 window.addEventListener('resize',queue,{passive:true});
 fit();
 document.addEventListener('pointerup',e=>{
  const b=e.target.closest('.hotspots button');
  if(b)requestAnimationFrame(()=>{if(document.activeElement===b)b.blur()});
 },true);
})();
"""
STORY=r"""<section class="section pickup-story" id="story" aria-labelledby="pickup-heading">
<div class="wrap pickup-layout">
 <div class="pickup-copy">
  <div class="eyebrow red">ORDER &amp; PICKUP</div>
  <h2 id="pickup-heading">A little joy after <em>every order.</em></h2>
  <p>Choose your favorites from our illustrated menu, add them to your bag, and try a sample pickup checkout. A little celebration awaits when the order is confirmed.</p>
  <a class="btn yellow" href="#menu">Explore the menu <span aria-hidden="true">↗</span></a>
  <p class="pickup-note">Animation preview only. No real payment or order is placed.</p>
 </div>
 <div class="pickup-visual"><div class="anim" data-animation="f04"
 aria-label="Animated preview of the sample pickup order confirmation"></div></div>
</div></section>"""
SVG=r"""<svg class="hero-svg-def" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>
<clipPath id="zestry-hero-blob" clipPathUnits="objectBoundingBox">
<path d="M .47 .035 C .60 -.005 .74 .04 .82 .13 C .94 .18 .99 .30 .955 .43 C 1 .54 .955 .70 .84 .80 C .78 .92 .63 .98 .50 .95 C .38 1 .24 .965 .155 .86 C .03 .78 .01 .64 .065 .52 C .025 .39 .09 .27 .17 .19 C .25 .095 .35 .085 .47 .035 Z"/>
</clipPath></defs></svg>"""
def once(s,old,new,label):
 assert s.count(old)==1,(label,s.count(old))
 return s.replace(old,new,1)
def main():
 a=argparse.ArgumentParser();a.add_argument('--preview-dir');a.add_argument('--pack',action='store_true');args=a.parse_args()
 paths=sorted(PARTS.glob('part-*.bin'));assert len(paths)>10
 with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in paths))) as z:
  assert z.testzip() is None
  files={i.filename:z.read(i.filename) for i in z.infolist()}
  infos={i.filename:i for i in z.infolist()}
 for f,sha in CHECK.items():assert hashlib.sha256(files[f]).hexdigest()==sha,f
 site=files['index.html'].decode();book=files['assets/f05_book.html'].decode()
 assert 'zestry-owner-v8.css' not in site and 'f05-fit-v8.js' not in book
 site,n=re.subn(r'<section class="section" id="story">[\s\S]*?</section>',STORY,site,count=1)
 assert n==1,'old story section not found'
 site=once(site,'<a href="#story">Our Story</a>','<a href="#story">Order &amp; Pickup</a>','nav')
 site=once(site,'<div class="hero-image hero-visual"',SVG+'<div class="hero-image hero-visual"','blob')
 site=once(site,"if(name==='f01'||name==='f03'||name==='f07')loop=false;","if(name==='f01'||name==='f03'||name==='f04'||name==='f07')loop=false;",'F04 one shot')
 site=once(site,"if(name==='f01'||name==='f03')l.addEventListener('complete'","if(name==='f01'||name==='f03'||name==='f04')l.addEventListener('complete'",'F04 final hold')
 site=once(site,"['f01','f02-orbit','f02-cooking','f03','f06','f07']","['f01','f02-orbit','f02-cooking','f03','f04','f06','f07']",'F04 preload')
 site=once(site,'</head>','<link rel="stylesheet" href="assets/zestry-owner-v8.css"/></head>','site CSS')
 book=once(book,'</head>','<link rel="stylesheet" href="f05-fit-v8.css"/></head>','book CSS')
 book=once(book,'</body>','<script src="f05-fit-v8.js"></script></body>','book JS')
 assert site.count('data-animation="f04"')==1 and site.count("showConfirm('f04',line)")==1
 assert site.count('data-animation="f07"')==1 and 'Find your happy place at the table' not in site
 assert 'src="assets/f05_book.html"' in site
 files['index.html']=site.encode();files['assets/f05_book.html']=book.encode()
 for name,s in [('zestry-owner-v8.css',SITE_CSS),('f05-fit-v8.css',BOOK_CSS),('f05-fit-v8.js',BOOK_JS)]:
  s=s.strip()+'\n'
  (HERE/name).write_text(s,'utf8')
  files['assets/'+name]=s.encode()
 for f,sha in CHECK.items():assert hashlib.sha256(files[f]).hexdigest()==sha
 if args.preview_dir:
  root=Path(args.preview_dir)
  for name,data in files.items():
   target=root/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
  vendor=ROOT/'assets/vendor/lottie.min.js'
  if vendor.exists():
   target=root/'assets/vendor/lottie.min.js';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(vendor.read_bytes())
  print('PREVIEW',root,'FILES',len(files))
 if args.pack:
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:
   for name,data in files.items():
    if name in infos:z.writestr(infos[name],data)
    else:z.writestr(name,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  blob=out.getvalue()
  with zipfile.ZipFile(io.BytesIO(blob)) as z:
   assert z.testzip() is None
   for f,sha in CHECK.items():assert hashlib.sha256(z.read(f)).hexdigest()==sha
  for p in paths:p.unlink()
  for i,x in enumerate(range(0,len(blob),512000)):
   (PARTS/f'part-{i:03d}.bin').write_bytes(blob[x:x+512000])
  print('PACK',len(blob),'bytes',len(list(PARTS.glob('part-*.bin'))),'parts')
 print('V8_READY_ALL_MASTERS_PRESERVED_NO_DEPLOY')
if __name__=='__main__':main()
