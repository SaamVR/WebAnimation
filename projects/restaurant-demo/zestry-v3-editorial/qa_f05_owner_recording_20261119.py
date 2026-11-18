#!/usr/bin/env python3
"""Owner recording acceptance: ZESTRY F05 four-leaf book navigation, center
alignment, native category flips and responsive F06/F03 layout. No deployment."""
from __future__ import annotations
import io,json,zipfile,shutil,threading,hashlib,traceback
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs/qa/owner-f05-page-turn-20261119"
OUT.mkdir(parents=True,exist_ok=True)
REPORT={"deployment":"NONE","checks":[],"failures":[],"devices":[]}
def verify(name,yes,detail=None):
 yes=bool(yes)
 REPORT["checks"].append({"name":name,"passed":yes,"detail":detail})
 if not yes:REPORT["failures"].append(name)
 print(("PASS " if yes else "FAIL ")+name+" "+json.dumps(detail,default=str)[:700],flush=True)
 return yes
def stamp(page,name):
 page.screenshot(path=str(OUT/name),full_page=False)
def page_state(page):
 return page.evaluate("""()=>{
  const f=document.getElementById('f05-book-frame')?.contentDocument;
  if(!f)return {ready:false};
  const box=f.getElementById('f05-photos'),img=box?.querySelector('img'),
        stage=f.querySelector('.surface'), leaf=f.querySelector('.f05-paper-leaf');
  const s=f.body.dataset.f05State;
  const leafStyle=leaf?getComputedStyle(leaf):null;
  return {ready:!!f.defaultView?.__f05Ready,state:s,
   scene:f.defaultView?.F05_QA?.state,
   index:box?.querySelector('.book-page-index')?.textContent?.trim(),
   src:img?.getAttribute('src'),photoReady:!!img?.complete&&img.naturalWidth>0,
   dishes:box?.querySelectorAll('.dish').length,
   leaf:!!leaf,leafAnimation:leafStyle?.animationName,
   leafDuration:leafStyle?.animationDuration,
   oldFoodHidden:f.documentElement.innerHTML.includes('ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119'),
   busy:f.body.dataset.f05Busy,
   inset:box?getComputedStyle(box).left:null,
   leftPercent:stage&&box?(box.getBoundingClientRect().left-stage.getBoundingClientRect().left)/stage.getBoundingClientRect().width*100:null,
   widthPercent:stage&&box?box.getBoundingClientRect().width/stage.getBoundingClientRect().width*100:null};
 }""")
def wait_for_state(book,state,timeout=14000):
 book.locator('body[data-f05-state="'+state+'"]').wait_for(timeout=timeout)
def wait_index(page,n,timeout=12000):
 page.wait_for_function("""number=>{
  const d=document.getElementById('f05-book-frame')?.contentDocument;
  const p=d?.querySelector('.book-page-index')?.textContent?.trim();
  return p===String(number).padStart(2,'0')+' / 04'
 }""",arg=n,timeout=timeout)
def check_scenes(page,label):
 page.locator('#process').scroll_into_view_if_needed(timeout=15000)
 page.wait_for_function("""()=>{
  const e=document.querySelector('[data-animation="f06"]');
  return e?.dataset.loaded==='yes'&&!!e.querySelector('svg')&&
   !!window.lottie?.getRegisteredAnimations?.().find(a=>a.wrapper===e);
 }""",timeout=25000)
 page.evaluate("""()=>{
  const e=document.querySelector('[data-animation="f06"]');
  const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===e);
  a.goToAndStop(Math.min(160,a.totalFrames-1),true);
 }""")
 p=page.evaluate("""()=>{
  const e=document.getElementById('process'),v=e.querySelector('.process-visual .anim'),r=e.getBoundingClientRect();
  return {height:r.height,viewport:innerHeight,visual:v.getBoundingClientRect().height,body:document.documentElement.scrollWidth,
   label:document.getElementById('process-heading')?.innerText};
 }""")
 verify(label+" F06 section removes excess white height",
        p["visual"]<455 and p["height"]<790 and p["body"]<=page.viewport_size["width"]+2,p)
 stamp(page,label+"-F06-compact.png")
 page.locator('#coffee').scroll_into_view_if_needed(timeout=15000)
 page.wait_for_function("""()=>{
  const e=document.querySelector('[data-animation="f03"]');
  return e?.dataset.loaded==='yes'&&!!e.querySelector('svg')&&
   !!window.lottie?.getRegisteredAnimations?.().find(a=>a.wrapper===e);
 }""",timeout=25000)
 c=page.evaluate("""()=>{
  const e=document.getElementById('coffee'),b=getComputedStyle(e);
  return {background:b.backgroundImage,text:document.getElementById('coffee-heading')?.innerText,
    width:e.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth};
 }""")
 verify(label+" coffee gradient darker behind original steam illustration",
        "linear-gradient" in c["background"] and "206, 161, 132" in c["background"] and
        c["overflow"]<=page.viewport_size["width"]+2,c)
 # Frame a late coffee Lottie drawing to check steam contrast without editing JSON.
 page.evaluate("""()=>{
  const e=document.querySelector('[data-animation="f03"]');
  const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===e);
  if(a)a.goToAndStop(Math.max(0,a.totalFrames-5),true);
 }""")
 stamp(page,label+"-F03-steam-contrast.png")
 page.evaluate("""()=>{
  const e=document.querySelector('[data-animation="f03"]');
  const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===e);
  if(a)a.goToAndStop(Math.max(0,a.totalFrames-20),true);
 }""")
 stamp(page,label+"-F03-near-end-steam.png")
def run_device(browser,label,w,h,url):
 ctx=browser.new_context(viewport={"width":w,"height":h},
       record_video_dir=str(OUT),record_video_size={"width":w,"height":h},
       reduced_motion="no-preference")
 page=ctx.new_page();errs=[];httpErrors=[]
 page.on('pageerror',lambda e:errs.append(str(e)))
 page.on('response',lambda r:httpErrors.append([r.status,r.url]) if r.status>=400 and r.url.startswith(url) else None)
 try:
  page.goto(url,wait_until="domcontentloaded",timeout=45000)
  page.locator('#menu').scroll_into_view_if_needed(timeout=15000)
  book=page.frame_locator('#f05-book-frame')
  wait_for_state(book,"Closed",25000)
  book.locator('[data-event="open"]').click(timeout=12000)
  wait_for_state(book,"Overview",15000)
  book.locator('[data-event="select_starters"]').click(timeout=12000)
  wait_for_state(book,"Turn_Overview_to_Starters",6000)
  start=page_state(page)
  verify(label+" original 2.7s category-flip state used",
      start["state"]=="Turn_Overview_to_Starters" and not start["src"],start)
  wait_for_state(book,"Starters",14000)
  wait_index(page,1)
  first=page_state(page)
  verify(label+" Starters page 1 photograph decoded",
      first["photoReady"] and first["dishes"]==1 and
      first["src"]=="photos/salad.jpg" and first["state"]=="Starters",first)
  verify(label+" photo centered inside right-hand book page",
      first["leftPercent"] is not None and 52.0<first["leftPercent"]<53.6,
      first)
  stamp(page,label+"-starter-page1.png")
  book.locator('[data-event="next"]').click(timeout=12000)
  page.wait_for_function("""()=>{
    return !!document.getElementById('f05-book-frame')?.contentDocument?.querySelector('.f05-paper-leaf')
  }""",timeout=4000)
  progress=page_state(page)
  verify(label+" dish leaf rotates entire page, not the photo alone",
      progress["leaf"] and progress["leafAnimation"]=="f05PaperNext" and
      progress["leafDuration"]=="0.74s",progress)
  stamp(page,label+"-dish-leaf-midturn.png")
  book.locator('.f05-paper-leaf').wait_for(state="detached",timeout=5000)
  wait_index(page,2)
  second=page_state(page)
  verify(label+" second starter displays Greek Feta Salad only",
      second["src"]=="photos/greek.jpg" and second["photoReady"] and
      not second["leaf"],second)
  for n in (3,4):
   book.locator('[data-event="next"]').click(timeout=10000)
   book.locator('.f05-paper-leaf').wait_for(state="detached",timeout=5000)
   wait_index(page,n)
  fourth=page_state(page)
  verify(label+" four genuine starter dishes before boundary",
      fourth["src"]=="photos/caesar.jpg" and fourth["index"]=="04 / 04",fourth)
  stamp(page,label+"-starter-page4.png")
  book.locator('[data-event="next"]').click(timeout=12000)
  wait_for_state(book,"Turn_Starters_to_Main_Courses",6500)
  bridge=page_state(page)
  verify(label+" next at fourth item triggers original category page turn",
      bridge["state"]=="Turn_Starters_to_Main_Courses" and
      bridge["index"]!="01 / 04" and bridge["src"]!="photos/salad.jpg",bridge)
  stamp(page,label+"-starter-to-main-flip.png")
  wait_for_state(book,"Main_Courses",14000)
  wait_index(page,1)
  main=page_state(page)
  verify(label+" Main Courses lands on first correct dish, no starter flash",
      main["src"]=="photos/pasta.jpg" and main["photoReady"] and main["index"]=="01 / 04",main)
  stamp(page,label+"-mains-page1.png")
  book.locator('[data-event="previous"]').click(timeout=10000)
  wait_for_state(book,"Turn_Main_Courses_to_Starters",6500)
  wait_for_state(book,"Starters",14000)
  wait_index(page,4)
  prev=page_state(page)
  verify(label+" previous from first main returns to LAST starter item",
      prev["src"]=="photos/caesar.jpg" and prev["index"]=="04 / 04",prev)
  book.locator('[data-event="home"]').click(timeout=10000)
  wait_for_state(book,"Overview",15000)
  for category,event,photo in [
    ("Desserts","select_desserts","cake.jpg"),
    ("Drinks","select_drinks","coffee.jpg")
  ]:
   book.locator('[data-event="'+event+'"]').click(timeout=10000)
   wait_for_state(book,category,14000)
   wait_index(page,1)
   actual=page_state(page)
   verify(label+" category "+category+" first dish correct",
          actual["src"]=="photos/"+photo and actual["photoReady"],actual)
   book.locator('[data-event="home"]').click(timeout=10000)
   wait_for_state(book,"Overview",14000)
  # User can still add a photograph item to the demo bag.
  book.locator('[data-event="select_main"]').click(timeout=10000)
  wait_for_state(book,"Main_Courses",14000)
  book.locator('.dish').first.click(timeout=14000)
  page.wait_for_function("""()=>document.getElementById('bag-count')?.textContent.trim()==='1'""",timeout=10000)
  verify(label+" demo add-to-bag still works",True)
  verify(label+" no browser exceptions/HTTP errors/sideways scroll",
        not errs and not httpErrors and page.evaluate("document.documentElement.scrollWidth<=innerWidth+2"),
        {"errors":errs,"responses":httpErrors})
  check_scenes(page,label)
 finally:
  video=page.video
  ctx.close()
  if video:
   src=Path(video.path());dest=OUT/(label+"-F05-full-interaction.webm")
   shutil.move(src,dest)
   verify(label+" browser recording",dest.stat().st_size>12000,{"file":dest.name,"size":dest.stat().st_size})
def main():
 parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
 assert parts
 with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
  assert z.testzip() is None
  index=z.read("index.html").decode();book=z.read("assets/f05_book.html").decode()
  verify("all source-level revision markers present",
         "ZESTRY_F05_OWNER_FLIP_F06_COMPACT_F03_COFFEE_20261119" in index and
         "ZESTRY_F05_OWNER_NATURAL_PAPER_TURN_20261119" in book and
         "ZESTRY_RESERVATION_WIDE_PANEL_20261119" in index)
  verify("owner F05 master Lottie unchanged",
         hashlib.sha256(z.read("assets/f05_book.lottie")).hexdigest()=="3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645")
  from importlib.util import spec_from_file_location,module_from_spec
  path=ROOT/"zestry-v3-editorial/qa_visible_loops.py"
  spec=spec_from_file_location("motion_qa",path);motion=module_from_spec(spec);spec.loader.exec_module(motion)
  with TemporaryDirectory(prefix="zestry-f05-owner-") as tmp:
   site=Path(tmp);motion.stage(z,site)
   server=ThreadingHTTPServer(("127.0.0.1",0),
     partial(SimpleHTTPRequestHandler,directory=str(site)))
   threading.Thread(target=server.serve_forever,daemon=True).start()
   try:
    url=f"http://127.0.0.1:{server.server_port}/"
    with sync_playwright() as pw:
     try:browser=pw.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     except Exception:browser=pw.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
     for name,w,h in (("desktop",1600,900),("ipad",1024,768),("mobile",390,844)):
      try:run_device(browser,name,w,h,url)
      except Exception as e:
       traceback.print_exc()
       verify(name+" complete acceptance suite",False,str(e))
     browser.close()
   finally:server.shutdown();server.server_close()
 REPORT["passed"]=sum(x["passed"] for x in REPORT["checks"])
 REPORT["total"]=len(REPORT["checks"])
 (OUT/"ZESTRY_F05_OWNER_PAGE_TURN_QA.json").write_text(json.dumps(REPORT,indent=2)+"\n")
 print("ZESTRY_F05_OWNER_RESULT",json.dumps({"passed":REPORT["passed"],"total":REPORT["total"],"failures":REPORT["failures"],"deployment":"NONE"}),flush=True)
 if REPORT["failures"]:raise SystemExit(2)
if __name__=="__main__":main()
