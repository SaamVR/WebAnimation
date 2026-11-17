#!/usr/bin/env python3
"""ZESTRY V10: remove organic SVG clipping, use a real 1:1 circular hero."""
from pathlib import Path
import argparse,hashlib,io,re,zipfile
P=Path(__file__).resolve().parent.parent
D=Path(__file__).resolve().parent
B=P/'review_bundle'
EXPECTED={
'assets/lottie/f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
'assets/lottie/f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
'assets/lottie/f04.json':'e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0',
'assets/lottie/f07.json':'a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b',
'assets/f05_book.lottie':'3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645'}
CSS='''/* V10 OWNER APPROVED: true circular hero, 1:1 visual frame, no SVG clip mask. */
.hero .hero-image.hero-visual{
 position:relative!important;box-sizing:border-box!important;
 width:min(100%,485px)!important;max-width:485px!important;
 aspect-ratio:1 / 1!important;height:auto!important;min-height:0!important;
 margin:20px auto!important;padding:0!important;
 border-radius:50%!important;clip-path:none!important;
 -webkit-clip-path:none!important;overflow:hidden!important;
 background:#ffd24b!important;box-shadow:none!important
}
.hero .hero-image.hero-visual::before,
.hero .hero-image.hero-visual::after{display:none!important}
.hero .hero-image.hero-visual .hero-pasta.hero-clip{
 position:absolute!important;inset:0!important;
 width:100%!important;height:100%!important
}
@media(max-width:680px){
 .hero .hero-image.hero-visual{
   width:min(100%,380px)!important;max-width:380px!important;
   margin:6px auto 22px!important
 }
}
@media(max-width:390px){
 .hero .hero-image.hero-visual{
   width:min(100%,330px)!important;max-width:330px!important
 }
}

'''
def digest(x):return hashlib.sha256(x).hexdigest()
def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--preview-dir')
 parser.add_argument('--pack',action='store_true')
 a=parser.parse_args()
 parts=sorted(B.glob('part-*.bin'))
 assert len(parts)>=20,'Missing approved review archive'
 with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in parts))) as z:
  assert z.testzip() is None
  files={i.filename:z.read(i.filename) for i in z.infolist()}
  infos={i.filename:i for i in z.infolist()}
 for n,sha in EXPECTED.items():assert digest(files[n])==sha,n
 h=files['index.html'].decode()
 css=files['assets/zestry-owner-v8.css'].decode()
 h,num=re.subn(r'<svg class="hero-svg-def"[\s\S]*?</svg>','',h,count=1)
 assert num==1,'V9 organic SVG definition must occur exactly once'
 old='Original animated pasta bowl within an organic yellow clipping shape'
 assert h.count(old)==1
 h=h.replace(old,'Original pasta bowl animation within a circular yellow hero visual',1)
 left=css.index('/* Organic, intentionally asymmetrical ink-and-paper silhouette, not ellipse. */')
 right=css.index('/* Original F04 remains exclusively in the sample checkout confirmation.',left)
 css=css[:left]+CSS+css[right:]
 assert 'zestry-hero-blob' not in h and 'zestry-hero-blob' not in css
 assert 'clip-path:url(' not in css
 assert h.count('data-animation="f04"')==0
 assert h.count("showConfirm('f04',line)")==1
 assert h.count('data-animation="f01"')==1
 assert h.count('data-animation="f07"')==1
 files['index.html']=h.encode()
 files['assets/zestry-owner-v8.css']=css.encode()
 (D/'zestry-owner-v8.css').write_text(css,encoding='utf8')
 for n,sha in EXPECTED.items():assert digest(files[n])==sha,n
 if a.preview_dir:
  out=Path(a.preview_dir)
  for n,blob in files.items():
   f=out/n;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(blob)
  vendor=P/'assets/vendor/lottie.min.js'
  if vendor.exists():
   f=out/'assets/vendor/lottie.min.js';f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes(vendor.read_bytes())
  print('REVIEW_PREVIEW',out)
 if a.pack:
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:
   for n,blob in files.items():
    if n in infos:z.writestr(infos[n],blob)
    else:z.writestr(n,blob,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  blob=out.getvalue()
  with zipfile.ZipFile(io.BytesIO(blob)) as z:
   assert z.testzip() is None
   for n,sha in EXPECTED.items():assert digest(z.read(n))==sha
  for f in parts:f.unlink()
  for i,start in enumerate(range(0,len(blob),512000)):
   (B/f'part-{i:03d}.bin').write_bytes(blob[start:start+512000])
  print('REVIEW_BUNDLE_PACKED',len(blob),len(list(B.glob('part-*.bin'))))
 print('TRUE_CIRCLE_READY_F04_UNCHANGED_NO_DEPLOY')
if __name__=='__main__':main()
