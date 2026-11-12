#!/usr/bin/env python3
from pathlib import Path
import importlib.util,json,html
from lxml import etree
src=Path(__file__).resolve().parent/'C05_Icon01_V3_editable.py'
spec=importlib.util.spec_from_file_location('c05v3',str(src)); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
OUT=Path(__file__).resolve().parent
original=OUT/'More_than_a_tshirt_Icon_1_ORIGINAL.svg'
ORIG=original.read_text()
APPROVED=etree.tostring(m.approved_static(),encoding='unicode')
states=[]
for f in range(m.END+1):
 p,s,r,o=m.shirt(f)
 leaves=[]
 for j in range(3):
  d=m.shape_path(m.page_shape(f,j))
  lines=[]
  for line in m.page_draw_strokes(f,j):
   v=line['v'];ii=line['i'];oo=line['o'];pts=[f'M{v[0][0]},{v[0][1]}']
   for k in range(1,len(v)):
    p0=v[k-1];p1=v[k];a=(p0[0]+oo[k-1][0],p0[1]+oo[k-1][1]);b=(p1[0]+ii[k][0],p1[1]+ii[k][1]);pts.append(f'C{a[0]},{a[1]} {b[0]},{b[1]} {p1[0]},{p1[1]}')
   lines.append(' '.join(pts))
  leaves.append({'d':d,'o':round(m.page_op(f,*m.PAGE_TIMES[j])/100,5),'lines':lines})
 states.append({'p':m.rv(p),'s':round(s,5),'r':round(r,5),'o':round(o,5),'mask':m.rv(m.mask_rect_screen(f)), 'leaves':leaves})
css='''
:root{--green:#293d2d;--ink:#172419;--terra:#8a503b;--paper:#f6f7f5}*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#f6f7f5;color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1100px;margin:auto;padding:clamp(14px,4vw,36px)}.eyebrow{letter-spacing:.14em;color:var(--terra);font-size:11px;font-weight:750}
h1{font-size:clamp(22px,3.6vw,36px);margin:10px 0}p{font-size:13px;line-height:1.5;color:#455548;margin:0 0 15px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:20px 0}.panel{min-width:0;background:#fff;border:1px solid #dedbd6;border-radius:14px;padding:clamp(12px,2.2vw,22px)}
h2{font-size:15px;margin:0 0 12px}.art{aspect-ratio:1;max-width:512px;margin:auto;position:relative;overflow:hidden}.art svg{width:100%;height:100%;display:block}
#lottie-stage,#fallback,#align-overlay{position:absolute;inset:0;width:100%;height:100%}#lottie-stage{display:none}#align-overlay{pointer-events:none;opacity:0}
.controls{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:8px 0}button,select{padding:10px 14px;font-size:13px;border:1px solid var(--green);border-radius:9px;background:#fff;color:var(--green);font-weight:600;cursor:pointer}button:first-child{background:var(--green);color:white}
input[type=range]{width:100%;accent-color:var(--terra)}label{display:flex;align-items:center;gap:4px;font-size:13px}
#engine{font-size:11px;color:#8a503b;margin-top:8px}.tiny{font-size:11px;color:#576a58}.checker{background:conic-gradient(#e6e6e6 25%,#fff 0 50%,#e6e6e6 0 75%,#fff 0);background-size:20px 20px}
@media(max-width:650px){.grid{grid-template-columns:1fr}.panel{padding:12px}}
'''
# Native player script: external official runtime, standalone still works with SVG fallback.
js=r'''(()=>{'use strict';
const original=JSON.parse(document.querySelector('#source-svg').textContent),
 target=JSON.parse(document.querySelector('#approved-svg').textContent),
 data=JSON.parse(document.querySelector('#lottie-json').textContent),
 states=JSON.parse(document.querySelector('#visual-states').textContent),
 el=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
const FPS=30,END=150,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
el('original').innerHTML=original;
el('fallback').innerHTML=target;
el('align-overlay').innerHTML=target;
const fsvg=el('fallback').querySelector('svg');
const tee=fsvg.querySelector('#Tshirt');
tee.remove();
const defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect');
clip.setAttribute('id','tee-print-clip');clip.appendChild(rect);defs.appendChild(clip);fsvg.appendChild(defs);
const wrapper=document.createElementNS(ns,'g');wrapper.setAttribute('clip-path','url(#tee-print-clip)');wrapper.appendChild(tee);fsvg.appendChild(wrapper);
const right=fsvg.querySelector('#Right_page'),left=fsvg.querySelector('#Left_page');
const pages=[];
for(let j=0;j<3;j++){
 const group=document.createElementNS(ns,'g'),leaf=document.createElementNS(ns,'path');
 group.setAttribute('id','derived-right-page-'+(j+1));
 leaf.setAttribute('style','fill:#f6f7f5;stroke:#172419;stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round');group.appendChild(leaf);
 const strokes=[];
 for(let k=0;k<3;k++){
   const p=document.createElementNS(ns,'path');p.setAttribute('style','fill:none;stroke:#172419;stroke-width:1.65;stroke-linecap:round;opacity:.9');group.appendChild(p);strokes.push(p)
 }
 fsvg.insertBefore(group,left);
 pages.push({group,leaf,strokes});
}
let t=reduced?END:0,playing=false,speed=1,loop=false,last=0,raf=0,inst=null,engine='svg';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function fallbackAt(frame){const q=states[clamp(Math.round(frame),0,END)];
 tee.setAttribute('transform',`translate(${q.p[0]} ${q.p[1]}) rotate(${q.r}) scale(${q.s/100}) translate(-326 -155)`);
 tee.setAttribute('opacity',String(q.o/100));
 rect.setAttribute('x',q.mask[0]);rect.setAttribute('y',q.mask[1]);rect.setAttribute('width',q.mask[2]-q.mask[0]);rect.setAttribute('height',q.mask[3]-q.mask[1]);
 q.leaves.forEach((s,i)=>{pages[i].group.setAttribute('opacity',s.o);pages[i].leaf.setAttribute('d',s.d);s.lines.forEach((d,k)=>pages[i].strokes[k].setAttribute('d',d))});
}
function seek(n){t=clamp(Number(n),0,END);if(engine==='lottie'&&inst)inst.goToAndStop(t,true);else fallbackAt(t);
 el('scrub').value=t;el('clock').textContent=`${(t/FPS).toFixed(2)} / 5.00s`;
}
function pause(){playing=false;last=0;if(raf)cancelAnimationFrame(raf);raf=0;inst?.pause()}
function tick(now){if(!playing)return;const dt=last?Math.min((now-last)/1000,.07):0;last=now;const v=t+dt*FPS*speed;
 if(v>=END){if(loop)seek(v%END);else{seek(END);pause();return}}else seek(v);
 raf=requestAnimationFrame(tick)}
function play(){pause();if(t>=END)seek(0);playing=true;raf=requestAnimationFrame(tick)}
el('play').onclick=play;el('pause').onclick=pause;el('replay').onclick=()=>{seek(0);play()};
el('scrub').oninput=()=>{pause();seek(el('scrub').value)};
el('speed').onchange=()=>{speed=+el('speed').value};el('loop').onchange=()=>{loop=el('loop').checked};
el('overlay-toggle').onchange=()=>{el('align-overlay').style.opacity=el('overlay-toggle').checked?.36:0};
el('checker').onchange=()=>{for(const x of document.querySelectorAll('.art'))x.classList.toggle('checker',el('checker').checked)};
function loadNative(){if(!window.lottie){el('engine').textContent='SVG vector fallback · official lottie-web runtime not available';return}
 try{inst=window.lottie.loadAnimation({container:el('lottie-stage'),renderer:'svg',loop:false,autoplay:false,animationData:data,
 rendererSettings:{preserveAspectRatio:'xMidYMid meet',clearCanvas:true}});
 inst.addEventListener('DOMLoaded',()=>{engine='lottie';el('fallback').style.display='none';el('lottie-stage').style.display='block';el('engine').textContent='Official lottie-web SVG renderer · native vector JSON';seek(t)});
 inst.addEventListener('data_failed',()=>{engine='svg';inst?.destroy();inst=null;el('fallback').style.display='block';el('lottie-stage').style.display='none';el('engine').textContent='SVG reference fallback · Lottie initialization failed';seek(t)})
 }catch(e){engine='svg';el('engine').textContent='SVG reference fallback · Lottie runtime error';seek(t)}}
seek(t);loadNative();if(!reduced)play();
window.__c05V3={seek,pause,play,engine:()=>engine,ready:()=>!!inst,state:()=>({frame:t,loop,playing,speed})};
})();'''
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CHAPCHITRA C05 Icon01 — V3 Right-Page Storybook</title>'''
head+=f'<style>{css}</style><script src="./lottie.min.js"></script></head><body><main>'
body='''<div class="eyebrow">CHAPCHITRA / C05 / ICON 01 · STANDALONE REVIEW V3</div>
<h1>Stories You Can Wear — Right-Page Storybook</h1><p>Three right-side pages turn from right to left; the cat T-shirt comes to life from the printed black illustration, then floats gently into its original composition. Only the T-shirt cream fabric changes to Gallery White.</p>
<div class="grid">
<section class="panel"><h2>Original SVG master · unchanged</h2><div class="art" id="original"></div></section>
<section class="panel"><h2>Revised C05 Icon 01 animation</h2><div class="art" id="animated"><div id="fallback"></div><div id="lottie-stage"></div><div id="align-overlay"></div></div><div id="engine">Initializing native renderer...</div></section>
</div>
<div class="panel"><div class="controls"><button id="play">Play</button><button id="pause">Pause</button><button id="replay">Replay</button>
<label><input type="checkbox" id="loop"> Loop (review only)</label><label>Speed <select id="speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label>
<label><input type="checkbox" id="overlay-toggle"> Final-pose overlay</label><label><input type="checkbox" id="checker"> Checkerboard</label><span id="clock">0.00 / 5.00s</span></div>
<input id="scrub" aria-label="Scrub 5 second Lottie animation" type="range" min="0" max="150" step="0.1" value="0">
<p class="tiny">Original source stays untouched. Final appearance differs only in the approved T-shirt fabric recolor. Animation plays once; reduced motion displays the final static pose. If the official renderer is unavailable, this page labels and uses an SVG reference fallback.</p></div></main>'''
block=lambda id,value:f'<script id="{id}" type="application/json">'+json.dumps(value,separators=(',',':')).replace('</','<\\/')+'</script>'
final=head+body+block('source-svg',ORIG)+block('approved-svg',APPROVED)+block('lottie-json',m.DATA)+block('visual-states',states)+f'<script>{js}</script></body></html>'
p=OUT/'CHAPCHITRA_C05_Icon01_V3_ISOLATED_PREVIEW.html';p.write_text(final)
print('HTML preview created',p,len(final),'bytes')