import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const root=new URL('./',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('T01 is genuinely integrated into the existing static search, not a substitute UI',()=>{
 const page=read('storefront-pages.mjs'),app=read('app.mjs'),search=read('search/index.html');
 assert.match(page,/import \{initT01Spotlight\} from '\.\/t01-spotlight\.mjs'/);
 assert.match(page,/spotlight\.schedule\(q,list\)/);
 assert.match(page,/data-t01-card/);
 assert.match(search,/storefront-pages\.mjs\?v=(?:t01-search-20261019|t02-20261019|t02-v3-20261019)/);
 assert.match(app,/initInlineSearch\(\)/);
 assert.doesNotMatch(page,/window\.location\s*=\s*['"]\/t01/);
});
test('T01 is a separate pointer-transparent GSAP actor with real geometry and safe teardown',()=>{
 const js=read('t01-spotlight.mjs'),css=read('storefront.css');
 for(const item of ['MotionPathPlugin','gsap.registerPlugin','getBoundingClientRect','requestAnimationFrame','prefers-reduced-motion','pagehide','visibilitychange','resize','scroll','previous.timeline?.kill()','data-t01-card','pointer-events:none']){
  assert.ok((js+css).includes(item),item);
 }
 assert.match(js,/rankProduct\(/);
 assert.match(js,/ranked\.has\(item\.node\.dataset\.productId\)/);
 assert.match(js,/if\(!target\|\|!anchor\)return/);
 assert.match(js,/\{motionPath:\{path:curved\(/);
 assert.match(js,/document\.body\.append\(el\)/);
 assert.match(css,/\.t01-spotlight-layer\{position:fixed/);
 assert.ok(read('search-header.mjs').includes('if(e.key===\'Escape\''));
 assert.ok(read('search-header.mjs').includes("window.location.href='/search/?q='"));
 assert.equal(existsSync(new URL('vendor/gsap.min.js',root)),true);
 assert.equal(existsSync(new URL('vendor/MotionPathPlugin.min.js',root)),true);
 assert.match(read('vendor/gsap.min.js'),/GSAP 3\.14\.2/);
 assert.match(read('vendor/MotionPathPlugin.min.js'),/MotionPathPlugin/);
});
test('T01 remains isolated from T02 and T04 mutations; existing hooks remain present',()=>{
 const app=read('app.mjs'),page=read('storefront-pages.mjs');
 assert.match(app,/data-t02-add/);
 assert.match(page,/data-t02-image/);
 assert.match(page,/initT04PaymentOverlay/);
 const t01=read('t01-spotlight.mjs');
 assert.doesNotMatch(t01,/addCartItem|startDemoPayment|resolveDemoPayment|fetch\(|\.requestSubmit\(/);
});
