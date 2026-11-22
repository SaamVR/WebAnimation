from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import base64, json, time, threading
from playwright.sync_api import sync_playwright
ROOT=Path('sources/threads/site/threads').resolve()
OUT=Path('out/shoe-to-cart')
FRAMES=OUT/'frames';FRAMES.mkdir(parents=True,exist_ok=True)
class Local(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def log_message(self,*a):pass
http=ThreadingHTTPServer(('127.0.0.1',8769),Local)
threading.Thread(target=http.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 ctx=browser.new_context(viewport={'width':1280,'height':720},device_scale_factor=1,reduced_motion='no-preference')
 page=ctx.new_page();errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.goto('http://127.0.0.1:8769/product/?id=sho-04',wait_until='domcontentloaded',timeout=30000)
 page.locator('#detail-main-image').wait_for(timeout=20000)
 page.wait_for_function("document.querySelector('#detail-main-image')?.naturalWidth>0",timeout=25000)
 page.evaluate("document.querySelector('#detail-add').scrollIntoView({block:'center'})")
 page.wait_for_timeout(800)
 page.screenshot(path=str(OUT/'before.jpg'),type='jpeg',quality=90)
 states=[];imgs=[]
 session=ctx.new_cdp_session(page)
 start=[None];last=[0]
 def onframe(e):
  if start[0] is None:start[0]=e.get('metadata',{}).get('timestamp',time.monotonic())
  try:
   data=base64.b64decode(e['data'])
   idx=len(imgs)
   (FRAMES/f'{idx:04d}.jpg').write_bytes(data)
   imgs.append({'i':idx,'timestamp':e.get('metadata',{}).get('timestamp',0)})
  finally:
   session.send('Page.screencastFrameAck',{'sessionId':e['sessionId']})
 session.on('Page.screencastFrame',onframe)
 session.send('Page.startScreencast',{'format':'jpeg','quality':88,'maxWidth':1280,'maxHeight':720,'everyNthFrame':1})
 page.wait_for_timeout(260)
 page.locator('#detail-add').click(timeout=12000)
 for i in range(11):
  page.wait_for_timeout(170)
  states.append({'t':i*0.17,'proxy':page.locator('#t02-motion-layer').count(),'badge':page.locator('#bag-count').inner_text(),'url':page.url})
 page.wait_for_timeout(350)
 session.send('Page.stopScreencast')
 page.screenshot(path=str(OUT/'after.jpg'),type='jpeg',quality=90)
 data={'page_title':page.title(),'url':page.url,'source':'approved Threads T02 V3 GSAP storefront runtime','product_id':'sho-04','product_name':'Burnt Orange Vintage Runner','frame_count':len(imgs),'frames':imgs,'states':states,'errors':errors,'image_natural':page.locator('#detail-main-image').evaluate('(img)=>img.naturalWidth')}
 (OUT/'capture-evidence.json').write_text(json.dumps(data,indent=2))
 print(json.dumps({k:v for k,v in data.items() if k not in ['frames','states']},indent=2))
 ctx.close();browser.close()
http.shutdown()
