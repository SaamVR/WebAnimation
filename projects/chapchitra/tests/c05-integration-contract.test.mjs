import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const app=read('src/app.mjs');
const loader=read('src/motion/c05/values.mjs');
const motion=read('src/motion/c05/icon03-approved-motion.mjs');
const capture=read('scripts/c05-capture-values.mjs');
const integrationQA=read('scripts/perf/artist-navbar-normal-flow-qa.cjs');
test('C05 keeps approved copy, exactly four values, homepage-only activation',()=>{
 assert.match(app,/More Than a T-Shirt/);
 for(const title of ['Stories You Can Wear','Rooted in Bengal','Anything but Ordinary','Onto What You Wear'])
  assert.ok(app.includes(title));
 assert.match(app,/if\(route==='home'\)\{\s*const c05Root=/);
 assert.match(app,/mountC05Values\(c05Root\)/);
 assert.match(app,/data-motion-slot="C05-/);
});
test('C05 lazy local native Lottie + original GSAP, no new runtime or CDN',()=>{
 assert.match(loader,/\/motion\/c01\/vendor\/lottie\.min\.js/);
 assert.match(loader,/\/motion\/c03\/vendor\/gsap\.min\.js/);
 assert.match(loader,/new win\.IntersectionObserver/);
 assert.match(loader,/prefers-reduced-motion: reduce/);
 assert.match(loader,/loop:false,autoplay:false/);
 assert.match(loader,/factory\.mountC05Icon03/);
 assert.match(motion,/icon03-approved-closing\.mjs/);
 assert.match(motion,/icon03-refined-opening\.mjs/);
 assert.match(motion,/6\.43/);
 assert.doesNotMatch(loader,/https?:\/\//);
});
test('C05 browser gate runs true native Lottie, GSAP, iPad WebKit, mobile and reduced motion',()=>{
 assert.match(integrationQA,/c05-capture-values\.mjs/);
 assert.match(integrationQA,/C05_LOCAL_URL:origin/);
 assert.match(integrationQA,/shared-stage-c05/);
 assert.match(capture,/engine:'webkit',label:'ipad'/);
 assert.match(capture,/engine:'chromium',label:'mobile'/);
 assert.match(capture,/reducedMotion:'reduce'/);
 assert.match(capture,/icon03UsesGSAP/);
 assert.match(capture,/icon03ExactDuration/);
 assert.match(capture,/instances\.some\(s=>!s\.native\)/);
 assert.match(capture,/refuses remote\/hosted URL/);
});
