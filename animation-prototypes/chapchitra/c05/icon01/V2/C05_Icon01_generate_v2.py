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
W=H=512; FPS=30; END=135; DUR=END/FPS
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


# C05 Icon 01 — storybook choreography correction (V2)
# The user's source SVG is the FINAL pose; 0f is a derived concealed start pose.
# Original five Illustrator groups are retained as source and only new vector leaf face is derived.

END=135; FPS=30; DUR=4.5
PIV_T=[326,155]
LEAF_END=36

def smooth(q):
    q=max(0.,min(1.,float(q)))
    return q*q*(3.-2.*q)

def between(t,a,b):return smooth((t-a)/(b-a))

def mix(a,b,u):return a+(b-a)*u

# Physical page-face geometry: eight matching curved nodes, derived from the left page footprint.
# This is the reverse of a turning leaf; the detailed source page remains geometrically unchanged.
LEAF_POSES={
0:[[184,401],[181,392],[187,365],[195,340],[210,306],[233,277],[243,280],[214,336]],
6:[[184,401],[161,384],[134,352],[128,309],[158,243],[188,246],[243,280],[224,338]],
13:[[184,401],[130,378],[105,350],[123,288],[158,226],[206,247],[243,280],[233,341]],
20:[[184,401],[180,387],[205,360],[236,307],[264,244],[292,262],[243,280],[229,345]],
28:[[184,401],[211,385],[258,352],[293,312],[311,271],[288,280],[243,280],[225,343]],
35:[[184,401],[188,394],[201,362],[216,325],[239,283],[241,282],[243,280],[218,338]],
135:[[184,401],[188,394],[201,362],[216,325],[239,283],[241,282],[243,280],[218,338]],
}

def interpolate_poses(f):
    keys=sorted(LEAF_POSES)
    for a,b in zip(keys,keys[1:]):
        if f<=a:return deepcopy(LEAF_POSES[a])
        if f<=b:
            u=between(f,a,b)
            return [[mix(v1[0],v2[0],u),mix(v1[1],v2[1],u)] for v1,v2 in zip(LEAF_POSES[a],LEAF_POSES[b])]
    return deepcopy(LEAF_POSES[keys[-1]])

def curved_leaf_shape(points):
    # Smooth, rounded page contour instead of any triangle/linear corner interpolation.
    verts=[]; ins=[]; outs=[]
    for i,p in enumerate(points):
        prev=points[(i-1)%len(points)]; nxt=points[(i+1)%len(points)]
        dx=(nxt[0]-prev[0])*.19; dy=(nxt[1]-prev[1])*.19
        verts.append(rv(p)); ins.append(rv([-dx,-dy])); outs.append(rv([dx,dy]))
    return {'c':True,'v':verts,'i':ins,'o':outs}

def closed_svg_path(shape):
    v=shape['v']; ink=shape['i'];out=shape['o'];z=[f'M{v[0][0]:.3f},{v[0][1]:.3f}']
    for j in range(1,len(v)+1):
        i=j%len(v); prev=(j-1)%len(v)
        a=[v[prev][k]+out[prev][k] for k in (0,1)];b=[v[i][k]+ink[i][k] for k in (0,1)]
        z.append(f'C{a[0]:.3f},{a[1]:.3f} {b[0]:.3f},{b[1]:.3f} {v[i][0]:.3f},{v[i][1]:.3f}')
    z.append('Z');return ' '.join(z)

def leaf_op(f):
    if f<0:return 0
    if f<=5:return between(f,0,5)*100
    if f<=22:return 100
    if f<=30:return (1-between(f,22,30))*100
    return 0

def shirt_motion(f):
    # returns p, uniform scale percent, rotation degrees, opacity percent
    if f<=29: return ([169.0,322.0],31.0,-7.0,0.)
    if f<=60:
        u=between(f,29,60)
        # Curved rising launch: starts behind the left page, not above it.
        x=mix(169,274,u) - 13*math.sin(math.pi*u)
        y=mix(322,155,u) - 12*math.sin(math.pi*u)
        s=mix(31,91,u)
        op=100*between(f,30,46)
        return ([x,y],s,mix(-7,-3,u),op)
    if f<=111:
        u=between(f,60,111)
        theta=math.pi+(5*math.pi/3)*u
        x=326+52*math.cos(theta)
        y=155+41*math.sin(theta)
        s=91+5*math.sin(math.pi*u)+1.2*math.sin(2*math.pi*u)
        rot=-3+5*math.sin(2*math.pi*u)
        return ([x,y],s,rot,100.)
    u=between(f,111,135)
    theta=math.pi+5*math.pi/3
    x0=326+52*math.cos(theta);y0=155+41*math.sin(theta)
    s0=91
    r0=-3
    return ([mix(x0,326,u),mix(y0,155,u)],mix(s0,100,u),mix(r0,0,u),100.)

# Per-frame native Lottie keyframes yield the same geometry in the SVG visual fallback;
# using exact samples prevents t-shirt teleportation or sharp tangent jumps.
TSHIRT_POS=[(f,shirt_motion(f)[0]) for f in range(0,END+1)]
TSHIRT_SCALE=[(f,[shirt_motion(f)[1]]*2) for f in range(0,END+1)]
TSHIRT_ROT=[(f,shirt_motion(f)[2]) for f in range(0,END+1)]
TSHIRT_OP=[(f,shirt_motion(f)[3]) for f in range(0,END+1)]
PAGE_OP=[(f,leaf_op(f)) for f in range(0,END+1)]
LEAF_SHAPES=[(f,curved_leaf_shape(interpolate_poses(f))) for f in range(0,END+1)]

def keyed_shapes(shapes):
    # Lottie shape path animation; one geometrically compatible vector path at every keyframe.
    arr=[]
    for i,(t,v) in enumerate(shapes):
        k={'t':t,'s':[v]}
        if i<len(shapes)-1:
            k['e']=[shapes[i+1][1]];k['i']={'x':.667,'y':.667};k['o']={'x':.333,'y':.333}
        arr.append(k)
    return {'a':1,'k':arr}


def create_page_leaf():
    return {'ddd':0,'ind':1,'ty':4,'nm':'ANIMATED_PAGE_REVERSE_FACE / curved vector morph','sr':1,
       'ks':{'o':kf(PAGE_OP,linear=True),'r':static(0),'p':static([0,0,0]),'a':static([0,0,0]),'s':static([100,100,100])},
       'ao':0,'shapes':[{'ty':'gr','nm':'Derived gently-curving page backside','it':[
           {'ty':'sh','nm':'Continuous page curl shape','ks':keyed_shapes(LEAF_SHAPES)},
           {'ty':'fl','nm':'Original matching paper color','c':static([246/255,247/255,245/255]),'o':static(100),'r':1},
           {'ty':'st','nm':'Book ink edge','c':static([23/255,36/255,25/255]),'o':static(100),'w':static(2.9),'lc':2,'lj':2,'ml':4},
           {'ty':'tr','nm':'Group identity','a':static([0,0]),'p':static([0,0]),'s':static([100,100]),'r':static(0),'o':static(100),'sk':static(0),'sa':static(0)}]}],
       'ip':0,'op':END,'st':0,'bm':0}


def vector_layer(name,grp,ind,anchor=(0,0),pos=None,sc=None,rot=None,opacity=None):
    a=list(anchor);p=pos if pos is not None else [(0,a)]
    return {'ddd':0,'ind':ind,'ty':4,'nm':name,'sr':1,
            'ks':{'o':kf(opacity or [(0,100)],linear=True),'r':kf(rot or [(0,0)],linear=True),
                  'p':kf([(t,[*val,0]) for t,val in p],linear=True),
                  'a':static([*a,0]),'s':kf([(t,[*val,100]) for t,val in (sc or [(0,[100,100])])],linear=True)},
            'ao':0,'shapes':extract_group(grp),'ip':0,'op':END,'st':0,'bm':0}

LAYERS=[
 create_page_leaf(),
 vector_layer('Left_page / original stationary',fgroup('Left_page'),2),
 vector_layer('Right_page / original stationary',fgroup('Right_page'),3),
 vector_layer('Book_Base / original stationary',fgroup('Book_Base'),4),
 vector_layer('Tshirt / concealed emergence and floating arc',fgroup('Tshirt'),5,PIV_T,TSHIRT_POS,TSHIRT_SCALE,TSHIRT_ROT,TSHIRT_OP),
 vector_layer('Icon_circle / original stationary',fgroup('Icon_circle'),6)
]
DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':END,'w':W,'h':H,'nm':'CHAPCHITRA C05 Icon 01 / Stories You Can Wear / Choreography V2',
      'ddd':0,'assets':[],'layers':LAYERS,'markers':[],
      'meta':{'generator':'CHAPCHITRA native SVG vector-to-Lottie motion generator',
              'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'notes':'C05 standalone revision. Source SVG is final pose, start has concealed tee. 5 original source groups + 1 derived curved leaf face, no image assets.'}}
JSON_PATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V2.json'
JSON_PATH.write_text(json.dumps(DATA,separators=(',',':')),encoding='utf8')
LOTTIE_PATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V2.lottie'
manifest={'version':'1','generator':'CHAPCHITRA vector motion engineering','description':'C05 Icon 01 original illustrated storybook with curved page turn and floating cat T-shirt',
          'activeAnimationId':'c05_icon01_storybook_v2','animations':[{'id':'c05_icon01_storybook_v2','autoplay':True,'loop':False,'speed':1,'direction':1}]}
with zipfile.ZipFile(LOTTIE_PATH,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json',json.dumps(manifest,separators=(',',':')))
    z.writestr('animations/c05_icon01_storybook_v2.json',json.dumps(DATA,separators=(',',':')))


def svg_frame(f):
    root=deepcopy(SVG)
    g=lambda n:root.xpath(f"./s:g[@id='{n}']",namespaces=NS)[0]
    pos,sc,rot,opacity=shirt_motion(f)
    g('Tshirt').set('transform',f'translate({pos[0]:.5f} {pos[1]:.5f}) rotate({rot:.5f}) scale({sc/100:.5f}) translate({-PIV_T[0]} {-PIV_T[1]})')
    g('Tshirt').set('opacity',f'{opacity/100:.5f}')
    leaf=etree.SubElement(root,f'{{{SVGNS}}}path',id='C05_ANIMATED_PAGE_REVERSE_FACE')
    leaf.set('d',closed_svg_path(curved_leaf_shape(interpolate_poses(f))))
    leaf.set('style',f'fill:#f6f7f5;stroke:#172419;stroke-width:2.9;stroke-linejoin:round;stroke-linecap:round;opacity:{leaf_op(f)/100:.5f}')
    return etree.tostring(root)

def render_frame(f,size=640):
    rgba=cairosvg.svg2png(bytestring=svg_frame(f),output_width=size,output_height=size)
    return Image.open(io.BytesIO(rgba)).convert('RGBA')

if __name__=='__main__':
    # source/final pose identity is a release gate; animation frame0 deliberately differs.
    assert shirt_motion(0)[3]==0
    assert shirt_motion(135)==([326.,155.],100.,0.,100.)
    orig=Image.open(io.BytesIO(cairosvg.svg2png(url=str(SOURCE),output_width=640,output_height=640))).convert('RGBA')
    final=render_frame(END)
    import numpy as np
    diff=np.abs(np.array(orig).astype(int)-np.array(final).astype(int))
    nchange=int(np.any(diff!=0,axis=2).sum()); maxerr=int(diff.max())
    print('final/source diff',nchange,'max channel',maxerr)
    if nchange>100:print('warning: final alignment differs: inspect')
    from PIL import ImageDraw
    storyframes=[0,12,24,30,42,57,74,90,108,119,135]
    ww=340;pad=12;titleh=30; cols=4;rows=math.ceil(len(storyframes)/cols)
    board=Image.new('RGB',(cols*(ww+pad)+pad,rows*(ww+titleh+pad)+pad),'#ffffff');dr=ImageDraw.Draw(board)
    for i,f in enumerate(storyframes):
        im=render_frame(f,ww);bg=Image.new('RGBA',(ww,ww),'white');bg.alpha_composite(im)
        x=pad+(i%cols)*(ww+pad);y=pad+(i//cols)*(ww+titleh+pad)
        board.paste(bg.convert('RGB'),(x,y));dr.text((x+6,y+ww+5),f'{f/FPS:.2f}s — {"concealed" if f==0 else ("page turn" if f<30 else ("emerge" if f<60 else ("float" if f<111 else "settle")))}',fill='#293D2D')
    board.save(OUT/'CHAPCHITRA_C05_Icon01_V2_STORYBOARD.png')
    # Animated GIF: same frame-by-frame SVG source motion; NOT an official Lottie render.
    frames=[render_frame(f,512) for f in range(0,END+1,2)]
    frames[0].save(OUT/'CHAPCHITRA_C05_Icon01_V2_MOTION_REVIEW.gif',save_all=True,append_images=frames[1:],duration=round(2000/FPS),loop=0,optimize=True,disposal=2)
    # MP4 reference (same SVG motion, on white background)
    mp4=OUT/'CHAPCHITRA_C05_Icon01_V2_MOTION_REVIEW.mp4';ff=shutil.which('ffmpeg')
    if ff:
        proc=subprocess.Popen([ff,'-y','-f','image2pipe','-vcodec','png','-framerate',str(FPS),'-i','-','-vf','format=yuv420p',str(mp4)],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        try:
            for i in range(END+1):
                im=render_frame(i,512);bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im)
                z=io.BytesIO();bg.convert('RGB').save(z,format='PNG');proc.stdin.write(z.getvalue())
            proc.stdin.close();errs=proc.stderr.read();proc.wait(timeout=60)
            print('ffmpeg',proc.returncode,errs.decode(errors='replace')[-120:])
        except Exception as err:print('ffmpeg error',err);proc.kill()
    (OUT/'QA_METRICS.json').write_text(json.dumps({'source_sha256':DATA['meta']['source_sha256'],'fps':FPS,'frames':END,'duration_s':DUR,
      'first_frame_tee_concealed':True,'last_frame_reference_changed_pixels_640px':nchange,'last_frame_reference_max_channel_delta':maxerr,
      'vector_layers':len(LAYERS),'raster_assets':len(DATA['assets']),'experimental_page_face':'bezier morph overlay'},indent=2))
    print('ready',JSON_PATH,LOTTIE_PATH)