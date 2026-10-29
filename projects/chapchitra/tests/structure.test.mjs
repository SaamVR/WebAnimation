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
 assert.match(css,/\.featured-zone\{background:#0c0b0b/);
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


test('authoritative Forest + Olive reference tokens are exact, not genericized',async()=>{
 const css=await read('src/styles.css');
 const values={
  '--deep':'#1C241D','--press':'#293D2D','--olive':'#1F2216',
  '--walnut':'#6E523F','--ink':'#232323','--bg':'#F6F7F5',
  '--grey':'#D9DCD7','--mist':'#E9EDEB','--beige':'#D8CEC2',
  '--cream':'#E4E3DE','--mush':'#A6A29B','--acc':'#8A503B',
  '--mut':'#5F625E'
 };
 for(const [token,hex] of Object.entries(values)){
  assert.ok(css.includes(token+':'+hex),token+' must equal '+hex);
 }
});
test('exact homepage section and individual card background mapping is maintained',async()=>{
 const css=await read('src/styles.css');
 const app=await read('src/app.mjs');
 const required=[
  '.announcement','background:var(--deep)',
  '.site-header','background:var(--bg)',
  '.hero-carousel','background:var(--bg)',
  '.benefit-section','background:var(--mist)',
  '.category-card:nth-child(1) .category-image{background:var(--cream)}',
  '.category-card:nth-child(2) .category-image{background:var(--press)',
  '.category-card:nth-child(3) .category-image{background:var(--acc)',
  '#collection:before','background:var(--mist);z-index:-1',
  '#collection .product-visual','background:#fff',
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


test('owner-approved card tilt is unchanged while product metadata gains exactly 14px inset',async()=>{
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


test('owner Buttons.png creates two distinct SVG contours and three tone variants',async()=>{
 const {sketchButton,sketchArt,sketchVariants,sketchTones}=await import('../src/handdrawn-buttons.mjs');
 assert.deepEqual(sketchVariants,['compact','long']);
 assert.deepEqual(sketchTones,['forest','terracotta','beige']);
 assert.notEqual(sketchArt('compact'),sketchArt('long'));
 for(const variant of sketchVariants)for(const tone of sketchTones){
  const html=sketchButton({label:'ADD TO BAG',variant,tone,attrs:'data-add-to-bag="sample"'});
  assert.match(html,/<button type="button"/);
  assert.match(html,/class="cc-sketch cc-sketch--/);
  assert.ok(html.includes('cc-sketch--'+variant));
  assert.ok(html.includes('cc-sketch--'+tone));
  assert.match(html,/cc-sketch-shadow/);
  assert.match(html,/cc-sketch-outline/);
  assert.match(html,/cc-sketch-highlight/);
  assert.match(html,/cc-sketch-face-ink/);
  assert.match(html,/cc-sketch-label-ink/);
  assert.doesNotMatch(html,/<img|\.png|product-add-arrow|↗|→|✓/);
 }
 assert.match(sketchButton({label:'Shop Now',href:'/shop/'}),/<a href="\/shop\/"/);
});
test('sketch SVG face and label share directional wipe and motion preferences',async()=>{
 const css=await read('src/button-system.css');
 const app=await read('src/app.mjs');
 const preview=await read('src/buttons/index.html');
 const previewJS=await read('src/button-preview.mjs');
 assert.match(css,/\.cc-sketch-face-ink\{\s*fill:var\(--cc-ink\)/);
 assert.match(css,/clip-path:inset\(0 100% 0 0\)/);
 assert.match(css,/transition:clip-path 300ms cubic-bezier/);
 assert.match(css,/\.cc-sketch\.added \.cc-sketch-face-ink/);
 assert.match(css,/\.cc-sketch:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.cc-sketch\.product-add-button::before\{content:none!important\}/);
 assert.match(app,/sketchButton\(\{label:'ADD TO BAG',variant:'long'/);
 assert.match(app,/const labels=add\.querySelectorAll\('\.cc-sketch-label,\.cc-sketch-label-ink'\)/);
 assert.match(app,/labels\.forEach\(label=>label\.textContent='ADD TO BAG'\)/);
 assert.match(app,/sheet\.href='\/button-system\.css'/);
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
 assert.match(app,/label:'Clear Filters',variant:'compact',tone:'beige'/);
 assert.match(app,/attrs:'id="clearFilters"'/);
 assert.match(app,/addEventListener\('submit'/);
 assert.match(app,/clearFilters/);
 const css=await read('src/button-system.css');
 assert.match(css,/\.search-inline \.cc-sketch/);
 assert.match(css,/\.newsletter-row \.cc-sketch/);
});


test('integrated sketch labels remain semantically isolated from product metadata styles',async()=>{
 const storefront=await read('src/styles.css');
 const buttons=await read('src/button-system.css');
 assert.doesNotMatch(storefront,/\.product-meta span,\.product-meta small/);
 assert.equal((storefront.match(/\.product-meta > span,\.product-meta > \.product-price > small/g)||[]).length,2);
 assert.match(buttons,/\.cc-sketch \.cc-sketch-copy,[\s\S]*?position:absolute/);
 assert.match(buttons,/left:50%;top:50%/);
 assert.match(buttons,/transform:translate\(-50%,-50%\) translateY\(-2px\)/);
 assert.match(buttons,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(buttons,/white-space:nowrap/);
 assert.match(buttons,/overflow-wrap:normal/);
 assert.match(buttons,/\.cc-sketch \.cc-sketch-label-ink\{color:#fff\}/);
 assert.match(buttons,/\.cc-sketch--beige\{--cc-paint:var\(--beige/);
 assert.match(buttons,/\.cc-sketch--terracotta\{--cc-paint:var\(--acc/);
 assert.match(buttons,/clip-path:inset\(0 100% 0 0\)/);
 const app=await read('src/app.mjs');
 assert.match(app,/sketchButton\(\{label:'ADD TO BAG',variant:'long',tone:'forest'/);
 assert.match(app,/const labels=add\.querySelectorAll/);
 assert.doesNotMatch(app,/product-add-arrow/);
});
