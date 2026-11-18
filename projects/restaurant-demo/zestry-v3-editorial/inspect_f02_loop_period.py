#!/usr/bin/env python3
"""Find natural F02 vegetable orbit frame closure without changing original artwork."""
from pathlib import Path
import io,zipfile,json,math
p=Path('projects/restaurant-demo/review_bundle')
with zipfile.ZipFile(io.BytesIO(b''.join(x.read_bytes() for x in sorted(p.glob('part-*.bin'))))) as z:
 a=json.loads(z.read('assets/lottie/f02-orbit.json'))
layers=a['layers']
orbit=[l for l in layers if 72<=l.get('ind',0)<=84]
main=[l for l in layers if 1<=l.get('ind',0)<=22]
print('F02_ORBIT_CLOSURE_AUDIT',len(orbit),'orbital decorations; all 210 frames')
def value(ks,t):
 if not ks:return None
 if ks.get('a')==0:return ks.get('k')
 keys=ks.get('k')
 if not isinstance(keys,list):return None
 if t<=keys[0]['t']:return keys[0]['s']
 for idx,k in enumerate(keys[:-1]):
  nxt=keys[idx+1]
  if k['t']<=t<nxt['t']:
   s=k.get('s',nxt.get('s'))
   en=k.get('e',nxt.get('s'))
   if not isinstance(s,list) or not isinstance(en,list):return None
   f=(t-k['t'])/max(1,nxt['t']-k['t'])
   return [s[i]+(en[i]-s[i])*f for i in range(len(s))]
 return keys[-1].get('s')
def err(l,t,k):
 start=value(l.get('ks',{}).get(k),0)
 end=value(l.get('ks',{}).get(k),t)
 if start is None or end is None:return 0
 if k=='r':return min(abs(start[0]-end[0]-360*i) for i in range(-4,5))
 return math.sqrt(sum((x-y)**2 for x,y in zip(start,end)))
result=[]
for t in range(1,210):
 raw=sum(err(l,t,'p') for l in orbit)/len(orbit)
 leg=sum(err(l,t,'p') for l in main if 7<=l['ind']<=22)/16
 avgrotation=sum(err(l,t,'r') for l in orbit)/len(orbit)
 result.append((t,raw,leg,avgrotation))
for time in [0,30,60,90,120,135,150,165,180,190,195,200,205,208,209]:
 if not time:continue
 row=result[time-1]
 print('ORBIT_SAMPLE',json.dumps({'frame':time,'distanceOrbitAvg':round(row[1],1),'distancePanVegetableAvg':round(row[2],1),'rotationOrbitAvg':round(row[3],1)}))
print('BEST_MATCHES',json.dumps([{'frame':x[0],'decorMismatch':round(x[1],1),'panVegMismatch':round(x[2],1),'rotation':round(x[3],1)} for x in sorted(result,key=lambda z:z[1])[:30]]))
for l in orbit:
 print('DECOR_START_END',json.dumps({'id':l['ind'],'name':l['nm'].split('/')[-1].strip(),'first':value(l['ks'].get('p'),0),'at180':value(l['ks'].get('p'),180),'at209':value(l['ks'].get('p'),209),'endKey':value(l['ks'].get('p'),210)}))
for l in main[:23]:
 print('MAIN_CTRL',json.dumps({'id':l['ind'],'name':l['nm'],'position0':value(l['ks'].get('p'),0),'p209':value(l['ks'].get('p'),209),'rot0':value(l['ks'].get('r'),0),'rot209':value(l['ks'].get('r'),209)}))
