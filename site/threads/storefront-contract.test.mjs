import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,searchCatalog,productMeta} from './catalog.mjs';
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