#!/usr/bin/env python3
"""Native Chromium proof for EXACT owner F02 full360, single kitchen chef only.

Use offline localhost, no Render or preview deployment. The owner supplied
JSON is reconstructed losslessly from the source generator; SHA must match.
The MP4 in the uploaded package was rendered using a custom interpreter, so
this QA verifies the actual production Lottie-web renderer independently.
"""
from __future__ import annotations
import hashlib,io,json,shutil,threading,zipfile
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/owner-f02-single-360-source-only"
OUT.mkdir(parents=True,exist_ok=True)
URL="http://127.0.0.1:18884/"
F02_HASH="e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa"
F01_HASH="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
report={"site":"ZESTRY existing staging source","deployment":"NOT DEPLOYED",
        "ownerOriginalF02SHA256":F02_HASH,"frames":{},"checks":[],"failures":[]}
def ck(name,ok,details):
 report["checks"].append({"name":name,"pass":bool(ok),"details":details})
 if not ok:report["failures"].append(name)
 print("PASS" if ok else "FAIL",name,json.dumps(details,default=str)[:1200],flush=True)
def state(p):
 return p.evaluate("""()=>{
  const a=window.lottie?.getRegisteredAnimations?.().find(x=>x.wrapper?.dataset.player==='f02-chef-full360');
  if(!a)return null;
  const c=document.querySelector('#kitchen .chef-single-360');
  const rect=c?.getBoundingClientRect();
  const svg=c?.querySelector('svg');
  return {frame:a.currentFrame,fps:a.frameRate,duration:a.getDuration(true),
    isPaused:a.isPaused,direction:a.playDirection,loop:a.loop,
    display:c?getComputedStyle(c).display:null,
    containerWidth:rect?.width,containerHeight:rect?.height,
    svgViewBox:svg?.getAttribute('viewBox'),
    svgPaths:svg?.querySelectorAll('path').length,
    originalChefCount:document.querySelectorAll('[data-animation="f02-orbit"],[data-animation="f02-cooking"]').length,
    singleChefCount:document.querySelectorAll('#kitchen [data-animation="f02-chef-full360"]').length,
    horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+2};
 }""")
def scene(browser,label,width,height):
 ctx=browser.new_context(viewport={"width":width,"height":height},device_scale_factor=1)
 p=ctx.new_page();errors=[];failed=[];f02_requests=[]
 p.on("pageerror",lambda e:errors.append(str(e)))
 p.on("response",lambda r:failed.append([r.status,r.url]) if r.status>=400 and r.url.startswith(URL) else None)
 p.on("request",lambda r:f02_requests.append(r.url) if "f02" in r.url.lower() else None)
 p.goto(URL,wait_until="domcontentloaded",timeout=40000)
 p.locator('#kitchen').scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f02-chef-full360"]')?.dataset.loaded==='yes'""",timeout=30000)
 p.wait_for_function("""()=>document.querySelector('#kitchen .chef-single-360 svg')?.querySelectorAll('path').length>200""",timeout=20000)
 first=state(p)
 ck(label+" only one full360 chef with native 2268px vector art",
    first and first["singleChefCount"]==1 and first["originalChefCount"]==0
    and first["svgViewBox"]=="0 0 2268 2268" and first["svgPaths"]>200
    and first["fps"]==30 and first["duration"]==210 and first["loop"] is False
    and first["direction"]==1 and not first["horizontalOverflow"]
    and abs(first["containerWidth"]-first["containerHeight"])<4,first)
 layouts={}
 for n in [0,30,60,105,150,180,209]:
  p.evaluate("""n=>{
    const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset.player==='f02-chef-full360');
    a.goToAndStop(n,true);
  }""",n)
  p.wait_for_timeout(70)
  s=state(p)
  p.screenshot(path=str(OUT/f"{label}-single-F02-frame-{n:03d}.png"),
               clip=p.locator('#kitchen .chef-single-360').bounding_box())
  layouts[n]={"frame":s["frame"],"width":s["containerWidth"],
              "height":s["containerHeight"],"paths":s["svgPaths"]}
 ck(label+" all 7 choreography checkpoints render without CSS zoom",
    all(abs(v["width"]-first["containerWidth"])<1 and
        abs(v["height"]-first["containerHeight"])<1 and
        v["paths"]>200 for v in layouts.values()),layouts)
 p.locator("#home").scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f01"]')?.dataset.loaded==='yes'""",timeout=25000)
 ck(label+" F01 still plays independently",
    p.locator('[data-animation="f01"] svg').count()>0,{"F01SVGCount":p.locator('[data-animation="f01"] svg').count()})
 p.locator("#menu").scroll_into_view_if_needed()
 frame=p.frame_locator("#f05-book-frame")
 frame.locator("#state").wait_for(timeout=25000)
 frame.get_by_role("button",name="Open menu book").click()
 real=next(f for f in p.frames if "f05_book.html" in f.url)
 real.wait_for_function("""()=>document.body.dataset.f05State==='Overview'""",timeout=25000)
 ck(label+" F05 interactive menu preserved",True,{"state":"Overview"})
 for other in ("f03","f06","f07"):
  p.locator('[data-animation="'+other+'"]').scroll_into_view_if_needed(timeout=12000)
  p.wait_for_function("""name=>{
    const node=document.querySelector('[data-animation="'+name+'"]');
    return node?.dataset.loaded==='yes' && !!node.querySelector('svg');
   }""",arg=other,timeout=26000)
  ck(label+" "+other+" unrelated original Lottie still renders",
     p.locator('[data-animation="'+other+'"] svg').count()>0,
     {"scene":other,"sourceUnmodified":True})
 ck(label+" old chefs never fetched, no errors",
    not errors and not failed and
    not any("f02-orbit" in x or "f02-cooking" in x for x in f02_requests)
    and any("f02-chef-full360" in x for x in f02_requests),
    {"requests":f02_requests,"errors":errors,"badResponses":failed})
 report["frames"][label]=layouts
 ctx.close()

def record_natural(browser,label,width,height):
 ctx=browser.new_context(viewport={"width":width,"height":height},
    device_scale_factor=1,record_video_dir=str(OUT),
    record_video_size={"width":width,"height":height})
 p=ctx.new_page()
 p.goto(URL,wait_until="domcontentloaded",timeout=40000)
 p.locator('#kitchen .chef-single-360').scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f02-chef-full360"]')?.dataset.loaded==='yes'""",timeout=30000)
 p.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset.player==='f02-chef-full360');
  a.goToAndPlay(0,true);
 }""")
 start=state(p)
 p.wait_for_timeout(8050)
 end=state(p)
 ck(label+" entire original 7-second clockwise sequence holds final scene",
    start and end and not start["loop"] and
    end["isPaused"] and end["frame"]>=208 and
    end["direction"]==1 and
    abs(end["containerWidth"]-start["containerWidth"])<1,
    {"start":start,"end":end})
 p.screenshot(path=str(OUT/f"{label}-chef-final-scene.png"),
              clip=p.locator('#kitchen .chef-single-360').bounding_box())
 video=p.video
 ctx.close()
 if video:
  dst=OUT/f"{label}-F02-full360-native-browser.webm"
  shutil.move(video.path(),dst)
  ck(label+" real Chromium natural-speed playback recorded",
      dst.stat().st_size>12000,{"filename":dst.name,"bytes":dst.stat().st_size})

def main():
 source=(ROOT/"assets/lottie/f02-chef-full360.json").read_bytes()
 assert hashlib.sha256(source).hexdigest()==F02_HASH
 parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  assert z.read("assets/lottie/f02-chef-full360.json")==source
  assert hashlib.sha256(z.read("assets/lottie/f01.json")).hexdigest()==F01_HASH
  html=z.read("index.html").decode()
  assert html.count("data-animation=\"f02-chef-full360\"")==1
  assert "data-animation=\"f02-orbit\"" not in html and "data-animation=\"f02-cooking\"" not in html
  assert "ZESTRY_F02_OWNER_FULL360_SINGLE_20261119" in html
  assert "if(name==='f01'||name==='f02-chef-full360'||name==='f03'||name==='f07')loop=false;" in html
  with TemporaryDirectory(prefix="zestry-single-chef-") as tmp:
   site=Path(tmp);z.extractall(site)
   page=site/"index.html";content=page.read_text()
   old="play(name,c,name!=='f06')";assert content.count(old)==1
   content=content.replace(old,"play(name,c,name!=='f06'&&name!=='f03')")
   content=content.replace("https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js","assets/vendor/lottie.min.js")
   content=content.replace("https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/","assets/photos/")
   page.write_text(content)
   target=site/"assets/vendor/lottie.min.js";target.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(ROOT/"assets/vendor/lottie.min.js",target)
   for img in (ROOT/"assets/photos").glob("*.jpg"):
    dest=site/"assets/photos"/img.name;dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(img,dest)
   server=ThreadingHTTPServer(("127.0.0.1",18884),
                              partial(SimpleHTTPRequestHandler,directory=str(site)))
   threading.Thread(target=server.serve_forever,daemon=True).start()
   try:
    with sync_playwright() as pw:
     browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
     for name,w,h in [("desktop",1600,900),("mobile",390,844)]:
      try:scene(browser,name,w,h)
      except Exception as e:
       import traceback;traceback.print_exc()
       report["failures"].append(name+" scene error: "+str(e))
     for name,w,h in [("desktop",1600,900),("mobile",390,844)]:
      try:record_natural(browser,name,w,h)
      except Exception as e:
       import traceback;traceback.print_exc()
       report["failures"].append(name+" video error: "+str(e))
     browser.close()
   finally:server.shutdown()
 (OUT/"F02_SINGLE_360_LOCAL_ACCEPTANCE.json").write_text(json.dumps(report,indent=2,default=str)+"\n")
 print("F02_SINGLE_360_QA",json.dumps({
  "pass":not report["failures"],"checks":len(report["checks"]),
  "failures":report["failures"],"previewDeployed":False
 })[:3800],flush=True)
 if report["failures"]:raise SystemExit(2)
if __name__=="__main__":main()
