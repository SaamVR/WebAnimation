import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dir=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,dir),'utf8');
const html=read('src/artists-edit/index.html');
const app=read('src/app.mjs');
const studio=read('src/worktable-studio.mjs');
const build=read('scripts/build.mjs');
test('original approved desktop preview is high priority but never preloaded on phones',()=>{
 assert.ok(html.includes('media="(min-width: 601px)"'));
 assert.ok(html.includes('assembled-regular-svg3ea32afb.w1536.webp'));
 assert.ok(html.includes('media="(max-width: 600px)"'));
 assert.ok(html.includes('walnut_table_background_exact_tone_4K_1.w768.webp 348w'));
 assert.ok(html.includes('fetchpriority="high"'));
});
test('Artist starts manifest, modules and stylesheet before general shell loads',()=>{
 assert.ok(app.indexOf('const artistManifestPending=artistPage')<app.indexOf("await import('./components.mjs')"));
 assert.ok(app.includes("const artistModulePending=artistPage"));
 assert.ok(app.includes('const artistShellModules=artistPage?Promise.all'));
 assert.ok(app.includes("sheet.dataset.ccWorktable='ready'"));
 assert.ok(app.includes('const result=await artistManifestPending'));
 assert.ok(app.includes('const moduleResult=await artistModulePending'));
 assert.ok(app.includes('entries.__deliveryBuild!==build'));
});
test('manifest caching requires immutable release SHA, retains build mismatch detection',()=>{
 assert.ok(app.includes('releases\\/[0-9a-f]{40}'));
 assert.ok(app.includes("?'default':'no-store'"));
 assert.ok(build.includes('const manifestPreload='));
 assert.ok(build.includes('as="fetch" type="application/json" crossorigin="anonymous"'));
 assert.ok(build.includes('data-review-manifest="/releases/'));
});
test('phone first frame is its actual garment and optional layers hydrate later',()=>{
 assert.ok(studio.includes('const mobileFirstFrame=window.matchMedia'));
 assert.ok(studio.includes('if(!mobileFirstFrame){'));
 assert.ok(studio.includes('(mobileFirstFrame?garmentImg:preview).decode()'));
 assert.ok(studio.includes('requestIdleCallback(startHydration,{timeout:250})'));
 assert.ok(studio.includes('else setTimeout(startHydration,60)'));
 assert.ok(studio.includes("body.classList.remove('is-hydrating')"));
});
