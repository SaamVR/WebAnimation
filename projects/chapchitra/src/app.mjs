import { installStickyViewportDiagnostics } from './nav-sticky-guard.mjs';
import { ARTIST_CART_STORAGE_KEY, ARTIST_CART_MAX_ITEMS, priceArtistCustomization, readArtistDemoBag, formatArtistBDT } from './worktable-pricing.mjs';
async function boot(){
 // Artist route critical path begins concurrently with all site shell modules.
 // SHA-pinned manifests may be cached; unknown manifest paths cannot.
 const artistPage=document.body.dataset.page==='artists-edit';
 const artistManifestURL=document.body.dataset.reviewManifest||'/assets/worktable/manifest.json';
 const artistManifestPending=artistPage
  ? fetch(artistManifestURL,{
     cache:/^\/releases\/[0-9a-f]{40}\/manifest\.json$/.test(artistManifestURL)?'default':'no-store'
    }).then(response=>{
     if(!response.ok)throw Error('HTTP '+response.status+' at worktable manifest');
     return response.json();
    }).then(entries=>({entries}),error=>({error}))
  : null;
 const artistModulePending=artistPage
  ? import('./worktable-studio.mjs').then(mod=>({mod}),error=>({error}))
  : null;
 if(artistPage && !document.querySelector('link[data-cc-worktable]')){
  const sheet=document.createElement('link');
  sheet.rel='stylesheet';
  sheet.href=document.body.dataset.reviewStudioCss||'/worktable-studio.css';
  sheet.dataset.ccWorktable='ready';
  document.head.append(sheet);
 }
 const artistShellModules=artistPage?Promise.all([
  import('./components.mjs'),import('./handdrawn-buttons.mjs'),
  import('./polaroid-outline.mjs'),import('./catalog.mjs')
 ]):null;
 const early=artistShellModules?await artistShellModules:null;
 const {shirtSilhouette,printSilhouette}=early?early[0]:await import('./components.mjs');
 const {sketchButton}=early?early[1]:await import('./handdrawn-buttons.mjs');
 const {installPolaroidOutlines}=early?early[2]:await import('./polaroid-outline.mjs');
 installPolaroidOutlines(document);
 // Attach the dedicated sketch skin after the approved storefront stylesheet.
 if(!document.querySelector('link[data-chapchitra-buttons]')){
  const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/button-system.css';sheet.dataset.chapchitraButtons='';document.head.append(sheet);
 }
 const {catalog,articlePreviews,PAGE_SIZE_HOME,PAGE_SIZE_SHOP}=early?early[3]:await import('./catalog.mjs');
 // Price sorting becomes available only after every catalog item has a real finite
 // numeric price. The current demo catalog contains null prices.
 const shopHasVerifiedPrices=catalog.length>0&&catalog.every(item=>
  typeof item.price==='number'&&Number.isFinite(item.price)&&item.price>=0);
 const $=(sel,root=document)=>root.querySelector(sel);
 const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const route=document.body.dataset.page||'home';
 const qs=new URLSearchParams(location.search);
 const mediaReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const icon=(type)=>({
  search:'<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.6 15.6 5.1 5.1"/>',
  heart:'<path d="M12 21 3.5 12.4C-1 7.7 6 1 12 7.1c6-6.1 13-0.6 8.5 5.3Z"/>',
  account:'<circle cx="12" cy="7.5" r="3.3"/><path d="M5.5 20v-1.7c0-3.1 2.4-5.2 6.5-5.2s6.5 2.1 6.5 5.2V20"/>',
  bag:'<path d="M4.5 8h15l1.3 12H3.2L4.5 8Z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  truck:'<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  return:'<path d="M8 7 3 12l5 5M3 12h12a6 6 0 1 1 0 12" transform="translate(0 -3)"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  support:'<path d="M3 12a9 9 0 1 1 18 0M3 12v5a2 2 0 0 0 2 2h2v-7H3Zm18 0v7h-4v-7h4ZM17 20c-1 1-3 2-6 2"/>'
 }[type]||'');
 const svg=(name)=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icon(name)+'</svg>';
 const categories=[
  {id:'regular-tees',title:'Regular Tees',desc:'A classic everyday canvas'},
  {id:'drop-shoulder',title:'Drop Shoulder',desc:'An easy, relaxed silhouette'},
  {id:'tie-dye',title:'Tie-Dye',desc:'Color and hand-made exploration'}
 ];
 const bellRendered=false; // No existing authentication integration. Remain logged out.
 function announcement(){return '<aside class="announcement" aria-label="Store announcement"><span>Free delivery on orders over ৳2000 · Join the list for early access to new drops</span></aside>'}
 function header(){
  // Three equal-side CSS grid tracks place the middle link at the mathematical
  // viewport center, regardless of left-side links or right-side icon widths.
  // The approved wordmark is cropped directly from the supplied transparent logo.
  // Keep the image centered by the existing three-column grid; never substitute
  // a font approximation for the original custom lettering.
  return '<header class="site-header" id="siteHeader"><div class="header-line wrap">'+
   '<div class="nav-left">'+
   '<nav class="nav-center" aria-label="Main navigation"><a href="/shop/">Shop</a>'+
   '<a href="/artists-edit/">Artist’s Edit</a><a href="/journal/">Journal</a><a href="/about/">About Us</a></nav>'+
   '<button type="button" class="nav-icon hamburger" id="menuButton" aria-label="Open navigation" aria-expanded="false" aria-controls="mobileNav">'+svg('menu')+'</button></div>'+ 
   '<a href="/" class="logo-word logo-word--image" aria-label="CHAPCHITRA home"><img src="/assets/chapchitra-wordmark.webp" width="1400" height="316" alt="" aria-hidden="true" decoding="async" fetchpriority="high"><span class="c08-navbar-animation" aria-hidden="true"></span></a>'+
   '<div class="nav-actions">'+
   '<button type="button" class="nav-icon" id="searchButton" aria-label="Open search" aria-expanded="false" aria-controls="searchPanel">'+svg('search')+'</button>'+
   '<a class="nav-icon nav-optional-action" href="/favorites/" aria-label="Favorites">'+svg('heart')+'</a>'+
   '<a class="nav-icon nav-optional-action" href="/account/" aria-label="Account">'+svg('account')+'</a>'+
   '<a class="nav-icon bag-link" href="/bag/" aria-label="Demo shopping bag, '+demoBagCount()+' items">'+svg('bag')+'<span class="bag-count">'+demoBagCount()+'</span></a><span class="sr-only" role="status" aria-live="polite" id="bagStatus"></span>'+
   (bellRendered?'<button class="nav-icon" aria-label="Notifications"></button>':'')+
   '</div></div>'+
   '<div id="searchPanel" class="search-panel" hidden><form class="wrap search-form" action="/shop/" method="get" role="search"><label for="globalSearch">Search the demo catalogue</label><div class="search-inline"><input id="globalSearch" name="q" type="search" placeholder="Search sample prints, fits, and collections" autocomplete="off">'+sketchButton({label:'Search',variant:'compact',tone:'forest',className:'cc-sketch--inline',type:'submit'})+'</div><small>Demo records only. No real inventory.</small></form></div>'+
   '<nav id="mobileNav" class="mobile-nav" aria-label="Mobile navigation" hidden><a href="/shop/">Shop</a><a href="/artists-edit/">Artist’s Edit</a><a href="/journal/">Journal</a><a href="/about/">About Us</a><a href="/favorites/">Favorites</a><a href="/account/">Account</a></nav></header>';
 }
 const paperVisual=(i)=>'<div class="art-plate art-plate-'+(i%3)+'">'+(i%2===0?shirtSilhouette(i):printSilhouette(i))+'<span class="plate-disclaimer">Illustration placeholder</span></div>';
 const linkFiltered=(category,audience)=>'/shop/?category='+encodeURIComponent(category)+(audience?'&audience='+audience:'');
 function hero(){
  const slides=[
   {title:'Art you can wear.',eyebrow:'PEOPLE · PLACES · PRINTS',copy:'A home for art, illustration and printmaking. Collection imagery is being prepared.',cta:'Discover the studio',href:'/about/'},
   {title:'Artist-Inspired Drop',eyebrow:'02 / ARTIST-INSPIRED',copy:'Discover where drawings meet wearable surfaces. This is a structural preview of an upcoming collection.',cta:'Explore the collection',href:'/shop/?print=illustration'},
   {title:'Color, by hand.',eyebrow:'03 / TIE-DYE',copy:'Inspired by the slow, expressive making of hand-dyed textiles.',cta:'Explore Tie-Dye',href:'/shop/?category=tie-dye'},
   {title:'Your idea, printed.',eyebrow:"04 / ARTIST'S EDIT",copy:'A dedicated space to plan custom printing, from garment choice to print approach.',cta:"Explore Artist's Edit",href:'/artists-edit/'},
   {title:'From the Journal',eyebrow:'05 / TODAY’S STORY',copy:'Read the studio notebook. Original articles and photography will be supplied later.',cta:'Open featured story',href:'/journal/story/?slug=prints-and-people'}
  ];
  return '<section id="hero" class="hero-carousel" aria-label="Five-slide editorial hero"><div class="hero-track">'+slides.map((s,i)=>{
   if(i===0)return '<article class="hero-slide hero-cover '+(i===0?'is-active':'')+'" data-slide="'+i+'" '+(i===0?'':'hidden')+'><img class="hero-background" src="/assets/hero-paper.svg" alt="Abstract green ink and paper placeholder background"><div class="hero-shade"></div><div class="wrap hero-cover-inner"><p class="eyebrow on-dark">'+s.eyebrow+'</p><img class="hero-brand-lockup" src="/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp" width="1250" height="1052" alt="CHAPCHITRA textile symbol and custom wordmark" decoding="async" fetchpriority="high"><div id="c08HeroStage" class="c08-hero-stage"></div><h1>'+s.title+'</h1><p>'+s.copy+'</p>'+sketchButton({label:s.cta,variant:'compact',tone:'beige',href:s.href})+'</div></article>';
   return '<article class="hero-slide hero-split" data-slide="'+i+'" hidden><div class="wrap hero-split-inner"><div class="hero-slide-copy"><p class="eyebrow">'+s.eyebrow+'</p><h2>'+s.title+'</h2><p>'+s.copy+'</p>'+sketchButton({label:s.cta,variant:'compact',tone:'forest',href:s.href})+'</div><div class="hero-visual hero-visual-'+i+'">'+(i===2?printSilhouette(i):i===4?'<div class="paper-editorial"><span>JOURNAL / STORY 01</span><strong>Notes from<br>the studio.</strong><span>Draft illustration</span></div>':shirtSilhouette(i))+'<span class="hero-placeholder">IMAGE / ART PENDING</span></div></div></article>'
  }).join('')+'</div><div class="hero-controls wrap"><div class="hero-dots" role="group" aria-label="Choose hero slide">'+slides.map((s,i)=>'<button class="hero-dot'+(i===0?' active':'')+'" type="button" data-slide-to="'+i+'" aria-label="Show slide '+(i+1)+': '+esc(s.title)+'" aria-pressed="'+(i===0?'true':'false')+'"></button>').join('')+'</div><span class="hero-count" id="heroCount">01 / 05</span></div></section>';
 }
 function benefits(){
  // Owner-approved one-line feature labels. Approved icon artwork/timing remain unchanged.
  const items=[
   ['Original Art & Customization','icon-01-print-care-v4.webp'],
   ['Secure & Flexible Payment','icon-02-easy-payment-v2.webp'],
   ['Fast Delivery','icon-03-delivery-v2.webp'],
   ['24/7 Support','icon-04-order-support-v2.webp']
  ];
  return '<section id="benefits" class="benefit-section" aria-labelledby="benefitsTitle"><h2 class="sr-only" id="benefitsTitle">Service benefits</h2><div class="wrap c01-stage" data-c01><svg class="c01-connectors" aria-hidden="true" focusable="false"></svg><div class="c01-steps">'+items.map(([label,poster])=>
   '<article class="c01-step"><div class="c01-icon-shell" aria-hidden="true"><div class="c01-icon"><img class="c01-poster" src="/assets/c01/posters/'+poster+'" width="512" height="512" alt="" decoding="async"><div class="c01-lottie" aria-hidden="true"></div></div></div><div class="c01-copy"><h3>'+esc(label)+'</h3></div></article>').join('')+'</div></div></section>';
 }
 function titleBlock(label,title,desc){return '<div class="section-title"><div><p class="eyebrow">'+label+'</p><h2>'+title+'</h2></div><p>'+desc+'</p></div>'}
 function categoriesSection(){
  return '<section id="categories" class="section-pad wrap" aria-labelledby="categoriesTitle">'+titleBlock('01 / SHOP BY FIT','Shop by category','Wearable art in familiar silhouettes, awaiting the final product catalogue.')+
  '<div class="category-grid">'+categories.map((cat,i)=>'<article class="category-card"><div class="category-image">'+shirtSilhouette(i)+'<span class="proof-tag">Sample silhouette</span></div><div class="category-copy"><h3>'+cat.title+'</h3><p>'+cat.desc+'</p><div class="filter-chips" aria-label="'+cat.title+' filters"><a href="'+linkFiltered(cat.id,'')+'">All</a><a href="'+linkFiltered(cat.id,'men')+'">Men</a><a href="'+linkFiltered(cat.id,'women')+'">Women</a></div></div></article>').join('')+'</div></section>';
 }
 function productCard(item){
  const liked=isFavoriteNow(item.id);
  // Separate the clickable merchandise action from the paper frame. Only the
  // inner Polaroid receives the approved alternating hover transform.
  const tone=Number(item.visual)%4;
  return '<article class="product-card product-card-shell" data-product-id="'+item.id+'" data-photo-tone="'+tone+'">'+
   '<div class="polaroid-card">'+
    '<div class="polaroid-photo"><a href="/product/?id='+item.id+'" class="product-visual" aria-label="View '+esc(item.name)+' sample detail">'+
     shirtSilhouette(item.visual)+'<span class="proof-tag">DEMO / NO STOCK</span></a></div>'+
    '<div class="product-meta polaroid-caption"><div class="polaroid-caption-head">'+
     '<a class="polaroid-name" href="/product/?id='+item.id+'"><strong>'+esc(item.name)+'</strong></a>'+
     '<button type="button" class="favorite-toggle'+(liked?' liked':'')+'" data-favorite="'+item.id+'" aria-pressed="'+liked+'" aria-label="'+(liked?'Remove':'Add')+' '+esc(item.name)+' '+(liked?'from':'to')+' favorites">'+svg('heart')+'</button>'+
    '</div><span class="polaroid-fit">'+esc(item.fit)+'</span>'+
    '<div class="product-price"><small>'+esc(item.subtitle)+'</small><b>Tk —</b></div></div>'+
   '</div>'+
   '<div class="polaroid-card-action">'+
     sketchButton({label:'ADD TO BAG',variant:'long',tone:'forest',className:'product-add-button',attrs:'data-add-to-bag="'+item.id+'" aria-label="Add '+esc(item.name)+' to demo bag"'})+
   '</div></article>';
 }
 function pager(total,current,scope){
  if(total<=1)return '';
  const choices=new Set([1,2,3,total,current-1,current,current+1].filter(i=>i>0&&i<=total));
  const sorted=[...choices].sort((a,b)=>a-b);
  let prev=0;
  const numbers=sorted.map(n=>{const gap=n-prev>1?'<span class="pager-ellipsis" aria-hidden="true">…</span>':'';prev=n;return gap+'<button type="button" data-pager="'+scope+'" data-page-number="'+n+'"'+(n===current?' aria-current="page" class="page-current"':'')+'>'+n+'</button>'}).join('');
  return '<nav class="pager" aria-label="'+scope+' page navigation"><button type="button" data-pager="'+scope+'" data-page-number="'+Math.max(1,current-1)+'" '+(current===1?'disabled':'')+' aria-label="Previous page">‹</button>'+numbers+'<button type="button" data-pager="'+scope+'" data-page-number="'+Math.min(total,current+1)+'" '+(current===total?'disabled':'')+' aria-label="Next page">›</button></nav>';
 }
 function collection(){
  return '<section id="collection" class="section-pad wrap" aria-labelledby="collectionTitle">'+titleBlock('02 / THE COLLECTION','Our Collection','Eight sample placements per page. Actual photography, product names and prices require approval.')+
   '<div id="homeProducts" class="product-grid"></div><div id="homePager"></div><div class="section-actions"><a class="text-link" href="/shop/">View All Samples ↗</a></div></section>';
 }

 // Static, background-only printed-edge layers; no content clipping or animation.
 // Fixed-size SVG strips keep individual bristle marks at a stable CSS-pixel scale.
 function printedEdgeSurface(featured=false){
  const sides=featured?'':'<i class="cc-printed-left"></i><i class="cc-printed-right"></i>';
  return '<div class="cc-printed-surface'+(featured?' cc-printed-surface--featured':'')+'" aria-hidden="true">'+
   '<i class="cc-printed-center"></i><i class="cc-printed-top"></i><i class="cc-printed-bottom"></i>'+sides+'</div>';
 }

 function banners(){
  return '<section id="banners" class="section-pad wrap editorial-banners" aria-label="Two editorial collection banners"><article class="editorial-banner tie-banner">'+printedEdgeSurface()+'<div class="banner-editorial-copy"><p class="eyebrow">THE PROCESS / COLOR</p><h2>Color has<br>its own rhythm.</h2><p>An introduction to layered dye, handcrafted variation and creative surfaces.</p>'+sketchButton({label:'Explore hand-dye studies',variant:'long',tone:'terracotta',href:'/shop/?category=tie-dye',className:'editorial-cta'})+'</div><div class="banner-art-panel banner-art-tie" aria-label="Temporary tie-dye illustration on a dark-clay panel"><span class="banner-icon-ring"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M8 3L3 6l2 4 2-1v11h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0Z"/><circle cx="12" cy="13" r="3"/><circle cx="12" cy="13" r="1"/></svg></span><small>Tie-dye artwork pending</small></div></article><article class="editorial-banner edit-banner">'+printedEdgeSurface()+'<div class="banner-editorial-copy"><p class="eyebrow">MADE FOR YOU</p><h2>Make it<br>your artwork.</h2><p>Choose a shape, plan the imprint, and build a custom-printing inquiry.</p>'+sketchButton({label:"Visit Artist's Edit",variant:'long',tone:'beige',href:'/artists-edit/',className:'editorial-cta'})+'</div><div class="banner-art-panel banner-art-edit" aria-label="Temporary printmaking stamp illustration on a walnut-brown panel"><span class="banner-icon-ring"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12V8a2 2 0 1 1 4 0v4M5 18v-3h14v3H5ZM4 21h16M9 12h6"/></svg></span><small>Custom print artwork pending</small></div></article></section>';
 }
 function featured(){
  return '<section id="featured" class="section-pad featured-zone" aria-labelledby="featuredTitle">'+printedEdgeSurface(true)+'<div class="wrap">'+titleBlock('03 / THE GALLERY','Featured Prints','Five framed slots reserved for owner-supplied artwork and inspiration credits.')+
   '<div class="featured-wide"><div id="featuredFrames" class="featured-stage" role="group" tabindex="0" aria-roledescription="carousel" aria-label="Featured print studies. Select cards or use left and right arrow keys." aria-describedby="featuredHint"></div>'+
   '<div class="featured-controls"><button type="button" id="featuredPrev" aria-label="Previous featured print">‹</button><div id="featuredCaption" class="sr-only" aria-live="polite" aria-atomic="true"></div><button type="button" id="featuredNext" aria-label="Next featured print">›</button></div></div>'+
   '<p id="featuredHint" class="sr-only">Select side cards or swipe to change print · Sample imagery and prices are pending</p></div></section>';
 }
 function values(){
  const items=[['01','Stories You Can Wear','An illustrated canvas for everyday storytelling.'],['02','Rooted in Bengal','A place for local culture and creative observation.'],['03','Made Through Print','Marks, materials and the studio process.'],['04','Wear It Your Way','Find a silhouette or customize your own.']];
  return '<section id="values" class="section-pad wrap" aria-labelledby="valuesTitle">'+titleBlock('04 / OUR POINT OF VIEW','Four ideas. One studio.','Large independent artwork slots prepared for future C01 SVG animation components.')+
   '<div class="values-grid">'+items.map(([num,title,desc],i)=>'<article class="value-card" data-motion-slot="C01-'+num+'"><div class="value-art" aria-label="Temporary illustration frame for '+title+'"><span class="value-num">'+num+'</span><div class="value-print-motif motif-'+i+'"><span></span><span></span></div><small>Illustration pending</small></div><h3>'+title+'</h3><p>'+desc+'</p></article>').join('')+'</div></section>';
 }
 function story(){
  return '<section id="story" class="story-section" aria-labelledby="storyTitle"><div class="wrap story-top"><div><p class="eyebrow">05 / THE STORY</p><h2 id="storyTitle">People. Places. <em>Prints.</em></h2></div><div class="story-summary"><p>CHAPCHITRA brings printmaking, illustration and everyday apparel into one evolving creative conversation. The full studio history and identity artwork will be added with approved brand copy.</p>'+sketchButton({label:'Read Our Story',variant:'compact',tone:'terracotta',href:'/about/'})+'</div></div><a class="street-link" href="/about/#street-story" aria-label="Learn more about the street-scene inspiration"><img src="/assets/street-bengal.svg" alt="Provisional line illustration of a Bangladeshi street with a tea stall, shops and a rickshaw."><span class="street-note">Bangladesh street illustration study · Explore the story ↗</span></a></section>';
 }
 // Owner must provide exact CHAPCHITRA profile URLs before these become links.
 // Empty URLs render accessible, non-interactive artwork rather than fake destinations.
 const footerSocialProfiles=[
  ['Instagram', '', '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.4"/><circle cx="12" cy="12" r="4.15"/><circle cx="17.65" cy="6.45" r="1.05" fill="currentColor" stroke="none"/></svg>'],
  ['Facebook', '', '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" fill="currentColor"><path d="M13.97 21.5v-8.2h2.8l.42-3.24h-3.22V7.99c0-.94.27-1.58 1.61-1.58h1.72V3.52a23.24 23.24 0 0 0-2.52-.13c-2.5 0-4.21 1.52-4.21 4.31v2.36H7.75v3.24h2.82v8.2h3.4Z"/></svg>'],
  ['TikTok', '', '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" fill="currentColor"><path d="M15.68 2.4h3.04c.23 2.16 1.5 3.48 3.28 3.64v3.13a9.46 9.46 0 0 1-3.27-.93v6.17c0 4.46-2.91 7.09-6.59 7.09a6.37 6.37 0 0 1-6.55-6.42c0-3.89 3.39-6.77 7.5-6.25v3.34a3.26 3.26 0 1 0 2.59 3.19V2.4Z"/></svg>']
 ];
 function footerSocials(){
  return '<div class="footer-socials" role="group" aria-label="CHAPCHITRA social platforms">'+
   footerSocialProfiles.map(([name,url,icon])=>url
    ? '<a class="footer-social-entry" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" aria-label="CHAPCHITRA on '+name+'">'+icon+'</a>'
    : '<span class="footer-social-entry footer-social-unlinked" role="img" aria-label="'+name+' profile link unavailable">'+icon+'</span>'
   ).join('')+'</div>';
 }
 function footer(){
  const discover=[['Artist’s Edit','/artists-edit/'],['Journal','/journal/'],['About Us','/about/']];
  // Support, Terms and Contact have no implemented destinations. Render text
  // only; never send visitors to 404s, demo checkout, or invented URLs.
  const help=['Support','Terms & Conditions','Contact Us'];
  return '<footer class="site-footer" id="footer"><div class="wrap footer-grid">'+
   '<div class="footer-identity"><a class="logo-word logo-word--footer" href="/" aria-label="CHAPCHITRA home"><img src="/assets/chapchitra-wordmark-cream-terra.webp" width="1400" height="316" alt="" aria-hidden="true" loading="lazy" decoding="async"></a><p>PEOPLE · PLACES · PRINTS</p>'+footerSocials()+'</div>'+
   '<nav class="footer-column footer-nav-discover" aria-labelledby="footerDiscover"><h2 id="footerDiscover">Discover</h2>'+
   discover.map(([title,href])=>'<a href="'+href+'">'+title+'</a>').join('')+'</nav>'+
   '<div class="footer-column footer-nav-help" aria-labelledby="footerHelp"><h2 id="footerHelp">Help</h2>'+
   help.map(label=>'<span class="footer-help-pending" aria-label="'+label+' page not yet available">'+label+'</span>').join('')+'</div>'+
   '<div class="footer-illustration-space" aria-hidden="true"></div></div>'+
   '<div class="wrap footer-bottom"><span>© 2026 CHAPCHITRA · V3 architectural prototype</span><span>No orders, payments or subscriptions are processed.</span></div></footer>';
 }
 function home(){return hero()+benefits()+categoriesSection()+collection()+banners()+featured()+values()+story()}
 const pageTop=(kicker,title,desc)=>'<section class="route-head wrap"><p class="eyebrow">'+kicker+'</p><h1>'+title+'</h1><p>'+desc+'</p></section>';
 function shop(){
  const categoryOptions=[{value:'',label:'All Products'},...categories.map(c=>({value:c.id,label:c.id==='regular-tees'?'Regular':c.title}))];
  // UI vocabulary only; do not imply these options exist in the demo inventory.
  const sizeOptions=['S','M','L','XL','XXL'];
  const colorOptions=['black','white','red','yellow','green','blue'];
  const categoryGroup='<fieldset class="shop-filter-group shop-filter-group--category"><legend>Category</legend><div class="shop-filter-options">'+
   categoryOptions.map((o,i)=>'<label class="shop-filter-option"><input type="radio" name="shopCategory" value="'+o.value+'"'+(!i?' checked':'')+'><span>'+o.label+'</span></label>').join('')+
   '</div></fieldset>';
  const priceGroup='<fieldset class="shop-filter-group shop-filter-group--price"><legend>Price</legend>'+
   '<div class="shop-filter-options"><label class="shop-filter-option"><input type="radio" name="shopPriceOrder" value="default" checked><span>Default / Featured</span></label>'+
   '<label class="shop-filter-option'+(shopHasVerifiedPrices?'':' shop-filter-option--disabled')+'"><input type="radio" name="shopPriceOrder" value="price-asc"'+(shopHasVerifiedPrices?'':' disabled')+'><span>Price: Low to High</span></label>'+
   '<label class="shop-filter-option'+(shopHasVerifiedPrices?'':' shop-filter-option--disabled')+'"><input type="radio" name="shopPriceOrder" value="price-desc"'+(shopHasVerifiedPrices?'':' disabled')+'><span>Price: High to Low</span></label></div>'+
   (shopHasVerifiedPrices?'':'<p class="shop-price-unavailable" role="note">Price sorting is unavailable until approved prices are added.</p>')+
   '</fieldset>';
  const sizeGroup='<fieldset class="shop-filter-group shop-filter-group--size"><legend>Size</legend><div class="shop-size-options">'+
   sizeOptions.map(size=>'<label class="shop-size-option" title="Size '+size+'"><input type="checkbox" name="shopSize" value="'+size+'" aria-label="Size '+size+'"><span>'+size+'</span></label>').join('')+
   '</div></fieldset>';
  const colorGroup='<fieldset class="shop-filter-group shop-filter-group--color"><legend>Color</legend><div class="shop-color-options">'+
   colorOptions.map(color=>'<label class="shop-color-option" data-color="'+color+'" title="'+color[0].toUpperCase()+color.slice(1)+'"><input type="checkbox" name="shopColor" value="'+color+'" aria-label="'+color[0].toUpperCase()+color.slice(1)+'"><span class="shop-color-dot" aria-hidden="true"></span></label>').join('')+
   '</div></fieldset>';
  return '<section class="shop-banner" aria-labelledby="shopBannerTitle"><div class="wrap shop-banner-inner">'+
   '<div class="shop-banner-copy"><p class="eyebrow">CHAPCHITRA · THE COLLECTION</p><h1 id="shopBannerTitle">Shop All</h1>'+
   '<p>Explore garment and print studies made for everyday expression. Original product photography and pricing are coming soon.</p></div>'+
   '<div class="shop-banner-art" aria-label="Placeholder for future collection artwork"><div class="shop-banner-art-frame">'+shirtSilhouette(0)+
   '<span>COLLECTION ARTWORK PENDING</span></div></div></div></section>'+
   '<section class="shop-listing wrap" aria-label="Browse products">'+
   '<div id="shopFilterBackdrop" class="shop-filter-backdrop" hidden></div>'+
   '<div class="shop-layout"><aside id="shopFilterSidebar" class="shop-sidebar" aria-labelledby="shopFilterTitle" tabindex="-1">'+
   '<div class="shop-sidebar-head"><h2 id="shopFilterTitle">Filters</h2><button id="closeShopFilters" class="shop-filter-close" type="button" aria-label="Close filters">×</button></div>'+
   '<form id="shopFilterForm">'+categoryGroup+priceGroup+sizeGroup+colorGroup+
   '<p class="shop-filter-metadata-note">Size and color are previews. Product-specific details have not been supplied.</p>'+
   '<button type="button" id="clearFilters" class="shop-clear-filters">Clear Filters</button></form></aside>'+
   '<div class="shop-results" id="shopResults"><div class="shop-result-toolbar">'+
   '<div class="shop-result-heading"><p class="eyebrow">THE COLLECTION</p><h2 id="shopCollectionTitle">All Products</h2>'+
   '<p id="filterSummary" aria-live="polite"></p></div>'+
   '<div class="shop-result-actions"><button type="button" id="openShopFilters" class="shop-filter-trigger" aria-controls="shopFilterSidebar" aria-expanded="false">Filters</button>'+
   '<label class="shop-sort-label" for="shopSort">Sort by<select id="shopSort"><option value="default">Default order</option>'+
   '<option value="name-asc">Name: A–Z</option><option value="name-desc">Name: Z–A</option></select></label></div></div>'+
   '<div class="product-grid shop-product-grid" id="shopProducts"></div><div id="shopPager"></div>'+
   '<p class="shop-listing-footnote">Sample product studies only. Prices, stock and final imagery are not yet available.</p>'+
   '</div></div></section>';
 }
 function artistsEdit(){
  // Retain the existing async worktable mount point only. The one semantic
  // (visually hidden) page heading is rendered inside the worktable itself.
  // No visible route heading, hero, spacer or scroll intervention.
  return '<section class="customize-layout" hidden aria-hidden="true"></section>';
 }
 function journal(){
  return pageTop('STORIES / PROCESS','The Journal','A structural editorial collection. Feature rotation and individual pages work; final story copy is pending.')+
  '<section class="wrap route-content"><div class="journal-spotlight" id="journalSpotlight" aria-label="Featured story carousel"><div id="journalFeatured"></div><div class="journal-controls"><button id="journalPrevious" type="button" aria-label="Previous featured article">‹</button><span id="journalIndex">01 / 05</span><button id="journalNext" type="button" aria-label="Next featured article">›</button></div></div><div class="section-title"><div><p class="eyebrow">INDEX</p><h2>From the notebook</h2></div><p>Click through to individual article study pages.</p></div><div class="journal-grid">'+articlePreviews.map((a,i)=>'<article class="journal-card"><div class="journal-thumb">'+printSilhouette(i)+'</div><p class="eyebrow">'+a.eyebrow+'</p><h3><a href="/journal/story/?slug='+a.slug+'">'+a.title+'</a></h3><p>'+a.teaser+'</p><a class="text-link" href="/journal/story/?slug='+a.slug+'">Read the outline ↗</a></article>').join('')+'</div></section>';
 }
 function article(){
  const slug=qs.get('slug')||articlePreviews[0].slug;
  const a=articlePreviews.find(x=>x.slug===slug);
  if(!a)return pageTop('JOURNAL','Story unavailable','The requested studio outline does not exist.')+'<div class="wrap route-content">'+sketchButton({label:'Return to Journal',variant:'compact',tone:'forest',href:'/journal/'})+'</div>';
  return '<article class="wrap article-detail route-content"><p class="eyebrow">'+a.eyebrow+'</p><h1>'+a.title+'</h1><p class="lead">'+a.teaser+'</p><div class="article-art">'+printSilhouette(articlePreviews.indexOf(a))+'</div><h2>Editorial outline</h2><p>This page reserves space for the original writing, process photographs and artist context associated with this story. The final article has not been supplied and this copy is intentionally not presented as researched reporting.</p><a href="/journal/" class="text-link">← All journal stories</a></article>';
 }
 function about(){
  return pageTop('PEOPLE · PLACES · PRINTS','The Living Print Studio','CHAPCHITRA is an evolving editorial vision for wearable art, illustration and printmaking in a Bangladeshi creative context.')+
  '<section class="wrap route-content about-layout"><div><p class="eyebrow">OUR PERSPECTIVE</p><h2>Culture, drawn into everyday life.</h2><p>People, places, and prints form the framework for the studio’s visual world. This page is a foundation for the owner-approved origin story, original artwork and printmaking references.</p><p>Until final copy arrives, we avoid inventing a founder biography, workshop location or sourcing claims.</p><a class="text-link" href="/journal/">Read the Journal ↗</a></div><div class="about-visual">'+printSilhouette(2)+'</div></section><section id="street-story" class="wrap route-content"><h2>Scenes from the street</h2><p>The street scene is a static placeholder with separate rickshaw-wheel and tea-stall-steam artwork integration points reserved for later animation approvals.</p><img class="about-street" src="/assets/street-bengal.svg" alt="Provisional illustrated Bangladesh street scene including a rickshaw and tea stall."></section>';
 }
 function product(){
  const item=catalog.find(p=>p.id===qs.get('id'))||catalog[0];
  const related=catalog.filter(p=>p.id!==item.id&&p.category.some(c=>item.category.includes(c))).slice(0,4);
  return '<section class="wrap route-content detail-layout"><div class="detail-art">'+shirtSilhouette(item.visual)+'</div><div><p class="eyebrow">SAMPLE PRODUCT · NOT FOR SALE</p><h1>'+esc(item.name)+'</h1><p>'+esc(item.subtitle)+'</p><p>'+esc(item.fit)+' · '+item.audience.map(esc).join(' / ')+'</p><h2>Tk — <small>Price not provided</small></h2><p>Neutral silhouette only; there are no physical product photographs or available stock in this preview.</p>'+sketchButton({label:'ADD TO BAG',variant:'long',tone:'forest',className:'product-add-button detail-add-button',attrs:'data-add-to-bag="'+item.id+'" aria-label="Add '+esc(item.name)+' to demo bag"'})+sketchButton({label:isFavoriteNow(item.id)?'Remove from Favorites':'Save to Favorites',variant:'compact',tone:'beige',attrs:'data-favorite="'+item.id+'"'})+'<a href="/shop/" class="text-link">Continue exploring ↗</a><p class="route-disclaimer">Demo cart only. No stock, prices, checkout, payment or orders are available.</p></div></section>'+
   '<section class="wrap route-content related-studies" aria-labelledby="relatedTitle"><div class="section-title"><div><p class="eyebrow">KEEP EXPLORING</p><h2 id="relatedTitle">Related studies</h2></div><p>More sample silhouettes from the same category.</p></div><div class="product-grid" id="relatedProducts">'+related.map(productCard).join('')+'</div></section>';
 }
 function bag(){
  return pageTop('SESSION-ONLY DEMO','Your Demo Bag','Sample studies and local custom-garment estimates for preview only. No real order can be placed.')+
   '<section class="wrap route-content demo-bag-section"><div id="bagItems" aria-live="polite"></div><div class="demo-bag-summary"><p id="bagQuantitySummary"></p><p>Sample catalog prices and availability are pending. Artist’s Edit estimates are temporary. No checkout, payment or order submission is enabled.</p>'+sketchButton({label:'Keep browsing',variant:'compact',tone:'forest',href:'/shop/'})+'</div></section>';
 }
 function favorites(){
  return pageTop('YOUR SAVED STUDIES','Favorites','Selections are stored locally in this browser; no account or server sync.')+'<section class="wrap route-content"><div id="favoriteGrid" class="product-grid"></div><p id="favoriteEmpty"></p></section>';
 }
 function emptyRoute(kicker,title,description,secondary){
  return pageTop(kicker,title,description)+'<section class="wrap route-content empty-panel"><p>'+secondary+'</p>'+sketchButton({label:'Explore Samples',variant:'compact',tone:'forest',href:'/shop/'})+'</section>';
 }
 function mainPage(){
  switch(route){
   case 'home':return home();
   case 'shop':return shop();
   case 'artists-edit':return artistsEdit();
   case 'journal':return journal();
   case 'article':return article();
   case 'about':return about();
   case 'product':return product();
   case 'favorites':return favorites();
   case 'account':return emptyRoute('GUEST MODE','Your Account','Authentication has not been integrated, so every visitor is treated as logged out.','There is no login, customer profile, notification bell or order history in this structural demo.');
   case 'bag':return bag();
   case 'checkout':return emptyRoute('NOT A LIVE PAYMENT PAGE','Checkout Preview','No payment integrations, order creation, or real inventory are connected.','This route remains an explicit informational placeholder and never collects sensitive payment details.');
   case 'confirmation':return emptyRoute('NO ORDER PLACED','Order Confirmation Preview','This demo has not created, charged, or confirmed an order.','After a future authorized commerce workflow, an actual order confirmation would appear here.');
   default:return emptyRoute('NOT FOUND','Page unavailable','The destination was not found.','Return to the demo storefront.');
  }
 }
 const app=$('#app');
 // A session-only UI state for the demo; never treat these placeholders as merchandise.
 const demoBagKey='chapchitra-session-demo-bag-v1';
 let demoBag=new Map();
 try{
  const rows=JSON.parse(sessionStorage.getItem(demoBagKey)||'[]');
  if(Array.isArray(rows))for(const row of rows){
   if(Array.isArray(row)&&catalog.some(p=>p.id===row[0])&&Number.isInteger(row[1])&&row[1]>0&&row[1]<=99)demoBag.set(row[0],row[1]);
  }
 }catch{}
   let artistDemoBag=[];
  try{artistDemoBag=readArtistDemoBag(JSON.parse(sessionStorage.getItem(ARTIST_CART_STORAGE_KEY)||'[]'))}catch{}
  function demoBagCount(){return [...demoBag.values()].reduce((sum,qty)=>sum+qty,0)+artistDemoBag.length}
 let favoritesState=new Set();
 try{const saved=JSON.parse(localStorage.getItem('chapchitra-v3-sample-favorites')||'[]');if(Array.isArray(saved))favoritesState=new Set(saved.filter(s=>catalog.some(p=>p.id===s)))}catch{}
 if(!app)throw Error('App root missing');
 app.innerHTML=announcement()+header()+'<main id="main">'+mainPage()+'</main>'+footer();
 // Native CSS sticky handles alignment; optional ?navdebug=1 is read-only.
 installStickyViewportDiagnostics(document, window);
 // Global navigation and keyboard behavior.
 const search=$('#searchPanel'),searchButton=$('#searchButton');
 const mobileNav=$('#mobileNav'),menuButton=$('#menuButton');
 const toggle=(el,trigger,show)=>{el.hidden=!show;trigger.setAttribute('aria-expanded',String(show));};
 searchButton.addEventListener('click',()=>{const show=search.hidden;toggle(search,searchButton,show);
  if(show){toggle(mobileNav,menuButton,false);$('#globalSearch').focus()}
  else searchButton.focus();
 });
 menuButton.addEventListener('click',()=>{const show=mobileNav.hidden;toggle(mobileNav,menuButton,show);
  if(show)toggle(search,searchButton,false);
 });
 const compactNav=window.matchMedia('(max-width:740px)');
 compactNav.addEventListener('change',()=>{toggle(mobileNav,menuButton,false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){
  if(!search.hidden){toggle(search,searchButton,false);searchButton.focus()}
  else if(!mobileNav.hidden){toggle(mobileNav,menuButton,false);menuButton.focus()}
 }});
 document.addEventListener('pointerdown',e=>{
  if(!mobileNav.hidden&&!mobileNav.contains(e.target)&&!menuButton.contains(e.target)){
   toggle(mobileNav,menuButton,false);
  }
 });
 // Proper email validation, but never a simulated successful submission.
 let renderHomeCollection=()=>{},renderShop=()=>{},renderFavoriteGrid=()=>{};
 function isFavoriteNow(id){return favoritesState.has(id)}
 // Favorites loaded before page rendering and refreshed only on user intent.
 function updateFav(id){
  if(favoritesState.has(id))favoritesState.delete(id);else favoritesState.add(id);
  try{localStorage.setItem('chapchitra-v3-sample-favorites',JSON.stringify([...favoritesState]))}catch{}
  // Preserve the live product grid and keyboard focus: update hearts in-place.
  const liked=favoritesState.has(id);
  $$('[data-favorite]').filter(btn=>btn.dataset.favorite===id).forEach(btn=>{
   btn.classList.toggle('liked',liked);
   btn.setAttribute('aria-pressed',String(liked));
   if(btn.classList.contains('favorite-toggle')){
    const label=catalog.find(p=>p.id===id)?.name||'sample';
    btn.setAttribute('aria-label',(liked?'Remove ':'Add ')+label+(liked?' from':' to')+' favorites');
   }
  });
  if(route==='favorites')renderFavoriteGrid();
  if(route==='product'){
   const btn=$('[data-favorite]');if(btn)btn.querySelectorAll('.cc-sketch-label,.cc-sketch-label-ink').forEach(label=>{label.textContent=liked?'Remove from Favorites':'Save to Favorites'});
  }
 }
 // Session-only sample bag: accurate quantity state, immediate button feedback, and no commerce.
 const clickResetTimers=new WeakMap();
 // C03 remains visual-only: prewarm catalog routes and lazily load any future Add control.
 let c03Ready=null;
 function loadC03(){
  return c03Ready ||= import('/motion/c03/fly-to-bag.mjs')
   .then(mod=>{void mod.warmC03();return mod}).catch(()=>null);
 }
 if(['home','shop','product','favorites'].includes(route))void loadC03();
 function persistDemoBag(){
  try{sessionStorage.setItem(demoBagKey,JSON.stringify([...demoBag.entries()]))}catch{}
 }
 function updateBagCounter(){
  const count=demoBagCount(),link=$('.bag-link');
  link.querySelector('.bag-count').textContent=String(count);
  link.setAttribute('aria-label','Demo shopping bag, '+count+' item'+(count===1?'':'s'));
 }
 function setDemoBagQty(id,qty){
  if(!catalog.some(item=>item.id===id))return;
  const next=Math.max(0,Math.min(99,qty));
  if(next)demoBag.set(id,next);else demoBag.delete(id);
  persistDemoBag();updateBagCounter();
 }
 function renderDemoBag(){
  if(route!=='bag')return;
  const entries=[...demoBag.entries()].map(([id,qty])=>({item:catalog.find(p=>p.id===id),qty})).filter(x=>x.item);
     const sampleMarkup=entries.map(({item,qty})=>
   '<article class="demo-bag-row" data-bag-row="'+item.id+'"><a class="demo-bag-thumb" href="/product/?id='+item.id+'" aria-label="View '+esc(item.name)+'">'+shirtSilhouette(item.visual)+'</a><div class="demo-bag-info"><h3><a href="/product/?id='+item.id+'">'+esc(item.name)+'</a></h3><p>'+esc(item.fit)+' · Tk — · Sample only</p><div class="demo-bag-stepper" aria-label="Quantity for '+esc(item.name)+'"><button type="button" data-bag-adjust="-1" data-bag-id="'+item.id+'" aria-label="Decrease '+esc(item.name)+' quantity">−</button><output aria-label="Quantity">'+qty+'</output><button type="button" data-bag-adjust="1" data-bag-id="'+item.id+'" aria-label="Increase '+esc(item.name)+' quantity"'+(qty===99?' disabled':'')+'>+</button></div><button type="button" class="demo-bag-remove" data-bag-remove="'+item.id+'">Remove</button></div></article>'
     ).join('');
   const sideDetails=side=>side.hasArtwork?
    side.preset+' ('+side.dimensionsMm.join(' × ')+' mm)':
    'No artwork';
   const customMarkup=artistDemoBag.map(({id,selection})=>{
    const price=selection.pricing,front=selection.front,back=selection.back;
    return '<article class="demo-bag-row cc-artist-demo-bag-row" data-artist-bag-row="'+esc(id)+'">'+
     '<div class="cc-artist-bag-mark" aria-hidden="true">ARTIST’S EDIT</div>'+
     '<div class="demo-bag-info"><h3>'+esc(price.garmentLabel)+' · Custom print</h3>'+
     '<p>Size '+esc(selection.size)+' · '+esc(selection.color)+' fabric</p>'+
     '<p><strong>'+formatArtistBDT(price.total)+'</strong> · Placeholder estimate</p>'+
     '<details class="cc-artist-bag-breakdown"><summary>Customization details</summary>'+
      '<p>Garment: '+formatArtistBDT(price.base)+'</p>'+
      '<p>Front: '+esc(sideDetails(front))+' · '+formatArtistBDT(price.front.charge)+'</p>'+
      '<p>Back: '+esc(sideDetails(back))+' · '+formatArtistBDT(price.back.charge)+'</p>'+
      '<p>Front artwork: '+(front.hasArtwork?'yes':'no')+' · Back artwork: '+(back.hasArtwork?'yes':'no')+'</p>'+
      '<p>Placement (front): x '+front.editor.x+', y '+front.editor.y+', size '+front.editor.adjustment+'%, rotation '+front.editor.rotation+'°</p>'+
      '<p>Placement (back): x '+back.editor.x+', y '+back.editor.y+', size '+back.editor.adjustment+'%, rotation '+back.editor.rotation+'°</p>'+
     '</details>'+
     '<button type="button" class="demo-bag-remove" data-remove-artist-bag="'+esc(id)+'">Remove customization</button>'+
     '</div></article>';
   }).join('');
   $('#bagItems').innerHTML=sampleMarkup+customMarkup||'<p class="demo-bag-empty">Your demo bag is empty. Explore the shop or customize a garment in Artist’s Edit.</p>';
  const n=demoBagCount();
     $('#bagQuantitySummary').textContent=n+' '+(n===1?'item':'items')+' in this browser-session demo bag. Uploaded artwork files are not stored here. Totals are temporary and not payable.';
 }
  document.addEventListener('chapchitra:artist-demo-add',event=>{
   const status=$('#worktableBagStatus');
   try{
    if(artistDemoBag.length>=ARTIST_CART_MAX_ITEMS)throw Error('Demo bag is full (20 customizations).');
    const selection=priceArtistCustomization(event.detail?.selection);
    const id='custom_'+(crypto.randomUUID?crypto.randomUUID():String(Date.now())+'_'+Math.random().toString(36).slice(2));
    const next=[...artistDemoBag,{id,selection}];
    // Commit only after browser session storage succeeds; image bytes/object URLs
    // never leave the editor and no checkout/order API is called.
    sessionStorage.setItem(ARTIST_CART_STORAGE_KEY,JSON.stringify(next));
    artistDemoBag=readArtistDemoBag(next);
    updateBagCounter();
    if(status){
     status.replaceChildren('Configuration saved. ');
     const link=document.createElement('a');link.href='/bag/';link.textContent='View demo bag';
     status.append(link);
    }
   }catch(error){
    if(status)status.textContent='Not saved: '+String(error?.message||'browser storage unavailable').slice(0,100);
   }
  });
  document.addEventListener('click',e=>{
   const customRemove=e.target.closest('[data-remove-artist-bag]');
   if(customRemove&&route==='bag'){
    const id=customRemove.dataset.removeArtistBag;
    const next=artistDemoBag.filter(row=>row.id!==id);
    try{
     sessionStorage.setItem(ARTIST_CART_STORAGE_KEY,JSON.stringify(next));
     artistDemoBag=next;updateBagCounter();renderDemoBag();
     ($('[data-remove-artist-bag]')||$('.demo-bag-summary a'))?.focus();
    }catch{ $('#bagQuantitySummary').textContent='Unable to update demo bag in this browser session.';}
    return;
   }
   const add=e.target.closest('[data-add-to-bag]');
  if(add){
   const item=catalog.find(p=>p.id===add.dataset.addToBag);if(!item)return;
   const previous=demoBag.get(item.id)||0;
   setDemoBagQty(item.id,previous+1);
   const count=demoBag.get(item.id);
   // Exactly one flight per successful catalog increment; resolve its clicked source.
   // Bag mutation, limits, feedback and announcements are unchanged.
   if(count>previous){
    void loadC03().then(mod=>mod?.playC03({button:add,productId:item.id})).catch(()=>{});
   }
   const labels=add.querySelectorAll('.cc-sketch-label,.cc-sketch-label-ink');
   if(labels.length){
    const old=clickResetTimers.get(add);if(old)clearTimeout(old);
    labels.forEach(label=>label.textContent=count===previous?'LIMIT REACHED':'ADDED');
    add.classList.add('added');
    clickResetTimers.set(add,setTimeout(()=>{if(add.isConnected){labels.forEach(label=>label.textContent='ADD TO BAG');add.classList.remove('added')}},950));
   }
   $('#bagStatus').textContent=count===previous?'Demo bag item limit reached.':item.name+' added to demo bag. '+demoBagCount()+' total items. No purchase is possible.';
   return;
  }
  const adjust=e.target.closest('[data-bag-adjust]');
  if(adjust&&route==='bag'){
   const id=adjust.dataset.bagId;const current=demoBag.get(id)||0;
   setDemoBagQty(id,current+Number(adjust.dataset.bagAdjust));
   renderDemoBag();
   const button=$('[data-bag-row="'+id+'"] [data-bag-adjust="'+adjust.dataset.bagAdjust+'"]')||
    $('[data-bag-adjust]')||$('.demo-bag-summary a');
   if(button)button.focus();
   return;
  }
  const remove=e.target.closest('[data-bag-remove]');
  if(remove&&route==='bag'){
   setDemoBagQty(remove.dataset.bagRemove,0);renderDemoBag();
   const next=$('[data-bag-adjust]')||$('.demo-bag-summary a');if(next)next.focus();
  }
 });
 if(route==='bag')renderDemoBag();
 // Global delegation (no card flicker from full grid rebuild except explicit favorite interaction).
 document.addEventListener('click',e=>{const btn=e.target.closest('[data-favorite]');if(btn)updateFav(btn.dataset.favorite)});
 // Navigation dropdown closes when leaving or using Escape.

 // Hero rotation, exactly one timer. Keyboard focus and pointer hover pause.
 if(route==='home'){
  const c01Stage=$('#benefits .c01-stage');
  const c01Initialized=c01Stage
   ? import('./motion/c01/connected-benefits.mjs')
      .then(({mountConnectedBenefits})=>mountConnectedBenefits(c01Stage))
      .catch(err=>console.warn('C01 static benefits retained:',err))
   : Promise.resolve();
  const heroRoot=$('#hero'),slides=$$('.hero-slide',heroRoot),dots=$$('.hero-dot',heroRoot);
  let active=0,timer=null,hovered=false,focused=false,touchX=null;
  // Keep Slide 1 visible through the complete initial C08 4-second wordmark
  // sequence. Start the unchanged 4-second carousel interval only afterward.
  let heroLogoHolding=!mediaReduced.matches;
  function pauseHero(){if(timer!==null){clearInterval(timer);timer=null}}
  function canPlay(){return !heroLogoHolding&&!mediaReduced.matches&&!hovered&&!focused&&!document.hidden}
  function scheduleHero(){pauseHero();if(canPlay())timer=setInterval(()=>changeHero((active+1)%slides.length,false),4000)}
  function changeHero(index,manual){active=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.hidden=i!==active;s.classList.toggle('is-active',i===active)});dots.forEach((d,i)=>{d.classList.toggle('active',i===active);d.setAttribute('aria-pressed',String(i===active))});$('#heroCount').textContent=String(active+1).padStart(2,'0')+' / 05';if(manual)scheduleHero()}
  dots.forEach(dot=>dot.addEventListener('click',()=>changeHero(Number(dot.dataset.slideTo),true)));
  heroRoot.addEventListener('mouseenter',()=>{hovered=true;pauseHero()});
  heroRoot.addEventListener('mouseleave',()=>{hovered=false;scheduleHero()});
  heroRoot.addEventListener('focusin',()=>{focused=true;pauseHero()});
  heroRoot.addEventListener('focusout',()=>{focused=heroRoot.contains(document.activeElement);if(!focused)scheduleHero()});
  heroRoot.addEventListener('touchstart',e=>{if(e.touches.length===1)touchX=e.touches[0].clientX},{passive:true});
  heroRoot.addEventListener('touchend',e=>{if(touchX===null||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(dx)>55)changeHero(active+(dx<0?1:-1),true)},{passive:true});
  document.addEventListener('visibilitychange',scheduleHero);
  mediaReduced.addEventListener('change',scheduleHero);
  scheduleHero();
  // Let C01 register its existing IntersectionObserver first, so C08 can
  // reuse the same self-hosted lottie-web script if benefits are in viewport.
  // No C01 artwork, controller, styles, or activation times are changed.
  c01Initialized.then(()=>new Promise(done=>requestAnimationFrame(done)))
   .then(()=>import('/motion/c08/logo-player.mjs')).then(({mountC08})=>
    mountC08({
      navbar:$('.logo-word--image'),
      heroImage:$('.hero-brand-lockup'),
      heroStage:$('#c08HeroStage'),
      onHeroHolding:hold=>{heroLogoHolding=hold;if(hold)pauseHero();else scheduleHero()}
    })
  ).catch(error=>{
    heroLogoHolding=false;scheduleHero();
    console.warn('C08 retained the existing static logo:',error);
  });
  let homePage=1;
  renderHomeCollection=function(){
   const pages=Math.ceil(catalog.length/PAGE_SIZE_HOME);
   const block=catalog.slice((homePage-1)*PAGE_SIZE_HOME,homePage*PAGE_SIZE_HOME);
   $('#homeProducts').innerHTML=block.map(productCard).join('');
   $('#homePager').innerHTML=pager(pages,homePage,'collection');
   $$('[data-favorite]', $('#homeProducts')).forEach(b=>{const yes=isFavoriteNow(b.dataset.favorite);b.classList.toggle('liked',yes);b.setAttribute('aria-pressed',String(yes))});
  }
  $('#homePager').addEventListener('click',e=>{const btn=e.target.closest('[data-page-number]');if(!btn||btn.disabled)return;homePage=Number(btn.dataset.pageNumber);renderHomeCollection();$('#collection').scrollIntoView({behavior:mediaReduced.matches?'instant':'smooth',block:'start'})});
  renderHomeCollection();
  // Five real card nodes persist while positions animate; never rebuild the frames on selection.
  let focusedPrint=2;
  const featureNames=['Original Mark Study','Layered Colour Study','Everyday Print Study','Paper to Textile Study','Studio Composition Study'];
  const featureRoot=$('#featured'),featureStage=$('#featuredFrames');
  const featureMobile=window.matchMedia('(max-width:600px)');
  const FEATURE_INTERVAL_MS=8200; // Separate from hero timing.
  let featuredTimer=null,featuredHover=false,featuredFocus=false,featuredTouch=false,touchStartX=null,ignoreClickUntil=0;
  featureStage.innerHTML=featureNames.map((title,i)=>
   '<article class="feature-frame" data-feature-index="'+i+'" data-slot="far-left" aria-label="'+esc(title)+'">'+
    '<button type="button" class="feature-select" data-feature-select="'+i+'" aria-label="Select '+esc(title)+'" aria-pressed="false"><span class="feature-image">'+paperVisual(i)+'</span></button>'+
    '<div class="feature-product-info"><span class="feature-product-kicker">FEATURED PRINT · STUDY 0'+(i+1)+'</span>'+
    '<h3>'+esc(title)+'</h3><p>'+esc(catalog[i].fit)+' · Artist credit pending</p>'+
    '<div class="feature-product-bottom"><strong>Tk — <small>Price pending</small></strong><a class="feature-detail-link" href="/product/?id='+catalog[i].id+'" tabindex="-1">View Details ↗</a></div></div></article>'
  ).join('');
  const frames=$$('.feature-frame',featureStage);
  const slots=['center','near-right','far-right','far-left','near-left'];
  const stopFeatured=()=>{if(featuredTimer!==null){clearTimeout(featuredTimer);featuredTimer=null}};
  const canAutoFeatured=()=>!mediaReduced.matches&&!featuredHover&&!featuredFocus&&!featuredTouch&&!document.hidden;
  function scheduleFeatured(){
    stopFeatured();
    if(canAutoFeatured())featuredTimer=setTimeout(()=>{featuredTimer=null;selectFeatured(focusedPrint+1,false)},FEATURE_INTERVAL_MS);
  }
  function paintFeatured(){
    frames.forEach((frame,i)=>{
      const slot=slots[(i-focusedPrint+5)%5],active=i===focusedPrint;
      const hiddenOnMobile=featureMobile.matches&&slot.startsWith('far-');
      frame.dataset.slot=slot;
      frame.setAttribute('aria-current',String(active));
      const choice=frame.querySelector('.feature-select');
      choice.setAttribute('aria-pressed',String(active));
      choice.tabIndex=hiddenOnMobile?-1:0;
      const link=frame.querySelector('.feature-detail-link');
      link.tabIndex=active?0:-1;
      link.setAttribute('aria-hidden',String(!active));
    });
    $('#featuredCaption').innerHTML='<strong>'+esc(featureNames[focusedPrint])+'</strong><small>Artist / art-form credit pending · '+(focusedPrint+1)+' / 5</small>';
  }
  function selectFeatured(index,manual=true){
    focusedPrint=(index+featureNames.length)%featureNames.length;paintFeatured();scheduleFeatured();
  }
  featureStage.addEventListener('click',event=>{
    const btn=event.target.closest('[data-feature-select]');
    if(btn&&Date.now()>=ignoreClickUntil)selectFeatured(Number(btn.dataset.featureSelect));
  });
  $('#featuredPrev').addEventListener('click',()=>selectFeatured(focusedPrint-1));
  $('#featuredNext').addEventListener('click',()=>selectFeatured(focusedPrint+1));
  featureStage.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();selectFeatured(focusedPrint+(event.key==='ArrowRight'?1:-1));
    }
  });
  featureRoot.addEventListener('mouseenter',()=>{featuredHover=true;stopFeatured()});
  featureRoot.addEventListener('mouseleave',()=>{featuredHover=false;scheduleFeatured()});
  featureRoot.addEventListener('focusin',()=>{featuredFocus=true;stopFeatured()});
  featureRoot.addEventListener('focusout',()=>{featuredFocus=featureRoot.contains(document.activeElement);scheduleFeatured()});
  featureStage.addEventListener('touchstart',event=>{
    if(event.touches.length!==1)return;
    touchStartX=event.touches[0].clientX;featuredTouch=true;stopFeatured();
  },{passive:true});
  featureStage.addEventListener('touchend',event=>{
    if(touchStartX!==null&&event.changedTouches.length){
      const dx=event.changedTouches[0].clientX-touchStartX;
      if(Math.abs(dx)>=48){ignoreClickUntil=Date.now()+450;selectFeatured(focusedPrint+(dx<0?1:-1))}
    }
    touchStartX=null;featuredTouch=false;scheduleFeatured();
  },{passive:true});
  featureStage.addEventListener('touchcancel',()=>{touchStartX=null;featuredTouch=false;scheduleFeatured()},{passive:true});
  document.addEventListener('visibilitychange',scheduleFeatured);
  mediaReduced.addEventListener('change',scheduleFeatured);
  featureMobile.addEventListener('change',paintFeatured);
  paintFeatured();scheduleFeatured();
 }
 if(route==='shop'){
  const form=$('#shopFilterForm'),sidebar=$('#shopFilterSidebar'),backdrop=$('#shopFilterBackdrop');
  const openFilters=$('#openShopFilters'),closeFilters=$('#closeShopFilters'),sort=$('#shopSort');
  const allowedCategories=categories.map(c=>c.id);
  const allowedSizes=['S','M','L','XL','XXL'];
  const allowedColors=['black','white','red','yellow','green','blue'];
  // Supported future catalog data contract: item.sizes: string[] and
  // item.colors: string[]. These are product descriptors, not stock levels.
  // The current 64 demo studies have neither field; never infer them from
  // artwork colors, garment shapes, titles, or unrelated audience/print tags.
  const readChoice=name=>form.querySelector('input[name="'+name+'"]:checked')?.value||'';
  const readChecks=name=>$$('input[name="'+name+'"]:checked',form).map(input=>input.value);
  const setChoice=(name,value)=>{
   const options=$$('input[name="'+name+'"]',form);
   (options.find(input=>input.value===value)||options[0]).checked=true;
  };
  const setChecks=(name,values)=>{
   $$('input[name="'+name+'"]',form).forEach(input=>{input.checked=values.includes(input.value)});
  };
  const validated=(name,allowed)=>[...new Set(qs.getAll(name).filter(value=>allowed.includes(value)))];
  setChoice('shopCategory',allowedCategories.includes(qs.get('category'))?qs.get('category'):'');
  setChecks('shopSize',validated('size',allowedSizes));
  setChecks('shopColor',validated('color',allowedColors));
  setChoice('shopPriceOrder',shopHasVerifiedPrices&&['price-asc','price-desc'].includes(qs.get('sort'))?qs.get('sort'):'default');
  sort.value=['name-asc','name-desc'].includes(qs.get('sort'))?qs.get('sort'):'default';
  let pageNum=Math.max(1,Number.parseInt(qs.get('page')||'1',10)||1);
  const searchText=(qs.get('q')||'').trim().toLowerCase();
  const selected=()=>({
   category:readChoice('shopCategory'),
   sizes:readChecks('shopSize'),
   colors:readChecks('shopColor')
  });
  const activeSort=()=>{
   const priceOrder=readChoice('shopPriceOrder');
   return shopHasVerifiedPrices&&priceOrder!=='default'?priceOrder:sort.value;
  };
  const hasSizeMetadata=catalog.some(item=>Array.isArray(item.sizes)&&item.sizes.length>0);
  const hasColorMetadata=catalog.some(item=>Array.isArray(item.colors)&&item.colors.length>0);
  const hasMatchingData=(item,field,choices)=>{
   if(!choices.length)return true;
   if(!Array.isArray(item[field]))return false;
   // At least one chosen size/color may match (OR within each filter group).
   return item[field].some(value=>choices.includes(field==='colors'?String(value).toLowerCase():String(value).toUpperCase()));
  };
  function syncQuery(){
   const p=new URLSearchParams(),filters=selected();
   if(filters.category)p.set('category',filters.category);
   filters.sizes.forEach(size=>p.append('size',size));
   filters.colors.forEach(color=>p.append('color',color));
   if(searchText)p.set('q',searchText);
   if(activeSort()!=='default')p.set('sort',activeSort());
   if(pageNum>1)p.set('page',String(pageNum));
   history.replaceState(null,'',location.pathname+(p.toString()?'?'+p.toString():''));
  }
  renderShop=function(){
   const filters=selected();
   const metadataPending=(filters.sizes.length&&!hasSizeMetadata)||(filters.colors.length&&!hasColorMetadata);
   const filtered=catalog.filter(item=>
    (!filters.category||item.category.includes(filters.category))&&
    hasMatchingData(item,'sizes',filters.sizes)&&
    hasMatchingData(item,'colors',filters.colors)&&
    (!searchText||[item.name,item.fit,item.subtitle,item.print].some(value=>value.toLowerCase().includes(searchText))));
   // Sorting operates on the full filtered array before pagination.
   if(activeSort()==='price-asc')filtered.sort((a,b)=>a.price-b.price);
   else if(activeSort()==='price-desc')filtered.sort((a,b)=>b.price-a.price);
   else if(activeSort()==='name-asc')filtered.sort((a,b)=>a.name.localeCompare(b.name));
   else if(activeSort()==='name-desc')filtered.sort((a,b)=>b.name.localeCompare(a.name));
   const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE_SHOP));
   pageNum=Math.min(pageNum,pages);
   const visible=filtered.slice((pageNum-1)*PAGE_SIZE_SHOP,pageNum*PAGE_SIZE_SHOP);
   $('#shopProducts').innerHTML=visible.length?visible.map(productCard).join(''):
    '<p class="no-results">'+(metadataPending?
     'Size and color details have not been supplied for these samples. No verified matches can be shown yet. Clear size or color selections to browse the catalog.':
     'No sample products match these filters. Try another selection or clear filters.')+'</p>';
   $('#shopPager').innerHTML=visible.length?pager(pages,pageNum,'shop'):'';
   const title=filters.category?(filters.category==='regular-tees'?'Regular':categories.find(category=>category.id===filters.category)?.title):'All Products';
   $('#shopCollectionTitle').textContent=title||'All Products';
   $('#filterSummary').textContent=metadataPending?
    '0 verified matches · Size/color details pending':
    filtered.length+' sample '+(filtered.length===1?'product':'products')+(searchText?' matching “'+searchText+'”':'');
   syncQuery();
  };
  form.addEventListener('change',event=>{
   if(event.target.name==='shopPriceOrder')sort.value='default';
   pageNum=1;renderShop();
  });
  form.addEventListener('submit',event=>event.preventDefault());
  sort.addEventListener('change',()=>{
   setChoice('shopPriceOrder','default');
   pageNum=1;renderShop();
  });
  $('#clearFilters').addEventListener('click',()=>{
   setChoice('shopCategory','');setChecks('shopSize',[]);setChecks('shopColor',[]);
   // Sorting and text search are independent of the filter groups.
   pageNum=1;renderShop();
  });
  $('#shopPager').addEventListener('click',event=>{
   const button=event.target.closest('[data-page-number]');
   if(!button||button.disabled)return;
   pageNum=Number(button.dataset.pageNumber);renderShop();
   $('#shopResults').scrollIntoView({behavior:mediaReduced.matches?'instant':'smooth',block:'start'});
  });
  const mobileFilterQuery=window.matchMedia('(max-width:740px)');
  function closeDrawer(restoreFocus=true){
   const wasOpen=sidebar.classList.contains('is-open');
   sidebar.classList.remove('is-open');backdrop.hidden=true;
   openFilters.setAttribute('aria-expanded','false');
   sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');
   document.body.classList.remove('shop-filters-open');
   if(wasOpen&&restoreFocus&&mobileFilterQuery.matches)openFilters.focus();
  }
  function openDrawer(){
   sidebar.classList.add('is-open');backdrop.hidden=false;
   openFilters.setAttribute('aria-expanded','true');
   sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');
   document.body.classList.add('shop-filters-open');closeFilters.focus();
  }
  openFilters.addEventListener('click',openDrawer);
  closeFilters.addEventListener('click',()=>closeDrawer());
  backdrop.addEventListener('click',()=>closeDrawer());
  mobileFilterQuery.addEventListener('change',()=>closeDrawer(false));
  sidebar.addEventListener('keydown',e=>{
   if(e.key!=='Tab'||!sidebar.classList.contains('is-open'))return;
   const elements=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]',sidebar)
    .filter(el=>el.getClientRects().length);
   if(!elements.length)return;
   const first=elements[0],last=elements[elements.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sidebar.classList.contains('is-open')){e.preventDefault();closeDrawer()}});
  renderShop();
 }
 if(route==='favorites'){
  renderFavoriteGrid=function(){const items=catalog.filter(p=>favoritesState.has(p.id));$('#favoriteGrid').innerHTML=items.map(productCard).join('');$('#favoriteEmpty').textContent=items.length?'':'No demo samples saved. Use the heart icons on collection or shop cards.'}
  renderFavoriteGrid();
 }
 if(route==='artists-edit'){
  // The image pipeline is mandatory on this deployed page: never silently
  // resurrect the pre-artwork "Compose your idea" configurator.
  const previous=$('.customize-layout');
  if(!previous)throw Error('ARTIST_STAGE_MOUNT_POINT_MISSING');
  previous.hidden=true;
  previous.style.display='none';
  const panel=document.createElement('section');
  panel.className='wrap cc-worktable-diagnostic';
  panel.id='cc-worktable-diagnostic';
  panel.setAttribute('role','status');
  panel.setAttribute('aria-live','polite');
  panel.dataset.state='loading';
  const heading=document.createElement('h2');
  heading.textContent='Preparing the illustrated worktable';
  const detail=document.createElement('p');
  detail.textContent='Verifying the current studio artwork and renderer.';
  const build=document.body.dataset.reviewBuild||'unversioned';
  const releaseURL=document.body.dataset.reviewUrl||'/artists-edit/';
  // Diagnostics stay accessible on actual errors without showing a build banner.
  panel.append(heading,detail);panel.hidden=true;
  previous.before(panel);
  const diagnostic=(code,error)=>{
   const info=String(error?.message||error||'Unknown problem').slice(0,240);
   panel.hidden=false;
   panel.dataset.state='error';
   panel.setAttribute('role','alert');
   heading.textContent='Illustrated worktable unavailable';
   detail.textContent='Error '+code+': '+info;
   const recovery=document.createElement('p');
   recovery.className='cc-worktable-recovery';
   const link=document.createElement('a');
   link.href=releaseURL;
   link.textContent='Open current review build';
   const retry=document.createElement('button');
   retry.type='button';
   retry.textContent='Retry loading';
   retry.addEventListener('click',()=>location.reload());
   recovery.append(link,retry);
   panel.querySelector('.cc-worktable-recovery')?.remove();
   panel.append(recovery);
   console.error('CHAPCHITRA ARTIST EDIT '+code+' (build '+build+'):',error);
   window.__chapchitraArtistDiagnostic={status:'error',code,build,manifest:document.body.dataset.reviewManifest||null};
  };
  const manifestURL=artistManifestURL;
  let artworkReady=false;
  let artworkManifest=null;
  try{
   // Revision-stamped /releases/<sha>/ manifests are immutable per build.
   // Keep __deliveryBuild checks; unversioned paths still bypass HTTP cache.
   const result=await artistManifestPending;
   if(result.error)throw result.error;
   const entries=result.entries;
   if(!entries||typeof entries!=='object')throw Error('Manifest is not a JSON object');
   if(build!=='unversioned'&&entries.__deliveryBuild!==build){
    throw Error('Received artifact build '+String(entries.__deliveryBuild||'legacy')+'; expected '+build);
   }
   const required=['Artist-edit-backdrop-1.png',
    'Tshirts/walnut_table_background_exact_tone_4K_1.png',
    'Tshirts/walnut_table_background_exact_tone_4K_2.png',
    'Tshirts/walnut_table_background_exact_tone_4K-3.png',
    'Tshirts/walnut_table_background_exact_tone_4K-4.png'];
   const missing=required.filter(path=>entries[path]?.original?.join('x')!=='4000x2250'||
    entries[path]?.delivery?.variants?.length!==3);
   if(missing.length||!entries.__initialScene?.garments?.regular?.variants?.length){
    throw Error('Missing registered WebP layers: '+(missing.join(', ')||'assembled preview'));
   }
   artworkManifest=entries;
   artworkReady=true;
  }catch(error){
   diagnostic('MANIFEST_VALIDATION_FAILED',error);
  }
  if(artworkReady){
   try{
    const moduleResult=await artistModulePending;
    if(moduleResult.error)throw moduleResult.error;
    const {mountWorktable}=moduleResult.mod;
    const pending=document.createElement('section');
    pending.className='cc-worktable-mount';
    previous.replaceWith(pending);
    await mountWorktable(pending,{manifestData:artworkManifest,embedded:true});
    panel.remove();
    window.__chapchitraArtistDiagnostic={status:'ready',build,manifest:manifestURL};
    document.body.dataset.worktableStatus='ready';
   }catch(error){
    diagnostic('WORKTABLE_RENDER_FAILED',error);
   }
  }
 }
 // Navbar C08 is hover-only on all routes. It never loads a player automatically.
 if(route!=='home')import('/motion/c08/logo-player.mjs')
  .then(({mountC08})=>mountC08({navbar:$('.logo-word--image')}))
  .catch(error=>console.warn('C08 original navbar image retained:',error));
 if(route==='journal'){
  let index=0,interval=null,hover=false,focus=false;
  const spotlight=$('#journalSpotlight');
  function renderJournalFeature(){
   const a=articlePreviews[index];
   $('#journalFeatured').innerHTML='<div class="journal-feature-art">'+printSilhouette(index)+'</div><div class="journal-feature-copy"><p class="eyebrow">'+a.eyebrow+'</p><h2>'+a.title+'</h2><p>'+a.teaser+'</p>'+sketchButton({label:'Open story',variant:'compact',tone:'terracotta',href:'/journal/story/?slug='+a.slug})+'</div>';
   $('#journalIndex').textContent=String(index+1).padStart(2,'0')+' / 05';
  }
  function schedule(){if(interval){clearInterval(interval);interval=null}if(!hover&&!focus&&!document.hidden&&!mediaReduced.matches)interval=setInterval(()=>{index=(index+1)%articlePreviews.length;renderJournalFeature()},8000)}
  function rotate(n){index=(index+n+articlePreviews.length)%articlePreviews.length;renderJournalFeature();schedule()}
  $('#journalPrevious').addEventListener('click',()=>rotate(-1));$('#journalNext').addEventListener('click',()=>rotate(1));
  spotlight.addEventListener('mouseenter',()=>{hover=true;schedule()});spotlight.addEventListener('mouseleave',()=>{hover=false;schedule()});
  spotlight.addEventListener('focusin',()=>{focus=true;schedule()});spotlight.addEventListener('focusout',()=>{focus=spotlight.contains(document.activeElement);schedule()});
  document.addEventListener('visibilitychange',schedule);mediaReduced.addEventListener('change',schedule);renderJournalFeature();schedule();
 }
}
boot().catch(error=>{
 console.error('CHAPCHITRA V3 initialization failure:',error);
 const root=document.getElementById('app');
 if(root){
  const code=document.body.dataset.page==='artists-edit'?'BOOT_FAILED':'SITE_BOOT_FAILED';
  root.replaceChildren();
  const section=document.createElement('section');
  section.className='wrap cc-worktable-diagnostic';
  section.setAttribute('role','alert');
  section.dataset.state='error';
  const title=document.createElement('h1');title.textContent='Studio initialization failed';
  const detail=document.createElement('p');
  detail.textContent=code+': '+String(error?.message||error).slice(0,240);
  const link=document.createElement('a');
  link.href=document.body.dataset.reviewUrl||'/artists-edit/';
  link.textContent='Retry current review build';
  section.append(title,detail,link);root.append(section);
 }
});
