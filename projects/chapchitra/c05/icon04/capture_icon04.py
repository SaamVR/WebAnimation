#!/usr/bin/env python3
"""Record Icon 04's actual bundled Lottie-web playback locally, without hosting.

Requires: python -m pip install playwright; python -m playwright install chromium
Run next to ICON04_V3_LOCAL_REVIEW.html: python capture_icon04.py
Writes ICON04_V3_REVIEW.webm and annotated proof screenshots under local-evidence/.
"""
from pathlib import Path
import os

from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
HTML=HERE/"ICON04_V3_LOCAL_REVIEW.html"
OUT=HERE/"local-evidence"
OUT.mkdir(exist_ok=True)
VIDEO=OUT/"ICON04_V3_REVIEW.webm"

def main():
    assert HTML.exists(), f"Missing {HTML}"
    assert (HERE/"lottie.min.js").exists(), "Bundled Lottie-web runtime missing"
    with sync_playwright() as p:
        kw={"headless":True}
        if os.environ.get("CHROMIUM_PATH"):
            kw["executable_path"]=os.environ["CHROMIUM_PATH"]
        browser=p.chromium.launch(**kw)
        context=browser.new_context(
            viewport={"width":512,"height":512},
            device_scale_factor=1,
            reduced_motion="no-preference",
            record_video_dir=str(OUT),
            record_video_size={"width":512,"height":512},
        )
        page=context.new_page()
        page.goto(HTML.resolve().as_uri(),wait_until="domcontentloaded")
        page.wait_for_function(
          "() => document.getElementById('status').textContent.includes('Native Lottie-web')",
          timeout=20000,
        )
        # Capture only the icon, without cropping or clipping its animated entrance.
        page.add_style_tag(content="""
          html,body{margin:0!important;padding:0!important;background:#f6f7f5!important}
          main{max-width:none!important;width:512px!important}
          .board{width:512px!important;max-width:512px!important;
            margin:0!important;padding:0!important;border:0!important;
            border-radius:0!important;box-shadow:none!important}
          .stage{width:512px!important;height:512px!important;max-width:none!important}
          .stage,#animation,#animation svg{overflow:visible!important}
          main>h1,main>.sub,main>.controls,main>.status,main>p{display:none!important}
        """)
        page.locator("#replay").click()
        # Record the actual SVG rendering in Chromium at natural speed.
        page.wait_for_timeout(2300)
        page.screenshot(path=str(OUT/"ICON04_V3_FINAL.png"))
        for frame in [0,16,18,21,27,59]:
            page.locator("#scrub").evaluate("(el, f) => {el.value=f;el.dispatchEvent(new Event('input',{bubbles:true}));}",frame)
            page.wait_for_timeout(120)
            page.screenshot(path=str(OUT/f"ICON04_V3_F{frame:02d}.png"))
        recording=page.video
        page.close()
        context.close()
        browser.close()
        if recording:
            recording.save_as(str(VIDEO))
    print(f"Saved {VIDEO} and frame screenshots in {OUT}")

if __name__=="__main__":
    main()
