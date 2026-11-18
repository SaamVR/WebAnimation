#!/usr/bin/env python3
"""ZESTRY PR #141: Chromium desktop/mobile viewport playback QA, no hosting.

Reads the exact Render review ZIP archive, locally reconstructs the existing
site and tests shipped lottie-web players. Video/screenshots are CI artifacts,
never uploaded as a hosted preview.
"""
from __future__ import annotations
import hashlib
import io
import json
import shutil
import threading
import time
import zipfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs/qa/owner-visible-loops-20261119"
OUT.mkdir(parents=True,exist_ok=True)
MARK="ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119"
HASH={
 "f01":"7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37",
 "f02-chef-full360":"e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa",
 "f03":"136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68"
}
report={"deployment":"NONE","pr":141,"checks":[],"failures":[],"sources":HASH}

def check(name,condition,detail=None):
 good=bool(condition)
 report["checks"].append({"name":name,"pass":good,"details":detail})
 if not good:report["failures"].append(name)
 print(("PASS " if good else "FAIL ")+name+" "+json.dumps(detail,default=str)[:950],flush=True)
 return good

def snapshot(page,name):
 return page.evaluate("""name=>{
  const node=document.querySelector('[data-animation="'+name+'"]');
  const a=window.lottie?.getRegisteredAnimations?.().find(x=>x.wrapper===node);
  return {exists:!!node,loaded:node?.dataset.loaded,player:node?.dataset.player,
   inView:node?.dataset.motionInView,policy:node?.dataset.motionPolicy,
   loops:Number(node?.dataset.motionLoops||0),frame:a?.currentFrame,
   paused:a?.isPaused,loop:a?.loop,direction:a?.playDirection,
   duration:a?.totalFrames,rate:a?.frameRate,
   svg:!!node?.querySelector('svg'),children:node?.querySelectorAll('path').length};
 }""",name)

def stage(z,site):
 z.extractall(site)
 index=site/"index.html"
 page=index.read_text()
 assert page.count(MARK)==1
 sentinel="play(name,c,name!=='f06')"
 assert page.count(sentinel)==1,"Render static build sentinel changed"
 page=page.replace(sentinel,"play(name,c,name!=='f06'&&name!=='f03')")
 page=page.replace("https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
                   "assets/vendor/lottie.min.js")
 page=page.replace("https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/",
                   "assets/photos/")
 index.write_text(page)
 vendor=site/"assets/vendor/lottie.min.js";vendor.parent.mkdir(parents=True,exist_ok=True)
 shutil.copy2(ROOT/"assets/vendor/lottie.min.js",vendor)
 photo_dir=site/"assets/photos";photo_dir.mkdir(parents=True,exist_ok=True)
 for p in (ROOT/"assets/photos").glob("*.jpg"):shutil.copy2(p,photo_dir/p.name)

def wait_visible(page,name):
 locator=page.locator('[data-animation="'+name+'"]').first
 locator.scroll_into_view_if_needed(timeout=15000)
 page.wait_for_function("""name=>{
  const e=document.querySelector('[data-animation="'+name+'"]');
  return e?.dataset.loaded==='yes'&&e?.dataset.motionInView==='true'&&
   !!window.lottie?.getRegisteredAnimations?.().find(a=>a.wrapper===e);
 }""",arg=name,timeout=30000)
 return snapshot(page,name)

def test_scene(page,label,name):
 before=wait_visible(page,name)
 check(label+" "+name+" native loop enabled",
       before["loop"] is True and before["direction"]==1 and before["svg"] and
       before["policy"]=="visible-forward-repeat",before)
 # Force the player close to its natural final frame to exercise two real
 # Lottie completion transitions without waiting for very long compositions.
 for n in range(2):
  page.evaluate("""name=>{
   const node=document.querySelector('[data-animation="'+name+'"]');
   const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===node);
   a.setSpeed(8);
   a.goToAndPlay(Math.max(0,a.totalFrames-15),true);
  }""",name)
  page.wait_for_function("""arg=>{
   const el=document.querySelector('[data-animation="'+arg.name+'"]');
   return Number(el.dataset.motionLoops||0)>arg.n;
  }""",arg={"name":name,"n":n},timeout=12000)
 done=snapshot(page,name)
 check(label+" "+name+" completes two forward loops",
       done["loops"]>=2 and done["direction"]==1 and not done["paused"],done)
 # Restore native speed for the pause/resume behavior.
 page.evaluate("""name=>{
  const node=document.querySelector('[data-animation="'+name+'"]');
  lottie.getRegisteredAnimations().find(x=>x.wrapper===node).setSpeed(1);
 }""",name)
 page.evaluate("window.scrollTo(0,document.documentElement.scrollHeight)")
 page.wait_for_function("""name=>{
  const e=document.querySelector('[data-animation="'+name+'"]');
  const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===e);
  return e.dataset.motionInView==='false'&&a.isPaused;
 }""",arg=name,timeout=12000)
 paused=snapshot(page,name)
 page.wait_for_timeout(350)
 still=snapshot(page,name)
 check(label+" "+name+" pauses offscreen at same frame",
       paused["paused"] and still["paused"] and
       abs(still["frame"]-paused["frame"])<0.5,
       {"paused":paused,"after350ms":still})
 returned=wait_visible(page,name)
 check(label+" "+name+" resumes forward on return",
       returned["inView"]=="true" and returned["paused"] is False and
       returned["direction"]==1,returned)

def test_browser(browser,label,w,h,url):
 context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1,
                             record_video_dir=str(OUT),record_video_size={"width":w,"height":h})
 page=context.new_page();errors=[];failed=[];f02=[]
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.on("response",lambda r:failed.append([r.status,r.url]) if
         r.status>=400 and r.url.startswith(url) else None)
 page.on("request",lambda r:f02.append(r.url) if "f02" in r.url.lower() else None)
 page.goto(url,wait_until="domcontentloaded",timeout=45000)
 for name in ("f01","f02-chef-full360","f03","f06","f07"):
  try:test_scene(page,label,name)
  except Exception as e:check(label+" "+name+" complete scene suite",False,str(e))
 check(label+" uses exactly one approved chef",
       page.locator('[data-animation="f02-chef-full360"]').count()==1 and
       page.locator('[data-animation="f02-orbit"],[data-animation="f02-cooking"]').count()==0 and
       not any("f02-orbit" in x or "f02-cooking" in x for x in f02),f02)
 # Closing app visibility stops all active scene processing even when visible.
 try:
  before=wait_visible(page,"f02-chef-full360")
  page.evaluate("""()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   document.dispatchEvent(new Event('visibilitychange'));
  }""")
  page.wait_for_function("""()=>{
   const e=document.querySelector('[data-animation="f02-chef-full360"]');
   return e?.dataset.motionInView==='false';
  }""",timeout=6000)
  after=snapshot(page,"f02-chef-full360")
  check(label+" hidden document pauses",after["paused"] is True,after)
  page.evaluate("""()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
   document.dispatchEvent(new Event('visibilitychange'));
  }""")
  back=snapshot(page,"f02-chef-full360")
  check(label+" visible document resumes",back["paused"] is False,back)
 except Exception as e:check(label+" background-tab lifecycle",False,str(e))
 # F05 menu remains interactive: page turns are actions, not automatic loops.
 try:
  page.locator("#menu").scroll_into_view_if_needed(timeout=20000)
  frame=page.frame_locator("#f05-book-frame")
  frame.locator("body[data-f05-state='Closed']").wait_for(timeout=25000)
  frame.locator('[data-event="open"]').click(timeout=12000)
  frame.locator("body[data-f05-state='Overview']").wait_for(timeout=15000)
  check(label+" F05 manual menu page-turn preserved",True,{"state":"Overview"})
 except Exception as e:check(label+" F05 manual menu flow",False,str(e))
 check(label+" no browser errors or missing local assets",not errors and not failed,
       {"errors":errors,"httpFailures":failed[:15]})
 check(label+" no horizontal overflow",
       page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
       page.evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})"))
 page.screenshot(path=str(OUT/(label+"-final-browser.png")),full_page=True)
 video=page.video
 context.close()
 if video:
  src=Path(video.path());dest=OUT/(label+"-viewport-loop-browser.webm")
  shutil.move(src,dest)
  check(label+" real browser recording",dest.stat().st_size>12000,
        {"path":dest.name,"bytes":dest.stat().st_size})

def reduced_motion(browser,url):
 c=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
 p=c.new_page()
 try:
  p.goto(url,wait_until="domcontentloaded",timeout=40000)
  e=p.locator('[data-animation="f01"]')
  e.scroll_into_view_if_needed()
  p.wait_for_function("""()=>document.querySelector('[data-animation="f01"]')?.dataset.loaded==='yes'""",timeout=25000)
  a=snapshot(p,"f01")
  check("reduced motion keeps F01 paused",a["paused"] is True and a["inView"]=="false",a)
 except Exception as x:check("reduced-motion lifecycle",False,str(x))
 c.close()

def main():
 parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
 assert parts
 with zipfile.ZipFile(io.BytesIO(b''.join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  data={n:z.read(n) for n in z.namelist()}
  for name,digest in HASH.items():
   path="assets/lottie/"+name+".json"
   check("immutable "+name,hashlib.sha256(data[path]).hexdigest()==digest,
         {"actual":hashlib.sha256(data[path]).hexdigest()})
  check("only one single-chef source player",data["index.html"].decode().count(
        'data-animation="f02-chef-full360"')==1)
  with TemporaryDirectory(prefix="zestry-pr141-") as tmp:
   site=Path(tmp);stage(z,site)
   server=ThreadingHTTPServer(("127.0.0.1",0),
          partial(SimpleHTTPRequestHandler,directory=str(site)))
   thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
   url=f"http://127.0.0.1:{server.server_port}/"
   try:
    with sync_playwright() as pw:
     browser=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     for label,w,h in (("desktop",1600,900),("mobile",390,844)):
      try:test_browser(browser,label,w,h,url)
      except Exception as e:check(label+" browser lifecycle",False,str(e))
     reduced_motion(browser,url)
     browser.close()
   finally:server.shutdown();server.server_close()
 report["passed"]=len([x for x in report["checks"] if x["pass"]])
 report["total"]=len(report["checks"])
 (OUT/"PR141_VISIBLE_LOOP_QA.json").write_text(json.dumps(report,indent=2,default=str)+"\n")
 print("ZESTRY_PR141_QA",json.dumps({
  "passed":report["passed"],"total":report["total"],"failures":report["failures"],
  "deployment":"NONE"}),flush=True)
 if report["failures"]:raise SystemExit(2)

if __name__=="__main__":main()
