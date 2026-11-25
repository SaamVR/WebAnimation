import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),read=p=>readFile(resolve(root,p),'utf8');
test('Old C08 animation JSON/dotLottie and runtime are removed',async()=>{
 const assets=await readdir(resolve(root,'src/assets/c08'));
 assert.equal(assets.filter(f=>/\.(json|lottie)$/i.test(f)).length,0);
 const app=await read('src/app.mjs'),html=await read('src/index.html'),build=await read('scripts/build.mjs');
 assert.doesNotMatch(app,/mountC08|logo-player\.mjs|c08-hero-stage|c08-navbar-animation|heroLogoHolding/);
 assert.doesNotMatch(html,/motion\/c08\/logo-player\.css/);
 assert.match(build,/rm\(resolve\(output,'assets\/c08'\),\{recursive:true,force:true\}\)/);
});
test('Owner original light/dark full SVG and navbar wordmark remain static',async()=>{
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
