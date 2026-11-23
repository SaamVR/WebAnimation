import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const file=p=>readFileSync(new URL('../'+p,import.meta.url));
const text=p=>file(p).toString('utf8');
const checksum=b=>createHash('sha256').update(b).digest('hex');

test('street Illustrator master remains byte-for-byte intact; web display changes only broken hidden raster href',()=>{
 const master=file('src/assets/illustrator/masters/street-illustration-layers-original.svg');
 const derivative=file('src/assets/street-illustration-provisional.svg');
 assert.equal(checksum(master),'7eeba23119cc0e04b12487321aeb1518f1daf67418f0728386db06ffa17f099c');
 assert.equal(checksum(derivative),'2c0bb4d5f2ac6e82fac632bba694b8cc2acdd8ecd551f459c039e842f95ca72b');
 const src=master.toString('utf8'),web=derivative.toString('utf8');
 const missing='Street_illustration_4K_transparent.png';
 const transparent='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';
 assert.equal(src.split(missing).length,2);
 assert.equal(web,src.replace(missing,transparent).replace('y="0px"\r\n\t viewBox="0 0 1920 700"','y="0px" width="1920" height="700"\r\n\t viewBox="0 0 1920 700"'),'only the missing hidden raster reference and intrinsic web framing may change');
 for(const candidate of [src,web]){
  assert.match(candidate,/viewBox="0 0 1920 700"/);
  assert.equal((candidate.match(/<path\b/g)||[]).length,4012);
  assert.equal((candidate.match(/<g\b/g)||[]).length,42);
  assert.match(candidate,/<g id="Layer_2" class="st0">/);
  assert.match(candidate,/<g id="Layer_1">/);
  assert.match(candidate,/\.st0\{display:none;\}/);
 }
});

test('Home and About use one static provisional full vector, no C09 motion',()=>{
 const app=text('src/app.mjs');
 assert.match(app,/id="story" class="story-section"/);
 assert.equal(app.split('src="/assets/street-illustration-provisional.svg"').length-1,2);
 assert.equal(app.split('data-c09-state="provisional-static"').length-1,2);
 assert.match(app,/width="1920" height="700"/);
 assert.doesNotMatch(app,/street-bengal\.svg/);
 assert.match(app,/future C09 animation approval/);
});

test('page backgrounds are full width while Shop and editorial content stay bounded',()=>{
 const css=text('src/styles.css');
 assert.match(css,/#app,\s*\n#main\{\s*\n\s*width:100%/);
 assert.match(css,/#categories\.section-pad\.wrap,\s*\n#collection\.section-pad\.wrap,\s*\n#values\.section-pad\.wrap\{\s*\n\s*width:100%/);
 assert.match(css,/#collection\.section-pad\.wrap > \*,/);
 assert.match(css,/\.route-head\.wrap\{\s*\n\s*width:100%/);
 assert.match(css,/\.shop-listing\.wrap\{\s*\n\s*width:100%/);
 assert.match(css,/padding-inline:max\(32px,calc\(\(100% - 1680px\)\/2\)\)/);
 assert.match(css,/@media\(min-width:1250px\)\{\s*\n\s*\.shop-product-grid\{\s*\n\s*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(min-width:1680px\)\{\s*\n\s*\.shop-product-grid\{\s*\n\s*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:740px\)/);
 const section=css.slice(css.indexOf('/* CHAPCHITRA C09 / PR155'));
 assert.doesNotMatch(section,/(?:^|\n)\s*\.wrap\{/,'do not change global wrapping');
 assert.doesNotMatch(section,/\.product-card(?:-shell)?\{/,'do not alter card compositions');
});

test('original street SVG is displayed uncropped and its colours remain untouched in both themes',()=>{
 const css=text('src/styles.css'),dark=text('src/theme.css');
 assert.match(css,/#story \.street-link img\{[\s\S]*?height:auto;[\s\S]*?max-height:none;[\s\S]*?object-fit:contain/);
 assert.match(css,/#story \.street-link::after\{content:none\}/);
 assert.match(css,/#street-story \.about-street\{[\s\S]*?height:auto;[\s\S]*?object-fit:contain/);
 assert.match(dark,/:root\[data-theme="dark"\] #story \.street-link,[\s\S]*?:root\[data-theme="dark"\] #street-story \.about-street\{\s*\n\s*background:var\(--color-warm-beige\)/);
});

test('dark navbar alone has <=44px exact Cream circles and accessible targets; toggle and light artwork unchanged',()=>{
 const css=text('src/theme.css');
 const block=css.slice(css.indexOf('/* CHAPCHITRA PR155 — dark navbar'));
 assert.match(block,/:root\[data-theme="dark"\] #app > \.site-header \.nav-actions\{\s*\n\s*gap:2px/);
 assert.match(block,/\.nav-icon:not\(\.cc-theme-toggle\)\{[\s\S]*?width:44px;[\s\S]*?height:44px;[\s\S]*?min-width:44px;[\s\S]*?min-height:44px;[\s\S]*?max-width:44px;[\s\S]*?max-height:44px;[\s\S]*?border-radius:50%/);
 assert.doesNotMatch(block,/:root\[data-theme="light"\]/);
 assert.doesNotMatch(block,/\.cc-theme-toggle\{/);
 assert.match(css,/:root\[data-theme="dark"\] #app > \.site-header \.nav-actions \.nav-icon:not\(\.cc-theme-toggle\)\{[\s\S]*?background:var\(--color-cream\)/);
});
