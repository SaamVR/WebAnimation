#!/usr/bin/env python3
"""Find a safe *position-only* entrance correction for constant-size V16 F01.

All artwork, layer scales, shapes and clocks stay fixed. Only the paths of
moving ingredients may shift inward before frame 92. Preview only: never deploy.
"""
from __future__ import annotations
import argparse
import copy
import io
import json
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright
import numpy as np
from PIL import Image
from qa_v16_relative30 import serve, frame_seek, screenshot_clip, pixel_circle_baseline, count_outer, stage_metrics

FRAMES=sorted(set(
  list(range(0,17,4))
  + list(range(17,67))
  + [70,75,80,84,85,86,90,92,96,104,112,120,128,140,160,200,240,260]
))
EARLY_FACTORS=[0.74,0.66,0.58,0.50,0.42,0.34,0.26]
LATE_Q=0.82
def smooth(x):
    t=max(0.,min(1.,x))
    return t*t*(3-2*t)
def derive(source,early_q):
    a=copy.deepcopy(source)
    count=0
    for layer in a["layers"]:
        if not 5 <= layer.get("ind",0) <= 27:continue
        p=layer.get("ks",{}).get("p",{})
        if p.get("a")!=1:continue
        keys=p.get("k",[])
        for i,kf in enumerate(keys):
            for side in ("s","e"):
                value=kf.get(side)
                if not isinstance(value,list) or len(value)<2:continue
                frame=kf["t"] if side=="s" or i+1>=len(keys) else keys[i+1]["t"]
                factor=early_q+(LATE_Q-early_q)*smooth((frame-68.)/24.)
                value[0]=round(992.+(value[0]-992.)*factor,5)
                value[1]=round(567.+(value[1]-567.)*factor,5)
                count+=1
    assert count==6003
    return json.dumps(a,separators=(",",":")).encode("utf8")

def test(browser, url, samples, out, name):
    context=browser.new_context(viewport={"width":1600,"height":900})
    page=context.new_page()
    errors=[];failed=[]
    page.on("pageerror",lambda e: errors.append(str(e)))
    page.on("response",lambda r: failed.append((r.status,r.url)) if r.status>=400 and r.url.startswith(url) else None)
    page.goto(url,wait_until="domcontentloaded",timeout=30000)
    page.wait_for_function("() => !!document.querySelector('.hero .hero-pasta .anim svg')",timeout=15000)
    m=stage_metrics(page)
    assert abs(m["zoom"]-1.755)<0.001,("START_NOT_FULL_SIZE",m)
    clip=screenshot_clip(page)
    base,ring=pixel_circle_baseline(page,clip)
    risky=[];seen=[]
    for f in samples:
        x=frame_seek(page,f)
        assert abs(x["zoom"]-1.755)<0.001,("ZOOM_TRANSITION_REINTRODUCED",f,x)
        shot=page.screenshot(clip=clip,timeout=15000)
        n=count_outer(base,ring,shot)
        seen.append({"frame":f,"outerBand":n})
        if n>5:risky.append({"frame":f,"outerBand":n})
        if f in (0,22,34,43,56,84,128,240):
            (out/(name+"-frame-"+str(f).zfill(3)+".png")).write_bytes(shot)
    context.close()
    return {"riskCount":len(risky),"worst":max(seen,key=lambda x:x["outerBand"]),"risky":risky,
            "errors":errors,"missingAssets":failed,"initialMetric":m}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--review-site",type=Path,required=True)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    canonical=args.review_site/"assets/lottie/f01.json"
    derived=args.review_site/"assets/lottie/f01-v16.json"
    original=json.loads(canonical.read_text())
    http=serve(args.review_site,18861)
    report={"goal":"fixed foreground scale 1.755 from frame 0", "testedFrames":FRAMES,
            "lateIngredientCenterFactor":LATE_Q,"candidates":[]}
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
            selected=None
            for q in EARLY_FACTORS:
                name=("early-"+str(q)).replace(".","_")
                derived.write_bytes(derive(original,q))
                current=test(browser,"http://127.0.0.1:18861/",FRAMES,args.output,name)
                entry={"earlyQ":q,**current}
                report["candidates"].append(entry)
                print("ENTRANCE_SWEEP",json.dumps({"earlyQ":q,"riskCount":entry["riskCount"],
                  "firstProblems":entry["risky"][:12],"worst":entry["worst"],
                  "errors":entry["errors"]}),flush=True)
                if not current["risky"] and not current["errors"] and not current["missingAssets"]:
                    selected=q
                    break
            report["selectedEarlyQ"]=selected
            if selected is not None:
                (args.output/"V16_SELECTED_EARLY_FACTOR.txt").write_text(str(selected))
                print("ENTRANCE_SWEEP_SAFE",selected,flush=True)
            else: print("ENTRANCE_SWEEP_NO_SAFE_VARIANT",flush=True)
            browser.close()
    finally:
        http.shutdown()
    (args.output/"V16_ENTRANCE_SWEEP.json").write_text(json.dumps(report,indent=2)+"\n")
    if report["selectedEarlyQ"] is None:raise SystemExit("No tested position factor avoids circular clipping. V16 remains unapproved.")

if __name__=="__main__":
    main()
