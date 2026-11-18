#!/usr/bin/env python3
"""V16 rollback verification, not cosmetic optimization.

Run after rebuilding the exact V16 bundle with only the wooden-background
SVG ID namespace correction. Test the V16 natural-motion choreography and
broth's *rendered* contribution. Never change source Lottie JSON.
"""
from __future__ import annotations
import io,json,hashlib,threading,shutil,time,zipfile
from pathlib import Path
from tempfile import TemporaryDirectory
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

PROJECT=Path("projects/restaurant-demo")
OUT=PROJECT/"docs/qa/owner-v16-motion-rollback"
OUT.mkdir(parents=True,exist_ok=True)
expected_sha="8bdcd1711b8b19e9e597a9f3dbb853d701018cc5"
url="http://127.0.0.1:18893/"
report={"baselineCommit":expected_sha,"status":"CANDIDATE not yet deployed",
        "scope":"exact V16 animation bundle with only cloned-wood SVG ID namespace",
        "checks":[],"issues":[]}
def ck(name,condition,detail):
 record={"name":name,"pass":bool(condition),"detail":detail}
 report["checks"].append(record)
 if not condition:report["issues"].append(record)
 print("PASS" if condition else "FAIL",name,json.dumps(detail,default=str)[:1600],flush=True)

def f01player(p):
 return p.evaluate("""()=>{
  const a=window.lottie?.getRegisteredAnimations?.().find(x=>
    x.wrapper?.closest('.hero-image.hero-visual'));
  if(!a)return null;
  const x=a.wrapper;
  const broth=a.renderer.elements.find(e=>e.data?.ind===28);
  const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
  return {frame:a.currentFrame,loop:a.loop,duration:a.getDuration(true),
    frameRate:a.frameRate,subframe:a.isSubframeEnabled,
    zoom:Number(x.dataset.heroZoom),complete:x.dataset.motionComplete,
    wood:!!document.querySelector('svg.f01-wood-fill'),
    broth:broth?.data?.nm,clip:broth?.layerElement?.getAttribute('clip-path'),
    duplicateIDs:[...new Set(ids)].filter(i=>ids.indexOf(i)!==ids.lastIndexOf(i)),
    overflow:document.documentElement.scrollWidth>innerWidth+2};
}""")
def broth_pixels(p,frame):
 p.evaluate("""frame=>{
   const a=window.lottie.getRegisteredAnimations().find(x=>
       x.wrapper?.closest('.hero-image.hero-visual'));
   a.goToAndStop(frame,true);
 }""",frame)
 p.wait_for_timeout(70)
 clip=p.locator(".hero-image.hero-visual").bounding_box()
 visible=p.screenshot(clip=clip)
 p.evaluate("""()=>{
   const a=window.lottie.getRegisteredAnimations().find(x=>
       x.wrapper?.closest('.hero-image.hero-visual'));
   a.renderer.elements.find(e=>e.data?.ind===28)?.layerElement
    ?.style.setProperty('visibility','hidden','important');
 }""")
 p.wait_for_timeout(50)
 hidden=p.screenshot(clip=clip)
 p.evaluate("""()=>{
   const a=window.lottie.getRegisteredAnimations().find(x=>
       x.wrapper?.closest('.hero-image.hero-visual'));
   a.renderer.elements.find(e=>e.data?.ind===28)?.layerElement
    ?.style.removeProperty('visibility');
 }""")
 diff=ImageChops.difference(Image.open(io.BytesIO(visible)).convert('RGB'),
                            Image.open(io.BytesIO(hidden)).convert('RGB')).convert('L')
 return sum(n for level,n in enumerate(diff.histogram()) if level>8),visible

def test_viewport(browser,label,w,h):
 c=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
 p=c.new_page();errors=[];failed=[]
 p.on("pageerror",lambda e:errors.append(str(e)))
 p.on("response",lambda r:failed.append((r.status,r.url))
      if r.url.startswith(url) and r.status>=400 else None)
 p.goto(url,wait_until="domcontentloaded",timeout=30000)
 p.wait_for_function("""()=>{
    const a=window.lottie?.getRegisteredAnimations?.().find(x=>
      x.wrapper?.closest('.hero-image.hero-visual'));
    return !!a&&!!a.renderer?.elements?.length&&!!document.querySelector('svg.f01-wood-fill');
 }""",timeout=25000)
 state=f01player(p)
 ck(label+" approved V16 fixed size/one-shot and wood",state and
    state["zoom"]==1.755 and state["loop"] is False and state["wood"] and
    state["duration"]==261 and not state["overflow"],state)
 ck(label+" original SVG ids isolated",state and not state["duplicateIDs"],
    {"duplicateIDs":state["duplicateIDs"]})
 frames={}
 for f in [0,30,65,100,134,149,160,200,240,260]:
  painted,shot=broth_pixels(p,f)
  frames[f]=painted
  if f in [0,134,160,260]:
   (OUT/(label+"-v16-f01-frame-"+str(f).zfill(3)+".png")).write_bytes(shot)
 ck(label+" broth appears during/after pour",frames[160]>(500 if label=="desktop" else 80)
    and frames[260]>(500 if label=="desktop" else 80),
    {"pixelsAt160":frames[160],"pixelsAt260":frames[260],"all":frames})
 # V17 introduced new frame quantization and one-time scale mutation.
 # These must be absent in the exact approved V16.
 runtime=p.evaluate("""()=>{
   const source=document.documentElement.outerHTML;
   return {
     V16Mount:source.includes('mountF01V16FixedSize'),
     V17Perf:source.includes('ZESTRY_PERF_V17_ENTRY'),
     V17MountOnce:source.includes('applyOnce'),
     V18Loop:source.includes('ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER'),
     V16MaskOnly:source.includes('ZESTRY_V16_WOOD_MASK_ID_ONLY_20261118')
   };
 }""")
 ck(label+" ONLY V16 motion controller + broth ID correction",
     runtime["V16Mount"] and runtime["V16MaskOnly"] and not runtime["V17Perf"]
     and not runtime["V17MountOnce"] and not runtime["V18Loop"],runtime)
 p.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed(timeout=15000)
 p.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')
       ?.dataset.loaded==='yes'""",timeout=25000)
 orbit=p.evaluate("""()=>{
   const a=window.lottie.getRegisteredAnimations().find(x=>
     x.wrapper?.dataset?.animation==='f02-orbit');
   return a?{frame:a.currentFrame,loop:a.loop,direction:a.playDirection,
     duration:a.getDuration(true),fps:a.frameRate,
     V18PingPong:!!a.wrapper.dataset.orbitDirection}:null;
 }""")
 ck(label+" original F02 chef source/forward playback restored",
     orbit and orbit["fps"]==30 and orbit["direction"]==1
     and not orbit["V18PingPong"],orbit)
 ck(label+" no browser errors/assets failed",not errors and not failed,
    {"errors":errors,"failed":failed})
 report.setdefault("viewport",{})[label]={"initial":state,"broth":frames,"orbit":orbit,
    "jsErrors":errors,"originFailures":failed}
 c.close()

def natural(browser,label,w,h):
 c=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1,
       record_video_dir=str(OUT),record_video_size={"width":w,"height":h})
 p=c.new_page();errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url,wait_until='domcontentloaded',timeout=30000)
 p.wait_for_function("""()=>document.querySelector('[data-animation="f01"]')
      ?.dataset.loaded==='yes'""",timeout=24000)
 first=f01player(p)
 p.wait_for_function("""()=>document.querySelector('[data-animation="f01"]')
      ?.dataset.motionComplete==='true'""",timeout=21000)
 completed=f01player(p)
 p.wait_for_timeout(1750)
 held=f01player(p)
 ck(label+" natural playback holds completed plate",first and completed and held
    and first["zoom"]==1.755 and completed["frame"]>=259
    and held["frame"]>=259 and not held["loop"]
    and completed["frame"]==held["frame"] and not errors,
    {"initial":first,"complete":completed,"hold":held,"errors":errors})
 (OUT/(label+"-v16-final-plate-hold.png")).write_bytes(
     p.screenshot(clip=p.locator('.hero-image.hero-visual').bounding_box()))
 video=p.video;c.close()
 path=Path(video.path())
 dest=OUT/(label+"-V16-original-motion-browser.webm")
 shutil.move(path,dest)
 ck(label+" actual 10-second V16 browser recording",dest.stat().st_size>10000,
    {"name":dest.name,"bytes":dest.stat().st_size})

def main():
 parts=sorted((PROJECT/"review_bundle").glob("part-*.bin"))
 packed=b"".join(p.read_bytes() for p in parts)
 with zipfile.ZipFile(io.BytesIO(packed)) as z:
  assert z.testzip() is None
  html=z.read("index.html").decode()
  assert "ZESTRY_V16_WOOD_MASK_ID_ONLY_20261118" in html
  assert "ZESTRY_PERF_V17_ENTRY" not in html and "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in html
  with TemporaryDirectory(prefix="zestry-v16-rollback-") as tmp:
   site=Path(tmp);z.extractall(site)
   index=site/"index.html";html=index.read_text()
   # Exactly reproduce existing Render static build's local asset and
   # F03 non-loop patch. These are build compatibility only.
   old="play(name,c,name!=='f06')"
   assert html.count(old)==1
   html=html.replace(old,"play(name,c,name!=='f06'&&name!=='f03')")
   html=html.replace(
     "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
     "assets/vendor/lottie.min.js")
   html=html.replace(
     "https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/",
     "assets/photos/")
   index.write_text(html)
   vendor=site/"assets/vendor/lottie.min.js"
   vendor.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(PROJECT/"assets/vendor/lottie.min.js",vendor)
   for pic in (PROJECT/"assets/photos").glob("*.jpg"):
    dest=site/"assets/photos"/pic.name
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(pic,dest)
   server=ThreadingHTTPServer(("127.0.0.1",18893),
       partial(SimpleHTTPRequestHandler,directory=str(site)))
   threading.Thread(target=server.serve_forever,daemon=True).start()
   try:
    with sync_playwright() as playwright:
     browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
     for label,w,h in [("desktop",1600,900),("mobile",390,844)]:
      try:test_viewport(browser,label,w,h)
      except Exception as e:
       import traceback;traceback.print_exc()
       report["issues"].append({"name":label+" exception","detail":str(e)})
      try:natural(browser,label,w,h)
      except Exception as e:
       import traceback;traceback.print_exc()
       report["issues"].append({"name":label+" natural exception","detail":str(e)})
     browser.close()
   finally:server.shutdown()
 (OUT/"V16_ROLLBACK_ACCEPTANCE.json").write_text(json.dumps(report,indent=2,default=str)+"\n")
 print("V16_ROLLBACK_QA_RESULT",json.dumps({
   "passed":not report["issues"],"checkCount":len(report["checks"]),
   "issues":report["issues"]
 })[:3000],flush=True)
 if report["issues"]:raise SystemExit(2)
if __name__=="__main__":main()
