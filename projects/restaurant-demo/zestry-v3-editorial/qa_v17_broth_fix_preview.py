#!/usr/bin/env python3
"""Preview a *single* narrowly patched HTML runtime against real Render assets.
No source Lottie changes, no deployment; image compare confirms broth paint.
"""
from __future__ import annotations
import io,json,re
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

URL="https://zestry-v3-restaurant-review-20261117.onrender.com/"
OUT=Path("projects/restaurant-demo/docs/qa/owner-v17-broth-fix-preview")
OUT.mkdir(parents=True,exist_ok=True)
MARK="ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118"
PATCH=r"""if(defs)wood.appendChild(defs.cloneNode(true));
   wood.appendChild(original.cloneNode(true));
   /* ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118:
      The foreground F01 mask/clip IDs must be unique in the document.
      Cloned wood-only definitions have independent IDs and their own
      URL/href references are rewritten. Source Lottie is unchanged. */
   const woodIdMap=new Map();
   for(const n of wood.querySelectorAll('[id]')){
     const id=n.getAttribute('id');
     if(!woodIdMap.has(id))woodIdMap.set(id,'zestry-wood-'+id);
   }
   for(const n of wood.querySelectorAll('[id]')){
     n.setAttribute('id',woodIdMap.get(n.getAttribute('id')));
   }
   for(const n of wood.querySelectorAll('*')){
     for(const a of Array.from(n.attributes)){
       if(a.name==='id')continue;
       let val=a.value;
       val=val.replace(/url\(#([^)]+)\)/g,(all,id)=>
         woodIdMap.has(id)?'url(#'+woodIdMap.get(id)+')':all);
       if(val[0]==='#'&&woodIdMap.has(val.slice(1))){
         val='#'+woodIdMap.get(val.slice(1));
       }
       if(val!==a.value)n.setAttribute(a.name,val);
     }
   }"""
rx=re.compile(r"if\(defs\)wood.appendChild\(defs.cloneNode\(true\)\);\s*wood.appendChild\(original.cloneNode\(true\)\);")

def shoot(browser,patched,frame):
  page=browser.new_page(viewport={"width":1600,"height":900},device_scale_factor=1)
  errors=[]
  page.on("pageerror",lambda e:errors.append(str(e)))
  if patched:
    def intercept(route):
      resp=route.fetch()
      body=resp.text()
      updated,n=rx.subn(lambda _:PATCH,body)
      if n!=1:raise RuntimeError(f"wood runtime marker count was {n}")
      route.fulfill(response=resp,body=updated)
    page.route(URL,intercept)
  page.goto(URL,wait_until="domcontentloaded",timeout=45000)
  page.wait_for_function("""() => !!window.lottie?.getRegisteredAnimations()
     .find(a=>a.wrapper?.closest('.hero-image.hero-visual'))?.renderer?.elements?.length""",timeout=25000)
  got=page.evaluate("""frame => {
    const anim=window.lottie.getRegisteredAnimations()
         .find(a=>a.wrapper?.closest('.hero-image.hero-visual'));
    anim.goToAndStop(frame,true);
    const all=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const duplicates=[...new Set(all)].filter(id=>all.indexOf(id)!==all.lastIndexOf(id));
    const brood=anim.renderer.elements.find(e=>e?.data?.ind===28)?.layerElement;
    return {
      frame:anim.currentFrame,
      zoom:Number(anim.wrapper.dataset.heroZoom),
      duplicateIds:duplicates,
      woodDefIds:[...document.querySelectorAll('.f01-wood-fill defs [id]')].map(x=>x.id).slice(0,8),
      nativeDefs:[...document.querySelectorAll('.hero .hero-pasta .anim svg defs [id]')].map(x=>x.id).slice(0,8),
      brothClip:brood?.getAttribute('clip-path'),brothTag:brood?.tagName,
      brothPathCount:brood?.querySelectorAll('path').length,
      marker:document.documentElement.outerHTML.includes('ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118')
    }
  }""",frame)
  page.wait_for_timeout(75)
  clip=page.locator('.hero-image.hero-visual').bounding_box()
  first=page.screenshot(clip=clip)
  page.evaluate("""() => {
    const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.closest('.hero-image.hero-visual'));
    a.renderer.elements.find(e=>e?.data?.ind===28).layerElement.style.setProperty('visibility','hidden','important')
  }""")
  page.wait_for_timeout(60)
  hidden=page.screenshot(clip=clip)
  a=Image.open(io.BytesIO(first)).convert('RGB')
  b=Image.open(io.BytesIO(hidden)).convert('RGB')
  diff=ImageChops.difference(a,b)
  hist=diff.convert('L').histogram()
  got['visibleBrothPixels']=sum(num for i,num in enumerate(hist) if i>8)
  got['diffBounds']=diff.getbbox()
  got['errors']=errors
  prefix='PATCHED' if patched else 'ORIGINAL'
  if frame in (0,142,149,160,225,260):
    (OUT/f'{prefix}-f01-frame-{frame:03d}.png').write_bytes(first)
    diff.save(OUT/f'{prefix}-broth-pixel-contribution-{frame:03d}.png')
  page.close()
  return got,first
frames=[0,142,149,160,225,260]
result={"url":URL,"fix":"Namespace only wood-cloned SVG defs and remap wood references",
        "originalSha":"1c1406b391cfa7979ff05cea53d3feec758c7f8b",
        "frames":[],"errors":[]}
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
  for f in frames:
    baseline,before=shoot(browser,False,f)
    patched,after=shoot(browser,True,f)
    imageDiff=ImageChops.difference(Image.open(io.BytesIO(before)).convert('RGB'),
                                   Image.open(io.BytesIO(after)).convert('RGB'))
    hist=imageDiff.convert('L').histogram()
    changed=sum(num for i,num in enumerate(hist) if i>8)
    line={"frame":f,"original":baseline,"patched":patched,
          "changedPixelsAfterFix":changed,"allPixels":Image.open(io.BytesIO(before)).width*Image.open(io.BytesIO(before)).height}
    result["frames"].append(line)
    print('COMPARE',json.dumps({
      "frame":f,"originalBrothPixels":baseline['visibleBrothPixels'],
      "patchedBrothPixels":patched['visibleBrothPixels'],
      "sceneChangedPixels":changed,
      "originalDuplicateIds":baseline["duplicateIds"],
      "patchedDuplicateIds":patched["duplicateIds"],
      "errors":baseline["errors"]+patched["errors"]
    })[:4500],flush=True)
    result['errors'].extend(baseline['errors']+patched['errors'])
  browser.close()
p0=result['frames'][0]
p160=next(x for x in result['frames'] if x['frame']==160)
p260=next(x for x in result['frames'] if x['frame']==260)
result['gates']={
  'noDuplicateIds':all(not v['patched']['duplicateIds'] for v in result['frames']),
  'brothBecomesVisibleAfterPour':p160['patched']['visibleBrothPixels']>200 or p260['patched']['visibleBrothPixels']>200,
  'brothPreviouslyInvisibleAtFinalHold':p260['original']['visibleBrothPixels']==0 and p260['patched']['visibleBrothPixels']>1000,
  'firstFramePreserved':p0['changedPixelsAfterFix']<max(30,p0['allPixels']*.002),
  'noBrowserErrors':not result['errors'],
  'sameFixedScale':all(x['patched']['zoom']==1.755 for x in result['frames'])
}
(OUT/"BROTH_FIX_PREVIEW_QA.json").write_text(json.dumps(result,indent=2)+"\n")
print('FIX_GATES',json.dumps(result['gates']),flush=True)
if not all(result['gates'].values()):raise SystemExit(2)
