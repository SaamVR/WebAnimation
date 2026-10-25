import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,catalogById,merchandisingCategory,priceTk} from '../../site/threads/catalog.mjs';
import {DEAL_PRODUCT_IDS,DEAL_PERCENT,OFFER_EXPIRY_MS,offerIsActive,dealUnitPrice,
 dealSavings,countdownParts,roundMoney,moneyUSD} from '../../site/threads/deals.mjs';
import {addCartItem,cartSummary,clearCart,toggleFavorite,getFavorites,resetAttempt,
 startDemoPayment,resolveDemoPayment,getOrder} from '../../site/threads/store-core.mjs';
import {favoriteSvg,favoriteButton} from '../../site/threads/favorite-icon.mjs';
test('38 realistic individual demo USD prices, not BDT conversions',()=>{
 assert.equal(catalog.length,38);
 assert.equal(new Set(catalog.map(p=>p.id)).size,38);
 for(const p of catalog){
  const type=p.type||'sneaker';
  const range=p.category==='Sneakers'?[55,100]:type==='cap'?[18,30]:
   type==='backpack'||type==='duffel'?[40,100]:type==='watch'||type==='headphones'?[40,120]:[15,35];
  assert.ok(p.price>=range[0]&&p.price<=range[1],p.id+' $'+p.price);
  assert.equal(Number.isInteger(p.price),true);
 }
 assert.equal(priceTk(59),'$59.00');
 assert.equal(moneyUSD(1234.5),'$1,234.50');
});
test('one fixed UTC expiration and 4+2+2 genuine deals',()=>{
 assert.equal(DEAL_PRODUCT_IDS.length,8);
 assert.equal(new Set(DEAL_PRODUCT_IDS).size,8);
 assert.equal(DEAL_PERCENT,15);
 const counts={Sneakers:0,Accessories:0,Bags:0};
 for(const id of DEAL_PRODUCT_IDS){assert.ok(catalogById[id]);counts[merchandisingCategory(catalogById[id])]++}
 assert.deepEqual(counts,{Sneakers:4,Accessories:2,Bags:2});
 assert.equal(new Date(OFFER_EXPIRY_MS).toISOString(),'2026-11-08T23:59:59.000Z');
 assert.equal(offerIsActive(OFFER_EXPIRY_MS-1),true);
 assert.equal(offerIsActive(OFFER_EXPIRY_MS),false);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS),[0,0,0,0]);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS-1000),[0,0,0,1]);
 for(const id of DEAL_PRODUCT_IDS){
  const p=catalogById[id];
  assert.equal(dealUnitPrice(p,OFFER_EXPIRY_MS-1),roundMoney(p.price*.85));
  assert.equal(dealUnitPrice(p,OFFER_EXPIRY_MS),p.price);
  assert.equal(dealSavings(p,OFFER_EXPIRY_MS),0);
 }
 assert.equal(dealUnitPrice(catalogById['bag-04'],OFFER_EXPIRY_MS-1000),catalogById['bag-04'].price);
});
test('one identical forest-green vector path for navbar and product favorites',()=>{
 const path=favoriteSvg().match(/<path d="([^"]+)"/)?.[1];
 assert.ok(path?.startsWith('M20.84'));
 assert.match(favoriteSvg(),/stroke-width="1.8"/);
 assert.match(favoriteButton(catalogById['f2'],true),/aria-pressed="true"/);
 assert.ok(favoriteButton(catalogById['f2'],false).includes(path));
});
test('demo cart savings, favorites and paid snapshot stay coherent',()=>{
 const backing=new Map(),session=new Map();
 const storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage(backing)});
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:storage(session)});
 const native=Date.now;
 try{
  Date.now=()=>OFFER_EXPIRY_MS-10_000;
  clearCart();
  assert.equal(toggleFavorite('sho-04'),true);
  assert.equal(getFavorites().has('sho-04'),true);
  assert.equal(toggleFavorite('sho-04'),false);
  assert.equal(getFavorites().has('sho-04'),false);
  addCartItem({id:'sho-04',size:'40',quantity:2});
  addCartItem({id:'hat-02',size:'One Size',quantity:1});
  let summary=cartSummary();
  assert.equal(summary.count,3);
  assert.equal(summary.total,roundMoney(2*catalogById['sho-04'].price*.85+catalogById['hat-02'].price));
  assert.equal(summary.savings,roundMoney(catalogById['sho-04'].price*.15*2));
  const before=summary.total;
  const attempt=startDemoPayment({name:'Sample Visitor',email:'demo@example.test',phone:'0123456789',city:'Sample City',address:'123 Test Ave'});
  assert.equal(attempt.total,before);
  assert.equal(attempt.items[0].price,dealUnitPrice(catalogById['sho-04']));
  const receipt=resolveDemoPayment('succeeded');
  assert.equal(receipt.status,'succeeded');
  assert.equal(getOrder(receipt.ref).total,before);
  assert.equal(cartSummary().count,0);
  resetAttempt();
  addCartItem({id:'sho-04',size:'40',quantity:1});
  assert.equal(cartSummary(OFFER_EXPIRY_MS).savings,0);
  assert.equal(cartSummary(OFFER_EXPIRY_MS).total,catalogById['sho-04'].price);
 }finally{Date.now=native}
});
