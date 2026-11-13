#!/usr/bin/env python3
"""C05 Icon 04 / Onto What You Wear — top folded shirt gravity-style drop-in, original SVG shapes.
Only top shirt moves; neither original SVG nor paths are modified. Circle stays outside Lottie.
Usage: python produce_icon04.py
"""
from __future__ import annotations
import copy, hashlib, io, json, math, re, subprocess, zipfile, shutil, textwrap
from pathlib import Path
from lxml import etree
from PIL import Image, ImageDraw, ImageFont, ImageChops
import cairosvg

BASE=Path(__file__).resolve().parent
SRC=BASE/'More_than_a_tshirt_Icon_4_ORIGINAL.svg'
OUT=BASE
SOURCE_BYTES=SRC.read_bytes(); SOURCE_HASH=hashlib.sha256(SOURCE_BYTES).hexdigest()
ROOT=etree.fromstring(SOURCE_BYTES)
NS='http://www.w3.org/2000/svg'; N='{'+NS+'}'
FPS=30; FRAME_COUNT=60; LAST=FRAME_COUNT-1; WIDTH=HEIGHT=512
TOKEN=re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?')

STYLES={}
for k,body in re.findall(r'\.(st\d+)\{([^}]+)\}',SOURCE_BYTES.decode()):
    STYLES[k]={a.strip():b.strip() for a,b in re.findall(r'([^:;]+):([^;]+);?',body)}
assert STYLES['st2']['stroke-width']=='1.5'

def rv(arr):return [round(float(z),5) for z in arr]
def static(arr):return {'a':0,'k':arr}

def keyframes(samples):
    keys=[]
    for i,(frame,val) in enumerate(samples):
        value=val if isinstance(val,list) else [val]
        record={'t':frame,'s':value}
        if i<len(samples)-1:
            nxt=samples[i+1][1];nxt=nxt if isinstance(nxt,list) else [nxt]
            # consecutive authored samples + linear temporal ease avoid native/fallback divergence
            record.update({'e':nxt,'i':{'x':0.667,'y':0.667},'o':{'x':0.333,'y':0.333}})
        keys.append(record)
    return {'a':1,'k':keys}

def parse_path(d):
    tokens=TOKEN.findall(d);index=0;cmd=None;cursor=[0.,0.];start=[0.,0.]
    prev_c=None;prev_q=None; vertices=[];incoming=[];outgoing=[];shapes=[]
    def push(closed=False):
        nonlocal vertices,incoming,outgoing
        if vertices:
            if closed and len(vertices)>1 and vertices[0]==vertices[-1] and incoming[-1]==[0,0] and outgoing[-1]==[0,0]:
                vertices.pop();incoming.pop();outgoing.pop()
            shapes.append({'c':bool(closed),'v':vertices,'i':incoming,'o':outgoing})
        vertices=[];incoming=[];outgoing=[]
    def values(n):
        nonlocal index
        q=list(map(float,tokens[index:index+n]));index+=n;return q
    def point(xy,inc=(0,0)):
        nonlocal cursor
        xy=rv(xy);vertices.append(xy);incoming.append(rv(inc));outgoing.append([0,0]);cursor=xy
    while index<len(tokens):
        if len(tokens[index])==1 and tokens[index].isalpha():
            cmd=tokens[index];index+=1
            if cmd in 'Zz':
                push(True);cursor=start[:];prev_c=prev_q=None;cmd=None;continue
        if cmd is None:raise ValueError('Missing path command')
        rel=cmd.islower(); c=cmd.upper()
        if c=='M':
            x,y=values(2)
            if rel:x+=cursor[0];y+=cursor[1]
            if vertices:push()
            point([x,y]);start=cursor[:];cmd='l' if rel else 'L';prev_c=prev_q=None
        elif c in 'LHV':
            if c=='L':x,y=values(2)
            elif c=='H':x=values(1)[0];y=cursor[1]
            else:x=cursor[0];y=values(1)[0]
            if rel:
                if c!='V':x+=cursor[0]
                if c!='H':y+=cursor[1]
            point([x,y]);prev_c=prev_q=None
        elif c in 'CS':
            if c=='C':x1,y1,x2,y2,x,y=values(6)
            else:
                x2,y2,x,y=values(4)
                x1,y1=(2*cursor[0]-prev_c[0],2*cursor[1]-prev_c[1]) if prev_c else cursor[:]
            if rel:
                if c=='C':x1+=cursor[0];y1+=cursor[1]
                x2+=cursor[0];y2+=cursor[1];x+=cursor[0];y+=cursor[1]
            outgoing[-1]=rv([x1-cursor[0],y1-cursor[1]])
            point([x,y],[x2-x,y2-y]);prev_c=[x2,y2];prev_q=None
        elif c in 'QT':
            if c=='Q':qx,qy,x,y=values(4)
            else:
                x,y=values(2)
                qx,qy=(2*cursor[0]-prev_q[0],2*cursor[1]-prev_q[1]) if prev_q else cursor[:]
            if rel:
                if c=='Q':qx+=cursor[0];qy+=cursor[1]
                x+=cursor[0];y+=cursor[1]
            x1=cursor[0]+2*(qx-cursor[0])/3;y1=cursor[1]+2*(qy-cursor[1])/3
            x2=x+2*(qx-x)/3;y2=y+2*(qy-y)/3
            outgoing[-1]=rv([x1-cursor[0],y1-cursor[1]])
            point([x,y],[x2-x,y2-y]);prev_q=[qx,qy];prev_c=None
        else:raise ValueError('Unsupported path command: '+cmd)
    push()
    return shapes

def parse_polygon(points):
    nums=[float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)',points)]
    assert len(nums)%2==0 and len(nums)>=6
    vs=[rv(nums[i:i+2]) for i in range(0,len(nums),2)]
    return [{'c':True,'v':vs,'i':[[0,0] for _ in vs],'o':[[0,0] for _ in vs]}]

def fillcolor(h):return [round(int(h[i:i+2],16)/255,6) for i in (1,3,5)]
def identity():return {'ty':'tr','nm':'Unchanged geometry','a':static([0,0]),'p':static([0,0]),'s':static([100,100]),'r':static(0),'o':static(100),'sk':static(0),'sa':static(0)}

def shape_element(el,idx):
    tag=etree.QName(el).localname
    geom=parse_path(el.get('d')) if tag=='path' else parse_polygon(el.get('points'))
    items=[{'ty':'sh','nm':f'{tag} {idx}.{k}','ks':static(q)} for k,q in enumerate(geom)]
    style=STYLES.get(el.get('class'),{})
    if 'fill' in style and style['fill']!='none':
        items.append({'ty':'fl','nm':'Original SVG fill','c':static(fillcolor(style['fill'])),'o':static(100),'r':1})
    if 'stroke' in style and style['stroke']!='none':
        items.append({'ty':'st','nm':'Original SVG stroke','c':static(fillcolor(style['stroke'])),'o':static(100),'w':static(float(style.get('stroke-width',1))), 'lc':2,'lj':2,'ml':float(style.get('stroke-miterlimit',10))})
    items.append(identity())
    return {'ty':'gr','nm':f'{tag} {idx} ({el.get("class")})','it':items}

def extract_group(elem):
    children=[]
    for i,child in enumerate(elem):
        tag=etree.QName(child).localname
        if tag=='g':children.append({'ty':'gr','nm':child.get('id') or f'SVG nested group {i}', 'it':extract_group(child)+[identity()]})
        elif tag in ('path','polygon'):children.append(shape_element(child,i))
        else:raise ValueError(f'Unrecognized child: {tag}')
    return list(reversed(children))

stack=ROOT.xpath('./*[local-name()="g" and @id="tshirt_x5F_Stack"]')[0]
top=ROOT.xpath('./*[local-name()="g" and @id="Tshirt_x5F_top"]')[0]
assert len(stack)==2
# Source SVG anonymous groups are named only in animation derivative, retaining original order.
bottom, middle=stack[0],stack[1]

# Original isolated top garment alpha bounds: (53,119,439,359) in 512x512.
# At frame 0, top shirt is fully ABOVE the circle and the 512 viewport; no opacity tricks.
# Circle is an external static preview element, not a Lottie clipping mask.
ANCHOR=(246.,239.)
DROP_START=-360.0
LAND_FRAME=47

def smooth(v):
    t=max(0.0,min(1.0,float(v)))
    return t*t*(3-2*t)

def interpolate(t, waypoints):
    for (f0,v0),(f1,v1) in zip(waypoints,waypoints[1:]):
        if t<=f0:return v0
        if t<=f1:return v0+(v1-v0)*smooth((t-f0)/(f1-f0))
    return waypoints[-1][1]

def pose(frame):
    f=max(0.0,min(float(frame),float(LAST)))
    if f<=LAND_FRAME:
        # Gravity-inspired: slow release, accelerating mid-flight, soft deceleration at impact.
        # The late-weighted S curve has zero instantaneous velocity at the landing pose.
        u=smooth(f/LAND_FRAME)**1.35
        dy=DROP_START+(2.0-DROP_START)*u
        # Minimal tilt, 100% garment scale and no horizontal drift.
        rotation=0.65*__import__('math').sin(__import__('math').pi*f/LAND_FRAME)
    else:
        # 2px compression/settle WITHOUT stretching the garment or introducing a visible bounce.
        dy=interpolate(f,[(47,2.0),(53,-0.35),(58,0),(59,0)])
        rotation=0
    return (0.0,round(dy,5),round(rotation,5))


def layer(name,el,idx,moving=False):
    if moving:
        pos=keyframes([(f,[ANCHOR[0]+pose(f)[0],ANCHOR[1]+pose(f)[1],0]) for f in range(FRAME_COUNT)])
        rot=keyframes([(f,pose(f)[2]) for f in range(FRAME_COUNT)])
        a=static([ANCHOR[0],ANCHOR[1],0]); p=pos
    else:
        a=static([0,0,0]);p=static([0,0,0]);rot=static(0)
    return {'ddd':0,'ind':idx,'ty':4,'nm':name,'sr':1,'ks':{'o':static(100),'r':rot,'p':p,'a':a,'s':static([100,100,100])},
            'ao':0,'shapes':extract_group(el),'ip':0,'op':FRAME_COUNT,'st':0,'bm':0}

# Lottie layer array lists topmost first (reverse SVG painter order).
DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':FRAME_COUNT,'w':512,'h':512,
    'nm':'CHAPCHITRA C05 / Icon 04 / Onto What You Wear / V2 DROP-IN',
    'ddd':0,'assets':[],'layers':[
        layer('Tshirt_x5F_top / original paths / DROP-IN',top,1,moving=True),
        layer('Tshirt_Middle / original anonymous group / STATIC',middle,2),
        layer('Tshirt_Bottom / original anonymous group / STATIC',bottom,3)],
    'markers':[],
    'meta':{'generator':'CHAPCHITRA original owner SVG / native Bodymovin vector exporter',
            'source_sha256':SOURCE_HASH, 'source_canvas':'512x512', 'background':'transparent / circle excluded',
            'loop':False,'approval_status':'owner visual review pending'}}
assert len(DATA['layers'])==3 and not DATA['assets']
jsonpath=OUT/'CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V2_DROP_IN.json'
jsonpath.write_text(json.dumps(DATA,separators=(',',':')))
name='chapchitra_c05_icon04_v2_drop_in'
manifest={'version':'1','generator':'CHAPCHITRA SVG vector Lottie','activeAnimationId':name,
    'animations':[{'id':name,'autoplay':True,'loop':False,'speed':1,'direction':1}]}
lottiepath=OUT/'CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V2_DROP_IN.lottie'
with zipfile.ZipFile(lottiepath,'w',zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json',json.dumps(manifest,separators=(',',':')))
    z.write(jsonpath,'animations/'+name+'.json')

# Exact source vector fallback preview: only top group changes its transform; circle static.
def frame_svg(frame,full_circle=True,include_animation=True):
    r=copy.deepcopy(ROOT)
    if not full_circle:r.remove(r.xpath('./*[local-name()="circle"]')[0])
    if include_animation:
        e=r.xpath('./*[local-name()="g" and @id="Tshirt_x5F_top"]')[0]
        dx,dy,rot=pose(frame)
        e.set('transform',f'translate({ANCHOR[0]+dx:.5f},{ANCHOR[1]+dy:.5f}) rotate({rot:.5f}) translate({-ANCHOR[0]:.5f},{-ANCHOR[1]:.5f})')
    return etree.tostring(r)

def raster_svg(data,size=512):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=data,output_width=size,output_height=size))).convert('RGBA')

srcframe=raster_svg(SOURCE_BYTES)
lastframe=raster_svg(frame_svg(LAST))
firstframe=raster_svg(frame_svg(0))
assert ImageChops.difference(srcframe.convert('RGB'),firstframe.convert('RGB')).getbbox() is not None,'Starting frame must show only the two lower garments'
assert ImageChops.difference(srcframe.convert('RGB'),lastframe.convert('RGB')).getbbox() is None,'Last frame different from source SVG'

assert pose(0)[1] == DROP_START
assert abs(pose(LAST)[1]) < 1e-9
# Validate all original vector geometries preserved, per-shirt element counts match.
from collections import Counter
native=Counter('sh' for lay in DATA['layers'] for group in lay['shapes'] for nested in [group])
svgpaths=len(ROOT.xpath('.//*[local-name()="path"]'))
svgpolys=len(ROOT.xpath('.//*[local-name()="polygon"]'))
shapecount=sum(1 for lay in DATA['layers'] for sh in lay['shapes'] for child in [] )
# recursive count
def rcount(x,ty):
    if isinstance(x,dict):return int(x.get('ty')==ty)+sum(rcount(v,ty) for v in x.values())
    if isinstance(x,list):return sum(rcount(v,ty) for v in x)
    return 0
nshape=rcount(DATA['layers'],'sh')
assert svgpaths==303 and svgpolys==12 and nshape>=315,(svgpaths,svgpolys,nshape)

# Build local/offline review: original static source alongside native-player or clearly labeled SVG fallback.
inline_svg=SOURCE_BYTES.decode().replace('<?xml version="1.0" encoding="utf-8"?>','').replace('<!-- Generator: Adobe Illustrator 24.1.2, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->','')
# embedded data avoids local file:// CORS
jsposes=json.dumps([pose(f) for f in range(FRAME_COUNT)],separators=(',',':'))
json_embed=jsonpath.read_text().replace('</script>','<\\/script>')
html=r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHAPCHITRA C05 Icon 04 — Drop-in Lottie Review V2</title>
<style>:root{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f6f7f5;color:#293d2d}*{box-sizing:border-box}body{margin:0;padding:clamp(14px,3vw,28px)}main{max-width:1050px;margin:auto}h1{font-size:clamp(1.35rem,3vw,2rem);margin:.3em 0}.muted{color:#59695b} .review{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0} .card{background:#fff;border:1px solid #dde5de;border-radius:16px;padding:16px}h2{font-size:1.1rem;margin:0 0 8px}.frame{position:relative;aspect-ratio:1;max-width:512px;margin:auto}.frame svg{display:block;width:100%;height:100%;} #native{position:absolute;inset:0}#native svg{width:100%;height:100%}#fallback{position:absolute;inset:0}#fallback[hidden],#native[hidden]{display:none}.controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.controls button,.controls select{padding:10px 13px;font:inherit;border-radius:8px;border:1px solid #293d2d;background:#293d2d;color:#fff;min-height:44px;cursor:pointer}.controls select{background:white;color:#293d2d}.controls label{font-size:.92rem}input[type=range]{width:100%;accent-color:#293d2d}a{color:#293d2d}#status{font-weight:650}.staticcircle{position:absolute;inset:0}.actions{display:flex;gap:18px;flex-wrap:wrap;margin:1em 0}.note{font-size:.88rem;color:#536c57}@media(max-width:650px){.review{grid-template-columns:1fr}}</style>
<!-- Official Lottie-web renderer when network is accessible; original-SVG fallback is explicitly labeled when offline. -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script></head>
<body><main><p class="muted">CHAPCHITRA · C05 Icon 04 · Isolated creative review</p><h1>Onto What You Wear</h1><p class="muted">The top folded T-shirt drops in from above the circular frame and lands with a restrained settle. Lower shirts stay perfectly still.</p>
<div class="review"><section class="card"><h2>Original static illustration</h2><div class="frame">__ORIGINAL_SVG__</div></section>
<section class="card"><h2>Animated preview</h2><div class="frame" id="anim-frame"><svg class="staticcircle" viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="245" fill="#293D2D"/></svg><div id="native" hidden></div><div id="fallback" hidden>__FALLBACK_SVG__</div></div></section></div>
<div class="card"><div class="controls"><button id="play">Play</button><button id="pause">Pause</button><button id="replay">Replay</button><label for="speed">Speed</label><select id="speed"><option value="0.5">0.5×</option><option selected value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div>
<label for="scrub">Animation position</label><input id="scrub" type="range" min="0" max="59" value="0" step="1" aria-label="Animation timeline">
<p class="note">Player: <span id="status">Initializing</span> · Duration: 2.0s · 30 FPS · Playback: once, then hold.</p>
<p class="note">Reduced motion: the completed original illustration is shown without animation.</p></div>
<div class="actions"><a href="CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V2_DROP_IN.json">Native vector JSON</a><a href="CHAPCHITRA_C05_Icon04_Onto_What_You_Wear_V2_DROP_IN.lottie">.lottie archive</a><a href="More_than_a_tshirt_Icon_4_ORIGINAL.svg">Original SVG</a></div>
</main><script id="animationData" type="application/json">__LOTTIE_DATA__</script><script>
(() => {const frames=__POSES__, duration=59/30, fps=30, source=JSON.parse(document.querySelector('#animationData').textContent),
   match=window.matchMedia('(prefers-reduced-motion: reduce)');
 const el=n=>document.getElementById(n), fsvg=el('fallback').querySelector('svg'), tshirt=fsvg.querySelector('#Tshirt_x5F_top');
 // fallback static circle is already contained in the original SVG
 let engine='fallback', animation=null, current=0,playing=false,previous=0,raf=null,speed=1;
 function setFrame(frame){current=Math.max(0,Math.min(59,frame));el('scrub').value=String(Math.round(current));
   if(engine==='lottie') animation.goToAndStop(current,true);
   else {const a=Math.min(59,Math.floor(current)),b=Math.min(59,a+1),t=current-a;const v=frames[a].map((z,i)=>z+(frames[b][i]-z)*t);
     tshirt.setAttribute('transform',`translate(${246+v[0]} ${239+v[1]}) rotate(${v[2]}) translate(-246 -239)`);}}
 function stop(){playing=false;if(raf!==null)cancelAnimationFrame(raf);raf=null;}
 function tick(ts){if(!playing)return;const dt=previous?Math.min(0.2,(ts-previous)/1000):0;previous=ts;
   setFrame(Math.min(59,current+dt*30*speed));if(current>=59){stop();return;}raf=requestAnimationFrame(tick);}
 function play(){if(match.matches){setFrame(59);return;}if(current>=59)setFrame(0);if(!playing){playing=true;previous=0;raf=requestAnimationFrame(tick);}}
 function pause(){stop();}
 function replay(){stop();setFrame(match.matches?59:0);if(!match.matches)play();}
 el('play').onclick=play;el('pause').onclick=pause;el('replay').onclick=replay;el('speed').onchange=e=>speed=Number(e.target.value);
 el('scrub').oninput=e=>{stop();setFrame(Number(e.target.value));};
 match.addEventListener?.('change',()=>{stop();setFrame(match.matches?59:0);});
 if(window.lottie && typeof window.lottie.loadAnimation==='function'){
   try{animation=window.lottie.loadAnimation({container:el('native'),renderer:'svg',loop:false,autoplay:false,animationData:source,
      rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});engine='lottie';el('native').hidden=false;
      el('status').textContent='Official lottie-web SVG renderer';
      animation.addEventListener('DOMLoaded',()=>{setFrame(match.matches?59:0);});
   }catch(error){engine='fallback';el('native').hidden=true;el('fallback').hidden=false;el('status').textContent='Original-SVG reference fallback (native player unavailable)';}}
 else{el('fallback').hidden=false;el('status').textContent='Original-SVG reference fallback (native player unavailable)';}
 setFrame(match.matches?59:0);
 if(!match.matches && engine==='fallback') play();
})();</script></body></html>'''
# JS native uses an independent static backdrop, fallback SVG includes circle: static backdrop behind will be covered by the SVG's own circle at same position.
html=html.replace('__ORIGINAL_SVG__',inline_svg).replace('__FALLBACK_SVG__',inline_svg)
html=html.replace('__LOTTIE_DATA__',json_embed).replace('__POSES__',jsposes)
htmlpath=OUT/'CHAPCHITRA_C05_Icon04_STANDALONE_REVIEW.html';htmlpath.write_text(html)

# Preview media is a faithful SVG-motion reference; no screenshot claim of native official player unless verified separately.
frames=OUT/'reference_frames';frames.mkdir(exist_ok=True)
images=[]
for f in range(FRAME_COUNT):
    img=raster_svg(frame_svg(f),512)
    bg=Image.new('RGBA',(512,512),(255,255,255,255));bg.alpha_composite(img)
    rgb=bg.convert('RGB');images.append(rgb)
    rgb.save(frames/f'{f:03d}.png')
images[0].save(OUT/'CHAPCHITRA_C05_Icon04_MOTION_PREVIEW.gif',save_all=True,append_images=images[1:],duration=33,loop=0,optimize=True,disposal=2)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','30','-i',str(frames/'%03d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'CHAPCHITRA_C05_Icon04_MOTION_PREVIEW.mp4')],check=True)
# Original static plus 6 animation checkpoints as approval strip
indices=[0,8,17,28,39,47,59];board=Image.new('RGB',(512*4,535*2),'white');drawer=ImageDraw.Draw(board)
for j,f in enumerate(indices):
    x=(j%4)*512;y=(j//4)*535
    board.paste(images[f],(x,y));drawer.text((x+16,y+510),f'{f/30:.2f}s / frame {f}',fill=(41,61,45))
board.save(OUT/'CHAPCHITRA_C05_Icon04_STORYBOARD.png')

qa=f'''# CHAPCHITRA C05 Icon 04 — V2 drop-in motion QA

**Status:** Native vector Lottie exported, creative review pending. No website integration.

## Art and group preservation
- User-supplied original SVG SHA-256: `{SOURCE_HASH}`. Source bytes preserved in package.
- SVG viewBox: 0 0 512 512. Top group: `Tshirt_x5F_top`.
- Source middle/bottom elements are two **unnamed** children of `tshirt_x5F_Stack`; they were named in the animation derivative `Tshirt_Middle` and `Tshirt_Bottom` only.
- Native Lottie includes 3 independently editable vector shape layers, {svgpaths} original paths and {svgpolys} original polygons, including the original SVG stroke and fill styles.
- Native JSON has no image assets, generated artwork, video, or circle. The source background circle is shown only in the standalone preview.

## Timing
- 30 fps, {FRAME_COUNT} frames ({FRAME_COUNT/FPS:.2f} seconds), single playback with final static hold.
- Only the top shirt position and rotation are keyed: downward travel 360 SVG units, maximum tilt 0.65°, zero horizontal drift and a 2-unit landing settle.
- Lower two shirts remain at their exact original positions at all times.
- Final SVG-reference frame matches the original source **pixel-for-pixel** at 512x512; first frame shows top shirt above the circular composition.
- Every top layer keyframe is explicitly sampled, and all vector shapes are static.

## Browser QA
- Chrome browser-based testing is run separately, see browser QA report when available.
- Official lottie-web player is requested from cdnjs at runtime. In a network-isolated browser it is unavailable and the offline preview explicitly reports **Original-SVG reference fallback**. Native lottie-web rendering is not claimed as independently certified without a verified player run.
- Reduced-motion preview shows the completed original illustration.

## Scope
- No modifications to Icons 01, 02, or 03, site integrations, or GitHub staging branches.
- Deployment: NONE — per no-automatic-preview policy.
'''
(OUT/'QA_REPORT.md').write_text(qa)
print(json.dumps({'original_sha256':SOURCE_HASH,'json_bytes':jsonpath.stat().st_size,'lottie_bytes':lottiepath.stat().st_size,'layers':3,'source_paths':svgpaths,'source_polygons':svgpolys,'converted_shape_objects':nshape,'final_frame_diff':'0 pixels','duration_seconds':FRAME_COUNT/FPS},indent=2))