#!/usr/bin/env python3
"""Check BOTH F02 visuals are absent in LOCAL browser, without deploying.

Preserves current shipped F01 V4 artwork and all other scene assets.
"""
from pathlib import Path
import io,hashlib,json,shutil,threading,zipfile
from functools import partial
from tempfile import TemporaryDirectory
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/f02-removal-before-new-upload"
OUT.mkdir(parents=True,exist_ok=True)
URL="http://127.0.0.1:18887/"
report={"project":"ZESTRY","status":"source only — NO PREVIEW DEPLOYED",
        "request":"Remove both old F02 visuals while waiting for owner Lottie",
        "tests":[],"errors":[]}

def check(name,ok,details):
    report["tests"].append({"name":name,"pass":bool(ok),"details":details})
    if not ok:report["errors"].append(name)
    print("PASS" if ok else "FAIL",name,json.dumps(details,default=str)[:1400],flush=True)

def browser_check(browser,label,w,h):
    context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
    page=context.new_page()
    errors=[];bad=[];f02requests=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("response",lambda r:bad.append([r.status,r.url])
            if r.url.startswith(URL) and r.status>=400 else None)
    page.on("request",lambda r:f02requests.append(r.url)
            if "/assets/lottie/f02" in r.url else None)
    page.goto(URL,wait_until="domcontentloaded",timeout=40000)
    page.locator("#kitchen").scroll_into_view_if_needed(timeout=12000)
    page.wait_for_timeout(450)
    state=page.evaluate("""() => ({
      oldOrbit:document.querySelectorAll('[data-animation="f02-orbit"]').length,
      oldCooking:document.querySelectorAll('[data-animation="f02-cooking"]').length,
      liveF02Players:window.lottie?.getRegisteredAnimations?.()
        .filter(a=>a.wrapper?.dataset?.player?.startsWith('f02')).length||0,
      replacementSlots:document.querySelectorAll('#kitchen .chef-awaiting-replacement').length,
      placeholder:document.querySelector('#kitchen .chef-awaiting-replacement')?.textContent.trim(),
      chefSecondary:document.querySelectorAll('#kitchen .chef-secondary').length,
      heading:document.querySelector('#chef-heading')?.textContent.trim(),
      f01:!!document.querySelector('[data-animation="f01"]'),
      f03:!!document.querySelector('[data-animation="f03"]'),
      f06:!!document.querySelector('[data-animation="f06"]'),
      f07:!!document.querySelector('[data-animation="f07"]'),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
    })""")
    check(label+" two F02 visuals removed",state["oldOrbit"]==0 and
          state["oldCooking"]==0 and state["liveF02Players"]==0 and
          state["chefSecondary"]==0,state)
    check(label+" one neutral slot, kitchen text intact",
          state["replacementSlots"]==1 and
          state["placeholder"]=="New chef illustration coming soon" and
          "A kitchen full of" in state["heading"] and not state["horizontalOverflow"],state)
    page.screenshot(path=str(OUT/(label+"-chef-slot.png")))
    for name in ("f01","f03","f06","f07"):
      page.locator('[data-animation="'+name+'"]').scroll_into_view_if_needed(timeout=10000)
      page.wait_for_function("""name=>{
        const c=document.querySelector('[data-animation="'+name+'"]');
        return c?.dataset.loaded==='yes' && !!c.querySelector('svg')
      }""",arg=name,timeout=28000)
      check(label+" "+name+" still renders",
         page.locator('[data-animation="'+name+'"] svg').count()>0,
         {"scene":name})
    page.locator("#menu").scroll_into_view_if_needed()
    frame=page.frame_locator("#f05-book-frame")
    frame.locator("#state").wait_for(timeout=28000)
    frame.get_by_role("button",name="Open menu book").click()
    real=next(f for f in page.frames if "f05_book.html" in f.url)
    real.wait_for_function("""()=>document.body.dataset.f05State==='Overview'""",timeout=28000)
    check(label+" existing interactive menu still operates",True,
          {"menuState":"Overview"})
    check(label+" no F02 source requests or site errors",
          not f02requests and not errors and not bad,
          {"F02Requests":f02requests,"errors":errors,"HTTPFailures":bad})
    context.close()

def main():
    parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
    with zipfile.ZipFile(io.BytesIO(b"".join(p.read_bytes() for p in parts))) as z:
      assert z.testzip() is None
      html=z.read("index.html").decode()
      assert "ZESTRY_BOTH_F02_REMOVED_PENDING_OWNER_FILE_20261119" in html
      assert "f02-orbit" not in html and "f02-cooking" not in html
      assert html.count('data-animation="f01"')==1
      assert hashlib.sha256(z.read("assets/lottie/f01.json")).hexdigest()=="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
      assert hashlib.sha256(z.read("assets/lottie/f02-orbit.json")).hexdigest()=="adfca93e752627a83ae06d44cc667d7baf655a79f9370f07ca3306ca10567a64"
      assert hashlib.sha256(z.read("assets/lottie/f02-cooking.json")).hexdigest()=="5e341a2d8229a5dc762c720da8458608d456fd57f8d3aca83c95de5a9efc390e"
      with TemporaryDirectory(prefix="zestry-f02-removed-") as temp:
        site=Path(temp)
        z.extractall(site)
        index=site/"index.html"
        text=index.read_text()
        # Simulate the unchanged existing Render build command locally.
        old="play(name,c,name!=='f06')"
        assert text.count(old)==1
        text=text.replace(old,"play(name,c,name!=='f06'&&name!=='f03')")
        text=text.replace(
          "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
          "assets/vendor/lottie.min.js")
        text=text.replace(
          "https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/",
          "assets/photos/")
        index.write_text(text)
        vendor=site/"assets/vendor/lottie.min.js"
        vendor.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(ROOT/"assets/vendor/lottie.min.js",vendor)
        for f in (ROOT/"assets/photos").glob("*.jpg"):
          to=site/"assets/photos"/f.name
          to.parent.mkdir(parents=True,exist_ok=True)
          shutil.copy2(f,to)
        server=ThreadingHTTPServer(("127.0.0.1",18887),
                   partial(SimpleHTTPRequestHandler,directory=str(site)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        try:
          with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
            for label,w,h in [("desktop",1600,900),("mobile",390,844)]:
              try:browser_check(browser,label,w,h)
              except Exception as e:
                import traceback
                traceback.print_exc()
                report["errors"].append(label+" failed: "+str(e))
            browser.close()
        finally:
          server.shutdown()
    (OUT/"F02_REMOVAL_ACCEPTANCE.json").write_text(json.dumps(report,indent=2)+"\n")
    print("ZESTRY_F02_REMOVAL_QA",json.dumps({
      "pass":not report["errors"],"checks":len(report["tests"]),
      "errors":report["errors"],"previewDeployment":False
    })[:3000],flush=True)
    if report["errors"]:raise SystemExit(2)

if __name__=="__main__":main()
