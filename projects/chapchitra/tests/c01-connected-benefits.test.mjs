import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const load=p=>readFile(resolve(root,p),'utf8');
const originals=[
 ['icon-01-print-care-v4.json','d786771616aa3cabd84587a2790c25a9217b75e74853d57ca3bffdf237b0bd65',135],
 ['icon-02-easy-payment-v2.json','d2a469545cf8e934779f8d82037b7201eb9d7023dfb5e68259be56166231df96',135],
 ['icon-03-delivery-v2.json','b90cc633021160a8aa8b68658d34114d212c597069b057ccefd8f3a71c407f0c',120],
 ['icon-04-order-support-v2.json','af1d3bb36b8769efb82bdc94d170551de33e2f8cd63ee2ce2f3684f10afe2a29',126]
];
test('the four approved original Lottie JSON files are byte-for-byte preserved',async()=>{
 for(const [name,sha,frames] of originals){
  const buffer=await readFile(resolve(root,'src/assets/c01',name));
  assert.equal(createHash('sha256').update(buffer).digest('hex'),sha,name);
  const a=JSON.parse(buffer.toString());
  assert.equal(a.w,512);assert.equal(a.h,512);assert.equal(a.fr,60);
  assert.equal(a.op-a.ip,frames);
 }
});
test('full-fidelity delivery V2 has original embedded PNG asset, never optimized candidate or V1',async()=>{
 const a=JSON.parse(await load('src/assets/c01/icon-03-delivery-v2.json'));
 assert.equal(a.assets.length,1);
 assert.ok(a.assets[0].p.startsWith('data:image/png;base64,'));
 assert.ok(a.assets[0].p.length>1000000);
});
test('owner-approved four single-line feature labels supersede old two-line copy',async()=>{
 const app=await load('src/app.mjs');
 const labels=[
  'Original Art & Customization',
  'Secure & Flexible Payment',
  'Fast Delivery',
  '24/7 Support'
 ];
 let last=-1;
 for(const label of labels){
  const pos=app.indexOf("['"+label+"','icon-");
  assert.ok(pos>last,'Missing or wrong order: '+label);
  last=pos;
 }
 assert.ok(app.includes('<div class="c01-copy"><h3>'));
 assert.ok(!app.includes("<p>'+esc(subtitle)+'</p>"));
 for(const obsolete of ['Custom Print Care','Easy Payment','Thoughtful printing with room for customization.','Easy checkout with multiple payment methods.','Shipping updates with parcel delivery.','Support for print, artwork, sizing, and ordering.']){
  assert.ok(!app.includes(obsolete),'Old two-line C01 wording survives: '+obsolete);
 }
 assert.ok(app.includes("import('./motion/c01/connected-benefits.mjs')"));
 assert.ok((await load('src/index.html')).includes('./motion/c01/connected-benefits.css'));
 assert.ok(!(await load('src/artists-edit/index.html')).includes('connected-benefits'));
 const css=await load('src/motion/c01/connected-benefits.css');
 assert.match(css,/padding-block:15px 30px/);
 assert.match(css,/padding-block:12px 24px/);
 assert.match(css,/white-space:nowrap/);
 assert.ok(!css.includes('.c01-copy p'));
});
test('V3 synchronized single clock and connector starts/ends are preserved',async()=>{
 const code=await load('src/motion/c01/connected-benefits.mjs');
 assert.match(code,/const DURATION = 10\.27/);
 assert.match(code,/const STARTS = \[0, 2\.64, 5\.28, 7\.67\]/);
 assert.match(code,/const DURATIONS = \[2\.25, 2\.25, 2, 2\.1\]/);
 assert.match(code,/const CONNECTIONS = \[\[2\.25, 2\.64\], \[4\.89, 5\.28\], \[7\.28, 7\.67\]\]/);
 assert.ok(!/setInterval|autoplay:\s*true|loop:\s*true/.test(code));
 assert.match(code,/IntersectionObserver/);
 assert.match(code,/prefers-reduced-motion: reduce/);
 assert.match(code,/document\.hidden/);
});
test('self-hosted Lottie JS is licensed and posters support static reduced motion',async()=>{
 assert.ok((await stat(resolve(root,'src/motion/c01/vendor/lottie.min.js'))).size>240000);
 assert.ok((await load('src/motion/c01/vendor/LOTTIE-WEB-LICENSE.md')).includes('MIT'));
 const css=await load('src/motion/c01/connected-benefits.css');
 assert.match(css,/#benefits/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 for(const [name] of originals){
  const poster=name.replace(/\.json$/,'.webp');
  assert.ok((await stat(resolve(root,'src/assets/c01/posters',poster))).size>1000,poster);
 }
});

test('C01 wide layout uses the site gutters and preserves mobile/resize registration',async()=>{
 const css=await load('src/motion/c01/connected-benefits.css');
 const clock=await load('src/motion/c01/connected-benefits.mjs');
 assert.match(css,/#benefits \.c01-stage\{position:relative;max-width:none/);
 assert.match(css,/@media\(min-width:681px\)/);
 for(let n=1;n<=4;n++){
  assert.ok(css.includes('#benefits .c01-step:nth-child('+n+') > .c01-icon-shell'),'Missing scoped icon position '+n);
  assert.ok(css.includes('#benefits .c01-step:nth-child('+n+') > .c01-copy'),'Missing scoped label position '+n);
  assert.ok(!css.includes('#benefits .c01-step:nth-child('+n+'){transform:'),'Grid cell '+n+' should not shift into the viewport gutter');
 }
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(clock,/window\.addEventListener\('resize', requestLayout, \{passive: true\}\)/);
 assert.match(clock,/getBoundingClientRect\(\)/);
});
