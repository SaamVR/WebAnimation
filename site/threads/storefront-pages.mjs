import {catalog, catalogById, productMeta, productGallery, catalogFilters, merchandisingCategory, imageUrl, priceTk, safeHTML, searchCatalog,curateShopProducts,normalizeCatalogCategory} from './catalog.mjs';
import {initInlineSearch} from './search-header.mjs';
import {favoriteSvg,favoriteButton,installNavbarHeart,syncNavbarFavorites,syncFavoriteButtons} from './favorite-icon.mjs';
import {DEAL_PRODUCT_IDS,DEAL_PERCENT,offerCycleEnd,dealDisplay,dealSavings,countdownParts} from './deals.mjs';
import {initT01Spotlight} from './t01-spotlight.mjs';
import {playT02,installArticulatedHeaderCart,prepareCartBadge,syncCartVisual,settleCartBadge} from './t02-fly-cart.mjs';
import {playT04Approved} from './t04-payment-approved.mjs';
import {initT04PaymentOverlay} from './t04-payment-overlay.mjs';
import {stabilizeCheckoutViewport} from './t04-viewport-stability.mjs';
import {CART_KEY,FAVORITES_KEY,getCart,cartSummary,cartCount,addCartItem,updateCartItem,removeCartItem,variantAvailable,getFavorites,toggleFavorite,startDemoPayment,resolveDemoPayment,getAttempt,resetAttempt,getOrder} from './store-core.mjs';

const $=id=>document.getElementById(id);
const args=new URLSearchParams(window.location.search);
const page=document.body.dataset.page;
const escape=safeHTML;
const link=id=>'/product/?id='+encodeURIComponent(id);
const money=priceTk;
const showError=(target,message)=>{const node=$(target);if(node){node.textContent=message;node.hidden=!message;}return !!message};
const header=()=>`<a class="skip-link" href="#page-main">Skip to content</a><header class="site-header store-site-header" id="top"><div class="header-inner">
 <a class="wordmark" href="/" aria-label="Threads home"><img src="/assets/threads-wordmark-2e453a.png" alt="THREADS" width="850" height="105"></a>
 <nav class="main-nav" aria-label="Main navigation"><a href="/">HOME</a><a href="/search/">SHOP</a><a href="/search/?category=Sneakers">COLLECTION</a><a href="/#about">ABOUT</a></nav>
 <div class="header-tools"><form id="search-area" class="inline-search" role="search" action="/search/" method="get" aria-hidden="true"><label class="sr-only" for="search-input">Search the Threads catalog</label><input id="search-input" type="search" name="q" placeholder="Search products…" autocomplete="off" tabindex="-1" aria-label="Search products"></form><button class="icon-btn" id="search-button" type="button" aria-label="Open product search" aria-expanded="false" aria-controls="search-area"><img class="header-icon" src="/assets/header-search.png" alt=""></button><a href="/search/?favorites=1" class="icon-btn" id="favorites-button" aria-label="Saved favorites">${favoriteSvg()}</a><a href="/cart/" class="icon-btn bag-button" id="bag-button" aria-label="View shopping cart"><img class="header-icon" src="/assets/header-cart.png" alt=""><span class="bag-count" id="bag-count">${cartCount()}</span></a><span id="t02-cart-status" class="sr-only" role="status" aria-live="polite"></span></div></div></header>`;
const footer=()=>`  <footer class="site-footer store-site-footer" aria-label="THREADS footer">
    <div class="threads-footer-inner">
      <div class="threads-footer-top">
        <div class="threads-footer-brand">
          <a class="threads-footer-logo" href="/" aria-label="THREADS home">
            <img src="/assets/threads-footer-logo-inverted.png" width="900" height="112" alt="THREADS" loading="eager" decoding="async">
          </a>
          <p>Premium sneakers, bags and everyday<br class="footer-desktop-break"> essentials for a brighter everyday.</p>
          <div class="threads-footer-social" role="img" aria-label="Social media: Instagram, Facebook, YouTube and Pinterest (illustrative icons)">
            <span title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.8" cy="6.4" r=".75" fill="currentColor" stroke="none"/></svg></span>
            <span title="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M14.6 22v-8.7h3l.45-3.5H14.6V7.5c0-1 .28-1.67 1.72-1.67h1.84V2.7a25 25 0 0 0-2.68-.14c-2.66 0-4.48 1.63-4.48 4.6v2.64H8v3.5h3V22h3.6Z"/></svg></span>
            <span title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" stroke="none"/><path d="m10 8.7 6 3.3-6 3.3Z" fill="#172B2E" stroke="none"/></svg></span>
            <span title="Pinterest"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.34c-.06-.84 0-1.7.2-2.5l1.2-5.13s-.3-.59-.3-1.45c0-1.35.78-2.37 1.75-2.37.83 0 1.23.62 1.23 1.37 0 .83-.53 2.07-.8 3.22-.23.96.47 1.74 1.4 1.74 1.68 0 2.98-1.77 2.98-4.33 0-2.27-1.63-3.86-3.97-3.86-2.7 0-4.29 2.02-4.29 4.11 0 .82.31 1.7.71 2.18a.29.29 0 0 1 .06.28l-.27 1.1c-.04.18-.15.22-.34.14-1.27-.6-2.06-2.47-2.06-3.97 0-3.23 2.35-6.2 6.77-6.2 3.55 0 6.31 2.53 6.31 5.91 0 3.52-2.22 6.36-5.3 6.36-1.03 0-2-.54-2.34-1.17l-.63 2.4c-.23.91-.85 2.05-1.26 2.83A10 10 0 1 0 12 2Z"/></svg></span>
          </div>
        </div>
        <div id="footer-news" class="threads-footer-newsletter">
          <span class="threads-footer-kicker">STAY CONNECTED</span>
          <h2>Get Our News And Updates</h2>
          <form id="newsletter-form">
            <label for="newsletter-email" class="sr-only">Email address for newsletter demo</label>
            <input id="newsletter-email" type="email" autocomplete="email" placeholder="Enter your email" aria-describedby="newsletter-status" required>
            <button type="submit">Subscribe</button>
          </form>
          <p id="newsletter-status" role="status" aria-live="polite">Demo preview only — email addresses are not collected.</p>
        </div>
      </div>
      <nav class="threads-footer-nav" aria-label="Footer navigation">
        <div class="threads-footer-links"><h3>Shop</h3><a href="/search/">Sneakers</a><a href="/search/?category=Bags">Bags</a><a href="/search/?category=Accessories">Accessories</a><a href="/#arrivals">New Arrivals</a></div>
        <div class="threads-footer-links"><h3>About</h3><a href="/#about">Our Story</a><a href="/#mission">Sustainability</a><a href="/#about">Careers</a><a href="/#about">Press</a></div>
        <div class="threads-footer-links"><h3>Help</h3><a href="/#footer-news">Help Center</a><a href="/#footer-news">Shipping &amp; Returns</a><a href="/#footer-news">Size Guide</a><a href="/#footer-news">Contact Us</a></div>
        <div class="threads-footer-links threads-footer-company"><h3>Company</h3><a href="/#about">Terms of Service</a><a href="/#about">Privacy Policy</a><a href="/#about">Cookie Policy</a><p class="threads-footer-legal">© 2026 THREADS · Demo preview</p></div>
      </nav>
    </div>
  </footer>`;
const card=p=>`<article class="store-product-card" data-t01-card data-product-id="${escape(p.id)}"><a href="${link(p.id)}" class="store-product-card__link"><div class="store-product-card__media" data-t02-image><img src="${imageUrl(p)}" alt="${escape(p.name)}" loading="lazy"></div><span class="store-product-card__name">${escape(p.name)}</span><span class="store-product-card__subtitle">${escape(p.subtitle)}</span></a>${favoriteButton(p,getFavorites().has(p.id))}<div class="store-product-card__footer"><span class="store-price">${dealDisplay(p)}</span><a class="store-small-link" href="${link(p.id)}">View details →</a><button type="button" class="store-quick-add" data-add="${escape(p.id)}" data-t02-add aria-label="Add ${escape(p.name)} to cart">Add to Cart</button></div></article>`;
function mount(html){$('page-content').innerHTML=html}
function setCartBadge(){const c=$('bag-count');syncCartVisual(cartCount())}
function searchPage(){
 const query=args.get('q')||'',category=normalizeCatalogCategory(args.get('category')||''),favorites=args.get('favorites')==='1';
 let activeCategory=category;
 mount(`<section class="store-page-heading"><div class="store-kicker">THREADS COLLECTION</div><h1>${favorites?'Saved favorites':'Discover your next essential'}</h1><p>Curated sneakers, headwear, travel bags and everyday accessories. Every item has its own details.</p></section><section class="store-search-toolbar"><form id="catalog-search-form" role="search"><label for="catalog-search">Search the collection</label><div class="store-search-row"><input type="search" id="catalog-search" name="q" value="${escape(query)}" placeholder="Try vintage sneakers…"><button type="submit" class="store-primary-btn">Search <span aria-hidden="true">→</span></button></div></form><div class="store-filter-row" aria-label="Product categories" id="catalog-filters">${catalogFilters.map(x=>`<button type="button" class="store-chip" data-category="${x.id}" aria-pressed="${(category||'All')===x.id}">${x.label}</button>`).join('')}</div><a class="deals-shop-link" href="/deals/">Deals / Offers · 15% off selected styles →</a></section><section class="store-catalog-results" aria-live="polite"><div class="store-results-top"><h2 id="results-title">Search Results</h2><span id="results-count"></span></div><div id="results-grid" class="store-results-grid" data-t01-results></div></section>`);
 const spotlight=initT01Spotlight();
 const input=$('catalog-search');const current=query;
 const syncUrl=(q,cat)=>{const p=new URLSearchParams();if(q)p.set('q',q);if(cat)p.set('category',cat);if(favorites)p.set('favorites','1');window.history.replaceState({},'', '/search/'+(p.size?'?'+p.toString():''));};
 function update(q=input.value,cat=activeCategory){
  const matches=searchCatalog(q,cat).filter(p=>!favorites||getFavorites().has(p.id));
  const list=!q.trim()&&(!cat||cat==='All')&&!favorites?curateShopProducts(matches):matches;
  // Keep natural, row-major grid placement and start each collection on a fresh row.
  const fullShop=!q.trim()&&(!cat||cat==='All')&&!favorites;
  const markup=fullShop?catalogFilters.slice(1).map(group=>{
    const items=list.filter(p=>merchandisingCategory(p)===group.id);
    if(!items.length)return '';
    return `<h3 class="store-category-heading" data-shop-group="${group.id}">${escape(group.label)} <span>${items.length} styles</span></h3>`+items.map(card).join('');
  }).join(''):list.map(card).join('');
  $('results-grid').innerHTML=list.length?markup:`<div class="store-empty"><h3>No matching products</h3><p>Try fewer keywords or browse all categories.</p><a href="/search/" class="store-primary-btn">Browse all products</a></div>`;
  $('results-count').textContent=list.length+' relevant demo product'+(list.length===1?'':'s');
  $('results-title').textContent=q?'Results for “'+q+'”':'All Products';
  for(const b of document.querySelectorAll('[data-category]'))b.setAttribute('aria-pressed',String((cat||'All')===b.dataset.category));
  spotlight.schedule(q,list);
  syncNavbarFavorites(getFavorites().size);
 }
 function reconcileFavoriteSearch(){
  if(!favorites)return;
  const saved=getFavorites(),q=input.value.trim();
  const desired=searchCatalog(q,activeCategory).filter(p=>saved.has(p.id));
  const grid=$('results-grid'),allowed=new Set(desired.map(p=>p.id));
  for(const node of grid.querySelectorAll('.store-product-card[data-product-id]')){
   if(!allowed.has(node.dataset.productId))node.remove();
  }
  if(!desired.length){
   if(!grid.querySelector('.store-empty'))grid.innerHTML='<div class="store-empty"><h3>No matching products</h3><p>Try fewer keywords or browse all categories.</p><a href="/search/" class="store-primary-btn">Browse all products</a></div>';
  }else{
   grid.querySelector('.store-empty')?.remove();
   for(const [index,p] of desired.entries()){
    let node=[...grid.querySelectorAll('.store-product-card[data-product-id]')].find(n=>n.dataset.productId===p.id);
    if(!node){const template=document.createElement('template');template.innerHTML=card(p);node=template.content.firstElementChild;}
    const at=grid.children[index]||null;
    if(node!==at)grid.insertBefore(node,at);
   }
  }
  $('results-count').textContent=desired.length+' relevant demo product'+(desired.length===1?'':'s');
 }
 update(current,category);
 $('catalog-search-form').addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();syncUrl(q,activeCategory);update(q,activeCategory)});
 if(favorites){
  window.addEventListener('threads:favoriteschange',reconcileFavoriteSearch);
  window.addEventListener('storage',event=>{if(event.key===FAVORITES_KEY||event.key===null)reconcileFavoriteSearch()});
 }
 $('catalog-filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;const c=b.dataset.category==='All'?'':b.dataset.category;activeCategory=c;const q=input.value.trim();syncUrl(q,c);update(q,c)});
 // Shop/Search cards reuse the same cart mutation and T02.
 $('results-grid').addEventListener('click',e=>{
  const heart=e.target.closest('[data-save]');
  if(heart){toggleFavorite(heart.dataset.save);return}
  const button=e.target.closest('[data-t02-add]');if(!button)return;
  const p=catalogById[button.dataset.add];if(!p)return;
  const m=productMeta(p),color=m.colors[0]?.id;
  const size=m.sizes.find(value=>variantAvailable(p,color,value));
  if(!size){const status=$('t02-cart-status');if(status)status.textContent='Selected product unavailable';return;}
  try{
   prepareCartBadge();
   const receipt=addCartItem({id:p.id,color,size,quantity:1});
   setCartBadge();
   void playT02({button,quantity:receipt.count}).catch(()=>settleCartBadge());
  }catch(err){
   settleCartBadge();
   const status=$('t02-cart-status');if(status)status.textContent=err.message;
  }
 });
}
function dealsPage(){
 const products=DEAL_PRODUCT_IDS.map(id=>catalogById[id]).filter(Boolean);
 mount('<section class="store-page-heading"><span class="store-kicker">THREADS FLASH DEALS</span><h1>Deals / Offers</h1>'+
  '<p>Eight existing THREADS products. The '+DEAL_PERCENT+'% demo discount continues through every 21-day UTC countdown cycle.</p>'+
  '<p id="deals-expiry" role="status" class="deals-expiry"></p><div id="deals-clock" class="deals-countdown" role="timer"></div>'+
  '<a href="/search/" class="deals-shop-link">← Browse All Products</a></section>'+
  '<section class="store-catalog-results"><div class="store-results-top"><h2>Selected styles</h2><span>4 sneakers · 2 accessories · 2 bags</span></div>'+
  '<div id="results-grid" class="store-results-grid deals-grid"></div></section>');
 function render(){
  $('results-grid').innerHTML=products.map(p=>'<div class="deal-grid-item">'+card(p)+
   '<span class="deal-card-ribbon">'+DEAL_PERCENT+'% OFF</span>'+
   '<p class="deal-card-savings">You save '+money(dealSavings(p))+' · Demo offer</p></div>').join('');
  syncNavbarFavorites(getFavorites().size);
 }
 render();
 $('results-grid').addEventListener('click',e=>{
  const save=e.target.closest('[data-save]');
  if(save){toggleFavorite(save.dataset.save);return}
  const button=e.target.closest('[data-t02-add]');if(!button)return;
  const product=catalogById[button.dataset.add];if(!product)return;
  const meta=productMeta(product),color=meta.colors[0].id;
  const size=meta.sizes.find(value=>variantAvailable(product,color,value));
  try{
   prepareCartBadge();
   const receipt=addCartItem({id:product.id,color,size,quantity:1});
   setCartBadge();void playT02({button,quantity:receipt.count}).catch(()=>settleCartBadge());
  }catch(error){
   settleCartBadge();$('t02-cart-status').textContent=error.message;
  }
 });
 window.addEventListener('threads:favoriteschange',()=>syncNavbarFavorites(getFavorites().size));
 window.addEventListener('storage',render);
 const tick=()=>{
  const now=Date.now(),parts=countdownParts(now);
  $('deals-clock').textContent=parts.map((n,i)=>String(n).padStart(2,'0')+[' days',' hours',' min',' sec'][i]).join(' : ');
  const label='Current 21-day demo cycle ends '+new Date(offerCycleEnd(now)).toLocaleString('en-US',{timeZone:'UTC',timeZoneName:'short'});
  if($('deals-expiry').textContent!==label)$('deals-expiry').textContent=label;
 };
 tick();setInterval(tick,1000);window.addEventListener('focus',tick);
}

function detailPage(){
 const p=catalogById[args.get('id')];
 if(!p){mount(`<section class="store-empty"><h1>Product not found</h1><p>Return to the collection to find an available demo product.</p><a class="store-primary-btn" href="/search/">View collection</a></section>`);return}
 const m=productMeta(p),primary=m.colors[0],first=m.sizes[0],gallery=productGallery(p),firstView=gallery[0],singlePhoto=gallery.every(x=>!x.isAlternate);
 mount(`<nav class="store-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/search/?category=${encodeURIComponent(merchandisingCategory(p))}">${escape(merchandisingCategory(p))}</a><span>›</span>${escape(p.name)}</nav><section class="store-detail"${p.id==='f3'?' data-f3-square-gallery':''}${p.id==='sho-04'?' data-sho04-square-gallery':''}><div class="store-detail__gallery"><div class="store-thumbnails" role="group" aria-label="Image views">${gallery.map((view,i)=>`<button type="button" data-view="${i}" aria-label="${escape(view.label)}" aria-pressed="${i===0}"><img class="${view.crop===1?'thumb-zoom':view.crop===2?'thumb-more':''}" src="${imageUrl(view)}" alt="${escape(p.name)} · ${escape(view.label)}"></button>`).join('')}</div><div class="store-detail__image" data-t02-image><img id="detail-main-image" class="view-0" src="${imageUrl(firstView)}" alt="${escape(p.name)} · ${escape(firstView.label)}"></div><p class="store-image-note" id="gallery-view-note">${singlePhoto?(gallery.length===1?'Owner-supplied cover image only. Additional camera angles have not been supplied yet.':'Cropped views of the same source photograph. Additional camera angles have not been supplied yet.'):escape(firstView.label)}</p></div><div class="store-detail__info"><span class="store-badge">${escape(m.status)}</span><h1>${escape(p.name)}</h1><p class="store-detail__intro">${escape(m.description)}</p><strong class="store-detail__price">${dealDisplay(p)}</strong><div class="store-option-label">Color <span id="selected-color-name">${escape(primary.name)}</span></div><div id="color-options" class="store-color-options" role="group" aria-label="Choose a color">${m.colors.map((x,i)=>`<button type="button" data-color="${x.id}" aria-label="${escape(x.name)}" title="${escape(x.name)}" aria-pressed="${i===0}" style="--swatch:${x.hex}"></button>`).join('')}</div><div class="store-option-label">Size <span id="selected-size-name">${escape(first)}</span></div><div id="size-options" class="store-size-options" role="group" aria-label="Choose a size">${m.sizes.map((x,i)=>`<button type="button" data-size="${escape(x)}" aria-pressed="${i===0}"${!variantAvailable(p,primary.id,x)?' disabled title="Unavailable"':''}>${escape(x)}</button>`).join('')}</div><p class="store-availability" id="stock-notice">Select your options to check demo availability.</p><div class="store-purchase-row"><div class="store-stepper" aria-label="Quantity"><button type="button" data-adjust="-1" aria-label="Decrease quantity">−</button><output id="detail-qty" aria-live="polite">1</output><button type="button" data-adjust="1" aria-label="Increase quantity">+</button></div><button type="button" id="detail-add" class="store-primary-btn" data-t02-add>Add to Cart <span aria-hidden="true">→</span></button></div><p class="store-form-error" id="detail-error" role="alert" hidden></p><div class="store-confirm-inline" id="detail-success" aria-live="polite"></div><p class="store-trust">Standalone storefront demonstration · No actual inventory or purchases.</p></div></section><div class="store-back-link"><a href="/search/?category=${encodeURIComponent(merchandisingCategory(p))}">← Back to ${escape(merchandisingCategory(p))}</a></div>`);
 let color=primary.id,size=first,qty=1;
 const colorWrap=$('color-options'),sizeWrap=$('size-options'),add=$('detail-add');
 const update=()=>{
  $('selected-color-name').textContent=m.colors.find(c=>c.id===color)?.name||'';$('selected-size-name').textContent=size;
  for(const b of colorWrap.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.color===color));
  for(const b of sizeWrap.querySelectorAll('button')){b.disabled=!variantAvailable(p,color,b.dataset.size);b.setAttribute('aria-pressed',String(b.dataset.size===size));}
  const available=variantAvailable(p,color,size);add.disabled=!available;
  $('stock-notice').textContent=available?'Available in this demo variant':'Unavailable combination — choose another color or size';
  $('detail-qty').textContent=String(qty); $('detail-success').textContent='';showError('detail-error','');
 };
 update();
 colorWrap.addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(!b)return;color=b.dataset.color;update()});
 sizeWrap.addEventListener('click',e=>{const b=e.target.closest('[data-size]');if(!b||b.disabled)return;size=b.dataset.size;update()});
 document.querySelectorAll('[data-adjust]').forEach(b=>b.addEventListener('click',()=>{qty=Math.max(1,Math.min(10,qty+Number(b.dataset.adjust)));update()}));
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.view),view=gallery[i];if(!view)return;document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const image=$('detail-main-image');image.src=imageUrl(view);image.alt=p.name+' · '+view.label;image.className=view.crop?'view-'+view.crop:'view-0';$('gallery-view-note').textContent=singlePhoto?(gallery.length===1?'Owner-supplied cover image only. Additional camera angles have not been supplied yet.':'Cropped views of the same source photograph. Additional camera angles have not been supplied yet.'):view.label;}));
 add.addEventListener('click',()=>{try{prepareCartBadge();const receipt=addCartItem({id:p.id,color,size,quantity:qty});setCartBadge();void playT02({button:add,quantity:receipt.count}).catch(()=>settleCartBadge());$('detail-success').innerHTML='Added to cart. <a href="/cart/">View cart →</a>';showError('detail-error','')}catch(err){settleCartBadge();showError('detail-error',err.message)}});
}
function cartPage(){
 mount(`<nav class="store-breadcrumb"><a href="/">Home</a> › Cart</nav><section class="store-page-heading"><span class="store-kicker">YOUR THREADS BAG</span><h1>Shopping Cart</h1><p>Review your selected demo products and variants.</p></section><div id="cart-content"></div>`);
 const container=$('cart-content');
 const render=()=>{
  const bag=cartSummary();
  if(!bag.count){container.innerHTML=`<div class="store-empty"><h2>Your cart is empty</h2><p>Find your next everyday essential.</p><a href="/search/" class="store-primary-btn">Browse products</a></div>`;setCartBadge();return}
  container.innerHTML=`<div class="store-cart-layout"><div class="store-cart-items">${bag.items.map(x=>{const p=x.product,m=productMeta(p),color=m.colors.find(c=>c.id===x.color);return `<article class="store-cart-line" data-cart-key="${escape([x.id,x.color,x.size].join('~'))}"><a href="${link(x.id)}"><img src="${imageUrl(p)}" alt="${escape(p.name)}"></a><div><a class="store-cart-line__title" href="${link(x.id)}">${escape(p.name)}</a><p>${escape(color?.name)} · Size ${escape(x.size)}</p><p>${x.savings?`<s>${money(p.price)}</s> `:""}${money(x.unitPrice)} each</p><button type="button" class="store-text-button" data-remove="${escape([x.id,x.color,x.size].join('~'))}">Remove</button></div><div class="store-cart-line__end"><strong>${money(x.subtotal)}</strong><div class="store-stepper"><button type="button" data-qty="-1" data-key="${escape([x.id,x.color,x.size].join('~'))}" aria-label="Decrease ${escape(p.name)}">−</button><output>${x.quantity}</output><button type="button" data-qty="1" data-key="${escape([x.id,x.color,x.size].join('~'))}" aria-label="Increase ${escape(p.name)}">+</button></div></div></article>`}).join('')}</div><aside class="store-summary"><h2>Order Summary</h2><div class="store-summary-line"><span>${bag.count} items</span><strong>${money(bag.total)}</strong></div><div class="store-summary-line" ${bag.savings?"":"hidden"}><span>Demo savings</span><strong>−${money(bag.savings)}</strong></div><div class="store-summary-line"><span>Demo delivery</span><span>Free</span></div><div class="store-summary-line store-summary-total"><span>Total</span><strong>${money(bag.total)}</strong></div><a class="store-primary-btn store-block" href="/checkout/">Proceed to Checkout →</a><p>Demo only. No real purchases or payment gateway.</p></aside></div><p class="store-form-error" id="cart-error" role="alert" hidden></p>`;
  container.querySelectorAll('[data-qty]').forEach(b=>b.addEventListener('click',()=>{try{let [id,color,size]=b.dataset.key.split('~');const old=bag.items.find(x=>x.id===id&&x.color===color&&x.size===size);updateCartItem({id,color,size},old.quantity+Number(b.dataset.qty));render()}catch(e){showError('cart-error',e.message)}}));
  container.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{let [id,color,size]=b.dataset.remove.split('~');removeCartItem({id,color,size});render()}));
  setCartBadge();
 };
 render();
}
function checkoutPage(){
 const bag=cartSummary();
 if(!bag.count){mount(`<div class="store-empty"><h1>Nothing to check out</h1><p>Your bag is empty or the demo payment has already completed.</p><a class="store-primary-btn" href="/search/">Browse products</a></div>`);return}
 resetAttempt();
 mount(`<nav class="store-breadcrumb"><a href="/cart/">Cart</a> › Checkout</nav>
 <section class="store-page-heading"><span class="store-kicker">TEST CHECKOUT — NO REAL CHARGES</span>
 <h1>Checkout</h1><p>Contact & Delivery → Card Details → Proceed to Pay → Confirmation</p></section>
 <div class="store-checkout-layout">
  <div class="t04-checkout-steps">
   <form id="checkout-form" class="store-checkout-form" autocomplete="on">
    <h2>1. Contact & delivery</h2>
    <div class="store-form-grid">
     <label>Full name<input name="name" required minlength="2" maxlength="80" autocomplete="name" placeholder="Your name"></label>
     <label>Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
     <label>Phone<input name="phone" type="tel" required minlength="8" autocomplete="tel" placeholder="01XXXXXXXXX"></label>
     <label>City<input name="city" required minlength="2" autocomplete="address-level2" placeholder="Dhaka"></label>
     <label class="store-col-span">Delivery address<textarea name="address" required minlength="5" autocomplete="street-address" placeholder="Street and building"></textarea></label>
    </div>
    <p class="store-form-error" id="checkout-error" role="alert" hidden></p>
    <button type="submit" id="continue-to-card" class="store-primary-btn store-block">Continue to Card Details →</button>
   </form>
   <section id="checkout-card-step" class="store-checkout-form" aria-labelledby="card-step-heading" hidden>
    <h2 id="card-step-heading">2. Card Details</h2>
    <p class="t04-test-warning"><strong>TEST CARDS ONLY — no real payments.</strong> Never enter a real card number or CVV. Enter sample text in every field; no real card details. Values are not sent to a payment provider or saved.</p>
    <form id="checkout-card-form" autocomplete="off">
     <div class="store-form-grid">
      <label class="store-col-span">Cardholder name<input name="demoCardholder" type="text" required autocomplete="off" placeholder="Sample name"></label>
      <label class="store-col-span">Card number <small>Any sample text</small>
       <input name="demoCardNumber" type="text" required autocomplete="off" placeholder="Sample card text"></label>
      <label>Expiration <small>Any sample text</small><input name="demoCardExpiry" type="text" required autocomplete="off" placeholder="Sample expiration"></label>
      <label>CVV <small>Any sample text</small><input name="demoCardCvv" type="password" required autocomplete="off" placeholder="Sample CVV"></label>
     </div>
     <p id="checkout-card-error" class="store-form-error" role="alert" hidden></p>
     <button type="button" id="back-to-contact" class="store-outline-btn">← Back to contact</button>
    </form>
   </section>
  </div>
  <aside class="store-summary"><h2>Your Order</h2>
   `+bag.items.map(x=>`<div class="store-checkout-line"><img src="${imageUrl(x.product)}" alt=""><div><strong>${escape(x.product.name)}</strong><p>${escape(productMeta(x.product).colors.find(c=>c.id===x.color)?.name)} / ${escape(x.size)} × ${x.quantity}</p></div><strong>${money(x.subtotal)}</strong></div>`).join('')+`
   ${bag.savings?`<div class="store-summary-line"><span>Flash Deals savings</span><strong>−${money(bag.savings)}</strong></div>`:""}
   <div class="store-summary-line store-summary-total"><span>Total</span><strong>${money(bag.total)}</strong></div>
   <button type="button" class="store-primary-btn store-block" id="proceed-payment" disabled>Proceed to Pay · ${money(bag.total)}</button>
   <p class="t04-summary-disclaimer">Demo simulation only · No money is charged.</p>
   <a href="/cart/" class="store-quiet-link">← Edit cart</a>
  </aside>
 </div>`);
 const form=$('checkout-form'),cardStep=$('checkout-card-step'),cardForm=$('checkout-card-form');
 const proceed=$('proceed-payment'),back=$('back-to-contact');
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  showError('checkout-error','');form.hidden=true;cardStep.hidden=false;
  cardForm.dispatchEvent(new Event('change',{bubbles:true}));cardForm.elements.demoCardholder.focus({preventScroll:true});
 });
 back.addEventListener('click',()=>{cardStep.hidden=true;form.hidden=false;cardForm.dispatchEvent(new Event('change',{bubbles:true}));form.elements.name.focus({preventScroll:true})});
 initT04PaymentOverlay({form,cardForm,proceed,showError:message=>{showError('checkout-error',message);showError('checkout-card-error',message)}});
 stabilizeCheckoutViewport({form,cardForm});
}
function orderPage(){
 const order=getOrder(args.get('ref'));
 if(!order){mount(`<section class="store-empty"><h1>No confirmed demo order</h1><p>An order confirmation appears only after a successful simulated payment. Failed, cancelled and incomplete transactions do not create orders.</p><a href="/cart/" class="store-primary-btn">Return to cart</a></section>`);return}
 mount(`<section class="store-order-confirmation"><div class="store-confirm-icon" aria-hidden="true">✓</div><span class="store-kicker">SUCCESSFUL DEMO TRANSACTION</span><h1>Order Confirmed</h1><p>Thank you for testing the THREADS storefront. No real payment was taken and no delivery will be made.</p><div class="store-order-paper"><div class="store-summary-line"><span>Order reference</span><strong>${escape(order.ref)}</strong></div><div class="store-summary-line"><span>Status</span><strong>Demo payment approved</strong></div><div class="store-summary-line"><span>Placed</span><span>${escape(new Date(order.createdAt).toLocaleString())}</span></div>${order.items.map(x=>{const p=catalogById[x.id];return p?`<div class="store-checkout-line"><img src="${imageUrl(p)}" alt=""><div><strong>${escape(p.name)}</strong><p>${escape(productMeta(p).colors.find(c=>c.id===x.color)?.name)} / ${escape(x.size)} × ${x.quantity}</p></div><strong>${money(x.price*x.quantity)}</strong></div>`:`<div class="store-checkout-line"><div><strong>Discontinued product</strong><p>Archived item × ${Number(x.quantity)||1}</p></div><strong>${money((Number(x.price)||0)*(Number(x.quantity)||1))}</strong></div>`}).join('')}<div class="store-summary-line store-summary-total"><span>Demo total</span><strong>${money(order.total)}</strong></div></div><a href="/search/" class="store-primary-btn">Return to shop →</a></section>`);
}
$('site-shell').innerHTML=header()+'<main id="page-main" class="store-main content-wrap"><div id="page-content"></div></main>'+footer();
// Exactly the homepage newsletter behavior: demo only, never collect addresses.
$('newsletter-form')?.addEventListener('submit',event=>{
 event.preventDefault();
 if(!event.currentTarget.reportValidity())return;
 $('newsletter-status').textContent='Thanks for exploring! This is a visual-only demo; your email has not been saved.';
 event.currentTarget.reset();
});
installArticulatedHeaderCart();initInlineSearch();installNavbarHeart();syncNavbarFavorites(getFavorites().size);setCartBadge();
window.addEventListener('threads:cartchange',setCartBadge);
window.addEventListener('storage',event=>{if(event.key===CART_KEY||event.key===null)setCartBadge()});
function syncAllFavoriteStates(){
 const saved=getFavorites();
 syncFavoriteButtons(document,saved);
 syncNavbarFavorites(saved.size);
}
window.addEventListener('threads:favoriteschange',syncAllFavoriteStates);
window.addEventListener('storage',event=>{if(event.key===FAVORITES_KEY||event.key===null)syncAllFavoriteStates()});
({search:searchPage,deals:dealsPage,product:detailPage,cart:cartPage,checkout:checkoutPage,order:orderPage}[page]||searchPage)();
