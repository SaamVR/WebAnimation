#!/usr/bin/env python3
"""ZESTRY: enable forward Lottie replay only while its section is visible.

Patches ONLY index.html inside the existing review bundle. F01/F02 owner
Lottie sources, other JSON, interactive F05, assets and unrelated sites remain
byte-identical. Does not deploy or alter Render/GitHub workflow settings.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/"review_bundle"
MARK="ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119"
IMMUTABLE={
 "assets/lottie/f01.json":"7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
 "assets/lottie/f02-chef-full360.json":"e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa",
 "assets/lottie/f03.json":"136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68",
}
JS=r"""/* ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119
 * Native, forward-only animation repetition while the actual illustration
 * is visible. Stop work offscreen, in background tabs, and for reduced motion.
 * No automatic F05 page turning or new animation content.
 */
const zestryMotionReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const zestryMotionTracks=new Set();
function zestryMotionSync(t){
 if(!t.container.isConnected){
  t.observer?.disconnect();zestryMotionTracks.delete(t);return
 }
 const modalOpen=!t.modal||t.modal.classList.contains('active');
 const active=t.inView&&!document.hidden&&!zestryMotionReduced.matches&&modalOpen;
 t.container.dataset.motionInView=String(active);
 if(active){if(t.animation.isPaused)t.animation.play()}
 else if(!t.animation.isPaused)t.animation.pause();
}
function zestryMotionAttach(animation,container){
 animation.loop=true;
 const modal=container.closest('#modal'),root=modal||container;
 const isVisible=()=>{
  const r=root.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&
         r.right>0&&r.left<innerWidth;
 };
 const t={animation,container,root,modal,inView:isVisible(),observer:null};
 zestryMotionTracks.add(t);
 container.dataset.motionLoops='0';
 container.dataset.motionPolicy='visible-forward-repeat';
 animation.addEventListener('loopComplete',()=>{
  container.dataset.motionLoops=String(1+Number(container.dataset.motionLoops||0));
 });
 if(zestryMotionReduced.matches)animation.goToAndStop(0,true);
 zestryMotionSync(t);
 if('IntersectionObserver' in window){
  t.observer=new IntersectionObserver(entries=>{
   t.inView=entries.some(e=>e.isIntersecting&&e.intersectionRatio>0);
   zestryMotionSync(t);
  },{threshold:[0,.01,.1]});
  t.observer.observe(root);
 }else{
  const sync=()=>{t.inView=isVisible();zestryMotionSync(t)};
  addEventListener('scroll',sync,{passive:true});
  addEventListener('resize',sync,{passive:true});
 }
 if(modal){
  new MutationObserver(()=>zestryMotionSync(t)).observe(modal,{
   attributes:true,attributeFilter:['class','style','aria-hidden']
  });
 }
}
function zestryMotionSyncAll(){for(const t of zestryMotionTracks)zestryMotionSync(t)}
document.addEventListener('visibilitychange',zestryMotionSyncAll);
addEventListener('pageshow',zestryMotionSyncAll);
addEventListener('pagehide',()=>{for(const t of zestryMotionTracks)t.animation.pause()});
if(zestryMotionReduced.addEventListener){
 zestryMotionReduced.addEventListener('change',()=>{
  for(const t of zestryMotionTracks){
   if(zestryMotionReduced.matches)t.animation.goToAndStop(0,true);
   zestryMotionSync(t);
  }
 });
}
"""

def sha(b:bytes)->str:
 return hashlib.sha256(b).hexdigest()

def once(s:str,old:str,new:str,label:str)->str:
 assert s.count(old)==1,(label,s.count(old))
 return s.replace(old,new,1)

def change_page(page:str)->str:
 if MARK in page:
  assert page.count(MARK)==1 and 'zestryMotionAttach(l,container)' in page
  return page
 assert "ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118" in page
 assert "ZESTRY_F02_OWNER_FULL360_SINGLE_20261119" in page
 assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in page
 assert 'data-animation="f02-chef-full360"' in page
 assert 'data-animation="f02-orbit"' not in page
 assert 'data-animation="f02-cooking"' not in page
 # Keep Render's existing build-time compatibility replacement working.
 assert "play(name,c,name!=='f06')" in page
 routine=re.compile(r"async function play\(name,container,loop=false\)\{.*?\}\s*function askBooking\(",re.S)
 match=routine.search(page)
 assert match and len(routine.findall(page))==1,"Unrecognized player structure"
 old=match.group(0)
 assert "lottie.loadAnimation" in old
 assert "container.dataset.loaded='yes';" in old
 assert old.count('autoplay:true')==1
 policy="if(name==='f01'||name==='f02-chef-full360'||name==='f03'||name==='f07')loop=false;"
 new=once(old,policy,"loop=true;","one-shot policy")
 new=once(new,"autoplay:true","autoplay:false","viewport-gated start")
 new=once(new,"container.dataset.loaded='yes';",
          "container.dataset.loaded='yes';zestryMotionAttach(l,container);",
          "existing native player")
 assert 'broth.hasMask=true' in new and "if(name==='f03')" in new
 page=page[:match.start()]+new+page[match.end():]
 page=once(page,"async function play(name,container,loop=false){",
           JS+"\nasync function play(name,container,loop=false){","controller insertion")
 assert page.count(MARK)==1
 return page

def patch(check_only=False):
 parts=sorted(BUNDLE.glob("part-*.bin"))
 assert parts,"Missing ZESTRY review bundle chunks"
 with zipfile.ZipFile(io.BytesIO(b''.join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  data={x.filename:z.read(x.filename) for x in z.infolist()}
 assert len(data)>=50
 for name,digest in IMMUTABLE.items():
  assert sha(data[name])==digest,("Owner Lottie changed",name)
 originals={name:sha(blob) for name,blob in data.items()}
 updated=change_page(data["index.html"].decode()).encode()
 if updated==data["index.html"]:
  return {"status":"already-integrated","deployment":False}
 data["index.html"]=updated
 with io.BytesIO() as buf:
  with zipfile.ZipFile(buf,'w') as z:
   for name,blob in data.items():
    kind=zipfile.ZIP_STORED if Path(name).suffix in (
     '.jpg','.png','.webp','.lottie','.woff','.woff2','.gif'
    ) else zipfile.ZIP_DEFLATED
    z.writestr(name,blob,compress_type=kind,
               compresslevel=6 if kind==zipfile.ZIP_DEFLATED else None)
  output=buf.getvalue()
 with zipfile.ZipFile(io.BytesIO(output)) as z:
  assert z.testzip() is None and z.namelist()==list(data)
  assert z.read("index.html")==updated
  assert all(sha(z.read(k))==v for k,v in originals.items() if k!="index.html")
 if not check_only:
  for p in parts:p.unlink()
  for i,offset in enumerate(range(0,len(output),512000)):
   (BUNDLE/f'part-{i:03d}.bin').write_bytes(output[offset:offset+512000])
 return {"status":"dry-run-ready" if check_only else "bundle-patched",
         "changed":["index.html"],"immutableSources":list(IMMUTABLE),
         "size":len(output),"deployment":False}

if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("--check",action="store_true")
 print(json.dumps(patch(p.parse_args().check),indent=2))
