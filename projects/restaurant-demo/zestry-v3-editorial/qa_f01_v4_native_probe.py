#!/usr/bin/env python3
"""Read-only official Lottie-web renderer probe for owner's F01 V4 original.

Never mutates the F01 JSON or in-memory animation layers; no page-specific
CSS, no cloned defs, no mask patches, and no display zoom.
"""
from __future__ import annotations
import hashlib,io,json,threading
from pathlib import Path
from tempfile import TemporaryDirectory
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

ROOT=Path("projects/restaurant-demo")
SRC=ROOT/"assets/lottie/f01.json"
EXPECTED="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
OUT=ROOT/"docs/qa/f01-v4-native-probe"
OUT.mkdir(exist_ok=True,parents=True)
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==EXPECTED
data=json.loads(SRC.read_bytes())
assert data["fr"]==30 and data["op"]==261 and len(data["layers"])==32
assert data["w"]==1984 and data["h"]==1134
assert data["layers"][0]["nm"].startswith("F01_Broth_Pour_Stream")
assert data["layers"][-1]["nm"].startswith("background-wood-tabletop")
HTML="""<!doctype html><html><head><meta charset=utf-8>
<style>body{margin:0;background:#c73328}#player{width:990px;height:566px;margin:70px auto}
#player>svg{display:block}</style></head><body>
<div id=player></div><script src=/lottie.min.js></script>
<script>
fetch('/f01.json').then(r=>r.json()).then(json=>{
window.anim=lottie.loadAnimation({container:document.querySelector('#player'),
 renderer:'svg',loop:false,autoplay:false,animationData:json,
 rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
window.anim.addEventListener('DOMLoaded',()=>window.ready=true)
}).catch(e=>window.failure=String(e))
</script></body></html>"""
with TemporaryDirectory(prefix="f01-v4-native-") as tmp:
    dest=Path(tmp)
    (dest/"index.html").write_text(HTML)
    (dest/"f01.json").write_bytes(SRC.read_bytes())
    (dest/"lottie.min.js").write_bytes((ROOT/"assets/vendor/lottie.min.js").read_bytes())
    server=ThreadingHTTPServer(("127.0.0.1",18891),
                               partial(SimpleHTTPRequestHandler,directory=str(dest)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    report={"source_SHA":EXPECTED,"source_mutated":False,"frames":[],"errors":[]}
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
        page=browser.new_page(viewport={"width":1200,"height":720},device_scale_factor=1)
        page.on("pageerror",lambda e:report["errors"].append(str(e)))
        page.goto("http://127.0.0.1:18891",wait_until="domcontentloaded",timeout=30000)
        page.wait_for_function("()=>window.ready===true",timeout=30000)
        initial=page.evaluate("""()=> {
          const a=window.anim;
          const broth=a.renderer.elements.find(x=>x?.data?.ind===28);
          const defs=[...document.querySelectorAll('defs [id]')].map(n=>n.id);
          return {fr:a.frameRate,length:a.getDuration(true),loop:a.loop,
            subframe:a.isSubframeEnabled,
            brothLayer:broth?.data?.nm,brothHasMask:broth?.data?.hasMask,
            brothClip:broth?.layerElement?.getAttribute('clip-path'),
            brothMask:broth?.layerElement?.getAttribute('mask'),
            maskProps:broth?.data?.masksProperties?.length,
            brothOuterHTML:broth?.layerElement?.outerHTML.slice(0,900),
            defsCount:defs.length,defsDuplicateIds:defs.filter((id,i)=>defs.indexOf(id)!==i),
            svgViewbox:a.renderer.svgElement?.getAttribute('viewBox')};
        }""")
        report["initial"]=initial
        print("NATIVE_METADATA",json.dumps(initial,default=str)[:1800],flush=True)
        for fr in [0,70,134,142,149,165,175,225,260]:
          page.evaluate("""fr=>window.anim.goToAndStop(fr,true)""",fr)
          page.wait_for_timeout(85)
          metrics=page.evaluate("""()=>{
            const broth=window.anim.renderer.elements.find(x=>x?.data?.ind===28)?.layerElement;
            return {frame:window.anim.currentFrame,
              brothTag:broth?.tagName,brothStyle:broth?.getAttribute('style'),
              brothClip:broth?.getAttribute('clip-path'),
              brothVisibility:broth?getComputedStyle(broth).visibility:null,
              domPathCount:broth?.querySelectorAll('path').length};
          }""")
          clip=page.locator("#player").bounding_box()
          shown=page.screenshot(clip=clip)
          page.evaluate("""()=>{
            const broth=window.anim.renderer.elements.find(x=>x?.data?.ind===28)?.layerElement;
            if(broth)broth.style.setProperty('visibility','hidden','important')
          }""")
          page.wait_for_timeout(45)
          hidden=page.screenshot(clip=clip)
          page.evaluate("""()=>{
            const broth=window.anim.renderer.elements.find(x=>x?.data?.ind===28)?.layerElement;
            if(broth)broth.style.removeProperty('visibility')
          }""")
          diff=ImageChops.difference(Image.open(io.BytesIO(shown)).convert("RGB"),
                   Image.open(io.BytesIO(hidden)).convert("RGB")).convert("L")
          metrics["brothVisiblePixels"]=sum(n for x,n in enumerate(diff.histogram()) if x>8)
          (OUT/f"native-frame-{fr:03d}.png").write_bytes(shown)
          report["frames"].append(metrics)
          print("NATIVE_FRAME",json.dumps(metrics)[:1200],flush=True)
        browser.close()
    finally:server.shutdown()
(OUT/"F01_V4_NATIVE_RENDERER.json").write_text(json.dumps(report,indent=2)+"\n")
print("F01_V4_PROBE_DONE",json.dumps({
 "originalSourceUnmodified":True,
 "finalBrothPixels":report["frames"][-1]["brothVisiblePixels"],
 "browserErrors":report["errors"]
}),flush=True)
if report["errors"]:raise SystemExit(2)
