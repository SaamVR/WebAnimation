#!/usr/bin/env python3
"""F05 original category intro artwork restoration acceptance in Chromium.

The restored canvas layer filter must draw the authored salad/burger/dessert/
drinks art during all Turn_* and Replay_* states. Keep existing page swipe
timing, complete 16-photo navigation, F03/F06, F07 exactly unchanged.
"""
from __future__ import annotations
import hashlib,io,importlib.util,json,shutil,threading,traceback,zipfile
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs/qa/owner-f05-original-intros-20261119"
OUT.mkdir(parents=True,exist_ok=True)
SRC=ROOT/"zestry-v3-editorial"

def load(path,name):
 spec=importlib.util.spec_from_file_location(name,SRC/path)
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 return m
origin=load("refine_f05_section_coffee_20261119.py","origin_f05")
previous=load("qa_f05_owner_recording_20261119.py","previous_f05")
motion=load("qa_visible_loops.py","motion_f05")
REPORT={"deployment":"NONE","status":"QA-source-only","checks":[],"failures":[],"screens":[]}
def test(name,condition,detail=None):
 ok=bool(condition)
 REPORT["checks"].append({"name":name,"pass":ok,"details":detail})
 if not ok: REPORT["failures"].append(name)
 print(("PASS " if ok else "FAIL ")+name+" "+json.dumps(detail,default=str)[:650],flush=True)
def source_checks(z):
 members=z.namelist()
 html=z.read("assets/f05_book.html").decode()
 index=z.read("index.html").decode()
 fit=z.read("assets/f05-fit-v8.css").decode()
 test("original category cover filter respects first-page state",
      "ZESTRY_F05_AUTHORED_CATEGORY_COVER_BEFORE_PHOTOS_20261119" in html and
      "&&!window.__f05BookIntro" in html and origin.DRAW_NEW not in html)
 test("restored original category intro marker once",html.count("ZESTRY_F05_RESTORE_APPROVED_CATEGORY_INTROS_20261119")==1)
 test("identical approved paper turns remain",all(t in html for t in (
  "ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119",
  "f05PaperNext",".74s","__zestryPriorUpdate","function moveDish(delta)")))
 test("original 52.75pct photo alignment remains", "ZESTRY_F05_PHOTO_FRAME_CENTER_20261119" in fit and "left:52.75%" in fit)
 test("original F03 coffee, F06 compact, F07 untouched",all(t in index for t in (
  "ZESTRY_F05_OWNER_FLIP_F06_COMPACT_F03_COFFEE_20261119",
  "ZESTRY_RESERVATION_WIDE_PANEL_20261119",
  "ZESTRY_VISIBLE_ONLY_FORWARD_REPEAT_20261119")))
 for name,digest in origin.MASTERS.items():
  test("approved source SHA256 "+name,hashlib.sha256(z.read(name)).hexdigest()==digest)

def test_frames(browser,device,w,h,url):
 ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1,
     reduced_motion="no-preference",record_video_dir=str(OUT),
     record_video_size={"width":w,"height":h})
 page=ctx.new_page();errors=[];bad=[]
 page.on("pageerror",lambda e:errors.append(str(e)))
 page.on("response",lambda r:bad.append([r.status,r.url]) if r.status>=400 and r.url.startswith(url) else None)
 try:
  page.goto(url,wait_until="domcontentloaded",timeout=40000)
  page.locator("#menu").scroll_into_view_if_needed(timeout=15000)
  page.wait_for_function("""()=>{
   return document.getElementById('f05-book-frame')?.contentWindow?.__f05Ready===true;
  }""",timeout=25000)
  for category in ["Starters","Main_Courses","Desserts","Drinks"]:
   state="Turn_Overview_to_"+category
   page.evaluate("""async state=>{
    const frame=document.getElementById('f05-book-frame');
    await frame.contentWindow.F05_QA.load('Overview');
    await frame.contentWindow.F05_QA.load(state);
   }""",state)
   page.wait_for_function("""s=>{
    const doc=document.querySelector('#f05-book-frame')?.contentDocument;
    const frame=document.querySelector('#f05-book-frame')?.contentWindow;
    return doc?.body.dataset.f05State===s && frame?.__f05LastFrame>=0;
   }""",arg=state,timeout=6000)
   page.wait_for_timeout(800)
   actual=page.evaluate("""()=>{
    const frame=document.querySelector('#f05-book-frame'),w=frame.contentWindow,
     d=frame.contentDocument,s=d.body.dataset.f05State;
    const c=d.querySelector('#art'),ctx=c.getContext('2d');
    const image=ctx.getImageData(0,0,c.width,c.height);
    let ink=0;
    for(let y=120;y<c.height-110;y+=16){
     for(let x=Math.floor(c.width*.51);x<c.width-95;x+=16){
      const p=(y*c.width+x)*4;
      if(image.data[p+3]>40) ink++;
     }
    }
    const unique=w.F05_QA.document?.layers
      ?.filter(x=>/PAGE_.*Food_|SVG_EXACT.*(Salad|Burger|Cake|Drink)/i.test(x.nm))
      ?.map(x=>x.nm.slice(0,90)).slice(0,20) || [];
    return {state:s,frame:w.F05_QA.frame,
     firstCategoryArtworkAllowed:!w.drawF05.toString().includes("startsWith('Turn_')"),
     authorFoodLayers:unique,
     inkSamplesRightPage:ink,
     sourceCanvas:[c.width,c.height],
     card:d.querySelector('#f05-photos .dish')?.textContent||null,
     frameHasSVG:!!w.F05_QA.document};
   }""")
   test(device+" "+category+" original illustrated opening visible",
       actual["state"]==state and actual["firstCategoryArtworkAllowed"] and
       actual["frameHasSVG"] and actual["inkSamplesRightPage"]>100 and
       actual["card"] is None,actual)
   name=device+"-original-"+category.replace("_","-")+"-intro.png"
   page.locator('#f05-book-frame').screenshot(path=str(OUT/name))
   REPORT["screens"].append(name)
   page.frame_locator("#f05-book-frame").locator('body[data-f05-state="'+category+'"]').wait_for(timeout=11000)
   illustrated=page.evaluate("""category=>{
    const frame=document.getElementById('f05-book-frame'),w=frame.contentWindow,
      doc=frame.contentDocument,d=w.F05_QA.document;
    return {state:doc.body.dataset.f05State,cover:w.__f05BookIntro,
      photo:!!doc.querySelector('.dish img'),
      illustrationLayers:d.layers.filter(x=>x.nm.startsWith('PAGE_'+category+'_Food_')
        &&x.ks?.o?.a===0&&x.ks.o.k===100).length,
      allIllustrationsNotFiltered:!w.drawF05.toString().includes('startsWith(\'Turn_\')')};
   }""",category)
   test(device+" "+category+" original FULL illustrated cover holds before dishes",
       illustrated["cover"] is True and illustrated["photo"] is False and
       illustrated["illustrationLayers"]>0 and illustrated["allIllustrationsNotFiltered"],
       illustrated)
   covername=device+"-original-"+category.replace("_","-")+"-FULL-COVER.png"
   page.locator('#f05-book-frame').screenshot(path=str(OUT/covername))
   REPORT["screens"].append(covername)
   page.frame_locator("#f05-book-frame").locator('[data-event="next"]').click(timeout=12000)
   page.frame_locator("#f05-book-frame").locator(
      'body[data-f05-state="Replay_'+category+'"]').wait_for(timeout=6000)
   page.frame_locator("#f05-book-frame").locator(
      'body[data-f05-state="'+category+'"]').wait_for(timeout=11000)
   page.wait_for_function("""category=>{
    const frame=document.querySelector('#f05-book-frame');
    const doc=frame?.contentDocument;
    return doc?.body.dataset.f05State===category &&
      frame?.contentWindow?.__f05BookIntro===false &&
      !!doc.querySelector('.dish img') &&
      doc.querySelector('.dish img').complete &&
      doc.querySelector('.dish img').naturalWidth>0;
   }""",arg=category,timeout=12000)
   after=page.evaluate("""()=>{
    const doc=document.querySelector('#f05-book-frame').contentDocument;
    return {state:doc.body.dataset.f05State,
     src:doc.querySelector('.dish img')?.getAttribute('src'),
     count:doc.querySelector('.book-page-index')?.textContent,
     leafStyle:!!doc.querySelector('style')?.textContent?.includes('f05PaperNext')};
   }""")
   expected={
    "Starters":"salad.jpg","Main_Courses":"pasta.jpg",
    "Desserts":"cake.jpg","Drinks":"coffee.jpg"
   }[category]
   test(device+" "+category+" first photo appears after original opening",
       after["src"]=="photos/"+expected and after["count"].strip()=="01 / 04",after)
  test(device+" no JS errors, bad fetches, or overflow",
       not errors and not bad and page.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
       {"errors":errors,"httpFailures":bad})
 finally:
  v=page.video
  ctx.close()
  if v:
   target=OUT/(device+"-original-category-intros.webm")
   shutil.move(Path(v.path()),target)
   test(device+" recorded browser opening transitions",target.stat().st_size>9000,target.name)

def main():
 parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  source_checks(z)
  with TemporaryDirectory(prefix="zestry-f05-original-") as temp:
   site=Path(temp)
   motion.stage(z,site)
   server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(site)))
   threading.Thread(target=server.serve_forever,daemon=True).start()
   try:
    url="http://127.0.0.1:"+str(server.server_port)+"/"
    with sync_playwright() as pw:
     try:b=pw.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     except Exception:b=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     for device,w,h in [("desktop",1600,900),("ipad",1024,768),("mobile",390,844)]:
      try:test_frames(b,device,w,h,url)
      except Exception as exc:
       traceback.print_exc()
       test(device+" complete category intro QA",False,str(exc))
     b.close()
   finally:server.shutdown();server.server_close()
 REPORT["passed"]=sum(x["pass"] for x in REPORT["checks"])
 REPORT["total"]=len(REPORT["checks"])
 (OUT/"ZESTRY_F05_ORIGINAL_CATEGORY_INTROS_QA.json").write_text(json.dumps(REPORT,indent=2)+"\n")
 print("ZESTRY_RESTORED_F05_CATEGORY_INTROS",json.dumps({"passed":REPORT["passed"],"total":REPORT["total"],"failures":REPORT["failures"],"deployment":"NONE"}),flush=True)
 if REPORT["failures"]:raise SystemExit(2)
if __name__=="__main__":main()
