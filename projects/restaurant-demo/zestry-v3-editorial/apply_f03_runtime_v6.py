#!/usr/bin/env python3
"""V6 F03 Lottie-web null-parent-opacity runtime compatibility patch.
The owner-approved master .json files are immutable and hash-verified.
"""
import argparse,hashlib,io,zipfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
P=HERE.parent
PARTS=P/'review_bundle'
F01_SHA='7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37'
F03_SHA='136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68'
ORIGINAL="if(name==='f01'){const broth=v.layers.find(x=>x.ind===28&&x.nm.startsWith('Broth /'));if(!broth||!broth.masksProperties)throw new Error('Approved F01 broth layer missing');broth.hasMask=true;}if(!container.isConnected)return;"
REVISED="""if(name==='f01'){const broth=v.layers.find(x=>x.ind===28&&x.nm.startsWith('Broth /'));if(!broth||!broth.masksProperties)throw new Error('Approved F01 broth layer missing');broth.hasMask=true;}if(name==='f03'){const machine=v.layers.find(x=>x.ind===2&&x.nm.startsWith('Machine_Fade_Controller'));const parts=v.layers.filter(x=>x.parent===2&&x.ind>=15&&x.ind<=27);if(!machine||!machine.ks?.o?.k||parts.length!==13||parts.some(x=>x.ks?.o?.a!==0||x.ks.o.k!==100))throw new Error('Approved F03 machine fade hierarchy mismatch');for(const part of parts){part.ks.o=JSON.parse(JSON.stringify(machine.ks.o));}}if(!container.isConnected)return;"""

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--pack',action='store_true')
 parser.add_argument('--preview-dir')
 args=parser.parse_args()
 paths=sorted(PARTS.glob('part-*.bin'))
 assert len(paths)==11,"Missing existing 11-part owner review archive"
 with zipfile.ZipFile(io.BytesIO(b''.join(p.read_bytes() for p in paths))) as z:
  assert z.testzip() is None
  infos={i.filename:i for i in z.infolist()}
  files={i.filename:z.read(i.filename) for i in z.infolist()}
 assert hashlib.sha256(files['assets/lottie/f01.json']).hexdigest()==F01_SHA
 assert hashlib.sha256(files['assets/lottie/f03.json']).hexdigest()==F03_SHA
 html=files['index.html'].decode('utf-8')
 assert html.count(ORIGINAL)==1,(html.count(ORIGINAL),"missing V5 runtime hook")
 assert "if(name==='f01'||name==='f03'||name==='f07')loop=false;" in html
 html=html.replace(ORIGINAL,REVISED,1)
 assert "machine=v.layers.find" in html
 assert 'feedback-v5.css' in html
 files['index.html']=html.encode()
 qa=(HERE/'F03_RUNTIME_COMPAT_QA.md')
 files['F03_RUNTIME_COMPAT_QA.md']=qa.read_bytes()
 if args.preview_dir:
  out=Path(args.preview_dir)
  for name,data in files.items():
   dst=out/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data)
  for f in (P/'assets/photos').glob('*.jpg'):
   dst=out/'assets/photos'/f.name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(f.read_bytes())
  runtime=out/'assets/vendor/lottie.min.js';runtime.parent.mkdir(parents=True,exist_ok=True);runtime.write_bytes((P/'assets/vendor/lottie.min.js').read_bytes())
  print('PREVIEW',out)
 if args.pack:
  output=io.BytesIO()
  with zipfile.ZipFile(output,'w') as z:
   for name,data in files.items():
    if name in infos:z.writestr(infos[name],data)
    else:z.writestr(name,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  blob=output.getvalue()
  with zipfile.ZipFile(io.BytesIO(blob)) as z:
   assert z.testzip() is None
   assert hashlib.sha256(z.read('assets/lottie/f03.json')).hexdigest()==F03_SHA
   assert hashlib.sha256(z.read('assets/lottie/f01.json')).hexdigest()==F01_SHA
  for p in paths:p.unlink()
  for i,k in enumerate(range(0,len(blob),512000)):
   (PARTS/f'part-{i:03d}.bin').write_bytes(blob[k:k+512000])
  assert len(list(PARTS.glob('part-*.bin')))==11
  print('PACKAGED',len(blob),'bytes, unchanged original animation JSON hashes')
 print('F03_SHA',F03_SHA)
 print('F01_SHA',F01_SHA)

if __name__=='__main__':main()
