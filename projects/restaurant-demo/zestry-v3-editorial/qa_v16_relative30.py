#!/usr/bin/env python3
"""Native Chromium QA for ZESTRY V16 FIXED SIZE from frame 0. No deployment."""
from __future__ import annotations
import argparse
import io
import json
import math
import os
from pathlib import Path
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

TARGET_SCALE = 1.755
EXPECTED_SHA = "b7ee93ac36326e59ae35e74c36d71782fa459b18"
SAMPLE = [0, 10, 20, 22, 34, 43, 50, 51, 52, 53, 60, 84, 92, 100, 112, 120, 124, 128, 132, 160, 200, 240, 260]

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

def serve(directory: Path, port: int):
    handler = partial(Quiet, directory=str(directory))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server

def get_f01(page):
    return page.evaluate(
        """() => {
          const a = window.lottie?.getRegisteredAnimations?.().find(
            x => x.wrapper?.closest('.hero-image.hero-visual'));
          return a ? {duration:a.getDuration(true), frame:a.currentFrame,
            players:window.lottie.getRegisteredAnimations().length} : null;
        }"""
    )

def stage_metrics(page):
    return page.evaluate(
        """() => {
          const circle=document.querySelector('.hero .hero-image.hero-visual');
          const stage=document.querySelector('.hero .hero-pasta .anim');
          const r=circle.getBoundingClientRect(),s=stage.getBoundingClientRect();
          return {
            circleWidth:r.width, circleHeight:r.height,stageWidth:s.width,
            stageHeight:s.height,overflow:document.documentElement.scrollWidth>innerWidth+2,
            wood:!!circle.querySelector('svg.f01-wood-fill'),
            woodMode:stage.dataset.woodFill,
            zoom:+stage.dataset.heroZoom,
            frame:+stage.dataset.heroZoomFrame,
            bowl:window.lottie.getRegisteredAnimations()
              .find(x=>x.wrapper?.closest('.hero-image.hero-visual'))
              ?.renderer?.elements?.find(e=>e.data?.nm?.startsWith('Bowl / original static'))
              ?.layerElement?.getBoundingClientRect().width||null
          };
        }"""
    )

def frame_seek(page, f):
    return page.evaluate(
        """(f) => {
          const a=window.lottie.getRegisteredAnimations().find(
            x=>x.wrapper?.closest('.hero-image.hero-visual'));
          a.goToAndStop(f,true);
          return {
            frame:a.currentFrame,
            zoom:+a.wrapper.dataset.heroZoom
          };
        }""", f
    )

def screenshot_clip(page):
    r = page.locator(".hero .hero-image.hero-visual").bounding_box()
    assert r and r["width"]>100, r
    return {key: math.floor(r[key]) for key in ("x","y","width","height")}

def rgba_image(data):
    return np.asarray(Image.open(io.BytesIO(data)).convert("RGB"),dtype=np.int16)

def pixel_circle_baseline(page, clip):
    page.evaluate(
        "() => document.querySelector('.hero .hero-pasta .anim svg').style.setProperty('opacity','0','important')"
    )
    baseline=rgba_image(page.screenshot(clip=clip))
    page.evaluate(
        "() => document.querySelector('.hero .hero-pasta .anim svg').style.setProperty('opacity','1','important')"
    )
    h,w=baseline.shape[:2]
    yy,xx=np.ogrid[:h,:w]
    cx=w/2;cy=h/2;r=min(w,h)/2
    mask=np.logical_and((xx-cx)**2+(yy-cy)**2>(r*.96)**2,
                        (xx-cx)**2+(yy-cy)**2<=r*r)
    return baseline,mask

def count_outer(base,ring,shot):
    arr=rgba_image(shot)
    assert arr.shape == base.shape,(arr.shape,base.shape)
    diff=np.abs(arr-base).sum(axis=2)
    return int(np.count_nonzero((diff>65)&ring))

def test_frames(browser, url: str, name: str, size: tuple[int,int], out: Path):
    context=browser.new_context(viewport={"width":size[0],"height":size[1]},
                                device_scale_factor=1)
    page=context.new_page()
    errors=[];failed=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.on("response",lambda r:failed.append((r.status,r.url))
            if r.status>=400 and r.url.startswith(url) else None)
    page.goto(url,wait_until="domcontentloaded",timeout=30000)
    page.wait_for_function(
        "() => !!document.querySelector('.hero .hero-pasta .anim svg') && !!document.querySelector('svg.f01-wood-fill')",
        timeout=20000
    )
    info=get_f01(page)
    assert info and info["duration"]==261,info
    before=stage_metrics(page)
    assert before["wood"] and before["woodMode"]=="original-vector",before
    assert not before["overflow"],before
    assert abs(before["circleWidth"]-before["circleHeight"])<1,before
    assert abs(before["zoom"]-TARGET_SCALE)<.001, ('FIRST_FRAME_NOT_FULL_SIZE', before)

    clip=screenshot_clip(page)
    base,ring=pixel_circle_baseline(page,clip)
    issues=[];frames=[]
    for frame in range(261):
        moved=frame_seek(page,frame)
        shot=page.screenshot(clip=clip,timeout=20000)
        outer=count_outer(base,ring,shot)
        if outer>5:
            issues.append({"frame":frame,"outerPixels":outer,"zoom":moved["zoom"]})
        assert abs(moved["zoom"]-TARGET_SCALE)<.001, ('CAMERA_ZOOM_ANIMATION_DETECTED', frame, moved)
        if frame in SAMPLE:
            frames.append({"frame":frame,"outerPixels":outer,"zoom":moved["zoom"]})
            if frame in (0,10,20,22,34,43,60,100,128,200,240):
                f=out/(name+"-frame-"+str(frame).zfill(3)+".png")
                page.screenshot(path=str(f),clip=clip)
        if frame==128:
            assert abs(moved["zoom"]-TARGET_SCALE)<.001,moved
            assert abs(stage_metrics(page)["zoom"]-TARGET_SCALE)<.001
            if name=="desktop":
                page.screenshot(path=str(out/"v16-desktop-full-page-frame128.png"),full_page=True)
    after=stage_metrics(page)
    assert abs(after["zoom"]-TARGET_SCALE)<.001,after
    assert not errors and not failed,(errors,failed)
    assert not issues, ('CLIPPED_AT_STATIC_FULL_SIZE', issues)
    context.close()
    return {"viewport":list(size),"metric":after,"jsErrors":errors,
            "failedAssets":failed,"outerBandIssues":issues,"frames":frames}

def capture_real_playback(browser,url,name,size,out):
    context=browser.new_context(viewport={"width":size[0],"height":size[1]},
                                record_video_dir=str(out),
                                record_video_size={"width":size[0],"height":size[1]})
    page=context.new_page()
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    page.goto(url,wait_until="domcontentloaded",timeout=30000)
    page.wait_for_timeout(10500)
    metric=stage_metrics(page)
    complete=page.locator(".hero .hero-pasta .anim").get_attribute("data-motion-complete")
    assert metric["wood"] and abs(metric["zoom"]-TARGET_SCALE)<.001,(metric,complete)
    assert complete=="true",(metric,complete)
    assert not errors,errors
    page.screenshot(path=str(out/(name+"-natural-final.png")),full_page=False)
    video=page.video
    context.close()
    target=out/(name+"-V16-real-browser.webm")
    shutil.move(video.path(),target)
    assert target.stat().st_size>12000
    return {"metric":metric,"motionComplete":complete,"video":target.name}

def capture_baseline(browser,url,out):
    context=browser.new_context(viewport={"width":1600,"height":900})
    page=context.new_page()
    page.goto(url,wait_until="domcontentloaded",timeout=30000)
    page.wait_for_function(
        "() => !!document.querySelector('.hero .hero-pasta .anim svg') && !!document.querySelector('svg.f01-wood-fill')",
        timeout=20000
    )
    frame_seek(page,0)
    metric=stage_metrics(page)
    assert abs(metric["zoom"]-1.0)<.001,metric
    clip=screenshot_clip(page)
    p=out/"before-v16-dynamic-hero-frame000.png"
    page.screenshot(path=str(p),clip=clip)
    context.close()
    return metric

def comparison(out):
    before=Image.open(out/"before-v16-dynamic-hero-frame000.png").convert("RGB")
    after=Image.open(out/"desktop-frame-000.png").convert("RGB")
    assert before.size==after.size
    margin=36;header=76
    board=Image.new("RGB",(before.width*2+3*margin,before.height+header+margin),(246,242,235))
    pen=ImageDraw.Draw(board)
    pen.text((margin,25),"BEFORE - V16 STARTS SMALL",fill=(45,45,45))
    pen.text((margin*2+before.width,25),"AFTER - FULL SIZE FROM FRAME ZERO",fill=(45,45,45))
    board.paste(before,(margin,header))
    board.paste(after,(margin*2+before.width,header))
    board.save(out/"V16-static-first-frame-vs-original-zoom.png",optimize=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--review-site",required=True,type=Path)
    parser.add_argument("--baseline-site",required=True,type=Path)
    parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    s1=serve(args.review_site,18861)
    s2=serve(args.baseline_site,18862)
    report={"targetAdditionalGrowth":1.30,"relativeToV14":1.755,
            "sourceCommit":EXPECTED_SHA,"deployment":"NOT DEPLOYED",
            "creativeSignoff":"PENDING OWNER REVIEW",
            "sizes":{},"playback":{}}
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
            for name,size in (("desktop",(1600,900)),("tablet",(768,1024)),("mobile",(390,844))):
                check=test_frames(browser,"http://127.0.0.1:18861/",name,size,args.output)
                report["sizes"][name]=check
                print("FRAME_QA",name,"passed, 261 frames, edge risks:",check["outerBandIssues"],flush=True)
            for name,size in (("desktop",(1600,900)),("mobile",(390,844))):
                result=capture_real_playback(browser,"http://127.0.0.1:18861/",name,size,args.output)
                report["playback"][name]=result
                print("NATURAL_PLAYBACK",name,"passed 1.755x",flush=True)
            reduced=browser.new_context(viewport={"width":390,"height":844},reduced_motion="reduce")
            p=reduced.new_page()
            p.goto("http://127.0.0.1:18861/",wait_until="domcontentloaded")
            p.wait_for_function("() => !!document.querySelector('.hero .hero-pasta .anim svg')")
            report["reducedMotion"]=stage_metrics(p)
            assert abs(report["reducedMotion"]["zoom"]-TARGET_SCALE)<.001,report["reducedMotion"]
            reduced.close()
            report["baselineV15"]=capture_baseline(browser,"http://127.0.0.1:18862/",args.output)
            comparison(args.output)
            v16_width=report["sizes"]["desktop"]["metric"]["bowl"]
            v15_width=report["baselineV15"]["bowl"]
            if v15_width is not None and v16_width is not None:
                report["bowlDiameterRatio"]=v16_width/v15_width
                assert abs(report["bowlDiameterRatio"]-TARGET_SCALE)<0.02,report["bowlDiameterRatio"]
            print("BOWL_MEASURE",v15_width,v16_width,report.get("bowlDiameterRatio"),flush=True)
            browser.close()
    finally:
        s1.shutdown()
        s2.shutdown()
    assert not any(item["outerBandIssues"] and
                   any(x["frame"]>=92 for x in item["outerBandIssues"])
                   for item in report["sizes"].values())
    (args.output/"V16_CHROMIUM_ACCEPTANCE.json").write_text(json.dumps(report,indent=2)+"\n")
    (args.output/"README.md").write_text(
        "# ZESTRY V16 — review-only, NOT DEPLOYED\n\n"
        "**Request:** 30% larger than the deployed V15 F01 foreground, not 30% larger than V14.\n"
        "**Verified target:** 1.30 × 1.35 = 1.755× the V14 artwork size.\n"
        "**Background:** original 756.6px wooden circle and yellow accent unchanged.\n"
        "**Motion:** fixed 1.755x camera from frame 0, no enlargement transition at any time. "
        "Original 261-frame/8.7s timing and vector paths/easing preserved. "
        "Derived position-only retargeting at factor 0.82 applies from the first frame.\n\n"
        "Native Chromium captured and checked all 261 frames at desktop, tablet and mobile "
        "viewports, plus natural-speed desktop/mobile recordings, reduced-motion check, and "
        "a same-frame side-by-side before/after visual. "
        "Zero unexpected edge-band overlaps are required in all frames, including entrances.\n\n"
        "**Do not merge or deploy until the owner explicitly approves the visual.** "
        "The existing Render service and deploy branch are untouched.\n"
    )
    print("V16_REVIEW_QA_SUCCESS, NO DEPLOYMENT",flush=True)

if __name__=="__main__":
    main()
