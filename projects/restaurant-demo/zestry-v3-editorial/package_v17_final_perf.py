#!/usr/bin/env python3
"""ZESTRY V17 performance-only packaging.

Inputs are the fully reviewed V16 fixed-size package and original photography.
Changes are loading scheduling, F05 idle-loop lifecycle, on-frame DOM write
reduction, and browser-optimized photos. Approved F01 artwork/choreography,
F04/F05 visual design, and checkout/menu interactions are not rebuilt.
The output is consumed by the EXISTING Render service's unzip build command.
"""
from __future__ import annotations
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "review_bundle"
PHOTOS_WEBP = ROOT / "assets/photos-webp"
F01_SHA = "7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37"
F04_SHA = "e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0"
F03_SHA = "136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68"

def replace_exact(s: str, old: str, new: str, label: str) -> str:
    n = s.count(old)
    assert n == 1, f"{label} expected once, found {n}"
    return s.replace(old, new, 1)

def tune_page(html: str) -> str:
    if "ZESTRY_PERF_V17_ENTRY" in html:
        return html  # repeatable rebuild from an already optimized review ZIP

    # Retain the approved head script order: moving Lottie to the tail and
    # speculative fetch preloads regressed the cold-start CPU benchmark.
    html = replace_exact(
        html,
        'src="assets/f05_book.html" loading="lazy"',
        'data-src="assets/f05_book.html" loading="lazy"',
        "deferrable menu iframe",
    )
    html = html.replace(".jpg", ".webp")

    # The F01 F16 remains at 1.755x throughout all 261 animation frames;
    # eliminate 2 expensive style mutations on every RAF-driven enterFrame.
    fn_re = re.compile(r"function mountF01V16FixedSize\(animation,container\)\{.*?\}\s*async function play\(", re.S)
    assert len(fn_re.findall(html)) == 1, "F01 fixed-size runtime signature changed"
    faster_f01 = """function mountF01V16FixedSize(animation,container){
  /* V17: setup once, preserve the approved CONSTANT 1.755x V16 scale.
     Tracking the frame is for QA only; never mutate SVG geometry per frame. */
  let attached=false;
  const applyOnce=()=>{
    if(attached)return true;
    const svg=container.querySelector('svg');if(!svg)return false;
    svg.style.setProperty('transform','scale(1.755000)','important');
    svg.style.setProperty('transform-origin','center center','important');
    container.dataset.heroZoom='1.755000';
    attached=true;
    return true;
  };
  const syncFrame=()=>{
    if(!applyOnce())return;
    const frame=Math.max(0,Math.min(260,Number(animation.currentFrame)||0));
    container.dataset.heroZoomFrame=frame.toFixed(2);
  };
  animation.addEventListener('DOMLoaded',syncFrame);
  animation.addEventListener('enterFrame',syncFrame);
  animation.addEventListener('complete',syncFrame);
  syncFrame();
}
async function play("""
    html = fn_re.sub(lambda _: faster_f01, html, count=1)

    menu_deferral = """/* ZESTRY_PERF_V17_ENTRY: postpone large interactive-menu payload.
   Native lazy iframes load ~one viewport early even while F01 is the focus.
   The iframe is activated on near-visible entry or direct Menu intent. */
function initDeferredMenuBook(){
 const frame=document.getElementById('f05-book-frame');
 const section=document.getElementById('menu');
 if(!frame||!section)return;
 let near=false,started=false,ready=false;
 const notify=()=>{
   if(!started||!ready||!frame.contentWindow)return;
   frame.contentWindow.postMessage(
     {type:'zestry:book-visibility',visible:near&&!document.hidden},
     location.origin
   );
 };
 const activate=()=>{
   if(started)return;
   started=true;
   frame.dataset.bookActivated='true';
   frame.loading='eager';
   frame.src=frame.dataset.src;
 };
 frame.addEventListener('load',()=>{
   if(!started||!frame.getAttribute('src')?.includes('f05_book.html'))return;
   ready=true;
   notify();
 });
 if('IntersectionObserver' in window){
   const io=new IntersectionObserver(es=>{
     near=es.some(e=>e.isIntersecting);
     if(near)activate();
     notify();
   },{rootMargin:'45px 0px',threshold:0});
   io.observe(section);
 }else{near=true;activate();}
 for(const link of document.querySelectorAll('a[href="#menu"]')){
   link.addEventListener('pointerenter',activate,{once:true,passive:true});
   link.addEventListener('focus',activate,{once:true});
 }
 document.addEventListener('visibilitychange',notify);
}
initDeferredMenuBook();"""
    html = replace_exact(html, "renderMenu();renderCart();if(window.lottie){",
                         menu_deferral + "renderMenu();renderCart();if(window.lottie){",
                         "menu bootstrap")

    # Every approved F01–F07 composition is authored at 30 fps. Render their
    # actual 30fps keyframes instead of evaluating subframes twice per frame
    # on 60Hz panels; this preserves the artwork, timeline and easing keys.
    html = replace_exact(
        html,
        "rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});if(name==='f01'){",
        "rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});"
        "if(typeof l.setSubframe==='function')l.setSubframe(false);if(name==='f01'){",
        "authored 30fps Lottie playback",
    )

    # avoid decoding all photo JPEGs when more compact WebP equivalents exist;
    # JPEG originals remain in ZIP as a compatibility/provenance fallback.
    html = html.replace('<img alt="ZESTRY fictional restaurant atmosphere, concept photography" loading="lazy"',
                        '<img alt="ZESTRY fictional restaurant atmosphere, concept photography" loading="lazy" decoding="async"')
    html = html.replace('img loading="lazy" src=', 'img loading="lazy" decoding="async" src=')
    assert 'const zoom=1.755' not in html or 'scale(1.755000)' in html
    assert "name==='f01'?'f01-v16':name" in html
    assert "play(name,c,name!=='f06')" in html, "Render build command will patch this invariant"
    assert "f05_book.html" in html
    return html

def tune_menu_book(html: str) -> str:
    if "ZESTRY_PERF_V17_MENU_LOOP" in html:
        return html
    html = html.replace(".jpg", ".webp")
    old = re.compile(r"function frameLoop\(now\)\{.*?requestAnimationFrame\(frameLoop\);\s*\}", re.S)
    found = old.findall(html)
    assert len(found) == 1, "F05 frame loop source signature changed"

    new_loop = """/* ZESTRY_PERF_V17_MENU_LOOP: stop RAF on idle/hold/offscreen; resume from same frame. */
function frameLoop(now){
 if(!auto||paused||document.hidden){auto=false;return;}
 if(anim){
   const state=states.get(cur);
   if(!state){auto=false;return;}
   const duration=anim.op-1;
   if(state.loop&&state.animation.startsWith('hold_')){auto=false;return;}
   if(!reduced){
     playingFrame=(now-started)*.001*anim.fr;
     if(playingFrame>=duration){
       if(state.loop){started=now;playingFrame=0;}
       else{
         playingFrame=duration;
         drawF05(anim,playingFrame,canvas);
         const prior=cur;completed();
         if(cur===prior){auto=false;return;}
       }
     }
     if(anim)drawF05(anim,playingFrame,canvas);
   }
 }
 if(auto)requestAnimationFrame(frameLoop);
}
let parentMenuVisible=true;
const resumeBook=()=>{
 if(paused||reduced||!anim||auto)return;
 if(states.get(cur)?.animation?.startsWith('hold_'))return;
 started=performance.now()-(playingFrame/Math.max(1,anim.fr))*1000;
 auto=true;
 requestAnimationFrame(frameLoop);
};
window.addEventListener('message',e=>{
 if(e.source!==parent||e.origin!==location.origin||
    e.data?.type!=='zestry:book-visibility')return;
 parentMenuVisible=e.data.visible===true;
 paused=!parentMenuVisible||document.hidden;
 if(paused){auto=false;}
 else resumeBook();
});
document.addEventListener('visibilitychange',()=>{
 paused=document.hidden||!parentMenuVisible;
 if(paused)auto=false;
 else resumeBook();
});
"""
    html = old.sub(lambda _: new_loop, html, count=1)
    assert "frameLoop(now)" in html and "ZESTRY_PERF_V17_MENU_LOOP" in html
    assert "addEventListener('click'" in html
    return html

def tune_menu_ready_queue(html: str) -> str:
    """Keep the full-screen menu responsive while its 4.2 MB book initializes.

    An early user click previously called states.get() before the async
    archive load had populated states. Queue a few intents and replay only
    after the initial Closed state is completely ready.
    """
    if "ZESTRY_PERF_V17_READY_QUEUE" in html:
        return html
    html = replace_exact(
        html, "function fire(event){const s=states.get(cur);",
        "/* ZESTRY_PERF_V17_READY_QUEUE: early menu actions are buffered until ready. */"
        "const pendingMenuEvents=[];"
        "function fire(event){"
        "if(!states){"
        "if(!pendingMenuEvents.includes(event)&&pendingMenuEvents.length<4)"
        "pendingMenuEvents.push(event);"
        "return true;"
        "}"
        "const s=states.get(cur);",
        "F05 fire before ready",
    )
    html = replace_exact(
        html, "await enter(sm.initial);window.__f05Ready=true;",
        "await enter(sm.initial);window.__f05Ready=true;"
        "for(const event of pendingMenuEvents.splice(0))fire(event);",
        "F05 finish initial state before flushing queued inputs",
    )
    return html


def main():
    parts = sorted(BUNDLE.glob("part-*.bin"))
    assert len(parts) >= 20
    original = b"".join(f.read_bytes() for f in parts)
    with zipfile.ZipFile(io.BytesIO(original)) as z:
        assert z.testzip() is None
        files = {info.filename: z.read(info.filename) for info in z.infolist()}
    for name,sha in [
      ("assets/lottie/f01.json",F01_SHA),
      ("assets/lottie/f03.json",F03_SHA),
      ("assets/lottie/f04.json",F04_SHA),
    ]:
        assert hashlib.sha256(files[name]).hexdigest()==sha, name
    derived_before=hashlib.sha256(files["assets/lottie/f01-v16.json"]).hexdigest()
    assert len(files["assets/lottie/f01-v16.json"])>1_000_000

    files["index.html"] = tune_page(files["index.html"].decode("utf-8")).encode("utf-8")
    files["assets/f05_book.html"] = tune_menu_ready_queue(
        tune_menu_book(files["assets/f05_book.html"].decode("utf-8"))
    ).encode("utf-8")

    for jpg in sorted(name for name in files if name.startswith("assets/photos/") and name.endswith(".jpg")):
        stem=Path(jpg).stem
        src=PHOTOS_WEBP/(stem+".webp")
        assert src.is_file(), "Missing optimized photo: "+str(src)
        files["assets/photos/"+stem+".webp"]=src.read_bytes()
        assert len(files["assets/photos/"+stem+".webp"]) < len(files[jpg]) * 1.05

    # Canonical sources and the complete 1.755x approved artwork remain untouched.
    assert hashlib.sha256(files["assets/lottie/f01-v16.json"]).hexdigest()==derived_before
    assert "1.755000" in files["index.html"].decode("utf-8")
    assert "ZESTRY_PERF_V17_ENTRY" in files["index.html"].decode("utf-8")
    assert len(files)>=77, len(files)
    output=io.BytesIO()
    with zipfile.ZipFile(output,"w") as z:
        for name,data in files.items():
            compression=zipfile.ZIP_STORED if Path(name).suffix in (".jpg",".webp",".lottie",".png",".woff",".woff2",".gif") else zipfile.ZIP_DEFLATED
            z.writestr(name,data,compress_type=compression,compresslevel=6 if compression==zipfile.ZIP_DEFLATED else None)
    packed=output.getvalue()
    with zipfile.ZipFile(io.BytesIO(packed)) as z:
        assert z.testzip() is None
        assert z.read("assets/lottie/f01-v16.json")==files["assets/lottie/f01-v16.json"]
        assert z.read("assets/lottie/f04.json")==files["assets/lottie/f04.json"]
        assert len(z.namelist())==len(files)
    # Atomic replace only after every integrity check.
    next_parts={}
    for n,idx in enumerate(range(0,len(packed),512_000)):
        next_parts[n]=packed[idx:idx+512_000]
    for f in parts:f.unlink()
    for n,data in next_parts.items():
        (BUNDLE/f"part-{n:03d}.bin").write_bytes(data)
    print("ZESTRY_V17_PERF_PACKAGE_READY",json.dumps({
     "files":len(files),"webpCount":len([x for x in files if x.endswith(".webp")]),
     "bytesBefore":len(original),"bytesAfter":len(packed),
     "originalF01SHA":F01_SHA,"derivedF01SHA":derived_before,
     "heroZoomAlways":"1.755000",
     "menuDeferred":True,"f05IdleRAFFix":True,
    }))
if __name__=="__main__": main()
