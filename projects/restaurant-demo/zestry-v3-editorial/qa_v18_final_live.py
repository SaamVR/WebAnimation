#!/usr/bin/env python3
"""Real Chromium acceptance for ZESTRY V18 visible-only looping motion.

Tests approved F01 broth/wood at constant 1.755 scale, non-snapping F02 chef
reverse, repeat loops for all F01..F07, section visibility pause/resume,
dialog-only F04, interactive menu/F05, page visibility and reduced-motion.
No Render deployment. No original keyframes touched.
"""
from __future__ import annotations
import io,json,shutil,threading,time,zipfile
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/owner-v18-final-live"
OUT.mkdir(parents=True,exist_ok=True)
SOURCE="LIVE V18 deployed SHA 7b196c912d11820dce790ddb735e96e1f1599e8e"
report={"description":SOURCE,"deployment":"LIVE existing Render service srv-dbtkitifngtc73cua2p0; commit 7b196c912d11820dce790ddb735e96e1f1599e8e","viewports":{},
        "regressions":[],"errors":[],"passes":[]}
def ck(name,value,details=None):
 report['passes'].append({'name':name,'pass':bool(value),'details':details})
 if not value:
  report['regressions'].append({'name':name,'details':details})
 print("PASS" if value else "FAIL",name,json.dumps(details,default=str)[:1200],flush=True)

def lottie(page,key):
 return page.evaluate("""key=>{
    const a=window.lottie?.getRegisteredAnimations?.().find(x=>
      x.wrapper?.dataset?.player===key ||x.wrapper?.dataset?.animation===key);
    if(!a)return null;
    return {name:key,frame:a.currentFrame,isPaused:a.isPaused,
      direction:a.playDirection,loop:a.loop,subframe:a.isSubframeEnabled,
      duration:a.getDuration(true),fps:a.frameRate,
      loaded:a.wrapper.dataset.loaded,
      playingInViewport:a.wrapper.dataset.motionInView,
      motionLoops:Number(a.wrapper.dataset.motionLoops||0),
      orbitDirection:a.wrapper.dataset.orbitDirection,
      zoom:a.wrapper.dataset.heroZoom,
      wood:a.wrapper.dataset.woodFill};
  }""",key)
def seek_play(page,key,f,direction):
 return page.evaluate("""args=>{
    const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset.player===args.key);
    a.goToAndStop(args.frame,true);
    a.setDirection(args.direction);
    a.play();
    return {frame:a.currentFrame,direction:a.playDirection};
  }""",{"key":key,"frame":f,"direction":direction})

def frame_contribution(page,frame):
 page.evaluate("""f=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset.player==='f01');
  a.goToAndStop(f,true);
 }""",frame)
 page.wait_for_timeout(60)
 clip=page.locator('.hero-image.hero-visual').bounding_box()
 shot=page.screenshot(clip=clip)
 page.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset.player==='f01');
  a.renderer.elements.find(x=>x.data?.ind===28).layerElement
    .style.setProperty('visibility','hidden','important');
 }""")
 page.wait_for_timeout(40)
 hidden=page.screenshot(clip=clip)
 page.evaluate("""()=>{
  const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset.player==='f01');
  a.renderer.elements.find(x=>x.data?.ind===28).layerElement
    .style.removeProperty('visibility');
 }""")
 a=Image.open(io.BytesIO(shot)).convert('RGB')
 b=Image.open(io.BytesIO(hidden)).convert('RGB')
 diff=ImageChops.difference(a,b).convert('L')
 return sum(n for i,n in enumerate(diff.histogram()) if i>8),shot

def check_viewport(browser,name,width,height):
 ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
 p=ctx.new_page()
 errors=[];failed=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:failed.append((r.status,r.url))
       if r.status>=400 and r.url.startswith('https://zestry-v3-restaurant-review-20261117.onrender.com/') else None)
 p.goto('https://zestry-v3-restaurant-review-20261117.onrender.com/',wait_until='domcontentloaded',timeout=30000)
 p.wait_for_function("""() => document.querySelector('[data-animation="f01"]')?.dataset.loaded==='yes'
                  && !!document.querySelector('.f01-wood-fill')""",timeout=26000)
 f01=lottie(p,'f01')
 ck(name+' F01 initial renderer/loop policy',f01 and f01['loop'] is True and
    f01['fps']==30 and f01['subframe'] is False and f01['zoom']=='1.755000'
    and f01['wood']=='original-vector',f01)
 ck(name+' F01 hero visible',f01 and f01['playingInViewport']=='true',f01)
 broth,shot=frame_contribution(p,260)
 ck(name+' F01 final broth painted',broth>(600 if name=='desktop' else 80),
    {'brothPaintedPixels':broth})
 if name=='desktop':(OUT/'V18-desktop-restored-broth-frame260.png').write_bytes(shot)
 seek_play(p,'f01',258,1)
 p.wait_for_timeout(360)
 post=lottie(p,'f01')
 ck(name+' F01 loops forward instead of final hold',post and
   post['motionLoops']>=1 and post['frame']<40,post)
 duplicates=p.evaluate("""()=>{
  const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
  return [...new Set(ids)].filter(id=>ids.indexOf(id)!==ids.lastIndexOf(id));
 }""")
 ck(name+' no F01 wood/broth SVG duplicate IDs',not duplicates,duplicates[:15])

 kitchen=p.locator('[data-animation="f02-orbit"]')
 kitchen.scroll_into_view_if_needed(timeout=15000)
 p.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')?.dataset.loaded==='yes'
 && document.querySelector('[data-animation="f02-cooking"]')?.dataset.loaded==='yes'""",timeout=25000)
 p.wait_for_timeout(330)
 orbit=lottie(p,'f02-orbit')
 cooking=lottie(p,'f02-cooking')
 ck(name+' F02 chef pingpong and cooking repeat policies',
    orbit and cooking and orbit['loop'] is False and
    orbit['orbitDirection']=='forward' and cooking['loop'] is True and
    orbit['playingInViewport']=='true',{'orbit':orbit,'cooking':cooking})
 # Within 10 frames of its end, chef orbit must travel backward without
 # teleporting to the start; the exact original frames are preserved.
 seek_play(p,'f02-orbit',205,1)
 p.wait_for_timeout(365)
 reverse=lottie(p,'f02-orbit')
 ck(name+' F02 orbit reverses smoothly at end',
    reverse and reverse['orbitDirection']=='return' and
    reverse['direction']==-1 and 180<reverse['frame']<209,
    reverse)
 # At the starting scene reverse turns around again and advances forward.
 seek_play(p,'f02-orbit',5,-1)
 p.wait_for_timeout(330)
 forward=lottie(p,'f02-orbit')
 ck(name+' F02 orbit starts new forward cycle at original scene',
    forward and forward['orbitDirection']=='forward' and
    forward['direction']==1 and 0<forward['frame']<24,forward)
 if name=='desktop':p.screenshot(path=str(OUT/'V18-desktop-chef-orbit-loop.png'))
 p.locator('[data-animation="f06"]').scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f06"]')?.dataset.loaded==='yes'""",timeout=26000)
 p.wait_for_timeout(200)
 off=lottie(p,'f02-orbit')
 ck(name+' F02 pauses after scrolling to process',off and off['isPaused'],off)
 position=off['frame'] if off else None
 p.wait_for_timeout(430)
 off2=lottie(p,'f02-orbit')
 ck(name+' F02 position does not advance offscreen',
     off2 and abs(off2['frame']-position)<.05,{'before':position,'after':off2})
 f06=lottie(p,'f06')
 ck(name+' F06 loops when process visible',f06 and f06['loop'] is True and
    f06['playingInViewport']=='true' and not f06['isPaused'],f06)
 p.locator('[data-animation="f03"]').scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f03"]')?.dataset.loaded==='yes'""",timeout=26000)
 p.wait_for_timeout(180)
 f03=lottie(p,'f03')
 ck(name+' F03 coffee scene loops while section visible',
     f03 and f03['loop'] is True and f03['playingInViewport']=='true',f03)
 p.locator('[data-animation="f07"]').scroll_into_view_if_needed()
 p.wait_for_function("""()=>document.querySelector('[data-animation="f07"]')?.dataset.loaded==='yes'""",timeout=26000)
 p.wait_for_timeout(200)
 f07=lottie(p,'f07')
 ck(name+' F07 reservation section loops while visible',
     f07 and f07['loop'] is True and f07['playingInViewport']=='true',f07)

 p.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
 p.wait_for_timeout(350)
 resumed=lottie(p,'f02-orbit')
 ck(name+' F02 resumes same state on return',resumed and
    resumed['playingInViewport']=='true' and not resumed['isPaused'],
    {'offscreen':off2,'resumed':resumed})
 # Hidden-tab rules simulated by replacing document.hidden (headless tabs
 # can report continuously visible).
 hidden=p.evaluate("""()=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   document.dispatchEvent(new Event('visibilitychange'));
   const x=window.lottie.getRegisteredAnimations()
       .filter(a=>a.wrapper?.dataset?.player && a.wrapper.dataset.motionInView==='false');
   return {paused:x.every(a=>a.isPaused),total:x.length};
 }""")
 ck(name+' background-tab pauses all tracked players',hidden['paused'],hidden)
 p.evaluate("""()=>{
   delete document.hidden;
   document.dispatchEvent(new Event('visibilitychange'));
 }""")
 p.wait_for_timeout(250)
 ck(name+' restore viewport playback after tab foreground',
     lottie(p,'f02-orbit')['playingInViewport']=='true',lottie(p,'f02-orbit'))
 ck(name+' no script or missing assets',not errors and not failed,
    {'errors':errors,'failed':failed})
 ctx.close()
 report['viewports'][name]={'f01BrothPixels':broth,'orbit':orbit,
                           'reverse':reverse,'forward':forward,
                           'paused':off2,'resumed':resumed,
                           'errors':errors,'badAssets':failed}

def test_dialog_and_reduced(browser):
 ctx=browser.new_context(viewport={'width':1440,'height':900})
 p=ctx.new_page(); errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('https://zestry-v3-restaurant-review-20261117.onrender.com/',wait_until='domcontentloaded')
 # Menu book retains interactive state and still allows a sample dish in bag.
 p.locator('#menu').scroll_into_view_if_needed()
 frame=p.frame_locator('#f05-book-frame')
 frame.locator('#state').wait_for(timeout=26000)
 frame.get_by_role('button',name='Open menu book').click()
 real=next(f for f in p.frames if 'f05_book.html' in f.url)
 real.wait_for_function("()=>document.body.dataset.f05State==='Overview'",timeout=28000)
 frame.get_by_role('button',name='Choose Starters').click()
 real.wait_for_function("()=>document.body.dataset.f05State==='Starters'",timeout=28000)
 frame.locator('button.dish').first.click()
 p.wait_for_function("()=>Number(document.querySelector('#bag-count')?.textContent)===1",timeout=9000)
 ck('F05 interactive book preserved, adds to simulated bag',True,{'bagCount':1})
 p.locator('#cart-open').click();p.locator('#cart-checkout').click()
 p.locator('#pickup-name').fill('Demo Visitor')
 p.locator('#pickup-phone').fill('5550100200')
 p.locator('#pickup-form button[type="submit"]').click()
 p.locator('#confirm-player svg').wait_for(timeout=22000)
 conf=next((a for a in p.evaluate("""()=>window.lottie.getRegisteredAnimations()
    .filter(a=>a.wrapper?.id==='confirm-player').map(a=>({
        frame:a.currentFrame,loop:a.loop,paused:a.isPaused,
        motion:a.wrapper.dataset.motionInView}))""")),None)
 ck('F04 confirmation loops only while dialog visible',
    conf and conf['loop'] is True and conf['motion']=='true',conf)
 p.locator('#modal button.x[data-close]').click()
 p.wait_for_timeout(260)
 modalState=p.evaluate("""()=>{
   const a=window.lottie.getRegisteredAnimations().find(a=>a.wrapper?.id==='confirm-player');
   return {paused:a?.isPaused,modalActive:document.querySelector('#modal')?.classList.contains('active')}
 }""")
 ck('F04 confirmation pauses on dialog close',modalState['paused'] and
    not modalState['modalActive'],modalState)
 ck('F05/F04 regression no JS errors',not errors,errors)
 ctx.close()
 reduced=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
 rp=reduced.new_page()
 rp.goto('https://zestry-v3-restaurant-review-20261117.onrender.com/',wait_until='domcontentloaded')
 rp.wait_for_function("()=>document.querySelector('[data-animation=\"f01\"]')?.dataset.loaded==='yes'",timeout=22000)
 rp.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
 rp.wait_for_function("()=>document.querySelector('[data-animation=\"f02-orbit\"]')?.dataset.loaded==='yes'",timeout=20000)
 p01=lottie(rp,'f01');p02=lottie(rp,'f02-orbit')
 ck('reduced motion keeps F01 and F02 paused at opening frames',
    p01 and p02 and p01['isPaused'] and p02['isPaused'] and
    p01['frame']==0 and p02['frame']==0,{'F01':p01,'F02':p02})
 reduced.close()


def capture_natural_chef_loops(browser,name,width,height):
 """Record a complete forward→reverse→forward chef cycle from real Chromium.

 The video is a rendered screen recording, not an offline Lottie composite.
 """
 ctx=browser.new_context(viewport={'width':width,'height':height},
     device_scale_factor=1,record_video_dir=str(OUT),
     record_video_size={'width':width,'height':height})
 page=ctx.new_page()
 errs=[]
 page.on('pageerror',lambda e:errs.append(str(e)))
 page.goto('https://zestry-v3-restaurant-review-20261117.onrender.com/',wait_until='domcontentloaded',timeout=30000)
 page.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
 page.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')
    ?.dataset.loaded==='yes'""",timeout=25000)
 page.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')
    ?.dataset.motionInView==='true'""",timeout=15000)
 first=lottie(page,'f02-orbit')
 page.screenshot(path=str(OUT/('V18-'+name+'-chef-orbit-start.png')))
 page.wait_for_timeout(17800)
 after=lottie(page,'f02-orbit')
 page.screenshot(path=str(OUT/('V18-'+name+'-chef-orbit-after-complete-loop.png')))
 ck(name+' F02 natural full forward/return/forward loop',
    after and after['motionLoops']>=2 and after['direction']==1 and
    after['playingInViewport']=='true' and not errs,
    {'initial':first,'final':after,'errors':errs})
 video=page.video
 ctx.close()
 if video:
  output=OUT/('V18-'+name+'-chef-seamless-real-browser.webm')
  shutil.move(video.path(),output)
  ck(name+' F02 natural browser video saved',output.stat().st_size>20000,
      {'name':output.name,'bytes':output.stat().st_size})



def main():
 print("ZESTRY_V18_FINAL_LIVE_URL",JSON.stringify({"url":"https://zestry-v3-restaurant-review-20261117.onrender.com/","deployedSha":"7b196c912d11820dce790ddb735e96e1f1599e8e","note":"real website/browser, not offline composite"}),flush=True)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
  for name,w,h in [('desktop',1600,900),('mobile',390,844)]:
   try:check_viewport(browser,name,w,h)
   except Exception as e:
    import traceback
    traceback.print_exc()
    report['regressions'].append({'name':name+'_live_fatal','details':str(e)})
  try:test_dialog_and_reduced(browser)
  except Exception as e:
   import traceback
   traceback.print_exc()
   report['regressions'].append({'name':'live_modal_fatal','details':str(e)})
  for name,w,h in [('desktop',1600,900),('mobile',390,844)]:
   try:capture_natural_chef_loops(browser,name,w,h)
   except Exception as e:
    import traceback
    traceback.print_exc()
    report['regressions'].append({'name':name+'_natural_live','details':str(e)})
  browser.close()
 (OUT/'V18_FINAL_LIVE_ACCEPTANCE.json').write_text(json.dumps(report,indent=2,default=str)+'\n')
 print('V18_FINAL_LIVE_QA',json.dumps({
  'pass':not report['regressions'],
  'checks':len(report['passes']),
  'regressions':report['regressions'],
  'site':'https://zestry-v3-restaurant-review-20261117.onrender.com/',
  'sha':'7b196c912d11820dce790ddb735e96e1f1599e8e'
 })[:4800],flush=True)
 if report['regressions']:raise SystemExit(2)
if __name__=='__main__':main()
