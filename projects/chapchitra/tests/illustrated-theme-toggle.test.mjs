import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../',import.meta.url);
const read=(path)=>readFile(new URL(path,base));

const original=await read('src/assets/theme-toggle/toggle-owner-original.svg');
const derived=await read('src/assets/theme-toggle/toggle-integrated.svg');
const [app,script,css,theme,build]=await Promise.all([
 'src/app.mjs','src/illustrated-theme-toggle.mjs','src/theme-toggle.css',
 'src/theme.css','scripts/build.mjs'
].map(async path=>(await read(path)).toString('utf8')));
const text=derived.toString('utf8');
const source=original.toString('utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');

test('owner Illustrator file is immutable and has the original vector artboard',()=>{
 assert.equal(original.length,564292);
 assert.equal(sha(original),'431ba4c93295f3a2e23b98e39d61a61882ef42150e8dffbcea3a80df99ceba48');
 assert.match(source,/viewBox="0 0 320 128"/);
 assert.equal((source.match(/<path\b/g)||[]).length,1528);
 assert.equal((source.match(/<polygon\b/g)||[]).length,17);
});
test('one reusable SVG inner pill; original paths retained without redraw',()=>{
 assert.match(text,/viewBox="0 0 320 128"/);
 assert.equal((text.match(/<path\b/g)||[]).length,915);
 assert.equal((text.match(/<polygon\b/g)||[]).length,10);
 for(const id of ['pill-outer-background','pill-outer-outline','inner-pill-fill','inner-pill-texture',
  'inner-pill-border','day-scene','night-scene','sliding-circle','sun-icon','moon-icon']){
  assert.equal((text.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.doesNotMatch(text,/id="(?:Light-mode-pill-inner-background|Dark-mode-pill-inner-background)"/);
 const shapes=[...source.matchAll(/\bd="([^"]+)"/g)].map(m=>m[1]);
 const normalize=data=>data.replace(/\s+/g,' ').trim();
 const orig=new Set(shapes.map(normalize));
 for(const m of text.matchAll(/\bd="([^"]+)"/g))assert.ok(orig.has(normalize(m[1])),'all original path geometry preserved');
 assert.match(text,/<clipPath id="cc-inner-pill-clip"/);
 assert.match(text,/clip-path="url\(#cc-inner-pill-clip\)"/);
});
test('vector treatment uses new Cream and Press Green, scoped from site artwork',()=>{
 assert.match(text,/\.cc-owner-toggle-svg \.st0 \{fill:#F4EBE4;\}/);
 assert.match(text,/\.cc-owner-toggle-svg \.st1 \{fill:#293D2D;\}/);
 assert.doesNotMatch(text,/#E4E3DE|#F7EBDF/i);
 assert.doesNotMatch(text,/<image\b|<filter\b|<foreignObject\b/i);
});
test('actual controller drives visuals; no second theme state machine',()=>{
 assert.match(app,/mountOriginalThemeToggle\(themeButtons\)/);
 assert.match(app,/illustratedToggle\.sync\(dark\)/);
 assert.match(app,/window\.chapchitraTheme\?\.set\(target\)/);
 assert.doesNotMatch(script,/localStorage|location\.reload|document\.documentElement\.dataset\.theme\s*=(?!=)/);
 assert.match(script,/DURATION=300/);
 assert.match(script,/const TRAVEL=196/);
 assert.match(script,/cancelAnimationFrame\(raf\)/);
 assert.match(script,/prefers-reduced-motion: reduce/);
 assert.match(script,/url\(#/);
 assert.match(app,/id="themeToggle" aria-label="Switch to dark theme" aria-pressed="false"/);
 assert.match(app,/id="themeToggleMobile" aria-pressed="false"/);
});
test('site build includes illustration CSS and SHA pinned artist route module',()=>{
 assert.match(build,/const themeToggleCss='<link rel="stylesheet" href="\/theme-toggle\.css">';/);
 assert.match(build,/themeCss\+themeToggleCss/);
 assert.match(build,/filename\.endsWith\('\.mjs'\)/);
 assert.match(css,/width:96px; min-width:96px; height:44px; min-height:44px/);
 assert.match(css,/@media\(max-width:430px\)/);
 assert.doesNotMatch(theme,/cc-theme-icon-moon|cc-theme-toggle svg:first-child/);
});
