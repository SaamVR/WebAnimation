#!/usr/bin/env python3
"""Native-Chromium acceptance for ZESTRY's approved reservation modal refinement.

Tests desktop, tablet/iPad, mobile and 320px widths with original shipped
F07, field geometry, screenshot evidence and demo reservation lifecycle.
Never touches Render or actual booking providers.
"""
from __future__ import annotations
import io,hashlib,json,shutil,threading,zipfile,importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/owner-reservation-modal-20261119"
OUT.mkdir(parents=True,exist_ok=True)
PREV=ROOT/"zestry-v3-editorial/qa_visible_loops.py"
spec=importlib.util.spec_from_file_location("existing_qa",PREV)
existing=importlib.util.module_from_spec(spec);spec.loader.exec_module(existing)
REPORT={"pr":141,"deployment":"NONE","screens":[],"checks":[],"failures":[]}
def ck(name,passed,detail=None):
 good=bool(passed);REPORT["checks"].append({"name":name,"passed":good,"detail":detail})
 if not good:REPORT["failures"].append(name)
 print(("PASS" if good else "FAIL"),name,json.dumps(detail,default=str)[:1300],flush=True)
 return good
def scene_snapshot(page):
 return page.evaluate("""()=>{
  const $=s=>document.querySelector(s), rect=e=>{
    if(!e)return null;
    const b=e.getBoundingClientRect();
    return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height};
  }, overlap=(a,b)=>{
    if(!a||!b)return true;
    return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  };
  const m=$('#modal'),d=$('#reservation-helper'),art=$('.reservation-illustration'),
      host=$('#reservation-modal-animation'),
      a=window.lottie?.getRegisteredAnimations?.().find(x=>x.wrapper===host);
  const rs={
    modal:rect(m),header:rect(m?.querySelector('.modalhead')),
    title:rect($('#modal-title')),note:rect(d),art:rect(art),
    close:rect(m?.querySelector('.modalhead .x')),button:rect($('#booking-form .btn')),
    date:rect($('#date')),time:rect($('#time')),
    guests:rect($('#guests')),name:rect($('#guestname')),email:rect($('#email'))
  };
  const controls=['date','time','guests','name','email'].map(key=>rs[key]);
  return {
    viewport:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,
    modalScrollWidth:m?.scrollWidth,modalClientWidth:m?.clientWidth,
    className:m?.className,opened:m?.classList.contains('active'),
    ariaDescription:m?.getAttribute('aria-describedby'),
    noteText:d?.textContent,titleText:$('#modal-title')?.textContent,
    titleSize:parseFloat(getComputedStyle($('#modal-title')).fontSize),
    noteSize:d?parseFloat(getComputedStyle(d).fontSize):0,
    headerBG:getComputedStyle(m?.querySelector('.modalhead')).backgroundColor,
    illustrationBG:art?getComputedStyle(art).backgroundImage:null,
    gridColumns:getComputedStyle($('#booking-form .formrow')).gridTemplateColumns,
    formGap:getComputedStyle($('#booking-form')).rowGap,
    animation:{
     present:!!host, svg:!!host?.querySelector('svg'),playing:a&&!a.isPaused,
     loop:a?.loop,direction:a?.playDirection,frame:a?.currentFrame,
     inView:host?.dataset.motionInView,loops:host?.dataset.motionLoops,
     totalFrames:a?.totalFrames
    },
    overlap:{
     dateTime:overlap(rs.date,rs.time),
     guestsName:overlap(rs.guests,rs.name),
     artTitle:overlap(rs.art,rs.title),
     artNote:overlap(rs.art,rs.note),
     artClose:overlap(rs.art,rs.close)
    },
    rects:rs,
    controlsInsideModal:controls.every(b=>b&&b.left>=rs.modal.left-1&&b.right<=rs.modal.right+1)
  };
 }""")
def open_booking(page,reduced=False):
 page.locator('[data-book]:visible').first.click(timeout=15000)
 page.locator('#booking-form').wait_for(state="visible",timeout=15000)
 page.wait_for_function("""reduced=>{
  const e=document.getElementById('reservation-modal-animation');
  const a=lottie?.getRegisteredAnimations?.().find(x=>x.wrapper===e);
  return !!a&&!!e.querySelector('svg')&&
   e.dataset.motionInView===(reduced?'false':'true');
 }""",arg=reduced,timeout=25000)
 return scene_snapshot(page)
def rect_gap(a,b):
 # Positive gap if no overlap on the horizontal axis.
 return b["left"]-a["right"]
def test_view(browser,label,width,height,url,reduced=False):
 kwargs={"viewport":{"width":width,"height":height},
         "device_scale_factor":1,"reduced_motion":"reduce" if reduced else "no-preference"}
 if label in ("desktop","mobile") and not reduced:
  kwargs.update(record_video_dir=str(OUT),record_video_size={"width":width,"height":height})
 context=browser.new_context(**kwargs);page=context.new_page()
 errors=[];bad=[];posted=[]
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.on("response",lambda r:bad.append([r.status,r.url]) if r.status>=400 and
         r.url.startswith(url) else None)
 page.on("request",lambda r:posted.append([r.method,r.url]) if r.method!="GET" else None)
 try:
  page.goto(url,wait_until="domcontentloaded",timeout=45000)
  first=open_booking(page,reduced)
  dimensions={"viewport":first["viewport"],"rects":first["rects"],
              "overlap":first["overlap"],"columns":first["gridColumns"]}
  ck(label+" original date, time, guests, name and email controls",
    all(page.locator('#booking-form '+s).count()==1 for s in ('#date','#time','#guests','#guestname','#email')),
    dimensions)
  ck(label+" note is directly under title with smaller type",
    first["ariaDescription"]=="reservation-helper" and
    first["noteText"]=="This is a simulated reservation request. No real restaurant availability is checked." and
    first["noteSize"]<first["titleSize"] and
    first["rects"]["note"]["top"]>=first["rects"]["title"]["bottom"]-2,
    {"titleSize":first["titleSize"],"noteSize":first["noteSize"],
     "title":first["rects"]["title"],"note":first["rects"]["note"]})
  ck(label+" visually branded warm red header and yellow animation panel",
    first["headerBG"]=="rgb(195, 40, 45)" and
    "gradient" in first["illustrationBG"] and
    "reservation-dialog" in first["className"],
    {"headerBG":first["headerBG"],"illustrationBG":first["illustrationBG"]})
  ck(label+" animation in header right, no text or close overlap",
    first["rects"]["art"]["left"]>first["rects"]["title"]["left"] and
    not any(first["overlap"][key] for key in ("artTitle","artNote","artClose")),
    {"rects":first["rects"],"overlap":first["overlap"]})
  panel=first["rects"]["art"]
  banner_target_width=320 if width>600 else (100 if width>350 else 95)
  ck(label+" illustration occupies wide marked header area",
    panel["width"]>=banner_target_width and
    panel["height"]>=55 and
    panel["width"]/panel["height"]>= (2.2 if width>600 else 1.55) and
    panel["right"]<=first["rects"]["header"]["right"]-8 and
    panel["left"]>first["rects"]["header"]["left"]+first["rects"]["header"]["width"]*.43,
    {"art":panel,"header":first["rects"]["header"],
     "minimumWidth":banner_target_width,"aspect":panel["width"]/panel["height"]})
  ck(label+" controls fit modal and never overlap",
    first["controlsInsideModal"] and
    not first["overlap"]["dateTime"] and not first["overlap"]["guestsName"] and
    first["modalScrollWidth"]<=first["modalClientWidth"]+2,
    dimensions)
  ck(label+" responsive form arrangement and breathing space",
    first["rects"]["date"]["width"]>=100 and
    first["rects"]["date"]["height"]>=48 and
    first["rects"]["time"]["height"]>=48 and
    (first["rects"]["date"]["right"]+14<=first["rects"]["time"]["left"] if width>600 else
     first["rects"]["date"]["bottom"]+14<=first["rects"]["time"]["top"]),
    dimensions)
  ck(label+" modal within viewport bounds",
    first["rects"]["modal"]["left"]>=-1 and first["rects"]["modal"]["right"]<=width+1 and
    first["rects"]["modal"]["top"]>=-1 and first["rects"]["modal"]["bottom"]<=height+1 and
    first["scrollWidth"]<=width+2,dimensions)
  ck(label+" correct original F07 animation with viewport policy",
    first["animation"]["present"] and first["animation"]["svg"] and
    first["animation"]["loop"] is True and first["animation"]["direction"]==1 and
    first["animation"]["totalFrames"]==228 and
    (not first["animation"]["playing"] if reduced else first["animation"]["playing"]),
    first["animation"])
  page.screenshot(path=str(OUT/(label+"-reservation-modal.png")),full_page=True)
  REPORT["screens"].append(label+"-reservation-modal.png")
  if not reduced:
   page.evaluate("""()=>{
    const h=document.getElementById('reservation-modal-animation');
    const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===h);
    a.setSpeed(8);a.goToAndPlay(a.totalFrames-13,true);
   }""")
   page.wait_for_function("""()=>{
    const h=document.getElementById('reservation-modal-animation');
    return Number(h?.dataset.motionLoops||0)>=1;
   }""",timeout=10000)
   ck(label+" F07 modal animation actually repeats forward",
      page.evaluate("""()=>{
        const h=document.getElementById('reservation-modal-animation');
        const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===h);
        return a.loop===true&&a.playDirection===1&&!a.isPaused
      }"""))
   page.evaluate("""()=>{
    const h=document.getElementById('reservation-modal-animation');
    lottie.getRegisteredAnimations().find(x=>x.wrapper===h).setSpeed(1);
   }""")
   page.locator('#modal .modalhead .x').click(timeout=12000)
   page.wait_for_function("""()=>{
    const m=document.getElementById('modal');
    const h=document.getElementById('reservation-modal-animation');
    const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===h);
    return !m.classList.contains('active')&&a?.isPaused===true;
   }""",timeout=8000)
   ck(label+" F07 modal pauses on close",True)
   # Reopen and submit, verifying cleanup of old modal animation.
   open_booking(page)
   ck(label+" reopen retains exactly one active reservation illustration",
      page.locator('#reservation-modal-animation').count()==1 and
      page.evaluate("""()=>{
       const host=document.getElementById('reservation-modal-animation');
       return lottie.getRegisteredAnimations().filter(a=>a.wrapper===host).length===1;
      }"""))
   page.locator('#time').select_option(label="6:00 PM")
   page.locator('#guestname').fill("ZESTRY QA Guest")
   page.locator('#email').fill("test@example.com")
   page.locator('#booking-form .btn').click(timeout=15000)
   page.locator('#confirm-player svg').wait_for(state="attached",timeout=25000)
   ck(label+" simulated booking confirmation preserved",
      "Sample table request" in page.locator('#modal-title').inner_text() and
      "Sample table request received" in page.locator('.confirmbox .success').inner_text() and
      page.locator('#reservation-helper').count()==0 and
      page.locator('#modal.reservation-dialog').count()==0 and
      page.locator('#reservation-modal-animation').count()==0)
  ck(label+" no unexpected requests, local errors or overflow",
      not errors and not bad and not posted and
      page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+2"),
      {"errors":errors,"badResponses":bad,"nonGet":posted})
 finally:
  video=page.video
  context.close()
  if video:
   src=Path(video.path());dest=OUT/(label+"-reservation-interaction.webm")
   shutil.move(src,dest)
   ck(label+" browser capture",dest.stat().st_size>12000,{"video":dest.name,"size":dest.stat().st_size})
def main():
 parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  html=z.read("index.html").decode()
  assert "ZESTRY_BOOK_A_TABLE_EDITORIAL_20261119" in html
  for name,digest in (
   ("f01","7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"),
   ("f02-chef-full360","e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa"),
   ("f07","a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b")):
   ck("unchanged approved "+name,
      hashlib.sha256(z.read("assets/lottie/"+name+".json")).hexdigest()==digest)
  with TemporaryDirectory(prefix="zestry-reservation-qa-") as tmp:
   site=Path(tmp);existing.stage(z,site)
   httpd=ThreadingHTTPServer(("127.0.0.1",0),
           partial(SimpleHTTPRequestHandler,directory=str(site)))
   threading.Thread(target=httpd.serve_forever,daemon=True).start()
   try:
    url="http://127.0.0.1:"+str(httpd.server_port)+"/"
    with sync_playwright() as pw:
     try:b=pw.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     except Exception:b=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     for name,w,h,reduced in (
      ("desktop",1600,900,False),("ipad",1024,768,False),
      ("mobile",390,844,False),("compact",320,690,False),
      ("reduced",390,844,True)):
      try:test_view(b,name,w,h,url,reduced)
      except Exception as e:
       import traceback;traceback.print_exc()
       ck(name+" browser suite",False,str(e))
     b.close()
   finally:httpd.shutdown();httpd.server_close()
 REPORT["passed"]=sum(x["passed"] for x in REPORT["checks"])
 REPORT["total"]=len(REPORT["checks"])
 (OUT/"PR141_RESERVATION_MODAL_QA.json").write_text(json.dumps(REPORT,indent=2,default=str)+"\n")
 print("ZESTRY_RESERVATION_MODAL_QA",json.dumps({"passed":REPORT["passed"],
   "total":REPORT["total"],"failures":REPORT["failures"],"deployment":"NONE"}),flush=True)
 if REPORT["failures"]:raise SystemExit(2)
if __name__=="__main__":main()
