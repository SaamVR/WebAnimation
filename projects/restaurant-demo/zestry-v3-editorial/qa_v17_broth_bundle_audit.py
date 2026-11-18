#!/usr/bin/env python3
from __future__ import annotations
import io,zipfile,json,hashlib
from pathlib import Path
root=Path('projects/restaurant-demo')
parts=sorted((root/'review_bundle').glob('part-*.bin'))
data=b''.join(p.read_bytes() for p in parts)
with zipfile.ZipFile(io.BytesIO(data)) as z:
  assert z.testzip() is None
  raw=z.read('assets/lottie/f01-v16.json')
  original=z.read('assets/lottie/f01.json')
  html=z.read('index.html').decode()
a=json.loads(raw);source=json.loads(original)
broth=[l for l in a['layers'] if l['ind']==28 or 'Broth' in l['nm']]
print('F01_ASSET_SHA',hashlib.sha256(raw).hexdigest(),flush=True)
print('ORIGINAL_SHA',hashlib.sha256(original).hexdigest(),flush=True)
print('BROTH_LAYER_COUNT',len(broth))
for l in broth:
 print('BROTH_LAYER',json.dumps({
  k:l.get(k) for k in ['ind','nm','ty','ip','op','st','hasMask','td','tt','parent']
 },default=str),flush=True)
 print('BROTH_KS',json.dumps(l.get('ks',{}),default=str)[:12000],flush=True)
 for m in l.get('masksProperties',[]):
  print('BROTH_MASK',json.dumps({
   k:m.get(k) for k in ['nm','mode','inv','o','x']
  },default=str)[:4000],flush=True)
  pt=m.get('pt',{})
  if pt.get('a')==1:
   print('BROTH_MASK_KEYS',json.dumps([
    {'t':x.get('t'),'count':len((x.get('s') or [{}])[0].get('v',[])),
     'xRange':[min(v[0] for v in (x.get('s') or [{}])[0].get('v',[[0,0]])),
               max(v[0] for v in (x.get('s') or [{}])[0].get('v',[[0,0]]))],
     'yRange':[min(v[1] for v in (x.get('s') or [{}])[0].get('v',[[0,0]])),
               max(v[1] for v in (x.get('s') or [{}])[0].get('v',[[0,0]]))]} for x in pt.get('k',[])],default=str),flush=True)
  else:print('BROTH_STATIC_MASK_SHAPE',json.dumps(pt,default=str)[:4000],flush=True)
print('RUNTIME_COMPAT',json.dumps({
 'hasMaskMutation':"broth.hasMask=true" in html,
 'sources':len(a.get('assets',[])),
 'canvasName':'f01-v16' if "name==='f01'?'f01-v16':name" in html else 'other',
 'woodBackgroundCloning':"defs.cloneNode(true)" in html,
 'noSubframe':"setSubframe(false)" in html,
 'brothRenderGuard':"broth.masksProperties" in html,
},default=str),flush=True)
