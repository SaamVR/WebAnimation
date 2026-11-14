import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const app=read('src/app.mjs'),css=read('src/styles.css');
const c08=read('src/motion/c08/logo-player.mjs'),c08css=read('src/motion/c08/logo-player.css');
const browser=read('scripts/hero01-header-qa.mjs'),gate=read('scripts/perf/artist-navbar-normal-flow-qa.cjs');

test('Hero01 uses original illustrated badge, distinct responsive tear, and no placeholder image',()=>{
 assert.match(app,/hero01-paper-panel/);
 assert.match(app,/hero01-paper-edge/);
 assert.match(app,/hero01-paper-fibers/);
 assert.match(app,/\/assets\/chapchitra-full\.webp/);
 assert.match(app,/id="c08HeroStage"/);
 assert.doesNotMatch(app,/<img class="hero-background" src="\/assets\/hero-paper\.svg"/);
 assert.match(css,/#hero \.hero-cover\s*\{\s*background:#1C241D/);
 assert.match(css,/hero01-paper-edge \.hero01-paper-cut/);
 assert.match(css,/hero01-paper-depth/);
 assert.match(css,/@media\(max-width:740px\)/);
});

test('Hero01 preserves one navbar, restores standard presentation on slide and scroll',()=>{
 assert.match(app,/id="siteHeader"/);
 assert.match(app,/data-hero01-mode="special"/);
 assert.match(app,/function syncHero01Header\(\)/);
 assert.match(app,/active===0&&\(window\.scrollY/);
 assert.match(app,/window\.addEventListener\('scroll',onHeroHeaderScroll/);
 assert.match(app,/window\.addEventListener\('pageshow',syncHero01Header\)/);
 assert.match(app,/syncHero01Header\(\);if\(manual\)scheduleHero\(\)/);
 assert.match(css,/data-hero01-mode="special"/);
 for(const label of ['Shop','Artist’s Edit','Journal','About Us'])
  assert.ok(app.includes(label));
 for(const source of ['nav-search','nav-favorites','nav-account','nav-bag'])
  assert.ok(app.includes(source.replace('nav-',''))||source==='nav-favorites');
});

test('Existing C08 keyframes are reused through original white-background variant',()=>{
 assert.match(app,/heroVariant:'paper'/);
 assert.match(c08,/heroVariant='dark'/);
 assert.match(c08,/heroVariant==='paper'\?SOURCE:HERO/);
 assert.match(c08css,/\.hero01-full-logo\.c08-hero-shown/);
 assert.match(c08css,/clip-path:inset\(0 0 26\.35% 0\)/);
 assert.doesNotMatch(app,/new win\.IntersectionObserver|gsap\.timeline/);
});

test('local browser acceptance tests verify actual header states and motion',()=>{
 assert.match(browser,/requires localhost/);
 assert.match(browser,/recordVideo:/);
 assert.match(browser,/desktop-chromium/);
 assert.match(browser,/ipad-webkit/);
 assert.match(browser,/mobile-chromium/);
 assert.match(browser,/reducedMotion:'reduce'/);
 assert.match(browser,/waitForFunction\(\(\)=>window\.__chapchitraC08\?\.hero\?\.completed>=1/);
 assert.match(browser,/window\.scrollTo\(\{top:185/);
 assert.match(browser,/data-slide-to="1"/);
 assert.match(browser,/\.webm/);
 assert.match(gate,/hero01-header-qa\.mjs/);
});
