#!/usr/bin/env python3
"""Independent live acceptance after removing rejected ZESTRY F01 artwork.

No deploy, no source mutation; tests the existing public URL in real Chromium.
"""
from datetime import datetime, timezone
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

URL="https://zestry-v3-restaurant-review-20261117.onrender.com/"
OUT=Path("projects/restaurant-demo/docs/qa/owner-f01-removed-live")
OUT.mkdir(parents=True,exist_ok=True)
report={
 "url":URL,"sha":"4b1e0751e2a7c2975e698ddb941c51c451acd91e",
 "timestamp":datetime.now(timezone.utc).isoformat(),
 "checks":[],"failures":[]
}
def check(name,valid,context):
 report["checks"].append({"name":name,"pass":bool(valid),"detail":context})
 if not valid:report["failures"].append(name)
 print("PASS" if valid else "FAIL",name,json.dumps(context,default=str)[:1400],flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
 for name,w,h in [("desktop",1600,900),("mobile",390,844)]:
  ctx=browser.new_context(viewport={"width":w,"height":h})
  page=ctx.new_page()
  errors=[];requests=[];failed=[]
  page.on("pageerror",lambda e:errors.append(str(e)))
  page.on("request",lambda r:requests.append(r.url) if "f01" in r.url.lower() else None)
  page.on("response",lambda r:failed.append([r.status,r.url]) if r.status>=400 and r.url.startswith(URL) else None)
  page.goto(URL,wait_until="domcontentloaded",timeout=40000)
  page.locator(".hero-artwork-placeholder").wait_for(timeout=22000)
  evidence=page.evaluate("""()=>{
    const h=document.documentElement.outerHTML;
    return {
      placeholder:document.querySelector('.hero-artwork-placeholder')?.textContent.trim(),
      legacyNodeCount:document.querySelectorAll('[data-animation="f01"], .f01-wood-fill, .hero-pasta').length,
      leftoverAnimation:window.lottie?.getRegisteredAnimations?.().filter(
        a=>a.wrapper?.dataset?.player==='f01').length||0,
      absenceMarker:h.includes('ZESTRY_F01_REMOVED_AWAITING_OWNER_20261118'),
      staleSourceReference:h.includes('f01-v16'),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
      header:document.querySelector('.hero h1')?.textContent.trim()
    };
  }""")
  check(name+" rejected F01 absent on live site",
        evidence["legacyNodeCount"]==0 and evidence["leftoverAnimation"]==0
        and evidence["absenceMarker"] and not evidence["staleSourceReference"],
        evidence)
  check(name+" neutral hero placeholder displayed",
        evidence["placeholder"]=="Hero artwork awaiting replacement" and
        "Fresh food." in evidence["header"] and
        not evidence["horizontalOverflow"],evidence)
  page.screenshot(path=str(OUT/(name+"-actual-deployed-empty-hero.png")))
  page.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
  page.wait_for_function("""()=>
     document.querySelector('[data-animation="f02-orbit"]')?.dataset.loaded==='yes'
  """,timeout=25000)
  chef=page.evaluate("""()=>{
    const l=window.lottie.getRegisteredAnimations().find(a=>a.wrapper?.dataset.player==='f02-orbit');
    return l?{frames:l.getDuration(true),direction:l.playDirection,svg:!!l.wrapper.querySelector('svg')}:null;
  }""")
  check(name+" original chef F02 intact",
        chef and chef["svg"] and chef["direction"]==1 and chef["frames"]==210,
        chef)
  check(name+" F01 never requested, no website runtime failures",
        not requests and not errors and not failed,
        {"f01Requests":requests,"errors":errors,"failedAssets":failed})
  ctx.close()
 browser.close()
(OUT/"F01_REMOVAL_FINAL_LIVE_ACCEPTANCE.json").write_text(
 json.dumps(report,indent=2)+"\n"
)
print("FINAL_LIVE_REMOVAL",json.dumps({
 "pass":not report["failures"],
 "checks":len(report["checks"]),
 "failures":report["failures"],
 "liveSha":report["sha"]
}),flush=True)
if report["failures"]:raise SystemExit(2)
