import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const text=async p=>readFile(new URL(p,root),'utf8');
const css=await text('src/styles.css'),studio=await text('src/worktable-studio.css');
const price=await text('src/worktable-price-tag-config.mjs');
const builder=await text('scripts/build.mjs');

test('final approved Fraunces / DM Sans / Bengali font families are centralized',()=>{
 assert.match(css,/--font-editorial:"Fraunces","Noto Serif Bengali"/);
 assert.match(css,/--font-ui:"DM Sans","Noto Sans Bengali"/);
 assert.match(css,/--font-bn-serif:"Noto Serif Bengali"/);
 assert.match(css,/--font-bn-ui:"Noto Sans Bengali"/);
 assert.match(css,/--font-weight-display:650/);
 assert.match(css,/--font-weight-section:550/);
 assert.match(css,/--font-weight-quote:375/);
 assert.match(css,/--font-text-size:16px/);
 assert.match(css,/font-optical-sizing:auto/);
 assert.doesNotMatch(css,/Hind Siliguri|Newsreader|fonts\.googleapis/);
 assert.doesNotMatch(studio,/Hind Siliguri|Newsreader/);
 assert.doesNotMatch(price,/Hind Siliguri|Newsreader/);
 assert.match(price,/fontFamily:'"DM Sans","Noto Sans Bengali",sans-serif'/);
});

test('eight local variable WOFF2 faces and licenses match CSS declarations',async()=>{
 const files=['dm-sans-latin-variable','dm-sans-latin-ext-variable',
  'fraunces-latin-variable','fraunces-latin-ext-variable',
  'fraunces-latin-italic-variable','fraunces-latin-ext-italic-variable',
  'noto-sans-bengali-variable','noto-serif-bengali-variable'];
 assert.equal((css.match(/@font-face/g)||[]).length,8);
 for(const base of files){
  const bin=await readFile(new URL('src/assets/fonts/'+base+'.woff2',root));
  assert.equal(bin.toString('ascii',0,4),'wOF2',base+' header');
  assert.ok(bin.length>12000&&bin.length<200000,base+' reasonable subset size');
  assert.ok(css.includes('/assets/fonts/'+base+'.woff2'),base+' referenced');
 }
 for(const f of ['fraunces','dmsans','notosansbengali','notoserifbengali']){
  const license=await text('src/assets/fonts/licenses/'+f+'-OFL.txt');
  assert.match(license,/Open Font License/i);
 }
 assert.match(css,/font-style: italic;\s+font-weight: 300 800/);
 assert.match(css,/unicode-range: U\+0951-0952/);
});

test('preload only two critical Latin fonts across every website entrypoint',()=>{
 assert.match(builder,/const criticalTypographyPreloads=/);
 assert.match(builder,/dm-sans-latin-variable[.]woff2/);
 assert.match(builder,/fraunces-latin-variable[.]woff2/);
 assert.doesNotMatch(builder,/rel="preload" href="\/assets\/fonts\/noto-/);
 assert.match(builder,/fontPreloadedPages<10/);
});

test('approved Hero01 V retraction and 8-second carousel untouched by font system',async()=>{
 const controller=await text('src/hero01-retraction.mjs');
 const clock=await text('src/hero-carousel-clock.mjs');
 assert.match(controller,/HERO01_RETRACTION_SCROLL_RATIO=0[.]72/);
 assert.match(controller,/HERO01_SHADOW_CLEARANCE_PX=12/);
 assert.match(clock,/HERO_DWELL_MS = Object.freeze\(\[8000, 4000, 4000, 4000, 4000\]\)/);
 assert.match(css,/#hero[ ]*\.hero01-paper-edge[^{]*\{/);
 assert.match(css,/#hero[ ]*\.hero01-full-logo[^{]*\{/);
});
