#!/usr/bin/env python3
"""Predeployment QA: rebuild the real Render ZIP and visually verify F01 broth.

No changes to author-approved Lottie artwork/keyframes. The source of the
regression is duplicate IDs from copied SVG background defs; this test fails
if any duplicated IDs remain or broth is not visibly painted after the pour.
"""
from __future__ import annotations
import hashlib,io,json,shutil,threading
from pathlib import Path
from tempfile import TemporaryDirectory
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright

ROOT=Path('projects/restaurant-demo')
OUT=ROOT/'docs/qa/owner-v17-broth-restored'
OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:18895/'
SHA={
 'f01.json':'7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37',
 'f01-v16.json':'14f781c6568a15fd1593b7a906c95f87b9c445bd7573cf8741bbded92ca6660d',
 'f03.json':'136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68',
 'f04.json':'e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0',
}
def contribute(page,frame,clip):
  got=page.evaluate("""frame=>{
    const a=window.lottie.getRegisteredAnimations().find(x=>
      x.wrapper?.closest('.hero-image.hero-visual'));
    a.goToAndStop(frame,true);
    const brood=a.renderer.elements.find(e=>e?.data?.ind===28);
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const duplicate=[...new Set(ids)].filter(id=>ids.indexOf(id)!==ids.lastIndexOf(id));
    return {frame:a.currentFrame,
            zoom:Number(a.wrapper.dataset.heroZoom),
            brothLayer:brood?.data?.nm,clipPath:brood?.layerElement?.getAttribute('clip-path'),
            isSubframeEnabled:a.isSubframeEnabled,duplicateIds:duplicate,
            wood:!!document.querySelector('.f01-wood-fill'),
            layoutOverflow:document.documentElement.scrollWidth>innerWidth+2};
  }""",frame)
  page.wait_for_timeout(65)
  visible=page.screenshot(clip=clip)
  page.evaluate("""()=>{
    const a=window.lottie.getRegisteredAnimations().find(x=>
      x.wrapper?.closest('.hero-image.hero-visual'));
    a.renderer.elements.find(e=>e.data?.ind===28)
      .layerElement.style.setProperty('visibility','hidden','important');
  }""")
  page.wait_for_timeout(40)
  hidden=page.screenshot(clip=clip)
  page.evaluate("""()=>{
    const a=window.lottie.getRegisteredAnimations().find(x=>
      x.wrapper?.closest('.hero-image.hero-visual'));
    a.renderer.elements.find(e=>e.data?.ind===28)
      .layerElement.style.removeProperty('visibility');
  }""")
  ia=Image.open(io.BytesIO(visible)).convert('RGB')
  ib=Image.open(io.BytesIO(hidden)).convert('RGB')
  dif=ImageChops.difference(ia,ib).convert('L')
  got['brothPaintedPixels']=sum(count for level,count in enumerate(dif.histogram()) if level>8)
  return got,visible

def main():
  parts=sorted((ROOT/'review_bundle').glob('part-*.bin'))
  assert len(parts)>20
  raw=b''.join(x.read_bytes() for x in parts)
  with zipfile.ZipFile(io.BytesIO(raw)) as z:
    assert z.testzip() is None
    for name,sha in SHA.items():
      assert hashlib.sha256(z.read('assets/lottie/'+name)).hexdigest()==sha,name
    site_html=z.read('index.html').decode()
    assert site_html.count('ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118')==1
    assert 'scale(1.755000)' in site_html
    assert 'ZESTRY_PERF_V17_READY_QUEUE' in z.read('assets/f05_book.html').decode()
    with TemporaryDirectory(prefix="zestry-f01-broth-") as temp:
      site=Path(temp)
      z.extractall(site)
      index=site/'index.html';html=index.read_text()
      assert html.count("play(name,c,name!=='f06')")==1
      html=html.replace("play(name,c,name!=='f06')",
             "play(name,c,name!=='f06'&&name!=='f03')")
      html=html.replace("https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
             "assets/vendor/lottie.min.js")
      html=html.replace("https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/",
             "assets/photos/")
      index.write_text(html)
      vendor=site/'assets/vendor/lottie.min.js';vendor.parent.mkdir(exist_ok=True,parents=True)
      shutil.copy2(ROOT/'assets/vendor/lottie.min.js',vendor)
      for p in (ROOT/'assets/photos').glob('*.jpg'):
        dest=site/'assets/photos'/p.name;dest.parent.mkdir(exist_ok=True,parents=True);shutil.copy2(p,dest)
      server=ThreadingHTTPServer(('127.0.0.1',18895),
                  partial(SimpleHTTPRequestHandler,directory=str(site)))
      thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
      results={"sourceHashVerified":True,
               "patchMarker":"ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118",
               "sourceF01Unchanged":True,"viewports":{},"errors":[]}
      try:
        with sync_playwright() as pw:
          browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
          for label,w,h in [('desktop',1600,900),('mobile',390,844)]:
            p=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
            errors=[]
            p.on('pageerror',lambda e:errors.append(str(e)))
            p.goto(URL,wait_until='domcontentloaded',timeout=30000)
            p.wait_for_function("""() => !!window.lottie?.getRegisteredAnimations()
              .find(x=>x.wrapper?.closest('.hero-image.hero-visual'))?.renderer?.elements?.length
              && !!document.querySelector('svg.f01-wood-fill')""",timeout=20000)
            clip=p.locator('.hero-image.hero-visual').bounding_box()
            data=[]
            for fr in [0,142,149,160,225,260]:
              row,shot=contribute(p,fr,clip)
              data.append(row)
              if fr in (0,149,160,260):
                (OUT/f'{label}-restored-broth-{fr:03d}.png').write_bytes(shot)
              assert not row['duplicateIds'],(label,fr,row['duplicateIds'])
              assert row['zoom']==1.755 and row['wood'] and not row['layoutOverflow']
            # Broth is absent at first frame, fills after the pour, remains visible at hold.
            assert data[0]['brothPaintedPixels']<50,(label,data[0])
            threshold=400 if label=='desktop' else 80
            assert data[3]['brothPaintedPixels']>threshold,(label,data[3])
            assert data[-1]['brothPaintedPixels']>threshold,(label,data[-1])
            assert not errors,(label,errors)
            results['viewports'][label]={"frames":data,"errors":errors}
            print("BROTH_RESTORED",json.dumps({
              'viewport':label,
              'afterPourPixels':data[3]['brothPaintedPixels'],
              'finalHoldPixels':data[-1]['brothPaintedPixels'],
              'firstFramePixels':data[0]['brothPaintedPixels'],
              'uniqueDefinitionIds':True,'fixedScale':1.755
            }),flush=True)
            p.close()
          browser.close()
      finally:
        server.shutdown()
      (OUT/'BROTH_RESTORATION_ACCEPTANCE.json').write_text(json.dumps(results,indent=2)+"\n")
      print("BROTH_PREDEPLOY_QA_PASSED",json.dumps({k:len(v['frames']) for k,v in results['viewports'].items()}),flush=True)
if __name__=='__main__':main()
