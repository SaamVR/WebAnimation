#!/usr/bin/env python3
"""ZESTRY V9: match owner green-outline organic crop, restore F04 checkout-only.
Precondition: reviewed V8 archive. No Lottie source changes or deployment.
"""
from pathlib import Path
import argparse,hashlib,io,re,zipfile
ROOT=Path(__file__).resolve().parent.parent
SRC=Path(__file__).resolve().parent
PARTS=ROOT/'review_bundle'
MASTERS={
 'assets/lottie/f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
 'assets/lottie/f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
 'assets/lottie/f04.json':'e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0',
 'assets/lottie/f07.json':'a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b',
 'assets/f05_book.lottie':'3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645'
}
# Based on the supplied green tracing: one broad upper-right shoulder, a
# tapered upper-left concavity and a long continuous lower-left sweep.
# No alternating floral scallops or symmetrical repeated lobes.
PATH="M .65 .025 C .83 -.012 .97 .09 .985 .29 C 1.03 .49 .98 .69 .84 .83 C .68 .99 .44 1.02 .24 .96 C .065 .91 -.02 .80 .02 .66 C .07 .53 .15 .50 .245 .43 C .35 .35 .36 .19 .50 .095 C .55 .07 .60 .04 .65 .025 Z"
STORY="""<section class="section" id="story" aria-labelledby="story-heading">
 <div class="wrap split">
  <img alt="ZESTRY fictional restaurant atmosphere, concept photography" loading="lazy" src="assets/photos/restaurant.jpg"/>
  <div class="brand-story-copy">
   <div class="eyebrow red">THE ZESTRY SPIRIT</div>
   <h2 id="story-heading">A little brighter. <em>A little bolder.</em></h2>
   <p>We're a playful kitchen-and-coffee concept built around colorful food, welcoming spaces, and everyday favorites with personality.</p>
   <p>It's about the little details that turn an ordinary meal into a happy moment.</p>
  </div>
 </div>
</section>"""
STORY_CSS="""
/* Original F04 remains exclusively in the sample checkout confirmation.
   The editorial story has no checkout or reservation behavior. */
#story .brand-story-copy{max-width:570px;min-width:0}
#story .brand-story-copy h2{max-width:620px}
#story .brand-story-copy p{max-width:510px}
"""
def swap(s,a,b,label):
 n=s.count(a)
 assert n==1,(label,n)
 return s.replace(a,b,1)
def build():
 paths=sorted(PARTS.glob('part-*.bin'))
 assert len(paths)>=20
 with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in paths))) as z:
  assert z.testzip() is None
  info={i.filename:i for i in z.infolist()}
  files={i.filename:z.read(i.filename) for i in z.infolist()}
 for name,sha in MASTERS.items():
  assert hashlib.sha256(files[name]).hexdigest()==sha,(name,'master differs')
 html=files['index.html'].decode()
 css=files['assets/zestry-owner-v8.css'].decode()
 # Revert ONLY what V8 changed in the original F04 playback controller.
 html=swap(html,
   "if(name==='f01'||name==='f03'||name==='f04'||name==='f07')loop=false;",
   "if(name==='f01'||name==='f03'||name==='f07')loop=false;",
   'F04 V7 loop controller')
 html=swap(html,
   "if(name==='f01'||name==='f03'||name==='f04')l.addEventListener('complete'",
   "if(name==='f01'||name==='f03')l.addEventListener('complete'",
   'F04 V7 completion controller')
 html=swap(html,
   "['f01','f02-orbit','f02-cooking','f03','f04','f06','f07']",
   "['f01','f02-orbit','f02-cooking','f03','f06','f07']",
   'F04 V7 initialization list')
 # Separate old duplicated reservation-style story, but NO additional F04
 # player or user-facing changes to the approved checkout confirmation.
 html,n=re.subn(r'<section class="section pickup-story" id="story"[\s\S]*?</section>',STORY,html,count=1)
 assert n==1,'V8 inserted story not found'
 html=swap(html,'<a href="#story">Order &amp; Pickup</a>','<a href="#story">Our Story</a>','nav')
 assert html.count('data-animation="f04"')==0,'F04 still embedded in page'
 assert html.count("showConfirm('f04',line)")==1,'checkout F04 lost'
 assert html.count('id="confirm-player"')==1,'original modal confirmation changed'
 assert html.count('data-animation="f07"')==1,'reservation changed'
 old=re.search(r'<clipPath id="zestry-hero-blob" clipPathUnits="objectBoundingBox">\s*<path d="([^"]+)"/>',html)
 assert old,'V8 blob master absent'
 html=swap(html,old.group(1),PATH,'owner green outline')
 # Keep one continuous silhouette, no repeated scallops or new artwork.
 assert html.count(PATH)==1
 css,n=re.subn(r'/\* Replace duplicate booking/lifestyle section with a real F04 order story\. \*/[\s\S]*\Z',STORY_CSS,css,count=1)
 assert n==1,'V8 F04 styling changed'
 assert 'pickup-visual' not in css and 'pickup-story' not in html
 files['index.html']=html.encode()
 files['assets/zestry-owner-v8.css']=css.encode()
 (SRC/'zestry-owner-v8.css').write_text(css,encoding='utf8')
 for name,sha in MASTERS.items():
  assert hashlib.sha256(files[name]).hexdigest()==sha,name
 return paths,files,info
def main():
 p=argparse.ArgumentParser();p.add_argument('--preview-dir');p.add_argument('--pack',action='store_true');args=p.parse_args()
 paths,files,info=build()
 if args.preview_dir:
  dest=Path(args.preview_dir)
  for name,data in files.items():
   path=dest/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
  vendor=ROOT/'assets/vendor/lottie.min.js'
  if vendor.exists():
   q=dest/'assets/vendor/lottie.min.js';q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(vendor.read_bytes())
  print('V9_PREVIEW_READY',dest)
 if args.pack:
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:
   for name,data in files.items():
    if name in info:z.writestr(info[name],data)
    else:z.writestr(name,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  binary=out.getvalue()
  with zipfile.ZipFile(io.BytesIO(binary)) as z:
   assert z.testzip() is None
   for name,sha in MASTERS.items():assert hashlib.sha256(z.read(name)).hexdigest()==sha
  for path in paths:path.unlink()
  for i,x in enumerate(range(0,len(binary),512000)):
   (PARTS/f'part-{i:03d}.bin').write_bytes(binary[x:x+512000])
  print('V9_PACKED',len(binary),len(list(PARTS.glob('part-*.bin'))))
 print('F04_RESTORED_TO_ORIGINAL_CHECKOUT_ONLY','OWNER_ORGANIC_MASK_APPLIED','NO_DEPLOY')
if __name__=='__main__':main()
