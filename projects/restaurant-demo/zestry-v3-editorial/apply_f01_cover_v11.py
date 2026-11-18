#!/usr/bin/env python3
"""ZESTRY V11: F01 SVG cover in a circular host, original JSON unchanged.

Only the F01 Lottie SVG renderer's preserveAspectRatio changes from
xMidYMid meet to xMidYMid slice; all other animation renderers retain meet.
The approved original composition and timing are never altered.
"""
from pathlib import Path
import argparse,hashlib,io,zipfile

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
PARTS=ROOT/'review_bundle'
ANIMATIONS={
 'assets/lottie/f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
 'assets/lottie/f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
 'assets/lottie/f04.json':'e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0',
 'assets/lottie/f07.json':'a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b',
 'assets/f05_book.lottie':'3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645'
}
OLD="rendererSettings:{preserveAspectRatio:'xMidYMid meet'}"
NEW="rendererSettings:{preserveAspectRatio:name==='f01'?'xMidYMid slice':'xMidYMid meet'}"
def digest(b):return hashlib.sha256(b).hexdigest()
def build():
 parts=sorted(PARTS.glob('part-*.bin'))
 assert len(parts)>20,'Expected V10 approved ZIP fragments'
 with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in parts))) as z:
  assert z.testzip() is None
  meta={x.filename:x for x in z.infolist()}
  fs={x.filename:z.read(x.filename) for x in z.infolist()}
 for name,sha in ANIMATIONS.items():assert digest(fs[name])==sha,name
 h=fs['index.html'].decode('utf8')
 assert h.count(OLD)==1,('Expected original rendererSetting once',h.count(OLD))
 assert h.count('data-animation="f01"')==1
 assert h.count('data-animation="f04"')==0
 assert h.count("showConfirm('f04',line)")==1
 css=fs['assets/zestry-owner-v8.css'].decode('utf8')
 assert 'aspect-ratio:1 / 1!important' in css and 'border-radius:50%!important' in css
 assert 'clip-path:none!important' in css and 'zestry-hero-blob' not in h
 h=h.replace(OLD,NEW,1)
 fs['index.html']=h.encode('utf8')
 for name,sha in ANIMATIONS.items():assert digest(fs[name])==sha
 return parts,fs,meta
def main():
 p=argparse.ArgumentParser()
 p.add_argument('--preview-dir')
 p.add_argument('--pack',action='store_true')
 a=p.parse_args()
 parts,fs,meta=build()
 if a.preview_dir:
  out=Path(a.preview_dir)
  for n,b in fs.items():
   dest=out/n
   dest.parent.mkdir(parents=True,exist_ok=True)
   dest.write_bytes(b)
  vendor=ROOT/'assets/vendor/lottie.min.js'
  if vendor.is_file():
   d=out/'assets/vendor/lottie.min.js';d.parent.mkdir(parents=True,exist_ok=True);d.write_bytes(vendor.read_bytes())
  print('F01_COVER_PREVIEW_READY',out)
 if a.pack:
  b=io.BytesIO()
  with zipfile.ZipFile(b,'w') as z:
   for n,data in fs.items():
    if n in meta:z.writestr(meta[n],data)
    else:z.writestr(n,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  blob=b.getvalue()
  with zipfile.ZipFile(io.BytesIO(blob)) as z:
   assert z.testzip() is None
   for n,sha in ANIMATIONS.items():assert digest(z.read(n))==sha
   h=z.read('index.html').decode()
   assert h.count(NEW)==1 and OLD not in h
   assert 'data-animation="f04"' not in h
  for f in parts:f.unlink()
  for k,offset in enumerate(range(0,len(blob),512000)):
   (PARTS/f'part-{k:03d}.bin').write_bytes(blob[offset:offset+512000])
  print('REVIEW_BUNDLE_REPACKAGED',len(blob),len(list(PARTS.glob('part-*.bin'))))
 print('V11_RENDERER_COVER_F01_ONLY','F04_CHECKOUT_ONLY','MASTERS_UNCHANGED','NO_DEPLOY')
if __name__=='__main__':main()
