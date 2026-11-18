#!/usr/bin/env python3
"""ZESTRY V18: viewport-scoped animation loops; seamless F02 vegetable orbit.

Preserve every approved Lottie source, keyframe, easing, geometry, F01 broth
mask, 1.755x hero scale, original wood SVG, F05 menu book and order/booking
logic. Change only the playback controller in the shipped review ZIP.
"""
from __future__ import annotations
import hashlib,io,json,re,zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'review_bundle'
MARKER='ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER'
DEFAULTS={
 'assets/lottie/f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
 'assets/lottie/f01-v16.json':'14f781c6568a15fd1593b7a906c95f87b9c445bd7573cf8741bbded92ca6660d',
 'assets/lottie/f02-orbit.json':'adfca93e752627a83ae06d44cc667d7baf655a79f9370f07ca3306ca10567a64',
 'assets/lottie/f02-cooking.json':'5e341a2d8229a5dc762c720da8458608d456fd57f8d3aca83c95de5a9efc390e',
 'assets/lottie/f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
 'assets/lottie/f04.json':'e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0',
 'assets/lottie/f06.json':'6154d066c0c962af085aced8cadf977c994e55c2a3409b81c46933826386817c',
 'assets/lottie/f07.json':'a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b',
}
JS=r"""/* ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER
 * All exported Lottie animations use their original 30fps keyframes.
 * Playback is allowed only while the animation ELEMENT (or dialog) is
 * visible, while this document is foregrounded, and when motion is allowed.
 * F02 orbit uses bounce/ping-pong between the exact approved end poses:
 * no artificial jump from frame 209 to 0 and no original artwork edits.
 * F05 is its own interactive book and retains user-controlled state; its
 * existing visibility postMessage handling remains authoritative.
 */
const motionReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const motionStates=new Set();
const motionModal=document.getElementById('modal');
function pruneMotionStates(){
 for(const st of Array.from(motionStates)){
  if(st.container.isConnected)continue;
  st.observer?.disconnect();
  st.item.destroy();
  motionStates.delete(st);
 }
}
function syncMotionState(st){
 if(!st.container.isConnected){pruneMotionStates();return}
 const active=Boolean(st.near&&!document.hidden&&!motionReduced.matches&&
   (!st.modal||st.modal.classList.contains('active')));
 st.container.dataset.motionInView=active?'true':'false';
 if(active){
  if(st.item.isPaused)st.item.play();
 }else if(!st.item.isPaused)st.item.pause();
}
document.addEventListener('visibilitychange',()=>{
 for(const st of motionStates)syncMotionState(st);
});
if(typeof motionReduced.addEventListener==='function'){
 motionReduced.addEventListener('change',()=>{
  for(const st of motionStates){
   if(motionReduced.matches){st.item.pause();st.item.goToAndStop(0,true)}
   syncMotionState(st);
  }
 });
}
if(motionModal){
 new MutationObserver(()=>{for(const st of motionStates)if(st.modal)syncMotionState(st)})
   .observe(motionModal,{attributes:true,attributeFilter:['class','style','aria-hidden']});
}
async function play(name,container,loop=true){
 if(!window.lottie){container.textContent='Animation player unavailable';return}
 if(container.dataset.loaded==='yes'||container.dataset.loaded==='loading')return;
 pruneMotionStates();
 container.dataset.loaded='loading';
 try{
  const response=await fetch('assets/lottie/'+encodeURIComponent(name==='f01'?'f01-v16':name)+'.json');
  if(!response.ok)throw new Error('HTTP '+response.status);
  const v=await response.json();
  if(name==='f01'){
   const broth=v.layers.find(x=>x.ind===28&&x.nm.startsWith('Broth /'));
   if(!broth||!broth.masksProperties)throw new Error('Approved F01 broth layer missing');
   broth.hasMask=true;
  }
  if(name==='f03'){
   const machine=v.layers.find(x=>x.ind===2&&x.nm.startsWith('Machine_Fade_Controller'));
   const parts=v.layers.filter(x=>x.parent===2&&x.ind>=15&&x.ind<=27);
   if(!machine||!machine.ks?.o?.k||parts.length!==13||
      parts.some(x=>x.ks?.o?.a!==0||x.ks.o.k!==100)){
     throw new Error('Approved F03 machine fade hierarchy mismatch');
   }
   for(const part of parts)part.ks.o=JSON.parse(JSON.stringify(machine.ks.o));
  }
  if(!container.isConnected)return;
  const chefOrbit=(name==='f02-orbit');
  const l=lottie.loadAnimation({
    container,renderer:'svg',loop:!chefOrbit,autoplay:false,animationData:v,
    rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
  });
  if(typeof l.setSubframe==='function')l.setSubframe(false);
  if(name==='f01'){
   mountF01WoodBackdrop(l,container);
   mountF01V16FixedSize(l,container);
  }
  container.dataset.loaded='yes';
  container.dataset.player=name;
  container.dataset.motionComplete='false';
  container.dataset.motionLoops='0';
  container.dataset.motionPolicy=chefOrbit?'pingpong':'repeat';
  // Observe the ACTUAL illustration: tall mobile sections can remain in view
  // after the animation itself has fully scrolled away.
  const root=container.closest('#modal')||container;
  const st={item:l,container,root,near:false,modal:container.closest('#modal'),observer:null};
  motionStates.add(st);
  if(chefOrbit){
   let direction=1;
   l.addEventListener('complete',()=>{
    // The approved floating vegetables finish far from their first orbit.
    // Reverse without resetting frames, then reverse again at frame zero.
    direction*=-1;
    l.setDirection(direction);
    container.dataset.orbitDirection=direction>0?'forward':'return';
    container.dataset.motionLoops=String(+(container.dataset.motionLoops||0)+1);
    if(st.near&&!document.hidden&&!motionReduced.matches)l.play();
   });
   container.dataset.orbitDirection='forward';
  }else{
   l.addEventListener('loopComplete',()=>{
    container.dataset.motionLoops=String(+(container.dataset.motionLoops||0)+1);
    container.dataset.motionComplete='true';
   });
  }
  if(motionReduced.matches){l.goToAndStop(0,true)}
  if('IntersectionObserver' in window){
   st.observer=new IntersectionObserver(es=>{
     st.near=es.some(e=>e.isIntersecting&&e.intersectionRatio>0);
     syncMotionState(st);
   },{threshold:[0,.01,.12]});
   st.observer.observe(root);
  }else{
   const rect=root.getBoundingClientRect();
   st.near=rect.bottom>0&&rect.top<innerHeight;
   syncMotionState(st);
  }
 }catch(e){
  container.dataset.loaded='error';
  console.error('Lottie failed',name,e);
  container.textContent='Animation unavailable';
 }
}
function askBooking("""

def modify(index: str) -> str:
 if MARKER in index:return index
 assert "ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118" in index
 assert "ZESTRY_PERF_V17_ENTRY" in index
 old=re.compile(r"async function play\(name,container,loop=false\)\{.*?\}\s*function askBooking\(",re.S)
 found=old.findall(index)
 assert len(found)==1,f"Expected one approved play routine, got {len(found)}"
 fixed=old.sub(lambda _:JS,index,count=1)
 orig="play(name,c,name!=='f06')"
 assert fixed.count(orig)==1,("Initial lazy-animation observer changed",fixed.count(orig))
 # Keep the existing Render service build-command sentinel unchanged: it
 # replaces this old call during the deployed static-site build.
 # The new runtime controller ignores that legacy loop argument and always
 # enables approved scene loops (F02 orbit instead uses ping-pong).
 assert fixed.count(orig)==1
 assert MARKER in fixed
 assert "mountF01WoodBackdrop(l,container)" in fixed
 assert "mountF01V16FixedSize(l,container)" in fixed
 assert "broth.hasMask=true" in fixed
 assert "name==='f02-orbit'" in fixed
 assert "loop:!chefOrbit,autoplay:false" in fixed
 assert "l.setDirection(direction)" in fixed
 assert "function initDeferredMenuBook" in fixed
 assert "zestry:book-visibility" in fixed
 return fixed

def main():
 parts=sorted(BUNDLE.glob('part-*.bin'))
 assert len(parts)>=20
 blob=b''.join(p.read_bytes() for p in parts)
 with zipfile.ZipFile(io.BytesIO(blob)) as z:
  assert z.testzip() is None
  data={i.filename:z.read(i.filename) for i in z.infolist()}
 for name,sha in DEFAULTS.items():
  assert hashlib.sha256(data[name]).hexdigest()==sha,name
 before={k:hashlib.sha256(v).hexdigest() for k,v in data.items()}
 data['index.html']=modify(data['index.html'].decode()).encode()
 changed=[k for k,v in data.items() if hashlib.sha256(v).hexdigest()!=before[k]]
 assert changed in ([],['index.html']),changed
 packed=io.BytesIO()
 with zipfile.ZipFile(packed,'w') as z:
  for name,payload in data.items():
   comp=zipfile.ZIP_STORED if Path(name).suffix in ('.jpg','.webp','.lottie','.png','.woff','.woff2','.gif') else zipfile.ZIP_DEFLATED
   z.writestr(name,payload,compress_type=comp,compresslevel=6 if comp==zipfile.ZIP_DEFLATED else None)
 final=packed.getvalue()
 with zipfile.ZipFile(io.BytesIO(final)) as z:
  assert z.testzip() is None
  assert z.namelist()==list(data)
  for name,sha in DEFAULTS.items():assert hashlib.sha256(z.read(name)).hexdigest()==sha
 for p in parts:p.unlink()
 for index,offset in enumerate(range(0,len(final),512_000)):
  (BUNDLE/f'part-{index:03d}.bin').write_bytes(final[offset:offset+512_000])
 print('V18_VIEWPORT_LOOP_BUNDLE',json.dumps({'bytes':len(final),'files':len(data),
    'sourceAssetsUnchanged':len(DEFAULTS),'onlyModifiedFile':changed,
    'orbitMode':'pingpong native Lottie (no keyframe edits)',
    'pageAnimationMode':'loop forward only while section visible'}),flush=True)
if __name__=='__main__':main()
