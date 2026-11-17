#!/usr/bin/env python3
"""Capture NOVA's ACTUAL runtime via Chromium; do not replace GLTF with an imitation."""
import json, subprocess, time, threading, functools, shutil
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[3]
SITE = ROOT / "sources" / "portfolio" / "NovaAG"
OUT = Path("out/nova")
OUT.mkdir(parents=True, exist_ok=True)
assert (SITE/"assets/headphones-web.gltf").is_file(), "original GLTF not available"
server = ThreadingHTTPServer(("127.0.0.1",18888),functools.partial(SimpleHTTPRequestHandler,directory=str(SITE)))
threading.Thread(target=server.serve_forever,daemon=True).start()
result={"source_repo":"SaamVR/Portfolio", "source_branch":"feat/leadflow-v2-evidence-20261012", "source_path":"NovaAG/", "verified_runtime":False, "frame_count":0, "errors":[]}
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium") or None,args=["--no-sandbox","--enable-unsafe-swiftshader","--use-angle=swiftshader","--disable-dev-shm-usage"])
        page=browser.new_page(viewport={"width":1280,"height":720},device_scale_factor=1)
        page.on("pageerror",lambda e:result["errors"].append(str(e)))
        page.goto("http://127.0.0.1:18888/",wait_until="domcontentloaded",timeout=30000)
        try:
            page.wait_for_function("document.body.dataset.modelState === 'ready'",timeout=25000)
        except Exception:
            result["errors"].append("3D ready state not reached")
        result["modelState"]=page.evaluate("document.body.dataset.modelState")
        result["verified_runtime"] = result["modelState"]=="ready"
        result["scrollHeight"]=page.evaluate("document.documentElement.scrollHeight")
        page.screenshot(path=str(OUT/"runtime_state.png"))
        if not result["verified_runtime"]:
            raise RuntimeError("NOVA 3D model not ready; capture intentionally blocked to avoid static mockup")
        for f in range(120):
            progress=f/119
            # Travel from hero through design/controls and back toward hero; no fake animation.
            scroll_f=progress*.75
            page.evaluate("(q) => window.scrollTo(0,q*(document.documentElement.scrollHeight-window.innerHeight))",scroll_f)
            page.wait_for_timeout(32)
            page.screenshot(path=str(OUT/f"frame_{f:04d}.jpg"),quality=88,type="jpeg",animations="disabled")
            result["frame_count"]+=1
        browser.close()
    cmd=["ffmpeg","-y","-hide_banner","-loglevel","error","-framerate","24","-i",str(OUT/"frame_%04d.jpg"),"-frames:v","120","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-movflags","+faststart",str(OUT/"NOVA_verified_webgl_scroll_5s.mp4")]
    subprocess.run(cmd,check=True)
finally:
    (OUT/"capture_evidence.json").write_text(json.dumps(result,indent=2))
    server.shutdown()
print(json.dumps(result,indent=2))
