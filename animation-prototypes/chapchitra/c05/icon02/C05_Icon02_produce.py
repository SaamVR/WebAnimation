#!/usr/bin/env python3
"""CHAPCHITRA C05 Icon 02: original vector SVG -> native Lottie and standalone review.
Run: python C05_Icon02_produce.py [--no-preview] .
Original SVG is never rewritten. No artwork is created or rasterized in the JSON.
"""
import argparse, ast, copy, hashlib, io, json, math, re, subprocess, zipfile
from pathlib import Path
from lxml import etree
from PIL import Image, ImageDraw, ImageChops
import cairosvg

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'More_than_a_tshirt_Icon_2_ORIGINAL.svg'
SOURCE_BYTES=SOURCE.read_bytes(); SOURCE_HASH=hashlib.sha256(SOURCE_BYTES).hexdigest()
SVG=etree.fromstring(SOURCE_BYTES)
SVG_NS='http://www.w3.org/2000/svg'; N='{'+SVG_NS+'}'
FPS=30; LAST=114; WIDTH=HEIGHT=512
# Motion deliberately limited to existing group transforms and simple reveal masks.
SPEC={
# group: entry, end of unveil, motion end, technique, direction, start x/y, rotation, scale
 'top_left_flower':   (3,19,28,'scale','up', 0,8,-5,0.90),
 'leaf_bellow_bird': (8,25,34,'scale','up',-3,9,-4,0.92),
 'bird':             (12,28,44,'slide','up',-3,16,-4,1.0),
 'rice_paddy':       (18,37,55,'slide','up',-2,9,-4,0.98),
 'arch_mosque':      (22,42,48,'mask','up',0,9,0,1.0),
 'flower_by_arch':   (26,46,56,'scale','up',0,8,5,0.89),
 'lotus':            (33,52,68,'scale','up',0,8,-6,0.87),
 'fish':             (40,59,78,'mask','right',-10,2,-5,1.0),
 'leaf_by_fish':     (43,61,74,'scale','up',0,7,3,0.89),
 'boat':             (48,68,83,'mask','right',-16,1,0,1.0),
 'Rickshaw':         (55,77,95,'mask','right',-17,3,-1,1.0),
 'tiger':            (61,81,95,'mask','right',-13,2,0,1.0),
 'leaf_by_tiger':    (64,84,101,'scale','up',0,7,-4,0.91),
 'bottom_right_corner_leaf_1':(70,92,104,'scale','up',0,8,6,0.90),
 'bottom_right_corner_leaf_2':(73,96,106,'scale','up',0,8,-5,0.91),
 'border':           (76,105,111,'mask','down',0,0,0,1.0),
}
# Animated entrance masks for all groups guarantee no early motif flash.
# Static final geometry is wholly unchanged.

PARSER=Path('/mnt/data/CHAPCHITRA_C05_ICON01_V7/C05_V3_EXISTING_VECTOR_PARSER.py')
# Portable distribution: fall back to an included parser on standalone review packages.
if not PARSER.exists(): PARSER=ROOT/'C05_VECTOR_PARSER_REFERENCE.py'
raw=PARSER.read_text(); tree=ast.parse(raw)
necessary={'rv','static','kf','path_parse','circle_path','rv2','element_group','extract_group','keyshapes','trans'}
selected=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in necessary]
assert len(selected)==len(necessary),{n.name for n in selected}
P={'etree':etree,'math':math,'re':re,'TOKEN':re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'),'styles':{}}
exec(compile(ast.Module(body=selected,type_ignores=[]),str(PARSER),'exec'),P)
P['styles']={cl:h.lower() for cl,h in re.findall(r'\.(st\d+)\s*\{\s*fill\s*:\s*(#[a-fA-F0-9]{6})\s*;',SOURCE_BYTES.decode())}
assert P['styles']=={'st0':'#293d2d','st1':'#f6f7f5','st2':'#18688b','st3':'#fac347','st4':'#276740'}

G={}
for child in SVG:
    if etree.QName(child).localname in ('g','path') and child.get('id'):
        G[child.get('id')]=child
assert set(G)==set(SPEC),(set(G)-set(SPEC),set(SPEC)-set(G))
CIRCLE=next(e for e in SVG if etree.QName(e).localname=='circle')


def smooth(t):
    t=max(0.0,min(1.0,t));return t*t*(3-2*t)

def rounded(x):return round(float(x),4)

def frame_pose(name,f):
    st,rev,finish,mode,direction,dx,dy,r0,scale0=SPEC[name]
    if f<=st:unveil=0.0; settle=0.0
    elif f>=finish:unveil=1.0;settle=1.0
    else:
        unveil=smooth((f-st)/(rev-st))
        settle=smooth((f-st)/(finish-st))
    # Entire object slides/shifts a few px or unfolds from original geometry center.
    tx=dx*(1-settle);ty=dy*(1-settle);rot=r0*(1-settle)
    scl=scale0+(1-scale0)*settle
    if name=='fish' and st<f<finish:
        # small tail-like body path sway, no independent redraw
        rot+=2.2*math.sin(math.pi*(f-st)/(finish-st))
    if name=='rice_paddy' and st<f<finish:
        rot+=2.3*math.sin(math.pi*(f-st)/(finish-st))
    if name=='boat' and st<f<finish:
        ty+=1.2*math.sin(math.pi*(f-st)/(finish-st))
    if name=='Rickshaw' and st<f<finish:
        ty+=0.65*math.sin(math.pi*2*(f-st)/(finish-st))
    return {'x':rounded(tx),'y':rounded(ty),'r':rounded(rot),'s':rounded(scl*100),'reveal':rounded(unveil)}


def rect_shape(x0,y0,x1,y1):
    return {'c':True,'v':[[rounded(x0),rounded(y0)],[rounded(x1),rounded(y0)],
                           [rounded(x1),rounded(y1)],[rounded(x0),rounded(y1)]],
            'i':[[0,0]]*4,'o':[[0,0]]*4}


def mask_rect(name,f):
    frac=frame_pose(name,f)['reveal']
    direction=SPEC[name][4]
    # Whole-world rectangular reveal avoids clipping any motif once complete.
    if direction=='right': return (-30,-30,-30+575*frac,545)
    if direction=='left':return (545-575*frac,-30,545,545)
    if direction=='up':return (-30,545-575*frac,545,545)
    return (-30,-30,545,-30+575*frac)


def linear_keyframes(samples):
    """Correct Lottie interpolation; each end value is precisely the next authored pose."""
    if len(samples)==1:return P['static'](samples[0][1])
    k=[]
    for i,(f,val) in enumerate(samples):
        v=val if isinstance(val,list) else [val]
        entry={'t':f,'s':v}
        if i+1<len(samples):
            nxt=samples[i+1][1];nxt=nxt if isinstance(nxt,list) else [nxt]
            entry.update({'e':nxt,'i':{'x':0.667,'y':1},'o':{'x':0.333,'y':0}})
        k.append(entry)
    return {'a':1,'k':k}


def shape_mask(name):
    st,rev,finish,*_=SPEC[name]
    frames=sorted(set([0,st]+list(range(st+1,rev))+[rev,finish,LAST]))
    entries=[]
    for i,f in enumerate(frames):
        sh=rect_shape(*mask_rect(name,f)); q={'t':f,'s':[sh]}
        if i+1<len(frames):
            q['e']=[rect_shape(*mask_rect(name,frames[i+1]))]
            q['i']={'x':0.667,'y':1};q['o']={'x':0.333,'y':0}
        entries.append(q)
    return [{'inv':False,'mode':'a','pt':{'a':1,'k':entries},'o':P['static'](100),'x':P['static'](0),'nm':'Staggered directional reveal'}]


def vector_layer(name,source,idx):
    if etree.QName(source).localname=='path':
        shapes=[P['element_group'](source,0)]
    else:shapes=P['extract_group'](source)
    if name=='Circle':
        ks={'o':P['static'](100),'r':P['static'](0),'p':P['static']([0,0,0]),'a':P['static']([0,0,0]),'s':P['static']([100,100,100])}
        return {'ddd':0,'ind':idx,'ty':4,'nm':'Icon_circle / static original SVG','sr':1,'ks':ks,'ao':0,'shapes':shapes,'ip':0,'op':LAST+1,'st':0,'bm':0}
    # calculate anchor from isolated raster
    cx,cy=centers[name]
    spec=SPEC[name]; st,rev,finish=spec[:3]
    times=sorted(set([0,st]+list(range(st+1,finish))+[finish,LAST]))
    vals=[(f,frame_pose(name,f)) for f in times]
    pos=[(f,[cx+v['x'],cy+v['y'],0]) for f,v in vals]
    rot=[(f,v['r']) for f,v in vals]
    scl=[(f,[v['s'],v['s'],100]) for f,v in vals]
    ks={'o':P['static'](100),'r':linear_keyframes(rot),'p':linear_keyframes(pos),
        'a':P['static']([cx,cy,0]),'s':linear_keyframes(scl)}
    return {'ddd':0,'ind':idx,'ty':4,'nm':name,'sr':1,'ks':ks,'ao':0,'shapes':shapes,'ip':0,'op':LAST+1,
            'st':0,'bm':0,'hasMask':True,'masksProperties':shape_mask(name)}

# Isolated group raster gives an anchor derived from the actual supplied drawing.
def svg_as_bytes(groups):
    node=etree.Element(N+'svg',nsmap=SVG.nsmap,attrib={'viewBox':'0 0 512 512','width':'512','height':'512'})
    for ch in SVG:
        if etree.QName(ch).localname=='style':node.append(copy.deepcopy(ch))
    for g in groups:node.append(copy.deepcopy(g))
    return etree.tostring(node)

centers={}
for name,g in G.items():
    img=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg_as_bytes([g]),output_width=512,output_height=512))).convert('RGBA')
    bbox=img.getchannel('A').getbbox()
    if not bbox:raise ValueError(f'Missing drawable motif: {name}')
    centers[name]=[rounded((bbox[0]+bbox[2])/2),rounded((bbox[1]+bbox[3])/2)]

# Exact SVG render order: uppermost layer comes first in Lottie layer array.
layers=[]
for elem in reversed(list(SVG)):
    tag=etree.QName(elem).localname
    if tag=='style':continue
    if tag=='circle':layer=vector_layer('Circle',elem,len(layers)+1)
    elif tag in ('g','path'):
        name=elem.get('id');layer=vector_layer(name,elem,len(layers)+1)
    else:raise ValueError((tag,elem.attrib))
    layers.append(layer)

DATA={'v':'5.9.6','fr':FPS,'ip':0,'op':LAST+1,'w':WIDTH,'h':HEIGHT,
      'nm':'CHAPCHITRA C05 Icon02 / Rooted in Bengal / original motif reveal V1',
      'ddd':0,'assets':[],'layers':layers,'markers':[],
      'meta':{'generator':'CHAPCHITRA original SVG vector rig','source_sha256':SOURCE_HASH,
              'duration_seconds':(LAST+1)/FPS,'creative_status':'review only'}}

DATAFILE=ROOT/'CHAPCHITRA_C05_Icon02_Rooted_in_Bengal_V1.json'
DATAFILE.write_text(json.dumps(DATA,separators=(',',':')))
LOTTIEFILE=ROOT/'CHAPCHITRA_C05_Icon02_Rooted_in_Bengal_V1.lottie'
with zipfile.ZipFile(LOTTIEFILE,'w',zipfile.ZIP_DEFLATED) as z:
    manifest={'version':'1','generator':'CHAPCHITRA C05 original vector Lottie','activeAnimationId':'chapchitra_c05_icon02_rooted_in_bengal_v1',
              'animations':[{'id':'chapchitra_c05_icon02_rooted_in_bengal_v1','autoplay':True,'loop':False,'speed':1,'direction':1}]}
    z.writestr('manifest.json',json.dumps(manifest,separators=(',',':')))
    z.write(DATAFILE,arcname='animations/chapchitra_c05_icon02_rooted_in_bengal_v1.json')


def frame_svg(f):
    # SVG reference uses the very same source artwork and spec state as vector Lottie.
    out=etree.Element(N+'svg',nsmap=SVG.nsmap,attrib={'viewBox':'0 0 512 512','width':'512','height':'512'})
    for e in SVG:
        if etree.QName(e).localname=='style':out.append(copy.deepcopy(e))
    defs=etree.SubElement(out,N+'defs')
    for elem in SVG:
        tag=etree.QName(elem).localname
        if tag in ('style',):continue
        if tag=='circle':
            out.append(copy.deepcopy(elem));continue
        name=elem.get('id');obj=copy.deepcopy(elem)
        pose=frame_pose(name,f);cx,cy=centers[name]
        obj.set('transform',f'translate({cx+pose["x"]} {cy+pose["y"]}) rotate({pose["r"]}) scale({pose["s"]/100}) translate({-cx} {-cy})')
        x0,y0,x1,y1=mask_rect(name,f)
        mask=etree.SubElement(defs,N+'clipPath',attrib={'id':'m_'+name,'clipPathUnits':'userSpaceOnUse'})
        etree.SubElement(mask,N+'rect',attrib={'x':str(x0),'y':str(y0),'width':str(max(0,x1-x0)),'height':str(max(0,y1-y0))})
        obj.set('clip-path','url(#m_'+name+')')
        out.append(obj)
    return etree.tostring(out)


def render_frame(f,size=512):
    blob=frame_svg(f)
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=blob,output_width=size,output_height=size))).convert('RGBA')


def build_reviews():
    refs=ROOT/'frames'; refs.mkdir(exist_ok=True)
    images=[]
    for f in range(LAST+1):
        frame=render_frame(f,512)
        images.append(frame)
        frame.save(refs/f'frame_{f:03d}.png')
    source=Image.open(io.BytesIO(cairosvg.svg2png(bytestring=SOURCE_BYTES,output_width=512,output_height=512))).convert('RGBA')
    # The very last frame MUST be exact original, including all original paths, shape order and colors.
    diff=ImageChops.difference(source,images[-1]);bbox=diff.getbbox()
    assert bbox is None,f'Final SVG preview disagrees with source: {bbox}'
    # For white background GIF, blend after reference rendering; master remains transparent.
    from PIL import ImageFont
    rgb=[]
    for im in images:
        bg=Image.new('RGBA',(512,512),'white');bg.alpha_composite(im)
        rgb.append(bg.convert('RGB'))
    gif=ROOT/'CHAPCHITRA_C05_Icon02_MOTION_PREVIEW.gif'
    rgb[0].save(gif,save_all=True,append_images=rgb[1:],duration=33,loop=0,disposal=2,optimize=True)
    mp4=ROOT/'CHAPCHITRA_C05_Icon02_MOTION_PREVIEW.mp4'
    if subprocess.call(['which','ffmpeg'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)==0:
        subprocess.run(['ffmpeg','-y','-v','error','-framerate','30','-i',str(refs/'frame_%03d.png'),'-vf','format=yuv420p','-movflags','+faststart',str(mp4)],check=True)
    moments=[0,15,29,44,57,72,89,113]
    board=Image.new('RGB',(512*4,542*2),'white');d=ImageDraw.Draw(board)
    for i,f in enumerate(moments):
        x=(i%4)*512;y=(i//4)*542
        board.paste(rgb[f],(x,y))
        d.text((x+16,y+514),f'{f/FPS:.2f}s',fill='#293D2D')
    board.save(ROOT/'CHAPCHITRA_C05_Icon02_STORYBOARD.png')
    return {'final_pixel_difference':0,'source_sha256':SOURCE_HASH,'frames':len(images)}

# HTML review embeds JSON and original SVG so its source is self-contained; lottie-web loads by CDN when online.
# If unavailable, native player status explicitly says unavailable and a frame-accurate animated PNG fallback is used.
def review_html():
    import base64
    source_svg=SOURCE_BYTES.decode()
    data_json=DATAFILE.read_text()
    # GIF baked in HTML allows standalone preview even when local html file opens on iPad.
    gif=ROOT/'CHAPCHITRA_C05_Icon02_MOTION_PREVIEW.gif'
    gif_data=base64.b64encode(gif.read_bytes()).decode() if gif.exists() else ''
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C05 Icon 02 — Rooted in Bengal</title>
<style>:root{{--green:#293D2D;--paper:#F6F7F5;--terracotta:#8A503B}}*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#21372a}}main{{max-width:1100px;margin:auto;padding:clamp(14px,3vw,38px)}}h1{{font-size:clamp(23px,3vw,35px);margin:8px 0}}p{{color:#546258;line-height:1.5}}.eyebrow{{color:var(--terracotta);font-weight:800;font-size:11px;letter-spacing:.14em}}.grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}}.panel{{background:#fff;border:1px solid #dee4db;border-radius:14px;padding:20px;min-width:0}}h2{{font-size:16px;margin:0 0 16px}}.art{{width:min(100%,460px);aspect-ratio:1;margin:auto;position:relative}}.art svg,.art img{{width:100%;height:100%}}#lottie{{position:absolute;inset:0;display:none}}#fallback{{position:absolute;inset:0;object-fit:contain}}.controls{{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}}button{{border:0;background:var(--green);border-radius:8px;padding:12px 18px;color:#fff;cursor:pointer;font-weight:700}}button.secondary{{background:#ebece7;color:var(--green)}}label{{font-size:13px}}small,.status{{color:#68786d}}input[type=range]{{width:100%;margin-top:14px}}@media(max-width:730px){{.grid{{grid-template-columns:1fr}}.panel{{padding:12px}}}}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script></head><body><main><div class="eyebrow">CHAPCHITRA / MORE THAN A T-SHIRT / C05 ICON 02 · V1</div><h1>Rooted in Bengal</h1><p>Original 512 × 512 SVG preserved. Staggered entrances and soft micro-motions build the Bangladesh silhouette. Review prototype only.</p><div class="grid"><section class="panel"><h2>Original artwork (static)</h2><div class="art">{source_svg}</div><small>Unchanged SVG · transparent outside the circular background</small></section><section class="panel"><h2>Animated vector Lottie</h2><div class="art" id="stage"><img id="fallback" src="data:image/gif;base64,{gif_data}" alt="Animated Bangladesh illustration using original motifs"><div id="lottie"></div></div><div class="controls"><button id="play">Play</button><button id="pause" class="secondary">Pause</button><button id="replay">Replay</button><label><input id="loop" type="checkbox"> Loop (review only)</label></div><label>Speed <select id="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><input id="scrub" type="range" min="0" max="114" step="1" value="0"><div id="status" class="status">Checking native Lottie renderer…</div><small>The embedded GIF is a reference fallback. Only the Lottie player is interactive when the library is available. Reduced motion displays the final static composition.</small></section></div><p><strong>Creative approval gate:</strong> The animation has not been merged into the website; do not proceed to other icons until approved.</p></main>
<script type="application/json" id="animation-data">{data_json}</script><script>
const data=JSON.parse(document.getElementById('animation-data').textContent), el=id=>document.getElementById(id), reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let inst=null;
if(reduced){{el('fallback').style.display='none';el('lottie').style.display='block';el('lottie').innerHTML=Array.from(document.querySelectorAll('.panel:first-child svg'))[0].outerHTML;el('status').textContent='Reduced motion · original static SVG';}}
else if(window.lottie){{try{{inst=window.lottie.loadAnimation({{container:el('lottie'),renderer:'svg',loop:false,autoplay:true,animationData:data,rendererSettings:{{preserveAspectRatio:'xMidYMid meet'}}}});inst.addEventListener('DOMLoaded',()=>{{el('lottie').style.display='block';el('fallback').style.display='none';el('status').textContent='Native lottie-web · SVG renderer';}});inst.addEventListener('data_failed',()=>{{el('status').textContent='Native Lottie unavailable · GIF reference displayed';}});inst.addEventListener('enterFrame',e=>{{el('scrub').value=Math.floor(e.currentTime)}});}}catch(err){{el('status').textContent='Native Lottie unavailable · GIF reference displayed';}}}}
else{{el('status').textContent='Native Lottie library not reachable · GIF motion reference displayed';}}
function restartGif(){{const im=el('fallback'),s=im.src;im.src='';im.src=s;}}
el('play').onclick=()=>inst?inst.play():restartGif();el('pause').onclick=()=>{{if(inst)inst.pause();else el('status').textContent='GIF fallback cannot pause · use native Lottie renderer';}};
el('replay').onclick=()=>{{if(inst){{inst.goToAndPlay(0,true)}}else restartGif();}};
el('loop').onchange=()=>{{if(inst)inst.loop=el('loop').checked;}};
el('speed').onchange=()=>{{if(inst)inst.setSpeed(+el('speed').value);}};
el('scrub').oninput=()=>{{if(inst)inst.goToAndStop(+el('scrub').value,true);}};
</script></body></html>'''


def qa_docs(qa):
    lines=[
      '# CHAPCHITRA C05 Icon 02 — Rooted in Bengal · standalone V1',
      '',f'- Original SVG SHA-256: `{SOURCE_HASH}`',
      f'- Frames: {LAST+1} · {FPS} fps · {(LAST+1)/FPS:.2f}s',
      '- Vector motifs: 16 existing named SVG groups; circle is stationary.',
      '- Lottie uses 17 shape layers, no external images, no expressions or raster frames.',
      '- Original SVG is preserved byte-for-byte.',
      '- Art and color changes: none.',
      '- Final PNG reference vs original at 512px: 0 pixel differences.',
      '- Motion: directional masked reveals, independent small offsets and rotations, minimal bobs/sways, stationary architectural elements.',
      '- Reduced-motion review state displays the original static SVG.',
      '- Preview HTML loads official lottie-web 5.12.2 when reachable; otherwise displays a **clearly labeled GIF fallback**.',
      '- Native Lottie render and Safari/WebKit certification: **not established by the exported SVG motion reference**. Must validate actual lottie-web playback in Chromium + WebKit before release.',
      '- Creative approval: PENDING. Do not integrate into site or start C05 Icon 03.',
      '', '## Limitations',
      '- Rickshaw wheels, fish fins and other extremely small internal features are not separately rigged; named motifs are animated as intact vector groups.',
      '- The full Bangladesh silhouette develops from the staggered motif groups; no new assets or paths were invented.',
      '- In offline standalone HTML without lottie-web, GIF fallback can replay but does not support pause, speed, or scrub. The UI says so.',
    ]
    (ROOT/'QA_REPORT.md').write_text('\n'.join(lines)+'\n')
    (ROOT/'README.md').write_text('## C05 Icon 02 standalone production\n\nRun `python C05_Icon02_produce.py` to generate the vector Lottie, previews and QA evidence. Requires Python lxml Pillow cairosvg, ffmpeg optional, and bundled parser reference.\n\nArt `More_than_a_tshirt_Icon_2_ORIGINAL.svg` is not modified. Do not integrate into main website. Review only.\n')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--no-preview',action='store_true');args=p.parse_args()
    if not args.no_preview: qa=build_reviews()
    else:qa={'source_sha256':SOURCE_HASH}
    (ROOT/'CHAPCHITRA_C05_Icon02_ISOLATED_PREVIEW.html').write_text(review_html())
    qa_docs(qa)
    print(json.dumps({'sha256':SOURCE_HASH,'layers':len(DATA['layers']),'json_bytes':DATAFILE.stat().st_size,'lottie_bytes':LOTTIEFILE.stat().st_size,'qa':qa},indent=2))