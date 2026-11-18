#!/usr/bin/env python3
"""Record only the genuine deployed CITYSHIFT V1 route and vehicle (no fake route geometry).
Repo source stays private. Public site screenshots are a portfolio demonstration.
"""
import json, functools, subprocess, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
O=Path("out/cityshift");O.mkdir(parents=True,exist_ok=True)
url="https://cityshift-v1-demo.onrender.com"
evidence={"url":url,"source_branch":"SaamVR/CityShift release/cityshift-v1-20261118","status":"BLOCKED","frames":0,"errors":[],"simulation":True}
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=shutil.which("google-chrome") or shutil.which("google-chrome-stable") or None,args=["--no-sandbox","--disable-dev-shm-usage"])
 page=b.new_page(viewport={"width":1280,"height":720},device_scale_factor=1)
 page.on("pageerror",lambda exc:evidence["errors"].append(str(exc)))
 try:
  response=page.goto(url,timeout=30000,wait_until="domcontentloaded")
  evidence["http"]=response.status if response else None
  page.wait_for_selector("#mapViewport",timeout=15000)
  evidence["title"]=page.title()
  page.locator('button[data-route-preset="chelsea>parkSlope"]').click(timeout=10000)
  page.wait_for_timeout(1200)
  # Route preset may auto-calculate; pressing explicit calculate ensures actual source rendering.
  page.locator("#calculateRoute").click(timeout=10000)
  page.wait_for_timeout(1600)
  evidence["routeStatus"]=page.locator("#routeStatus").inner_text()
  evidence["routeMiles"]=page.locator("#routeMiles").inner_text()
  evidence["routeDuration"]=page.locator("#routeDuration").inner_text()
  evidence["route_ready"]=evidence["routeMiles"] not in ("—","--","","0.0 mi")
  page.locator("#map").scroll_into_view_if_needed()
  page.screenshot(path=str(O/"map_proof.png"))
  if not evidence["route_ready"]:
   raise RuntimeError("No route distance returned; refusing to record as verified road route")
  for f in range(48):
   page.screenshot(path=str(O/f"frame_{f:04d}.jpg"),type="jpeg",quality=91)
   page.wait_for_timeout(32)
  page.locator("#openTrackFromMap").click(timeout=10000)
  page.wait_for_timeout(250)
  page.locator("#tracking").scroll_into_view_if_needed()
  page.locator("#playVehicle").click(timeout=10000)
  evidence["tracking_canvas_exists"]=page.locator("#trackCanvas").count()==1
  for f in range(48,144):
   page.screenshot(path=str(O/f"frame_{f:04d}.jpg"),type="jpeg",quality=91)
   page.wait_for_timeout(35)
  evidence["frames"]=144
  evidence["status"]="RUNTIME_CAPTURED"
  evidence["trackingPercent"]=page.locator("#trackingPercent").inner_text()
  evidence["vehicleLocation"]=page.locator("#vehicleLocation").inner_text()
 except Exception as exc:
  evidence["errors"].append(repr(exc))
  page.screenshot(path=str(O/"blocked_screenshot.png"))
 finally:
  b.close()
(O/"evidence.json").write_text(json.dumps(evidence,indent=2))
print(json.dumps(evidence,indent=2))
if evidence["status"]!="RUNTIME_CAPTURED":
 raise SystemExit(2)
