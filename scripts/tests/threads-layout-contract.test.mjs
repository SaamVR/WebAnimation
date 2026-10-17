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
  assert.match(html,/assets\/threads-wordmark\.png/);
  for(const name of ['search','favorite','cart']) assert.ok(html.includes('assets/icon-'+name+'.png'));
  for(const link of ['HOME','SHOP','COLLECTION','ABOUT']) assert.ok(html.includes('>'+link+'</a>'));
  assert.match(html,/assets\/threads-hero\.webp/);
  assert.match(html,/assets\/deal-backpack\.webp/);
  assert.doesNotMatch(html,/class="hero-doodle"|data-ref-img="hero"|data-ref-img="backpack"/);
  assert.match(html,/Shopping cart/);
});

test('supplied backpack graphic loads without lazy-scroll dependence',()=>{assert.match(html,/deal-backpack\.webp[^>]*loading="eager"/)});
