#!/usr/bin/env python3
"""ZESTRY F05 inline interactive book, without Render deployment."""
import io,zipfile,re,hashlib,subprocess,sys
from pathlib import Path
from f05_sixteen_pages import upgrade_book, upgrade_index, install_photos, validate_menu
P=Path(__file__).resolve().parent.parent
HERE=Path(__file__).resolve().parent
PARTS=P/"review_bundle"
REVIEW="e9f3d80b6fd815da18dfcd2b9910a5d92dc56374"
F05_BUNDLE_SHA="3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645"
BOOK="""<section class="section f05-section" id="menu" aria-labelledby="menu-heading">
 <div class="wrap"><h2 class="sr-only" id="menu-heading">Explore the ZESTRY menu book</h2>
 <div class="f05-viewport"><iframe id="f05-book-frame" title="Interactive illustrated restaurant menu book, four categories" src="assets/f05_interactive.html" loading="lazy" allow="none"></iframe></div>
 <div class="legacy-menu-internals" hidden aria-hidden="true"><div id="tabs"></div><input id="search" type="search" value="" /><div id="cards"></div></div>
 </div></section>"""
MESSAGE="""window.addEventListener('message',e=>{const book=$('#f05-book-frame');if(!book||e.source!==book.contentWindow||e.origin!==location.origin||e.data?.type!=='zestry:book-add')return;const id=Number(e.data.itemId);if(!Number.isInteger(id)||!items.some(x=>x.id===id))return;cart[id]=Math.min(99,(cart[id]||0)+1);save();renderCart();$('#bag-status').textContent='Added to your demo bag';});"""

def patch(s):
 start=s.index('<section class="section" id="menu">')
 stop=s.index('<section class="section chef-story',start)
 s=s[:start]+BOOK+s[stop:]
 s=s.replace("const PHOTO='https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/';","const PHOTO='assets/photos/';")
 s=s.replace('https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/','assets/photos/')
 assert s.count("function menuF05()")==1
 begin=s.index("function menuF05(){")
 end=s.index("$('#search').addEventListener",begin)
 s=s[:begin]+s[end:]
 needle="$('#f05-open').addEventListener('click',menuF05);"
 assert s.count(needle)==1
 s=s.replace(needle,"",1)
 needle="$('#search').addEventListener('input',renderMenu);"
 assert s.count(needle)==1
 s=s.replace(needle,MESSAGE+needle,1)
 needle='</head>'
 assert s.count(needle)==1
 s=s.replace(needle,'<link rel="stylesheet" href="assets/f05_menu_integration.css"/></head>')
 assert 'data-animation="f01"' in s
 assert s.count('id="menu"')==1
 assert 'id="f05-book-frame"' in s
 assert 'F05 · Interactive illustrated menu' not in s
 assert s.count("play(name,c,name!=='f06')")==1
 return s

def make_preview(dest):
 b=b''.join(p.read_bytes() for p in sorted(PARTS.glob('part-*.bin')))
 with zipfile.ZipFile(io.BytesIO(b)) as z:
  infos={i.filename:i for i in z.infolist()}
  fs={i.filename:z.read(i.filename) for i in z.infolist()}
 if b'LOCAL QA' in fs['assets/f05_interactive.html']:
  import tempfile
  with tempfile.TemporaryDirectory() as temp:
   work=Path(temp)
   original=work/'f05_qa.html'
   original.write_bytes(fs['assets/f05_interactive.html'])
   subprocess.run([sys.executable,str(HERE/'build_f05_book.py'),str(original),str(work/'book')],check=True)
   html=(work/'book/f05_book.html').read_text()
   raw=(work/'book/f05_book.lottie').read_bytes()
 else:
  assert b'Interactive Menu Book' in fs['assets/f05_interactive.html']
  html=fs['assets/f05_interactive.html'].decode()
  raw=fs['assets/f05_book.lottie']
 assert hashlib.sha256(raw).hexdigest()==F05_BUNDLE_SHA
 old_idle="function frameLoop(now){if(anim){const state=states.get(cur),duration=anim.op-1;"
 new_idle="function frameLoop(now){if(anim){const state=states.get(cur),duration=anim.op-1;if(state.loop&&state.animation.startsWith('hold_')){auto=false;return;}"
 if new_idle not in html:
  assert html.count(old_idle)==1
  html=html.replace(old_idle,new_idle,1)
 oldtop='.surface{position:absolute;left:-22.5%;top:-26.7%;width:145%;aspect-ratio:3/2}'
 newtop='.surface{position:absolute;left:-22.5%;top:-21.5%;width:145%;aspect-ratio:3/2}'
 if oldtop in html:html=html.replace(oldtop,newtop,1)
 assert newtop in html
 validate_menu()
 html=upgrade_book(html)
 fs['assets/f05_interactive.html']=html.encode()
 fs['assets/f05_book.lottie']=raw
 fs['assets/f05_menu_integration.css']=(HERE/'f05_menu_integration.css').read_bytes()
 fs['index.html']=(fs['index.html'] if b'id="f05-book-frame"' in fs['index.html'] else patch(fs['index.html'].decode()).encode())
 fs['index.html']=upgrade_index(fs['index.html'])
 for f in (P/'assets/photos').glob('*.jpg'):
  fs['assets/photos/'+f.name]=f.read_bytes()
 install_photos(fs)
 for name in ['pancakes','toast','salad','pasta','burger','cake','coffee','lemonade']:
  assert fs.get('assets/photos/'+name+'.jpg') is not None,name
 assert not any("f08" in f.lower() for f in fs)
 if dest:
  dest.mkdir(parents=True,exist_ok=True)
  for n,content in fs.items():
   file=dest/n;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(content)
  vendor=dest/'assets/vendor/lottie.min.js'
  vendor.parent.mkdir(parents=True,exist_ok=True)
  vendor.write_bytes((P/'assets/vendor/lottie.min.js').read_bytes())
  print('preview written',dest)
 return fs,infos

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser()
 parser.add_argument('--preview-dir')
 parser.add_argument('--pack',action='store_true')
 args=parser.parse_args()
 fs,infos=make_preview(Path(args.preview_dir) if args.preview_dir else None)
 if args.pack:
  out=io.BytesIO()
  with zipfile.ZipFile(out,'w') as z:
   for n,data in fs.items():
    if n in infos:z.writestr(infos[n],data)
    else:z.writestr(n,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
  b=out.getvalue()
  with zipfile.ZipFile(io.BytesIO(b)) as z:
   assert z.testzip() is None
   assert z.read('assets/f05_book.lottie')==fs['assets/f05_book.lottie']
  prior=list(PARTS.glob('part-*.bin'))
  for p in prior:p.unlink()
  for i,offset in enumerate(range(0,len(b),512000)):
   (PARTS/('part-%03d.bin'%i)).write_bytes(b[offset:offset+512000])
  print('packaged',len(b),'bytes in',len(list(PARTS.glob('part-*.bin'))),'parts')
 print('F05 archived SHA',F05_BUNDLE_SHA,'assets',len(fs))
