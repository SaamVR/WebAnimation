#!/usr/bin/env python3
"""Read-only native Chromium visual probe of deployed F01 broth and SVG masks.
Do not deploy, edit live website, or change artistic source. Attach full evidence.
"""
from __future__ import annotations
import json, io, hashlib, time
from pathlib import Path
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

URL="https://zestry-v3-restaurant-review-20261117.onrender.com/"
OUT=Path("projects/restaurant-demo/docs/qa/owner-v17-broth-regression")
OUT.mkdir(parents=True,exist_ok=True)
report={"liveURL":URL,"renderSHA":"1c1406b391cfa7979ff05cea53d3feec758c7f8b",
        "frames":[],"errors":[],"probe":"Unmodified live animation, pause and hide selected broth layer for pixel contribution."}
sample_frames=[0,125,134,142,149,156,165,180,200,225,260]
with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
  page=browser.new_page(viewport={"width":1600,"height":900},device_scale_factor=1)
  page.on("pageerror",lambda e:report["errors"].append(str(e)))
  page.goto(URL,wait_until="domcontentloaded",timeout=45000)
  page.wait_for_function("""() => {
   const a=window.lottie?.getRegisteredAnimations?.()
    .find(a=>a.wrapper?.closest('.hero-image.hero-visual'));
   return !!a&&!!a.renderer?.elements?.length&&!!document.querySelector('svg.f01-wood-fill')
  }""",timeout=30000)
  data=page.evaluate("""async () => {
    const anim=window.lottie.getRegisteredAnimations()
       .find(a=>a.wrapper?.closest('.hero-image.hero-visual'));
    const source=await fetch('assets/lottie/f01-v16.json').then(r=>r.json());
    const layer=source.layers.find(l=>l.ind===28&&l.nm.startsWith('Broth /'));
    const maskDefs=[...document.querySelectorAll('svg defs mask')];
    const maskIds=maskDefs.map(m=>m.getAttribute('id'));
    const allIds=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const duplicates=[...new Set(allIds)].filter(id=>allIds.indexOf(id)!==allIds.lastIndexOf(id));
    const entry=anim.renderer.elements.find(e=>e?.data?.ind===28);
    const wrap=entry?.layerElement;
    return {
      sourceLayer:{
        ind:layer?.ind,nm:layer?.nm,ty:layer?.ty,hasMask:layer?.hasMask,
        maskCount:layer?.masksProperties?.length,
        maskProperties:layer?.masksProperties?.map(m=>({
          mode:m.mode,inv:m.inv,nm:m.nm,closed:m.pt?.k?.c,
          keys:m.pt?.k?.length,opacity:m.o?.k,expansion:m.x?.k
        })),
        transforms:layer?.ks
           ?{opacity:layer.ks.o,position:layer.ks.p,scale:layer.ks.s}:null
      },
      rendererLayer:{
        exists:!!entry,sourceHasMask:entry?.data?.hasMask,
        elementTag:wrap?.tagName,
        layerStyle:wrap?.getAttribute('style'),
        outerHTMLHead:wrap?.outerHTML.slice(0,1400),
        pathCount:wrap?.querySelectorAll('path').length,
        mask:wrap?.getAttribute('mask'),
        clipPath:wrap?.getAttribute('clip-path'),
        computed:wrap?{visibility:getComputedStyle(wrap).visibility,
          display:getComputedStyle(wrap).display,
          opacity:getComputedStyle(wrap).opacity}:null
      },
      masks:maskIds,maskCount:maskDefs.length,duplicateIds:duplicates.slice(0,40),
      duplicateIdCount:duplicates.length,
      player:{frameRate:anim.frameRate,isSubframeEnabled:anim.isSubframeEnabled,
              currentFrame:anim.currentFrame,loop:anim.loop},
      svgCount:document.querySelectorAll('.hero-image svg').length
    }
  }""")
  report["initial"]=data
  print("INITIAL_BROTH_JSON",json.dumps(data,default=str)[:11000],flush=True)
  for f in sample_frames:
    metrics=page.evaluate("""f => {
       const anim=window.lottie.getRegisteredAnimations()
            .find(a=>a.wrapper?.closest('.hero-image.hero-visual'));
       anim.goToAndStop(f,true);
       const entry=anim.renderer.elements.find(e=>e?.data?.ind===28);
       const el=entry?.layerElement;
       const svg=anim.renderer.svgElement;
       const child=entry?.baseElement;
       const parent=el?.parentElement;
       return {
         frame:anim.currentFrame,
         broth:el?{
           tag:el.tagName,style:el.getAttribute('style'),
           visibility:getComputedStyle(el).visibility,
           opacity:getComputedStyle(el).opacity,
           display:getComputedStyle(el).display,
           mask:el.getAttribute('mask'),clip:el.getAttribute('clip-path'),
           rect:{width:el.getBoundingClientRect().width,
                 height:el.getBoundingClientRect().height},
           pathCount:el.querySelectorAll('path').length,
           parentTag:parent?.tagName,parentMask:parent?.getAttribute('mask')
         }:null,
         playerZoom:document.querySelector('.hero .hero-pasta .anim')?.dataset.heroZoom,
         svgViewbox:svg?.getAttribute('viewBox')
       };
    }""",f)
    page.wait_for_timeout(50)
    box=page.locator('.hero-image.hero-visual').bounding_box()
    if box is None:raise RuntimeError("Missing hero visual bbox")
    clip={k:float(box[k]) for k in ("x","y","width","height")}
    enabled=page.screenshot(clip=clip)
    page.evaluate("""() => {
       const a=window.lottie.getRegisteredAnimations().find(a=>a.wrapper?.closest('.hero-image.hero-visual'));
       const el=a.renderer.elements.find(x=>x?.data?.ind===28)?.layerElement;
       if(el)el.style.setProperty('visibility','hidden','important');
    }""")
    page.wait_for_timeout(40)
    hidden=page.screenshot(clip=clip)
    page.evaluate("""() => {
       const a=window.lottie.getRegisteredAnimations().find(a=>a.wrapper?.closest('.hero-image.hero-visual'));
       const el=a.renderer.elements.find(x=>x?.data?.ind===28)?.layerElement;
       if(el)el.style.removeProperty('visibility');
    }""")
    a=Image.open(io.BytesIO(enabled)).convert("RGB")
    b=Image.open(io.BytesIO(hidden)).convert("RGB")
    diff=ImageChops.difference(a,b)
    hist=diff.convert("L").histogram()
    different=sum(v for i,v in enumerate(hist) if i>8)
    bounds=diff.getbbox()
    metrics["visibleBrothPixelsWhenHidden"]=different
    metrics["diffBounds"]=bounds
    metrics["totalPixels"]=a.width*a.height
    metrics["brothLayerVisiblyContributes"]=different>60
    report["frames"].append(metrics)
    if f in [0,134,149,156,180,225,260]:
      (OUT/f"live-broth-frame-{f:03d}.png").write_bytes(enabled)
      (OUT/f"live-broth-hidden-{f:03d}.png").write_bytes(hidden)
      diff.save(OUT/f"broth-contribution-{f:03d}.png")
    print("BROTH_FRAME",json.dumps(metrics,default=str)[:2500],flush=True)
  browser.close()
(OUT/"BROTH_ROOT_CAUSE_PROBE.json").write_text(json.dumps(report,indent=2,default=str)+"\n")
print("BROTH_CONTRIBUTION_SUMMARY",json.dumps({
 "anyVisible":any(f["brothLayerVisiblyContributes"] for f in report["frames"]),
 "maxPixelChange":max((f["visibleBrothPixelsWhenHidden"] for f in report["frames"]),default=0),
 "duplicateIds":report["initial"].get("duplicateIdCount"),
 "errors":report["errors"]},default=str),flush=True)
