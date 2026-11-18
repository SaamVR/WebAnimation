#!/usr/bin/env python3
"""Test renderer compatibility against immutable owner-supplied F01 V4 JSON.

Never edits original bytes; compare official Lottie-web browser with & without
an ephemeral player-only mask metadata hint. Does not modify user artwork.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import hashlib,io,json,threading
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

SRC=Path("projects/restaurant-demo/assets/lottie/f01.json")
VEN=Path("projects/restaurant-demo/assets/vendor/lottie.min.js")
OUT=Path("projects/restaurant-demo/docs/qa/f01-v4-native-compat")
OUT.mkdir(parents=True,exist_ok=True)
SHA="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SHA
html="""<!doctype html><html><head><meta charset=utf-8>
<style>body{margin:0;background:#c73328}#player{width:990px;height:566px;margin:60px auto}</style>
</head><body><div id=player></div><script src=/lottie.min.js></script>
<script>fetch('/f01.json').then(r=>r.json()).then(v=>{
 if(new URLSearchParams(location.search).get('compat')==='1'){
   const broth=v.layers.find(x=>x.ind===28 && x.nm.startsWith('Broth /'));
   if(!broth)throw Error('Original broth not found');
   /* transient player-only rendering hint: never written to source */
   broth.hasMask=true;
 }
 window.anim=lottie.loadAnimation({
   container:document.querySelector('#player'),renderer:'svg',loop:false,
   autoplay:false,animationData:v,
   rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
 });
 window.anim.addEventListener('DOMLoaded',()=>window.ready=true)
}).catch(e=>window.error=String(e))</script></body></html>"""
def pixels(a,b):
 da=ImageChops.difference(Image.open(io.BytesIO(a)).convert("RGB"),
                          Image.open(io.BytesIO(b)).convert("RGB")).convert("L")
 return sum(count for i,count in enumerate(da.histogram()) if i>8)
report={"sourceSha":SHA,"sourceFileEdited":False,"cases":[]}
with TemporaryDirectory(prefix="v4-lottie-compat-") as temp:
 d=Path(temp);(d/"index.html").write_text(html)
 (d/"lottie.min.js").write_bytes(VEN.read_bytes());(d/"f01.json").write_bytes(SRC.read_bytes())
 server=ThreadingHTTPServer(("127.0.0.1",18892),
           partial(SimpleHTTPRequestHandler,directory=str(d)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
   for case in ["original","player_compat"]:
    p=browser.new_page(viewport={"width":1200,"height":700})
    err=[];p.on("pageerror",lambda e:err.append(str(e)))
    p.goto("http://127.0.0.1:18892/?compat="+("1" if case=="player_compat" else "0"),
           wait_until="domcontentloaded")
    p.wait_for_function("()=>window.ready===true",timeout=18000)
    frames=[]
    for n in [0,142,160,190,260]:
     p.evaluate("n=>window.anim.goToAndStop(n,true)",n);p.wait_for_timeout(65)
     box=p.locator("#player").bounding_box()
     normal=p.screenshot(clip=box)
     p.evaluate("""()=>{
       const b=window.anim.renderer.elements.find(x=>x.data?.ind===28)?.layerElement;
       if(b)b.style.setProperty('visibility','hidden','important');
     }""");p.wait_for_timeout(45)
     hidden=p.screenshot(clip=box)
     p.evaluate("""()=>{
       const b=window.anim.renderer.elements.find(x=>x.data?.ind===28)?.layerElement;
       if(b)b.style.removeProperty('visibility');
     }""")
     px=pixels(normal,hidden)
     (OUT/f"{case}-frame-{n:03d}.png").write_bytes(normal)
     frames.append({"frame":n,"brothPixels":px})
     print("CASE_FRAME",json.dumps({"case":case,"frame":n,"brothPixels":px}),flush=True)
    report["cases"].append({"case":case,"frames":frames,"jsErrors":err})
    p.close()
   browser.close()
 finally:server.shutdown()
(OUT/"V4_RENDERER_COMPATIBILITY.json").write_text(json.dumps(report,indent=2)+"\n")
print("COMPAT_DONE",json.dumps(report["cases"])[:3000],flush=True)
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SHA
assert all(not x["jsErrors"] for x in report["cases"])
