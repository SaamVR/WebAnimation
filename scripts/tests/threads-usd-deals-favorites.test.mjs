import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,catalogById,merchandisingCategory,priceTk} from '../../site/threads/catalog.mjs';
import {DEAL_PRODUCT_IDS,DEAL_PERCENT,OFFER_EXPIRY_MS,OFFER_CYCLE_MS,offerCycleEnd,offerIsActive,dealUnitPrice,
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
test('fixed Nov 8 UTC boundary immediately renews into indefinite 21-day cycles',()=>{
 assert.equal(DEAL_PRODUCT_IDS.length,8);
 assert.equal(new Set(DEAL_PRODUCT_IDS).size,8);
 assert.equal(DEAL_PERCENT,15);
 const counts={Sneakers:0,Accessories:0,Bags:0};
 for(const id of DEAL_PRODUCT_IDS){assert.ok(catalogById[id]);counts[merchandisingCategory(catalogById[id])]++}
 assert.deepEqual(counts,{Sneakers:4,Accessories:2,Bags:2});
 assert.equal(new Date(OFFER_EXPIRY_MS).toISOString(),'2026-11-08T23:59:59.000Z');
 assert.equal(OFFER_CYCLE_MS,21*86400*1000);
 assert.equal(offerCycleEnd(OFFER_EXPIRY_MS-1),OFFER_EXPIRY_MS);
 assert.equal(offerCycleEnd(OFFER_EXPIRY_MS),OFFER_EXPIRY_MS+OFFER_CYCLE_MS);
 assert.equal(offerCycleEnd(OFFER_EXPIRY_MS+OFFER_CYCLE_MS),OFFER_EXPIRY_MS+2*OFFER_CYCLE_MS);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS-1000),[0,0,0,1]);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS-1),[0,0,0,1]);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS),[21,0,0,0]);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS+1000),[20,23,59,59]);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS+OFFER_CYCLE_MS-1),[0,0,0,1]);
 assert.deepEqual(countdownParts(OFFER_EXPIRY_MS+OFFER_CYCLE_MS),[21,0,0,0]);
 for(const n of [2,3,6,12,24,52,100,1000]){
  const first=OFFER_EXPIRY_MS+n*OFFER_CYCLE_MS;
  assert.equal(offerCycleEnd(first),first+OFFER_CYCLE_MS);
  assert.deepEqual(countdownParts(first),[21,0,0,0]);
  assert.equal(offerCycleEnd(first-1),first);
  assert.deepEqual(countdownParts(first-1),[0,0,0,1]);
 }
 for(const at of [OFFER_EXPIRY_MS-1,OFFER_EXPIRY_MS,OFFER_EXPIRY_MS+1,
   OFFER_EXPIRY_MS+2*OFFER_CYCLE_MS,OFFER_EXPIRY_MS+100*OFFER_CYCLE_MS]){
  assert.equal(offerIsActive(at),true);
  const remaining=countdownParts(at);
  assert.ok(remaining[0]>=0&&remaining[0]<=21);
  for(const id of DEAL_PRODUCT_IDS){
   const p=catalogById[id];
   assert.equal(dealUnitPrice(p,at),roundMoney(p.price*.85),id);
   assert.equal(dealSavings(p,at),roundMoney(p.price-dealUnitPrice(p,at)),id);
  }
  assert.equal(dealUnitPrice(catalogById['bag-04'],at),catalogById['bag-04'].price);
 }
});
test('all storefront countdown surfaces stay consistent and never render an ended state',()=>{
 const app=readFileSync(new URL('../../site/threads/app.mjs',import.meta.url),'utf8');
 const pages=readFileSync(new URL('../../site/threads/storefront-pages.mjs',import.meta.url),'utf8');
 const core=readFileSync(new URL('../../site/threads/store-core.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../../site/threads/index.html',import.meta.url),'utf8');
 assert.match(app,/countdownParts\(now\)/);
 assert.match(app,/offerCycleEnd\(now\)/);
 assert.match(pages,/countdownParts\(now\)/);
 assert.match(pages,/offerCycleEnd\(now\)/);
 assert.match(pages,/Demo offer/);
 assert.match(html,/id="offer-countdown"/);
 for(const source of [app,pages,core]){
  assert.doesNotMatch(source,/Offer Ended|offerIsActive\(\)|OFFER_EXPIRES_AT/);
 }
 assert.doesNotMatch(core,/The demo offer has ended/);
 assert.doesNotMatch(pages,/window\.location\.reload\(\)/);
});
test('one identical forest-green vector path for navbar and product favorites',()=>{
 const path=favoriteSvg().match(/<path d="([^"]+)"/)?.[1];
 assert.ok(path?.startsWith('M20.84'));
 assert.match(favoriteSvg(),/stroke-width="1.8"/);
 assert.match(favoriteButton(catalogById['f2'],true),/aria-pressed="true"/);
 assert.ok(favoriteButton(catalogById['f2'],false).includes(path));
});
test('permanent 15% survives rollover in cart, pending payment and order history',()=>{
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
  const total=roundMoney(2*dealUnitPrice(catalogById['sho-04'])+catalogById['hat-02'].price);
  const savings=roundMoney(catalogById['sho-04'].price*.15*2);
  for(const at of [OFFER_EXPIRY_MS-1,OFFER_EXPIRY_MS,OFFER_EXPIRY_MS+1,
    OFFER_EXPIRY_MS+100*OFFER_CYCLE_MS]){
   const bag=cartSummary(at);
   assert.equal(bag.count,3);
   assert.equal(bag.total,total);
   assert.equal(bag.savings,savings);
  }
  const attempt=startDemoPayment({name:'Sample Visitor',email:'demo@example.test',phone:'0123456789',city:'Sample City',address:'123 Test Ave'});
  assert.equal(attempt.total,total);
  assert.equal(attempt.items[0].price,dealUnitPrice(catalogById['sho-04']));
  // An already-discounted pending transaction crosses the former expiry.
  Date.now=()=>OFFER_EXPIRY_MS+1;
  const receipt=resolveDemoPayment('succeeded');
  assert.equal(receipt.status,'succeeded');
  assert.equal(getOrder(receipt.ref).total,total);
  assert.equal(getOrder(receipt.ref).items[0].price,dealUnitPrice(catalogById['sho-04']));
  assert.equal(cartSummary().count,0);
  // Months later, a new transaction still receives the same discount.
  resetAttempt();
  Date.now=()=>OFFER_EXPIRY_MS+12*OFFER_CYCLE_MS;
  addCartItem({id:'sho-04',size:'40',quantity:1});
  assert.equal(cartSummary().savings,roundMoney(catalogById['sho-04'].price*.15));
  assert.equal(cartSummary().total,dealUnitPrice(catalogById['sho-04']));
  const future=startDemoPayment({name:'Sample Visitor',email:'demo@example.test',phone:'0123456789',city:'Sample City',address:'123 Test Ave'});
  assert.equal(future.total,dealUnitPrice(catalogById['sho-04']));
  const after=resolveDemoPayment('succeeded');
  assert.equal(getOrder(after.ref).total,future.total);
 }finally{Date.now=native}
});
