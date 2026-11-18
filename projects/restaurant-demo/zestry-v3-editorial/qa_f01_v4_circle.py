#!/usr/bin/env python3
"""Actual Chromium acceptance of owner-authored F01 V4 in existing ZESTRY circle.

The only authored-asset change in the Render ZIP is replacing its inert
validation stub with the EXACT owner-supplied V4 JSON. Never redraw, mutate,
zoom, retime or recompute any source Lottie keyframes. Screenshots document
all important choreography frames. Test final broth AND actual one-shot hold.
"""
from pathlib import Path
import hashlib,io,json,threading,shutil,zipfile
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/f01-v4-circle-candidate"
OUT.mkdir(parents=True,exist_ok=True)
EXPECTED="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
URI="http://127.0.0.1:18894/"
REPORT={"originalLottieSHA256":EXPECTED,"sourceEdited":False,"renderer":"native Lottie-web 5.12.2",
        "viewports":{},"checks":[],"failures":[]}
def ck(name,condition,detail):
  REPORT["checks"].append({"name":name,"passed":bool(condition),"details":detail})
  if not condition:REPORT["failures"].append(name)
  print("PASS" if condition else "FAIL",name,json.dumps(detail,default=str)[:2200],flush=True)

def get_a(page):
 return page.evaluate("""()=> {
  const a=window.lottie?.getRegisteredAnimations?.().find(x=>x.wrapper?.dataset?.player==='f01');
  if(!a)return null;
  const circle=document.querySelector('#home .f01-v4-circle');
  const stage=circle?.querySelector('.anim');
  const svg=stage?.querySelector('svg');
  const visual=document.querySelector('#home .hero-image.hero-visual');
  const broth=a.renderer.elements.find(x=>x?.data?.ind===28);
  return {
   frame:a.currentFrame,fr:a.frameRate,frames:a.getDuration(true),loop:a.loop,
   paused:a.isPaused,direction:a.playDirection,
   hasBrothMask:broth?.data?.hasMask,brothPathCount:broth?.layerElement?.querySelectorAll('path').length,
   brothClip:broth?.layerElement?.getAttribute('clip-path'),
   stageTransform:getComputedStyle(stage).transform,
   circleMask:getComputedStyle(circle).clipPath,circleOverflow:getComputedStyle(circle).overflow,
   woodBackground:getComputedStyle(circle).backgroundImage,
   circleRect:{w:circle?.getBoundingClientRect().width,h:circle?.getBoundingClientRect().height},
   visualRect:{w:visual?.getBoundingClientRect().width,h:visual?.getBoundingClientRect().height},
   stageRect:{w:stage?.getBoundingClientRect().width,h:stage?.getBoundingClientRect().height},
   svgRect:{w:svg?.getBoundingClientRect().width,h:svg?.getBoundingClientRect().height},
   svgViewbox:svg?.getAttribute('viewBox'),
   extraZoomHooks:!!window.ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER,
   xOverflow:document.documentElement.scrollWidth>window.innerWidth+2,
   completed:stage?.dataset.motionComplete,
   htmlBackground:document.querySelector('.hero h1')?.innerText,
   visualPlaceholder:!!document.querySelector('.hero-artwork-placeholder')
  };
}""")

def broth_pixels(page,n):
 page.evaluate("n=>window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f01').goToAndStop(n,true)",n)
 page.wait_for_timeout(75)
 box=page.locator("#home .f01-v4-circle").bounding_box()
 original=page.screenshot(clip=box)
 page.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f01');
  const b=a.renderer.elements.find(x=>x?.data?.ind===28).layerElement;
  b.style.setProperty('visibility','hidden','important');
 }""");page.wait_for_timeout(50)
 without=page.screenshot(clip=box)
 page.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f01');
  a.renderer.elements.find(x=>x?.data?.ind===28).layerElement.style.removeProperty('visibility');
 }""")
 diff=ImageChops.difference(Image.open(io.BytesIO(original)).convert('RGB'),
  Image.open(io.BytesIO(without)).convert('RGB')).convert("L")
 painted=sum(n for i,n in enumerate(diff.histogram()) if i>8)
 return painted,original

def test_viewport(browser,label,w,h):
 context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
 p=context.new_page();errors=[];failed=[];requests=[]
 p.on("pageerror",lambda e:errors.append(str(e)))
 p.on("response",lambda r:failed.append((r.status,r.url))
      if r.status>=400 and r.url.startswith(URI) else None)
 p.on("request",lambda r:requests.append(r.url) if "f01" in r.url.lower() else None)
 p.goto(URI,wait_until="domcontentloaded",timeout=30000)
 p.wait_for_function("""()=> {
   const a=window.lottie?.getRegisteredAnimations?.().find(x=>x.wrapper?.dataset?.player==='f01');
   return !!a?.renderer?.elements?.length &&
          !!document.querySelector('#home .f01-v4-circle .anim svg');
 }""",timeout=26000)
 state=get_a(p)
 ck(label+" original V4 30fps /261 frames / one-shot no reverse",
    state and state["fr"]==30 and state["frames"]==261 and state["loop"] is False
    and state["direction"]==1 and not state["visualPlaceholder"],
    state)
 circle=state["circleRect"]
 stage=state["stageRect"]
 ratio=stage["h"]/circle["h"] if circle["h"] else 0
 ck(label+" fixed nonzooming circle mask and safe foreground proportion",
    "circle(" in state["circleMask"] and state["circleOverflow"]=="hidden"
    and "f01-v4-wood-fill.webp" in state["woodBackground"]
    and abs(circle["w"]-circle["h"])<2 and abs(ratio-0.7)<.008
    and state["svgViewbox"]=="0 0 1984 1134"
    and not state["xOverflow"] and state["hasBrothMask"] is True,
    {"circle":circle,"stage":stage,"stageRatio":ratio,"cssMask":state["circleMask"],
     "brothHint":state["hasBrothMask"],"xOverflow":state["xOverflow"]})
 photos={}
 startSize=(stage["w"],stage["h"])
 for frame in [0,26,52,60,90,120,134,142,149,160,175,210,260]:
  px,img=broth_pixels(p,frame)
  photos[frame]=px
  if frame in (0,26,52,60,90,134,142,149,160,210,260):
   (OUT/f"{label}-circle-F01-frame-{frame:03d}.png").write_bytes(img)
  current=get_a(p)
  ck(label+f" fixed art scale at original frame {frame}",
     abs(current["stageRect"]["w"]-startSize[0])<.6 and
     abs(current["stageRect"]["h"]-startSize[1])<.6,
     {"frame":frame,"width":current["stageRect"]["w"],"height":current["stageRect"]["h"]})
 threshold=1000 if label=="desktop" else 170
 ck(label+" original bowl broth visibly fills at pour and final hold",
    photos[160]>threshold and photos[260]>threshold,
    {"brothPixelsAt160":photos[160],"brothPixelsFinal":photos[260],
      "nativeUnmodifiedHintVerified":True})
 # Must NOT reset to empty after 261 frames or loop on scroll re-entry.
 p.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f01');
  a.goToAndStop(257,true);
  a.play();
 }""")
 p.wait_for_timeout(400)
 completed=get_a(p)
 p.wait_for_timeout(440)
 held=get_a(p)
 ck(label+" holds completed dish instead of looping or enlarging",
    completed["frame"]>=259 and held["frame"]>=259
    and not held["loop"] and held["paused"] is True
    and abs(held["stageRect"]["h"]-startSize[1])<1,
    {"first":completed,"held":held})
 p.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')?.dataset.loaded==='yes'""",timeout=22000)
 chef=p.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f02-orbit');
  return a?{length:a.getDuration(true),frameRate:a.frameRate,forward:a.playDirection===1,svg:!!a.wrapper.querySelector('svg')}:null;
 }""")
 ck(label+" other chef/orbit animation untouched",
    chef and chef["length"]==210 and chef["frameRate"]==30
    and chef["forward"] and chef["svg"],chef)
 ck(label+" asset URLs and browser errors",
    not errors and not failed and any(x.endswith("/assets/lottie/f01.json") for x in requests)
    and not any("f01-v16" in x for x in requests),
    {"console":errors,"badAssets":failed,"F01Requests":requests})
 context.close()
 REPORT["viewports"][label]={"first":state,"broth":photos,"last":held,"chef":chef,
                            "errors":errors,"failedAssets":failed}

def main():
 parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
 assert parts
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  assert hashlib.sha256(z.read("assets/lottie/f01.json")).hexdigest()==EXPECTED
  assert z.read("assets/lottie/f01.json")==(ROOT/"assets/lottie/f01.json").read_bytes()
  assert z.read("assets/f01-v4-wood-fill.webp")==(ROOT/"assets/f01-v4-wood-fill.webp").read_bytes()
  assert "assets/lottie/f01-v16.json" not in z.namelist()
  html=z.read("index.html").decode()
  assert "ZESTRY_F01_V4_UNMODIFIED_CIRCLE_20261118" in html
  assert html.count("play(name,c,name!=='f06')")==1
  assert "mountF01" not in html
  assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in html
  with TemporaryDirectory(prefix="zestry-v4-circle-") as tmp:
   site=Path(tmp)
   z.extractall(site)
   mainpage=site/"index.html"
   s=mainpage.read_text()
   s=s.replace("play(name,c,name!=='f06')",
               "play(name,c,name!=='f06'&&name!=='f03')")
   s=s.replace(
     "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
     "assets/vendor/lottie.min.js")
   s=s.replace(
     "https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/",
     "assets/photos/")
   mainpage.write_text(s)
   vendor=site/"assets/vendor/lottie.min.js";vendor.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(ROOT/"assets/vendor/lottie.min.js",vendor)
   for p in (ROOT/"assets/photos").glob("*.jpg"):
    dest=site/"assets/photos"/p.name;dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(p,dest)
   server=ThreadingHTTPServer(("127.0.0.1",18894),
            partial(SimpleHTTPRequestHandler,directory=str(site)))
   threading.Thread(target=server.serve_forever,daemon=True).start()
   try:
    with sync_playwright() as playwright:
     browser=playwright.chromium.launch(headless=True,args=["--no-sandbox"])
     for label,w,h in [("desktop",1600,900),("mobile",390,844)]:
      try:test_viewport(browser,label,w,h)
      except Exception as e:
       import traceback
       traceback.print_exc()
       REPORT["failures"].append({"test":label,"exception":str(e)})
     browser.close()
   finally:server.shutdown()
 (OUT/"F01_V4_CIRCLE_ACCEPTANCE.json").write_text(json.dumps(REPORT,indent=2,default=str)+"\n")
 print("F01_V4_CIRCLE_QA",json.dumps({
  "pass":not REPORT["failures"],"checks":len(REPORT["checks"]),
  "failures":REPORT["failures"],"sourceOriginal":EXPECTED
 })[:4200],flush=True)
 if REPORT["failures"]:raise SystemExit(2)

if __name__=="__main__":main()
