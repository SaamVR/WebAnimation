#!/usr/bin/env python3
"""ZESTRY V5 owner revisions. Preserve the approved F01 master byte-for-byte."""
from pathlib import Path
import argparse,hashlib,io,re,shutil,zipfile
D=Path(__file__).resolve().parent
P=D.parent
PARTS=P/"review_bundle"
F01="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
F03="136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68"
def exact(html,old,new,label):
 assert html.count(old)==1,(label,html.count(old))
 return html.replace(old,new,1)
def remove(html,regex,label):
 n=re.subn(regex,"",html,count=1,flags=re.S)
 assert n[1]==1,label
 return n[0]
def patch(html):
 html=remove(html,r'\s*<div class="hero-photo"><img[^>]*></div>',"photo in hero")
 html=remove(html,r'\s*<div class="hero-art-note"[^>]*>.*?</div>',"decorative note")
 html=exact(html,'<div class="hero-pasta"><div class="anim" data-animation="f01"',
           '<div class="hero-pasta hero-clip"><div class="anim" data-animation="f01"',"hero clip")
 html=exact(html,'aria-label="Fresh pasta photography and illustrated pasta in motion"',
           'aria-label="Original animated pasta bowl within an organic yellow clipping shape"',"hero label")
 html=remove(html,r'\s*<div class="coffee-photo"><img[^>]*></div>',"real coffee image")
 html=exact(html,"async function play(name,container,loop=false){if(name==='f03'||name==='f07')loop=false;",
           "async function play(name,container,loop=false){if(name==='f01'||name==='f03'||name==='f07')loop=false;",
           "F01 one shot")
 html=exact(html,"let v=await response.json();if(!container.isConnected)return;",
           "let v=await response.json();if(name==='f01'){const broth=v.layers.find(x=>x.ind===28&&x.nm.startsWith('Broth /'));if(!broth||!broth.masksProperties)throw new Error('Approved F01 broth layer missing');broth.hasMask=true;}if(!container.isConnected)return;",
           "F01 Lottie-web mask compatibility")
 html=exact(html,"if(name==='f03')l.addEventListener('complete',()=>{container.dataset.motionComplete='true';l.goToAndStop(Math.max(0,v.op-1),true)});",
           "if(name==='f01'||name==='f03')l.addEventListener('complete',()=>{container.dataset.motionComplete='true';l.goToAndStop(Math.max(0,v.op-1),true)});",
           "F01 final frame hold")
 html=exact(html,'</head>','<link rel="stylesheet" href="assets/feedback-v5.css"/></head>',"V5 css")
 for x in ('f01','f03','f02-orbit','f02-cooking','f06','f07'):
  assert html.count('data-animation="'+x+'"')==1,(x,"bad number of stages")
 assert 'hero-photo' not in html.split('</header>')[1].split('</section>')[0]
 assert 'coffee-photo' not in html.split('id="coffee"')[1].split('</section>')[0]
 assert "play(name,c,name!=='f06')" in html,"Existing Render build must continue to work"
 assert 'f08' not in html.lower()
 return html
def main():
 a=argparse.ArgumentParser()
 a.add_argument('--preview-dir');a.add_argument('--pack',action='store_true')
 args=a.parse_args()
 parts=sorted(PARTS.glob('part-*.bin'))
 assert len(parts)==11,(len(parts),"Expected 11 master archive parts")
 with zipfile.ZipFile(io.BytesIO(b''.join(p.read_bytes() for p in parts))) as z:
  infos={i.filename:i for i in z.infolist()}
  files={i.filename:z.read(i.filename) for i in z.infolist()}
 assert hashlib.sha256(files['assets/lottie/f01.json']).hexdigest()==F01
 assert hashlib.sha256(files['assets/lottie/f03.json']).hexdigest()==F03
 files['index.html']=patch(files['index.html'].decode()).encode()
 files['assets/feedback-v5.css']=(D/'feedback-v5.css').read_bytes()
 files['QA_OWNER_FEEDBACK_V5.md']=(D/'OWNER_FEEDBACK_QA.md').read_bytes()
 assert hashlib.sha256(files['assets/lottie/f01.json']).hexdigest()==F01
 if args.preview_dir:
  root=Path(args.preview_dir);root.mkdir(parents=True,exist_ok=True)
  for name,b in files.items():
   p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
  for photo in (P/'assets/photos').glob('*.jpg'):
   dest=root/'assets/photos'/photo.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(photo,dest)
  dest=root/'assets/vendor/lottie.min.js';dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(P/'assets/vendor/lottie.min.js',dest)
  print('PREVIEW',root)
 if args.pack:
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:
   for name,b in files.items():
    if name in infos:z.writestr(infos[name],b)
    else:z.writestr(name,b,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  blob=out.getvalue()
  with zipfile.ZipFile(io.BytesIO(blob)) as z:
   assert z.testzip() is None
   assert hashlib.sha256(z.read('assets/lottie/f01.json')).hexdigest()==F01
  for p in parts:p.unlink()
  for i,k in enumerate(range(0,len(blob),512000)):
   (PARTS/f'part-{i:03d}.bin').write_bytes(blob[k:k+512000])
  assert len(list(PARTS.glob('part-*.bin')))==11
  print('PACKED',len(blob),len(list(PARTS.glob('part-*.bin'))))
 print('F01_V4_APPROVED_SHA',F01)
 print('F03_V2_APPROVED_SHA',F03)
if __name__=='__main__':main()
