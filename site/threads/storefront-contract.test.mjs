import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,searchCatalog,productMeta,productGallery,galleryAssetManifest,catalogFilters,merchandisingCategory,imageUrl,curateShopProducts} from './catalog.mjs';
import {variantAvailable,priceTk,cartKey} from './store-core.mjs';
const here=import.meta.url;
const read=p=>readFileSync(new URL(p,here),'utf8');
test('shared catalog removes retired f1 and keeps 29 owner-image mappings',()=>{
 assert.equal(catalog.length,38);
 assert.deepEqual(catalog.slice(0,10).map(p=>p.id),['f2','f3','f4','n1','n2','n3','n4','n5','n6','sho-01']);
 assert.equal(catalog.filter(p=>p.group==='catalog').length,29);
 assert.equal(catalog.filter(p=>p.group==='featured').length,3);
 assert.equal(catalog.filter(p=>p.group==='arrival').length,6);
});
test('search matches synonyms, terms, case-insensitive partials and vintage sneaker query',()=>{
 assert.ok(searchCatalog('Vintage Sneakers').length>=3);
 assert.ok(searchCatalog('vInTaGe SnEaKeRs').length>=3);
 assert.equal(searchCatalog('unobtainium-98765').length,0);
 assert.ok(searchCatalog('cap').length>=7);
 assert.ok(searchCatalog('', 'Sneakers').every(p=>p.category==='Sneakers'));
});
test('variant selection and limited availability are real demo state',()=>{
 const p=catalog.find(x=>x.id==='n2');
 assert.equal(variantAvailable(p,'color-2','43'),false);
 assert.equal(variantAvailable(p,'color-0','40'),true);
 assert.equal(variantAvailable(p,'nonexistent','40'),false);
 assert.equal(productMeta(catalog.find(x=>x.id==='f2')).sizes[0],'One Size');
 assert.equal(priceTk(59),'$59.00');
 assert.equal(cartKey({id:'sho-08',color:'color-0',size:'40'}),'sho-08~color-0~40');
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
 assert.ok(read('storefront-pages.mjs').includes('initT04PaymentOverlay'));
 assert.ok(read('storefront-pages.mjs').includes('proceed-payment'));
 assert.ok(read('t04-payment-overlay.mjs').includes('data-t04-stage'));
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
 assert.deepEqual(catalogFilters.map(x=>x.id),['All','Sneakers','Bags','Accessories']);
 assert.equal(merchandisingCategory(catalog.find(p=>p.id==='f2')),'Accessories');
 assert.ok(searchCatalog('Hat').length>=7);
 assert.ok(searchCatalog('CAP').length>=7);
 assert.equal(searchCatalog('', 'Hats').length,15);
 assert.equal(searchCatalog('', 'Accessories').length,15);
 assert.equal(searchCatalog('Backpack').length,4,'Only genuine backpack images match; duffels do not');
 assert.equal(searchCatalog('duffel').length,4);
 assert.ok(searchCatalog('Vintage Sneakers').length>=3);
 assert.equal(searchCatalog('not-a-product-ever').length,0);
});
test('product images support owner-supplied independent gallery views, without invented angles',()=>{
 const p=catalog.find(x=>x.id==='f3');
 const old=productGallery(p);
 assert.equal(old.length,4,'genuine duffel views accompany original cover');
 assert.equal(old.filter(v=>v.isAlternate).length,3);
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

test('Batch 1 image mapping, category counts, one honest cover per new product',()=>{
 const latest=catalog.filter(p=>p.group==='catalog');
 assert.deepEqual([['Sneakers',9],['Bags',7],['Accessories',13]].map(([c,n])=>[c,latest.filter(p=>p.category===c).length,n]),[['Sneakers',9,9],['Bags',7,7],['Accessories',13,13]]);
 assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
 for(const p of latest){
  assert.ok(p.price>0&&Number.isInteger(p.price));
  assert.ok(p.name&&p.description&&p.tags.length);
  assert.equal(p.asset,'./assets/products/'+p.id+'/cover.webp');
  assert.equal(productGallery(p).length,1+galleryAssetManifest[p.id].length,'Exactly the supplied individual gallery views, no invented angles');
  assert.equal(productGallery(p)[0].asset,p.asset);
  assert.equal(productGallery(p)[0].isAlternate,false);
 }
 assert.ok(searchCatalog('Vintage Sneakers').length>=6);
 assert.ok(searchCatalog('Cap').length>=7);
 assert.ok(searchCatalog('Backpack').length>=4);
 assert.ok(searchCatalog('Accessories').length>=8);
 assert.ok(searchCatalog('bottle').length>=3);
 assert.ok(!searchCatalog('Backpack').some(p=>p.type==='duffel'));
});

test('unfiltered Shop groups category-major, row-major and keeps related variations adjacent',()=>{
 const ordered=curateShopProducts(catalog);
 assert.equal(ordered.length,38);
 assert.equal(new Set(ordered.map(p=>p.id)).size,38);
 const sequence=ordered.map(merchandisingCategory);
 const categoryOrder=['Sneakers','Bags','Accessories'];
 assert.deepEqual([...new Set(sequence)],categoryOrder);
 for(let i=1;i<sequence.length;i++) assert.ok(categoryOrder.indexOf(sequence[i])>=categoryOrder.indexOf(sequence[i-1]),'Category groups are contiguous');
 const belts=ordered.filter(p=>p.type==='belt');
 assert.deepEqual(belts.map(p=>p.id),['acc-01','acc-02']);
 assert.equal(ordered.findIndex(p=>p.id==='acc-02'),ordered.findIndex(p=>p.id==='acc-01')+1);
 const bags=ordered.filter(p=>merchandisingCategory(p)==='Bags');
 assert.equal(bags.filter(p=>p.type==='backpack').length,4);
 const backpackNames=bags.filter(p=>p.type==='backpack').map(p=>p.name);
 assert.deepEqual(backpackNames,[...backpackNames].sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base'})));
 assert.deepEqual(curateShopProducts([...catalog].reverse()).map(p=>p.id),ordered.map(p=>p.id));
});

test('storefront uses full, absolutely constrained cover images and category headings',()=>{
 const css=read('storefront.css'),page=read('storefront-pages.mjs');
 assert.match(css,/\.store-product-card__media img\{position:absolute;inset:0;width:100%;height:100%/);
 assert.match(css,/box-sizing:border-box;object-fit:contain;object-position:center/);
 assert.match(css,/\.store-category-heading\{grid-column:1\/-1/);
 assert.ok(page.includes('data-shop-group='));
 assert.ok(page.includes('catalogFilters.slice(1)'));
 assert.ok(page.includes('fullShop'));
});

test('owner gallery manifest maps 120 authentic distinct angles across 38 products',()=>{
 const matches=catalog.filter(p=>galleryAssetManifest[p.id]);
 assert.equal(matches.length,38);
 assert.equal(Object.values(galleryAssetManifest).reduce((sum,a)=>sum+a.length,0),120);
 assert.deepEqual(catalog.filter(p=>!galleryAssetManifest[p.id]).map(p=>p.id),[]);
 const paths=new Set();
 for(const p of matches){
  const views=productGallery(p);
  assert.equal(views.length,1+galleryAssetManifest[p.id].length);
  assert.equal(views[0].asset,p.asset);
  for(const view of views.slice(1)){
   assert.ok(view.isAlternate&&view.crop===0);
   assert.match(view.asset,/^\.\/assets\/products\//);
   assert.ok(!paths.has(view.asset),'A gallery photo cannot be assigned to multiple products');
   paths.add(view.asset);
  }
 }
 assert.equal(paths.size,120);
 for(const p of catalog.filter(p=>!galleryAssetManifest[p.id])){
  assert.equal(productGallery(p).length,1);
  assert.equal(productGallery(p)[0].isAlternate,false);
 }
 const page=read('storefront-pages.mjs');
 assert.ok(page.includes('data-t02-image'));
 assert.ok(page.includes('data-t02-add'));
});


test('T02 V3 duplicates only clicked product image and holds visual badge until real catch',()=>{
 const motion=read('t02-fly-cart.mjs');
 const home=read('app.mjs'),page=read('storefront-pages.mjs'),style=read('storefront.css');
 for(const feature of ['t02-product-proxy','t02-flight-image','mediaFor(button)','img.currentSrc||img.src',
  'objectFit:\'contain\'','getBoundingClientRect()','cameraScroll(','cart-basket',
  'cart-wheel-left','cart-wheel-right','prepareCartBadge','syncCartVisual','settleCartBadge',
  'clipPath:','1.03','prefers-reduced-motion','pagehide'])assert.ok(motion.includes(feature),feature);
 assert.ok(!motion.includes('t02-token'));
 assert.ok(motion.includes('motionPath:{path:arcPath,autoRotate:false}'));
 assert.ok(motion.includes("const isDetail=document.body.dataset.page==='product'"));
 assert.ok(motion.includes("{x:dx,y:dy,duration:.91,ease:'power2.inOut'}"));
 assert.ok(motion.includes('const basketMouth=Math.min(cartRect.width*.54,cartRect.height*.50)'));
 assert.ok(motion.includes('ease:t=>.85*t+.15*t*t*t'));
 assert.ok(!motion.includes('scale:midScale'));
 assert.ok(!motion.includes('t02-cart-proxy'));
 assert.match(style,/\.site-header,\.store-site-header\{position:sticky/);
 assert.match(style,/\.t02-product-proxy/);
 assert.ok(home.includes('prepareCartBadge();const receipt=addCartItem('));
 assert.ok(page.includes('prepareCartBadge();const receipt=addCartItem('));
 assert.ok(page.includes('class="store-quick-add"'));
 assert.ok(page.includes('data-t02-image'));
 assert.ok(page.includes("document.getElementById('bag-button')") || page.includes('installArticulatedHeaderCart()'));
 assert.ok(read('index.html').includes('app.mjs?v=t02-v3-20261019'));
 assert.ok(read('product/index.html').includes('storefront-pages.mjs?v=t02-v3-20261019'));
});
