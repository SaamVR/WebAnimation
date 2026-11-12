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
SOURCE=ROOT/'More_than_a_tshirt_Icon_1_ORIGINAL.svg'

MASTER=OUT/'More_than_a_tshirt_Icon_1_ORIGINAL.svg'
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



FPS=30; END=150; DUR=END/FPS
INK='#172419'; PAPER='#f6f7f5'; CREAM='#e4e3de'

# Only textile st1 cream shapes get gallery white. Original SVG, book and printed block unchanged.
TEE=deepcopy(fgroup('Tshirt'))
tee_recolored=0
for el in TEE.iter():
    if el.get('class')=='st1':
        el.set('class','st3');tee_recolored+=1
assert tee_recolored==10,tee_recolored

# Three distinct right-to-left page flips. The left illustrated page never transforms.
PAGE_TIMES=[(0,23),(19,42),(38,61)]
# Each page face shares 10 stable Bezier nodes, with a spine-anchored curved profile.
# Coordinates are derived from the existing right-side sheet, in original 512 SVG units.
# The outer edge travels from (340,270) right to left across the book's spine.

def smooth(q):
    u=max(0.,min(1.,float(q)))
    return u*u*(3-2*u)
def lerp(a,b,u):return a+(b-a)*u

def page_points(f,start,end):
    u=max(0.,min(1.,(f-start)/(end-start)))
    # keep actual book spine anchored throughout
    # initial sheet right, then lifted to crown, folded leftwards.
    keys=[
       (0.00,(343,270,317,385,0)),
       (0.20,(328,249,298,371,16)),
       (0.43,(275,224,246,356,30)),
       (0.62,(215,216,195,354,32)),
       (0.83,(153,249,140,370,17)),
       (1.00,(124,287,122,386,0)),
    ]
    # edge x, edge y, bottom edge x, bottom edge y, crown height
    a,b=keys[0],keys[-1]
    for l,r in zip(keys,keys[1:]):
        if u<=r[0]:a,b=l,r;break
    k=smooth((u-a[0])/(b[0]-a[0])) if b[0]>a[0] else 1
    ex,ey,bx,by,crown=[lerp(a[1][j],b[1][j],k) for j in range(5)]
    # 10 vertices, smooth center spine, convex gradual wave across top and bottom edges
    return [
       (184.0,401.0), (190.0,386.0), (216.0,321.0), (238.0,279.0),
       (lerp(238,ex,.47), lerp(279,ey,.47)-crown*.28),
       (ex,ey), (ex+3.0,lerp(ey,by,.52)), (bx,by),
       (lerp(184,bx,.58),lerp(401,by,.77)+crown*.10),
       (197.0,402.0)
    ]

def cshape(pts):
    # separate edge tangent handles for book-like curves, no triangular corners
    v=[];ii=[];oo=[]
    n=len(pts)
    for j,p in enumerate(pts):
        prv=pts[(j-1)%n];nxt=pts[(j+1)%n]
        dx=(nxt[0]-prv[0])*.12;dy=(nxt[1]-prv[1])*.12
        v.append(rv(p));ii.append(rv([-dx,-dy]));oo.append(rv([dx,dy]))
    return {'c':True,'v':v,'i':ii,'o':oo}

def shape_path(shape):
    v=shape['v'];ii=shape['i'];oo=shape['o']
    s=[f'M{v[0][0]:.3f},{v[0][1]:.3f}']
    for j in range(1,len(v)+1):
        i=j%len(v);p=(j-1)%len(v)
        a=(v[p][0]+oo[p][0],v[p][1]+oo[p][1]);b=(v[i][0]+ii[i][0],v[i][1]+ii[i][1]);q=v[i]
        s.append(f'C{a[0]:.3f},{a[1]:.3f} {b[0]:.3f},{b[1]:.3f} {q[0]:.3f},{q[1]:.3f}')
    return ' '.join(s)+' Z'

def page_op(f,start,end):
    if f<start or f>=end:return 0.
    # paper doesn't appear as a white flash: almost invisible at initial pose
    return 100.0 * min(smooth((f-start)/3),smooth((end-f)/4))

def page_shape(f,which):return cshape(page_points(f,*PAGE_TIMES[which]))

def page_draw_strokes(f,which):
    # shallow curved ink lines from the existing storybook design, drawn on moving leaf
    pts=page_points(f,*PAGE_TIMES[which]);outer=pts[5];upper=pts[3];lower=pts[7]
    u=max(0,min(1,(f-PAGE_TIMES[which][0])/(PAGE_TIMES[which][1]-PAGE_TIMES[which][0])))
    lines=[]
    for j in range(3):
        t=.35+.15*j
        x1=lerp(upper[0],outer[0],.25);y1=lerp(upper[1]+25,lower[1]-35,t)
        x2=lerp(upper[0],outer[0],.70);y2=y1-4-8*math.sin(math.pi*u)
        x3=lerp(upper[0],outer[0],.86);y3=y2+1
        lines.append({'c':False,'v':rv2([[x1,y1],[x2,y2],[x3,y3]]),
                      'i':rv2([[0,0],[-(x2-x1)*.13,2],[0,0]]),
                      'o':rv2([[(x2-x1)*.13,-2],[(x3-x2)*.14,-1],[0,0]])})
    return lines

def between(f,a,b):return smooth((f-a)/(b-a))

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
        # single, rising curved arc; no loop / backward detour
        q=1-u
        x=q*q*q*246+3*q*q*u*266+3*q*u*u*314+u*u*u*326
        y=q*q*q*192+3*q*q*u*160+3*q*u*u*130+u*u*u*150
        return [x,y],80+21*u,-3+5*math.sin(math.pi*u/2),100.
    u=between(f,135,150)
    return [326.,lerp(150,155,u)],lerp(101,100,u),lerp(2,0,u),100.

# Screen-space clipping envelope that expands from printed black patch to free air.
# Source printed patch: approx x=121..232, y=237..343. The mask provides visible origin.
def mask_rect_screen(f):
    if f<=60:return (123.,236.,229.,345.)
    u=between(f,60,91)
    return (lerp(123,-50,u),lerp(236,-50,u),lerp(229,570,u),lerp(345,570,u))

def invert_point(x,y,pos,sc,rot):
    # layer-space coords -> mask exact physical world rectangle after Lottie transform
    a=math.radians(rot);c=math.cos(a);s=math.sin(a)
    dx=(x-pos[0])/(sc/100);dy=(y-pos[1])/(sc/100)
    return rv([326+c*dx+s*dy,155-s*dx+c*dy])

def mask_shape(f):
    x0,y0,x1,y1=mask_rect_screen(f);p,sc,rot,_=shirt(f)
    return {'c':True,'v':[invert_point(*pt,p,sc,rot) for pt in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]],
            'i':[[0,0]]*4,'o':[[0,0]]*4}

# Return unmodified source shape and only recolor the *tee's* cream paths in derivative.
# Lottie parent transforms and source path color preserve all line art.
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

def page_layer(which,idx):
    ss=[(f,page_shape(f,which)) for f in range(END+1)]
    # Per-frame shape morphology; 3 distinct passes each retains common spine anchor.
    items=[{'ty':'sh','nm':'Rounded page face morph','ks':keyshapes(ss)},
          {'ty':'fl','nm':'Original matching paper','c':static([246/255,247/255,245/255]),'o':static(100),'r':1},
          {'ty':'st','nm':'Curved paper edge','c':static([23/255,36/255,25/255]),'o':static(100),
           'w':static(1.5),'lc':2,'lj':2,'ml':4}]
    # lighter detail lines as separate shape groups, derived stylistically from existing right page
    for i in range(3):
        kk=keyshapes([(f,page_draw_strokes(f,which)[i]) for f in range(END+1)])
        items.append({'ty':'gr','nm':f'Inset curved ink line {i+1}', 'it':[
            {'ty':'sh','nm':'Ink line','ks':kk},
            {'ty':'st','nm':'Ink line stroke','c':static([23/255,36/255,25/255]),'o':static(90),
             'w':static(1.65),'lc':2,'lj':2,'ml':4},trans()]})
    items.append(trans())
    return {'ddd':0,'ind':idx,'ty':4,'nm':f'RIGHT_PAGE_TURN_{which+1} / derived vector face','sr':1,
       'ks':{'o':kf([(f,page_op(f,*PAGE_TIMES[which])) for f in range(END+1)],linear=True),
             'r':static(0),'p':static([0,0,0]),'a':static([0,0,0]),'s':static([100,100,100])},
       'ao':0,'shapes':[{'ty':'gr','nm':'Curled right-side sheet','it':items}],
       'ip':0,'op':END,'st':0,'bm':0}

def vector_layer(name,grp,idx,tee=False):
    ks={'o':static(100),'r':static(0),'p':static([0,0,0]),'a':static([0,0,0]),'s':static([100,100,100])}
    lay={'ddd':0,'ind':idx,'ty':4,'nm':name,'sr':1,'ks':ks,'ao':0,
         'shapes':extract_group(grp),'ip':0,'op':END,'st':0,'bm':0}
    if tee:
        pp=[(f,[*shirt(f)[0],0]) for f in range(END+1)]
        sc=[(f,[shirt(f)[1],shirt(f)[1],100]) for f in range(END+1)]
        lay['ks']={'o':kf([(f,shirt(f)[3]) for f in range(END+1)],linear=True),
                   'r':kf([(f,shirt(f)[2]) for f in range(END+1)],linear=True),
                   'p':kf(pp,linear=True),'a':static([326,155,0]),'s':kf(sc,linear=True)}
        lay['hasMask']=True;lay['masksProperties']=[{'inv':False,'mode':'a',
            'pt':keyshapes([(f,mask_shape(f)) for f in range(END+1)]),
            'o':static(100),'x':static(0),'nm':'Black print origin to full visible emergence'}]
    return lay

LAYERS=[vector_layer('Tshirt / emergence from left-side printed illustration',TEE,1,tee=True),
        vector_layer('Left_page / ORIGINAL STATIONARY',fgroup('Left_page'),2),
        page_layer(2,3),page_layer(1,4),page_layer(0,5),
        vector_layer('Right_page / ORIGINAL STATIONARY',fgroup('Right_page'),6),
        vector_layer('Book_Base / ORIGINAL STATIONARY',fgroup('Book_Base'),7),
        vector_layer('Icon_circle / ORIGINAL STATIONARY',fgroup('Icon_circle'),8)]

DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':END,'w':512,'h':512,
      'nm':'CHAPCHITRA C05 Icon 01 / Stories You Can Wear / Right Page V3',
      'ddd':0,'assets':[],'layers':LAYERS,'markers':[],
      'meta':{'generator':'CHAPCHITRA C05 independent native vector shape pipeline',
              'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'notes':'Right-to-left 3 page curls; tee emerges within black left-page print; only tee cream -> Gallery White; final reference derived from master color correction.'}}
JPATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V3.json'
JPATH.write_text(json.dumps(DATA,separators=(',',':')))
LPATH=OUT/'CHAPCHITRA_C05_Icon01_Stories_You_Can_Wear_V3.lottie'
with zipfile.ZipFile(LPATH,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json',json.dumps({'version':'1','generator':'C05 Icon01 native vector animation','activeAnimationId':'c05_icon01_rightpage_v3',
    'animations':[{'id':'c05_icon01_rightpage_v3','autoplay':True,'loop':False,'speed':1,'direction':1}]}))
    z.writestr('animations/c05_icon01_rightpage_v3.json',json.dumps(DATA,separators=(',',':')))


def approved_static():
    root=deepcopy(SVG)
    for el in root.xpath("./s:g[@id='Tshirt']//*",namespaces=NS):
        if el.get('class')=='st1':el.set('class','st3')
    return root

def svg_frame(f):
    root=approved_static()
    tee=root.xpath("./s:g[@id='Tshirt']",namespaces=NS)[0]
    # Tee is on top of both book pages during launch; original geometry otherwise untouched
    root.remove(tee);root.append(tee)
    p,sc,rot,op=shirt(f)
    tee.set('transform',f'translate({p[0]:.5f} {p[1]:.5f}) rotate({rot:.5f}) scale({sc/100:.6f}) translate(-326 -155)')
    tee.set('opacity',f'{op/100:.6f}')
    # Clip on a wrapper in SCREEN coordinates so the black printed region is genuine source.
    clip=etree.Element(f'{{{SVGNS}}}clipPath',id='C05_TEE_PRINT_CLIP')
    x0,y0,x1,y1=mask_rect_screen(f)
    etree.SubElement(clip,f'{{{SVGNS}}}rect',x=str(x0),y=str(y0),width=str(x1-x0),height=str(y1-y0))
    defs=etree.Element(f'{{{SVGNS}}}defs')
    defs.append(clip);root.insert(1,defs)
    tee_wrap=etree.Element(f'{{{SVGNS}}}g',id='C05_TEE_MASK',attrib={'clip-path':'url(#C05_TEE_PRINT_CLIP)'})
    tee_wrap.append(tee);root.append(tee_wrap)
    # Right page faces appear after Right_page, before Left_page; left-page artwork stays fixed above them.
    original_right=root.xpath("./s:g[@id='Right_page']",namespaces=NS)[0]
    insertion=list(root).index(original_right)+1
    for j in range(3):
        op=page_op(f,*PAGE_TIMES[j]);
        leaf=etree.Element(f'{{{SVGNS}}}g',id=f'C05_RIGHT_PAGE_{j+1}',attrib={'opacity':f'{op/100:.6f}'})
        shape=page_shape(f,j)
        etree.SubElement(leaf,f'{{{SVGNS}}}path',d=shape_path(shape),
                         style='fill:#f6f7f5;stroke:#172419;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round')
        for line in page_draw_strokes(f,j):
            # only the lines in the page's upper region
            v=line['v'];inc=line['i'];out=line['o'];ss=[f'M{v[0][0]},{v[0][1]}']
            for k in range(1,len(v)):
                p0=v[k-1];p1=v[k];co=(p0[0]+out[k-1][0],p0[1]+out[k-1][1]);ci=(p1[0]+inc[k][0],p1[1]+inc[k][1]);ss.append(f'C{co[0]:.3f},{co[1]:.3f} {ci[0]:.3f},{ci[1]:.3f} {p1[0]:.3f},{p1[1]:.3f}')
            etree.SubElement(leaf,f'{{{SVGNS}}}path',d=' '.join(ss),
                style='fill:none;stroke:#172419;stroke-width:1.65;stroke-linecap:round;opacity:.90')
        root.insert(insertion,leaf);insertion+=1
    return etree.tostring(root)

def render(f,size=512):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg_frame(f),output_width=size,output_height=size))).convert('RGBA')

if __name__=='__main__':
    # verify original master identical to copied master and exact endpoint under only authorized change
    import numpy as np
    orig=Image.open(io.BytesIO(cairosvg.svg2png(url=str(SOURCE),output_width=640,output_height=640))).convert('RGBA')
    target=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=etree.tostring(approved_static()),output_width=640,output_height=640))).convert('RGBA')
    final=render(END,size=640)
    diff=np.array(target).astype(int)-np.array(final).astype(int)
    n=int(np.any(diff!=0,axis=2).sum());mx=int(np.abs(diff).max())
    oldnew=int(np.any(np.array(orig)!=np.array(target),axis=2).sum())
    print('Final pixel diff vs color-authorized target',n,'max',mx,'approved recolor changes',oldnew)
    assert n<=15,(n,mx)
    assert shirt(0)[3]==0 and shirt(60)[3]==0
    assert abs(shirt(END)[0][0]-326)<.001 and abs(shirt(END)[0][1]-155)<.001
    assert [page_op(END,*v) for v in PAGE_TIMES]==[0,0,0]
    times=[0,10,20,33,46,59,64,72,83,93,104,117,132,143,150]
    sw=300;cols=5;rows=math.ceil(len(times)/cols);gap=16;th=22
    board=Image.new('RGB',(cols*(sw+gap)+gap,rows*(sw+gap+th)+gap),'white');d=ImageDraw.Draw(board)
    for j,f in enumerate(times):
        pic=render(f,size=sw);b=Image.new('RGBA',(sw,sw),'white');b.alpha_composite(pic)
        x=gap+(j%cols)*(sw+gap);y=gap+(j//cols)*(sw+th+gap)
        board.paste(b.convert('RGB'),(x,y))
        phase='right pages' if f<=60 else ('print emerges' if f<=93 else ('float' if f<=135 else 'settle'))
        d.text((x+7,y+sw+4),f'{f/FPS:.2f}s · {phase}',fill='#293d2d')
    board.save(OUT/'CHAPCHITRA_C05_Icon01_V3_STORYBOARD.png')
    frames=[render(f,size=512) for f in range(0,END+1,2)]
    frames[0].save(OUT/'CHAPCHITRA_C05_Icon01_V3_MOTION_REVIEW.gif',save_all=True,append_images=frames[1:],duration=round(2000/FPS),loop=0,optimize=True,disposal=2)
    ff=shutil.which('ffmpeg')
    if ff:
        proc=subprocess.Popen([ff,'-y','-f','image2pipe','-vcodec','png','-framerate',str(FPS),'-i','-','-vf','format=yuv420p',str(OUT/'CHAPCHITRA_C05_Icon01_V3_MOTION_REVIEW.mp4')],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        for f in range(END+1):
            im=render(f,512);b=Image.new('RGBA',im.size,'white');b.alpha_composite(im)
            stream=io.BytesIO();b.convert('RGB').save(stream,format='PNG');proc.stdin.write(stream.getvalue())
        proc.stdin.close();errors=proc.stderr.read();proc.wait(timeout=60)
        print('mp4 result',proc.returncode,errors.decode(errors='replace')[-120:])
    (OUT/'QA_METRICS.json').write_text(json.dumps({'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'target_duration':5,'fps':30,'frames':150,'right_turns':3,'left_page_animated':False,
        'tshirt_cream_recolored_paths':tee_recolored,'static_target_changed_pixels_640':oldnew,
        'final_vs_authorized_static_changed_pixels_640':n,'raster_assets':0,'lottie_layers':len(LAYERS)},indent=2))
    print('V3 files generated at',OUT)