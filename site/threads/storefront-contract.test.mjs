import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,searchCatalog,productMeta,productGallery,catalogFilters,merchandisingCategory,imageUrl} from './catalog.mjs';
import {variantAvailable,priceTk,cartKey} from './store-core.mjs';
const here=import.meta.url;
const read=p=>readFileSync(new URL(p,here),'utf8');
test('shared catalog contains exactly ten owner-approved products',()=>{
 assert.equal(catalog.length,10);
 assert.equal(catalog.filter(p=>p.group==='featured').length,4);
 assert.equal(catalog.filter(p=>p.group==='arrival').length,6);
});
test('search matches synonyms, terms, case-insensitive partials and vintage sneaker query',()=>{
 assert.ok(searchCatalog('Vintage Sneakers').length>=3);
 assert.ok(searchCatalog('vInTaGe SnEaKeRs').length>=3);
 assert.equal(searchCatalog('unobtainium-98765').length,0);
 assert.equal(searchCatalog('cap').length,1);
 assert.ok(searchCatalog('', 'Sneakers').every(p=>p.category==='Sneakers'));
});
test('variant selection and limited availability are real demo state',()=>{
 const p=catalog.find(x=>x.id==='n2');
 assert.equal(variantAvailable(p,'color-2','43'),false);
 assert.equal(variantAvailable(p,'color-0','40'),true);
 assert.equal(variantAvailable(p,'nonexistent','40'),false);
 assert.equal(productMeta(catalog.find(x=>x.id==='f2')).sizes[0],'One Size');
 assert.equal(priceTk(5990),'Tk 5,990');
 assert.equal(cartKey({id:'f1',color:'color-0',size:'40'}),'f1~color-0~40');
});
test('all five static route pages exist and defer cinematic animations',()=>{
 for(const p of ['search','product','cart','checkout','order']) {
  const text=read(p+'/index.html');
  assert.ok(text.includes('data-page="'+p+'"'));
  assert.ok(text.includes('storefront-pages.mjs'));
 }
 assert.doesNotMatch(read('storefront-pages.mjs'),/gsap|requestAnimationFrame|anime\(/i);
 assert.ok(read('storefront-pages.mjs').includes('data-t01-card'));
 assert.ok(read('storefront-pages.mjs').includes('data-t02-image'));
 assert.ok(read('storefront-pages.mjs').includes('data-t04-stage'));
});
test('homepage search field expands left of its header icon on one row',()=>{
 const home=read('index.html'),style=read('storefront.css');
 assert.ok(home.indexOf('id="search-area"')<home.indexOf('id="search-button"'));
 assert.ok(home.includes('class="inline-search"'));
 assert.ok(style.includes('right:calc(3*var(--tool-size) + 2*var(--tool-gap))'));
 assert.ok(!home.includes('<div id="search-area" class="search-area" hidden>'));
 assert.ok(home.includes('href="/cart/"'));
});
test('merchandising filters distinguish caps from accessories, and bags from backpacks',()=>{
 assert.deepEqual(catalogFilters.map(x=>x.id),['All','Sneakers','Hats','Bags','Accessories']);
 assert.equal(merchandisingCategory(catalog.find(p=>p.id==='f2')),'Hats');
 assert.equal(searchCatalog('Hat').length,1);
 assert.equal(searchCatalog('CAP').length,1);
 assert.equal(searchCatalog('', 'Hats').length,1);
 assert.equal(searchCatalog('', 'Accessories').length,1);
 assert.equal(searchCatalog('Backpack').length,0,'A duffel is not falsely advertised as a backpack');
 assert.equal(searchCatalog('duffel').length,1);
 assert.ok(searchCatalog('Vintage Sneakers').length>=3);
 assert.equal(searchCatalog('not-a-product-ever').length,0);
});
test('product images support owner-supplied independent gallery views, without invented angles',()=>{
 const p=catalog.find(x=>x.id==='f1');
 const old=productGallery(p);
 assert.equal(old.length,3);
 assert.ok(old.every(v=>v.asset===p.asset&&!v.isAlternate));
 const supplied={asset:'./assets/products/new/cover.webp',gallery:[
  {asset:'./assets/products/new/front.webp',label:'Front'},
  {asset:'./assets/products/new/side.webp',label:'Side profile'},
  {asset:'./assets/products/new/back.webp',label:'Back'}
 ]};
 const genuine=productGallery(supplied);
 assert.deepEqual(genuine.map(x=>x.label),['Front','Side profile','Back']);
 assert.equal(genuine[1].crop,0);
 assert.equal(genuine[1].isAlternate,true);
 assert.equal(imageUrl(genuine[1]),'/assets/products/new/side.webp');
 const page=read('storefront-pages.mjs');
 assert.ok(page.includes('gallery.map((view,i)'));
 assert.ok(page.includes('image.src=imageUrl(view)'));
 assert.ok(page.includes('id="gallery-view-note"'));
});
