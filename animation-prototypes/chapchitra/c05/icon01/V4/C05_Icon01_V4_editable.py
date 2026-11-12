#!/usr/bin/env python3
"""Isolated CHAPCHITRA C05 Icon 01 Lottie prototype — source SVG preserved."""
import io, re, json, hashlib, zipfile, math, subprocess, html, shutil
from copy import deepcopy
from pathlib import Path
from lxml import etree
from PIL import Image, ImageDraw, ImageFont, ImageChops
import cairosvg

ROOT=Path(__file__).resolve().parent
OUT=ROOT
OUT.mkdir(exist_ok=True)
SOURCE=ROOT/'More_than_a_tshirt_Icon_1_named_ORIGINAL.svg'

MASTER=OUT/'More_than_a_tshirt_Icon_1_named_ORIGINAL.svg'
# Original SVG is read-only and preserved unchanged
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
assert styles=={'st0':'#293d2d','st1':'#172419','st2':'#e4e3de','st3':'#f6f7f5'},styles

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
# All revised source groups are intentionally preserved by name; inactive duplicate page copies are excluded at runtime.




FPS=30; END=150; DUR=END/FPS
# Exact shirt trajectory and timing are preserved from the approved V3.
# The approved Gallery White is already present on the new T-shirt fabric (st3),
# so NO recoloring is performed in this revision.
INK='#172419'; PAPER='#f6f7f5'; CREAM='#e4e3de'
SPINE_BOTTOM=(184.5,400.9);SPINE_TOP=(238.2,277.0)
AX=(SPINE_TOP[0]-SPINE_BOTTOM[0],SPINE_TOP[1]-SPINE_BOTTOM[1])
AXLEN=math.hypot(*AX); AX=(AX[0]/AXLEN,AX[1]/AXLEN)
NX=(-AX[1],AX[0]); NY=AX
SHEET_NAMES=[
 ('Turning_x5F_Page_x5F_Front_x5F_1','Turning_x5F_Page_x5F_Back_x5F_1'),
 ('Turning_x5F_Page_x5F_Front_x5F_2','Turning_x5F_Page_x5F_Back_x5F_2'),
 ('Right_x5F_Page_x5F_Front','Right_x5F_Page_x5F_Back')
]
PAGE_TIMES=[(0,21),(19,41),(39,61)]

def smooth(q):
    u=max(0.,min(1.,float(q)))
    return u*u*(3-2*u)
def lerp(a,b,u):return a+(b-a)*u

def between(f,a,b):return smooth((f-a)/(b-a))

# *** Locked V3 T-shirt movement: DO NOT MODIFY ***
def shirt(f):
    # p, uniform scale, rotation, opacity
    # T-shirt begins inside *black illustrated block* on left leaf, not behind book.
    if f<=60:return [174.,290.],19.,-8.,0.
    if f<=66:
        u=between(f,60,66)
        return [174.,290.-2*u],lerp(19,25,u),lerp(-8,-7,u),60*u
    if f<=93:
        u=between(f,66,93)
        return ([lerp(174,246,u)-4*math.sin(math.pi*u),
                 lerp(288,192,u)-9*math.sin(math.pi*u)],
                lerp(25,80,u),lerp(-7,-3,u),lerp(60,100,u))
    if f<=135:
        u=between(f,93,135)
        q=1-u
        x=q*q*q*246+3*q*q*u*266+3*q*u*u*314+u*u*u*326
        y=q*q*q*192+3*q*q*u*160+3*q*u*u*130+u*u*u*150
        return [x,y],80+21*u,-3+5*math.sin(math.pi*u/2),100.
    u=between(f,135,150)
    return [326.,lerp(150,155,u)],lerp(101,100,u),lerp(2,0,u),100.

def mask_rect_screen(f):
    if f<=60:return (123.,236.,229.,345.)
    u=between(f,60,91)
    return (lerp(123,-50,u),lerp(236,-50,u),lerp(229,570,u),lerp(345,570,u))

def invert_point(x,y,pos,sc,rot):
    a=math.radians(rot);c=math.cos(a);s=math.sin(a)
    dx=(x-pos[0])/(sc/100);dy=(y-pos[1])/(sc/100)
    return rv([326+c*dx+s*dy,155-s*dx+c*dy])

def mask_shape(f):
    x0,y0,x1,y1=mask_rect_screen(f);p,sc,rot,_=shirt(f)
    return {'c':True,'v':[invert_point(*pt,p,sc,rot) for pt in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]],
            'i':[[0,0]]*4,'o':[[0,0]]*4}

# --- New V4 page physics, driven by user's genuine front/back vector pairs ---
def angle_u(f,index):
    start,end=PAGE_TIMES[index]
    return smooth((f-start)/(end-start))

def face_angle(f,index):return math.pi*angle_u(f,index)

def warp_xy(x,y,angle,face):
    # Unfold in the diagonal plane of the source book. Front paths are supplied
    # on the right, back paths on the left. Both fold into the same spine line at 90°.
    dx=x-SPINE_BOTTOM[0];dy=y-SPINE_BOTTOM[1]
    along=dx*AX[0]+dy*AX[1]
    across=dx*NX[0]+dy*NX[1]
    factor=math.cos(angle) if face=='front' else -math.cos(angle)
    # Nonlinear projected bulge: keeps the drawn page curved, never triangular.
    rel=min(1.4,abs(across)/152)
    bow=8.5*(math.sin(angle)**2)*(rel**1.2)
    curl=4.5*math.sin(angle)*rel*(1-rel/1.7)
    nx=SPINE_BOTTOM[0]+AX[0]*(along-curl)+NX[0]*(across*factor+bow)
    ny=SPINE_BOTTOM[1]+AX[1]*(along-curl)+NX[1]*(across*factor+bow)-13*abs(math.sin(angle))*rel
    return nx,ny

def warp_shape(original,angle,face):
    # All control points are independently warped. Path topology and path styles
    # remain identical to the user's supplied illustration for each face.
    v=[];ii=[];oo=[]
    for p,iv,ov in zip(original['v'],original['i'],original['o']):
        pv=warp_xy(*p,angle,face)
        pin=warp_xy(p[0]+iv[0],p[1]+iv[1],angle,face)
        pout=warp_xy(p[0]+ov[0],p[1]+ov[1],angle,face)
        v.append(rv(pv));ii.append(rv([pin[0]-pv[0],pin[1]-pv[1]]));oo.append(rv([pout[0]-pv[0],pout[1]-pv[1]]))
    return {'c':original['c'],'v':v,'i':ii,'o':oo}

def shape_path(shape):
    v=shape['v'];ii=shape['i'];oo=shape['o'];s=[f'M{v[0][0]},{v[0][1]}']
    for i in range(1,len(v)):
        a=[v[i-1][j]+oo[i-1][j] for j in (0,1)]
        b=[v[i][j]+ii[i][j] for j in (0,1)]
        s.append(f'C{a[0]},{a[1]} {b[0]},{b[1]} {v[i][0]},{v[i][1]}')
    if shape['c']:
        i=0;j=len(v)-1
        a=[v[j][k]+oo[j][k] for k in (0,1)]
        b=[v[i][k]+ii[i][k] for k in (0,1)]
        s.append(f'C{a[0]},{a[1]} {b[0]},{b[1]} {v[0][0]},{v[0][1]}Z')
    return ' '.join(s)

def sample_times(index,face):
    s,e=PAGE_TIMES[index];mid=(s+e)//2
    if face=='front':frames=list(range(s,mid+1,2))+[mid]
    else:frames=[mid]+list(range(mid+1,e+1,2))+[e]
    return sorted(set(frames))

def shape_keys(samples):
    out=[]
    for i,(f,shape) in enumerate(samples):
        d={'t':f,'s':[shape]}
        if i<len(samples)-1:
            d['e']=[samples[i+1][1]]
            d['i']={'x':.667,'y':.667};d['o']={'x':.333,'y':.333}
        out.append(d)
    return {'a':1,'k':out}

def tr():return {'ty':'tr','nm':'Identity','a':static([0,0]),'p':static([0,0]),'s':static([100,100]),'r':static(0),'o':static(100),'sk':static(0),'sa':static(0)}

def warp_lottie_group(grp,index,face):
    shapes=extract_group(grp)
    frames=sample_times(index,face)
    angles=[(f,face_angle(f,index)) for f in frames]
    def process(ob):
        if isinstance(ob,dict):
            if ob.get('ty')=='sh':
                orig=ob['ks']['k']
                ob['ks']=shape_keys([(f,warp_shape(orig,ang,face)) for f,ang in angles])
            for v in ob.values():process(v)
        elif isinstance(ob,list):
            for item in ob:process(item)
    process(shapes)
    return shapes

def sheet_layer(index,face,idx):
    group=fgroup(SHEET_NAMES[index][0 if face=='front' else 1])
    st,en=PAGE_TIMES[index];mid=(st+en)//2
    ip=st if face=='front' else mid+1
    op=mid+1 if face=='front' else en+1
    return {'ddd':0,'ind':idx,'ty':4,'nm':f'SHEET {index+1} {face.upper()} / exact user SVG artwork / opaque',
      'sr':1,'ks':{'o':static(100),'r':static(0),'p':static([0,0,0]),
      'a':static([0,0,0]),'s':static([100,100,100])},
      'ao':0,'shapes':warp_lottie_group(group,index,face),
      'ip':ip,'op':op,'st':0,'bm':0}

def vector_layer(name,grp,idx,tee=False):
    lay={'ddd':0,'ind':idx,'ty':4,'nm':name,'sr':1,
         'ks':{'o':static(100),'r':static(0),'p':static([0,0,0]),'a':static([0,0,0]),'s':static([100,100,100])},
         'ao':0,'shapes':extract_group(grp),'ip':0,'op':END+1,'st':0,'bm':0}
    if tee:
        lay['ks']={'o':kf([(f,shirt(f)[3]) for f in range(END+1)],linear=True),
            'r':kf([(f,shirt(f)[2]) for f in range(END+1)],linear=True),
            'p':kf([(f,[*shirt(f)[0],0]) for f in range(END+1)],linear=True),
            'a':static([326,155,0]),
            's':kf([(f,[shirt(f)[1],shirt(f)[1],100]) for f in range(END+1)],linear=True)}
        lay['hasMask']=True
        lay['masksProperties']=[{'inv':False,'mode':'a',
            'pt':shape_keys([(f,mask_shape(f)) for f in range(END+1)]),
            'o':static(100),'x':static(0),'nm':'Approved V3 black-print emergence mask unchanged'}]
    return lay

# A stationary left-page overlay is clipped open only after crossing. This
# does NOT fade any turning sheet; the opaque back passes behind its static page.
def left_overlay_mask_shape(f,index):
    # Show cover underneath flipping leaf through 0..61. At 61–66 the back
    # moves under the fixed left page, allowing the printed black rectangle
    # to anchor the unchanged T-shirt launch at 2.0 seconds.
    st=PAGE_TIMES[index][1]-5;en=PAGE_TIMES[index][1]+2
    t=between(f,st,en)
    right=lerp(0,270,t)
    return {'c':True,'v':rv2([[0,0],[right,0],[right,512],[0,512]]),
            'i':[[0,0]]*4,'o':[[0,0]]*4}

# Source's Black_Illustration is nested inside Left_page, and is NOT redrawn.
LEFT=fgroup('Left_page')
TEE=fgroup('Tshirt')
BASE=fgroup('Book_Base')
SPINE=SVG.xpath('.//s:path[@id="Spine_x5F_Foreground"]',namespaces=NS)[0]
spine_grp=etree.Element(f'{{{SVGNS}}}g',id='Spine_x5F_Foreground_overlay')
spine_grp.append(deepcopy(SPINE))

# Order is top-to-bottom, as Lottie expects.
LAYERS=[]
def push(lay):
    lay['ind']=len(LAYERS)+1;LAYERS.append(lay)

push(vector_layer('Tshirt / approved V3 movement EXACT',TEE,1,tee=True))
push(vector_layer('Spine_x5F_Foreground / above page turns',spine_grp,2))
for i in reversed(range(3)):
    overlay=vector_layer(f'Left_page / stationary landing overlay after sheet {i+1}',LEFT,len(LAYERS)+1)
    overlay['hasMask']=True
    overlay['masksProperties']=[{'inv':False,'mode':'a',
        'pt':shape_keys([(f,left_overlay_mask_shape(f,i)) for f in range(END+1)]),
        'o':static(100),'x':static(0),'nm':f'Opaque page {i+1} lands under stationary left page'}]
    push(overlay)
    push(sheet_layer(i,'back',len(LAYERS)+1))
    push(sheet_layer(i,'front',len(LAYERS)+1))
push(vector_layer('Left_page / STATIC / Black_Illustration unchanged',LEFT,len(LAYERS)+1))
push(vector_layer('Right_x5F_Page_x5F_Underneath / STATIC',fgroup('Right_x5F_Page_x5F_Underneath'),len(LAYERS)+1))
push(vector_layer('Book_Base / STATIC',BASE,len(LAYERS)+1))
push(vector_layer('Icon_circle / STATIC',fgroup('Icon_circle'),len(LAYERS)+1))
DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':END+1,'w':512,'h':512,
      'nm':'CHAPCHITRA C05 Icon 01 / user-layered opaque paper V4',
      'ddd':0,'assets':[],'layers':LAYERS,
      'meta':{'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'producer':'C05 original user layered SVG vector animation',
              'description':'Three opaque right-to-left page turns, paired front/back authored paths, stationary left Black_Illustration and locked V3 shirt motion'}}
JPATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V4.json'
JPATH.write_text(json.dumps(DATA,separators=(',',':')))
LPATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V4.lottie'
with zipfile.ZipFile(LPATH,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json',json.dumps({'version':'1','generator':'C05 Icon 01 isolated layered-paper vector production',
      'activeAnimationId':'c05_icon01_layered_v4','animations':[{'id':'c05_icon01_layered_v4','autoplay':True,'loop':False,'speed':1,'direction':1}]}))
    z.writestr('animations/c05_icon01_layered_v4.json',json.dumps(DATA,separators=(',',':')))

# Standalone SVG reference is generated independently, preserving named group paths.
def svg_frame(f):
    root=deepcopy(SVG)
    ns=NS
    for gid in [gid for pair in SHEET_NAMES for gid in pair]:
        elem=root.xpath(f'./s:g[@id="{gid}"]',namespaces=ns)[0];root.remove(elem)
    # Underlying right side remains stationary; source contains a front/back stack
    # which is suppressed unless the specific sheet is active.
    root.remove(root.xpath('./s:g[@id="Tshirt"]',namespaces=ns)[0])
    source_left=root.xpath('./s:g[@id="Left_page"]',namespaces=ns)[0]
    for index,(st,en) in enumerate(PAGE_TIMES):
        if st<=f<=en:
            face='front' if angle_u(f,index)<=.5 else 'back'
            group=deepcopy(fgroup(SHEET_NAMES[index][0 if face=='front' else 1]))
            angle=face_angle(f,index)
            for path in group.xpath('.//s:path',namespaces=ns):
                orig=path_parse(path.get('d'))
                path.set('d',' '.join(shape_path(warp_shape(sh,angle,face)) for sh in orig))
            root.append(group)
        # The opaque back is gradually covered by the STATIONARY left artwork
        # during landing. The sheet is never faded or removed while exposed.
        if f>=en-5:
            copy_left=deepcopy(source_left)
            copy_left.set('id',f'LEFT_PAGE_STATIONARY_LANDING_{index+1}')
            rect=left_overlay_mask_shape(f,index)['v']
            right=rect[1][0]
            clip_id=f'LEFT_TUCK_CLIP_{index+1}'
            clip=etree.Element(f'{{{SVGNS}}}clipPath',id=clip_id)
            etree.SubElement(clip,f'{{{SVGNS}}}rect',x='0',y='0',width=str(right),height='512')
            defs=etree.Element(f'{{{SVGNS}}}defs');defs.append(clip)
            root.append(defs)
            copy_left.set('clip-path',f'url(#{clip_id})');root.append(copy_left)
    # Duplicate exact source spine path above the turning pages.
    over=deepcopy(spine_grp);root.append(over)
    tee=deepcopy(TEE)
    p,sc,rot,op=shirt(f)
    tee.set('transform',f'translate({p[0]:.6f} {p[1]:.6f}) rotate({rot:.6f}) scale({sc/100:.8f}) translate(-326 -155)')
    tee.set('opacity',f'{op/100:.6f}')
    if op>0:
        x0,y0,x1,y1=mask_rect_screen(f)
        clip=etree.Element(f'{{{SVGNS}}}clipPath',id='TEE_PRINT_CLIP')
        etree.SubElement(clip,f'{{{SVGNS}}}rect',x=str(x0),y=str(y0),width=str(x1-x0),height=str(y1-y0))
        defs=etree.Element(f'{{{SVGNS}}}defs');defs.append(clip);root.append(defs)
        wrapper=etree.Element(f'{{{SVGNS}}}g',id='TEE_EMERGING',attrib={'clip-path':'url(#TEE_PRINT_CLIP)'})
        wrapper.append(tee);root.append(wrapper)
    return etree.tostring(root)

def render(f,size=512):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg_frame(f),output_width=size,output_height=size))).convert('RGBA')

if __name__=='__main__':
    from PIL import ImageChops
    import numpy as np
    print('source SHA256:',hashlib.sha256(SOURCE.read_bytes()).hexdigest())
    print('groups:',[g.get('id') for g in SVG.xpath('./s:g',namespaces=NS)])
    assert len(fgroup("Left_page").xpath(".//s:g[@id='Black_Illustration']",namespaces=NS))==1
    assert len(SHEET_NAMES)==3
    assert len(fgroup('Tshirt').xpath('.//s:path',namespaces=NS)) == 26
    # Approved V3 trajectory checksum, using original generation data.
    assert shirt(0)[3]==0 and shirt(60)[3]==0
    assert shirt(END)==([326.,155.],100.,0.,100.)
    original=Image.open(io.BytesIO(cairosvg.svg2png(url=str(SOURCE),output_width=640,output_height=640))).convert('RGBA')
    finish=render(END,640)
    diff=np.array(original).astype(int)-np.array(finish).astype(int)
    print('raw source vs final visible differ pixels',int(np.any(diff!=0,axis=2).sum()),'max',int(np.abs(diff).max()))
    # Structural native Lottie: absolutely no images/assets/expression frames.
    assert DATA['assets']==[]
    assert all(l['ty']==4 for l in DATA['layers'])
    assert all(l['ks']['o']['k']==100 or l['nm'].startswith('Tshirt') for l in DATA['layers'] if l['ks']['o']['a']==0)
    times=[0,6,12,15,20,25,30,35,40,44,48,53,58,61,65,75,90,108,132,150]
    sw=310;cols=5;rows=math.ceil(len(times)/cols);gap=14
    board=Image.new('RGB',(cols*(sw+gap)+gap,rows*(sw+gap+23)+gap),'white');draw=ImageDraw.Draw(board)
    for j,f in enumerate(times):
        rgba=render(f,sw);bg=Image.new('RGBA',(sw,sw),'white');bg.alpha_composite(rgba)
        x=gap+(j%cols)*(sw+gap);y=gap+(j//cols)*(sw+gap+23)
        board.paste(bg.convert('RGB'),(x,y));draw.text((x+5,y+sw+5),f'{f/FPS:.2f}s / sheet {next((i+1 for i,(s,e) in enumerate(PAGE_TIMES) if s<=f<=e),0)}',fill='#293d2d')
    board.save(OUT/'CHAPCHITRA_C05_Icon01_V4_STORYBOARD.png')
    frames=[render(f,512) for f in range(0,END+1,2)]
    frames[0].save(OUT/'CHAPCHITRA_C05_Icon01_V4_MOTION_REVIEW.gif',save_all=True,
        append_images=frames[1:],duration=round(2000/FPS),loop=0,optimize=True,disposal=2)
    ff=shutil.which('ffmpeg')
    if ff:
        cmd=[ff,'-y','-f','image2pipe','-vcodec','png','-framerate',str(FPS),'-i','-',
             '-vf','format=yuv420p',str(OUT/'CHAPCHITRA_C05_Icon01_V4_MOTION_REVIEW.mp4')]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        for f in range(END+1):
            im=render(f,512);bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im)
            b=io.BytesIO();bg.convert('RGB').save(b,format='PNG');proc.stdin.write(b.getvalue())
        proc.stdin.close();proc.wait(timeout=90)
        print('ffmpeg code',proc.returncode)
    (OUT/'QA_METRICS.json').write_text(json.dumps({
      'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'fps':FPS,'frames':END+1,
      'three_named_sheet_front_back_pairs':SHEET_NAMES,'colors_original':styles,
      'tshirt_motion':'exact V3 unchanged','native_vector_layers':len(LAYERS),'raster_assets':0,
      'page_face_opacity':100,'page_first_second_switch':'physical angle 90 degrees, edge-on',
      'source_raw_final_pixel_diff_640':int(np.any(diff!=0,axis=2).sum()),
      'source_layer_stack_caveat':'source renders inactive back overlays atop printed black left image; prototype suppresses inactive copies to expose Black_Illustration'},indent=2))
    print('V4 built',JPATH.stat().st_size)