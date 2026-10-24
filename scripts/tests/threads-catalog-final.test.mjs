import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
 catalog,catalogFilters,catalogById,merchandisingCategory,catalogProductType,
 categoryOrder,subtypeOrder,curateShopProducts,searchCatalog,productGallery,imageUrl
} from '../../site/threads/catalog.mjs';
import{getCart,getFavorites}from '../../site/threads/store-core.mjs';

const base=new URL('../../site/threads/',import.meta.url);
const path=name=>fileURLToPath(new URL(name,base));
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'}));

test('retired f1 is absent while sho-08 is canonically unique and homepage feature uses it',()=>{
 assert.equal(catalog.length,38);
 assert.ok(!catalogById.f1);
 assert.equal(catalog.filter(p=>p.id==='sho-08').length,1);
 assert.deepEqual(catalog.filter(p=>p.group==='featured').map(p=>p.id),['f2','f3','f4']);
 const home=readFileSync(path('app.mjs'),'utf8');
 assert.ok(home.includes("p.id==='sho-08'"));
 assert.ok(!existsSync(path('assets/featured-olive-sneaker-owner-20261018.webp')));
 const page=readFileSync(path('storefront-pages.mjs'),'utf8');
 assert.ok(page.includes('Product not found'));
});
test('category totals, aliases and deterministic category/type/name ordering across filtered views',()=>{
 assert.deepEqual(catalogFilters.map(x=>x.label),['All Products','Shoes / Sneakers','Backpacks / Bags','Accessories']);
 assert.deepEqual(categoryOrder,['Sneakers','Bags','Accessories']);
 assert.deepEqual([...new Set(catalog.map(merchandisingCategory))],['Accessories','Bags','Sneakers']);
 assert.equal(catalog.filter(p=>merchandisingCategory(p)==='Accessories').length,15);
 assert.equal(catalog.filter(p=>merchandisingCategory(p)==='Bags').length,8);
 assert.equal(catalog.filter(p=>merchandisingCategory(p)==='Sneakers').length,15);
 assert.equal(searchCatalog('','Hats').length,15,'old Hats links should redirect to Accessories collection');
 for(const category of categoryOrder){
  const products=searchCatalog('',category);
  assert.deepEqual(products.map(p=>p.id),curateShopProducts([...products].reverse()).map(p=>p.id));
  const types=[...new Set(products.map(catalogProductType))];
  assert.deepEqual(types,[...types].sort((a,b)=>subtypeOrder[category].indexOf(a)-subtypeOrder[category].indexOf(b)));
  for(const type of types){
   const items=products.filter(p=>catalogProductType(p)===type).map(p=>p.name);
   assert.deepEqual(items,sorted(items),category+' '+type);
  }
 }
 const all=searchCatalog('', 'All');
 assert.deepEqual([...new Set(all.map(merchandisingCategory))],categoryOrder);
 assert.deepEqual(all.map(p=>p.id),curateShopProducts([...catalog].reverse()).map(p=>p.id));
 assert.equal(new Set(all.map(x=>x.id)).size,38);
});
test('f3 and f4 covers stay unchanged and genuine independent angles exist',()=>{
 const expected={
  f3:['front','side','angled'],
  f4:['front','profile','side','angled']
 };
 for(const[id,angles]of Object.entries(expected)){
  const product=catalogById[id],views=productGallery(product);
  assert.ok(product.asset.startsWith('./assets/featured-'),'original cover preserved');
  assert.equal(views.length,1+angles.length);
  assert.equal(views[0].asset,product.asset);
  assert.equal(views[0].isAlternate,false);
  for(let i=0;i<angles.length;i++){
   const view=views[i+1],asset='assets/products/'+id+'/'+angles[i]+'.webp';
   assert.equal(imageUrl(view),'/'+asset);
   assert.equal(view.isAlternate,true);
   const bytes=readFileSync(path(asset));
   assert.ok(bytes.length>5000);
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
 }
});
test('stale retired carts and favorites are discarded and do not prevent real products',()=>{
 const formerLocalStorage=globalThis.localStorage;
 const raw=new Map([
  ['threads.demo.cart.v1',JSON.stringify([{id:'f1',color:'color-0',size:'40',quantity:2},{id:'sho-08',color:'color-0',size:'40',quantity:1}])],
  ['threads.demo.favorites.v1',JSON.stringify(['f1','sho-08'])]
 ]);
 globalThis.localStorage={
  getItem:k=>raw.get(k)||null,
  setItem:(k,v)=>raw.set(k,v),
  removeItem:k=>raw.delete(k)
 };
 try{
  assert.deepEqual(getCart().map(x=>x.id),['sho-08']);
  assert.deepEqual([...getFavorites()],['sho-08']);
 }finally{globalThis.localStorage=formerLocalStorage}
});
