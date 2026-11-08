#!/usr/bin/env python3
"""C08: derive a light-only vector palette; original JSON and all animation keyframes remain immutable."""
from __future__ import annotations
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
ORIGINAL=ROOT/'src/assets/c08/wordmark-reprint-original.json'
OUTPUT=ROOT/'src/assets/c08/wordmark-reprint-hero-light.json'
HASH='e3887a7187f845099a4948c3a8a3ff2b85dc650b381635cc6db5e3aa68d33876'
# The hero background is Deep Forest. Per the owner, the wordmark uses Cream #E4E3DE.
# Green roller/dot details use the light-approved #9DC39F from the EXISTING hero PNG,
# not the dark source #293D2D, so details remain legible on dark Deep Forest.
MAP={
 (0.1373,0.1373,0.1373): (228/255,227/255,222/255),
 (0.1608,0.2392,0.1765): (157/255,195/255,159/255)
}
src=ORIGINAL.read_bytes()
assert hashlib.sha256(src).hexdigest()==HASH,'The approved original C08 JSON was modified'
dark=json.loads(src)
assert (dark['w'],dark['h'],dark['fr'],dark['ip'],dark['op'])==(2400,550,60,0,240)
assert len(dark['layers'])==6 and not dark.get('assets')
hero=json.loads(src)
swatches={}
def recolor(obj):
 if isinstance(obj,dict):
  if obj.get('ty')=='fl':
   spec=obj.get('c',{})
   if spec.get('a')==0 and isinstance(spec.get('k'),list):
    old=tuple(spec['k'])
    if old in MAP:
     spec['k']=list(MAP[old])
     swatches[old]=swatches.get(old,0)+1
    elif old!=(0.9647,0.9686,0.9608):
     raise ValueError('Unreviewed C08 source fill: '+str(old))
  for x in obj.values():recolor(x)
 elif isinstance(obj,list):
  for x in obj:recolor(x)
recolor(hero)
assert swatches.get((0.1373,0.1373,0.1373),0)>=4
assert swatches.get((0.1608,0.2392,0.1765),0)>=2
# Verify deep equality after removing only the approved fill changes.
round_trip=json.loads(json.dumps(hero))
def reverse(obj):
 if isinstance(obj,dict):
  if obj.get('ty')=='fl':
   spec=obj.get('c',{})
   if spec.get('a')==0 and isinstance(spec.get('k'),list):
    for k,v in MAP.items():
     if spec['k']==list(v):spec['k']=list(k)
  for x in obj.values():reverse(x)
 elif isinstance(obj,list):
  for x in obj:reverse(x)
reverse(round_trip)
assert round_trip==dark,'A non-palette property or keyframe changed'
OUTPUT.write_text(json.dumps(hero,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf-8')
print('C08 hero palette mapped safely',swatches,'original SHA',HASH,
      'hero output bytes',OUTPUT.stat().st_size,
      'hero SHA',hashlib.sha256(OUTPUT.read_bytes()).hexdigest())
