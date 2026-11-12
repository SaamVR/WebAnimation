import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {
 C02_PAGES,C02_PATHS,C02_MOTION,isC02Eligible
} from '../src/motion/c02/ink-sweep.mjs';
import {
 inkPath,inkEdgePath,inkEdgeX,easeInk,INK_PALETTE
} from '../src/motion/c02/ink-shapes.mjs';
const origin='https://chapchitra-webanimation.onrender.com';
const current=origin+'/shop/';
const allow=to=>isC02Eligible({current,destination:origin+to});
test('C02 expands to all ordinary cross-page navigation without changing URLs',()=>{
 for(const path of [
  '/', '/artists-edit/', '/journal/', '/about/', '/product/?id=study-1',
  '/bag/', '/favorites/', '/account/', '/checkout/', '/order-confirmation/',
  '/journal/story/?slug=prints-and-people','/shop/?category=regular-tees'
 ])assert.ok(allow(path),path);
 assert.ok(C02_PAGES.includes('/product/'));
 assert.deepEqual(C02_PATHS,C02_PAGES);
});
test('never intercept same-document anchors, external links, assets or downloads',()=>{
 for(const link of [
  '/shop/','/shop/#collection','/shop/?','/assets/c02/roller-prepared.svg',
  '/asset.png','/downloads/artwork.zip'
 ]) assert.equal(isC02Eligible({current,destination:origin+link}),false,link);
 assert.equal(isC02Eligible({current,destination:'https://example.com/shop/'}),false);
 for(const option of [
  {modified:true},{download:true},{external:true},{target:'_blank'},
  {target:'_parent'},{disabled:true}
 ])assert.equal(isC02Eligible({current,destination:origin+'/about/',...option}),false,JSON.stringify(option));
});
test('procedural ink covers fully and clears fully; holes close at full takeover',()=>{
 assert.equal(inkPath(0,{mode:'cover'}),'');
 assert.match(inkPath(1,{mode:'cover'}),/^M -2 -2 H 1002 V 1002/);
 assert.match(inkPath(0,{mode:'reveal'}),/^M -2 -2 H 1002 V 1002/);
 assert.equal(inkPath(1,{mode:'reveal'}),'');
 assert.match(inkPath(.5,{mode:'cover'}),/ C /);
 assert.match(inkPath(.5,{mode:'reveal'}),/ C /);
 assert.match(inkEdgePath(.5),/^M /);
 assert.equal((inkPath(.5,{mode:'cover'}).match(/ M /g)||[]).length,0,'no misleading white opening');
 assert.ok(inkEdgeX(.5,500)>0 && inkEdgeX(.5,500)<1000);
 assert.equal(easeInk(0),0);assert.equal(easeInk(1),1);
 assert.equal(C02_MOTION.coverMs,506);
 assert.equal(C02_MOTION.revealMs,385);
 assert.equal(C02_MOTION.coverMs+C02_MOTION.revealMs,891);
 assert.ok(Math.abs(405/C02_MOTION.coverMs-0.8)<0.001,'roller and ink travel must be 20% slower');
 assert.equal(INK_PALETTE.press,'#293D2D');
 assert.equal(INK_PALETTE.forest,'#172419');
 assert.equal(INK_PALETTE.terra,'#8A503B');
});
test('owner SVG source stays exactly the supplied original master',async()=>{
 const original=await readFile(new URL('../src/assets/c02/roller-original.svg',import.meta.url));
 assert.equal(original.length,2162);
 assert.equal(createHash('sha256').update(original).digest('hex'),
  '1c1226b902299ef7519236b582b5012f5ec918aa7571a2f8091a86db95992d73');
 const src=original.toString('utf8');
 assert.equal((src.match(/<path\b/g)||[]).length,3);
 assert.match(src,/id="ROLLER_CYLINDER"/);
 assert.match(src,/id="ROLLER_HANDLE_x2B_ROD"/);
 assert.match(src,/id="Layer_2"/);
 assert.match(src,/#293D2D/);assert.match(src,/#232323/);
});
test('owner roller is exactly 300 percent of prior dimensions with the same contact geometry',async()=>{
 const src=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.equal(106*3,318);
 assert.equal(150*3,450);
 assert.equal(11*3,33);
 assert.match(src,/width:clamp\(318px,33vw,450px\)/);
 assert.match(src,/height:clamp\(318px,33vw,450px\)/);
 assert.match(src,/const size=Math\.min\(450,Math\.max\(318,viewport\.width\*\.33\)\)/);
 assert.match(src,/edgeX-cylinderLeft-ROLLER_CONTACT_OVERLAP_PX/);
 assert.match(src,/scaleX\(-1\) rotate\(90deg\)/);
 assert.doesNotMatch(src,/clamp\(106px,11vw,150px\)/);
});
test('C02 auto-reveal is independently bootstrapped and never waits on RAF for readiness',async()=>{
 const html=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.match(html,/id="c02-independent-bootstrap"/);
 assert.match(html,/import \{ installC02PageTransitions \} from '\/motion\/c02\/ink-sweep\.mjs'/);
 assert.match(html,/DOMContentLoaded/);
 assert.doesNotMatch(runtime,/\.finally\(\(\)=>win\.requestAnimationFrame\(\(\)=>resolve\(\)\)\)/);
 assert.match(runtime,/Promise\.race\(\[fonts,new Promise\(r=>win\.setTimeout\(r,250\)\)\]\)/);
 assert.match(runtime,/\.then\(resolve,resolve\)/);
 for(const phase of ['idle','covering','waiting','revealing','complete'])
  assert.ok(runtime.includes("state('"+phase+"')"),'lifecycle state: '+phase);
 assert.match(runtime,/incomingGuard=win\.setTimeout\(cleanup,18000\)/);
 assert.match(runtime,/warmDestination\(target\)/);
 assert.match(runtime,/win\.location\.assign\(target\.href\)/);
 assert.equal(C02_MOTION.coverMs,506);
 assert.equal(C02_MOTION.revealMs,385);
});

test('adaptive progress never fully covers a still-loading page',async()=>{
 const m=await import('../src/motion/c02/adaptive-progress.mjs');
 for(const known of [0,1000,3000,5000,8000]){
  let prior=-1;
  for(let t=0;t<Math.max(9000,known)+100;t+=100){
   const p=m.pendingInkProgress(t,{knownMs:known});
   assert.ok(p>=prior,'monotonic '+known+' '+t);
   assert.ok(p<1,'never fully green before ready '+known+' '+t);
   prior=p;
  }
 }
 for(const t of [1000,3000,5000,8000])
  assert.equal(m.getReviewDelayMs('/c02-review/slow/?delay='+t),t);
 assert.equal(m.getReviewDelayMs('/shop/'),0);
 for(const start of [.1,.4,.68,.76]){
  const duration=m.finishDuration(start);
  assert.equal(m.finishInkProgress(start,duration,duration,0),1);
  assert.equal(m.finishInkProgress(start,0,duration,0),start);
 }
});
test('adaptive handoff leaves the approved roller, organic paths and reveal untouched',async()=>{
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 const simulated=await readFile(new URL('../src/c02-review/slow/index.html',import.meta.url),'utf8');
 assert.match(runtime,/driveAdaptive/);
 assert.match(runtime,/pendingInkProgress/);
 assert.match(runtime,/getReviewDelayMs/);
 assert.doesNotMatch(runtime,/animate\('cover',C02_MOTION\.coverMs/);
 assert.match(runtime,/animate\('reveal',C02_MOTION\.revealMs,cleanup/);
 assert.match(runtime,/roller-original\.svg/);
 assert.match(early,/--c02-prepaint-clip/);
 assert.match(simulated,/__c02DemoStartedAt/);
 assert.match(simulated,/Math\.min\(8000/);
});

test('early incoming cover, cross-document transition and failure escape are present',async()=>{
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 assert.doesNotMatch(early,/@view-transition\s*\{\s*navigation:\s*auto/);
 assert.match(early,/sessionStorage/);
 assert.match(early,/c02-pending/);
 assert.match(early,/prefers-reduced-motion/);
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.match(runtime,/pageshow/);
 assert.match(runtime,/pagehide/);
 assert.match(runtime,/MutationObserver/);
 assert.match(runtime,/roller-original\.svg/);
 assert.doesNotMatch(runtime,/lottie-web|gsap|sessionStorage\.clear/);
 assert.match(runtime,/scaleX\(-1\) rotate\(90deg\)/);
 assert.match(runtime,/img\.src='\/assets\/c02\/roller-original\.svg'/);
 assert.match(runtime,/ROLLER_CYLINDER_CONTACT_Y=48\.7199/);
 assert.match(runtime,/inkEdgeX\(p,470,27\)/);
 assert.doesNotMatch(runtime,/p>\.065|p<\.92|roller\.style\.opacity=String/);
});

test('full sweep preserves approved easing with bounded 90ms roller velocity',async()=>{
 const {finishDuration,finishInkProgress}=await import('../src/motion/c02/adaptive-progress.mjs');
 const edge=p=>inkEdgeX(p,470,27)/1000;
 for(const start of [.015,.10,.25,.42,.68,.76]){
  const duration=Math.max(finishDuration(start),Math.ceil((1-start)*1120));
  assert.equal(finishInkProgress(start,0,duration,0),start);
  assert.equal(finishInkProgress(start,duration,duration,0),1);
  let previous=start,peak=0;
  for(let t=0;t<=duration;t+=10){
   const p=finishInkProgress(start,t,duration,.00015);
   const next=finishInkProgress(start,Math.min(duration,t+90),duration,.00015);
   assert.ok(p>=previous-1e-8&&p<=1,'full cover progress monotone');
   previous=p;
   peak=Math.max(peak,Math.abs(edge(next)-edge(p)));
  }
  assert.ok(peak<.24,'approved 90ms velocity preserved: '+start+' peak='+peak);
 }
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 assert.match(runtime,/if\(fullSweep\)d=Math\.max\(d,Math\.ceil\(\(target-start\)\*1120\)\)/);
 assert.match(runtime,/demoMs<=1000\?40:/);
});

test('native page commit is gated by actual complete ink geometry and a paint boundary',async()=>{
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 const prepaint=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 assert.match(runtime,/drive\.finishTo\(1,\(\)=>\{/);
 assert.doesNotMatch(runtime,/drive\.finishTo\(Math\.max\(current\+\.012,\.68\),navigate\)/);
 assert.match(runtime,/fullCoverage\(\)/);
 assert.match(runtime,/inkAssetImg\.naturalWidth===C02_INK_ASSET\.width/);
 assert.match(runtime,/inkAssetImg\.naturalHeight===C02_INK_ASSET\.height/);
 assert.match(runtime,/frameFits&&\(edgeStyle==='asset'/);
 assert.match(runtime,/whiteSeal&&style\.display==='block'/);
 assert.match(runtime,/style\.clipPath==='none'/);
 assert.match(runtime,/coverPaintRaf=win\.requestAnimationFrame\(validate\)/);
 assert.match(runtime,/if\(!leaving\|\|navigationCommitted\|\|!proof\?\.covered\)return/);
 assert.match(runtime,/storeTicket\(win,target,\{progress:1,startedAt,demoMs,edgeStyle\}\)/);
 assert.match(runtime,/Math\.min\(1,progress\)/);
 assert.match(runtime,/Math\.min\(1,Number\(ticket\.progress\)\|\|\.015\)/);
 assert.match(runtime,/Math\.min\(1,initial\)/);
 assert.match(runtime,/dataset\.c02IncomingProgress=String\(p\)/);
 assert.match(runtime,/dataset\.c02RevealStartAt=String\(Date\.now\(\)\)/);
 assert.match(prepaint,/Math\.min\(1,Number\(ticket\.progress\)\|\|\.015\)/);
 assert.match(prepaint,/dataset\.c02PrepaintProgress=String\(p\)/);
 assert.match(prepaint,/c02-full-cover::after/);
 assert.match(prepaint,/background-color:#F6F7F5/);
 assert.match(runtime,/inkAssetLayer\.style\.clipPath=clip/);
 assert.match(runtime,/const sealed=mode==='reveal'\|\|\(mode==='cover'&&p>=1\)/);
 assert.match(runtime,/const backing=sealed\?'#F6F7F5':'transparent'/);
});
