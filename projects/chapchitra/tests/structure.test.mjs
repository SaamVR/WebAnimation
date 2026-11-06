import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalog,PAGE_SIZE_HOME,PAGE_SIZE_SHOP,articlePreviews} from '../src/catalog.mjs';
const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf-8');
test('all twelve distinct route entrypoints exist',async()=>{
 const routes=['','shop/','artists-edit/','journal/','journal/story/','about/','product/','favorites/','account/','bag/','checkout/','order-confirmation/'];
 for(const route of routes){const html=await read('src/'+route+'index.html');assert.match(html,/id="app"/);assert.match(html,/data-page="/);assert.match(html,/noindex, nofollow/)}
});
test('eleven homepage units and functional UX controller contracts',async()=>{
 const app=await read('src/app.mjs');
 const home=app.match(/function home\(\)\{return ([^}]+)\}/)?.[1];
 assert.ok(home,'home() should exist');
 for(const f of ['hero()','benefits()','categoriesSection()','collection()','banners()','featured()','values()','story()'])assert.ok(home.includes(f),f);
 assert.match(app,/app\.innerHTML=announcement\(\)\+header\(\)/);
 assert.match(app,/mainPage\(\)\+'<\/main>'\+footer\(\)/);
 for(const label of ['Free delivery on orders over ৳2000','Artist-Inspired Drop','Color, by hand','Your idea, printed','From the Journal'])assert.ok(app.includes(label),label);
 assert.match(app,/setInterval\(\(\)=>changeHero\(\(active\+1\)%slides.length,false\),4000\)/);
 assert.match(app,/aria-pressed/);
 assert.match(app,/mouseenter/);
 assert.match(app,/touchend/);
 assert.match(app,/mediaReduced\.matches/);
 assert.match(app,/newsletterMessage/);
 assert.match(app,/const bellRendered=false/);
 assert.doesNotMatch(app,/gsap\.|ScrollTrigger|stripe|EcomCMS|\/threads\//i);
});
test('catalogue pagination, price integrity and overlapping categories',()=>{
 assert.equal(catalog.length,64);
 assert.equal(Math.ceil(catalog.length/PAGE_SIZE_HOME),8);
 assert.equal(Math.ceil(catalog.length/PAGE_SIZE_SHOP),6);
 assert.ok(catalog.some(p=>p.category.includes('tie-dye')&&p.category.includes('drop-shoulder')&&p.audience.includes('women')));
 assert.ok(catalog.every(p=>p.price===null));
 assert.equal(articlePreviews.length,5);
});
test('static street has distinct future SVG motion slots',async()=>{
 const street=await read('src/assets/street-bengal.svg');
 assert.match(street,/id="rickshaw-wheel-slot"/);
 assert.match(street,/id="tea-steam-slot"/);
});
test('provisional graphite palette, responsive breakpoints and C01-C04 isolation',async()=>{
 const css=await read('src/styles.css');
 assert.match(css,/#232323/);
 assert.match(css,/@media\(max-width:/);
 assert.match(css,/prefers-reduced-motion/);
 const doc=await read('src/motion/README.md');
 assert.match(doc,/No timelines/);
});

test('favorite state bootstraps before product detail rendering',async()=>{
 const app=await read('src/app.mjs');
 assert.ok(app.indexOf('let favoritesState=new Set()')<app.indexOf('app.innerHTML='),'favorites must initialize before any route HTML');
 assert.doesNotMatch(app,/\bisFavorite\(/,'only the initialized isFavoriteNow helper should be referenced');
 assert.ok(app.includes("$$('[data-favorite]').filter"),'all heart controls must be updated through querySelectorAll rather than a single Element');
});

test('Featured Prints uses stable five-card presentation with independent accessible UI timing',async()=>{
 const app=await read('src/app.mjs');
 const css=await read('src/styles.css');
 assert.match(app,/FEATURE_INTERVAL_MS=8200/);
 assert.match(app,/featureStage\.innerHTML=featureNames\.map/);
 assert.match(app,/frame\.dataset\.slot=slot/);
 assert.match(app,/featureStage\.addEventListener\('keydown'/);
 assert.match(app,/featureStage\.addEventListener\('touchend'/);
 assert.match(app,/featureRoot\.addEventListener\('mouseenter'/);
 assert.match(app,/mediaReduced\.matches/);
 assert.match(app,/feature-detail-link/);
 assert.match(app,/Price pending/);
 assert.match(css,/\.feature-frame\[data-slot="near-left"\]/);
 assert.match(css,/\.feature-frame\[data-slot="far-right"\]/);
 assert.match(css,/\.featured-zone\{background:var\(--deep\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('surgical refinements keep approved header, category/collection and C01-C04 alone',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 assert.match(css,/\.editorial-banners\{\s*width:min\(1290px/);
 assert.match(css,/#values>\.section-title\{/);
 assert.match(css,/\.story-section\{padding-top:60px\}/);
 assert.match(app,/function categoriesSection\(\)/);
 assert.match(app,/function collection\(\)/);
 assert.doesNotMatch(app,/import.*threads|from.*EcomCMS/i);
});


test('authoritative twelve brand colors have one canonical root and semantic aliases',async()=>{
 const css=await read('src/styles.css');
 const buttons=await read('src/button-system.css');
 const values={
  'gallery-white':'#F6F7F5','silver-mist':'#E9EDEB','warm-beige':'#D8CEC2',
  'cream':'#E4E3DE','soft-gray':'#D9DCD7','mushroom-gray':'#A6A29B',
  'deep-forest':'#172419','press-green':'#293D2D','dark-olive':'#1F2216',
  'walnut':'#6E523F','terracotta':'#8A503B','graphite':'#232323'
 };
 const roots=[...css.matchAll(/:root\s*\{([\s\S]*?)\}/g)];
 assert.equal(roots.length,1,'only one authoritative :root block is permitted');
 const root=roots[0][1];
 const colors=[...root.matchAll(/--color-([a-z-]+):(#[A-F0-9]{6});/g)];
 assert.equal(colors.length,12,'exactly twelve canonical palette literals');
 assert.deepEqual(Object.fromEntries(colors.map(match=>[match[1],match[2]])),values);
 for(const [alias,token] of Object.entries({
  '--deep':'--color-deep-forest','--press':'--interactive-primary',
  '--olive':'--color-dark-olive','--walnut':'--color-walnut',
  '--ink':'--text-primary','--bg':'--surface-page',
  '--grey':'--border-subtle','--mist':'--surface-secondary',
  '--beige':'--surface-editorial','--cream':'--surface-paper',
  '--mush':'--color-mushroom-gray','--acc':'--interactive-warm',
  '--mut':'--text-secondary','--midnight-pine':'--deep',
  '--graphite':'--ink','--paper':'--bg','--fog':'--mist',
  '--line':'--grey','--clay':'--acc','--press-olive':'--press',
  '--muted':'--mut'
 })){
  assert.ok(root.includes(alias+':var('+token+');'),'legacy alias '+alias);
 }
 assert.match(root,/--text-secondary:color-mix\(in srgb,var\(--color-graphite\) 78%,var\(--color-gallery-white\)\)/);
 assert.match(buttons,/--cc-shadow-graphite:var\(--ink\)/);
 assert.match(buttons,/--cc-shadow-on-dark:var\(--grey\)/);
 assert.match(buttons,/--cc-shadow-on-dark-beige:var\(--mush\)/);
 for(const retired of ['#1C241D','#243b32','#8FA3AF','#5F625E']){
  assert.ok(!css.toUpperCase().includes(retired.toUpperCase()),'retired color in CSS: '+retired);
  assert.ok(!buttons.toUpperCase().includes(retired.toUpperCase()),'retired color in buttons: '+retired);
 }
 // Product swatches and image-only placeholder photo tones are NOT theme tokens.
 assert.match(css,/\.shop-color-option\[data-color="red"\]/);
 assert.match(css,/\.product-card\.polaroid-card\[data-photo-tone="0"\]/);
});

test('text and button contrast remain readable; minor Mushroom Gray is not small copy',async()=>{
 const css=await read('src/styles.css');
 const palette={bg:'#F6F7F5',deep:'#172419',press:'#293D2D',ink:'#232323',acc:'#8A503B',walnut:'#6E523F'};
 const luminance=color=>{
  const rgb=color.slice(1).match(/../g).map(hex=>parseInt(hex,16)/255);
  const linear=rgb.map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4);
  return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
 };
 const contrast=(a,b)=>{
  const light=Math.max(luminance(a),luminance(b)),dark=Math.min(luminance(a),luminance(b));
  return (light+.05)/(dark+.05);
 };
 for(const [a,b] of [['ink','bg'],['bg','deep'],['bg','press']]){
  assert.ok(contrast(palette[a],palette[b])>=7,a+' on '+b+' must meet enhanced text contrast');
 }
 for(const a of ['acc','walnut'])assert.ok(contrast(palette[a],palette.bg)>=4.5,a+' needs normal text AA contrast');
 assert.match(css,/\.footer-column h2,\.footer-newsletter h2\{color:var\(--cream\)\}/);
 assert.match(css,/\.shop-color-dot\{[\s\S]*?border:1px solid var\(--mush\)/);
 assert.match(css,/\.benefit-section\{[\s\S]*?background:var\(--bg\)/);
 assert.match(css,/#benefits\.benefit-section\{background:var\(--bg\)\}/);
 assert.doesNotMatch(css,/\.benefit-section\{[^}]*background:var\(--grey\)/);
});
test('exact homepage section and individual card background mapping is maintained',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 const required=[
  '.announcement','background:var(--deep)',
  '.site-header','background:var(--bg)',
  '.hero-carousel','background:var(--bg)',
  '.benefit-section','background:var(--bg)',
  '.category-card:nth-child(1) .category-image{background:var(--cream)}',
  '.category-card:nth-child(2) .category-image{background:var(--press)',
  '.category-card:nth-child(3) .category-image{background:var(--acc)',
  '#collection:before','background:var(--mist);z-index:-1',
  '#collection .product-visual','background:var(--bg)',
  '.tie-banner{background:var(--beige)}',
  '.edit-banner{background:var(--cream)}',
  'banner-art-tie','banner-art-edit',
  '.featured-zone{background:var(--deep)',
  '.feature-frame:nth-child(even) .art-plate{background:var(--cream)}',
  '.feature-frame:nth-child(odd) .art-plate{background:var(--mist)}',
  '#values .value-card:nth-child(odd) .value-art{background:var(--mist)}',
  '#values .value-card:nth-child(even) .value-art{background:var(--cream)}',
  '.story-section','background:var(--cream)',
  '.street-link:after','var(--olive)',
  '.site-footer','background:var(--olive)'
 ];
 for(const needle of required){
  assert.ok(css.includes(needle)||app.includes(needle),'Missing reference styling: '+needle);
 }
 assert.match(app,/FEATURE_INTERVAL_MS=8200/);
 assert.match(app,/false\),4000\)/);
 assert.match(app,/const bellRendered=false/);
});


test('product hover and Add to Cart use one shared card component and retain motion boundaries',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css');
 assert.match(app,/function productCard\(item\)/);
 assert.match(app,/className:'product-add-button'/);
 assert.match(app,/data-add-to-bag/);
 assert.match(app,/related\.map\(productCard\)/);
 assert.match(app,/visible\.map\(productCard\)/);
 assert.match(app,/block\.map\(productCard\)/);
 assert.match(css,/\.product-card:hover\{/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(-1\.4deg\)/);
 assert.match(css,/300ms cubic-bezier/);
 assert.match(css,/@media\(hover:none\),\(pointer:coarse\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.product-add-button:focus-visible/);
 assert.match(css,/\.product-add-button:active/);
 assert.match(css,/\.detail-add-button/);
 assert.match(css,/\.related-studies/);
 assert.doesNotMatch(app,/gsap\.|ScrollTrigger|ink-stamp|C04\s*implementation/i);
});
test('session-only demo bag is not a real order flow',async()=>{
 const app=await read('src/app.mjs');
 assert.match(app,/sessionStorage\.setItem\(demoBagKey/);
 assert.match(app,/function demoBagCount\(/);
 assert.match(app,/function setDemoBagQty\(/);
 assert.match(app,/function renderDemoBag\(/);
 assert.match(app,/data-bag-adjust/);
 assert.match(app,/data-bag-remove/);
 assert.match(app,/function bag\(\)/);
 assert.match(app,/case 'bag':return bag\(\)/);
 assert.match(app,/Demo cart only\. No stock, prices, checkout, payment or orders are available/);
 assert.match(app,/No checkout, payment or order submission is enabled/);
 assert.match(app,/case 'checkout':return emptyRoute/);
 assert.doesNotMatch(app,/localStorage\.setItem\(demoBagKey/);
});


test('approved tilt and legacy 14px baseline are preserved under the new Polaroid caption',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 assert.match(css,/\.product-card \.product-meta\{\s*padding-inline:14px;/);
 assert.match(css,/transform:translate3d\(0,-5px,0\) rotate\(-1\.4deg\)/);
 assert.match(css,/transform:translate3d\(0,-5px,0\) rotate\(1\.4deg\)/);
 assert.match(css,/transition:transform 300ms cubic-bezier\(\.22,\.7,\.18,1\)/);
 assert.match(css,/\.product-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(app,/function productCard\(item\)/);
 assert.match(app,/related\.map\(productCard\)/);
});
test('Add to Cart has progressive left-to-right charcoal overlay and accessible motion fallback',async()=>{
 const css=await read('src/styles.css');
 assert.match(css,/\.product-add-button::before\{\s*content:"";/);
 assert.match(css,/background:var\(--ink\);\s*transform:scaleX\(0\)/);
 assert.match(css,/transform-origin:left center;\s*transition:transform 300ms/);
 assert.match(css,/\.product-add-button\.added::before\{\s*transform:scaleX\(1\)/);
 assert.match(css,/\.product-add-button:hover::before\{\s*transform:scaleX\(1\)/);
 assert.match(css,/\.product-add-button::before\{\s*transition:none!important;/);
 assert.match(css,/\.product-add-button > \.product-add-label/);
 assert.match(css,/\.product-add-button > \.product-add-arrow/);
 assert.match(css,/@media\(hover:none\),\(pointer:coarse\)/);
});


test('clean pill variants and color combinations use two solid matching layers',async()=>{
 const {sketchButton,sketchArt,sketchVariants,sketchTones}=await import('../src/handdrawn-buttons.mjs');
 assert.deepEqual(sketchVariants,['compact','long']);
 assert.deepEqual(sketchTones,['forest','terracotta','beige']);
 assert.notEqual(sketchArt('compact'),sketchArt('long'));
 for(const variant of sketchVariants)for(const tone of sketchTones){
  const html=sketchButton({label:'ADD TO BAG',variant,tone,attrs:'data-add-to-bag="sample"'});
  assert.match(html,/<button type="button"/);
  assert.ok(html.includes('cc-sketch--'+variant));
  assert.ok(html.includes('cc-sketch--'+tone));
  assert.match(html,/cc-pill-art--/);
  assert.match(html,/cc-pill-shadow/);
  assert.match(html,/cc-pill-face/);
  assert.match(html,/cc-pill-wipe/);
  assert.match(html,/cc-sketch-label-ink/);
  assert.doesNotMatch(html,/<svg|<path|<rect|cc-sketch-outline|cc-sketch-highlight|\.png|product-add-arrow|↗|→|✓/);
 }
 assert.match(sketchButton({label:'Shop Now',href:'/shop/'}),/<a href="\/shop\/"/);
});
test('true capsule geometry and directional fill preserve accessibility',async()=>{
 const css=await read('src/button-system.css');
 const app=await read('src/app.mjs');
 const preview=await read('src/buttons/index.html');
 const previewJS=await read('src/button-preview.mjs');
 assert.match(css,/\.cc-pill-face\{/);
 assert.match(css,/\.cc-pill-shadow\{/);
 assert.match(css,/border:0;border-radius:9999px/);
 assert.match(css,/inset:var\(--cc-offset\) 0 0 var\(--cc-offset\)/);
 assert.match(css,/inset:0 var\(--cc-offset\) var\(--cc-offset\) 0/);
 assert.match(css,/background:var\(--cc-shadow-color\)/);
 assert.match(css,/\.cc-pill-wipe\{/);
 assert.match(css,/clip-path:inset\(0 100% 0 0\)/);
 assert.match(css,/transition:clip-path 300ms cubic-bezier/);
 assert.match(css,/\.cc-sketch\.added \.cc-pill-wipe/);
 assert.match(css,/\.cc-sketch:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.cc-sketch\.product-add-button::before\{content:none!important\}/);
 assert.doesNotMatch(css,/cc-sketch-outline|cc-sketch-highlight|cc-sketch-art|cc-sketch-face-ink|filter:blur/);
 assert.match(app,/sketchButton\(\{label:'ADD TO BAG',variant:'long'/);
 assert.match(app,/const labels=add\.querySelectorAll\('\.cc-sketch-label,\.cc-sketch-label-ink'\)/);
 assert.match(app,/labels\.forEach\(label=>label\.textContent='ADD TO BAG'\)/);
 assert.match(preview,/id="reviewButtons"/);
 assert.match(previewJS,/states=\['default','hover','pressed','focus'\]/);
 assert.match(previewJS,/sketchButton\(/);
 assert.doesNotMatch(app,/product-add-arrow|ADDED ✓|ADD TO CART/);
});
test('compact sketch actions retain native submit semantics and working filter selectors',async()=>{
 const {sketchButton}=await import('../src/handdrawn-buttons.mjs');
 const markup=sketchButton({label:'Search',variant:'compact',className:'cc-sketch--inline',type:'submit'});
 assert.match(markup,/<button type="submit"/);
 const app=await read('src/app.mjs');
 assert.match(app,/label:'Search',variant:'compact',tone:'forest'/);
 assert.match(app,/label:'Join',variant:'compact',tone:'terracotta'/);
 assert.match(app,/id="clearFilters"/);
 assert.match(app,/class="shop-clear-filters"/);
 assert.match(app,/addEventListener\('submit'/);
 assert.match(app,/clearFilters/);
 const css=await read('src/button-system.css');
 assert.match(css,/\.search-inline \.cc-sketch/);
 assert.match(css,/\.newsletter-row \.cc-sketch/);
});


test('integrated pill labels remain centered, single-line and inherit variant contrast',async()=>{
 const storefront=await read('src/styles.css');
 const buttons=await read('src/button-system.css');
 assert.doesNotMatch(storefront,/\.product-meta span,\.product-meta small/);
 assert.equal((storefront.match(/\.product-meta > span,\.product-meta > \.product-price > small/g)||[]).length,2);
 assert.match(buttons,/\.cc-sketch \.cc-sketch-copy,[\s\S]*?position:absolute/);
 assert.match(buttons,/left:calc\(50% - var\(--cc-half-offset\)\)/);
 assert.match(buttons,/top:calc\(50% - var\(--cc-half-offset\)\)/);
 assert.match(buttons,/transform:translate\(-50%,-50%\)/);
 assert.match(buttons,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(buttons,/white-space:nowrap/);
 assert.match(buttons,/overflow-wrap:normal/);
 assert.match(buttons,/\.cc-sketch \.cc-sketch-label-ink\{\s*color:var\(--bg\)/);
 assert.match(buttons,/\.cc-sketch--beige\{--cc-paint:var\(--beige/);
 assert.match(buttons,/\.cc-sketch--terracotta\{--cc-paint:var\(--acc/);
 assert.match(buttons,/clip-path:inset\(0 100% 0 0\)/);
 const app=await read('src/app.mjs');
 assert.match(app,/sketchButton\(\{label:'ADD TO BAG',variant:'long',tone:'forest'/);
 assert.match(app,/const labels=add\.querySelectorAll/);
 assert.doesNotMatch(app,/product-add-arrow/);
});


test('polaroid cards are one reusable paper-photo retail component in every listing',async()=>{
 const app=await read('src/app.mjs');
 const css=await read('src/styles.css');
 assert.match(app,/function productCard\(item\)/);
 assert.match(app,/class="product-card product-card-shell"/);
 assert.match(app,/class="polaroid-card"/);
 assert.match(app,/class="polaroid-card-action"/);
 assert.match(app,/class="polaroid-photo"/);
 assert.match(app,/class="polaroid-caption-head"/);
 assert.match(app,/class="product-meta polaroid-caption"/);
 assert.match(app,/class="polaroid-name"/);
 assert.match(app,/class="polaroid-fit"/);
 assert.match(app,/data-photo-tone/);
 assert.match(app,/Number\(item\.visual\)%4/);
 assert.match(app,/class="favorite-toggle/);
 assert.match(app,/related\.map\(productCard\)/);
 assert.match(app,/visible\.map\(productCard\)/);
 assert.match(app,/block\.map\(productCard\)/);
 assert.match(app,/sketchButton\(\{label:'ADD TO BAG',variant:'long'/);
 assert.match(css,/\.product-card-shell > \.polaroid-card\{/);
 assert.match(css,/\.product-card\.polaroid-card\{\s*background:var\(--bg\)/);
 assert.match(css,/\.polaroid-card \.polaroid-photo/);
 assert.match(css,/\.polaroid-card \.polaroid-caption-head/);
 assert.match(css,/\.polaroid-card \.favorite-toggle/);
 assert.match(css,/\.polaroid-card \.product-visual \.shirt-svg/);
 for(const tone of ['0','1','2','3'])assert.ok(css.includes('data-photo-tone="'+tone+'"'));
 assert.doesNotMatch(app,/polaroid[^\n]*placeholder\s+lines/i);
});
test('polaroid card styles leave approved hover, Shop grid, pill and session cart alone',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css');
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(-1\.4deg\)/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(1\.4deg\)/);
 assert.match(css,/300ms cubic-bezier\(\.22,\.7,\.18,1\)/);
 assert.match(css,/\.product-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.product-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.product-card-shell > \.polaroid-card-action > \.cc-sketch\.product-add-button/);
 assert.match(css,/#collection \.product-card\.polaroid-card \.product-visual/);
 assert.match(app,/sessionStorage\.setItem\(demoBagKey/);
 assert.match(app,/updateFav\(id\)/);
 assert.match(app,/data-add-to-bag/);
 assert.match(app,/FEATURE_INTERVAL_MS=8200/);
});


test('photo tone wins over legacy homepage and even-card backgrounds on all listings',async()=>{
 const css=await read('src/styles.css');
 assert.match(css,/\.product-card\.polaroid-card \.product-visual,\s*#collection \.product-card\.polaroid-card \.product-visual/);
 assert.match(css,/\.product-card\.polaroid-card\[data-photo-tone="0"\]\{--photo-tone:#DDDAD3/);
 assert.match(css,/\.product-card\.polaroid-card\[data-photo-tone="1"\]\{--photo-tone:var\(--cream\)/);
 assert.match(css,/\.product-card\.polaroid-card\[data-photo-tone="2"\]\{--photo-tone:#D1D6C7/);
 assert.match(css,/\.product-card\.polaroid-card\[data-photo-tone="3"\]\{--photo-tone:var\(--mist\)/);
 assert.match(css,/\.product-card\.polaroid-card \.product-meta \.product-price\{\s*margin-top:7px;\s*padding-top:0/);
});


test('owner-approved Polaroid compactness and external stationary CTA have independent motion',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 assert.match(app,/class="product-card product-card-shell"/);
 assert.match(app,/class="polaroid-card"/);
 assert.match(app,/class="polaroid-card-action"/);
 const a=app.indexOf('function productCard(item)');
 const b=app.indexOf('function pager(',a);
 const card=app.slice(a,b);
 assert.ok(card.indexOf("'</div>'+\\n   '<div class=\"polaroid-card-action\"")<0 || card.includes("polaroid-card-action"));
 assert.ok(card.indexOf('polaroid-card-action')>card.indexOf('product-meta polaroid-caption'));
 assert.ok(card.indexOf('polaroid-card-action')>card.indexOf('product-price'));
 assert.match(css,/\.product-card\.product-card-shell\{/);
 assert.match(css,/width:96%/);
 assert.match(css,/\.product-card\.product-card-shell:hover\{/);
 assert.match(css,/transform:none!important/);
 assert.match(css,/\.product-card-shell > \.polaroid-card\{/);
 assert.match(css,/border-radius:10px/);
 assert.match(css,/\.product-card-shell > \.polaroid-card:hover\{/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(-1\.4deg\)/);
 assert.match(css,/\.product-card-shell:nth-child\(even\) > \.polaroid-card:hover\{/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(1\.4deg\)/);
 assert.match(css,/\.product-card-shell > \.polaroid-card-action\{/);
 assert.match(css,/margin:9px 0 0/);
 assert.match(css,/\.product-card-shell > \.polaroid-card-action > \.cc-sketch\.product-add-button\{/);
 assert.match(css,/@media\(hover:none\),\(pointer:coarse\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(card,/<div class="polaroid-card-action">[^]*?<div class="polaroid-card"/);
});
test('graphite shadow defaults and reusable dark-context contrasts preserve pill geometry',async()=>{
 const css=await read('src/button-system.css');
 const gallery=await read('src/button-preview.mjs');
 // One color source of truth: Graphite and approved surface-dependent gray shadows.
 assert.match(css,/--cc-shadow-graphite:var\(--ink\)/);
 assert.match(css,/--cc-shadow-on-dark:var\(--grey\)/);
 assert.match(css,/--cc-shadow-on-dark-beige:var\(--mush\)/);
 assert.match(css,/--cc-shadow-color:var\(--cc-shadow-graphite\)/);
 assert.match(css,/background:var\(--cc-shadow-color\)/);
 assert.doesNotMatch(css,/--cc-shadow-light-forest|--cc-shadow-light-beige|--cc-shadow-light-terracotta|--cc-shadow-dark-beige/);
 assert.doesNotMatch(css,/--cc-shadow-color:var\(--walnut|--cc-shadow-color:var\(--mush/);
 assert.match(css,/\.hero-cover/);
 assert.match(css,/\.site-footer/);
 assert.match(css,/\.cc-shadow-context--forest/);
 assert.match(css,/\.cc-shadow-context--olive/);
 assert.match(css,/\.cc-shadow-context--dark/);
 assert.match(css,/data-cc-surface="forest"/);
 assert.match(css,/data-cc-surface="dark"/);
 assert.match(css,/\.cc-sketch--beige\{\s*--cc-shadow-color:var\(--cc-shadow-on-dark-beige\)/);
 // The approved pill/sweep/press and offset must remain exact.
 assert.match(css,/--cc-offset:7px/);
 assert.match(css,/border:0;border-radius:9999px/);
 assert.match(css,/inset:var\(--cc-offset\) 0 0 var\(--cc-offset\)/);
 assert.match(css,/transition:clip-path 300ms cubic-bezier\(\.45,0,\.55,1\)/);
 assert.match(css,/\.cc-sketch:active,.cc-sketch\[data-preview-state="pressed"\]\{/);
 assert.match(css,/transform:translate\(2px,2px\)/);
 assert.match(gallery,/cc-shadow-context--/);
 assert.match(gallery,/surface-preview/);
 assert.match(gallery,/'forest','Forest Green'/);
 assert.match(gallery,/'olive','Dark Olive'/);
});


test('single gently imperfect SVG perimeter has responsive geometry and no decorative marks',async()=>{
 const {polaroidInkPath}=await import('../src/polaroid-outline.mjs');
 for(const [w,h] of [[266,348],[178,338],[168,337],[134,330]]){
  const d=polaroidInkPath(w,h);
  assert.ok(d.length>200);
  assert.equal((d.match(/\bM\b/g)||[]).length,2,'one continuous outer ring and inner cutout');
  assert.equal((d.match(/\bZ\b/g)||[]).length,2,'both contours closed');
  assert.ok(!/\bL\b|\bQ\b|stroke|scribble/i.test(d),'only smoothly curved geometry');
  assert.ok(d.includes(String(w-10.1))||d.includes(String(w-10.1+.0)));
  assert.ok(!d.includes('NaN')&&!d.includes('Infinity'));
 }
 assert.equal(polaroidInkPath(0,0),'');
 const js=await read('src/polaroid-outline.mjs');
 assert.match(js,/new ResizeObserver/);
 assert.match(js,/new MutationObserver/);
 assert.match(js,/target.offsetWidth,height=target.offsetHeight/);
 assert.match(js,/path.setAttribute\('fill-rule','evenodd'\)/);
 assert.match(js,/root.body\|\|root/);
 assert.match(js,/\.product-card-shell > \.polaroid-card/);
 assert.doesNotMatch(js,/<rect|<circle|<line|<polyline/);
});
test('single SVG frame border and solid rounded shadow preserve CTA isolation',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 const button=await read('src/button-system.css');
 assert.match(app,/installPolaroidOutlines\(document\)/);
 assert.match(app,/polaroid-outline\.mjs/);
 assert.match(css,/\.product-card-shell > \.polaroid-card\{/);
 assert.match(css,/border:1px solid transparent/);
 assert.match(css,/border-radius:10px/);
 assert.match(css,/box-shadow:4px 5px 0 var\(--grey\)/);
 assert.match(css,/\.product-card-shell > \.polaroid-card > \.polaroid-ink-outline\{/);
 assert.match(css,/max-width:none; \/\* override the global svg max-width:100% clamp \*\//);
 assert.match(css,/\.polaroid-ink-perimeter\{\s*fill:var\(--cc-frame-ink,var\(--mush\)\);\s*stroke:none/);
 assert.match(css,/\.product-card-shell > \.polaroid-card-action > \.cc-sketch\.product-add-button/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(-1\.4deg\)/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(1\.4deg\)/);
 assert.match(button,/--cc-offset:7px/);
 assert.match(button,/--cc-shadow-on-dark-beige:var\(--mush\)/);
 assert.match(app,/class="polaroid-card-action"/);
 assert.match(app,/label:'ADD TO BAG',variant:'long',tone:'forest'/);
});


test('Polaroid outline stays one variable-width SVG shape, with a light-gray frame shadow',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css');
 const source=await read('src/polaroid-outline.mjs');
 assert.match(css,/\.product-card-shell > \.polaroid-card\{/);
 assert.match(css,/border:1px solid transparent/);
 assert.match(css,/border-radius:10px/);
 assert.equal((css.slice(css.indexOf('/* CHAPCHITRA: approved compact paper-photo composition')).match(/box-shadow:4px 5px 0 var\(--grey\)/g)||[]).length,5);
 assert.doesNotMatch(css.slice(css.indexOf('/* CHAPCHITRA: approved compact paper-photo composition')),/box-shadow:5px 6px 0 #242424/);
 assert.match(css,/\.polaroid-ink-perimeter\{\s*fill:var\(--cc-frame-ink,var\(--mush\)\);\s*stroke:none/);
 assert.match(source,/fill-rule','evenodd'/);
 assert.match(source,/polaroidInkPath\(width,height\)/);
 assert.match(app,/class="polaroid-card-action"/);
});
test('Hero 1 Terracotta and both banner CTAs reuse approved pill without changing destinations',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css'),buttons=await read('src/button-system.css');
 assert.match(buttons,/\.hero-cover \.cc-sketch\.cc-sketch--beige\{\s*--cc-shadow-color:var\(--acc\)/);
 assert.match(buttons,/--cc-shadow-graphite:var\(--ink\)/);
 assert.match(buttons,/--cc-shadow-on-dark:var\(--grey\)/);
 assert.match(app,/sketchButton\(\{label:'Explore hand-dye studies',variant:'long',tone:'forest',href:'\/shop\/\?category=tie-dye'/);
 assert.match(app,/sketchButton\(\{label:"Visit Artist's Edit",variant:'long',tone:'forest',href:'\/artists-edit\/'/);
 assert.doesNotMatch(app,/class="text-link">Explore hand-dye studies ↗|class="text-link">Visit Artist’s Edit ↗/);
 assert.match(css,/\.banner-editorial-copy \.cc-sketch\.editorial-cta\{/);
 assert.doesNotMatch(css,/\.banner-editorial-copy \.text-link\{/);
 assert.match(buttons,/--cc-offset:7px/);
 assert.match(buttons,/clip-path:inset\(0 100% 0 0\)/);
});


test('authoritative SVG dry-brush tiles have high-frequency alpha paint deposits and voids',async()=>{
 const horiz=await read('src/assets/printed-edge-brush-horizontal.svg');
 const vert=await read('src/assets/printed-edge-brush-vertical.svg');
 assert.match(horiz,/viewBox="0 0 421 62"/);
 assert.match(vert,/viewBox="0 0 62 307"/);
 assert.match(vert,/transform="translate\(0 307\) rotate\(-90\)"/);
 for(const svg of [horiz,vert]){
  assert.match(svg,/maskUnits="userSpaceOnUse"/);
  assert.match(svg,/maskContentUnits="userSpaceOnUse"/);
  assert.match(svg,/mask-type:alpha/);
  assert.match(svg,/fill-rule="evenodd"/);
  assert.match(svg,/opacity="\.9"/);
  assert.match(svg,/opacity="\.48"/);
  assert.match(svg,/fill="#fff"/);
  assert.ok((svg.match(/\bM\d/g)||[]).length>120,'varied bristle strokes, spray and transparent dry-ink slots');
  assert.doesNotMatch(svg,/<image|base64|<filter|<animate|<script|<pattern/);
 }
});
test('banner four-edge and Featured top/bottom alpha masks are on unmasked background layers only',async()=>{
 const css=await read('src/styles.css'),app=await read('src/app.mjs');
 const section=css.slice(css.indexOf('/* CHAPCHITRA / approved 2026-11-03 brush reference'),
                         css.indexOf('/* CHAPCHITRA — approved layout corrections'));
 assert.ok(section.length>2000);
 assert.match(app,/function printedEdgeSurface\(featured=false\)/);
 assert.match(app,/cc-printed-surface--featured/);
 assert.match(app,/cc-printed-top/);
 assert.match(app,/cc-printed-bottom/);
 assert.match(app,/cc-printed-left/);
 assert.match(app,/cc-printed-right/);
 assert.match(section,/#banners > \.editorial-banner > :not\(\.cc-printed-surface\)/);
 assert.match(section,/#featured\.featured-zone > \.wrap/);
 assert.match(section,/pointer-events:none/);
 assert.match(section,/\.cc-printed-center\{\s*inset:37px/);
 assert.match(section,/mask-image:url\("\/assets\/printed-edge-brush-horizontal\.svg"\)/);
 assert.match(section,/mask-image:url\("\/assets\/printed-edge-brush-vertical\.svg"\)/);
 assert.match(section,/mask-size:421px 62px/);
 assert.match(section,/mask-size:62px 307px/);
 assert.match(section,/mask-repeat:repeat-x/);
 assert.match(section,/mask-repeat:repeat-y/);
 assert.match(section,/mask-mode:alpha/);
 assert.match(section,/#featured \.cc-printed-surface--featured > \.cc-printed-center\{\s*inset:37px 0/);
 assert.match(section,/#featured\.featured-zone > \.cc-printed-surface\{\s*--cc-printed-surface:var\(--deep\)/);
 assert.doesNotMatch(section,/animation:|transition:|grid-template-columns:|min-height:|filter:blur/);
 assert.match(app,/sketchButton\(\{label:'Explore hand-dye studies',variant:'long',tone:'forest'/);
 assert.match(app,/sketchButton\(\{label:"Visit Artist's Edit",variant:'long',tone:'forest'/);
 assert.match(app,/id="featuredFrames"/);
 assert.match(app,/id="featuredPrev"/);
 assert.match(app,/id="featuredNext"/);
});

test('sticky header, retone, and viewport carousel overrides stay localized',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 const patch=css.slice(css.indexOf('/* CHAPCHITRA — approved layout corrections'));
 assert.ok(patch.length>3600);
 assert.match(patch,/#app > \.site-header\{\s*position:-webkit-sticky;\s*position:sticky;\s*top:0/);
 assert.match(patch,/#banners > \.tie-banner\{\s*--cc-printed-surface:var\(--acc\);\s*color:var\(--bg\)/);
 assert.match(patch,/#banners > \.tie-banner \.banner-art-panel\{\s*background:var\(--beige\)/);
 assert.match(patch,/#featured \.featured-wide\{[\s\S]*width:100vw/);
 assert.match(patch,/#featured \.featured-wide \.featured-stage\{[\s\S]*max-width:none/);
 assert.match(patch,/#featured \.featured-wide \.featured-controls\{[\s\S]*position:absolute/);
 assert.match(patch,/#featured \.feature-product-info,[\s\S]*\.plate-disclaimer\{\s*display:none!important/);
 assert.match(patch,/#benefits\.benefit-section\{background:var\(--bg\)\}/);
 assert.match(app,/class="featured-wide"/);
 assert.match(app,/id="featuredCaption" class="sr-only"/);
 assert.match(app,/id="featuredHint" class="sr-only"/);
 assert.match(app,/FEATURE_INTERVAL_MS=8200/);
 assert.match(app,/featuredTimer/);
 assert.match(app,/featureStage\.addEventListener\('keydown'/);
});
test('Featured has straight full-bleed sides and zero vertical edge strips',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css');
 const src=app.slice(app.indexOf('function printedEdgeSurface'),app.indexOf('function banners()'));
 assert.match(src,/const sides=featured\?'':/);
 assert.match(src,/cc-printed-left/);
 assert.match(src,/cc-printed-right/);
 assert.match(css,/#featured \.cc-printed-surface--featured > \.cc-printed-center\{\s*inset:37px 0/);
 assert.match(css,/#featured\.featured-zone\{overflow:clip\}/);
 assert.match(css,/#featured \.featured-wide\{[\s\S]*?width:100vw/);
});


test('Safari viewport guard measures the real gap and ignores the announcement while visible',async()=>{
 const {navGeometry}=await import('../src/nav-sticky-guard.mjs');
 const header={getBoundingClientRect:()=>({top:24,height:82})};
 let bottom=35;
 const announcement={getBoundingClientRect:()=>({bottom})};
 const view={scrollY:0,visualViewport:{offsetTop:0}};
 const before=navGeometry(header,announcement,view);
 assert.equal(before.headerTop,24);
 assert.equal(before.scrollY,0);
 assert.equal(before.visualOffsetTop,0);
 assert.equal(before.announcementGone,false);
 assert.equal(before.gap,0);
 bottom=-12;
 view.scrollY=1400;
 const broken=navGeometry(header,announcement,view);
 assert.equal(broken.announcementGone,true);
 assert.equal(broken.headerTop,24);
 assert.equal(broken.gap,24);
 const correctedHeader={getBoundingClientRect:()=>({top:0,height:82})};
 const fixed=navGeometry(correctedHeader,announcement,view,-24);
 assert.equal(fixed.rawHeaderTop,24,'recover original unshifted geometry');
 assert.equal(fixed.gap,24,'stable correction avoids oscillation');
 assert.equal(fixed.adjustment,-24);
 view.visualViewport.offsetTop=24;
 const adjusted=navGeometry(header,announcement,view);
 assert.equal(adjusted.gap,0,'do not compensate when already aligned to the visual viewport');
});
test('only header alignment is updated: no arbitrary margin, spacer or navigation redesign',async()=>{
 const css=await read('src/styles.css'),app=await read('src/app.mjs'),guard=await read('src/nav-sticky-guard.mjs');
 const rule=css.slice(css.indexOf('/* Sticky header flush'),css.indexOf('/* Existing editorial component'));
 assert.match(rule,/#app\{overflow:visible\}/);
 assert.match(rule,/#app > \.site-header\{[\s\S]*?position:sticky;[\s\S]*?top:0/);
 assert.match(rule,/html,body\{overflow-x:visible\}/);
 assert.doesNotMatch(rule,/html,body\{overflow-x:clip\}/);
 assert.match(app,/announcement\(\)\+header\(\)/);
 assert.match(app,/installStickyViewportGuard\(document, window\)/);
 assert.match(guard,/visualViewport\?\.offsetTop/);
 assert.match(guard,/announcementBottom <= visualTop \+ 1/);
 assert.match(guard,/state\.announcementGone && state\.gap > 1/);
 assert.match(guard,/header\.style\.translate/);
 assert.match(guard,/requestAnimationFrame/);
 assert.match(guard,/visualViewport/);
 assert.match(guard,/navdebug/);
 assert.doesNotMatch(guard,/marginTop|margin-top|position:\\s*fixed|scrollIntoView|scrollBy\(/);
});


test('CHAPCHITRA desktop/tablet keeps single-row text; hamburger is mobile-only',async()=>{
 const src=await read('src/app.mjs'),css=await read('src/styles.css');
 const header=src.slice(src.indexOf('function header(){'),src.indexOf('const paperVisual='));
 const navLabels=['Shop','Artist’s Edit','Journal','About Us'];
 const links=['/artists-edit/','/journal/','/about/','/favorites/','/account/','/bag/'];
 for(const label of navLabels)assert.ok(header.includes(label),label);
 for(const link of links)assert.ok(header.includes('href="'+link+'"'),link);
 for(const className of ['nav-left','nav-center','logo-word logo-word--image','nav-actions'])
  assert.ok(header.includes('class="'+className+'"'));
 assert.match(header,/<a href="\/shop\/">Shop<\/a>/);
 assert.match(header,/<nav id="mobileNav"[^>]*hidden><a href="\/shop\/">Shop<\/a><a href="\/artists-edit\/">/);
 assert.doesNotMatch(header,/<details class="shop-dropdown"|class="nav-dropdown"/);
 assert.match(header,/id="menuButton"[^>]*aria-expanded="false"[^>]*aria-controls="mobileNav"/);
 assert.match(header,/id="mobileNav"[^>]*hidden/);
 assert.match(header,/id="searchPanel"[^>]*hidden/);
 assert.match(header,/id="searchButton"/);
 assert.match(header,/src="\/assets\/chapchitra-wordmark\.webp"/);
 assert.ok(header.indexOf('class="nav-left"')<header.indexOf('class="logo-word logo-word--image"'));
 assert.ok(header.indexOf('class="logo-word logo-word--image"')<header.indexOf('class="nav-actions"'));
 const rules=css.slice(css.indexOf('/* CHAPCHITRA — mathematical centered three-zone'));
 assert.match(rules,/grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/);
 assert.match(rules,/justify-self:center/);
 const navPriority=css.slice(css.indexOf('/* CHAPCHITRA — content-fitted desktop\/tablet priority'));
 assert.match(navPriority,/\.nav-left \.nav-center\{display:flex\}/);
 assert.match(navPriority,/\.nav-left \.hamburger\{display:none\}/);
 assert.match(navPriority,/@media \(max-width:740px\)/);
 assert.match(navPriority,/\.nav-left \.nav-center\{display:none\}/);
 assert.match(navPriority,/\.nav-left \.hamburger\{\s*display:inline-grid/);
 assert.match(navPriority,/\.nav-actions \.nav-optional-action\{display:none\}/);
 assert.match(navPriority,/\.mobile-nav:not\(\[hidden\]\)/);
 assert.match(navPriority,/min-height:44px/);
 assert.match(src,/matchMedia\('\(max-width:740px\)'\)/);
 assert.match(src,/menuButton\.addEventListener\('click'/);
 assert.match(src,/toggle\(mobileNav,menuButton,false\)/);
 assert.doesNotMatch(src,/mobileShopPopover|mobileShopPopover\.hidden/);
});
test('authentic cropped final logo used in navbar, Hero 1, footer and favicon',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css'),html=await read('src/index.html');
 const guard=await read('src/nav-sticky-guard.mjs');
 assert.match(app,/class="logo-word logo-word--image"/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark\.webp"/);
 assert.match(app,/src="\/assets\/chapchitra-full-on-dark\.webp"/);
 assert.match(app,/class="hero-brand-lockup"/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark-light\.webp"/);
 assert.match(app,/class="logo-word logo-word--footer"/);
 assert.match(html,/rel="icon"[^>]*href="\/assets\/favicon\.png"/);
 assert.match(html,/rel="apple-touch-icon"[^>]*href="\/assets\/apple-touch-icon\.png"/);
 assert.match(html,/rel="preload" as="image" href="\/assets\/chapchitra-full-on-dark\.webp"/);
 assert.doesNotMatch(app,/<div class="hero-display-word">CHAPCHITRA<\/div>/);
 assert.doesNotMatch(app,/Temporary wordmark|final logo pending|Identity, pricing and images remain provisional/);
 assert.doesNotMatch(app,/<span>CHAPCHITRA<\/span>/);
 assert.match(css,/#app > \.site-header \.logo-word\.logo-word--image/);
 assert.match(css,/\.hero-cover-inner > img\.hero-brand-lockup/);
 assert.match(css,/\.footer-identity \.logo-word--footer img/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/);
 assert.match(guard,/visualViewport/);
 assert.match(guard,/state\.announcementGone && state\.gap > 1/);
});
test('all final logo binaries are real optimized image files with expected magic bytes',async()=>{
 const webps=['chapchitra-wordmark.webp','chapchitra-wordmark-light.webp',
  'chapchitra-symbol.webp','chapchitra-full.webp','chapchitra-full-on-dark.webp'];
 for(const file of webps){
  const data=await readFile(new URL('../src/assets/'+file,import.meta.url));
  assert.ok(data.length>2000,'real artwork content '+file);
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
 }
 for(const file of ['favicon.png','apple-touch-icon.png']){
  const data=await readFile(new URL('../src/assets/'+file,import.meta.url));
  assert.ok(data.length>3000);
  assert.deepEqual([...data.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 }
});


test('owner-rejected visible Polaroid border stays hidden without removing shadow or tilt',async()=>{
 const css=await read('src/styles.css');
 const rule=css.match(/\.product-card-shell > \.polaroid-card > \.polaroid-ink-outline\{([\s\S]*?)\}/)?.[1];
 assert.ok(rule,'exact Polaroid overlay selector exists');
 assert.match(rule,/display:none;/,'no outline may be painted on the paper frame');
 assert.doesNotMatch(rule,/display:block;/);
 assert.match(css,/border:1px solid transparent/);
 assert.match(css,/box-shadow:4px 5px 0 var\(--grey\)/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(-1\.4deg\)/);
 assert.match(css,/translate3d\(0,-5px,0\) rotate\(1\.4deg\)/);
});


test('Shop retains its static banner and adds Price between existing Category, Size and Color',async()=>{
 const src=await read('src/app.mjs'),css=await read('src/styles.css');
 const shop=src.slice(src.indexOf(' function shop(){'),src.indexOf(' function artistsEdit(){'));
 assert.ok(shop.includes('class="shop-banner"'),'static approved Shop banner retained');
 assert.ok(shop.includes('id="shopBannerTitle">Shop All'));
 assert.ok(shop.includes('shop-banner-art-frame'));
 assert.doesNotMatch(shop,/hero-carousel|setInterval|autoplay|gsap|parallax|shop-controls/);
 assert.match(shop,/class="shop-layout"/);
 assert.match(shop,/id="shopFilterSidebar"/);
 for(const title of ['All Products','Regular','Category','Price','Size','Color','Clear Filters'])
  assert.ok(shop.includes(title),title);
 assert.match(shop,/categoryGroup\+priceGroup\+sizeGroup\+colorGroup/);
 assert.equal((shop.match(/'<fieldset class="shop-filter-group /g)||[]).length,4);
 assert.match(shop,/const sizeOptions=\['S','M','L','XL','XXL'\]/);
 assert.match(shop,/const colorOptions=\['black','white','red','yellow','green','blue'\]/);
 assert.match(shop,/type="checkbox" name="shopSize"/);
 assert.match(shop,/type="checkbox" name="shopColor"/);

 assert.match(shop,/name="shopPriceOrder" value="default" checked/);
 assert.match(shop,/name="shopPriceOrder" value="price-asc"/);
 assert.match(shop,/name="shopPriceOrder" value="price-desc"/);
 assert.match(shop,/Price: Low to High/);
 assert.match(shop,/Price: High to Low/);
 assert.match(shop,/shopHasVerifiedPrices\?'':' disabled'/);
 assert.match(shop,/Price sorting is unavailable until approved prices are added/);

 assert.match(shop,/aria-label="Size /);
 assert.match(shop,/aria-label="'\+color\[0\]\.toUpperCase/);
 assert.match(shop,/categories\.map\(c=>\(\{value:c\.id/);
 assert.doesNotMatch(shop,/shopAudience|shopPrint|Fit \/ Audience|Print Style|Print Type|value="unisex"|filterPrice|Newest/);
 for(const id of ['shopFilterForm','shopResults','shopCollectionTitle','shopProducts','shopPager','shopSort',
                   'filterSummary','shopFilterBackdrop','openShopFilters','closeShopFilters'])
  assert.ok(shop.includes('id="'+id+'"'),id);
 assert.ok(shop.includes('product-grid shop-product-grid'));
 assert.doesNotMatch(shop,/Shop by category/);
 const shopStyles=css.slice(css.indexOf('/* CHAPCHITRA Shop: static editorial banner'));
 assert.match(shopStyles,/min-height:270px/);
 assert.match(shopStyles,/grid-template-columns:minmax\(190px,205px\) minmax\(0,1fr\)/);
 assert.match(shopStyles,/\.shop-layout\{\s*display:grid/);
 assert.match(shopStyles,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(shopStyles,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(shopStyles,/\.shop-size-option input:checked \+ span/);
 assert.match(shopStyles,/\.shop-color-option input:checked \+ \.shop-color-dot/);
 assert.match(shopStyles,/\[data-color="white"\]/);
 assert.match(shopStyles,/@media\(max-width:740px\)/);
 assert.match(shopStyles,/\.shop-filter-backdrop:not\(\[hidden\]\)/);
 assert.match(shopStyles,/\.shop-sidebar\.is-open/);
 assert.doesNotMatch(shopStyles,/@keyframes|animation:/);
});

test('Shop size/color filters map only verified metadata and persist multi-selection',async()=>{
 const src=await read('src/app.mjs');
 const h=src.slice(src.indexOf(" if(route==='shop'){"),src.indexOf(" if(route==='favorites'){"));
 for(const key of ['shopCategory','shopSize','shopColor','category','size','color','sort','page','q'])
  assert.ok(h.includes(key),'state key '+key);
 assert.match(h,/item\.category\.includes\(filters\.category\)/);
 assert.match(h,/Array\.isArray\(item\.sizes\)/);
 assert.match(h,/Array\.isArray\(item\.colors\)/);
 assert.match(h,/hasMatchingData\(item,'sizes',filters\.sizes\)/);
 assert.match(h,/hasMatchingData\(item,'colors',filters\.colors\)/);
 assert.match(h,/const validated=\(name,allowed\)=>\[\.\.\.new Set\(qs\.getAll\(name\)/);
 assert.match(h,/filters\.sizes\.forEach\(size=>p\.append\('size',size\)\)/);
 assert.match(h,/filters\.colors\.forEach\(color=>p\.append\('color',color\)\)/);
 assert.match(h,/hasSizeMetadata/);
 assert.match(h,/hasColorMetadata/);
 assert.match(h,/metadataPending/);
 assert.match(h,/0 verified matches/);
 assert.match(h,/No verified matches can be shown yet/);
 assert.match(h,/a\.name\.localeCompare\(b\.name\)/);
 assert.match(h,/b\.name\.localeCompare\(a\.name\)/);
 assert.match(h,/renderShop=function\(\)/);
 assert.match(h,/pageNum=1;renderShop\(\)/);
 assert.match(h,/history\.replaceState/);
 assert.match(h,/mobileFilterQuery=window\.matchMedia\('\(max-width:740px\)'\)/);
 assert.match(h,/sidebar\.setAttribute\('role','dialog'\)/);
 assert.match(h,/sidebar\.setAttribute\('aria-modal','true'\)/);
 assert.match(h,/sidebar\.addEventListener\('keydown'/);
 assert.doesNotMatch(h,/shopAudience|shopPrint|allowedAudiences|allowedPrints|filters\.audience|filters\.print|createdAt|dateAdded|item\.price\s*[<>]/);
 assert.equal(catalog.length,64);
 assert.ok(catalog.every(p=>p.price===null));
 assert.ok(catalog.every(p=>!('sizes' in p)&&!('colors' in p)),'no invented catalog metadata');
});


test('Price sorting is numeric, gated on verified prices, and happens before pagination',async()=>{
 const src=await read('src/app.mjs'),css=await read('src/styles.css');
 const h=src.slice(src.indexOf(" if(route==='shop'){"),src.indexOf(" if(route==='favorites'){"));
 assert.match(src,/const shopHasVerifiedPrices=catalog\.length>0&&catalog\.every\(item=>/);
 assert.match(src,/typeof item\.price==='number'&&Number\.isFinite\(item\.price\)&&item\.price>=0/);
 assert.match(h,/setChoice\('shopPriceOrder',shopHasVerifiedPrices&&\['price-asc','price-desc'\]\.includes\(qs\.get\('sort'\)\)/);
 assert.match(h,/const activeSort=\(\)=>/);
 assert.match(h,/shopHasVerifiedPrices&&priceOrder!=='default'\?priceOrder:sort\.value/);
 assert.match(h,/p\.set\('sort',activeSort\(\)\)/);
 assert.match(h,/activeSort\(\)==='price-asc'\)filtered\.sort\(\(a,b\)=>a\.price-b\.price\)/);
 assert.match(h,/activeSort\(\)==='price-desc'\)filtered\.sort\(\(a,b\)=>b\.price-a\.price\)/);
 assert.ok(h.indexOf("if(activeSort()==='price-asc')")<h.indexOf('const visible=filtered.slice('),'price sorting before pagination');
 assert.match(h,/if\(event\.target\.name==='shopPriceOrder'\)sort\.value='default'/);
 assert.match(h,/sort\.addEventListener\('change',\(\)=>\{\s*setChoice\('shopPriceOrder','default'\)/);
 assert.match(h,/pageNum=1;renderShop\(\)/);
 assert.match(css,/\.shop-filter-group--price \.shop-filter-option--disabled/);
 assert.match(css,/\.shop-filter-group--price \.shop-filter-option input:disabled/);
 assert.equal(catalog.length,64);
 assert.ok(catalog.every(item=>item.price===null),'no invented numeric product prices');
});

test('homepage and non-Shop sections retain their existing nav routes and assets',async()=>{
 const app=await read('src/app.mjs'),css=await read('src/styles.css');
 assert.match(app,/function home\(\)/);
 assert.match(app,/function artistsEdit\(\)/);
 assert.match(app,/function journal\(\)/);
 assert.match(app,/function about\(\)/);
 assert.match(app,/class="logo-word logo-word--image"/);
 assert.match(app,/src="\/assets\/chapchitra-wordmark\.webp"/);
 assert.match(app,/setInterval\(\(\)=>changeHero\(\(active\+1\)%slides\.length,false\),4000\)/);
 assert.match(css,/\.site-header\{position:sticky;top:0/);
});
