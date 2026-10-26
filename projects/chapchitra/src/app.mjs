async function boot(){
 const {shirtSilhouette,printSilhouette}=await import('./components.mjs');
 const {catalog,articlePreviews,PAGE_SIZE_HOME,PAGE_SIZE_SHOP}=await import('./catalog.mjs');
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
 const navLinks=[
  ['Shop','/shop/'],["Artist's Edit",'/artists-edit/'],['Journal','/journal/'],['About Us','/about/']
 ];
 function announcement(){return '<aside class="announcement" aria-label="Store announcement"><span>Free delivery over ৳2000 · Join the list for early access</span></aside>'}
 function header(){
  return '<header class="site-header" id="siteHeader"><div class="header-line wrap">'+
   '<a href="/" class="logo-word" aria-label="CHAPCHITRA home"><span>CHAPCHITRA</span><small lang="bn">ছাপচিত্র</small></a>'+
   '<nav class="nav-center" aria-label="Main navigation"><details class="shop-dropdown"><summary>Shop</summary><div class="nav-dropdown"><a href="/shop/">Shop All</a>'+categories.map(c=>'<a href="/shop/?category='+c.id+'">'+c.title+'</a>').join('')+'</div></details>'+
   '<a href="/artists-edit/">Artist’s Edit</a><a href="/journal/">Journal</a><a href="/about/">About Us</a></nav>'+
   '<div class="nav-actions">'+
   '<button type="button" class="nav-icon" id="searchButton" aria-label="Open search" aria-expanded="false" aria-controls="searchPanel">'+svg('search')+'</button>'+
   '<a class="nav-icon" href="/favorites/" aria-label="Favorites">'+svg('heart')+'</a>'+
   '<a class="nav-icon" href="/account/" aria-label="Account">'+svg('account')+'</a>'+
   '<a class="nav-icon bag-link" href="/bag/" aria-label="Shopping bag, zero items">'+svg('bag')+'<span class="bag-count">0</span></a>'+
   (bellRendered?'<button class="nav-icon" aria-label="Notifications"></button>':'')+
   '<button type="button" class="nav-icon hamburger" id="menuButton" aria-label="Open navigation" aria-expanded="false" aria-controls="mobileNav">'+svg('menu')+'</button>'+
   '</div></div>'+
   '<div id="searchPanel" class="search-panel" hidden><form class="wrap search-form" action="/shop/" method="get" role="search"><label for="globalSearch">Search the demo catalogue</label><div class="search-inline"><input id="globalSearch" name="q" type="search" placeholder="Search sample prints, fits, and collections" autocomplete="off"><button type="submit">Search</button></div><small>Demo records only. No real inventory.</small></form></div>'+
   '<nav id="mobileNav" class="mobile-nav" aria-label="Mobile navigation" hidden><a href="/shop/">Shop All</a>'+categories.map(c=>'<a href="/shop/?category='+c.id+'">'+c.title+'</a>').join('')+navLinks.slice(1).map(([s,href])=>'<a href="'+href+'">'+s+'</a>').join('')+'</nav></header>';
 }
 const paperVisual=(i)=>'<div class="art-plate art-plate-'+(i%3)+'">'+(i%2===0?shirtSilhouette(i):printSilhouette(i))+'<span class="plate-disclaimer">Illustration placeholder</span></div>';
 const linkFiltered=(category,audience)=>'/shop/?category='+encodeURIComponent(category)+(audience?'&audience='+audience:'');
 function hero(){
  const slides=[
   {title:'Art you can wear.',eyebrow:'PEOPLE · PLACES · PRINTS',copy:'A home for art, illustration and printmaking. Final imagery and logo are awaiting approval.',cta:'Discover the studio',href:'/about/'},
   {title:'Artist-Inspired Drop',eyebrow:'02 / ARTIST-INSPIRED',copy:'Discover where drawings meet wearable surfaces. This is a structural preview of an upcoming collection.',cta:'Explore the collection',href:'/shop/?print=illustration'},
   {title:'Color, by hand.',eyebrow:'03 / TIE-DYE',copy:'Inspired by the slow, expressive making of hand-dyed textiles.',cta:'Explore Tie-Dye',href:'/shop/?category=tie-dye'},
   {title:'Your idea, printed.',eyebrow:"04 / ARTIST'S EDIT",copy:'A dedicated space to plan custom printing, from garment choice to print approach.',cta:"Explore Artist's Edit",href:'/artists-edit/'},
   {title:'From the Journal',eyebrow:'05 / TODAY’S STORY',copy:'Read the studio notebook. Original articles and photography will be supplied later.',cta:'Open featured story',href:'/journal/story/?slug=prints-and-people'}
  ];
  return '<section id="hero" class="hero-carousel" aria-label="Five-slide editorial hero"><div class="hero-track">'+slides.map((s,i)=>{
   if(i===0)return '<article class="hero-slide hero-cover '+(i===0?'is-active':'')+'" data-slide="'+i+'" '+(i===0?'':'hidden')+'><img class="hero-background" src="/assets/hero-paper.svg" alt="Abstract green ink and paper placeholder background"><div class="hero-shade"></div><div class="wrap hero-cover-inner"><p class="eyebrow on-dark">'+s.eyebrow+'</p><div class="hero-display-word">CHAPCHITRA</div><p class="hero-translate" lang="bn">ছাপচিত্র</p><h1>'+s.title+'</h1><p>'+s.copy+'</p><a class="button light" href="'+s.href+'">'+s.cta+' ↗</a><small>Temporary wordmark · final logo pending</small></div></article>';
   return '<article class="hero-slide hero-split" data-slide="'+i+'" hidden><div class="wrap hero-split-inner"><div class="hero-slide-copy"><p class="eyebrow">'+s.eyebrow+'</p><h2>'+s.title+'</h2><p>'+s.copy+'</p><a class="button dark" href="'+s.href+'">'+s.cta+' ↗</a></div><div class="hero-visual hero-visual-'+i+'">'+(i===2?printSilhouette(i):i===4?'<div class="paper-editorial"><span>JOURNAL / STORY 01</span><strong>Notes from<br>the studio.</strong><span>Draft illustration</span></div>':shirtSilhouette(i))+'<span class="hero-placeholder">IMAGE / ART PENDING</span></div></div></article>'
  }).join('')+'</div><div class="hero-controls wrap"><div class="hero-dots" role="group" aria-label="Choose hero slide">'+slides.map((s,i)=>'<button class="hero-dot'+(i===0?' active':'')+'" type="button" data-slide-to="'+i+'" aria-label="Show slide '+(i+1)+': '+esc(s.title)+'" aria-pressed="'+(i===0?'true':'false')+'"></button>').join('')+'</div><span class="hero-count" id="heroCount">01 / 05</span></div></section>';
 }
 function benefits(){
  const items=[['truck','Delivery','Delivery terms to be confirmed'],['return','Easy Returns','Policy details coming soon'],['card','Secure Payment','Planned: bKash · Nagad · Cards · Cash on Delivery'],['support','Order Support','Service contact details pending']];
  return '<section id="benefits" class="benefit-section" aria-labelledby="benefitsTitle"><h2 class="sr-only" id="benefitsTitle">Service benefits</h2><div class="wrap benefit-grid">'+items.map(([glyph,label,detail])=>'<div class="benefit">'+svg(glyph)+'<div><strong>'+label+'</strong><span>'+detail+'</span></div></div>').join('')+'</div></section>';
 }
 function titleBlock(label,title,desc){return '<div class="section-title"><div><p class="eyebrow">'+label+'</p><h2>'+title+'</h2></div><p>'+desc+'</p></div>'}
 function categoriesSection(){
  return '<section id="categories" class="section-pad wrap" aria-labelledby="categoriesTitle">'+titleBlock('01 / SHOP BY FIT','Shop by category','Wearable art in familiar silhouettes, awaiting the final product catalogue.')+
  '<div class="category-grid">'+categories.map((cat,i)=>'<article class="category-card"><div class="category-image">'+shirtSilhouette(i)+'<span class="proof-tag">Sample silhouette</span></div><div class="category-copy"><h3>'+cat.title+'</h3><p>'+cat.desc+'</p><div class="filter-chips" aria-label="'+cat.title+' filters"><a href="'+linkFiltered(cat.id,'')+'">All</a><a href="'+linkFiltered(cat.id,'men')+'">Men</a><a href="'+linkFiltered(cat.id,'women')+'">Women</a></div></div></article>').join('')+'</div></section>';
 }
 function productCard(item){
  const liked=isFavoriteNow(item.id);
  return '<article class="product-card"><a href="/product/?id='+item.id+'" class="product-visual" aria-label="View '+esc(item.name)+' sample detail">'+shirtSilhouette(item.visual)+'<span class="proof-tag">DEMO / NO STOCK</span></a><button type="button" class="favorite-toggle'+(liked?' liked':'')+'" data-favorite="'+item.id+'" aria-pressed="'+liked+'" aria-label="'+(liked?'Remove':'Add')+' '+esc(item.name)+' '+(liked?'from':'to')+' favorites">'+svg('heart')+'</button><div class="product-meta"><a href="/product/?id='+item.id+'"><strong>'+esc(item.name)+'</strong></a><span>'+esc(item.fit)+'</span><div class="product-price"><small>'+esc(item.subtitle)+'</small><b>Tk —</b></div></div></article>';
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
 function banners(){
  return '<section id="banners" class="section-pad wrap editorial-banners" aria-label="Two editorial collection banners"><article class="editorial-banner tie-banner"><p class="eyebrow">THE PROCESS / COLOR</p><h2>Color has<br>its own rhythm.</h2><p>An introduction to layered dye, handcrafted variation and creative surfaces.</p><a href="/shop/?category=tie-dye" class="text-link">Explore hand-dye studies ↗</a><span class="banner-signature" aria-hidden="true">TD / 01</span></article><article class="editorial-banner edit-banner"><p class="eyebrow">MADE FOR YOU</p><h2>Make it<br>your artwork.</h2><p>Choose a shape, plan the imprint, and build a custom-printing inquiry.</p><a href="/artists-edit/" class="text-link">Visit Artist’s Edit ↗</a><span class="banner-signature" aria-hidden="true">AE / 02</span></article></section>';
 }
 function featured(){
  return '<section id="featured" class="section-pad featured-zone" aria-labelledby="featuredTitle"><div class="wrap">'+titleBlock('03 / THE GALLERY','Featured Prints','Five framed slots reserved for owner-supplied artwork and inspiration credits.')+
   '<div id="featuredFrames" class="featured-stage"></div><div class="featured-controls"><button type="button" id="featuredPrev" aria-label="Previous featured print">‹</button><div id="featuredCaption" aria-live="polite"></div><button type="button" id="featuredNext" aria-label="Next featured print">›</button></div></div></section>';
 }
 function values(){
  const items=[['01','Stories You Can Wear','An illustrated canvas for everyday storytelling.'],['02','Rooted in Bengal','A place for local culture and creative observation.'],['03','Made Through Print','Marks, materials and the studio process.'],['04','Wear It Your Way','Find a silhouette or customize your own.']];
  return '<section id="values" class="section-pad wrap" aria-labelledby="valuesTitle">'+titleBlock('04 / OUR POINT OF VIEW','Four ideas. One studio.','Large independent artwork slots prepared for future C01 SVG animation components.')+
   '<div class="values-grid">'+items.map(([num,title,desc],i)=>'<article class="value-card" data-motion-slot="C01-'+num+'"><div class="value-art" aria-label="Temporary illustration frame for '+title+'"><span class="value-num">'+num+'</span><div class="value-print-motif motif-'+i+'"><span></span><span></span></div><small>Illustration pending</small></div><h3>'+title+'</h3><p>'+desc+'</p></article>').join('')+'</div></section>';
 }
 function story(){
  return '<section id="story" class="story-section" aria-labelledby="storyTitle"><div class="wrap story-top"><div><p class="eyebrow">05 / THE STORY</p><h2 id="storyTitle">People.<br>Places.<br><em>Prints.</em></h2></div><div class="story-summary"><p>CHAPCHITRA brings printmaking, illustration and everyday apparel into one evolving creative conversation. The full studio history and identity artwork will be added with approved brand copy.</p><a href="/about/" class="button dark">Read Our Story ↗</a></div></div><a class="street-link" href="/about/#street-story" aria-label="Learn more about the street-scene inspiration"><img src="/assets/street-bengal.svg" alt="Provisional line illustration of a Bangladeshi street with a tea stall, shops and a rickshaw."><span class="street-note">Bangladesh street illustration study · Explore the story ↗</span></a></section>';
 }
 function footer(){
  return '<footer class="site-footer" id="footer"><div class="wrap footer-grid"><div class="footer-identity"><a class="logo-word" href="/">CHAPCHITRA <small lang="bn">ছাপচিত্র</small></a><p>PEOPLE · PLACES · PRINTS</p><small>Art-led print and apparel demo. Identity, pricing and images remain provisional.</small></div><div class="footer-column"><h2>Shop</h2><a href="/shop/">All Samples</a>'+categories.map(c=>'<a href="/shop/?category='+c.id+'">'+c.title+'</a>').join('')+'</div><div class="footer-column"><h2>Discover</h2><a href="/artists-edit/">Artist’s Edit</a><a href="/journal/">Journal</a><a href="/about/">About Us</a></div><div class="footer-column"><h2>Help</h2><a href="/account/">Account</a><a href="/bag/">Shopping Bag</a><a href="/checkout/">Checkout Preview</a><a href="/favorites/">Favorites</a></div><div class="footer-newsletter"><h2>Join the print studio</h2><p>Community emails are not yet connected to a mailing list.</p><form id="newsletterForm"><label for="newsletterEmail">Email address</label><div class="newsletter-row"><input id="newsletterEmail" name="email" type="email" autocomplete="email" placeholder="Your email address" required><button type="submit">Join</button></div><small id="newsletterMessage" aria-live="polite">Valid email required. No information will be transmitted.</small></form></div></div><div class="wrap footer-bottom"><span>© 2026 CHAPCHITRA · V3 architectural prototype</span><span>No orders, payments or subscriptions are processed.</span></div></footer>';
 }
 function home(){return hero()+benefits()+categoriesSection()+collection()+banners()+featured()+values()+story()}
 const pageTop=(kicker,title,desc)=>'<section class="route-head wrap"><p class="eyebrow">'+kicker+'</p><h1>'+title+'</h1><p>'+desc+'</p></section>';
 function shop(){
  return pageTop('DEMO CATALOGUE','Shop the Studies','Sample placeholders only. Filters and pagination are functional; inventory, imagery and prices have not been approved.')+
  '<section class="wrap route-content"><div class="shop-controls"><label>Category<select id="filterCategory"><option value="">All categories</option>'+categories.map(c=>'<option value="'+c.id+'">'+c.title+'</option>').join('')+'</select></label><label>Fit / audience<select id="filterAudience"><option value="">All</option><option value="men">Men</option><option value="women">Women</option></select></label><label>Print type<select id="filterPrint"><option value="">All print types</option><option value="illustration">Illustration</option><option value="studio-print">Studio Print</option><option value="hand-dyed">Hand-Dyed</option></select></label><button type="button" id="clearFilters">Clear filters</button></div><p id="filterSummary" aria-live="polite"></p><div class="product-grid" id="shopProducts"></div><div id="shopPager"></div></section>';
 }
 function artistsEdit(){
  return pageTop('CUSTOM PRINTING',"Artist’s Edit",'Plan a custom print concept using the local-only preview configurator. No file upload, payment or inquiry submission is connected.')+
  '<section class="wrap route-content customize-layout"><div class="custom-illustration">'+shirtSilhouette(1)+'<small>Custom-print canvas placeholder</small></div><div class="custom-settings"><h2>Compose your idea</h2><p>Select an example garment and printing method. Your selections stay in this browser session only.</p><form id="customForm"><label for="garmentSelect">Garment<select id="garmentSelect"><option>Regular Tee</option><option>Drop Shoulder</option><option>Tie-Dye</option></select></label><label for="printSelect">Print approach<select id="printSelect"><option>Single-color block print</option><option>Multi-layer print</option><option>Digital illustration transfer</option></select></label><label for="quantityInput">Estimated quantity<input id="quantityInput" type="number" min="1" max="1000" value="1"></label><label for="customNotes">Brief notes<textarea id="customNotes" rows="3" maxlength="280" placeholder="Describe your visual concept…"></textarea></label></form><h3>Local brief preview</h3><p id="customSummary" class="summary-panel" aria-live="polite"></p><p class="route-disclaimer">This is a planning mock-up. No inquiry or design is transmitted. Real submissions will be added after contact details are authorized.</p></div></section>';
 }
 function journal(){
  return pageTop('STORIES / PROCESS','The Journal','A structural editorial collection. Feature rotation and individual pages work; final story copy is pending.')+
  '<section class="wrap route-content"><div class="journal-spotlight" id="journalSpotlight" aria-label="Featured story carousel"><div id="journalFeatured"></div><div class="journal-controls"><button id="journalPrevious" type="button" aria-label="Previous featured article">‹</button><span id="journalIndex">01 / 05</span><button id="journalNext" type="button" aria-label="Next featured article">›</button></div></div><div class="section-title"><div><p class="eyebrow">INDEX</p><h2>From the notebook</h2></div><p>Click through to individual article study pages.</p></div><div class="journal-grid">'+articlePreviews.map((a,i)=>'<article class="journal-card"><div class="journal-thumb">'+printSilhouette(i)+'</div><p class="eyebrow">'+a.eyebrow+'</p><h3><a href="/journal/story/?slug='+a.slug+'">'+a.title+'</a></h3><p>'+a.teaser+'</p><a class="text-link" href="/journal/story/?slug='+a.slug+'">Read the outline ↗</a></article>').join('')+'</div></section>';
 }
 function article(){
  const slug=qs.get('slug')||articlePreviews[0].slug;
  const a=articlePreviews.find(x=>x.slug===slug);
  if(!a)return pageTop('JOURNAL','Story unavailable','The requested studio outline does not exist.')+'<div class="wrap route-content"><a class="button dark" href="/journal/">Return to Journal</a></div>';
  return '<article class="wrap article-detail route-content"><p class="eyebrow">'+a.eyebrow+'</p><h1>'+a.title+'</h1><p class="lead">'+a.teaser+'</p><div class="article-art">'+printSilhouette(articlePreviews.indexOf(a))+'</div><h2>Editorial outline</h2><p>This page reserves space for the original writing, process photographs and artist context associated with this story. The final article has not been supplied and this copy is intentionally not presented as researched reporting.</p><a href="/journal/" class="text-link">← All journal stories</a></article>';
 }
 function about(){
  return pageTop('PEOPLE · PLACES · PRINTS','The Living Print Studio','CHAPCHITRA is an evolving editorial vision for wearable art, illustration and printmaking in a Bangladeshi creative context.')+
  '<section class="wrap route-content about-layout"><div><p class="eyebrow">OUR PERSPECTIVE</p><h2>Culture, drawn into everyday life.</h2><p>People, places, and prints form the framework for the studio’s visual world. This page is a foundation for the owner-approved origin story, original artwork and printmaking references.</p><p>Until final copy arrives, we avoid inventing a founder biography, workshop location or sourcing claims.</p><a class="text-link" href="/journal/">Read the Journal ↗</a></div><div class="about-visual">'+printSilhouette(2)+'</div></section><section id="street-story" class="wrap route-content"><h2>Scenes from the street</h2><p>The street scene is a static placeholder with separate rickshaw-wheel and tea-stall-steam artwork integration points reserved for later animation approvals.</p><img class="about-street" src="/assets/street-bengal.svg" alt="Provisional illustrated Bangladesh street scene including a rickshaw and tea stall."></section>';
 }
 function product(){
  const item=catalog.find(p=>p.id===qs.get('id'))||catalog[0];
  return '<section class="wrap route-content detail-layout"><div class="detail-art">'+shirtSilhouette(item.visual)+'</div><div><p class="eyebrow">SAMPLE PRODUCT · NOT FOR SALE</p><h1>'+esc(item.name)+'</h1><p>'+esc(item.subtitle)+'</p><p>'+esc(item.fit)+' · '+item.audience.map(esc).join(' / ')+'</p><h2>Tk — <small>Price not provided</small></h2><p>Neutral silhouette only; there are no physical product photographs or available stock in this preview.</p><button class="button dark" type="button" data-favorite="'+item.id+'">'+(isFavorite(item.id)?'Remove from Favorites':'Save to Favorites')+'</button><a href="/shop/" class="text-link">Continue exploring ↗</a><p class="route-disclaimer">Adding to bag or purchasing is unavailable until real products and order workflows are approved.</p></div></section>';
 }
 function favorites(){
  return pageTop('YOUR SAVED STUDIES','Favorites','Selections are stored locally in this browser; no account or server sync.')+'<section class="wrap route-content"><div id="favoriteGrid" class="product-grid"></div><p id="favoriteEmpty"></p></section>';
 }
 function emptyRoute(kicker,title,description,secondary){
  return pageTop(kicker,title,description)+'<section class="wrap route-content empty-panel"><p>'+secondary+'</p><a href="/shop/" class="button dark">Explore sample collection ↗</a></section>';
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
   case 'bag':return emptyRoute('DEMO BAG','Shopping Bag','Bag and purchase functionality are intentionally disabled while inventory and commerce are unconnected.','Your real shopping bag is not being stored; checkout is not available.');
   case 'checkout':return emptyRoute('NOT A LIVE PAYMENT PAGE','Checkout Preview','No payment integrations, order creation, or real inventory are connected.','This route remains an explicit informational placeholder and never collects sensitive payment details.');
   case 'confirmation':return emptyRoute('NO ORDER PLACED','Order Confirmation Preview','This demo has not created, charged, or confirmed an order.','After a future authorized commerce workflow, an actual order confirmation would appear here.');
   default:return emptyRoute('NOT FOUND','Page unavailable','The destination was not found.','Return to the demo storefront.');
  }
 }
 const app=$('#app');
 if(!app)throw Error('App root missing');
 app.innerHTML=announcement()+header()+'<main id="main">'+mainPage()+'</main>'+footer();
 // Global navigation and keyboard behavior.
 const search=$('#searchPanel'),searchButton=$('#searchButton'),mobileNav=$('#mobileNav'),menuButton=$('#menuButton');
 const toggle=(el,trigger,show)=>{el.hidden=!show;trigger.setAttribute('aria-expanded',String(show));};
 searchButton.addEventListener('click',()=>{const show=search.hidden;toggle(search,searchButton,show);if(show){toggle(mobileNav,menuButton,false);$('#globalSearch').focus();}else searchButton.focus()});
 menuButton.addEventListener('click',()=>{const show=mobileNav.hidden;toggle(mobileNav,menuButton,show);if(show)toggle(search,searchButton,false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!search.hidden){toggle(search,searchButton,false);searchButton.focus()}else if(!mobileNav.hidden){toggle(mobileNav,menuButton,false);menuButton.focus()}}});
 // Proper email validation, but never a simulated successful submission.
 const newsletter=$('#newsletterForm');
 newsletter.addEventListener('submit',e=>{e.preventDefault();const input=$('#newsletterEmail');if(!input.checkValidity()){input.reportValidity();return;}$('#newsletterMessage').textContent='Preview only: your email was not submitted or stored. Mailing-list integration is pending.';});
 let renderHomeCollection=()=>{},renderShop=()=>{},renderFavoriteGrid=()=>{};
 let favoritesState=new Set();
 try{const saved=JSON.parse(localStorage.getItem('chapchitra-v3-sample-favorites')||'[]');if(Array.isArray(saved))favoritesState=new Set(saved.filter(s=>catalog.some(p=>p.id===s)))}catch{}
 function isFavoriteNow(id){return favoritesState.has(id)}
 // initial render called before favorite-state setup; repaint after initialization.
 function updateFav(id){
  if(favoritesState.has(id))favoritesState.delete(id);else favoritesState.add(id);
  try{localStorage.setItem('chapchitra-v3-sample-favorites',JSON.stringify([...favoritesState]))}catch{}
  // Preserve the live product grid and keyboard focus: update hearts in-place.
  const liked=favoritesState.has(id);
  $('[data-favorite]').filter(btn=>btn.dataset.favorite===id).forEach(btn=>{
   btn.classList.toggle('liked',liked);
   btn.setAttribute('aria-pressed',String(liked));
   if(btn.classList.contains('favorite-toggle')){
    const label=catalog.find(p=>p.id===id)?.name||'sample';
    btn.setAttribute('aria-label',(liked?'Remove ':'Add ')+label+(liked?' from':' to')+' favorites');
   }
  });
  if(route==='favorites')renderFavoriteGrid();
  if(route==='product'){
   const btn=$('[data-favorite]');if(btn)btn.textContent=liked?'Remove from Favorites':'Save to Favorites';
  }
 }
 // Global delegation (no card flicker from full grid rebuild except explicit favorite interaction).
 document.addEventListener('click',e=>{const btn=e.target.closest('[data-favorite]');if(btn)updateFav(btn.dataset.favorite)});
 // Navigation dropdown closes when leaving or using Escape.
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.shop-dropdown[open]').forEach(d=>d.removeAttribute('open'))});
 // Hero rotation, exactly one timer. Keyboard focus and pointer hover pause.
 if(route==='home'){
  const heroRoot=$('#hero'),slides=$$('.hero-slide',heroRoot),dots=$$('.hero-dot',heroRoot);
  let active=0,timer=null,hovered=false,focused=false,touchX=null;
  function pauseHero(){if(timer!==null){clearInterval(timer);timer=null}}
  function canPlay(){return !mediaReduced.matches&&!hovered&&!focused&&!document.hidden}
  function scheduleHero(){pauseHero();if(canPlay())timer=setInterval(()=>changeHero((active+1)%slides.length,false),6000)}
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
  let focusedPrint=2;
  const featureNames=['Original Mark Study','Layered Colour Study','Everyday Print Study','Paper to Textile Study','Studio Composition Study'];
  function renderFeatured(){
   const el=$('#featuredFrames');
   el.innerHTML=featureNames.map((title,i)=>{
    let offset=(i-focusedPrint+5)%5;if(offset>2)offset-=5;
    const c=offset===0?'center':Math.abs(offset)===1?'near':'far';
    return '<div class="feature-frame '+c+(offset<0?' left':' right')+(offset===0?' current':'')+'" aria-hidden="'+(offset!==0)+'" data-feature-index="'+i+'">'+paperVisual(i)+'</div>';
   }).join('');
   $('#featuredCaption').innerHTML='<strong>'+featureNames[focusedPrint]+'</strong><small>Artist / art-form inspiration credit pending · '+(focusedPrint+1)+' / 5</small>';
  }
  $('#featuredPrev').addEventListener('click',()=>{focusedPrint=(focusedPrint+4)%5;renderFeatured()});
  $('#featuredNext').addEventListener('click',()=>{focusedPrint=(focusedPrint+1)%5;renderFeatured()});
  renderFeatured();
 }
 if(route==='shop'){
  const category=$('#filterCategory'),audience=$('#filterAudience'),print=$('#filterPrint');
  category.value=categories.some(c=>c.id===qs.get('category'))?qs.get('category'):'';
  audience.value=['men','women'].includes(qs.get('audience'))?qs.get('audience'):'';
  print.value=['illustration','studio-print','hand-dyed'].includes(qs.get('print'))?qs.get('print'):'';
  let pageNum=Math.max(1,Number.parseInt(qs.get('page')||'1',10)||1);
  const searchText=(qs.get('q')||'').trim().toLowerCase();
  function matches(item){return(!category.value||item.category.includes(category.value))&&(!audience.value||item.audience.includes(audience.value))&&(!print.value||item.print===print.value)&&(!searchText||[item.name,item.fit,item.subtitle,item.print].some(v=>v.toLowerCase().includes(searchText)))}
  function syncQuery(){const p=new URLSearchParams();if(category.value)p.set('category',category.value);if(audience.value)p.set('audience',audience.value);if(print.value)p.set('print',print.value);if(searchText)p.set('q',searchText);if(pageNum>1)p.set('page',String(pageNum));history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''))}
  renderShop=function(){
   const filtered=catalog.filter(matches);
   const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE_SHOP));
   pageNum=Math.min(pageNum,pages);
   const visible=filtered.slice((pageNum-1)*PAGE_SIZE_SHOP,pageNum*PAGE_SIZE_SHOP);
   $('#shopProducts').innerHTML=visible.length?visible.map(productCard).join(''):'<p class="no-results">No sample cards match these filters. Try clearing them.</p>';
   $('#shopPager').innerHTML=pager(pages,pageNum,'shop');
   $('#filterSummary').textContent=filtered.length+' sample studies · Page '+pageNum+' of '+pages+'. No items are for sale.';
   syncQuery();
  };
  [category,audience,print].forEach(el=>el.addEventListener('change',()=>{pageNum=1;renderShop()}));
  $('#clearFilters').addEventListener('click',()=>{category.value='';audience.value='';print.value='';pageNum=1;history.replaceState(null,'',location.pathname);renderShop()});
  $('#shopPager').addEventListener('click',e=>{const b=e.target.closest('[data-page-number]');if(!b||b.disabled)return;pageNum=Number(b.dataset.pageNumber);renderShop();$('.route-head').scrollIntoView({behavior:mediaReduced.matches?'instant':'smooth'})});
  renderShop();
 }
 if(route==='favorites'){
  renderFavoriteGrid=function(){const items=catalog.filter(p=>favoritesState.has(p.id));$('#favoriteGrid').innerHTML=items.map(productCard).join('');$('#favoriteEmpty').textContent=items.length?'':'No demo samples saved. Use the heart icons on collection or shop cards.'}
  renderFavoriteGrid();
 }
 if(route==='artists-edit'){
  const form=$('#customForm'),summary=$('#customSummary');
  const update=()=>{const garment=$('#garmentSelect').value,method=$('#printSelect').value,quantity=Math.max(1,Number($('#quantityInput').value)||1),notes=$('#customNotes').value.trim();summary.textContent='Garment: '+garment+' · Method: '+method+' · Quantity: '+quantity+(notes?' · Brief: '+notes:'')+'. This plan has not been submitted.'};
  form.addEventListener('input',update);form.addEventListener('change',update);update();
 }
 if(route==='journal'){
  let index=0,interval=null,hover=false,focus=false;
  const spotlight=$('#journalSpotlight');
  function renderJournalFeature(){
   const a=articlePreviews[index];
   $('#journalFeatured').innerHTML='<div class="journal-feature-art">'+printSilhouette(index)+'</div><div class="journal-feature-copy"><p class="eyebrow">'+a.eyebrow+'</p><h2>'+a.title+'</h2><p>'+a.teaser+'</p><a href="/journal/story/?slug='+a.slug+'" class="button dark">Open story ↗</a></div>';
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
boot().catch(error=>{console.error('CHAPCHITRA V3 initialization failure:',error); const root=document.getElementById('app');if(root)root.textContent='The preview could not load. Please refresh.';});
