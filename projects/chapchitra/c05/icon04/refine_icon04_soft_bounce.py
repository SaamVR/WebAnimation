#!/usr/bin/env python3
"""Regenerate CHAPCHITRA C05 Icon 04 V3 from preserved V2 JSON.

Changes ONLY ks.p/ks.r in the top shirt; all artwork paths, fills,
middle/bottom shirt transforms and layer structure remain bit-equivalent.
No clipping or masks, no website integration.
"""
import json, math
from pathlib import Path

HERE=Path(__file__).resolve().parent
V2=HERE/'CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V2_DROP_IN.json'
V3=HERE/'CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V3_SOFT_BOUNCE.json'
def clamp(v): return max(0.,min(1.,v))
def out_cubic(t): return 1-(1-clamp(t))**3
def bezier(t,x1,y1,x2,y2):
    t=clamp(t);lo=0.;hi=1.
    for _ in range(18):
        u=(lo+hi)/2
        x=3*(1-u)**2*u*x1+3*(1-u)*u*u*x2+u**3
        if x<t:lo=u
        else:hi=u
    u=(lo+hi)/2
    return 3*(1-u)**2*u*y1+3*(1-u)*u*u*y2+u**3
def pos(frame):
    f=float(frame)
    if f<=16:dy=-360+315*(f/16)**2.18
    elif f<=18:dy=-45+46.5*out_cubic((f-16)/2)
    elif f<=21:dy=1.5-7.5*bezier((f-18)/3,.18,.78,.31,1)
    elif f<=27:dy=-6*(1-bezier((f-21)/6,.18,.68,.30,1))
    else:dy=0
    return [246,round(239+dy,5),0]
def rot(frame):
    return 0 if frame>=18 else round(.65*math.sin(math.pi*frame/18),5)
def keyframes(values):
    records=[]
    for i,v in enumerate(values):
        obj={'t':i,'s':v if isinstance(v,list) else [v]}
        if i<len(values)-1:
            nxt=values[i+1]
            obj.update({'e':nxt if isinstance(nxt,list) else [nxt],
              'i':{'x':.667,'y':.667},'o':{'x':.333,'y':.333}})
        records.append(obj)
    return {'a':1,'k':records}
def main():
    old=json.loads(V2.read_text(encoding='utf8'))
    assert (old['w'],old['h'],old['fr'],old['op'])==(512,512,30,60)
    assert len(old['layers'])==3
    assert 'Tshirt_x5F_top' in old['layers'][0]['nm']
    assert old['layers'][0]['ks']['p']['k'][0]['s']==[246,-121,0]
    assert old['layers'][0]['ks']['p']['k'][-1]['s']==[246,239,0]
    before=json.dumps(old,sort_keys=True,separators=(',',':'))
    old['layers'][0]['ks']['p']=keyframes([pos(f) for f in range(60)])
    old['layers'][0]['ks']['r']=keyframes([rot(f) for f in range(60)])
    assert old['layers'][0]['ks']['p']['k'][21]['s']==[246,233,0] 
    assert old['layers'][0]['ks']['p']['k'][-1]['s']==[246,239,0]
    V3.write_text(json.dumps(old,separators=(',',':')),encoding='utf8')
    print('V3 generated. Changes limited to top shirt p/r.')
    print('0.60s drop; one 6px rebound in 0.10s; 0.20s settle; 30fps, 60f.')
if __name__=='__main__':main()
