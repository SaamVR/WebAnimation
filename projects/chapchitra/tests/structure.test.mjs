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
 for(const label of ['Free delivery over ৳2000','Artist-Inspired Drop','Color, by hand','Your idea, printed','From the Journal'])assert.ok(app.includes(label),label);
 assert.match(app,/setInterval\(\(\)=>changeHero\(\(active\+1\)%slides.length,false\),6000\)/);
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