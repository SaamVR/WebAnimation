#!/usr/bin/env python3
"""V12 capture of the approved NOVA site source. Original browser WebGL; no proxy model or 2D fake."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import threading,subprocess,json,shutil
from playwright.sync_api import sync_playwright

site=Path('sources/portfolio/NovaAG').resolve()
out=Path('out/nova-v12')
out.mkdir(parents=True,exist_ok=True)
assert (site/'assets/headphones-web.gltf').is_file()
srv=ThreadingHTTPServer(('127.0.0.1',18712),partial(SimpleHTTPRequestHandler,directory=str(site)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
meta={'source_repository':'SaamVR/Portfolio','source_branch':'feat/leadflow-v2-evidence-20261012','source_path':'NovaAG','real_webgl':False,'errors':[],'shots':{}}
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=shutil.which('google-chrome') or shutil.which('google-chrome-stable') or shutil.which('chromium'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
  page.on('pageerror',lambda e:meta['errors'].append(str(e)))
  page.goto('http://127.0.0.1:18712/',wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function("document.body.dataset.modelState === 'ready'",timeout=28000)
  meta['real_webgl']=True
  page.wait_for_timeout(600)
  for shot in ('hero','fold','inspect'):
   folder=out/shot;folder.mkdir(exist_ok=True)
   if shot=='hero':
    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
    page.wait_for_timeout(700)
   if shot=='fold':
    page.locator('#form').scroll_into_view_if_needed(timeout=10000)
    page.wait_for_timeout(700)
   if shot=='inspect':
    page.locator('#experience').scroll_into_view_if_needed(timeout=10000)
    page.wait_for_timeout(700)
   for i in range(120):
    if shot=='hero':
     page.evaluate('(p)=>window.scrollTo(0,p*document.documentElement.scrollHeight)', i/119*.22)
    if shot=='fold':
     if i==10:page.locator('[data-fold-state="fold"]').click()
     if i==78:page.locator('[data-fold-state="open"]').click()
    if shot=='inspect':
     if i==10:page.locator('[data-inspection-view="side"]').click()
     if i==52:page.locator('[data-inspection-view="rear"]').click()
     if i==91:page.locator('[data-inspection-view="front"]').click()
    page.wait_for_timeout(34)
    page.screenshot(path=str(folder/f'frame_{i:04d}.jpg'),type='jpeg',quality=86,animations='allow')
   meta['shots'][shot]={'frames':120,'file_pattern':f'{shot}/frame_%04d.jpg'}
  meta['fold_ended_open']=page.locator('[data-fold-state="open"]').get_attribute('aria-pressed')
  meta['title']=page.title()
  b.close()
finally:
 srv.shutdown()
 (out/'capture_evidence.json').write_text(json.dumps(meta,indent=2))
print(json.dumps(meta,indent=2))
