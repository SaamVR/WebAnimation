#!/usr/bin/env python3
"""Derive SITE background from the F01 V4 original wood layer, without edit.

Official Lottie-web renders the pristine artist's existing static wood layer
into a photo background used to fill ONLY the circular viewport's surrounding
space. This is a derived site-layout asset; the 32 native Lottie layers are
preserved verbatim and never re-keyframed. Source JSON SHA checked.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import hashlib,io,json,threading
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path("projects/restaurant-demo")
SRC=ROOT/"assets/lottie/f01.json"
VEN=ROOT/"assets/vendor/lottie.min.js"
DEST=ROOT/"assets/f01-v4-wood-fill.webp"
SHA="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SHA
HTML="""<!doctype html><html><head><meta charset=utf-8>
<style>body{margin:0}#wood{width:1024px;height:585px}</style></head><body>
<div id=wood></div><script src=/lottie.min.js></script>
<script>
fetch('/f01.json').then(r=>r.json()).then(v=>{
 window.anim=lottie.loadAnimation({container:document.querySelector('#wood'),
  renderer:'svg',loop:false,autoplay:false,animationData:v,
  rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
 window.anim.addEventListener('DOMLoaded',()=>{
   window.anim.goToAndStop(0,true);
   const wood=window.anim.renderer.elements.find(x=>x.data?.nm?.startsWith('background-wood-tabletop'));
   if(!wood||!wood.layerElement)throw Error('Original static wood missing');
   for(const el of window.anim.renderer.elements){
     if(el!==wood&&el?.layerElement)el.layerElement.style.setProperty('visibility','hidden','important');
   }
   window.ready=true;
 })
}).catch(e=>window.err=String(e))
</script></body></html>"""
with TemporaryDirectory(prefix="f01-v4-realwood-") as temp:
 d=Path(temp);(d/"index.html").write_text(HTML)
 (d/"f01.json").write_bytes(SRC.read_bytes())
 (d/"lottie.min.js").write_bytes(VEN.read_bytes())
 server=ThreadingHTTPServer(("127.0.0.1",18890),
           partial(SimpleHTTPRequestHandler,directory=str(d)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
   p=browser.new_page(viewport={"width":1100,"height":650},device_scale_factor=1)
   p.goto("http://127.0.0.1:18890",wait_until="domcontentloaded")
   p.wait_for_function("()=>window.ready===true",timeout=22000)
   captured=p.locator("#wood").screenshot()
   browser.close()
 finally:server.shutdown()
source=Image.open(io.BytesIO(captured)).convert("RGB")
assert source.size==(1024,585),source.size
pix=np.asarray(source)
# Wood must fill the original composition, not an empty or transparent canvas.
corners=[pix[5,5].tolist(),pix[5,-6].tolist(),pix[-6,5].tolist(),pix[-6,-6].tolist()]
assert all(120<sum(p)/3<245 for p in corners),corners
edge=1024;rows=source.height;start=(edge-rows)//2
out=np.empty((edge,edge,3),dtype=np.uint8)
# Exact original wood pixels in the middle. Mirror only its stationary wood
# beyond the source aspect, maintaining edge continuity with no artwork copy.
period=2*(rows-1)
for y in range(edge):
 ix=(y-start)%period
 if ix>=rows:ix=period-ix
 out[y]=pix[ix]
wood=Image.fromarray(out,"RGB")
wood.save(DEST,format="WEBP",lossless=True,method=6)
assert DEST.stat().st_size<450_000,(DEST,DEST.stat().st_size)
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==SHA
print("F01_ORIGINAL_WOOD_BACKGROUND_GENERATED",json.dumps({
 "asset":str(DEST),"width":edge,"height":edge,
 "byteCount":DEST.stat().st_size,"sha256":hashlib.sha256(DEST.read_bytes()).hexdigest(),
 "sourceJSON_SHA256":SHA,"sourceArtworkEdited":False,"layer":"background-wood-tabletop"
}),flush=True)
