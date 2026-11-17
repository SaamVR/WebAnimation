#!/usr/bin/env python3
"""Recompose ZESTRY V3 layout without modifying any approved animation data."""
from __future__ import annotations
import argparse, hashlib, io, json, re, shutil, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
PARTS = PROJECT / 'review_bundle'
SOURCE_CSS = HERE / 'editorial-v4.css'
F03_SHA = '136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68'

def read_original():
    chunks = sorted(PARTS.glob('part-*.bin'))
    assert len(chunks) >= 10, 'ZESTRY split archive not found'
    data = b''.join(p.read_bytes() for p in chunks)
    return data

HERO = """<div class="hero-image hero-visual" aria-label="Fresh pasta photography and illustrated pasta in motion">
  <div class="hero-photo"><img alt="Fresh pasta, photographed for the ZESTRY restaurant concept" src="assets/photos/pasta.jpg"/></div>
  <div class="hero-pasta"><div class="anim" data-animation="f01" aria-label="Illustrated pasta being prepared"></div></div>
  <div class="hero-art-note" aria-hidden="true">A little joy<br/>in every bite.</div>
</div>"""

CHEFS = """<section class="section chef-story cream" id="kitchen" aria-labelledby="chef-heading">
  <div class="wrap chef-layout">
    <div class="chef-copy">
      <div class="eyebrow red">THE HANDS BEHIND THE FLAVOR</div>
      <h2 id="chef-heading">A kitchen full of <em>character.</em></h2>
      <p>Every memorable meal starts with a little curiosity, generous ingredients, and a chef who loves what they do.</p>
      <div class="chef-secondary"><div class="anim" data-animation="f02-cooking" aria-label="Chef tossing a pan while cooking"></div></div>
      <p class="chef-whisper">And yes, we have a little fun along the way.</p>
    </div>
    <div class="chef-primary"><div class="anim" data-animation="f02-orbit" aria-label="Chef at work with animated kitchen details"></div></div>
  </div>
</section>
<section class="section process-section" id="process" aria-labelledby="process-heading">
  <div class="wrap">
    <div class="process-header">
      <div><div class="eyebrow red">MADE FRESH, FROM SCRATCH</div><h2 id="process-heading">A little magic <em>in the making.</em></h2></div>
      <p>From the first chop to the final simmer, every step brings us closer to something worth sharing.</p>
    </div>
    <div class="process-visual"><div class="anim" data-animation="f06" aria-label="One continuous illustrated food preparation and cooking sequence"></div></div>
    <div class="process-foot"><span>GOOD THINGS TAKE CARE</span><span aria-hidden="true">✳</span><span>PREPARED WITH HEART</span></div>
  </div>
</section>"""

COFFEE = """<section class="section cream coffee-story" id="coffee" aria-labelledby="coffee-heading">
 <div class="wrap coffee-editorial">
  <div class="coffee-copy"><div class="eyebrow red">A MOMENT TO SAVOUR</div>
   <h2 id="coffee-heading">Your favorite pause <em>of the day.</em></h2>
   <p>From the first beans to that perfect pour, there is something lovely about coffee made with a little patience.</p>
   <p>Find your corner, stay a while, and let the good moments brew.</p>
   <a class="btn yellow" href="#menu">Explore our drinks <span aria-hidden="true">↗</span></a>
  </div>
  <div class="coffee-visual coffee-duo">
   <div class="coffee-photo"><img alt="Freshly brewed coffee" loading="lazy" src="assets/photos/coffee.jpg"/></div>
   <div class="coffee-motion"><div class="anim" data-animation="f03" aria-label="Coffee beans fall, grind, pour into a cup, and finish with rising steam"></div></div>
  </div>
 </div>
</section>"""

QUOTE = """<section class="flavor-quote" aria-label="Our philosophy"><div class="wrap">
  <span class="quote-star" aria-hidden="true">✳</span>
  <p>Good food brings people together.<br/><em>That's the best part.</em></p>
  <span class="quote-star" aria-hidden="true">✳</span>
</div></section>"""

RESERVATIONS = """<section class="reservation-band" id="reservations" aria-labelledby="reserve-title">
 <div class="wrap reservation-editorial">
   <div class="reservation-copy">
    <div class="eyebrow" style="color:#ffd24b">PULL UP A CHAIR</div>
    <h2 id="reserve-title">Good food tastes <em>better together.</em></h2>
    <p>Planning a little get-together? Pick a time and see how your table request would look.</p>
    <button class="btn yellow" data-book="">Request a table <span aria-hidden="true">↗</span></button>
    <p class="reservation-note">Illustrative reservation only. No table is actually booked.</p>
   </div>
   <div class="reservation-art"><div class="anim" data-animation="f07" aria-label="Illustrated table reservation experience"></div></div>
 </div>
</section>"""

def replace_once(source: str, old: str, new: str, label: str):
    assert source.count(old) == 1, f'{label}: expected exactly one source match, found {source.count(old)}'
    return source.replace(old, new, 1)

def recompose(html: str):
    if 'assets/editorial-v4.css' in html:
        return html
    hero_start = html.index('<div class="hero-image">', html.index('<section class="hero"'))
    hero_end = html.index('</div></div></section><div class="promises">', hero_start)
    html = html[:hero_start] + HERO + html[hero_end:]
    kitchen_start = html.index('<section class="section cream" id="kitchen">')
    kitchen_end = html.index('<section class="section" id="story">', kitchen_start)
    html = html[:kitchen_start] + CHEFS + html[kitchen_end:]
    coffee_start = html.index('<section class="section cream" id="coffee">')
    coffee_end = html.index('<section class="special">', coffee_start)
    html = html[:coffee_start] + COFFEE + html[coffee_end:]
    special_start = html.index('<section class="special">')
    special_end = html.index('<section class="reservation-band">', special_start)
    html = html[:special_start] + QUOTE + html[special_end:]
    reserve_start = html.index('<section class="reservation-band">')
    reserve_end = html.index('</main>', reserve_start)
    html = html[:reserve_start] + RESERVATIONS + html[reserve_end:]

    html = re.sub(r'Explore our illustrated menu\s*[^<]{0,20}F05', 'Explore our illustrated menu', html, count=1)
    html = html.replace('The standard ordering menu works without animations.', 'Flip through our illustrated menu, or order directly from the dishes above.')
    html = html.replace('This is a working portfolio prototype, not a real operating venue.', 'A playful restaurant concept, made for exploring.')
    html = html.replace('F04 · Order Journey', 'YOUR ORDER')
    html = html.replace('F07 · Table Reservation', 'YOUR TABLE')
    html = replace_once(html, "for(let name of ['f01','f02-orbit','f02-cooking','f03','f06'])", "for(let name of ['f01','f02-orbit','f02-cooking','f03','f06','f07'])", 'Lottie observer')
    html = replace_once(html, 'async function play(name,container,loop=false){', "async function play(name,container,loop=false){if(name==='f03'||name==='f07')loop=false;", 'one-shot playback contract')
    html = replace_once(html, "container.dataset.loaded='yes';container.dataset.player=name;", "container.dataset.loaded='yes';container.dataset.player=name;if(name==='f03')l.addEventListener('complete',()=>{container.dataset.motionComplete='true';l.goToAndStop(Math.max(0,v.op-1),true)});", 'F03 final-frame event')
    html = replace_once(html, "if(es[0].isIntersecting)l.play();else l.pause()", "if(es[0].isIntersecting){if(container.dataset.motionComplete!=='true')l.play()}else l.pause()", 'F03 revisit')
    html = replace_once(html, '</style>', '</style><link rel="stylesheet" href="assets/editorial-v4.css"/>', 'stylesheet link')
    html = replace_once(html, '</head>', '<link rel="icon" type="image/svg+xml" href="assets/favicon.svg"/></head>', 'favicon integration')
    assert 'data-animation="f01"' in html and html.count('data-animation="f01"') == 1, 'F01 hero migration'
    assert html.count('data-animation="f02-orbit"') == 1 and html.count('data-animation="f02-cooking"') == 1
    assert html.count('data-animation="f03"') == 1 and html.count('data-animation="f06"') == 1
    assert html.count('data-animation="f07"') == 1
    assert 'F08' not in html and 'f08' not in html, 'F08 must not exist'
    return html

def validate_archive(items: dict[str,bytes]):
    names = ['f01', 'f02-orbit', 'f02-cooking', 'f03', 'f04', 'f06', 'f07']
    for name in names:
        payload=items['assets/lottie/'+name+'.json']
        data=json.loads(payload)
        duration=(data['op']-data['ip'])/data['fr']
        if name=='f03':
            assert abs(duration-7.6)<.01
            assert hashlib.sha256(payload).hexdigest()==F03_SHA
        if name=='f06':
            assert abs(duration-14.4)<.01
        print(name, f'{duration:.2f}s',len(payload),'bytes')
    assert len(items['assets/f05_interactive.html'])>5000000

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--preview-dir',required=True)
    parser.add_argument('--pack',action='store_true')
    a=parser.parse_args()
    base=read_original()
    with zipfile.ZipFile(io.BytesIO(base)) as z:
        info={f.filename:f for f in z.infolist()}
        items={f.filename:z.read(f.filename) for f in z.infolist()}
    html=recompose(items['index.html'].decode('utf-8'))
    items['index.html']=html.encode('utf-8')
    items['assets/editorial-v4.css']=SOURCE_CSS.read_bytes()
    items['README.txt']=(HERE/'README_V4.txt').read_bytes()
    items['QA_REPORT.md']=(HERE/'RELEASE_QA.md').read_bytes()
    items['assets/favicon.svg']=(PROJECT/'assets/favicon.svg').read_bytes()
    validate_archive(items)
    preview=Path(a.preview_dir)
    preview.mkdir(parents=True,exist_ok=True)
    for key,value in items.items():
        dst=preview/key
        dst.parent.mkdir(parents=True,exist_ok=True)
        dst.write_bytes(value)
    (preview/'assets/photos').mkdir(parents=True,exist_ok=True)
    for photo in (PROJECT/'assets/photos').glob('*.jpg'):
        shutil.copyfile(photo, preview/'assets/photos'/photo.name)
    (preview/'assets/vendor').mkdir(parents=True,exist_ok=True)
    shutil.copyfile(PROJECT/'assets/vendor/lottie.min.js', preview/'assets/vendor/lottie.min.js')
    print('Preview ready:',preview)
    if a.pack:
        zipout=io.BytesIO()
        with zipfile.ZipFile(zipout,'w') as z:
            for name,content in items.items():
                old=info.get(name)
                if old:
                    z.writestr(old,content)
                else:
                    z.writestr(name,content,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
        buf=zipout.getvalue()
        prior=list(PARTS.glob('part-*.bin'))
        for file in prior:file.unlink()
        for i,j in enumerate(range(0,len(buf),512000)):
            (PARTS/f'part-{i:03d}.bin').write_bytes(buf[j:j+512000])
        print('Packed archive:',len(buf),'bytes,',len(list(PARTS.glob('part-*.bin'))),'parts')
    return 0

if __name__=='__main__':
    raise SystemExit(main())
