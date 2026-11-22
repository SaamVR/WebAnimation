import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const [app,css,head,build,legacy,clock,hero]=await Promise.all([
 read('src/app.mjs'),read('src/theme.css'),read('src/theme-init.js'),
 read('scripts/build.mjs'),read('src/styles.css'),
 read('src/hero-carousel-clock.mjs'),read('src/hero01-retraction.mjs')
]);
const makeRuntime=(systemDark=false,saved=null)=>{
 const records=new Map(saved?[['chapchitra-color-theme-v1',saved]]:[]);
 const handlers={};
 const media={matches:systemDark,addEventListener(_,cb){handlers.media=cb}};
 const rootElement={dataset:{},style:{}};
 const browser={
  matchMedia(){return media},
  localStorage:{
   getItem(key){return records.get(key)||null},
   setItem(k,v){records.set(k,v)},
   removeItem(k){records.delete(k)}
  },
  CustomEvent:class {constructor(type,opts){this.type=type;this.detail=opts.detail}},
  dispatchEvent(ev){handlers.last=ev},
  addEventListener(type,cb){handlers[type]=cb}
 };
 vm.runInNewContext(head,{window:browser,document:{documentElement:rootElement},CustomEvent:browser.CustomEvent});
 return {browser,rootElement,media,handlers,records};
};
test('theme bootstrap resolves system before paint, persists explicit choice',()=>{
 const d=makeRuntime(true);
 assert.equal(d.rootElement.dataset.theme,'dark');
 assert.equal(d.rootElement.style.colorScheme,'dark');
 d.browser.chapchitraTheme.set('light');
 assert.equal(d.rootElement.dataset.theme,'light');
 assert.equal(d.records.get('chapchitra-color-theme-v1'),'light');
 d.media.matches=false;d.handlers.media();
 assert.equal(d.rootElement.dataset.theme,'light','explicit overrides later OS');
 d.browser.chapchitraTheme.reset();
 assert.equal(d.rootElement.dataset.theme,'light');
 d.media.matches=true;d.handlers.media();
 assert.equal(d.rootElement.dataset.theme,'dark','system resumed after reset');
 const l=makeRuntime(false,'dark');
 assert.equal(l.rootElement.dataset.theme,'dark','saved dark overrides OS light');
});
test('theme CSS derives dark colors from canonical approved tokens only',()=>{
 for(const entry of [
  '--theme-page:var(--color-dark-olive)',
  '--theme-header:var(--color-deep-forest)',
  '--theme-hero:var(--color-walnut)',
  '--theme-panel:var(--color-mushroom-gray)',
  '--theme-gallery:var(--color-warm-beige)',
  '--theme-text:var(--color-cream)',
  '--theme-accent:var(--color-terracotta)'
 ])assert.ok(css.includes(entry),entry);
 assert.match(css,/:root\[data-theme="dark"\]/);
 assert.doesNotMatch(css,/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i,'no uncatalogued hex colors');
 assert.doesNotMatch(css,/(filter:\s*invert|mix-blend-mode|hue-rotate)/);
});
test('dark theme does not change legacy light CSS, logo, SVG or motion files',()=>{
 assert.match(legacy,/--color-gallery-white:#F6F7F5/);
 assert.match(legacy,/--color-dark-olive:#1F2216/);
 assert.match(clock,/HERO_DWELL_MS = Object.freeze\(\[8000, 4000, 4000, 4000, 4000\]\)/);
 assert.match(hero,/HERO01_RETRACTION_SCROLL_RATIO=0[.]72/);
 assert.match(css,/\.hero01-paper-edge \.hero01-paper-cut/);
});
test('dark theme overrides only CSS backgrounds, not original illustration pixels',()=>{
 assert.doesNotMatch(css,/(?:\.\s*hero-brand-lockup|\.c08-hero-stage svg|\.cc-compact-svg|\.c05-value-player svg).*filter/);
 assert.doesNotMatch(css,/image-rendering:\s*pixelated/);
 assert.doesNotMatch(css,/object-fit:\s*cover/);
 assert.match(css,/\.favorite-toggle\.liked svg\{\s*fill:var\(--color-terracotta\)/);
});
test('navbar theme toggle is keyboard-accessible and syncs ARIA',()=>{
 assert.match(app,/id="themeToggle" aria-label="Switch to dark theme" aria-pressed="false"/);
 assert.match(app,/for\(const control of themeButtons\)control\.addEventListener\('click'/);
 assert.match(app,/id="themeToggleMobile" aria-pressed="false"/);
 assert.match(app,/control\.setAttribute\('aria-pressed',String\(dark\)\)/);
 assert.match(app,/window\.addEventListener\('chapchitra:themechange',syncThemeButton\)/);
 assert.match(css,/\.cc-theme-toggle:focus-visible/);
});
test('head bootstrap executes before CSS and the dark layer loads after page styles',()=>{
 assert.match(build,/const themeBoot='<script src="\/theme-init[.]js"><\/script>'/);
 assert.match(build,/const themeCss='<link rel="stylesheet" href="\/theme[.]css">'/);
 assert.match(build,/\.replace\('<head>','<head>'\+themeBoot\+criticalTypographyPreloads\)/);
 assert.match(build,/\.replace\('<\/head>',themeCss\+themeToggleCss\+'<\/head>'\)/);
});
