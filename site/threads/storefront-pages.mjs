import {catalog, catalogById, productMeta, productGallery, catalogFilters, merchandisingCategory, imageUrl, priceTk, safeHTML, searchCatalog,curateShopProducts} from './catalog.mjs';
import {initInlineSearch} from './search-header.mjs';
import {initT01Spotlight} from './t01-spotlight.mjs';
import {playT02} from './t02-fly-cart.mjs';
import {getCart,cartSummary,cartCount,addCartItem,updateCartItem,removeCartItem,variantAvailable,getFavorites,toggleFavorite,startDemoPayment,resolveDemoPayment,getAttempt,resetAttempt,getOrder} from './store-core.mjs';

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
 <div class="header-tools"><form id="search-area" class="inline-search" role="search" action="/search/" method="get" aria-hidden="true"><label class="sr-only" for="search-input">Search the Threads catalog</label><input id="search-input" type="search" name="q" placeholder="Search products…" autocomplete="off" tabindex="-1" aria-label="Search products"></form><button class="icon-btn" id="search-button" type="button" aria-label="Open product search" aria-expanded="false" aria-controls="search-area"><img class="header-icon" src="/assets/header-search.png" alt=""></button><a href="/search/?favorites=1" class="icon-btn" id="favorites-button" aria-label="Saved favorites"><img class="header-icon" src="/assets/header-favorite.png" alt=""></a><a href="/cart/" class="icon-btn bag-button" id="bag-button" aria-label="View shopping cart"><img class="header-icon" src="/assets/header-cart.png" alt=""><span class="bag-count" id="bag-count">${cartCount()}</span></a></div></div></header>`;
const footer=()=>`<footer class="site-footer store-site-footer"><div class="threads-footer-inner"><div class="threads-footer-top"><div class="threads-footer-brand"><a class="threads-footer-logo" href="/" aria-label="Threads home"><img src="/assets/threads-footer-logo-inverted.png" alt="THREADS" width="900" height="112"></a><p>Premium sneakers, bags and everyday essentials for a brighter everyday.</p></div><div class="threads-footer-newsletter"><span class="threads-footer-kicker">STAY CONNECTED</span><h2>Get Our News And Updates</h2><p>Standalone THREADS storefront · simulated checkout · no real payments.</p></div></div><nav class="threads-footer-nav" aria-label="Footer navigation"><div class="threads-footer-links"><h3>Shop</h3><a href="/search/?category=Sneakers">Sneakers</a><a href="/search/?category=Bags">Bags</a><a href="/search/?category=Accessories">Accessories</a></div><div class="threads-footer-links"><h3>About</h3><a href="/#about">Our Story</a></div><div class="threads-footer-links"><h3>Help</h3><a href="/cart/">Your Cart</a><a href="/checkout/">Checkout</a></div><div class="threads-footer-links"><h3>Company</h3><p class="threads-footer-legal">© 2026 THREADS · Demo preview</p></div></nav></div></footer>`;
const card=p=>`<article class="store-product-card" data-t01-card data-product-id="${escape(p.id)}"><a href="${link(p.id)}" class="store-product-card__link"><div class="store-product-card__media"><img src="${imageUrl(p)}" alt="${escape(p.name)}" loading="lazy"></div><span class="store-product-card__name">${escape(p.name)}</span><span class="store-product-card__subtitle">${escape(p.subtitle)}</span></a><div class="store-product-card__footer"><span class="store-price">${money(p.price)}</span><a class="store-small-link" href="${link(p.id)}">View details <span aria-hidden="true">→</span></a></div></article>`;
function mount(html){$('page-content').innerHTML=html}
function setCartBadge(){const c=$('bag-count');if(c)c.textContent=String(cartCount());const l=$('bag-button');if(l)l.setAttribute('aria-label','View shopping cart, '+cartCount()+' items')}
function searchPage(){
 const query=args.get('q')||'',category=args.get('category')||'',favorites=args.get('favorites')==='1';
 let activeCategory=category;
 mount(`<section class="store-page-heading"><div class="store-kicker">THREADS COLLECTION</div><h1>${favorites?'Saved favorites':'Discover your next essential'}</h1><p>Curated sneakers, headwear, travel bags and everyday accessories. Every item has its own details.</p></section><section class="store-search-toolbar"><form id="catalog-search-form" role="search"><label for="catalog-search">Search the collection</label><div class="store-search-row"><input type="search" id="catalog-search" name="q" value="${escape(query)}" placeholder="Try vintage sneakers…"><button type="submit" class="store-primary-btn">Search <span aria-hidden="true">→</span></button></div></form><div class="store-filter-row" aria-label="Product categories" id="catalog-filters">${catalogFilters.map(x=>`<button type="button" class="store-chip" data-category="${x.id}" aria-pressed="${(category||'All')===x.id}">${x.label}</button>`).join('')}</div></section><section class="store-catalog-results" aria-live="polite"><div class="store-results-top"><h2 id="results-title">Search Results</h2><span id="results-count"></span></div><div id="results-grid" class="store-results-grid" data-t01-results></div></section>`);
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
 }
 update(current,category);
 $('catalog-search-form').addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();syncUrl(q,activeCategory);update(q,activeCategory)});
 $('catalog-filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;const c=b.dataset.category==='All'?'':b.dataset.category;activeCategory=c;const q=input.value.trim();syncUrl(q,c);update(q,c)});
}
function detailPage(){
 const p=catalogById[args.get('id')];
 if(!p){mount(`<section class="store-empty"><h1>Product not found</h1><p>Return to the collection to find an available demo product.</p><a class="store-primary-btn" href="/search/">View collection</a></section>`);return}
 const m=productMeta(p),primary=m.colors[0],first=m.sizes[0],gallery=productGallery(p),firstView=gallery[0],singlePhoto=gallery.every(x=>!x.isAlternate);
 mount(`<nav class="store-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/search/?category=${encodeURIComponent(merchandisingCategory(p))}">${escape(merchandisingCategory(p))}</a><span>›</span>${escape(p.name)}</nav><section class="store-detail"><div class="store-detail__gallery"><div class="store-thumbnails" role="group" aria-label="Image views">${gallery.map((view,i)=>`<button type="button" data-view="${i}" aria-label="${escape(view.label)}" aria-pressed="${i===0}"><img class="${view.crop===1?'thumb-zoom':view.crop===2?'thumb-more':''}" src="${imageUrl(view)}" alt="${escape(p.name)} · ${escape(view.label)}"></button>`).join('')}</div><div class="store-detail__image" data-t02-image><img id="detail-main-image" class="view-0" src="${imageUrl(firstView)}" alt="${escape(p.name)} · ${escape(firstView.label)}"></div><p class="store-image-note" id="gallery-view-note">${singlePhoto?(gallery.length===1?'Owner-supplied cover image only. Additional camera angles have not been supplied yet.':'Cropped views of the same source photograph. Additional camera angles have not been supplied yet.'):escape(firstView.label)}</p></div><div class="store-detail__info"><span class="store-badge">${escape(m.status)}</span><h1>${escape(p.name)}</h1><p class="store-detail__intro">${escape(m.description)}</p><strong class="store-detail__price">${money(p.price)}</strong><div class="store-option-label">Color <span id="selected-color-name">${escape(primary.name)}</span></div><div id="color-options" class="store-color-options" role="group" aria-label="Choose a color">${m.colors.map((x,i)=>`<button type="button" data-color="${x.id}" aria-label="${escape(x.name)}" title="${escape(x.name)}" aria-pressed="${i===0}" style="--swatch:${x.hex}"></button>`).join('')}</div><div class="store-option-label">Size <span id="selected-size-name">${escape(first)}</span></div><div id="size-options" class="store-size-options" role="group" aria-label="Choose a size">${m.sizes.map((x,i)=>`<button type="button" data-size="${escape(x)}" aria-pressed="${i===0}"${!variantAvailable(p,primary.id,x)?' disabled title="Unavailable"':''}>${escape(x)}</button>`).join('')}</div><p class="store-availability" id="stock-notice">Select your options to check demo availability.</p><div class="store-purchase-row"><div class="store-stepper" aria-label="Quantity"><button type="button" data-adjust="-1" aria-label="Decrease quantity">−</button><output id="detail-qty" aria-live="polite">1</output><button type="button" data-adjust="1" aria-label="Increase quantity">+</button></div><button type="button" id="detail-add" class="store-primary-btn" data-t02-add>Add to Cart <span aria-hidden="true">→</span></button></div><p class="store-form-error" id="detail-error" role="alert" hidden></p><div class="store-confirm-inline" id="detail-success" aria-live="polite"></div><p class="store-trust">Standalone storefront demonstration · No actual inventory or purchases.</p></div></section><div class="store-back-link"><a href="/search/?category=${encodeURIComponent(merchandisingCategory(p))}">← Back to ${escape(merchandisingCategory(p))}</a></div>`);
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
 add.addEventListener('click',()=>{try{const receipt=addCartItem({id:p.id,color,size,quantity:qty});setCartBadge();void playT02({button:add,quantity:receipt.count});$('detail-success').innerHTML='Added to cart. <a href="/cart/">View cart →</a>';showError('detail-error','')}catch(err){showError('detail-error',err.message)}});
}
function cartPage(){
 mount(`<nav class="store-breadcrumb"><a href="/">Home</a> › Cart</nav><section class="store-page-heading"><span class="store-kicker">YOUR THREADS BAG</span><h1>Shopping Cart</h1><p>Review your selected demo products and variants.</p></section><div id="cart-content"></div>`);
 const container=$('cart-content');
 const render=()=>{
  const bag=cartSummary();
  if(!bag.count){container.innerHTML=`<div class="store-empty"><h2>Your cart is empty</h2><p>Find your next everyday essential.</p><a href="/search/" class="store-primary-btn">Browse products</a></div>`;setCartBadge();return}
  container.innerHTML=`<div class="store-cart-layout"><div class="store-cart-items">${bag.items.map(x=>{const p=x.product,m=productMeta(p),color=m.colors.find(c=>c.id===x.color);return `<article class="store-cart-line" data-cart-key="${escape([x.id,x.color,x.size].join('~'))}"><a href="${link(x.id)}"><img src="${imageUrl(p)}" alt="${escape(p.name)}"></a><div><a class="store-cart-line__title" href="${link(x.id)}">${escape(p.name)}</a><p>${escape(color?.name)} · Size ${escape(x.size)}</p><p>${money(p.price)} each</p><button type="button" class="store-text-button" data-remove="${escape([x.id,x.color,x.size].join('~'))}">Remove</button></div><div class="store-cart-line__end"><strong>${money(x.subtotal)}</strong><div class="store-stepper"><button type="button" data-qty="-1" data-key="${escape([x.id,x.color,x.size].join('~'))}" aria-label="Decrease ${escape(p.name)}">−</button><output>${x.quantity}</output><button type="button" data-qty="1" data-key="${escape([x.id,x.color,x.size].join('~'))}" aria-label="Increase ${escape(p.name)}">+</button></div></div></article>`}).join('')}</div><aside class="store-summary"><h2>Order Summary</h2><div class="store-summary-line"><span>${bag.count} items</span><strong>${money(bag.total)}</strong></div><div class="store-summary-line"><span>Demo delivery</span><span>Free</span></div><div class="store-summary-line store-summary-total"><span>Total</span><strong>${money(bag.total)}</strong></div><a class="store-primary-btn store-block" href="/checkout/">Proceed to Checkout →</a><p>Demo only. No real purchases or payment gateway.</p></aside></div><p class="store-form-error" id="cart-error" role="alert" hidden></p>`;
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
 mount(`<nav class="store-breadcrumb"><a href="/cart/">Cart</a> › Checkout</nav><section class="store-page-heading"><span class="store-kicker">SECURE DEMONSTRATION</span><h1>Demo Checkout</h1><p>No actual card details, charges, or deliveries. Test the transaction state machine below.</p></section><div class="store-checkout-layout"><form id="checkout-form" class="store-checkout-form"><h2>Contact & delivery</h2><div class="store-form-grid"><label>Full name<input name="name" required minlength="2" maxlength="80" autocomplete="name" placeholder="Your name"></label><label>Email address<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label><label>Phone<input name="phone" type="tel" required minlength="8" autocomplete="tel" placeholder="01XXXXXXXXX"></label><label>City<input name="city" required minlength="2" autocomplete="address-level2" placeholder="Dhaka"></label><label class="store-col-span">Delivery address<textarea name="address" required minlength="5" autocomplete="street-address" placeholder="Street and building"></textarea></label></div><h2>Demo payment</h2><div class="store-demo-method"><strong>Simulated digital payment</strong><p>The demo does not use any real payment processor. It does not store or transmit contact information. You will choose the simulated outcome after starting the transaction.</p></div><p class="store-form-error" id="checkout-error" role="alert" hidden></p><button type="submit" class="store-primary-btn store-block" id="begin-payment" data-t04-stage="idle">Start Demo Payment · ${money(bag.total)}</button></form><aside class="store-summary"><h2>Your Order</h2>${bag.items.map(x=>`<div class="store-checkout-line"><img src="${imageUrl(x.product)}" alt=""><div><strong>${escape(x.product.name)}</strong><p>${escape(productMeta(x.product).colors.find(c=>c.id===x.color)?.name)} / ${escape(x.size)} × ${x.quantity}</p></div><strong>${money(x.subtotal)}</strong></div>`).join('')}<div class="store-summary-line store-summary-total"><span>Total</span><strong>${money(bag.total)}</strong></div><a href="/cart/" class="store-quiet-link">← Edit cart</a></aside></div><section id="payment-stage" class="store-payment-stage" data-t04-stage="idle" aria-live="polite"><h2>Payment status: Idle</h2><p>Fill in delivery details, then start the demo payment.</p></section>`);
 const stage=$('payment-stage'),form=$('checkout-form'),start=$('begin-payment');
 const renderStatus=(status,message='')=>{
  stage.dataset.t04Stage=status;start.dataset.t04Stage=status;
  if(status==='pending'){
   start.disabled=true;
   stage.innerHTML=`<span class="store-badge">Processing · Demo</span><h2>Payment pending</h2><p>Choose a simulated result. This is not a live bank transaction.</p><div class="store-payment-actions"><button type="button" id="simulate-success" class="store-primary-btn">Approve demo payment</button><button type="button" id="simulate-fail" class="store-outline-btn">Simulate failure</button><button type="button" id="simulate-cancel" class="store-outline-btn">Cancel payment</button></div>`;
   stage.querySelector('#simulate-success').addEventListener('click',()=>resolve('succeeded'));
   stage.querySelector('#simulate-fail').addEventListener('click',()=>resolve('failed'));
   stage.querySelector('#simulate-cancel').addEventListener('click',()=>resolve('cancelled'));
  }else if(status==='failed'||status==='cancelled'){
   start.disabled=false;
   stage.innerHTML=`<span class="store-badge">${status==='failed'?'Failed':'Cancelled'} · Demo</span><h2>${status==='failed'?'Payment failed':'Payment cancelled'}</h2><p>${escape(message||'No order was created or charged. Correct your details and try again.')}</p><button type="button" class="store-outline-btn" id="try-again">Try again</button>`;
   stage.querySelector('#try-again').addEventListener('click',()=>{resetAttempt();renderStatus('idle')});
  }else{
   start.disabled=false;stage.innerHTML='<h2>Payment status: Idle</h2><p>Only a simulated successful payment creates a confirmation.</p>';
  }
 };
 const resolve=result=>{try{const a=resolveDemoPayment(result);if(result==='succeeded')window.location.replace('/order/?ref='+encodeURIComponent(a.ref));else renderStatus(result,'No order was created or charged. You can retry your simulated transaction.')}catch(err){showError('checkout-error',err.message)}};
 form.addEventListener('submit',e=>{
  e.preventDefault(); if(!form.reportValidity())return;
  try{const fields=Object.fromEntries(new FormData(form));startDemoPayment(fields);showError('checkout-error','');renderStatus('pending');stage.scrollIntoView({behavior:'auto',block:'center'})}catch(err){showError('checkout-error',err.message)}
 });
}
function orderPage(){
 const order=getOrder(args.get('ref'));
 if(!order){mount(`<section class="store-empty"><h1>No confirmed demo order</h1><p>An order confirmation appears only after a successful simulated payment. Failed, cancelled and incomplete transactions do not create orders.</p><a href="/cart/" class="store-primary-btn">Return to cart</a></section>`);return}
 mount(`<section class="store-order-confirmation"><div class="store-confirm-icon" aria-hidden="true">✓</div><span class="store-kicker">SUCCESSFUL DEMO TRANSACTION</span><h1>Order Confirmed</h1><p>Thank you for testing the THREADS storefront. No real payment was taken and no delivery will be made.</p><div class="store-order-paper"><div class="store-summary-line"><span>Order reference</span><strong>${escape(order.ref)}</strong></div><div class="store-summary-line"><span>Status</span><strong>Demo payment approved</strong></div><div class="store-summary-line"><span>Placed</span><span>${escape(new Date(order.createdAt).toLocaleString())}</span></div>${order.items.map(x=>{const p=catalogById[x.id];return p?`<div class="store-checkout-line"><img src="${imageUrl(p)}" alt=""><div><strong>${escape(p.name)}</strong><p>${escape(productMeta(p).colors.find(c=>c.id===x.color)?.name)} / ${escape(x.size)} × ${x.quantity}</p></div><strong>${money(x.price*x.quantity)}</strong></div>`:''}).join('')}<div class="store-summary-line store-summary-total"><span>Demo total</span><strong>${money(order.total)}</strong></div></div><a href="/search/" class="store-primary-btn">Return to shop →</a></section>`);
}
$('site-shell').innerHTML=header()+'<main id="page-main" class="store-main content-wrap"><div id="page-content"></div></main>'+footer();
initInlineSearch();setCartBadge();
window.addEventListener('threads:cartchange',setCartBadge);
window.addEventListener('storage',setCartBadge);
({search:searchPage,product:detailPage,cart:cartPage,checkout:checkoutPage,order:orderPage}[page]||searchPage)();