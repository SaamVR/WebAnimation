#!/usr/bin/env python3
"""Emergency rollback live check: stable V17 hero holds, chef never reverses."""
import json,io
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
URL="https://zestry-v3-restaurant-review-20261117.onrender.com/"
OUT=Path("projects/restaurant-demo/docs/qa/owner-v17-rollback-live")
OUT.mkdir(parents=True,exist_ok=True)
report={"release":"V17 emergency rollback","sha":"2bdfe0c6d19050bb1e44ae79640a547ddb62844d","url":URL,"checks":[],"issues":[]}
def ck(label,condition,data):
    report["checks"].append({"label":label,"pass":bool(condition),"detail":data})
    if not condition:report["issues"].append(label)
    print(("PASS " if condition else "FAIL ")+label+" "+json.dumps(data,default=str)[:1400],flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=["--no-sandbox"])
 for name,w,h in [('desktop',1600,900),('mobile',390,844)]:
  c=b.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
  p=c.new_page();errors=[]
  p.on("pageerror",lambda e:errors.append(str(e)))
  p.goto(URL,wait_until="domcontentloaded",timeout=45000)
  p.wait_for_function("""() =>document.querySelector('[data-animation="f01"]')?.dataset.loaded==='yes'&&document.querySelector('svg.f01-wood-fill')""",timeout=25000)
  p.wait_for_function("""()=>document.querySelector('[data-animation="f01"]')?.dataset.motionComplete==='true'""",timeout=23000)
  detail=p.evaluate("""()=>{
    const host=document.querySelector('[data-animation="f01"]');
    const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper===host);
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const dup=[...new Set(ids)].filter(x=>ids.indexOf(x)!==ids.lastIndexOf(x));
    return {frame:a.currentFrame,loop:a.loop,zoom:host.dataset.heroZoom,
      complete:host.dataset.motionComplete,
      wood:!!document.querySelector('svg.f01-wood-fill'),
      duplicateIds:dup,overflow:document.documentElement.scrollWidth>innerWidth+2,
      brokenV18Marker:document.documentElement.outerHTML.includes('ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER')}
  }""")
  ck(name+" original hero final hold restored",detail["frame"]==260 and detail["loop"] is False and detail["complete"]=='true' and detail["zoom"]=="1.755000" and detail["wood"] and not detail["duplicateIds"] and not detail["brokenV18Marker"] and not detail["overflow"],detail)
  clip=p.locator('.hero-image.hero-visual').bounding_box()
  first=p.screenshot(clip=clip)
  p.evaluate("""()=>{
    let a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f01');
    a.renderer.elements.find(x=>x.data?.ind===28).layerElement.style.visibility='hidden'
  }""")
  p.wait_for_timeout(50)
  hidden=p.screenshot(clip=clip)
  a=Image.open(io.BytesIO(first)).convert('RGB')
  d=Image.open(io.BytesIO(hidden)).convert('RGB')
  diff=ImageChops.difference(a,d).convert('L')
  pixels=sum(v for i,v in enumerate(diff.histogram()) if i>8)
  ck(name+" broth visible at completed bowl",pixels>(800 if name=='desktop' else 120),{"brothPixels":pixels})
  (OUT/f"{name}-hero-final-restored.png").write_bytes(first)
  p.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
  p.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')?.dataset.loaded==='yes'""",timeout=25000)
  chef=p.evaluate("""()=>{
    const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f02-orbit');
    return {loop:a?.loop,direction:a?.playDirection,
      v18Policy:a?.wrapper?.dataset?.motionPolicy??null,
      motionLoops:a?.wrapper?.dataset?.motionLoops??null};
  }""")
  ck(name+" chef reversed-playback hack removed",chef["direction"]==1 and chef["v18Policy"] is None and chef["motionLoops"] is None,chef)
  ck(name+" no JS exceptions",not errors,errors)
  c.close()
 b.close()
(OUT/"V17_ROLLBACK_LIVE_QA.json").write_text(json.dumps(report,indent=2)+"\n")
print("FINAL_ROLLBACK_REPORT",json.dumps({"passed":not report["issues"],"count":len(report["checks"]),"issues":report["issues"],"sha":report["sha"]}),flush=True)
if report["issues"]:raise SystemExit(2)
