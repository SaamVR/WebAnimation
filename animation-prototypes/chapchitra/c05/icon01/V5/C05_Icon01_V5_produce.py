#!/usr/bin/env python3
"""C05 Icon01 V5 targeted revision: 1.5x paired right-page flip, exact V4 tee motion.
Run: python C05_Icon01_V5_produce.py. All source SVG paths/colors remain unchanged.
"""
from pathlib import Path
from copy import deepcopy
from lxml import etree
from PIL import Image, ImageDraw, ImageChops
from PIL import ImageFile
import io, os, math, json, re, hashlib, zipfile, subprocess, shutil, sys, ast
import cairosvg

ROOT=Path(__file__).resolve().parent
MASTER=ROOT/'More_than_a_tshirt_Icon_1_named_ORIGINAL.svg'
if not MASTER.exists(): MASTER=ROOT/'More_than_a_tshirt_Icon_1_named_SVG_TEXT.svg'
LEGACY=ROOT/'C05_V4_BASELINE_LOTTIE.json'
STATES_FILE=ROOT/'C05_V4_BASELINE_STATES.json'
FPS=30; LAST=150; W=H=512
SVG_NS='http://www.w3.org/2000/svg'; NS={'s':SVG_NS}
SOURCE_BYTES=MASTER.read_bytes(); SOURCE_HASH=hashlib.sha256(SOURCE_BYTES).hexdigest()
SVG=etree.fromstring(SOURCE_BYTES)
if LEGACY.exists() and STATES_FILE.exists():
    V4DATA=json.loads(LEGACY.read_text());V4STATES=json.loads(STATES_FILE.read_text())
else:
    # GitHub branch fallback: V4 review HTML embeds the authoritative baselines.
    prior=ROOT.parent/'V4'/'CHAPCHITRA_C05_Icon01_V4_ISOLATED_PREVIEW.html'
    html_source=prior.read_text()
    def embedded(name):
        m=re.search(r'<script[^>]*id="'+name+r'"[^>]*>(.*?)</script>',html_source,re.S)
        if not m:raise RuntimeError('Missing V4 embedded baseline '+name)
        return json.loads(m.group(1))
    V4DATA=embedded('data');V4STATES=embedded('states')
assert len(V4STATES)==151 and V4DATA['fr']==30 and V4DATA['op']==151

# Reuse V3's existing SVG-to-vector-Lottie parser without executing its production module.
PARSER_PATH=ROOT/'C05_V3_EXISTING_VECTOR_PARSER.py'
if not PARSER_PATH.exists(): PARSER_PATH=ROOT.parent/'V3'/'C05_Icon01_V3_editable.py'
raw=PARSER_PATH.read_text()
mod=ast.parse(raw)
needed={'rv','static','kf','path_parse','circle_path','rv2','element_group','extract_group','keyshapes','trans'}
selected=[n for n in mod.body if isinstance(n,ast.FunctionDef) and n.name in needed]
assert len(selected)==len(needed), [n.name for n in selected]
parser_globals={'etree':etree,'math':math,'re':re,'TOKEN':re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'),'styles':{}}
exec(compile(ast.Module(body=selected,type_ignores=[]),str(PARSER_PATH),'exec'),parser_globals)
parser_globals['styles']={cl:col.lower() for cl,col in re.findall(r'\.(st\d+)\s*\{\s*fill\s*:\s*(#[A-Fa-f0-9]{6})\s*;',SOURCE_BYTES.decode())}
assert parser_globals['styles']=={'st0':'#293d2d','st1':'#172419','st2':'#e4e3de','st3':'#f6f7f5'},parser_globals['styles']
extract_group=parser_globals['extract_group']; path_parse=parser_globals['path_parse']; static=parser_globals['static']

def get(id):
    found=SVG.xpath(f'.//*[@id="{id}"]')
    assert len(found)==1,(id,len(found))
    return found[0]

G_CIRCLE=get('Icon_x5F_Circle')
G_BASE=get('Book_x5F_Base')
G_UNDER=get('Right_x5F_Page_x5F_Underneath_1_')
G_LEFT_INITIAL=get('Left_x5F_Page_x5F_Initial')
G_LEFT_FINAL=get('Left_x5F_Page_x5F_Final')
G_TEE_PRINT=get('Tshirt_x5F_Illustration_x5F_on_x5F_page')
G_SPINE=get('Spine_x5F_Foreground_1_')
G_TEE=get('Tshirt_x5F_Floating')
FRONTS=[get('Turning_x5F_Page_x5F_Front_x5F_1_1_'),get('Turning_x5F_Page_x5F_Front_x5F_2'),get('Turning_x5F_Page_x5F_Front_x5F_3')]
BACKS=[get('Turning_x5F_Page_x5F_Back_x5F_1_1_'),get('Turning_x5F_Page_x5F_Back_x5F_2'),G_LEFT_FINAL]
# The author-exported back-3 differs in silhouette from Left_Page_Final.
# Use exact Final art on the last landing face, so its swap to final static is pixel-identical.

# Old V4 turn window was nominally 0..61 frames; only speed page turn 1.5x, from its initial frame.
# The lettered sheet windows preserve the same overlapping ordering (physical page pair).
V4_WINDOWS=[(0,20),(19,41),(38,61)]
SPEED=1.5
WINDOWS=[(round(a/SPEED),round(b/SPEED)) for a,b in V4_WINDOWS]
assert WINDOWS==[(0,13),(13,27),(25,41)]
MID=[(a+b)//2 for a,b in WINDOWS]
FINAL_SWAP=WINDOWS[-1][1] # 41

# The physical crease is the diagonal illustrated central spine.
AX=(183.0,400.7); BX=(235.6,350.9)
DX=BX[0]-AX[0];DY=BX[1]-AX[1]; NORM=DX*DX+DY*DY

def clip(v):return max(0.,min(1.,v))
def smooth(u):u=clip(u);return u*u*(3.-2*u)

def phase(f,idx):
    a,b=WINDOWS[idx]
    return clip((f-a)/(b-a))

def warp_point(x,y,amount,theta,side):
    # Strip width around the illustrated spine; the back/face shares the same crease.
    # Original art is obtained exactly at amount==1, not approximated by a replacement drawing.
    tx=x-AX[0];ty=y-AX[1]
    t=(tx*DX+ty*DY)/NORM
    sx=AX[0]+t*DX;sy=AX[1]+t*DY
    x1=sx+amount*(x-sx);y1=sy+amount*(y-sy)
    # Controlled page curvature proportional to distance from the spine; zero at rest and landing.
    # The small vertical lift is largest in the mid-turn; no triangular collapse or alpha fading.
    distance=min(1.,math.hypot(x-sx,y-sy)/150.)
    lift=11.0*math.sin(math.pi*theta)*distance*amount
    skew=2.8*math.sin(math.pi*theta)*distance*amount*side
    return (x1+skew,y1-lift)

def projected_shape(path,frame,idx,which):
    p=phase(frame,idx)
    if which=='front':
        width=max(.002,math.cos(math.pi*min(p,.5)))
    else:
        width=max(.002,-math.cos(math.pi*max(p,.5)))
    sign=1 if which=='front' else -1
    shape=deepcopy(path)
    vv=[];ii=[];oo=[]
    for v,it,ot in zip(path['v'],path['i'],path['o']):
        vx,vy=warp_point(*v,width,p,sign)
        inp=warp_point(v[0]+it[0],v[1]+it[1],width,p,sign)
        outp=warp_point(v[0]+ot[0],v[1]+ot[1],width,p,sign)
        vv.append([round(vx,4),round(vy,4)]);
        ii.append([round(inp[0]-vx,4),round(inp[1]-vy,4)])
        oo.append([round(outp[0]-vx,4),round(outp[1]-vy,4)])
    shape['v']=vv;shape['i']=ii;shape['o']=oo
    return shape

def morph_shapes(items,idx,which):
    # Animate original vector geometry, including artwork details; no texture flattening.
    a,b=WINDOWS[idx]
    keys=sorted(set([0,a]+list(range(a,b+1))+[LAST]))
    out=deepcopy(items)
    def apply(arr):
        for el in arr:
            if el['ty']=='gr':apply(el['it'])
            if el['ty']=='sh':
                geom=el['ks']['k']
                vals=[(f,projected_shape(geom,f,idx,which)) for f in keys]
                el['ks']=parser_globals['keyshapes'](vals)
    apply(out)
    return out

def vec(name,element,idx,ip=0,op=LAST+1):
    return {'ddd':0,'ind':idx,'ty':4,'nm':name,'sr':1,
      'ks':{'o':static(100),'r':static(0),'p':static([0,0,0]),'a':static([0,0,0]),'s':static([100,100,100])},
      'ao':0,'shapes':extract_group(element),'ip':ip,'op':op,'st':0,'bm':0}

def turn_layer(idx,which,layer_id):
    a,b=WINDOWS[idx];mid=MID[idx]
    src=FRONTS[idx] if which=='front' else BACKS[idx]
    ip=0 if which=='front' else mid
    op=mid if which=='front' else FINAL_SWAP
    if which=='front' and idx==0:op=max(mid,1)
    layer=vec(f'SHEET_{idx+1}_{which.upper()} / genuine opaque SVG artwork / page speed 1.5x',src,layer_id,ip=ip,op=op)
    layer['shapes']=morph_shapes(layer['shapes'],idx,which)
    return layer

# Layer order: earlier pages remain stacked under the next active physical sheet.
# Topmost: T-shirt and stationary spine. Then last back, middle back, first back, three fronts.
# Right faces are rendered front1 over front2/front3 via top-to-bottom order.
oldshirt=next(l for l in V4DATA['layers'] if l['nm'].startswith('Tshirt'))
SHIRT_KS=deepcopy(oldshirt['ks']);SHIRT_MASK=deepcopy(oldshirt['masksProperties'])
tee=vec('Tshirt_Floating / V4 exact trajectory timing scale easing and mask',G_TEE,1)
tee['ks']=SHIRT_KS
tee['hasMask']=True;tee['masksProperties']=SHIRT_MASK
LAYERS=[tee,vec('Spine_x5F_Foreground / always above physical pages',G_SPINE,2)]
idx=3
for i in [2,1,0]:LAYERS.append(turn_layer(i,'back',idx));idx+=1
for i in [0,1,2]:LAYERS.append(turn_layer(i,'front',idx));idx+=1
LAYERS.extend([
    vec('Left_Page_Final / exact settled back matching final SVG',G_LEFT_FINAL,idx,ip=FINAL_SWAP,op=LAST+1),
    vec('Left_Page_Initial / prior turns stationary',G_LEFT_INITIAL,idx+1,ip=0,op=FINAL_SWAP),
    vec('Right_Page_Underneath / stationary',G_UNDER,idx+2),
    vec('Book_Base / stationary',G_BASE,idx+3),
    vec('Icon_Circle / stationary',G_CIRCLE,idx+4)
])
DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':LAST+1,'w':W,'h':H,'nm':'CHAPCHITRA C05 Icon 01 / paired right page 1.5x / locked shirt 1x / V5',
 'ddd':0,'assets':[],'layers':LAYERS,'markers':[],
 'meta':{'generator':'C05 Icon 01 targeted physical sheet turn refinement','source_sha256':SOURCE_HASH,'user_tshirt_motion':'V4 properties cloned without changes','page_speed':1.5,'notes':'Last sheet exposed back uses exact Left_Page_Final (last author-exported back-3 silhouette differs). No alpha fade on page faces. Original SVG read-only.'}}
JSON_PATH=ROOT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V5.json'
JSON_PATH.write_text(json.dumps(DATA,separators=(',',':')))
DOT_PATH=ROOT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V5.lottie'
with zipfile.ZipFile(DOT_PATH,'w',zipfile.ZIP_DEFLATED) as z:
   man={'version':'1','generator':'CHAPCHITRA C05 native vector Lottie','activeAnimationId':'chapchitra_c05_icon01_v5','animations':[{'id':'chapchitra_c05_icon01_v5','autoplay':True,'loop':False,'speed':1,'direction':1}]}
   z.writestr('manifest.json',json.dumps(man,separators=(',',':')))
   z.writestr('animations/chapchitra_c05_icon01_v5.json',JSON_PATH.read_bytes())

# For clean visual QA create an independent SVG reference from the same authored SVG artwork and page morph paths.
def svgshape_path(sh):
    v=sh['v'];ii=sh['i'];oo=sh['o']
    if not v:return ''
    seq=[f'M {v[0][0]:.4f},{v[0][1]:.4f}']
    for k in range(1,len(v)+(1 if sh['c'] else 0)):
        a=(k-1)%len(v);b=k%len(v)
        seq.append(f'C {v[a][0]+oo[a][0]:.4f},{v[a][1]+oo[a][1]:.4f} {v[b][0]+ii[b][0]:.4f},{v[b][1]+ii[b][1]:.4f} {v[b][0]:.4f},{v[b][1]:.4f}')
    if sh['c']:seq.append('Z')
    return ' '.join(seq)

def warp_svg(element,frame,idx,side):
    r=deepcopy(element)
    for el in r.iter():
        if etree.QName(el).localname=='path':
            pieces=path_parse(el.get('d'))
            el.set('d',' '.join(svgshape_path(projected_shape(p,frame,idx,side)) for p in pieces))
    return r

def create_svg_frame(f):
    f=int(max(0,min(LAST,f)))
    new=etree.Element(f'{{{SVG_NS}}}svg',nsmap=SVG.nsmap,attrib={'viewBox':'0 0 512 512','width':'512','height':'512'})
    for ch in SVG:
        if etree.QName(ch).localname=='style':new.append(deepcopy(ch))
    for staticgroup in (G_CIRCLE,G_BASE,G_UNDER):new.append(deepcopy(staticgroup))
    if f<FINAL_SWAP:new.append(deepcopy(G_LEFT_INITIAL))
    else:new.append(deepcopy(G_LEFT_FINAL))
    # Earlier right page fronts are stacked above the others. Back sheets cover the left in arrival order.
    for i in [2,1,0]:
        if f<MID[i]:new.append(warp_svg(FRONTS[i],f,i,'front'))
    if f<FINAL_SWAP:
        for i in [0,1,2]:
            if f>=MID[i]:new.append(warp_svg(BACKS[i],f,i,'back'))
    new.append(deepcopy(G_SPINE))
    # Same V4 shirt position / angle / masking state and opacity; not retimed.
    ts=V4STATES[f]
    tee=deepcopy(G_TEE)
    p=ts['position'];s=ts['s'];rot=ts['r'];opa=ts['opacity']
    tee.set('transform',f'translate({p[0]:.5f} {p[1]:.5f}) rotate({rot:.5f}) scale({s/100:.6f}) translate(-326 -155)')
    tee.set('opacity',f'{opa/100:.6f}')
    defs=etree.Element(f'{{{SVG_NS}}}defs')
    clip=etree.SubElement(defs,f'{{{SVG_NS}}}clipPath',id='C05_V5_TEE_CLIP')
    c=ts['shirtClip']; etree.SubElement(clip,f'{{{SVG_NS}}}rect',x=str(c[0]),y=str(c[1]),width=str(c[2]-c[0]),height=str(c[3]-c[1]))
    new.insert(1,defs)
    wrapper=etree.SubElement(new,f'{{{SVG_NS}}}g',attrib={'clip-path':'url(#C05_V5_TEE_CLIP)'})
    wrapper.append(tee)
    return etree.tostring(new)

def render(f,size=512):
    img=cairosvg.svg2png(bytestring=create_svg_frame(f),output_width=size,output_height=size)
    return Image.open(io.BytesIO(img)).convert('RGBA')

def static_target_svg():
    root=etree.Element(f'{{{SVG_NS}}}svg',nsmap=SVG.nsmap,attrib={'viewBox':'0 0 512 512','width':'512','height':'512'})
    for child in SVG:
        if etree.QName(child).localname=='style':root.append(deepcopy(child))
    for group in (G_CIRCLE,G_BASE,G_UNDER,G_LEFT_FINAL,G_SPINE,G_TEE):root.append(deepcopy(group))
    return etree.tostring(root)

TARGET_PATH=ROOT/'CHAPCHITRA_C05_Icon01_V5_FINAL_REFERENCE.svg'
TARGET_PATH.write_bytes(static_target_svg())
INITIAL_PATH=ROOT/'CHAPCHITRA_C05_Icon01_V5_INITIAL_REFERENCE.svg'
INITIAL_PATH.write_bytes(create_svg_frame(0))

def create_review_html():
    # Use 0..41 sheet states only, then empty sheet. The T-shirt still uses V4's exact 151 states.
    st=[]
    for f in range(LAST+1):
        s=V4STATES[f]
        leaf=[]
        for i in [2,1,0]:
            if f<MID[i]:leaf.append(etree.tostring(warp_svg(FRONTS[i],f,i,'front'),encoding='unicode'))
        if f<FINAL_SWAP:
            for i in [0,1,2]:
                if f>=MID[i]:leaf.append(etree.tostring(warp_svg(BACKS[i],f,i,'back'),encoding='unicode'))
        st.append({'sheet':''.join(leaf),'position':s['position'],'s':s['s'],'r':s['r'],'opacity':s['opacity'],'shirtClip':s['shirtClip'],'final':f>=FINAL_SWAP})
    # Source core shell initial book before tee, page loops injected separately. Browser fallback uses precise SVG content.
    core=etree.Element(f'{{{SVG_NS}}}svg',nsmap=SVG.nsmap,attrib={'viewBox':'0 0 512 512','width':'512','height':'512'})
    for c in SVG:
        if etree.QName(c).localname=='style':core.append(deepcopy(c))
    for c in (G_CIRCLE,G_BASE,G_UNDER,G_LEFT_INITIAL,G_LEFT_FINAL):core.append(deepcopy(c))
    pages=etree.SubElement(core,f'{{{SVG_NS}}}g',id='active-pages')
    core.append(deepcopy(G_SPINE))
    defs=etree.SubElement(core,f'{{{SVG_NS}}}defs')
    clip=etree.SubElement(defs,f'{{{SVG_NS}}}clipPath',id='c05teeclip')
    etree.SubElement(clip,f'{{{SVG_NS}}}rect',id='c05teecliprect',x='123',y='236',width='106',height='109')
    teeW=etree.SubElement(core,f'{{{SVG_NS}}}g',attrib={'clip-path':'url(#c05teeclip)'})
    teeW.append(deepcopy(G_TEE))
    static_html=TARGET_PATH.read_text()
    def j(v):return json.dumps(v,separators=(',',':')).replace('</','<\\/')
    page=f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHAPCHITRA C05 Icon 01 V5 — Page speed 1.5x</title>
<style>:root{{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#172419;background:#f6f7f5}}
*{{box-sizing:border-box}}body{{margin:0}}main{{max-width:1080px;margin:auto;padding:clamp(15px,3vw,32px)}}
small{{color:#8a503b;letter-spacing:1.2px;font-weight:700}}h1{{font-size:clamp(22px,4vw,33px);margin:10px 0}}p{{font-size:13px;line-height:1.5;color:#566154}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}.panel{{border:1px solid #d7dcd7;background:#fff;border-radius:14px;padding:14px;min-width:0}}
.panel h2{{font-size:14px;margin:0 0 8px}}.art{{width:100%;max-width:490px;aspect-ratio:1;margin:auto;position:relative}}.art svg{{display:block;width:100%;height:100%}}
#native,#fallback,#align-layer{{position:absolute;inset:0}}#native{{display:none}}#align-layer{{pointer-events:none;opacity:0}}
.controls{{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:#fff;border:1px solid #d7dcd7;border-radius:14px;margin-top:14px;padding:14px}}
button,select{{border-radius:8px;background:white;border:1px solid #293d2d;color:#293d2d;padding:9px 13px;cursor:pointer;font:inherit;font-size:12px}}
button:first-child{{background:#293d2d;color:white}}label{{font-size:12px}}#range{{width:100%;accent-color:#8a503b}}#engine{{font-size:11px;color:#8a503b}}.checker{{background:conic-gradient(#ddd 25%,white 0 50%,#ddd 0 75%,white 0);background-size:22px 22px}}
@media(max-width:640px){{.grid{{grid-template-columns:1fr}}}}</style>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script></head>
<body><main><small>CHAPCHITRA / C05 / ICON 01 · V5 isolated review</small><h1>Stories You Can Wear</h1><p>Three physical right-to-left page turns at <b>1.5× page speed</b>. The approved T-shirt emergence and flight remain at <b>1×, with identical V4 keyframes</b>. Last sheet's back uses the final left-page artwork for a seamless stationary landing.</p>
<div class="grid"><section class="panel"><h2>Approved final static composition</h2><div class="art" id="original">{static_html}</div></section><section class="panel"><h2>V5 · page 1.5× + T-shirt 1×</h2><div class="art" id="animated"><div id="fallback">{etree.tostring(core,encoding='unicode')}</div><div id="native"></div><div id="align-layer">{static_html}</div></div><div id="engine">Initializing reference…</div></section></div>
<div class="controls"><button id="play">Play</button><button id="pause">Pause</button><button id="replay">Replay</button><label><input type="checkbox" id="loop"> Loop (review only)</label><label>Speed <select id="speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option selected value="1">1×</option><option value="1.25">1.25×</option></select></label><label><input type="checkbox" id="checker"> Checkerboard</label><label><input type="checkbox" id="alignment"> Final overlay</label><span id="clock">0.00 / 5.00 s</span><input id="range" type="range" min="0" max="150" step="0.1" value="0" aria-label="Scrub animation"></div>
<p id="summary">Page animation finishes at {(FINAL_SWAP/FPS):.2f} seconds (1.5× V4). T-shirt emergence begins at 2.00 seconds, following the unchanged approved keyframes. Playback runs once and holds its final frame. Reduced-motion visitors see the finished still.</p>
</main>
<script type="application/json" id="frame-data">{j(st)}</script><script type="application/json" id="animation-data">{j(DATA)}</script><script>(()=>{{'use strict';
const $=id=>document.getElementById(id),ST=JSON.parse($('frame-data').textContent),L=JSON.parse($('animation-data').textContent),ns='http://www.w3.org/2000/svg';
const root=$('fallback').querySelector('svg'),pages=root.querySelector('#active-pages'),tee=root.querySelector('#Tshirt_x5F_Floating'),rect=root.querySelector('#c05teecliprect'),startLeft=root.querySelector('#Left_x5F_Page_x5F_Initial'),endLeft=root.querySelector('#Left_x5F_Page_x5F_Final');
let fr=0,playing=false,loop=false,speed=1,last=0,raf=0,engine='svg',inst=null;
const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function updateFallback(n){{const s=ST[clamp(Math.round(n),0,150)];pages.innerHTML=s.sheet;startLeft.style.display=s.final?'none':'inline';endLeft.style.display=s.final?'inline':'none';
tee.setAttribute('transform',`translate(${{s.position[0]}} ${{s.position[1]}}) rotate(${{s.r}}) scale(${{s.s/100}}) translate(-326 -155)`);tee.setAttribute('opacity',s.opacity/100);
const c=s.shirtClip;rect.setAttribute('x',c[0]);rect.setAttribute('y',c[1]);rect.setAttribute('width',c[2]-c[0]);rect.setAttribute('height',c[3]-c[1]);}}
function seek(n){{fr=clamp(+n,0,150);if(engine==='lottie'&&inst)inst.goToAndStop(fr,true);else updateFallback(fr);$('range').value=fr;$('clock').textContent=(fr/30).toFixed(2)+' / 5.00 s';}}
function pause(){{playing=false;if(raf)cancelAnimationFrame(raf);raf=0;last=0;inst?.pause()}}
function tick(now){{if(!playing)return;const dt=last?Math.min(.08,(now-last)/1000):0;last=now;const next=fr+dt*30*speed;if(next>=150){{if(loop)seek(next%150);else{{seek(150);pause();return}}}}else seek(next);raf=requestAnimationFrame(tick)}}
function play(){{pause();if(fr>=150)seek(0);playing=true;raf=requestAnimationFrame(tick)}}
$('play').onclick=play;$('pause').onclick=pause;$('replay').onclick=()=>{{seek(0);play()}};$('range').oninput=e=>{{pause();seek(e.target.value)}};
$('loop').onchange=e=>loop=e.target.checked;$('speed').onchange=e=>speed=+e.target.value;
$('checker').onchange=e=>document.querySelectorAll('.art').forEach(t=>t.classList.toggle('checker',e.target.checked));
$('alignment').onchange=e=>$('align-layer').style.opacity=e.target.checked?'.4':'0';
function native(){{if(!window.lottie){{$('engine').textContent='SVG vector reference (official Lottie renderer unavailable offline)';return}}
 try{{inst=window.lottie.loadAnimation({{container:$('native'),renderer:'svg',loop:false,autoplay:false,animationData:L,rendererSettings:{{preserveAspectRatio:'xMidYMid meet'}}}});
 inst.addEventListener('DOMLoaded',()=>{{engine='lottie';$('fallback').style.display='none';$('native').style.display='block';$('engine').textContent='Official lottie-web SVG renderer · native JSON';seek(fr)}});
 inst.addEventListener('data_failed',()=>{{engine='svg';inst?.destroy();inst=null;$('fallback').style.display='block';$('native').style.display='none';$('engine').textContent='SVG reference fallback · Lottie loading failed';seek(fr)}});
 }}catch(e){{$('engine').textContent='SVG fallback · '+e.message}}}}
seek(reduce?150:0);native();if(!reduce)play();window.__c05V5={{seek,play,pause,state:()=>({{frame:fr,engine,playing}})}};
}})();</script></body></html>'''
    # Keep review HTML small enough for mobile/iPad. Native renderer loads JSON sibling file.
    page=re.sub(r'<script type="application/json" id="animation-data">.*?</script>',
                '<script type="application/json" id="animation-data">null</script>',page,flags=re.S)
    page=page.replace("const $=id=>document.getElementById(id),ST=JSON.parse($('frame-data').textContent),L=JSON.parse($('animation-data').textContent),ns='http://www.w3.org/2000/svg';",
                      "const $=id=>document.getElementById(id),ST=JSON.parse($('frame-data').textContent),ns='http://www.w3.org/2000/svg';")
    old="try{inst=window.lottie.loadAnimation({container:$('native'),renderer:'svg',loop:false,autoplay:false,animationData:L,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});"
    new="try{fetch('./CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V5.json').then(r=>{if(!r.ok)throw Error('JSON fetch');return r.json()}).then(L=>{inst=window.lottie.loadAnimation({container:$('native'),renderer:'svg',loop:false,autoplay:false,animationData:L,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});"
    if old not in page:raise RuntimeError('Expected native review loader not found')
    page=page.replace(old,new)
    end="inst.addEventListener('data_failed',()=>{engine='svg';inst?.destroy();inst=null;$('fallback').style.display='block';$('native').style.display='none';$('engine').textContent='SVG reference fallback · Lottie loading failed';seek(fr)});"
    if end not in page:raise RuntimeError('Expected Lottie failure callback not found')
    page=page.replace(end,end+"}).catch(err=>{$('engine').textContent='SVG vector reference · native assets unavailable: '+err.message});")
    path=ROOT/'CHAPCHITRA_C05_Icon01_V5_ISOLATED_PREVIEW.html'
    path.write_text(page)
    return path

if __name__=='__main__':
    # Invariants before rendering.
    assert hashlib.sha256(MASTER.read_bytes()).hexdigest()==SOURCE_HASH
    assert tee['ks']==SHIRT_KS and tee['masksProperties']==SHIRT_MASK
    assert all(layer['ks']['o']==static(100) for layer in LAYERS[2:8]), 'Turning sheets must remain fully opaque'
    assert FINAL_SWAP==41
    initial=render(0,640);final=render(LAST,640)
    target=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=static_target_svg(),output_width=640,output_height=640))).convert('RGBA')
    changed=sum(1 for p in ImageChops.difference(final,target).getdata() if p!=(0,0,0,0))
    print('source',SOURCE_HASH,'final_target_changed_pixels_640',changed)
    assert changed<=10,changed
    # Back-3 is the exact source Left_Page_Final rendered at the end of its turn.
    assert BACKS[2] is G_LEFT_FINAL
    storyboard_times=[0,4,8,13,18,22,26,30,34,39,41,48,60,72,84,99,118,140,150]
    thumb=256;gap=8;label=21;cols=5;rows=math.ceil(len(storyboard_times)/cols)
    board=Image.new('RGB',(cols*(thumb+gap)+gap,rows*(thumb+gap+label)+gap),'white');dr=ImageDraw.Draw(board)
    for j,f in enumerate(storyboard_times):
        im=render(f,thumb);b=Image.new('RGBA',(thumb,thumb),'white');b.alpha_composite(im)
        x=gap+(j%cols)*(thumb+gap);y=gap+(j//cols)*(thumb+gap+label)
        board.paste(b.convert('RGB'),(x,y));dr.text((x+8,y+thumb+2),f'{f/FPS:.2f}s',fill='#293d2d')
    board.save(ROOT/'CHAPCHITRA_C05_Icon01_V5_STORYBOARD.png')
    # Inline playable visual GIF at 15 FPS; every second source frame.
    frames=[render(f,384) for f in range(0,LAST+1,2)]
    frames[0].save(ROOT/'CHAPCHITRA_C05_Icon01_V5_MOTION_REVIEW.gif',save_all=True,append_images=frames[1:],duration=67,loop=0,optimize=True,disposal=2)
    ff=shutil.which('ffmpeg')
    if ff:
        cmd=[ff,'-y','-f','image2pipe','-vcodec','png','-framerate',str(FPS),'-i','-','-vf','format=yuv420p',str(ROOT/'CHAPCHITRA_C05_Icon01_V5_MOTION_REVIEW.mp4')]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        for f in range(LAST+1):
            pic=render(f,512);b=Image.new('RGBA',(512,512),'white');b.alpha_composite(pic)
            blob=io.BytesIO();b.convert('RGB').save(blob,format='PNG');proc.stdin.write(blob.getvalue())
        proc.stdin.close();err=proc.stderr.read();proc.wait(timeout=120);print('video',proc.returncode,err.decode(errors='replace')[-150:])
    make=create_review_html()
    qa={'source_sha256':SOURCE_HASH,'frames':151,'fps':30,'duration_seconds':5,'old_turn_duration_frames':61,'new_turn_duration_frames':FINAL_SWAP,'page_speed_multiplier':1.5,'page_turn_windows':WINDOWS,'last_back_face':'Left_Page_Final','shirt_ks_exact_matches_v4':tee['ks']==SHIRT_KS,'shirt_mask_exact_matches_v4':tee['masksProperties']==SHIRT_MASK,'final_target_changed_pixels_640':changed,'page_face_opacity_percent':100,'raster_lottie_assets':len(DATA['assets']),'creative_status':'unapproved'}
    (ROOT/'QA_METRICS.json').write_text(json.dumps(qa,indent=2))
    print('V5 finished',make, 'json_bytes',JSON_PATH.stat().st_size)