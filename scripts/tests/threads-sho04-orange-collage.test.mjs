import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../site/threads/',import.meta.url);
const get=f=>readFileSync(fileURLToPath(new URL(f,root)));
test('sho-04 uses only the four new authentic angles, all gallery assets are distinct',async()=>{
 const {catalogById,productGallery,imageUrl}=await import('../../site/threads/catalog.mjs');
 const p=catalogById['sho-04'];
 assert.equal(p.name,'Burnt Orange Vintage Runner');
 const g=productGallery(p);
 assert.deepEqual(g.map(v=>v.label),['Side profile','Three-quarter angle','Back view','Alternative action angle']);
 assert.deepEqual(g.map(v=>imageUrl(v)),[
  '/assets/products/sho-04/cover.webp',
  '/assets/products/sho-04/angled.webp',
  '/assets/products/sho-04/back.webp',
  '/assets/products/sho-04/action.webp'
 ]);
 assert.equal(new Set(g.map(v=>v.asset)).size,4);
 for(const v of g){
  const b=get(v.asset.replace(/^.\//,''));
  assert.ok(b.length>8000,v.asset+' should contain a real photograph');
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.toString('ascii',8,12),'WEBP');
 }
});
test('all product renders share new cover, and only sho-04 gets dedicated square detail frame',()=>{
 const js=get('storefront-pages.mjs').toString();
 const home=get('app.mjs').toString();
 const css=get('storefront.css').toString();
 assert.match(js,/imageUrl\(p\)/);
 assert.match(home,/imageUrl\(p\)/);
 assert.match(js,/p\.id==='sho-04'\?' data-sho04-square-gallery'/);
 assert.match(css,/\.store-detail\[data-sho04-square-gallery\] \.store-detail__image\{[^}]*aspect-ratio:1\/1/);
 assert.match(css,/\.store-detail\[data-sho04-square-gallery\] \.store-detail__image img\{[^}]*object-fit:contain/);
});
