import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html = readFileSync(new URL('../../site/threads/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../../site/threads/app.mjs', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../../site/threads/catalog.mjs', import.meta.url), 'utf8');
const pack = readFileSync(new URL('../../site/threads/backpack.svg', import.meta.url), 'utf8');
const cropper = readFileSync(new URL('../../site/threads/art-crops.mjs', import.meta.url), 'utf8');
const sections = ['id="top"','class="hero panel-wrap"','id="categories"','id="shop"','id="about"','id="mission"','id="arrivals"','class="panel-wrap sale section-space"','id="deal"','class="site-footer"'];
test('all canonical sections appear in screenshot order', () => {
  let last = -1;
  for(const marker of sections){const i=html.indexOf(marker);assert(i>=0, marker);assert(i>last,marker+' must follow the previous section');last=i;}
});
test('T01/T02/T03 locations exist but choreographies and T04 are deferred',()=>{
  assert.match(html,/id="search-button"/);
  assert.match(script,/data-add=/);
  assert.match(html,/id="deal-heading"/);
  assert.doesNotMatch(html,/GSAP|gsap|payment-modal/i);
  assert.match(html,/T04 · Checkout coming next/);
});
test('independent of CMS runtime and real payment',()=>{
  assert.doesNotMatch(html,/EcomCMS|ezcomo|checkout\.stripe|paystack/i);
  assert.doesNotMatch(script,/supabase|stripe|checkout/i);
  assert.match(html,/Sample products and demo cart only/);
  assert.match(pack,/<svg/);
  assert.match(cropper,/art-atlas\.webp/);
  assert.doesNotMatch(cropper,/EcomCMS|ezcomo|fetch\(/i);
});
test('four featured and six arrival products',()=>{
  assert.equal((script.match(/group:'featured'/g)||[]).length,4);
  assert.equal((script.match(/group:'arrival'/g)||[]).length,6);
});

test('approved supplied header identity and hero/deal image assets are referenced',()=>{
  assert.match(html,/assets\/threads-wordmark-2e453a\.png/);
  for(const name of ['search','favorite','cart']) assert.ok(html.includes('assets/header-'+name+'.png'));
  for(const link of ['HOME','SHOP','COLLECTION','ABOUT']) assert.ok(html.includes('>'+link+'</a>'));
  assert.match(html,/assets\/threads-hero\.webp/);
  assert.match(html,/assets\/deal-backpack-owner-new-20261018\.webp/);
  assert.doesNotMatch(html,/class="hero-doodle"|data-ref-img="hero"|data-ref-img="backpack"/);
  assert.match(html,/Shopping cart/);
});

test('Deal of the Week uses the isolated backpack as a separate image',()=>{assert.match(html,/deal-backpack-owner-new-20261018\.webp/)});

const css = readFileSync(new URL('../../site/threads/styles.css', import.meta.url), 'utf8');
test('desktop content max width does not revert to the narrow 1140px demo',()=>{
  assert.match(css,/--content:1840px/);
  assert.match(css,/--edge:clamp\(16px,3\.5vw,56px\)/);
  assert.match(css,/min-width:901px/);
});

test('owner palette and original full-resolution category art replace screenshot thumbnail crops',()=>{
 const palette = readFileSync(new URL('../../site/threads/palette-approved-20261018.css',import.meta.url),'utf8');
 for(const hex of ['#F9F9F7','#F1EFEB','#EEECE8','#AED5A9','#2E453A','#172B2E']) assert.ok(palette.includes(hex),'missing '+hex);
 for(const category of ['sneakers','bags','accessories']) assert.match(html,new RegExp('assets/category-'+category+'\\.webp'));
 for(const old of ['data-ref-img="cat-sneaker"','data-ref-img="cat-bag"','data-ref-img="cat-accessory"']) assert.ok(!html.includes(old),'old atlas mapping would override new category illustration');
 assert.ok(html.includes('palette-approved-20261018.css'));
});

test('Deal of the Week uses one SVG panel and editable accessible copy',()=>{
  const section=html.split('<section class="content-wrap threads-deal')[1].split('</section>')[0];
  assert.equal((section.match(/<svg /g)||[]).length,1);
  assert.equal((section.match(/<path /g)||[]).length,1);
  assert.equal((section.match(/<img /g)||[]).length,1);
  assert.match(section,/data-t03-layer="backpack"/);
  assert.match(section,/Deal Of<br>the Week/);
  assert.match(section,/Shop the Deals/);
  assert.doesNotMatch(section,/backpack-promo|promo-image|deal-week-original-panel|deal-week-mobile/);
  const layout=readFileSync(new URL('../../site/threads/deal-of-week-rebuild-20261018.css',import.meta.url),'utf8');
  assert.match(layout,/display: grid/);
  assert.match(layout,/grid-template-columns/);
  assert.match(section,/#EEECE8/);
  assert.ok(html.includes('deal-of-week-rebuild-20261018.css'));
  assert.ok(!html.includes('deal-backpack-background-20261018.css'));
});

test('all six approved artwork sections use owned local media and keep their order',()=>{
  const paths=['header-search.png','header-favorite.png','header-cart.png','featured-olive-sneaker-owner-20261018.webp','featured-yellow-cap-owner-20261018.webp','featured-orange-duffel-owner-20261018.webp','featured-black-headphones-owner-20261018.webp','editorial-main.webp','editorial-detail-1.webp','editorial-detail-2.webp','editorial-detail-3.webp','editorial-detail-4.webp','campaign-owner-full-20261018.webp','sale-moody-sneakers.webp','deal-backpack-owner-new-20261018.webp'];
  for(const name of paths){
    assert.ok(readFileSync(new URL('../../site/threads/assets/'+name,import.meta.url)).length>800,'missing/empty '+name);
  }
  assert.ok(html.includes('./artwork-review-20261018.css'));
  for(const name of ['header-search.png','header-favorite.png','header-cart.png','editorial-complete-20261018.webp','campaign-owner-full-20261018.webp','sale-moody-sneakers.webp','deal-backpack-owner-new-20261018.webp']) assert.ok(html.includes(name),'not wired '+name);
  for(const name of ['featured-olive-sneaker-owner-20261018.webp','featured-yellow-cap-owner-20261018.webp','featured-orange-duffel-owner-20261018.webp','featured-black-headphones-owner-20261018.webp']) assert.ok(script.includes(name),'not wired '+name);
  assert.doesNotMatch(html,/data-ref-img="editorial|data-ref-img="campaign"|data-ref-img="sale"/);
  assert.match(html,/id="featured-products"/);
  assert.match(html,/id="arrival-products"/);
});

test('browser-safe asset layer retains exact product photos and deal compositing',()=>{
 const compat=readFileSync(new URL('../../site/threads/artwork-paint-fix-20261018.css',import.meta.url),'utf8');
 assert.ok(html.includes('artwork-paint-fix-20261018.css'));
 for(const name of ["featured-olive-sneaker-owner-20261018.webp","featured-yellow-cap-owner-20261018.webp","featured-orange-duffel-owner-20261018.webp","featured-black-headphones-owner-20261018.webp"]){
   assert.ok(script.includes(name));
   assert.ok(readFileSync(new URL('../../site/threads/assets/'+name,import.meta.url)).length>2000);
 }
 assert.match(compat,/mix-blend-mode:normal/);
 assert.match(compat,/mix-blend-mode:normal/);
});

test('feature art remains paintable in full-page screenshot QA',()=>{
 const compat=readFileSync(new URL('../../site/threads/artwork-visibility-20261018.css',import.meta.url),'utf8');
 assert.ok(html.includes('artwork-visibility-20261018.css'));
 assert.match(compat,/content-visibility:visible/);
 assert.ok(script.includes("p.group==='featured'?'eager':'lazy'"));
});

test('Quality collage is a single contained artwork; original banner remains',()=>{
  const section=html.split('<section id="about"')[1].split('</section>')[0];
  assert.ok(section.includes('editorial-complete-20261018.webp'));
  assert.equal((section.match(/<img /g)||[]).length,1);
  assert.ok(section.includes('We Provide Quality.'));
  assert.ok(section.includes('Explore Our Story'));
  const campaign=html.split('<section id="mission"')[1].split('</section>')[0];
  assert.ok(campaign.includes('campaign-owner-full-20261018.webp'));
  assert.ok(campaign.includes('Built for a'));
  const style=readFileSync(new URL('../../site/threads/section-fidelity-20261018.css',import.meta.url),'utf8');
  assert.ok(style.includes('#about .collage'));
  assert.ok(style.includes('overflow: hidden'));
  assert.ok(style.includes('aspect-ratio: auto'));
  assert.ok(style.includes('min-height: clamp(375px, 30vw, 560px)'));
  assert.ok(html.includes('section-fidelity-20261018.css'));
  assert.ok(readFileSync(new URL('../../site/threads/assets/editorial-complete-20261018.webp',import.meta.url)).length>20000);
});

test('approved two-tier Threads footer uses inverted real logo, email demo, and four nav columns',()=>{
  const footer=html.split('<footer class="site-footer"')[1].split('</footer>')[0];
  assert.ok(footer.includes('threads-footer-logo-inverted.png'));
  assert.equal((footer.match(/<img /g)||[]).length,1);
  assert.ok(footer.includes('threads-footer-top'));
  assert.ok(footer.includes('threads-footer-newsletter'));
  assert.ok(footer.includes('threads-footer-nav'));
  for(const label of ['Shop','About','Help','Company']) assert.ok(footer.includes('<h3>'+label+'</h3>'));
  assert.equal((footer.match(/class="threads-footer-links/g)||[]).length,4);
  assert.ok(footer.includes('newsletter-form')&&footer.includes('newsletter-email')&&footer.includes('newsletter-status'));
  assert.ok(footer.includes('email addresses are not collected'));
  assert.ok(!footer.includes('◎ &nbsp; ◇'));
  const stylesheet=readFileSync(new URL('../../site/threads/footer-reference-20261018.css',import.meta.url),'utf8');
  assert.ok(stylesheet.includes('grid-template-columns: repeat(4, minmax(0, 1fr))'));
  assert.ok(stylesheet.includes('grid-template-columns: repeat(2,minmax(0,1fr))'));
  assert.ok(stylesheet.includes('#172B2E'));
  assert.ok(html.includes('footer-reference-20261018.css'));
  assert.ok(readFileSync(new URL('../../site/threads/assets/threads-footer-logo-inverted.png',import.meta.url)).length>2000);
});

test('catalog polish follows the approved palette and currency, without changing motion',()=>{
 const polish=readFileSync(new URL('../../site/threads/market-catalog-polish-20261018.css',import.meta.url),'utf8');
 assert.ok(html.includes('market-catalog-polish-20261018.css'));
 assert.ok(polish.includes('.hero .pill-light')&&polish.includes('#AED5A9'));
 assert.ok(polish.includes('border-radius: 21px')&&polish.includes('box-shadow:'));
 assert.ok(polish.includes('.category-card:nth-child(2) img'));
 assert.ok(polish.includes('.category-card:nth-child(3) img'));
 assert.ok(html.includes('id="bag-total">Tk 0'));
 assert.ok(script.includes("export const priceTk = amount => 'Tk ' + Math.round(amount).toLocaleString('en-BD')"));
 assert.doesNotMatch(script,/price:\d+\.\d+/);
 assert.doesNotMatch(html,/\$\d/);
});

test('three complete top-row owner shoes are local and no longer overridden by atlas crops',()=>{
 for (const name of ['aqua','crimson','amber']) {
   assert.ok(script.includes('./assets/arrival-'+name+'-runner.webp'));
   assert.ok(readFileSync(new URL('../../site/threads/assets/arrival-'+name+'-runner.webp',import.meta.url)).length>10000);
 }
 assert.ok(script.includes('imageUrl(p)'));
 assert.ok(script.includes("name:'Aqua Motion Runner'"));
 assert.ok(script.includes("name:'Crimson Track Runner'"));
 assert.ok(script.includes("name:'Amber Street Runner'"));
 // The user image truncates the bottom row; leave existing cards intact pending full source.
 assert.ok(script.includes("id:'n4'")&&script.includes("id:'n5'")&&script.includes("id:'n6'"));
});

test('2026-10-18 latest owner featured art and three previously approved bottom-row shoes',()=>{
  const source=readFileSync(new URL('../../site/threads/catalog.mjs',import.meta.url),'utf8');
  for(const filename of ['featured-olive-sneaker-owner-20261018.webp','featured-yellow-cap-owner-20261018.webp','featured-orange-duffel-owner-20261018.webp','featured-black-headphones-owner-20261018.webp','arrival-bottom-orange-cream-20261018.webp','arrival-bottom-lime-20261018.webp','arrival-bottom-black-teal-20261018.webp']){
    assert.ok(source.includes(filename),filename);
    assert.ok(readFileSync(new URL('../../site/threads/assets/'+filename,import.meta.url)).length>12000,filename);
  }
  for(const match of ["id:'n1'","id:'n2'","id:'n3'"])assert.ok(source.includes(match),'Top arrival row changed');
  for(const id of ['n4','n5','n6'])assert.ok(source.includes("id:'"+id+"', group:'arrival', asset:"));
  assert.ok(source.includes("name:'Sunburst Baseball Cap'"));
  assert.ok(source.includes("name:'Teal Night Runner'"));
});
test('2026-10-18 full owner campaign and independent Deal backpack preserve the single SVG panel',()=>{
  const artCss=readFileSync(new URL('../../site/threads/threads-asset-fidelity-20261018.css',import.meta.url),'utf8');
  assert.ok(html.includes('threads-asset-fidelity-20261018.css'));
  assert.ok(html.includes('campaign-owner-full-20261018.webp'));
  assert.ok(html.includes('deal-backpack-owner-new-20261018.webp'));
  assert.ok(html.includes('data-t03-layer="backpack"'));
  assert.match(artCss,/object-position: right center/);
  assert.match(artCss,/max-width: 620px/);
  assert.match(artCss,/object-fit: contain/);
  assert.ok(readFileSync(new URL('../../site/threads/assets/campaign-owner-full-20261018.webp',import.meta.url)).length>100000);
  assert.ok(readFileSync(new URL('../../site/threads/assets/deal-backpack-owner-new-20261018.webp',import.meta.url)).length>100000);
});

test('latest featured image swap preserves storefront structure and maps four local cutouts',()=>{
 const featured=['Olive Sport Runner','Sunburst Baseball Cap','Orange Weekender Duffel','Studio Wireless Headphones'];
 const filenames=['featured-olive-sneaker-owner-20261018.webp','featured-yellow-cap-owner-20261018.webp','featured-orange-duffel-owner-20261018.webp','featured-black-headphones-owner-20261018.webp'];
 for(let i=0;i<featured.length;i++){
   assert.ok(script.includes("name:'"+featured[i]+"'"),featured[i]);
   assert.ok(script.includes(filenames[i]),filenames[i]);
   assert.ok(readFileSync(new URL('../../site/threads/assets/'+filenames[i],import.meta.url)).length>8000);
 }
 assert.ok(script.includes("id:'f3', group:'featured', asset:")&&script.includes("category:'Bags'"));
 assert.ok(html.includes('app.mjs?v=t02-v3-20261019'));
 assert.ok(html.includes('threads-asset-fidelity-20261018.css?v=20261018-featured-v2'));
 for(const id of ['n1','n2','n3','n4','n5','n6']) assert.ok(script.includes("id:'"+id+"'"),id);
});

test('homepage routes to shared catalog pages and inline search',()=>{
 assert.match(html,/href="\/search\/"/);
 assert.match(html,/href="\/cart\/"/);
 assert.ok(html.indexOf('id="search-area"')<html.indexOf('id="search-button"'));
 assert.ok(!html.includes('class="search-area" hidden'));
 assert.ok(html.includes('storefront.css?v=t02-v3-20261019'));
 const shell=readFileSync(new URL('../../site/threads/storefront-pages.mjs',import.meta.url),'utf8');
 for(const p of ['searchPage()','detailPage()','cartPage()','checkoutPage()','orderPage()'])assert.ok(shell.includes('function '+p),p);
});
