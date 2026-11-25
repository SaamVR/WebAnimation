import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),read=p=>readFile(resolve(root,p),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const supplied={
 light:['CHAPCHITRA_C08_WORDMARK_REPRINT_NEG90_WITH_CLOTHING_PATCH.json','a7c84e4d3368e1f1497718552e7f327ba24495cf43d4fe1e67756d30077e16f7',989888],
 dark:['CHAPCHITRA_C08_INVERTED_WORDMARK_REPRINT.json','4c0152b18063022558bfc988bebbaaa3d655ce4ab266212278804b4910e356ab',1000845]
};
test('Owner final complete Lottie files are byte-exact, nonlooping 2400 square source with embedded clothing',async()=>{
 const names=await readdir(resolve(root,'src/assets/c08-final'));
 assert.deepEqual(names.sort(),Object.values(supplied).map(a=>a[0]).sort());
 for(const [theme,[file,expected,size]] of Object.entries(supplied)){
  const raw=await readFile(resolve(root,'src/assets/c08-final',file));
  assert.equal(raw.length,size,theme+' original byte count');
  assert.equal(sha(raw),expected,theme+' original SHA-256');
  const data=JSON.parse(raw);
  assert.deepEqual([data.w,data.h,data.fr,data.ip,data.op],[2400,2400,60,0,240]);
  assert.equal(data.layers.length,2);
  assert.equal(data.assets.length,2);
  const patch=data.assets.find(a=>a.e===1),precomp=data.assets.find(a=>a.layers);
  assert.equal(patch.w,1416);assert.equal(patch.h,1271);
  assert.match(patch.p,/^data:image\/png;base64,/);
  const png=Buffer.from(patch.p.split(',')[1],'base64');
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(png.readUInt32BE(16),1416);assert.equal(png.readUInt32BE(20),1271);
  const imageLayer=data.layers.find(l=>l.ty===2),motionLayer=data.layers.find(l=>l.ty===0);
  assert.equal(imageLayer.refId,patch.id);assert.equal(motionLayer.refId,precomp.id);
  assert.deepEqual([imageLayer.ip,imageLayer.op,motionLayer.ip,motionLayer.op],[0,240,0,240]);
  assert.deepEqual(imageLayer.ks.p.k,[492,219,0]);
  assert.deepEqual(motionLayer.ks.p.k,[0,1497,0]);
  const roller=precomp.layers.find(l=>l.nm==='ROLLER_ASSEMBLY_MASTER');
  assert.ok(roller.ks.r.k.some(k=>k.s?.includes(-90)||k.e?.includes(-90)));
 }
});
test('PR165 retirement remains intact; final player is hero-only, never split cloth or legacy renderer',async()=>{
 const assets=await readdir(resolve(root,'src/assets/c08'));
 assert.equal(assets.filter(f=>/\.(json|lottie)$/i.test(f)).length,0);
 const app=await read('src/app.mjs'),html=await read('src/index.html'),build=await read('scripts/build.mjs');
 const runtime=await read('src/motion/c08/complete-logo.mjs'),css=await read('src/motion/c08/complete-logo.css');
 assert.doesNotMatch(app,/logo-player\.mjs|c08-hero-stage|c08-navbar-animation|heroLogoHolding/);
 assert.match(app,/mountC08Hero\(\{/);
 assert.match(html,/motion\/c08\/complete-logo\.css/);
 assert.doesNotMatch(html,/motion\/c08\/logo-player\.css/);
 assert.match(build,/rm\(resolve\(output,'assets\/c08'\),\{recursive:true,force:true\}\)/);
 assert.doesNotMatch(build,/rm\(resolve\(output,'assets\/c08-final'/);
 assert.doesNotMatch(runtime,/chapchitra-(light|dark)-cloth\.svg|\.lottie['"]/);
 assert.match(runtime,/renderer:'svg',loop:false,autoplay:false/);
 assert.match(runtime,/await abortable\(image\.decode\(\),signal\)/);
 assert.match(runtime,/await rendererReady\(animation,signal\)/);
 assert.match(runtime,/rec\.decoded=true/);
 assert.match(runtime,/rec\.animation\.goToAndStop\(frame,true\)/);
 assert.match(runtime,/controller\.abort\(\)/);
 assert.match(css,/width:100%;aspect-ratio:1/);
 assert.match(css,/visibility:hidden/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('Original full SVG fallback and static navbar wordmark preserved in both themes',async()=>{
 const app=await read('src/app.mjs');
 assert.match(app,/src="\/assets\/brand\/chapchitra-light-full\.svg"/);
 assert.match(app,/src="\/assets\/brand\/chapchitra-light-wordmark\.svg"/);
 for(const f of ['chapchitra-light-full.svg','chapchitra-dark-full.svg','chapchitra-light-wordmark.svg','chapchitra-dark-wordmark.svg'])
  assert.match(await read('src/assets/brand/'+f),/<svg\b/);
 assert.match(app,/hero:dark\?'\/assets\/brand\/chapchitra-dark-full\.svg'/);
 assert.match(app,/nav:dark\?'\/assets\/brand\/chapchitra-dark-wordmark\.svg'/);
 assert.match(app,/img\[data-cc-theme-brand\]/);
});
test('Hero dwell and unrelated animation lanes remain unchanged',async()=>{
 const app=await read('src/app.mjs'),clock=await read('src/hero-carousel-clock.mjs');
 assert.match(clock,/HERO_DWELL_MS = Object\.freeze\(\[8000, 4000, 4000, 4000, 4000\]\)/);
 assert.match(app,/createHeroCarouselClock\(\{/);
 assert.doesNotMatch(app,/isLocked:\(\)=>active===0/);
 assert.match(app,/motion\/c01\/connected-benefits\.mjs/);
 assert.match(app,/motion\/c04\/ink-impression\.mjs/);
});
