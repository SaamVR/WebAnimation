#!/usr/bin/env python3
"""Acceptance: rejected ZESTRY F01 original art absent; all other interactions intact.

Local Chromium parity against current existing Render build command substitutions.
This runs on a QA candidate branch before merge; NO deployment inside this script.
"""
from __future__ import annotations
import io,json,zipfile,hashlib,shutil,threading
from pathlib import Path
from functools import partial
from tempfile import TemporaryDirectory
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright

ROOT=Path("projects/restaurant-demo")
OUT=ROOT/"docs/qa/owner-f01-removed"
OUT.mkdir(parents=True,exist_ok=True)
URI="http://127.0.0.1:18896/"
SHA_ORIGINAL="7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
SHA_DERIVED="14f781c6568a15fd1593b7a906c95f87b9c445bd7573cf8741bbded92ca6660d"
report={"project":"ZESTRY","change":"Remove rejected F01 hero animation and its original source awaiting user re-upload",
        "deployment":"NOT DEPLOYED","checks":[],"errors":[]}
def ck(name,condition,data):
    report["checks"].append({"name":name,"pass":bool(condition),"detail":data})
    if not condition:report["errors"].append({"name":name,"detail":data})
    print("PASS" if condition else "FAIL",name,json.dumps(data,default=str)[:2000],flush=True)

def check_site(browser,name,w,h):
    ctx=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
    page=ctx.new_page();errors=[];network=[];f01req=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("request",lambda r:f01req.append(r.url) if "f01" in r.url.lower() else None)
    page.on("response",lambda r:network.append({"status":r.status,"url":r.url})
            if r.url.startswith(URI) and r.status>=400 else None)
    page.goto(URI,wait_until="domcontentloaded",timeout=30000)
    page.locator(".hero-artwork-placeholder").wait_for(timeout=15000)
    initial=page.evaluate("""()=>({
      placeholder:document.querySelector('.hero-artwork-placeholder')?.textContent?.trim(),
      oldF01Node:document.querySelectorAll('[data-animation="f01"]').length,
      oldWoodNode:document.querySelectorAll('.f01-wood-fill').length,
      originalPastaNode:document.querySelectorAll('.hero-pasta').length,
      heroWidth:document.querySelector('.hero-image')?.getBoundingClientRect().width,
      f01AnimationCount:window.lottie?.getRegisteredAnimations?.().filter(
       a=>a.wrapper?.dataset?.player==='f01').length||0,
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
      originalHeroText:document.querySelector('.hero h1')?.textContent,
      pageHasHeroReplacementMarker:document.documentElement.outerHTML.includes(
       'ZESTRY_F01_REMOVED_AWAITING_OWNER_20261118')
    })""")
    ck(name+" hero old F01 illustration absent",initial["oldF01Node"]==0 and
       initial["oldWoodNode"]==0 and initial["originalPastaNode"]==0 and
       initial["f01AnimationCount"]==0 and initial["pageHasHeroReplacementMarker"],initial)
    ck(name+" neutral placeholder and original marketing content",
       initial["placeholder"]=="Hero artwork awaiting replacement" and
       initial["heroWidth"]>180 and "Fresh food." in initial["originalHeroText"] and
       not initial["horizontalOverflow"],initial)
    page.screenshot(path=str(OUT/f"{name}-hero-empty-placeholder.png"))
    kitchen=page.locator('[data-animation="f02-orbit"]')
    kitchen.scroll_into_view_if_needed(timeout=15000)
    page.wait_for_function("""()=>document.querySelector('[data-animation="f02-orbit"]')?.dataset.loaded==='yes'""",
                           timeout=20000)
    chef=page.evaluate("""()=>{
       const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player==='f02-orbit');
       return a?{frame:a.currentFrame,duration:a.getDuration(true),loop:a.loop,
                 direction:a.playDirection,rendered:!!a.wrapper.querySelector('svg')}:null;
    }""")
    ck(name+" original chef animation still playable",
       chef and chef["duration"]==210 and chef["direction"]==1 and chef["rendered"],chef)
    page.screenshot(path=str(OUT/f"{name}-other-animation-unchanged.png"))
    menu=page.locator("#menu")
    menu.scroll_into_view_if_needed(timeout=15000)
    frame=page.frame_locator("#f05-book-frame")
    frame.locator("#state").wait_for(timeout=30000)
    frame.get_by_role("button",name="Open menu book").click()
    real=next(f for f in page.frames if "f05_book.html" in f.url)
    real.wait_for_function("""()=>document.body.dataset.f05State==='Overview'""",timeout=30000)
    frame.get_by_role("button",name="Choose Starters").click()
    real.wait_for_function("""()=>document.body.dataset.f05State==='Starters'""",timeout=30000)
    frame.locator("button.dish").first.click()
    page.wait_for_function("""()=>Number(document.querySelector('#bag-count')?.textContent)>=1""",timeout=10000)
    count=page.locator("#bag-count").inner_text()
    ck(name+" F05 menu still opens and adds simulated dish",count=="1",
       {"count":count,"state":"Starters"})
    page.locator("#cart-open").click()
    page.locator("#cart-checkout").click()
    page.locator("#pickup-name").fill("Demo Visitor")
    page.locator("#pickup-phone").fill("5550100321")
    page.locator("#pickup-form button[type=submit]").click()
    page.locator("#confirm-player svg").wait_for(timeout=20000)
    msg=page.locator("#modal").inner_text()
    ck(name+" F04 checkout confirmation preserved",
       "Sample order received" in msg and
       page.locator("#confirm-player svg").count()>0,{"message":msg[:180]})
    page.locator("#modal button.x[data-close]").click()
    page.locator('button[data-book]').first.click()
    page.locator('#date').fill("2026-12-01")
    for key in ["time","guests"]:
        vals=page.locator('#'+key+' option').evaluate_all(
            "(items)=>items.map(x=>x.value).filter(Boolean)")
        if vals:page.locator('#'+key).select_option(vals[0])
    page.locator("#guestname").fill("Demo Visitor")
    page.locator("#email").fill("demo@example.com")
    page.locator("#booking-form button[type=submit]").click()
    page.wait_for_timeout(750)
    reservation=page.locator("#modal").inner_text()
    ck(name+" F07 booking confirmation preserved",
       "Sample table request received" in reservation,{"message":reservation[:180]})
    ck(name+" F01 never requested and no site errors",not f01req and not errors and not network,
       {"F01Requests":f01req,"jsErrors":errors,"failedSiteAssets":network})
    ctx.close()

def main():
    parts=sorted((ROOT/"review_bundle").glob("part-*.bin"))
    with zipfile.ZipFile(io.BytesIO(b"".join(x.read_bytes() for x in parts))) as z:
        assert z.testzip() is None
        names=z.namelist()
        assert "assets/lottie/f01-v16.json" not in names
        assert "assets/lottie/f01.json" in names
        stub=z.read("assets/lottie/f01.json")
        assert len(stub)<1500
        assert hashlib.sha256(stub).hexdigest()!=SHA_ORIGINAL
        assert 'F01_REMOVED__EMPTY_RENDER_BUILD_VALIDATION_ONLY' in stub.decode()
        assert all(x.get("ty")==3 for x in json.loads(stub)["layers"])
        assert not (ROOT/"assets/lottie/f01.json").exists(),"Raw F01 artwork must be git rm'd"
        index=z.read("index.html").decode()
        assert "ZESTRY_F01_REMOVED_AWAITING_OWNER_20261118" in index
        assert 'data-animation="f01"' not in index
        assert 'f01-v16' not in index
        assert "mountF01" not in index
        assert "ZESTRY_PERF_V17_ENTRY" not in index
        assert "ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER" not in index
        assert "play(name,c,name!=='f06')" in index
        for file in ["f02-orbit","f02-cooking","f03","f04","f06","f07"]:
            assert "assets/lottie/"+file+".json" in names,file
        ck("original F01 source removed from GitHub working tree",True,
            {"originalSourceDeleted":"projects/restaurant-demo/assets/lottie/f01.json",
             "derivedSourceDeletedFromZIP":True,
             "renderBuildSentinelOnly":True})
        with TemporaryDirectory(prefix="zestry-f01-gone-") as tmp:
            site=Path(tmp)
            z.extractall(site)
            html=site.joinpath("index.html").read_text()
            # Exact existing Render static-site rewrite; no hosting config edits.
            old="play(name,c,name!=='f06')"
            assert html.count(old)==1
            html=html.replace(old,"play(name,c,name!=='f06'&&name!=='f03')")
            html=html.replace(
              'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js',
              'assets/vendor/lottie.min.js')
            html=html.replace(
              'https://zestry-v2-review-prototype-samvrc.vercel.app/assets/photos/',
              'assets/photos/')
            site.joinpath("index.html").write_text(html)
            vendor=site/"assets/vendor/lottie.min.js"
            vendor.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(ROOT/"assets/vendor/lottie.min.js",vendor)
            for f in (ROOT/"assets/photos").glob("*.jpg"):
                dest=site/"assets/photos"/f.name
                dest.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(f,dest)
            # Preserve unchanged existing Render build contract without loading
            # an actual F01 artifact.
            for n in ["f01","f02-orbit","f02-cooking","f03","f04","f06","f07"]:
                j=json.loads((site/f"assets/lottie/{n}.json").read_text())
                assert j["fr"]>0 and j["op"]>j["ip"] and j["layers"]
            assert (site/"assets/f05_interactive.html").stat().st_size>1_000_000
            server=ThreadingHTTPServer(("127.0.0.1",18896),
                partial(SimpleHTTPRequestHandler,directory=str(site)))
            threading.Thread(target=server.serve_forever,daemon=True).start()
            try:
                with sync_playwright() as p:
                    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
                    for name,w,h in [("desktop",1600,900),("mobile",390,844)]:
                        try:check_site(browser,name,w,h)
                        except Exception as e:
                            import traceback;traceback.print_exc()
                            report["errors"].append({"name":name+" fatal","message":str(e)})
                    browser.close()
            finally:server.shutdown()
    (OUT/"F01_REMOVAL_ACCEPTANCE.json").write_text(json.dumps(report,indent=2)+"\n")
    print("F01_REMOVAL_QA_RESULT",json.dumps({
        "pass":not report["errors"],"totalChecks":len(report["checks"]),
        "errors":report["errors"]})[:3500],flush=True)
    if report["errors"]:raise SystemExit(3)
if __name__=="__main__":main()
