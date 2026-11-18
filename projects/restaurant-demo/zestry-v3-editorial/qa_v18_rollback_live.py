#!/usr/bin/env python3
"""Live rollback verification: V17 remains brood-safe, no V18 scene-loop controller.

Checks the same existing Render URL using actual Chromium, not offline
composites. Writes desktop/mobile evidence to a QA-only branch.
"""
from __future__ import annotations

import io
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright

URL = "https://zestry-v3-restaurant-review-20261117.onrender.com/"
SHA = "2bdfe0c6d19050bb1e44ae79640a547ddb62844d"
OUT = Path("projects/restaurant-demo/docs/qa/v18-rollback-live-proof")
OUT.mkdir(parents=True, exist_ok=True)
report = {"url": URL, "deployedSHA": SHA, "atUTC": datetime.now(timezone.utc).isoformat(),
          "tests": [], "failures": []}


def record(name, passes, detail):
    report["tests"].append({"test": name, "pass": bool(passes), "detail": detail})
    if not passes:
        report["failures"].append(name)
    print("PASS" if passes else "FAIL", name, json.dumps(detail, default=str)[:1200], flush=True)


def get_f01(page):
    return page.evaluate("""() => {
      const a = window.lottie.getRegisteredAnimations()
        .find(a => a.wrapper?.dataset?.player === 'f01');
      if (!a) return null;
      const el = a.renderer.elements.find(x => x?.data?.ind === 28)?.layerElement;
      const ids = [...document.querySelectorAll('[id]')].map(x => x.id);
      return {frame:a.currentFrame, loop:a.loop, direction:a.playDirection,
        scale:a.wrapper.dataset.heroZoom, complete:a.wrapper.dataset.motionComplete,
        wood:!!document.querySelector('svg.f01-wood-fill'),
        brothClip:el?.getAttribute('clip-path'),
        duplicates:[...new Set(ids)].filter(id => ids.indexOf(id) !== ids.lastIndexOf(id))};
    }""")


def test(browser, viewport, w, h):
    context = browser.new_context(viewport={"width": w, "height": h},
       device_scale_factor=1,record_video_dir=str(OUT),record_video_size={"width": w, "height": h})
    page = context.new_page()
    errors = []
    failures = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response", lambda r: failures.append((r.status,r.url))
            if r.status >= 400 and r.url.startswith(URL) else None)
    page.goto(URL, wait_until="domcontentloaded", timeout=45000)
    page.wait_for_function("""() => document.querySelector('[data-animation="f01"]')?.dataset.loaded === 'yes'
      && !!document.querySelector('svg.f01-wood-fill')""",timeout=30000)
    version = page.evaluate("""async () => {
      const index = await (await fetch(location.pathname,{cache:'no-store'})).text();
      const css = getComputedStyle(document.querySelector('.hero .hero-pasta .anim svg')).transform;
      return {v18PlaybackMarker:index.includes('ZESTRY_V18_VIEWPORT_PLAYBACK_CONTROLLER'),
              brothRepairMarker:index.includes('ZESTRY_F01_WOOD_DEFS_ID_NAMESPACE_20261118'),
              cssTransform:css};
    }""")
    record(viewport+" reverted to V17, broth repair kept",
       not version["v18PlaybackMarker"] and version["brothRepairMarker"],version)
    initial = get_f01(page)
    record(viewport+" F01 one-shot policy and fixed scale",
       initial is not None and initial["loop"] is False and
       initial["scale"]=="1.755000" and initial["wood"] and not initial["duplicates"],initial)
    page.wait_for_function("""() => document.querySelector('[data-animation="f01"]')
       ?.dataset.motionComplete === 'true'""",timeout=22000)
    final = get_f01(page)
    frame_before = final["frame"]
    page.wait_for_timeout(2800)
    final_after = get_f01(page)
    record(viewport+" plate stays finished; no automatic restart",
       final["complete"]=="true" and final_after["complete"]=="true" and
       final_after["loop"] is False and abs(frame_before-final_after["frame"]) < .01 and
       final_after["frame"] >= 259, {"before":final,"after":final_after})
    clip = page.locator(".hero-image.hero-visual").bounding_box()
    colored=page.screenshot(clip=clip)
    (OUT/f"{viewport}-V17-finished-broth.png").write_bytes(colored)
    page.evaluate("""() => {
      const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player === 'f01');
      a.renderer.elements.find(x=>x?.data?.ind===28).layerElement
        .style.setProperty('visibility','hidden','important');
    }""")
    page.wait_for_timeout(70)
    hidden = page.screenshot(clip=clip)
    diff = ImageChops.difference(Image.open(io.BytesIO(colored)).convert("RGB"),
                                 Image.open(io.BytesIO(hidden)).convert("RGB")).convert("L")
    broth_pixels = sum(n for i,n in enumerate(diff.histogram()) if i>8)
    record(viewport+" broth visible on completed plate",broth_pixels>(500 if viewport=="desktop" else 80),
           {"brothPixels":broth_pixels})
    page.evaluate("""() => {
      const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player === 'f01');
      a.renderer.elements.find(x=>x?.data?.ind===28).layerElement
        .style.removeProperty('visibility');
    }""")
    page.locator('[data-animation="f02-orbit"]').scroll_into_view_if_needed()
    page.wait_for_function("""() => document.querySelector('[data-animation="f02-orbit"]')
      ?.dataset.loaded === 'yes'""",timeout=25000)
    orbit = page.evaluate("""() => {
      const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.dataset?.player === 'f02-orbit');
      return {frame:a.currentFrame,loop:a.loop,direction:a.playDirection,
         noV18PingPong:!a.wrapper.dataset.motionPolicy};
    }""")
    record(viewport+" F02 former playback restored; no reversal controller",
           orbit["loop"] is True and orbit["direction"] == 1 and orbit["noV18PingPong"],orbit)
    page.screenshot(path=str(OUT/f"{viewport}-V17-chef-restored.png"))
    record(viewport+" no page or site-request failures",not errors and not failures,
           {"jsErrors":errors,"httpErrors":failures})
    video = page.video
    context.close()
    (OUT/f"{viewport}-actual-V17-rollback.webm").write_bytes(Path(video.path()).read_bytes())


def main():
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            test(browser,"desktop",1600,900)
            test(browser,"mobile",390,844)
            browser.close()
    except Exception as e:
        import traceback
        traceback.print_exc()
        report["failures"].append("fatal: "+repr(e))
    finally:
        (OUT/"ROLLBACK_LIVE_QA.json").write_text(json.dumps(report,indent=2)+"\n")
        print("ROLLBACK_RESULT",json.dumps({"passed":not report["failures"],
             "checks":len(report["tests"]),"failed":report["failures"]}),flush=True)
    if report["failures"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
