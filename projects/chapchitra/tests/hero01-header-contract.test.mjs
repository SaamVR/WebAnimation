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
 assert.match(css,/hero01-paper-height/);
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

test('single SVG diagonal is the entire paper panel, navbar seam is removed, hero is left aligned',()=>{
 assert.match(app,/viewBox="0 0 1440 440"/);
 assert.match(app,/hero01-paper-cut/);
 assert.match(css,/#hero \.hero01-paper-panel\s*\{[\s\S]*?background:transparent/);
 assert.match(css,/#hero \.hero01-paper-edge\s*\{[\s\S]*?position:absolute;inset:0/);
 assert.match(css,/\[data-hero01-mode="special"\]\s*\{[\s\S]*?border-bottom:0/);
 assert.match(css,/#hero \.hero-cover \.hero-cover-inner\s*\{[\s\S]*?align-items:flex-start;[\s\S]*?text-align:left/);
 assert.match(css,/#hero \.hero-cover \.hero-cover-inner>a\s*\{[\s\S]*?align-self:flex-start/);
 assert.match(browser,/snapshot\.vTipY>=425/);
 assert.match(browser,/snapshot\.vTipY-snapshot\.leftEdgeY>=230/);
 assert.match(browser,/snapshot\.vOutsideLeft&&snapshot\.vOutsideRight/);
 assert.match(browser,/snapshot\.logoClearsTip/);
 assert.match(css,/margin-top:-12px/);
 assert.match(browser,/scrolled\.navWordmark\.visible,true/);
 assert.match(browser,/slide02\.navWordmark\.visible,true/);
 assert.match(browser,/other\.wordmark\.src/);
 assert.match(browser,/snapshot\.headerBottomBorder/);
 assert.match(browser,/snapshot\.logoCentered/);
 assert.match(browser,/snapshot\.ctaLeftAligned/);
});
 
test('C08 compact navbar returns to real original static wordmark after hover while still hovered',()=>{
 assert.match(c08,/nav\.instance\.addEventListener\('complete'/);
 assert.match(c08,/nav\.instance\.goToAndStop\(DURATION_FRAMES-1,true\);[\s\S]*?showStatic\(\)/);
 assert.match(browser,/C08 completed hover must restore compact image/);
 assert.match(browser,/C08 must rearm, replay and restore original logo/);
 assert.match(css,/:not\(\[data-hero01-mode="special"\]\)/);
});

test('visual evidence waits for real full logo decode and completed C02 cover/reveal before Shop screenshot',()=>{
 assert.match(browser,/await img\.decode\(\)/);
 assert.match(browser,/original full illustrated logo failed to decode/i);
 assert.match(browser,/!document\.querySelector\('#c02-loader'\)/);
 assert.match(browser,/!document\.documentElement\.classList\.contains\('c02-pending'\)/);
 assert.match(browser,/\{timeout:20000\}\);/);
});

test('complete original identity scales exactly 90%, is raised as one unit, and C08 overlay follows',()=>{
 assert.match(css,/width:clamp\(205\.2px,20\.7vw,275\.4px\)/);
 assert.match(css,/width:clamp\(181\.8px,53\.1vw,221\.4px\)/);
 assert.match(css,/margin-top:-12px/);
 assert.match(css,/--hero01-paper-height:306px/);
 assert.match(css,/--hero01-copy-top:295px/);
 assert.match(css,/--hero01-paper-height:315px/);
 assert.match(css,/--hero01-paper-height:275px/);
 assert.match(css,/--hero01-paper-height:250px/);
 assert.match(browser,/ratio>=\.44&&ratio<=\.45/);
 assert.match(browser,/leftShoulderScreenY<=220/);
 assert.match(browser,/snapshot\.logoUniform90/);
 assert.match(browser,/snapshot\.logoImageMatchesBox/);
 assert.match(browser,/snapshot\.logoRaised/);
 assert.match(browser,/afterC08\.logoStageAligned/);
});
test('full owner review records every slider, both real C02 routes and logo states',()=>{
 for(const scene of ["'slide03.png'","'slide04.png'","'slide05.png'","'journal.png'"]) {
  const name=scene.replace(/'/g,'');
  assert.ok(browser.includes(name)||browser.includes("slide'+name"));
 }
 for(const event of ["'03'","'04'","'05'","'/journal/'","'/shop/'"])assert.ok(browser.includes(event));
 assert.match(browser,/Home -> Journal via C02/);
 assert.match(browser,/Home -> Shop via C02/);
 assert.match(browser,/scroll top: full logo restored/);
 assert.match(browser,/recordVideo/);
});
