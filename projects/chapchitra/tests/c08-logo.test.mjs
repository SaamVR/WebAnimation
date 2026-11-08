import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const text=p=>readFile(resolve(root,p),'utf8');
const data=p=>readFile(resolve(root,p));
const source='src/assets/c08/';
const originalHash='e3887a7187f845099a4948c3a8a3ff2b85dc650b381635cc6db5e3aa68d33876';
test('approved C08 master, original Lottie JSON and dotLottie archive are preserved byte-for-byte',async()=>{
 const expected=[
  ['approved-master-source.svg','093b1d63ce8e572caa9f605cf1c786f174a2b3505d228b7279d51982c63cd4a3'],
  ['wordmark-reprint-original.json',originalHash],
  ['wordmark-reprint-original.lottie','ed802b1986075d88862020206d23175a8a707454b4ad11c165ed5698eb4a5898']
 ];
 for(const [name,hash] of expected){
  const content=await data(source+name);
  assert.equal(createHash('sha256').update(content).digest('hex'),hash,name);
 }
});
test('approved C08 source has 240 frames at 60fps, exact 6 vector layers and zero raster assets',async()=>{
 const l=JSON.parse(await text(source+'wordmark-reprint-original.json'));
 assert.equal(l.w,2400);assert.equal(l.h,550);assert.equal(l.fr,60);assert.equal(l.ip,0);assert.equal(l.op,240);
 assert.deepEqual(l.layers.map(x=>x.nm),[
  'ROLLER_ASSEMBLY_MASTER','ROLLER_HANDLE_ROD','ROLLER_CYLINDER',
  'HIDDEN_T','PRINT_REVEAL','BASE_WORDMARK'
 ]);
 assert.equal(l.assets?.length??0,0);
});
test('hero light variant changes only the two approved static vector fill colors',async()=>{
 const original=JSON.parse(await text(source+'wordmark-reprint-original.json'));
 const light=JSON.parse(await text(source+'wordmark-reprint-hero-light.json'));
 let graphite=0,green=0;
 function normalize(node){
  if(Array.isArray(node))return node.map(normalize);
  if(!node||typeof node!=='object')return node;
  const copy=Object.fromEntries(Object.entries(node).map(([k,v])=>[k,normalize(v)]));
  if(copy.ty==='fl'&&copy.c?.a===0){
   const fills=copy.c.k;
   if(JSON.stringify(fills)===JSON.stringify([228/255,227/255,222/255])){
    graphite++;copy.c.k=[.1373,.1373,.1373];
   }else if(JSON.stringify(fills)===JSON.stringify([157/255,195/255,159/255])){
    green++;copy.c.k=[.1608,.2392,.1765];
   }
  }
  return copy;
 }
 assert.deepEqual(normalize(light),original,'Hero variant must not alter any keyframe, vector path or timing');
 assert.equal(graphite,21);
 assert.equal(green,6);
});
test('original full hero lockup and navbar raster remain the immediate static fallbacks',async()=>{
 const app=await text('src/app.mjs');
 assert.match(app,/src="\/assets\/chapchitra-full-on-dark\.webp"/);
 assert.match(app,/class="hero-brand-lockup"/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark\.webp"/);
 assert.match(app,/class="logo-word logo-word--image"/);
 assert.match(app,/class="c08-navbar-animation" aria-hidden="true"/);
 assert.match(app,/class="c08-hero-stage"/);
 assert.ok(!app.includes('class="c08-hero-stage" aria-hidden="true"'),'Replay button must not be in aria-hidden subtree');
});
test('C08 hero keeps initial slider hold; navbar never automatically starts',async()=>{
 const app=await text('src/app.mjs');
 const script=await text('src/motion/c08/logo-player.mjs');
 assert.match(app,/let heroLogoHolding=!mediaReduced\.matches/);
 assert.match(app,/function canPlay\(\)\{return !heroLogoHolding/);
 assert.match(app,/onHeroHolding:hold=>\{heroLogoHolding=hold;if\(hold\)pauseHero\(\);else scheduleHero\(\)\}/);
 assert.match(app,/setInterval\(\(\)=>changeHero\(\(active\+1\)%slides\.length,false\),4000\)/);
 assert.match(script,/loop:false,autoplay:false/);
 assert.match(script,/navbar\.addEventListener\('pointerenter'/);
 assert.match(script,/trigger\.addEventListener\('pointerenter'/);
 assert.match(script,/trigger\.addEventListener\('click'/);
 assert.match(script,/window\.lottie\?\.loadAnimation/);
 assert.match(script,/const PLAYER = '\/motion\/c01\/vendor\/lottie\.min\.js'/);
 assert.ok(!script.includes('preventDefault('),'Navbar Home click must never be hijacked');
});
test('C08 uses scoped placement, reduced motion and leaves footer static',async()=>{
 const css=await text('src/motion/c08/logo-player.css');
 const script=await text('src/motion/c08/logo-player.mjs');
 assert.match(css,/#app > \.site-header/);
 assert.match(css,/#hero \.hero-cover-inner\.c08-hero-shown/);
 assert.match(css,/clip-path:inset\(0 0 27% 0\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.ok(!css.includes('filter:'),'No blanket CSS color filters allowed');
 assert.ok(!css.includes('footer'),'Footer styling is not in C08 scope');
 assert.match(script,/REDUCED\.addEventListener\('change'/);
 assert.match(script,/original static logo/);
 assert.match(script,/dataCache = new Map\(\)/);
 assert.ok((await stat(resolve(root,'src/assets/c08/wordmark-reprint-original.json'))).size<100000);
});

test('global C08 navbar resolves from versioned Artist Edit release without changing the editor',async()=>{
 const app=await text('src/app.mjs');
 const player=await text('src/motion/c08/logo-player.mjs');
 assert.equal((app.match(/import\('\/motion\/c08\/logo-player\.mjs'\)/g)||[]).length,2);
 assert.ok(!app.includes("import('./motion/c08/logo-player.mjs')"));
 assert.match(player,/const CSS = '\/motion\/c08\/logo-player\.css'/);
 assert.match(player,/function ensureC08Stylesheet\(\)/);
 assert.match(player,/\.some\(link => new URL\(link\.href,location\.href\)\.pathname===CSS\)/);
 assert.match(player,/link\.dataset\.c08Styles='true'/);
 assert.match(player,/if\(navbar\|\|heroImage\)ensureC08Stylesheet\(\)/);
 // Scope remains separate from the Artist Edit worktable and C01 originals.
 assert.ok(!(await text('src/worktable-studio.mjs')).includes('c08'));
 assert.ok(!(await text('src/motion/c01/connected-benefits.mjs')).includes('c08'));
});
