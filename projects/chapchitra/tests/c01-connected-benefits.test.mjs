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
test('exact locked service copy and order are present in homepage benefits only',async()=>{
 const app=await load('src/app.mjs');
 const pairs=[
  ['Custom Print Care','Thoughtful printing with room for customization.'],
  ['Easy Payment','Easy checkout with multiple payment methods.'],
  ['Delivery','Shipping updates with parcel delivery.'],
  ['Order Support','Support for print, artwork, sizing, and ordering.']
 ];
 let last=-1;
 for(const [title,subtitle] of pairs){
  const position=app.indexOf("['"+title+"','"+subtitle+"'");
  assert.ok(position>last,'Missing or out of order: '+title);last=position;
 }
 assert.ok(!app.includes('Delivery terms to be confirmed'));
 assert.ok(!app.includes('Policy details coming soon'));
 assert.ok(app.includes("import('./motion/c01/connected-benefits.mjs')"));
 const home=await load('src/index.html');
 assert.ok(home.includes('./motion/c01/connected-benefits.css'));
 const artist=await load('src/artists-edit/index.html');
 assert.ok(!artist.includes('connected-benefits'));
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
