#!/usr/bin/env python3
"""Isolated CHAPCHITRA C05 Icon 01 Lottie prototype — source SVG preserved."""
import io, re, json, hashlib, zipfile, math, subprocess, html, shutil
from copy import deepcopy
from pathlib import Path
from lxml import etree
from PIL import Image, ImageDraw, ImageFont, ImageChops
import cairosvg

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'build'
OUT.mkdir(exist_ok=True)
SOURCE=ROOT/'More_than_a_tshirt_Icon_1.svg'
if not SOURCE.exists(): SOURCE=ROOT/'More_than_a_tshirt_Icon_1_ORIGINAL.svg'
MASTER=OUT/'More_than_a_tshirt_Icon_1_ORIGINAL.svg'
shutil.copy2(SOURCE,MASTER)
W=H=512; FPS=30; END=132; DUR=END/FPS
SVGNS='http://www.w3.org/2000/svg';NS={'s':SVGNS}
SRC_TEXT=SOURCE.read_text(encoding='utf8')
SVG=etree.fromstring(SRC_TEXT.encode())
PIV_T=[326,155];PIV_P=[183,401]

TOKEN=re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?')

def rv(a):return [round(float(n),4) for n in a]
def static(v):return {'a':0,'k':v}

def kf(seq, linear=False):
    # all keys explicit in Lottie frames, numerical or vector property
    if len(seq)==1:return static(seq[0][1])
    arr=[]
    for idx,(t,v) in enumerate(seq):
        sv=v if isinstance(v,list) else [v]
        d={'t':int(t),'s':sv}
        if idx<len(seq)-1:
            en=seq[idx+1][1]; ev=en if isinstance(en,list) else [en]
            d['e']=ev
            if linear: d.update(i={'x':.667,'y':.667},o={'x':.333,'y':.333})
            else:d.update(i={'x':.75,'y':1.0},o={'x':.25,'y':0.0})
        arr.append(d)
    return {'a':1,'k':arr}

def path_parse(d):
    tok=TOKEN.findall(d)
    shapes=[];v=[];in_t=[];out_t=[];cursor=[0.,0.];first=[0.,0.];i=0;cmd=None;prev_c=None;prev_q=None
    def is_command(t):return len(t)==1 and t.isalpha()
    def push(closed=False):
        nonlocal v,in_t,out_t
        if v:
            if closed and len(v)>1 and v[0]==v[-1] and in_t[-1]==[0,0] and out_t[-1]==[0,0]:
                v.pop();in_t.pop();out_t.pop()
            shapes.append({'c':bool(closed),'v':v,'i':in_t,'o':out_t})
        v=[];in_t=[];out_t=[]
    def num(n):
        nonlocal i
        z=[float(t) for t in tok[i:i+n]];i+=n;return z
    def add(q,ink=None):
        nonlocal cursor
        q=rv(q);v.append(q);in_t.append(rv(ink or [0,0]));out_t.append([0,0]);cursor=q
    while i<len(tok):
        if is_command(tok[i]):
            cmd=tok[i];i+=1
            if cmd in 'Zz':push(True);cursor=first[:];prev_c=None;prev_q=None;cmd=None;continue
        rel=cmd.islower();c=cmd.upper()
        if c=='M':
            x,y=num(2)
            if rel:x+=cursor[0];y+=cursor[1]
            if v:push()
            add([x,y]);first=cursor[:];cmd='l' if rel else 'L'
        elif c in 'LHV':
            if c=='L':x,y=num(2)
            elif c=='H':x=num(1)[0];y=cursor[1]
            else:x=cursor[0];y=num(1)[0]
            if rel:
                if c!='V':x+=cursor[0]
                if c!='H':y+=cursor[1]
            add([x,y]);prev_c=None;prev_q=None
        elif c in 'CS':
            if c=='C':x1,y1,x2,y2,x,y=num(6)
            else:
                x2,y2,x,y=num(4)
                x1,y1=(2*cursor[0]-prev_c[0],2*cursor[1]-prev_c[1]) if prev_c else cursor[:]
            if rel:
                if c=='C':x1+=cursor[0];y1+=cursor[1]
                x2+=cursor[0];y2+=cursor[1];x+=cursor[0];y+=cursor[1]
            out_t[-1]=rv([x1-cursor[0],y1-cursor[1]]);add([x,y],[x2-x,y2-y]);prev_c=[x2,y2];prev_q=None
        elif c in 'QT':
            if c=='Q':qx,qy,x,y=num(4)
            else:
                x,y=num(2);qx,qy=(2*cursor[0]-prev_q[0],2*cursor[1]-prev_q[1]) if prev_q else cursor[:]
            if rel:
                if c=='Q':qx+=cursor[0];qy+=cursor[1]
                x+=cursor[0];y+=cursor[1]
            x1=cursor[0]+(qx-cursor[0])*2/3;y1=cursor[1]+(qy-cursor[1])*2/3
            x2=x+(qx-x)*2/3;y2=y+(qy-y)*2/3
            out_t[-1]=rv([x1-cursor[0],y1-cursor[1]]);add([x,y],[x2-x,y2-y]);prev_q=[qx,qy];prev_c=None
        else:raise ValueError('Unsupported path: '+str(cmd))
    push(False)
    return shapes

def circle_path(el):
    cx=float(el.get('cx'));cy=float(el.get('cy'));r=float(el.get('r'))
    k=r*.5522847498307936
    return {'c':True,'v':rv2([[cx+r,cy],[cx,cy+r],[cx-r,cy],[cx,cy-r]]),
            'i':rv2([[0,-k],[k,0],[0,k],[-k,0]]),
            'o':rv2([[0,k],[-k,0],[0,-k],[k,0]])}
def rv2(x):return [rv(z) for z in x]
styles={m.group(1):m.group(2).lower() for m in re.finditer(r'\.(st\d+)\s*\{\s*fill\s*:\s*(#[0-9a-fA-F]{6})\s*;',SRC_TEXT)}
assert styles=={'st0':'#293d2d','st1':'#e4e3de','st2':'#172419','st3':'#f6f7f5'},styles

def element_group(el, ordinal):
    tag=etree.QName(el).localname
    if tag=='path':geom=path_parse(el.get('d'))
    elif tag=='circle':geom=[circle_path(el)]
    else: raise ValueError(tag)
    items=[{'ty':'sh','nm':f'{tag} path {j+1}','ks':static(shape)} for j,shape in enumerate(geom)]
    hx=styles.get(el.get('class'))
    if not hx:raise ValueError(f'No fill color: {el.attrib}')
    rgb=[round(int(hx[k:k+2],16)/255,6) for k in (1,3,5)]
    items.extend([{'ty':'fl','nm':'Original SVG fill','c':static(rgb),'o':static(100),'r':1},
                  {'ty':'tr','nm':'Identity','a':static([0,0]),'p':static([0,0]),'s':static([100,100]),'r':static(0),'o':static(100),'sk':static(0),'sa':static(0)}])
    return {'ty':'gr','nm':f'{tag}_{ordinal}','it':items}

def extract_group(el):
    out=[]
    for i,ch in enumerate(el):
        tag=etree.QName(ch).localname
        if tag=='g':
            out.append({'ty':'gr','nm':ch.get('id','SVG nested group'),'it':extract_group(ch)+[
                {'ty':'tr','nm':'Identity','a':static([0,0]),'p':static([0,0]),'s':static([100,100]),'r':static(0),'o':static(100),'sk':static(0),'sa':static(0)}]})
        elif tag in ['path','circle']:out.append(element_group(ch,i))
        else:raise ValueError(f'unexpected child: {tag}')
    return list(reversed(out))

def fgroup(id):return SVG.xpath(f"./s:g[@id='{id}']",namespaces=NS)[0]
assert [g.get('id') for g in SVG.xpath('./s:g',namespaces=NS)]==['Icon_circle','Tshirt','Book_Base','Right_page','Left_page']

# all keyframe timestamps are 30 fps.
# Shirt begins in approved SVG pose, temporarily disappears into the book before emergence.
TSHIRT_POS=[(0,PIV_T),(8,PIV_T),(21,[184,305]),(31,[185,288]),
            (45,[216,187]),(59,[279,110]),(72,[351,106]),(82,[377,147]),
            (92,[341,187]),(108,[303,147]),(123,PIV_T),(132,PIV_T)]
TSHIRT_SCALE=[(0,[100,100]),(9,[100,100]),(21,[43,43]),(31,[44,44]),
              (48,[78,78]),(66,[94,94]),(83,[91,91]),(106,[96,96]),(123,[100,100]),(132,[100,100])]
TSHIRT_ROT=[(0,0),(10,0),(22,-14),(39,-11),(58,-6),(73,9),(89,-4),(110,3),(123,0),(132,0)]
TSHIRT_OP=[(0,100),(9,100),(19,0),(22,0),(30,42),(41,100),(132,100)]
# Slim the page around its center-spine anchor; never mirror the original artwork.
PAGE_SCALE=[(0,[100,100]),(9,[100,100]),(26,[64,100]),(39,[26,100]),
            (47,[27,100]),(57,[56,100]),(78,[78,100]),(106,[100,100]),(132,[100,100])]
PAGE_ROT=[(0,0),(9,0),(28,-9),(41,-14),(57,-8),(82,-2),(106,0),(132,0)]
PAGE_POS=[(0,PIV_P),(9,PIV_P),(38,[186,395]),(57,[183,399]),(82,PIV_P),(132,PIV_P)]

# no separate element-level opacity changes, no raster frames, no external images.
def vector_layer(name,grp,ind,anchor=(0,0),pos=None,sc=None,rot=None,opacity=None):
    a=list(anchor);p=pos if pos is not None else [(0,a)]
    # static layers with zero anchor have zero position; others start at their anchor
    return {'ddd':0,'ind':ind,'ty':4,'nm':name,'sr':1,
            'ks':{'o':kf(opacity or [(0,100)]),'r':kf(rot or [(0,0)]),'p':kf([(t,[*val,0]) for t,val in p]),
                  'a':static([*a,0]),'s':kf([(t,[*val,100]) for t,val in (sc or [(0,[100,100])])])},
            'ao':0,'shapes':extract_group(grp),'ip':0,'op':END,'st':0,'bm':0}

LAYERS=[
    vector_layer('Left_page / page lift and flatten',fgroup('Left_page'),1,PIV_P,PAGE_POS,PAGE_SCALE,PAGE_ROT),
    vector_layer('Right_page / stationary',fgroup('Right_page'),2),
    vector_layer('Book_Base / stationary',fgroup('Book_Base'),3),
    vector_layer('Tshirt / curved emergence flight',fgroup('Tshirt'),4,PIV_T,TSHIRT_POS,TSHIRT_SCALE,TSHIRT_ROT,TSHIRT_OP),
    vector_layer('Icon_circle / stationary',fgroup('Icon_circle'),5)
]
DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':END,'w':W,'h':H,'nm':'CHAPCHITRA C05 Icon 01 — Stories You Can Wear',
      'ddd':0,'assets':[],'layers':LAYERS,'markers':[],
      'meta':{'generator':'CHAPCHITRA C05 original SVG vector animation exporter','source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'notes':'C05 standalone draft. 5 original Illustrator groups; true vector shape and keyframe animation; no expressions or images.'}}
JSON_PATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_PROTOTYPE.json'
JSON_PATH.write_text(json.dumps(DATA,separators=(',',':')),encoding='utf8')
LOTTIE_PATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_PROTOTYPE.lottie'
manifest={'version':'1','generator':'CHAPCHITRA vector motion engineering','description':'C05 Icon 01 original illustrated storybook and floating cat T-shirt','activeAnimationId':'c05_icon01_storybook','animations':[{'id':'c05_icon01_storybook','autoplay':False,'loop':False,'speed':1,'direction':1}]}
with zipfile.ZipFile(LOTTIE_PATH,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json',json.dumps(manifest,separators=(',',':')))
    z.writestr('animations/c05_icon01_storybook.json',json.dumps(DATA,separators=(',',':')))

# Sample keyframes with cubic approximate easing; this is a visually faithful reference
# independent of the Lottie browser renderer, not proof of lottie-web playback.
def ease(t):return t*t*(3-2*t)
def sample(seq,f):
    if f<=seq[0][0]:return seq[0][1]
    for (t0,v0),(t1,v1) in zip(seq,seq[1:]):
        if f<=t1:
            p=ease((f-t0)/(t1-t0))
            if isinstance(v0,list):return [a+(b-a)*p for a,b in zip(v0,v1)]
            return v0+(v1-v0)*p
    return seq[-1][1]

def svg_frame(f):
    root=deepcopy(SVG)
    g=lambda n:root.xpath(f"./s:g[@id='{n}']",namespaces=NS)[0]
    ppos=sample(PAGE_POS,f);ps=sample(PAGE_SCALE,f);rot=sample(PAGE_ROT,f)
    g('Left_page').set('transform',f'translate({ppos[0]} {ppos[1]}) rotate({rot}) scale({ps[0]/100} {ps[1]/100}) translate({-PIV_P[0]} {-PIV_P[1]})')
    tpos=sample(TSHIRT_POS,f);ts=sample(TSHIRT_SCALE,f);tr=sample(TSHIRT_ROT,f)
    g('Tshirt').set('transform',f'translate({tpos[0]} {tpos[1]}) rotate({tr}) scale({ts[0]/100} {ts[1]/100}) translate({-PIV_T[0]} {-PIV_T[1]})')
    g('Tshirt').set('opacity',str(sample(TSHIRT_OP,f)/100))
    return etree.tostring(root)

# Inspect exact identity at frame 0 and final frame (before Lottie output test)
assert sample(TSHIRT_POS,0)==PIV_T and sample(PAGE_SCALE,0)==[100,100]
assert sample(TSHIRT_POS,END)==PIV_T and sample(PAGE_SCALE,END)==[100,100]
assert sample(PAGE_ROT,END)==0 and sample(TSHIRT_ROT,END)==0
assert sample(TSHIRT_OP,END)==100

def render_frame(f,size=680):
    raster=cairosvg.svg2png(bytestring=svg_frame(f),output_width=size,output_height=size)
    return Image.open(io.BytesIO(raster)).convert('RGBA')

# visual reference: transparent like production, checkerboard shown only inside web preview.
frames=[]
for i in range(0,END,2):
    im=render_frame(i,size=640)
    frames.append(im)
GIF=OUT/'CHAPCHITRA_C05_Icon01_MOTION_REVIEW.gif'
frames[0].save(GIF,save_all=True,append_images=frames[1:],duration=round(2000/FPS),loop=0,disposal=2,optimize=True)
# Encode MP4 through pipe from PNG frames to avoid unnecessary huge intermediates.
MP4=OUT/'CHAPCHITRA_C05_Icon01_MOTION_REVIEW.mp4'
ffmpeg=shutil.which('ffmpeg')
if ffmpeg:
    proc=subprocess.Popen([ffmpeg,'-y','-f','image2pipe','-vcodec','png','-framerate',str(FPS),'-i','-', '-vf','format=yuv420p',str(MP4)],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        for i in range(END):
            im=render_frame(i,size=640)
            white=Image.new('RGBA',im.size,'white');white.alpha_composite(im)
            b=io.BytesIO();white.convert('RGB').save(b,format='PNG');proc.stdin.write(b.getvalue())
        proc.stdin.close();err=proc.stderr.read();proc.wait(timeout=50)
        if proc.returncode!=0: print('ffmpeg warning',err.decode(errors='replace')[-350:])
    except Exception as e:
        print('mp4 exception',e);proc.kill()

# Storyboard 3 x 3
key=[0,17,32,44,59,74,87,106,END]
STORY=OUT/'CHAPCHITRA_C05_Icon01_STORYBOARD.png'
thumbs=[render_frame(f,size=448) for f in key]
pad=12;hlabel=22;ww=448
board=Image.new('RGB',(3*ww+4*pad,3*(ww+hlabel)+4*pad),'white');draw=ImageDraw.Draw(board)
for i,(f,im) in enumerate(zip(key,thumbs)):
    row,col=divmod(i,3);x=pad+col*(ww+pad);y=pad+row*(ww+hlabel+pad)
    comp=Image.new('RGBA',(ww,ww),'white');comp.alpha_composite(im)
    board.paste(comp.convert('RGB'),(x,y));draw.text((x+6,y+ww+3),f'Frame {f:03} — {f/FPS:.2f}s',fill=(35,35,35))
board.save(STORY)

# transparent reference alignment comparison: SVG raster pixel identical at first+final
orig_png=cairosvg.svg2png(url=str(SOURCE),output_width=640,output_height=640)
orig=Image.open(io.BytesIO(orig_png)).convert('RGBA')
first=render_frame(0,size=640);last=render_frame(END,size=640)
# CairoSVG transform matrix identity may yield integer rasterization differences; count changed pixels
import numpy as np
A=np.asarray(orig).astype(int);B=np.asarray(last).astype(int)
MAX_DELTA=int(np.max(np.abs(A-B)));MAE=float(np.mean(np.abs(A-B)));changed=int(np.any(A!=B,axis=2).sum())

# Preview HTML - includes source and Lottie inline; browser downloads official lottie-web renderer.
# If library is unavailable, review controls use transparent SVG fallback, explicitly labeled.
preview=OUT/'CHAPCHITRA_C05_Icon01_ISOLATED_PREVIEW.html'
embedded_svg=SRC_TEXT.replace('<svg ', '<svg id="fallback-art" ',1)
# inline source string safely escaped for JS
source_script=json.dumps(SRC_TEXT).replace('</','<\\/')
json_script=json.dumps(DATA,separators=(',',':')).replace('</','<\\/')
js=r'''(function(){
const data=JSON.parse(document.getElementById('lottie-data').textContent);
const origSVG=JSON.parse(document.getElementById('svg-source').textContent);
const frameMax=data.op, fr=data.fr;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);
const player=$('lottie-stage'),fallback=$('fallback-stage'),readout=$('readout');
let inst=null,raf=0,playing=false,loop=false,speed=1,t=0,lastClock=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const key={
 tpos:__TPOS__,tscale:__TSCALE__,trot:__TROT__,top:__TOP__,
 ppos:__PPOS__,pscale:__PSCALE__,prot:__PROT__
};
const pivotT=[326,155],pivotP=[183,401];
function ease(p){return p*p*(3-2*p)}
function sample(keys,f){if(f<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){if(f<=keys[i][0]){const [t0,v0]=keys[i-1];const[t1,v1]=keys[i];const p=ease((f-t0)/(t1-t0));return Array.isArray(v0)?v0.map((v,j)=>v+(v1[j]-v)*p):v0+(v1-v0)*p}}return keys.at(-1)[1]}
function setFallback(f){const page=$('fallback-svg').querySelector('#Left_page');const tee=$('fallback-svg').querySelector('#Tshirt');
 const pp=sample(key.ppos,f),ps=sample(key.pscale,f),pr=sample(key.prot,f);page.setAttribute('transform',`translate(${pp[0]} ${pp[1]}) rotate(${pr}) scale(${ps[0]/100} ${ps[1]/100}) translate(${-pivotP[0]} ${-pivotP[1]})`);
 const tp=sample(key.tpos,f),ts=sample(key.tscale,f),tr=sample(key.trot,f);tee.setAttribute('transform',`translate(${tp[0]} ${tp[1]}) rotate(${tr}) scale(${ts[0]/100} ${ts[1]/100}) translate(${-pivotT[0]} ${-pivotT[1]})`);tee.setAttribute('opacity',sample(key.top,f)/100);
}
function seek(f){t=clamp(f,0,frameMax);if(inst)inst.goToAndStop(t,true);else setFallback(t);$('scrub').value=t;readout.textContent=`${(t/fr).toFixed(2)} / ${(frameMax/fr).toFixed(2)}s`}
function pause(){playing=false;if(inst)inst.pause();if(raf)cancelAnimationFrame(raf);raf=0;lastClock=0}
function tick(now){if(!playing)return;const dt=lastClock?Math.min((now-lastClock)/1000,.12):0;lastClock=now;let n=t+dt*speed*fr;if(n>=frameMax){if(loop)n=n%frameMax;else{seek(frameMax);pause();return;}}seek(n);raf=requestAnimationFrame(tick)}
function play(){if(reduced&&t===0)seek(frameMax);if(t>=frameMax)seek(0);pause();playing=true;raf=requestAnimationFrame(tick)}
$('play').onclick=play;$('pause').onclick=pause;$('replay').onclick=()=>{seek(0);play()};$('loop').onchange=e=>loop=e.target.checked;$('speed').onchange=e=>speed=Number(e.target.value);$('scrub').oninput=e=>{pause();seek(Number(e.target.value))};
$('original').innerHTML=origSVG;const fb=$('fallback-svg');fb.innerHTML=origSVG.replace('<svg ','<svg class="preview-svg" ');const f=fb.firstElementChild;
if(f)f.removeAttribute('id');
const overlay=$('align-overlay');overlay.innerHTML=origSVG.replace('<svg ','<svg class="preview-svg" ');overlay.firstElementChild?.removeAttribute('id');
function align(){const v=$('overlay-check').checked;overlay.style.opacity=v?'0.40':'0';$('overlay-label').textContent=v?'Original overlaid at 40%':'Original alignment overlay off'}
$('overlay-check').onchange=align;align();
try{if(window.lottie){
 inst=window.lottie.loadAnimation({container:player,renderer:'svg',loop:false,autoplay:false,animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet',clearCanvas:true}});
 fallback.style.display='none';$('engine').textContent='Lottie renderer: lottie-web (genuine JSON playback)';
 inst.addEventListener('DOMLoaded',()=>{seek(reduced?frameMax:0);if(!reduced)play()});
 inst.addEventListener('data_failed',()=>{$('engine').textContent='Lottie runtime failed; displaying SVG fallback';inst.destroy();inst=null;fallback.style.display='block';seek(0)});
}else{$('engine').textContent='Offline SVG motion reference — lottie-web CDN unavailable (not renderer certification)';seek(reduced?frameMax:0);if(!reduced)play()}}
catch(e){$('engine').textContent='Lottie browser initialization unavailable — SVG motion reference';inst=null;fallback.style.display='block';seek(0)}
window.__c05={seek,pause,play,engine:()=>inst?'lottie-web':'svg-reference',state:()=>({t,playing,loop,speed})};
})();'''
for label,array in {'__TPOS__':TSHIRT_POS,'__TSCALE__':TSHIRT_SCALE,'__TROT__':TSHIRT_ROT,'__TOP__':TSHIRT_OP,'__PPOS__':PAGE_POS,'__PSCALE__':PAGE_SCALE,'__PROT__':PAGE_ROT}.items():
    js=js.replace(label,json.dumps(array,separators=(',',':')))
html_text=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHAPCHITRA · C05 Icon 01 · Standalone Lottie Review</title>
<style>
:root{{--paper:#fff;--green:#293D2D;--text:#172419;--line:#d8cec2}}*{{box-sizing:border-box}}body{{font-family:system-ui,-apple-system,sans-serif;background:#f6f7f5;color:var(--text);margin:0;padding:clamp(16px,3vw,38px)}}.shell{{max-width:1240px;margin:auto}}h1{{font-size:clamp(23px,3.5vw,36px);line-height:1.15;margin:6px 0}}h2{{font-size:16px;margin:0 0 12px}}p{{margin:6px 0 14px}}.eyebrow{{font-size:11px;letter-spacing:.17em;color:#8A503B;font-weight:750}}.stagegrid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin:24px 0}}.card{{background:white;border:1px solid var(--line);border-radius:16px;padding:20px;min-width:0}}.stage{{position:relative;aspect-ratio:1;max-width:512px;margin:auto;overflow:hidden;background:transparent}}.stage svg{{width:100%;height:100%;display:block}}.stage.checker{{background-color:#fff;background-image:linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(-45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%),linear-gradient(-45deg,transparent 75%,#eee 75%);background-position:0 0,0 10px,10px -10px,-10px 0;background-size:20px 20px}}#lottie-stage,#fallback-stage,#align-overlay,#fallback-svg{{position:absolute;inset:0;width:100%;height:100%}}#fallback-stage{{display:block}}#align-overlay{{pointer-events:none;opacity:0}}button,select{{font:600 13px system-ui;background:white;color:var(--green);border:1px solid var(--green);padding:9px 14px;border-radius:8px;cursor:pointer}}button:first-child{{background:var(--green);color:white}}.toolbar{{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:10px 0}}label{{font-size:13px;display:flex;gap:6px;align-items:center}}input[type=range]{{width:100%;accent-color:#8A503B}}.small{{font-size:12px;color:#6d645c;line-height:1.5}}.pill{{color:#293D2D;font-weight:700;font-size:12px;margin-top:10px}}@media(max-width:720px){{.stagegrid{{grid-template-columns:1fr;gap:14px}}.card{{padding:14px}}}}@media(prefers-reduced-motion:reduce){{*{{scroll-behavior:auto!important}}}}
</style><script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script></head><body><main class="shell">
<div class="eyebrow">CHAPCHITRA / C05 / ICON 01 · ISOLATED MOTION STUDY</div><h1>Stories You Can Wear</h1><p>Original artwork beside the animated vector prototype. No website integration.</p>
<div class="stagegrid"><section class="card"><h2>Original SVG · unmodified</h2><div class="stage" id="original" aria-label="Original uploaded static icon"></div><p class="small">Source: 512×512 original Illustrator SVG.</p></section>
<section class="card"><h2>Animated prototype · Lottie JSON</h2><div class="stage" id="anim-parent"><div id="lottie-stage"></div><div id="fallback-stage"><div id="fallback-svg"></div></div><div id="align-overlay"></div></div><div class="pill" id="engine">Checking Lottie renderer…</div><p id="overlay-label" class="small">Original alignment overlay off</p></section></div>
<div class="card"><div class="toolbar"><button id="play">Play</button><button id="pause">Pause</button><button id="replay">Replay</button><label><input type="checkbox" id="loop"> Loop (review only)</label><label>Speed <select id="speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label><label><input id="overlay-check" type="checkbox"> Original overlay</label><label><input id="checker" type="checkbox"> Checkerboard</label></div><input id="scrub" aria-label="Frame scrub" type="range" min="0" max="{END}" step="0.1" value="0"><p class="small" id="readout">0.00 / {DUR:.2f}s</p><p class="small">Lottie output is vector-based with no image assets. The visual fallback is clearly labeled when the official browser runtime cannot load. Reduced-motion defaults to the final pose.</p></div></main>
<script id="lottie-data" type="application/json">{json_script}</script><script id="svg-source" type="application/json">{source_script}</script>
<script>{js}</script><script>document.getElementById('checker').onchange=e=>document.querySelectorAll('.stage').forEach(el=>el.classList.toggle('checker',e.target.checked))</script></body></html>'''
preview.write_text(html_text,encoding='utf8')

# QA report with strict distinction between structural checks and official runtime QA.
manifest_qa={'original_file':'More_than_a_tshirt_Icon_1_ORIGINAL.svg','original_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'derivative_sha256':hashlib.sha256(JSON_PATH.read_bytes()).hexdigest(),'groups':['Icon_circle','Tshirt','Book_Base','Right_page','Left_page'],
    'duration_seconds':DUR,'fps':FPS,'json_shape_layers':5,'images':0,'expressions':0,'first_vs_final_source_max_pixel_difference':MAX_DELTA,
    'first_vs_final_source_mean_absolute_difference':round(MAE,6),'changed_pixels_at_final':changed,
    'official_lottie_web_playback':'not independently certified in local isolated runtime (CDN unavailable in sandbox)',
    'safari_webkit_test':'not independently certified in sandbox','preview_renderer':'official lottie-web preferred with explicitly labeled SVG fallback'}
(OUT/'QA_MANIFEST.json').write_text(json.dumps(manifest_qa,indent=2))
qa=f'''# CHAPCHITRA C05 — Icon 01 Standalone Lottie Prototype QA

## Source and scope
- Original SVG retained unchanged: SHA-256 `{manifest_qa['original_sha256']}`.
- Original five SVG groups preserved in the exported vector Lottie: `Icon_circle`, `Tshirt`, `Book_Base`, `Right_page`, `Left_page`.
- No changes to the existing website or other C-series icon animations; branch is isolated and unmerged.

## Prototype
- Genuine Lottie 5.9.6 JSON structure: **{FPS} fps**, **{END} frames**, **{DUR:.2f} seconds**.
- Five native vector shape layers with real position, rotation, scale and opacity keyframes; **zero** external/raster image assets.
- The left page folds inward with a single-sided scale and gentle rotation, without reversing the original artwork.
- Cat T-shirt briefly clears its source position, emerges from the left-page region, follows a shallow loop above the book and settles to its original pose.
- The circle, book base and right page remain stationary.

## Alignment check
- Final-frame reference SVG comparison: maximum absolute pixel-channel difference **{MAX_DELTA}**; mean absolute difference **{MAE:.6f}** at 640px; differing pixels **{changed}**. Original first/final vector states are equal by transform/opacity keyframe values.

## Playback QA evidence and open gate
- The browser review page prefers official **lottie-web 5.12.2** for actual JSON playback; if unavailable, it labels and uses an independent SVG motion reference rather than claiming it is Lottie playback.
- **Official renderer playback in Chromium and Safari/WebKit is not yet certified** because the runtime CDN is unreachable within this sandbox. Validate this before production acceptance.
- Reduced-motion users are shown the final pose by default. Play/Replay/Loop controls are review-only; production policy is play once and hold final pose.

## Known visual limitations / creative review
- The page turn is a 2D compression/rotation illusion, not a physically simulated two-sided 3D paper curl.
- A brief disappearance/re-emergence of the T-shirt bridges its already-visible static starting position with the requested emerging-from-book story.
- **Not yet owner-approved**; do not release or proceed with C05 Icon 02.
'''
(OUT/'QA_REPORT.md').write_text(qa)
readme='''# C05 Icon 01 — Stories You Can Wear (standalone review prototype)

Files: `More_than_a_tshirt_Icon_1_ORIGINAL.svg` is the untouched source; `.json` and `.lottie` contain genuine Lottie vector shapes; `C05_Icon01_produce.py` regenerates the files; `CHAPCHITRA_C05_Icon01_ISOLATED_PREVIEW.html` provides original vs animation review, with real lottie-web as primary player and labeled offline SVG motion fallback. GIF/MP4 previews are rendered from the same SVG choreography and are **reference visuals**, not proof of Lottie renderer behavior.

No website integration. No other icon modifications. Review approval is required.
'''
(OUT/'README.md').write_text(readme)
if Path(__file__).resolve() != (OUT/'C05_Icon01_produce.py').resolve():
    shutil.copy2(Path(__file__),OUT/'C05_Icon01_produce.py')
zip_path=ROOT/'CHAPCHITRA_C05_ICON01_STANDALONE_LOTTIE_REVIEW.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(OUT.glob('*')):
        if p.is_file():z.write(p,p.name)
print('OUTPUT',OUT,'ZIP',zip_path,'JSON',JSON_PATH.stat().st_size,'LOTTIE',LOTTIE_PATH.stat().st_size,'mae',MAE,'changed',changed)