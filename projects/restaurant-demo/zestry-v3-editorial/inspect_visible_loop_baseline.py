#!/usr/bin/env python3
"""Read-only audit of actual bundled ZESTRY HTML and approved F02 orbit JSON."""
from pathlib import Path
import io,zipfile,json,re,hashlib
P=Path('projects/restaurant-demo')
raw=b''.join(x.read_bytes() for x in sorted((P/'review_bundle').glob('part-*.bin')))
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 assert z.testzip() is None
 data={x:z.read(x) for x in z.namelist()}
print('ZIP_FILE_COUNT',len(data))
print('ANIMATION_ASSETS',json.dumps([{'name':k,'bytes':len(v),'sha':hashlib.sha256(v).hexdigest()} for k,v in data.items() if 'lottie/' in k and k.endswith('.json')],sort_keys=True))
html=data['index.html'].decode()
for needle in ['function play(', 'async function play(', 'IntersectionObserver', 'play(name,c', 'function mountF01WoodBackdrop','function mountF01V16FixedSize','function initDeferredMenuBook','renderMenu();renderCart();','const animations=', 'const names=', 'data-animation=', 'const observers=','const ob=','const io=','confirm-player','lottie.destroy','data-motion-complete']:
 idx=html.find(needle)
 print('HTML_CONTEXT',json.dumps({'needle':needle,'at':idx,'snippet':html[max(0,idx-700):idx+2500] if idx>=0 else None}))
print('ALL_DATA_ANIMS',re.findall(r'data-animation="([^"]+)"',html))
for k in data:
 if not k.endswith('.json') or 'lottie/' not in k:continue
 try: a=json.loads(data[k])
 except Exception:continue
 if k.endswith('f02-orbit.json') or 'f02' in k:
  print('F02_COMPOSITION',json.dumps({'asset':k,'frames':a.get('op'),'start':a.get('ip'),'fps':a.get('fr'),'bounds':[a.get('w'),a.get('h')], 'layers':len(a.get('layers',[]))}))
  for l in a.get('layers',[]):
   x={'ind':l.get('ind'),'nm':l.get('nm'),'ty':l.get('ty'),'ip':l.get('ip'),'op':l.get('op'),'parent':l.get('parent'),'ks':{}}
   for tag in ['p','r','s','o','a']:
    t=l.get('ks',{}).get(tag)
    if t is None:continue
    kf=t.get('k');x['ks'][tag]={'animated':t.get('a'), 'count':len(kf) if isinstance(kf,list) and t.get('a') else 1}
    if t.get('a') and isinstance(kf,list):
     x['ks'][tag]['first']=[{'t':k.get('t'),'s':k.get('s'),'e':k.get('e')} for k in kf[:2]]
     x['ks'][tag]['last']=[{'t':k.get('t'),'s':k.get('s'),'e':k.get('e')} for k in kf[-2:]]
    elif tag in ('p','r','s'):x['ks'][tag]['constant']=kf
   print('F02_LAYER',json.dumps(x,default=str)[:2400])
print('F05_INIT_MARKER',json.dumps({'loop': 'ZESTRY_PERF_V17_MENU_LOOP' in data.get('assets/f05_book.html',b'').decode(), 'hasWindowMessage':'zestry:book-visibility' in data.get('assets/f05_book.html',b'').decode()}))
