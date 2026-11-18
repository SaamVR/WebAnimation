#!/usr/bin/env python3
"""Independent final live-browser acceptance of the EXISTING ZESTRY Render service.

This script never deploys, does not edit the live site, and does not use offline
composites. Capture original URL in Chromium desktop/mobile with real playback.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

URL="https://zestry-v3-restaurant-review-20261117.onrender.com/"
MERGED_SHA="1c1406b391cfa7979ff05cea53d3feec758c7f8b"
OUT=Path(os.environ.get("ZESTRY_QA_DIR","/tmp/zestry-v17-live-qa"))
OUT.mkdir(parents=True,exist_ok=True)
report={"url":URL,"deployed_sha_expected":MERGED_SHA,
        "captured_at":datetime.now(timezone.utc).isoformat(),
        "render_service_reused":"srv-dbtkitifngtc73cua2p0",
        "checks":{},"issues":[]}
def check(cond,name,data=None):
    report["checks"][name]={"pass":bool(cond),"detail":data}
    print("PASS" if cond else "FAIL",name,json.dumps(data,default=str)[:1000],flush=True)
    if not cond:report["issues"].append({"name":name,"detail":data})
def metric(p):
    return p.evaluate("""() => {
      const host=document.querySelector('.hero .hero-pasta .anim');
      const player=window.lottie?.getRegisteredAnimations?.().find(a=>
        a.wrapper?.closest('.hero-image.hero-visual'));
      return {
        frame:player?.currentFrame,durationFrames:player?.getDuration(true),
        frameRate:player?.frameRate,subframe:player?.isSubframeEnabled,
        zoom:Number(host?.dataset.heroZoom),complete:host?.dataset.motionComplete,
        wood:!!document.querySelector('.f01-wood-fill'),
        overflow:document.documentElement.scrollWidth>innerWidth+2,
        lazyMenuSrc:document.querySelector('#f05-book-frame')?.getAttribute('src'),
        lazyMenuDataSrc:document.querySelector('#f05-book-frame')?.dataset.src
      };
    }""")

def test_real_playback(browser,name,w,h):
    context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1,
                                record_video_dir=str(OUT),record_video_size={"width":w,"height":h})
    p=context.new_page()
    errors=[];failed=[]
    p.on("pageerror",lambda e:errors.append(str(e)))
    p.on("response",lambda r:failed.append({"status":r.status,"url":r.url})
         if r.status>=400 and r.url.startswith(URL) else None)
    p.goto(URL,wait_until="domcontentloaded",timeout=45000)
    p.wait_for_function("""() => !!document.querySelector('.hero .hero-pasta .anim svg')
                       && !!document.querySelector('.f01-wood-fill')""",timeout=30000)
    start=metric(p)
    check(start["zoom"]==1.755 and start["wood"] and
          start["frameRate"]==30 and start["subframe"] is False and
          not start["overflow"] and start["durationFrames"]==261,
          name+"_initial_fixed_F01",start)
    check(start["lazyMenuSrc"] is None and start["lazyMenuDataSrc"]=="assets/f05_book.html",
          name+"_lazy_F05",{"src":start["lazyMenuSrc"],"dataSrc":start["lazyMenuDataSrc"]})
    p.screenshot(path=str(OUT/(name+"-initial.png")))
    p.wait_for_timeout(10500)
    end=metric(p)
    check(end["zoom"]==1.755 and end["complete"]=="true" and
          end["frame"]==260 and end["wood"] and not end["overflow"],
          name+"_natural_8_7s_completion",end)
    p.screenshot(path=str(OUT/(name+"-final.png")))
    check(not errors and not failed,name+"_no_runtime_or_origin_asset_errors",
          {"errors":errors,"failedResponses":failed})
    video=p.video
    context.close()
    dest=OUT/(name+"-actual-live-Chromium.webm")
    shutil.move(video.path(),dest)
    check(dest.stat().st_size>12000,name+"_real_browser_recording",
          {"bytes":dest.stat().st_size,"file":dest.name})

def test_assets_and_menu(browser):
    c=browser.new_context(viewport={"width":1440,"height":900})
    p=c.new_page();errors=[];failed=[]
    p.on("pageerror",lambda e:errors.append(str(e)))
    p.on("response",lambda r:failed.append((r.status,r.url))
         if r.status>=400 and r.url.startswith(URL) else None)
    p.goto(URL,wait_until="domcontentloaded",timeout=45000)
    p.wait_for_function("() => !!document.querySelector('.hero .hero-pasta .anim svg')",timeout=30000)
    assets=p.evaluate("""async () => {
      const html=document.documentElement.outerHTML;
      const [book,photo,f01]=await Promise.all([
        fetch('assets/f05_book.html',{cache:'no-store'}),
        fetch('assets/photos/restaurant.webp',{cache:'no-store'}),
        fetch('assets/lottie/f01-v16.json',{cache:'no-store'})
      ]);
      const text=await book.text(),bytes=await photo.arrayBuffer();
      const raw=await f01.text();
      return {
        fixedHero:html.includes('scale(1.755000)'),
        authored30fps:html.includes('setSubframe(false)'),
        menuDeferredMarker:html.includes('ZESTRY_PERF_V17_ENTRY'),
        readyQueueMarker:text.includes('ZESTRY_PERF_V17_READY_QUEUE'),
        photoStatus:photo.status,photoType:photo.headers.get('content-type'),
        photoBytes:bytes.byteLength,f01Status:f01.status,f01Bytes:raw.length
      };
    }""")
    check(all([assets["fixedHero"],assets["authored30fps"],assets["menuDeferredMarker"],
               assets["readyQueueMarker"],assets["photoStatus"]==200,
               assets["f01Status"]==200,assets["f01Bytes"]>1_000_000]),
          "live_assets_are_V17_1_not_cached_V15",assets)

    menu=p.locator("#menu")
    menu.scroll_into_view_if_needed()
    frame=p.frame_locator("#f05-book-frame")
    frame.locator("#state").wait_for(timeout=25000)
    p.wait_for_function("""() => document.querySelector('#f05-book-frame')
           ?.contentWindow?.F05_QA !== undefined""",timeout=25000)
    # A click can happen while ZIP is still initializing; V17.1 queues it.
    frame.get_by_role("button",name="Open menu book").click()
    actual=p.frame(url=lambda u:"f05_book.html" in u)
    actual.wait_for_function("""() =>
        document.body.dataset.f05State==='Overview' """,timeout=35000)
    frame.get_by_role("button",name="Choose Starters").click()
    actual.wait_for_function("""() =>
        document.body.dataset.f05State==='Starters' """,timeout=35000)
    frame.locator("button.dish").first.click()
    p.wait_for_function("""() => Number(document.querySelector('#bag-count')?.textContent)===1""",timeout=10000)
    p.screenshot(path=str(OUT/"live-menu-added-dish.png"))
    check(True,"F05_book_menu_to_cart",{"state":"Starters","bagCount":"1"})
    # Checkout + one-shot F04
    p.locator("#cart-open").click()
    p.locator("#cart-checkout").click()
    form=p.locator("#pickup-form");form.wait_for(timeout=10000)
    p.locator("#pickup-name").fill("Demo Visitor")
    p.locator("#pickup-phone").fill("5550100100")
    options=p.locator("#pickup-slot option").evaluate_all("(xs)=>xs.map(x=>x.value).filter(Boolean)")
    if options:p.locator("#pickup-slot").select_option(options[0])
    form.locator("button[type=submit]").click()
    p.locator("#confirm-player svg").wait_for(timeout=20000)
    txt=p.locator("#modal").inner_text()
    check("Sample order received" in txt,"F04_checkout_confirmation",
          {"text":txt[:150],"f04Svg":True})
    p.screenshot(path=str(OUT/"live-F04-checkout-confirmation.png"))
    p.locator("#modal button.x[data-close]").click()
    p.locator("button[data-book]").first.click()
    booking=p.locator("#booking-form");booking.wait_for(timeout=10000)
    p.locator("#date").fill("2026-12-01")
    for identifier in ["time","guests"]:
        opts=p.locator("#"+identifier+" option").evaluate_all("(xs)=>xs.map(x=>x.value).filter(Boolean)")
        if opts:p.locator("#"+identifier).select_option(opts[0])
    p.locator("#guestname").fill("Demo Visitor")
    p.locator("#email").fill("demo@example.com")
    booking.locator("button[type=submit]").click()
    p.wait_for_timeout(1300)
    message=p.locator("#modal").inner_text()
    check("Sample table request received" in message,"F07_sample_reservation",
          {"text":message[:160]})
    p.screenshot(path=str(OUT/"live-F07-booking-confirmation.png"))
    check(not errors and not failed,"F05_F04_F07_no_browser_errors",
          {"errors":errors,"assetErrors":failed})
    c.close()

def main():
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
            test_real_playback(browser,"desktop",1600,900)
            test_real_playback(browser,"mobile",390,844)
            test_assets_and_menu(browser)
            browser.close()
    except Exception as e:
        import traceback
        report["issues"].append({"name":"fatal","detail":repr(e)})
        traceback.print_exc()
    finally:
        (OUT/"ZESTRY_V17_1_FINAL_LIVE_QA.json").write_text(
            json.dumps(report,indent=2)+"\n")
        print("FINAL_RESULT",json.dumps({
            "pass":not report["issues"],"issues":report["issues"],
            "sha":MERGED_SHA,"url":URL,
            "numberOfChecks":len(report["checks"])
        },default=str)[:3500],flush=True)
    if report["issues"]:raise SystemExit(2)

if __name__=="__main__":
    main()
