import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const source=(name)=>readFileSync(new URL('../'+name,import.meta.url));
const text=(name)=>source(name).toString('utf8');
const hash=data=>createHash('sha256').update(data).digest('hex');

test('Original Illustrator layered street artwork is preserved byte-exact',()=>{
 const master=source('src/assets/street-owner-layers-master.svg');
 const visible=source('src/assets/street-owner-provisional.svg');
 assert.equal(hash(master),'7eeba23119cc0e04b12487321aeb1518f1daf67418f0728386db06ffa17f099c');
 assert.equal(hash(visible),'9d4fd708761c84edd3bd12bfebaa303c7c386f6401b9eb9ccc398b913859cfc7');
 const a=master.toString('utf8'),b=visible.toString('utf8');
 assert.match(a,/viewBox="0 0 1920 700"/);
 assert.match(b,/viewBox="0 0 1920 700"/);
 assert.match(a,/<g id="Layer_1">/);
 assert.equal(b.slice(b.indexOf('<g id="Layer_1">')),a.slice(a.indexOf('<g id="Layer_1">')));
 assert.equal((b.match(/<path\b/g)||[]).length,4012);
 assert.equal((b.match(/<polygon\b/g)||[]).length,25);
 assert.match(a,/id="Layer_2" class="st0"/);
 assert.match(a,/Street_illustration_4K_transparent\.png/);
 assert.doesNotMatch(b,/Street_illustration_4K_transparent\.png/);
});

test('Street remains static and uncropped on Home and About',()=>{
 const app=text('src/app.mjs'),css=text('src/styles.css');
 assert.equal((app.match(/src="\/assets\/street-owner-provisional\.svg"/g)||[]).length,2);
 assert.match(app,/width="1920" height="700" loading="lazy" decoding="async"/);
 assert.match(app,/C09 animation will be designed and approved separately/);
 const scoped=css.slice(css.indexOf('/* CHAPCHITRA PR155'));
 assert.match(scoped,/#story \.street-link > img\{/);
 assert.match(scoped,/aspect-ratio:1920 \/ 700/);
 assert.match(scoped,/object-fit:contain/);
 assert.match(scoped,/max-height:none/);
 assert.match(scoped,/#story \.street-link::after\{display:none\}/);
 assert.doesNotMatch(scoped,/filter:|animation:|@keyframes/);
});

test('Horizontal width refinements do not rewrite global wraps or card geometry',()=>{
 const css=text('src/styles.css');
 const scoped=css.slice(css.indexOf('/* CHAPCHITRA PR155'));
 assert.match(scoped,/@media \(min-width:1200px\)/);
 assert.match(scoped,/body\[data-page="shop"\] #main > \.shop-listing\.wrap/);
 assert.match(scoped,/body\[data-page="journal"\]/);
 assert.match(scoped,/body\[data-page="about"\]/);
 assert.match(scoped,/body\[data-page="home"\]/);
 assert.match(scoped,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(scoped,/(?:^|\n)\s*\.wrap\s*\{/);
 assert.doesNotMatch(scoped,/\.product-card(?:-|\{|\s)|\.hero-track/);
});

test('Four dark Cream circles use exact 44px control boxes, excluding theme toggle',()=>{
 const css=text('src/theme.css');
 const scoped=css.slice(css.indexOf('/* CHAPCHITRA PR155'));
 assert.match(scoped,/:root\[data-theme="dark"\] #app > \.site-header \.nav-actions \.nav-icon:not\(\.cc-theme-toggle\)\{/);
 for(const s of ['width:44px','height:44px','min-width:44px','min-height:44px','max-width:44px','max-height:44px','flex:0 0 44px','border-radius:50%','background:var(--color-cream)'])assert.ok(scoped.includes(s),s);
 assert.match(scoped,/@media \(min-width:431px\)/);
 assert.doesNotMatch(scoped,/\.cc-theme-toggle(?:\{|:hover| svg)/,'Do not change illustrated toggle');
 assert.doesNotMatch(scoped,/\.cc-nav-art|\.bag-count|#8A503B|#293D2D/,'Do not recolor artwork/stamp');
});
