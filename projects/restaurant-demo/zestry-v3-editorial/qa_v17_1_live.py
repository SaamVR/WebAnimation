#!/usr/bin/env python3
"""Public-URL ZESTRY V17.1 release verification; no repo/site writes."""
import asyncio, hashlib, json, pathlib, time, traceback
from playwright.async_api import async_playwright

URL = "https://zestry-v3-restaurant-review-20261117.onrender.com/"
OUT = pathlib.Path("projects/restaurant-demo/docs/qa/live-v17-1-ci")
OUT.mkdir(parents=True, exist_ok=True)
results = {
    "url": URL, "deployed_expected_sha": "1c1406b391cfa7979ff05cea53d3feec758c7f8b",
    "tests": [], "errors": [], "failed_site_requests": [],
    "design": {"hero_constant_scale": 1.755, "menu_early_click": "queue and replay"}
}

def log(name, ok, detail):
    results["tests"].append({"name": name, "passed": ok, "detail": detail})
    print(("PASS" if ok else "FAIL"), name, json.dumps(detail, ensure_ascii=False), flush=True)
    if not ok:
        results["errors"].append(name)

async def on_page_error(exc):
    results["errors"].append(f"pageerror: {exc}")

async def verify_assets(request):
    files = [
        ("", "text/html"),
        ("assets/lottie/f01-v16.json", "application/json"),
        ("assets/f05_book.html", "text/html"),
        ("assets/f05_book.lottie", None),
        ("assets/photos/burger.webp", "image/webp"),
        ("assets/vendor/lottie.min.js", None),
    ]
    for path, expected_content_type in files:
        response = await request.get(URL + path, timeout=35000)
        body = await response.body()
        content_type = response.headers.get("content-type", "")
        ok = response.status == 200 and len(body) > 100 and (
            not expected_content_type or expected_content_type in content_type
        )
        if path == "":
            ok = ok and b"ZESTRY_PERF_V17_ENTRY" in body and b"FICTIONAL RESTAURANT" in body
        if path == "assets/f05_book.html":
            ok = ok and b"ZESTRY_PERF_V17_READY_QUEUE" in body
        if path == "assets/lottie/f01-v16.json":
            ok = ok and hashlib.sha256(body).hexdigest() == (
                "14f781c6568a15fd1593b7e906c95f87b9c445bd7573cf8741bbded92ca6660d"
            )
        if path == "assets/f05_book.lottie":
            ok = ok and len(body) > 4_000_000
        log("live_asset_" + (path or "index"), ok,
            {"status": response.status, "bytes": len(body), "type": content_type,
             "sha256": hashlib.sha256(body).hexdigest() if path.endswith("f01-v16.json") else None})

async def mobile_hero(browser):
    ctx = await browser.new_context(viewport={"width":390,"height":844},
                                    is_mobile=True,has_touch=True,device_scale_factor=1,
                                    record_video_dir=str(OUT), record_video_size={"width":390,"height":844})
    page = await ctx.new_page()
    page.on("pageerror", lambda e: results["errors"].append("mobile JS: " + e.message))
    page.on("response", lambda r:
        results["failed_site_requests"].append({"url":r.url,"status":r.status})
        if r.status >= 400 and r.url.startswith(URL) else None)
    await page.goto(URL, wait_until="domcontentloaded", timeout=35000)
    await page.wait_for_function(
        "() => document.querySelector('.hero .hero-pasta .anim svg') && document.querySelector('.f01-wood-fill')",
        timeout=25000)
    initial = await page.evaluate("""() => {
      const x=document.querySelector('.hero .hero-pasta .anim');
      return {zoom:Number(x.dataset.heroZoom), wood:!!document.querySelector('.f01-wood-fill'),
      disclaimer:document.body.textContent.includes('FICTIONAL RESTAURANT CONCEPT'),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
      menuInitiallyDeferred:!document.querySelector('#f05-book-frame').getAttribute('src')}
    }""")
    log("mobile_hero_fixed_scale_at_first_frame",
        initial["zoom"] == 1.755 and initial["wood"] and initial["disclaimer"]
        and not initial["horizontalOverflow"] and initial["menuInitiallyDeferred"], initial)
    await page.wait_for_function(
        "() => document.querySelector('.hero .hero-pasta .anim')?.dataset.motionComplete === 'true'",
        timeout=26000)
    done = await page.evaluate("""() => {
      const a=window.lottie.getRegisteredAnimations().find(x=>x.wrapper?.closest('.hero-image.hero-visual'));
      return {frame:a.currentFrame, originalFrameRate:a.frameRate,
          noSubframe:a.isSubframeEnabled===false,zoom:Number(a.wrapper.dataset.heroZoom),
          completed:a.wrapper.dataset.motionComplete==='true'}
    }""")
    log("mobile_full_natural_hero_playback",
        done["frame"] >= 259 and done["zoom"] == 1.755 and done["originalFrameRate"] == 30
        and done["noSubframe"] and done["completed"], done)
    await page.screenshot(path=str(OUT / "mobile-live-hero-final.png"))
    await page.locator("#nav-toggle").click()
    open_state = await page.locator("#nav-toggle").get_attribute("aria-expanded")
    await page.locator('#nav a[href="#menu"]').click()
    closed_state = await page.locator("#nav-toggle").get_attribute("aria-expanded")
    mobile_nav_ok = open_state == "true" and closed_state == "false"
    log("mobile_navigation", mobile_nav_ok, {"open":open_state,"closed":closed_state})
    video = page.video
    await ctx.close()
    if video:
        path = await video.path()
        dest=OUT/"mobile-live-playback.webm"
        pathlib.Path(path).replace(dest)

async def menu_fast_click_and_cart(browser):
    ctx = await browser.new_context(viewport={"width":1600,"height":900}, device_scale_factor=1)
    page = await ctx.new_page()
    page.on("pageerror", lambda e: results["errors"].append("desktop JS: " + e.message))
    page.on("response", lambda r:
        results["failed_site_requests"].append({"url":r.url,"status":r.status})
        if r.status >= 400 and r.url.startswith(URL) else None)
    async def slow_book(route):
        response = await route.fetch(timeout=35000)
        await asyncio.sleep(3.5)
        await route.fulfill(response=response)
    await page.route("**/assets/f05_book.lottie", slow_book)
    await page.goto(URL, wait_until="domcontentloaded", timeout=35000)
    await page.locator("#menu").scroll_into_view_if_needed(timeout=25000)
    f = page.frame_locator("#f05-book-frame")
    await f.locator("#state").wait_for(timeout=25000)
    before = await page.evaluate("""() => {
       const w=document.querySelector('#f05-book-frame')?.contentWindow;
       return {ready:w?.__f05Ready===true, state:w?.document.body.dataset.f05State || 'none'}
    }""")
    log("book_delayed_loading_before_click", before["ready"] is False, before)
    await f.get_by_role("button", name="Open menu book").click(timeout=12000)
    await page.wait_for_function(
        "() => document.querySelector('#f05-book-frame')?.contentWindow?.__f05Ready === true",
        timeout=30000)
    frame = next(x for x in page.frames if "f05_book.html" in x.url)
    await frame.wait_for_function("() => document.body.dataset.f05State === 'Overview'", timeout=30000)
    await f.get_by_role("button", name="Choose Starters").click(timeout=12000)
    await frame.wait_for_function("() => document.body.dataset.f05State === 'Starters'", timeout=30000)
    await f.locator("button.dish").wait_for(timeout=15000)
    label = await f.locator("button.dish").get_attribute("aria-label")
    await f.locator("button.dish").click()
    await page.wait_for_function("() => Number(document.querySelector('#bag-count')?.textContent)>0",
                                 timeout=14000)
    bag = await page.locator("#bag-count").inner_text()
    check = {"readyBeforeClick":before["ready"],"readyAfterClick":True,
             "finalBookState":"Starters","dish":label,"bagCount":bag}
    log("real_live_early_menu_click_replays_into_cart", bag == "1" and "Garden Crunch Salad" in label, check)
    await page.screenshot(path=str(OUT/"live-menu-after-fast-click.png"))

    # Preserve the completed checkout-only F04 flow; do not submit real orders.
    await page.locator("#cart-open").click()
    await page.locator("#cart-checkout").click(timeout=15000)
    await page.locator("#pickup-form").wait_for(timeout=10000)
    form=page.locator("#pickup-form")
    required = form.locator("input[required]")
    for i in range(await required.count()):
        input_el=required.nth(i)
        typ=(await input_el.get_attribute("type") or "text").lower()
        value="qa@example.com" if typ=="email" else "+15551234567" if typ=="tel" else "QA Demo"
        await input_el.fill(value)
    await form.locator("button[type=submit]").click()
    await page.get_by_text("Sample order received", exact=True).wait_for(timeout=15000)
    f04=await page.evaluate("""() => {
      const c=document.querySelector('#confirm-player');
      const a=window.lottie?.getRegisteredAnimations?.().find(x=>x.wrapper===c);
      return {hasSvg:!!c?.querySelector('svg'),player:c?.dataset.player,
              duration:a?.getDuration()??null,loop:a?.loop??null}
    }""")
    log("live_checkout_uses_F04_only", f04["hasSvg"] and f04["player"] == "f04" and f04["loop"] is False, f04)
    await page.screenshot(path=str(OUT/"live-F04-checkout.png"))
    await ctx.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        try:
            await verify_assets(p.request)
            await mobile_hero(browser)
            await menu_fast_click_and_cart(browser)
        finally:
            await browser.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        results["errors"].append(f"fatal: {exc}")
        print("QA_FATAL", traceback.format_exc(), flush=True)
    results["passed"] = (
        not results["errors"] and not results["failed_site_requests"]
        and all(t["passed"] for t in results["tests"])
    )
    (OUT/"V17_1_LIVE_CI_QA.json").write_text(json.dumps(results,indent=2)+"\n")
    print("V17_1_LIVE_QA_SUMMARY",json.dumps({
        "passed":results["passed"],"tests":len(results["tests"]),
        "errors":results["errors"],"failedRequests":len(results["failed_site_requests"])
    }), flush=True)
    raise SystemExit(0 if results["passed"] else 4)
