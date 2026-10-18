import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html = readFileSync(new URL('../../site/threads/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../../site/threads/app.mjs', import.meta.url), 'utf8');
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
  assert.match(html,/assets\/deal-backpack-cutout-20261018\.webp/);
  assert.doesNotMatch(html,/class="hero-doodle"|data-ref-img="hero"|data-ref-img="backpack"/);
  assert.match(html,/Shopping cart/);
});

test('Deal of the Week uses the isolated backpack as a separate image',()=>{assert.match(html,/deal-backpack-cutout-20261018\.webp/)});

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
  const paths=['header-search.png','header-favorite.png','header-cart.png','featured-olive-sneaker-card.webp','featured-silver-sneaker-card.webp','featured-red-backpack-card.webp','featured-black-headphones-card.webp','editorial-main.webp','editorial-detail-1.webp','editorial-detail-2.webp','editorial-detail-3.webp','editorial-detail-4.webp','campaign-essentials.webp','sale-moody-sneakers.webp','deal-backpack-cutout-20261018.webp'];
  for(const name of paths){
    assert.ok(readFileSync(new URL('../../site/threads/assets/'+name,import.meta.url)).length>800,'missing/empty '+name);
  }
  assert.ok(html.includes('./artwork-review-20261018.css'));
  for(const name of ['header-search.png','header-favorite.png','header-cart.png','editorial-complete-20261018.webp','campaign-essentials.webp','sale-moody-sneakers.webp','deal-backpack-cutout-20261018.webp']) assert.ok(html.includes(name),'not wired '+name);
  for(const name of ['featured-olive-sneaker-card.webp','featured-silver-sneaker-card.webp','featured-red-backpack-card.webp','featured-black-headphones-card.webp']) assert.ok(script.includes(name),'not wired '+name);
  assert.doesNotMatch(html,/data-ref-img="editorial|data-ref-img="campaign"|data-ref-img="sale"/);
  assert.match(html,/id="featured-products"/);
  assert.match(html,/id="arrival-products"/);
});

test('browser-safe asset layer retains exact product photos and deal compositing',()=>{
 const compat=readFileSync(new URL('../../site/threads/artwork-paint-fix-20261018.css',import.meta.url),'utf8');
 assert.ok(html.includes('artwork-paint-fix-20261018.css'));
 for(const kind of ['olive-sneaker','silver-sneaker','red-backpack','black-headphones']){
   assert.ok(script.includes('featured-'+kind+'-card.webp'));
   assert.ok(readFileSync(new URL('../../site/threads/assets/featured-'+kind+'-card.webp',import.meta.url)).length>2000);
 }
 assert.match(compat,/mix-blend-mode:normal/);
 assert.match(compat,/mix-blend-mode:normal/);
});

test('feature art remains paintable in full-page screenshot QA',()=>{
 const compat=readFileSync(new URL('../../site/threads/artwork-visibility-20261018.css',import.meta.url),'utf8');
 assert.ok(html.includes('artwork-visibility-20261018.css'));
 assert.match(compat,/content-visibility:visible/);
 assert.ok(script.includes("product.group === 'featured' ? 'eager' : 'lazy'"));
});

test('Quality collage is a single contained artwork; original banner remains',()=>{
  const section=html.split('<section id="about"')[1].split('</section>')[0];
  assert.ok(section.includes('editorial-complete-20261018.webp'));
  assert.equal((section.match(/<img /g)||[]).length,1);
  assert.ok(section.includes('We Provide Quality.'));
  assert.ok(section.includes('Explore Our Story'));
  const campaign=html.split('<section id="mission"')[1].split('</section>')[0];
  assert.ok(campaign.includes('campaign-essentials.webp'));
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
