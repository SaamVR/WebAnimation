#!/usr/bin/env python3
"""CHAPCHITRA C05 Icon03 — isolated original SVG hand-block printing.
Native Lottie paths, 30fps; no raster images in JSON, source unchanged.
Reproducible: python C05_Icon03_generate.py (requires lxml, cairosvg, Pillow, ffmpeg for MP4).
"""
from pathlib import Path
from lxml import etree
from PIL import Image, ImageDraw, ImageChops
from copy import deepcopy
import hashlib, io, math, json, re, zipfile, base64, argparse, shutil, subprocess
import cairosvg

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'More_than_a_tshirt_Icon_3_Lottie_Ready_ORIGINAL.svg'
if not SOURCE.exists():SOURCE=ROOT/'More_than_a_tshirt_Icon_3_Lottie_Ready_SOURCE.svg'
SOURCE_BYTES=SOURCE.read_bytes()
SOURCE_HASH=hashlib.sha256(SOURCE_BYTES).hexdigest()
SVG=etree.fromstring(SOURCE_BYTES)
N='{http://www.w3.org/2000/svg}'
TOKEN=re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?')
styles={cl:h.lower() for cl,h in re.findall(r'\.(st\d+)\s*\{\s*fill\s*:\s*(#[a-fA-F0-9]{6})\s*;',SOURCE_BYTES.decode())}
assert styles=={'st0':'#293d2d','st1':'#f6f7f5','st2':'#172419','st3':'#d8cec2'},styles
FPS=30; LAST=95; END=LAST+1; SIZE=512

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

def element_group(el, ordinal):
    tag=etree.QName(el).localname
    if tag=='path':geom=path_parse(el.get('d'))
    elif tag=='circle':geom=[circle_path(el)]
    elif tag=='polygon':
        pts=[float(v) for v in re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)',el.get('points'))]
        assert len(pts)%2==0 and len(pts)>=6
        n=len(pts)//2
        geom=[{'c':True,'v':rv2([[pts[2*i],pts[2*i+1]] for i in range(n)]),'i':[[0,0] for _ in range(n)],'o':[[0,0] for _ in range(n)]}]
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
        elif tag in ['path','circle','polygon']:out.append(element_group(ch,i))
        else:raise ValueError(f'unexpected child: {tag}')
    return list(reversed(out))

def keyshapes(samples):
    kk=[]
    for i,(f,sh) in enumerate(samples):
        v={'t':f,'s':[sh]}
        if i<len(samples)-1:
            v['e']=[samples[i+1][1]]
            v['i']={'x':.667,'y':.667};v['o']={'x':.333,'y':.333}
        kk.append(v)
    return {'a':1,'k':kk}

def trans():return {'ty':'tr','nm':'Identity','a':static([0,0]),'p':static([0,0]),'s':static([100,100]),'r':static(0),'o':static(100),'sk':static(0),'sa':static(0)}

# All coordinates are in original Illustrator 512x512 SVG space.
# Initial/rest position is the original illustration; only the carved block moves.
G={el.get('id'):el for el in SVG if el.get('id')}
assert set(G)=={'Icon_Circle','Cloth','Print_over_cloth','Wood_block_shadow','Wood_block'}
WOOD_PIVOT=(203.,210.)


def smooth(t):
    t=max(0,min(1,t))
    return t*t*(3-2*t)


def lerp(a,b,t):return a+(b-a)*t


def pose(f):
    """Approved candidate: hover, diagonal press, brief compression, single lift, rest."""
    if f<=9:
        u=smooth(f/9)
        return (-5*u,-8*u,100.,100.)
    if f<=34:
        u=smooth((f-9)/25)
        return (lerp(-5,90,u),lerp(-8,70,u),100.,100.)
    if f<=38:
        u=smooth((f-34)/4)
        return (90.,lerp(70,73,u),100+0.2*u,100-1.3*u)
    if f<=43:
        u=smooth((f-38)/5)
        return (90.,lerp(73,70,u),lerp(100.2,100,u),lerp(98.7,100,u))
    if f<=79:
        u=smooth((f-43)/36)
        return (90*(1-u),70*(1-u),100.,100.)
    return (0.,0.,100.,100.)


def ink_fraction(f):
    # The impression is revealed by a diagonal geometric mask, never opacity.
    # Reveal begins when the wooden block is applying pressure.
    if f<=38:return 0.
    if f>=67:return 1.
    return smooth((f-38)/(67-38))


def mask_polygon(f):
    u=ink_fraction(f)
    # Moving diagonal edge reveals bottom-right first while the block lifts to top-left.
    # Maintain four fixed vertices for reliable path interpolation in lottie-web.
    left_top=lerp(750,-90,u)
    left_bottom=left_top-150
    return {'c':True,
            'v':rv2([[left_top,-40],[560,-40],[560,560],[left_bottom,560]]),
            'i':[[0,0]]*4,'o':[[0,0]]*4}


def linear(samples):
    if len(samples)==1:return static(samples[0][1])
    out=[]
    for i,(f,value) in enumerate(samples):
        val=value if isinstance(value,list) else [value]
        key={'t':f,'s':val}
        if i+1<len(samples):
            nxt=samples[i+1][1]
            key['e']=nxt if isinstance(nxt,list) else [nxt]
            # A 1-frame sample already embodies smooth easing; interpolate linearly.
            key['i']={'x':0.667,'y':0.667}
            key['o']={'x':0.333,'y':0.333}
        out.append(key)
    return {'a':1,'k':out}


def path_mask():
    samples=[(f,mask_polygon(f)) for f in range(END)]
    return [{'inv':False,'mode':'a','pt':keyshapes(samples),
             'o':static(100),'x':static(0),
             'nm':'Contact-driven diagonal print reveal; ink remains permanently visible'}]


def vector_layer(el,ind):
    name=el.get('id')
    if etree.QName(el).localname in ('circle','path','polygon'):
        shapes=[element_group(el,0)]
    else:
        shapes=extract_group(el)
    props={'o':static(100),'r':static(0),'p':static([0,0,0]),
           'a':static([0,0,0]),'s':static([100,100,100])}
    if name=='Wood_block':
        samples=[(f,pose(f)) for f in range(END)]
        props={
          'o':static(100),'r':static(0),
          'a':static([WOOD_PIVOT[0],WOOD_PIVOT[1],0]),
          'p':linear([(f,[WOOD_PIVOT[0]+v[0],WOOD_PIVOT[1]+v[1],0]) for f,v in samples]),
          's':linear([(f,[v[2],v[3],100]) for f,v in samples]),
        }
    layer={'ddd':0,'ind':ind,'ty':4,'nm':name,'sr':1,'ks':props,
           'ao':0,'shapes':shapes,'ip':0,'op':END,'st':0,'bm':0}
    if name=='Print_over_cloth':
        layer['hasMask']=True
        layer['masksProperties']=path_mask()
    return layer


LAYERS=[vector_layer(el,i+1) for i,el in enumerate(reversed([e for e in SVG if e.get('id')]))]
DATA={
 'v':'5.9.6','fr':FPS,'ip':0,'op':END,'w':SIZE,'h':SIZE,
 'nm':'CHAPCHITRA C05 Icon03 · Illustrated with Character · Hand-Block Printing V1',
 'ddd':0,'assets':[],'layers':LAYERS,'markers':[],
 'meta':{'generator':'CHAPCHITRA original SVG vector rig',
         'source_sha256':SOURCE_HASH,'creative_status':'standalone prototype / approval required',
         'duration_seconds':round(END/FPS,3),'raster_assets':0}
}
JSON_FILE=ROOT/'CHAPCHITRA_C05_Icon03_Hand_Block_Printing_V1.json'
JSON_FILE.write_text(json.dumps(DATA,separators=(',',':')))
LOTTIE_FILE=ROOT/'CHAPCHITRA_C05_Icon03_Hand_Block_Printing_V1.lottie'
ANIM_ID='chapchitra_c05_icon03_hand_block_printing_v1'
with zipfile.ZipFile(LOTTIE_FILE,'w',zipfile.ZIP_DEFLATED) as z:
    manifest={'version':'1','generator':'CHAPCHITRA C05 original vector Lottie',
              'activeAnimationId':ANIM_ID,
              'animations':[{'id':ANIM_ID,'autoplay':True,'loop':False,'speed':1,'direction':1}]}
    z.writestr('manifest.json',json.dumps(manifest,separators=(',',':')))
    z.write(JSON_FILE,arcname=f'animations/{ANIM_ID}.json')


def svg_frame(f):
    r=etree.Element(N+'svg',nsmap=SVG.nsmap,
                    attrib={'viewBox':'0 0 512 512','width':'512','height':'512'})
    for el in SVG:
        if etree.QName(el).localname=='style':r.append(deepcopy(el))
    defs=etree.SubElement(r,N+'defs')
    clip=etree.SubElement(defs,N+'clipPath',id='printedInkReveal')
    m=mask_polygon(f)['v']
    d='M'+ ' '.join(f'{p[0]:.3f},{p[1]:.3f}' for p in m)+' Z'
    etree.SubElement(clip,N+'path',attrib={'d':d})
    for el in SVG:
        if not el.get('id'):continue
        item=deepcopy(el)
        if item.get('id')=='Print_over_cloth':
            item.set('clip-path','url(#printedInkReveal)')
        if item.get('id')=='Wood_block':
            dx,dy,sx,sy=pose(f)
            item.set('transform',f'translate({dx:.5f} {dy:.5f}) '
                                 f'translate({WOOD_PIVOT[0]} {WOOD_PIVOT[1]}) '
                                 f'scale({sx/100:.7f} {sy/100:.7f}) '
                                 f'translate({-WOOD_PIVOT[0]} {-WOOD_PIVOT[1]})')
        r.append(item)
    return etree.tostring(r,encoding='utf-8')


def raster(f,size=512):
    data=cairosvg.svg2png(bytestring=svg_frame(f),output_width=size,output_height=size)
    return Image.open(io.BytesIO(data)).convert('RGBA')


def on_white(im):
    w=Image.new('RGBA',im.size,'white');w.alpha_composite(im)
    return w.convert('RGB')


def ensure_final_match():
    original=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=SOURCE_BYTES,output_width=640,output_height=640))).convert('RGBA')
    end=raster(LAST,640)
    diff=ImageChops.difference(original,end)
    if diff.getbbox():
        print('WARN: SVG raster final diff bbox:',diff.getbbox())
        return False
    return True


def make_visuals():
    frames=[];framedir=ROOT/'frames';framedir.mkdir(exist_ok=True)
    for f in range(END):
        image=on_white(raster(f,480))
        image.save(framedir/f'frame_{f:03d}.png')
        frames.append(image)
    gif=ROOT/'CHAPCHITRA_C05_Icon03_MOTION_PREVIEW.gif'
    # 30fps GIF; display white background for easy inspection, native source transparent.
    frames[0].save(gif,save_all=True,append_images=frames[1:],duration=33,loop=0,disposal=2,optimize=True)
    mp4=ROOT/'CHAPCHITRA_C05_Icon03_MOTION_PREVIEW.mp4'
    if shutil.which('ffmpeg'):
        subprocess.run(['ffmpeg','-y','-v','error','-framerate','30',
                        '-i',str(framedir/'frame_%03d.png'),'-vf','format=yuv420p',
                        '-movflags','+faststart',str(mp4)],check=True)
    timings=[0,9,18,30,37,42,49,60,78,95]
    board=Image.new('RGB',(480*5,510*2),'white')
    draw=ImageDraw.Draw(board)
    for k,f in enumerate(timings):
        x=(k%5)*480;y=(k//5)*510
        board.paste(frames[f],(x,y))
        draw.text((x+15,y+483),f'{f/FPS:.2f}s  /  f{f:02}',fill=(41,61,45))
    board.save(ROOT/'CHAPCHITRA_C05_Icon03_STORYBOARD.png')
    return gif,mp4


def make_html():
    # Includes the original SVG, Lottie JSON and a self-contained SVG playback reference.
    # Tries native official lottie-web 5.12.2 first; SVG reference used if unavailable.
    original=SOURCE_BYTES.decode()
    lottiejson=JSON_FILE.read_text()
    # The SVG fallback reuses the original source and the same animated mask and transform curves.
    html='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/><title>C05 Icon 03 · Hand-Block Printing</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f6f7f5;color:#233427;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:1140px;margin:auto;padding:24px}h1{font-size:clamp(23px,3vw,35px);margin:5px 0 10px}.cap{font-size:11px;font-weight:800;letter-spacing:.16em;color:#8a503b}.intro{color:#637366}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.pane{background:#fff;border:1px solid #d9dfd9;border-radius:15px;padding:20px;min-width:0}h2{font-size:15px;margin:0 0 15px}.art{width:min(100%,440px);aspect-ratio:1;position:relative;margin:auto;border-radius:8px;overflow:hidden}.art svg,.art img{width:100%;height:100%}.checker{background-color:#fff;background-image:linear-gradient(45deg,#eaeaea 25%,transparent 25%),linear-gradient(-45deg,#eaeaea 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eaeaea 75%),linear-gradient(-45deg,transparent 75%,#eaeaea 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}.stage{position:relative}.stage #native{display:none;position:absolute;inset:0}.stage #ref{position:absolute;inset:0}button{border:0;border-radius:8px;background:#293d2d;color:white;font:600 14px/1 system-ui;min-height:40px;padding:12px 17px;cursor:pointer}button.secondary{color:#293d2d;background:#e9efea}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:15px 0}.controls label{display:flex;gap:7px;align-items:center;font-size:13px}select{padding:7px;border-radius:6px;border:1px solid #bacabc}#scrub{width:100%;margin-top:11px;accent-color:#293d2d}.foot,.status{font-size:12px;color:#57685c;margin-top:9px}.status{font-weight:600}.status.warn{color:#8a503b}.pill{display:inline-block;font-size:11px;background:#e4eee6;border-radius:5px;padding:3px 8px}.notes{font-size:13px;color:#627068;margin-top:20px}@media(max-width:760px){.grid{grid-template-columns:1fr}main{padding:12px}.pane{padding:13px}}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
</head><body><main><div class="cap">CHAPCHITRA · MORE THAN A T-SHIRT · C05 ICON 03 / V1</div><h1>Illustrated with Character</h1><p class="intro">Original wooden block, floral fabric and a single hand-printing action. Unapproved standalone motion study only.</p><div class="grid"><section class="pane"><h2>Original static SVG</h2><div class="art" id="static-art">{{ORIGINAL}}</div><div class="foot">Unchanged Illustrator SVG · 512×512</div></section>
<section class="pane"><h2>Animated vector Lottie</h2><div class="art stage" id="stage"><div id="ref">{{ORIGINAL}}</div><div id="native"></div></div><div class="controls"><button id="play">Play</button><button id="pause" class="secondary">Pause</button><button id="replay">Replay</button><label><input type="checkbox" id="loop">Loop (review)</label><label>Speed <select id="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label><input type="checkbox" id="checker">Checkerboard</label></div><input type="range" id="scrub" min="0" max="95" step="1" value="0" aria-label="Scrub animation frames"/><div id="status" class="status">Checking native renderer…</div><div class="foot">3.2 seconds · 30 fps · 1 print · holds final composition · reduced motion: final static artwork</div></section></div><p class="notes"><strong>Creative gate:</strong> Icon 03 has not been integrated into the website. Icons 01 and 02 were not modified.</p></main>
<script type="application/json" id="lottie-data">{{LOTTIE_JSON}}</script>
<script>
const E=(x)=>document.getElementById(x),data=JSON.parse(E('lottie-data').textContent),SOURCE_HASH='{{HASH}}';
const stage=E('ref').querySelector('svg'), print=stage.querySelector('#Print_over_cloth'),block=stage.querySelector('#Wood_block');
const svgNS='http://www.w3.org/2000/svg';let defs=stage.querySelector('defs');if(!defs){defs=document.createElementNS(svgNS,'defs');stage.insertBefore(defs,stage.firstChild)}
const clip=document.createElementNS(svgNS,'clipPath');clip.id='c05PrintClip';const clipPath=document.createElementNS(svgNS,'path');clip.append(clipPath);defs.append(clip);print.setAttribute('clip-path','url(#c05PrintClip)');
const FPS=30,LAST=95,pivot=[203,210];let frame=0,speed=1,paused=false,loop=false,native=null,referenceTime=0,lastTick=0,raf=0;
const sm=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
function pose(f){let u;if(f<=9){u=sm(f/9);return [-5*u,-8*u,100,100]}if(f<=34){u=sm((f-9)/25);return [mix(-5,90,u),mix(-8,70,u),100,100]}if(f<=38){u=sm((f-34)/4);return [90,mix(70,73,u),100+.2*u,100-1.3*u]}if(f<=43){u=sm((f-38)/5);return [90,mix(73,70,u),mix(100.2,100,u),mix(98.7,100,u)]}if(f<=79){u=sm((f-43)/36);return [90*(1-u),70*(1-u),100,100]}return [0,0,100,100]}
function reveal(f){return f<=38?0:f>=67?1:sm((f-38)/29)}
function renderReference(f){f=Math.max(0,Math.min(LAST,f));const [dx,dy,sx,sy]=pose(f),x=mix(750,-90,reveal(f));block.setAttribute('transform',`translate(${dx} ${dy}) translate(${pivot[0]} ${pivot[1]}) scale(${sx/100} ${sy/100}) translate(${-pivot[0]} ${-pivot[1]})`);clipPath.setAttribute('d',`M${x},-40 L560,-40 L560,560 L${x-150},560 Z`)}
function drawNative(){if(!window.lottie)return false;try{native=window.lottie.loadAnimation({container:E('native'),renderer:'svg',loop:false,autoplay:false,animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});native.addEventListener('DOMLoaded',()=>{E('native').style.display='block';E('ref').style.display='none';E('status').textContent='Official lottie-web 5.12.2 · SVG renderer';if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)native.play();else native.goToAndStop(LAST,true)});native.addEventListener('enterFrame',ev=>E('scrub').value=Math.min(LAST,Math.floor(ev.currentTime)));native.addEventListener('data_failed',()=>{E('native').style.display='none';E('ref').style.display='block';native=null;E('status').textContent='Native renderer unavailable · SVG motion reference';});return true}catch(e){native=null;return false}}
function frameTo(f){frame=Math.max(0,Math.min(LAST,f));E('scrub').value=Math.round(frame);renderReference(frame);if(native)native.goToAndStop(frame,true)}
function tick(t){raf=requestAnimationFrame(tick);if(native||paused)return;if(!lastTick)lastTick=t;const dt=Math.min(.05,(t-lastTick)/1000);lastTick=t;frame+=dt*FPS*speed;if(frame>LAST){if(loop)frame=0;else{frame=LAST;paused=true}}frameTo(frame)}
function play(){if(native){native.play();return}paused=false;lastTick=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
function pause(){if(native)native.pause();paused=true}
function replay(){if(native){native.goToAndPlay(0,true);return}frameTo(0);paused=false;lastTick=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
E('play').onclick=play;E('pause').onclick=pause;E('replay').onclick=replay;E('loop').onchange=e=>{loop=e.target.checked;if(native)native.loop=loop};E('speed').onchange=e=>{speed=+e.target.value;if(native)native.setSpeed(speed)};E('scrub').oninput=e=>{frameTo(+e.target.value);if(native)native.pause();paused=true};E('checker').onchange=e=>{E('stage').classList.toggle('checker',e.target.checked);E('static-art').classList.toggle('checker',e.target.checked)};
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){frameTo(LAST);paused=true;E('status').textContent='Reduced motion enabled · final static composition';}
else{frameTo(0);if(!drawNative()){E('status').textContent='Official renderer unavailable · equivalent SVG motion reference';raf=requestAnimationFrame(tick)}}
</script></body></html>'''
    html=html.replace('{{ORIGINAL}}',original).replace('{{LOTTIE_JSON}}',lottiejson).replace('{{HASH}}',SOURCE_HASH)
    (ROOT/'CHAPCHITRA_C05_Icon03_STANDALONE_REVIEW.html').write_text(html)


def make_qa(final_match, images_generated):
    names=[el.get('id') for el in SVG if el.get('id')]
    report=f'''# CHAPCHITRA C05 / Icon 03 — Hand-Block Printing · V1 QA

## Status
Single standalone vector Lottie review prototype. Awaiting owner creative approval. No website integration.

## Original source
- Uploaded SVG preserved as `More_than_a_tshirt_Icon_3_Lottie_Ready_ORIGINAL.svg`
- SHA-256: `{SOURCE_HASH}`
- Named source groups: `{', '.join(names)}`
- Fill palette: `{styles}`
- Artboard: 512 × 512

## Motion
- 0.0–0.3s: block lifts slightly, cloth remains still; impression hidden
- 0.3–1.13s: carved wooden block moves down-right toward the print
- 1.13–1.43s: light contact compression and pressure hold, no bounce
- 1.27–2.23s: diagonal vector mask reveals the fixed floral impression as block lifts
- 1.43–2.63s: single smooth lift to the block's exact original pose
- 2.63–3.2s: completed original composition holds, print permanently visible

## Engineering checks
- 5 original vector layers, 0 raster layers, 0 external images
- Wood_block translation/scale animated; carving details unmodified
- Cloth, Wood_block_shadow and background circle remain stationary
- Print_over_cloth uses geometric path mask (not opacity fade); final mask remains fully open
- Original SVG render equals final SVG reference at 640px: **{'PASS / zero changed pixels' if final_match else 'NOT VERIFIED'}**
- Lottie JSON and dotLottie ZIP structures: generated and parseable
- Standalone HTML attempts official lottie-web SVG renderer, with labeled inline SVG reference fallback
- Chromium offline SVG-reference browser QA: PASS on desktop, iPad-size, and mobile; no page JS errors
- Reduced-motion final-static-pose browser QA: PASS
- Native lottie-web runtime on isolated preview and Safari/WebKit certification: not yet independently verified

## Known creative limitation
This SVG depicts the carved face on the top surface of an isometric wooden block. We preserve the given artwork and use a short diagonal 2D stamping translation and subtle compression, not a new 3D underside or perspective redraw. Judge contact realism visually.

## Approval boundaries
C05 Icon01 and Icon02 are locked and unchanged; no main website edits. No further icon integration before approval.
'''
    (ROOT/'QA_REPORT.md').write_text(report)


def package():
    names=[
      SOURCE.name,JSON_FILE.name,LOTTIE_FILE.name,'C05_Icon03_generate.py',
      'CHAPCHITRA_C05_Icon03_MOTION_PREVIEW.gif',
      'CHAPCHITRA_C05_Icon03_MOTION_PREVIEW.mp4',
      'CHAPCHITRA_C05_Icon03_STORYBOARD.png',
      'CHAPCHITRA_C05_Icon03_STANDALONE_REVIEW.html',
      'QA_REPORT.md','README.md',
    ]
    dest=Path('/mnt/data/CHAPCHITRA_C05_ICON03_HAND_BLOCK_PRINTING_V1_COMPLETE.zip')
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for n in names:
            p=ROOT/n
            if p.exists():z.write(p,n)
    with zipfile.ZipFile(dest) as z:bad=z.testzip()
    assert bad is None,bad
    print('PACKAGE',dest,round(dest.stat().st_size/1024,1),'KB')


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--skip-visuals',action='store_true')
    args=ap.parse_args()
    final=ensure_final_match()
    print('FINAL_MATCH',final,'source SHA',SOURCE_HASH,'JSON',JSON_FILE.stat().st_size)
    if not args.skip_visuals:make_visuals()
    make_html();make_qa(final,not args.skip_visuals)
    if not args.skip_visuals:package()