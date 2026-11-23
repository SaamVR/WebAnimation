import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const app=read('src/app.mjs');
const css=read('src/styles.css');
const original=JSON.parse(read('src/assets/illustrator/manifest.json'));
test('all 18 original illustrator vector crops exist with source path integrity',()=>{
 assert.equal(original.assets.length,18);
 assert.equal(original.assets.filter(x=>x.filename.startsWith('nav-')).length,5);
 assert.equal(original.assets.filter(x=>x.filename.startsWith('social-')).length,3);
 assert.equal(original.assets.filter(x=>x.filename.startsWith('stamp-')).length,10);
 for(const asset of original.assets){
  const svg=read('src/assets/illustrator/'+asset.filename);
  assert.match(svg,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="/);
  assert.equal((svg.match(/<path\b/g)||[]).length,asset.pathCount,asset.filename);
  assert.doesNotMatch(svg,/adobe_illustrator_pgf|foreignObject|<image\b/i);
 }
 for(const digit of '0123456789')
  assert.ok(original.assets.some(x=>x.filename==='stamp-'+digit+'.svg'));
});
test('footer uses original Instagram/Facebook/WhatsApp, never TikTok or invented URLs',()=>{
 assert.match(app,/social-instagram\.svg/);
 assert.match(app,/social-facebook\.svg/);
 assert.match(app,/social-whatsapp\.svg/);
 assert.doesNotMatch(app,/TikTok/);
 assert.match(app,/footer-social-unlinked/);
 assert.match(css,/\.site-footer \.footer-grid/);
 assert.match(css,/minmax\(0,1\.1fr\)/);
});
test('navbar keeps original Illustrator assets and the new selected heart retains its outline',()=>{
 for(const asset of ['nav-search.svg','nav-account.svg','nav-bag.svg','nav-favorites-filled.svg','nav-favorites-outline.svg'])
  assert.ok(original.assets.some(x=>x.filename===asset),'missing source '+asset);
 assert.match(app,/navArt\('owner-search'\)/);
 assert.match(app,/navArt\('owner-account'\)/);
 assert.match(app,/navArt\('owner-bag'\)/);
 assert.match(app,/favorites-selected/);
 const selected=read('src/assets/illustrator/nav-favorites-selected.svg');
 const outline=read('src/assets/illustrator/nav-favorites-outline.svg');
 const shapes=svg=>[...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(shapes(selected).slice(1),shapes(outline),'selected heart must retain exactly the original outline paths');
 assert.equal((read('src/assets/illustrator/nav-favorites-filled.svg').match(/<path\b/g)||[]).length,15,'owner original filled asset preserved');
 assert.match(app,/favorites-outline/);
 assert.match(app,/favoriteArt\(liked\)/);
 assert.match(app,/heartArt\.src/);
 assert.match(app,/aria-pressed/);
 assert.match(app,/aria-current="page"/);
 assert.doesNotMatch(app,/navArt\('menu'\)/);
});
test('bag count is a composition of original stamped digits with literal numeric text',()=>{
 assert.match(app,/const stampedBagCount=count/);
 assert.match(app,/\.\.\.String\(count\)/);
 assert.match(app,/class="sr-only"/);
 assert.match(app,/\.bag-count'\)\.innerHTML=stampedBagCount\(count\)/);
 assert.match(css,/\.cc-bag-stamps img\+img\{margin-left:-3px\}/);
 assert.match(app,/setDemoBagQty/);
});
test('owner-numbered editorial labels are gone from displayed home section headings',()=>{
 assert.doesNotMatch(app,/>04 \/ OUR POINT OF VIEW</);
 assert.doesNotMatch(app,/>05 \/ THE STORY</);
 assert.match(app,/id="valuesTitle">More Than a T-Shirt/);
});
