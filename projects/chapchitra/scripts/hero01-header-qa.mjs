/** CHAPCHITRA Hero 01 — isolated, NON-HOSTED visual/transition acceptance.
 * Uses existing local preview; rejects all public endpoints by design.
 * CC_HERO01_QA_ROOT=http://127.0.0.1:4272 node scripts/hero01-header-qa.mjs
 */
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const origin=process.env.CC_HERO01_QA_ROOT||'http://127.0.0.1:4173';
if(!['localhost','127.0.0.1','::1'].includes(new URL(origin).hostname))
 throw Error('Hero 01 visual QA requires localhost; no hosted website preview');
const out=resolve(process.env.CC_HERO01_QA_OUT||'perf-results/hero01-header');
await mkdir(out,{recursive:true});
const profiles=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900,mobile:false},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112,mobile:false},
 {name:'mobile-chromium',engine:chromium,width:390,height:844,mobile:true},
 {name:'narrow-chromium',engine:chromium,width:320,height:740,mobile:true}
];
const result=[];
function validate(snapshot){
 assert.equal(snapshot.coverBackground,'rgb(28, 36, 29)','Hero 01 must be exact solid #1C241D');
 assert.equal(snapshot.paperBackground,'rgba(0, 0, 0, 0)','Single SVG must own the white panel, without a separate box');
 assert.equal(snapshot.paperPathFill,'rgb(246, 247, 245)','Continuous paper silhouette must use Gallery White');
 assert.equal(snapshot.headerBottomBorder,'0px','Remove divider beneath special Hero 01 navbar');
 assert.ok(snapshot.tornDiagonal>=125,'One visibly diagonal paper edge required');
 assert.equal(snapshot.copyAlignment,'left','Hero 01 text must align left');
 assert.ok(snapshot.ctaLeftAligned,'Hero 01 CTA must align with copy');
 assert.ok(snapshot.ctaBelowText,'CTA must remain beneath the copy');
 assert.ok(snapshot.logoCentered,'Full original logo must be horizontally centered in paper');
 assert.equal(snapshot.oldPaperImages,0,'No old placeholder background image');
 assert.equal(snapshot.paperSVGs,1,'One independent organic tear SVG');
 assert.equal(snapshot.navLinks,4,'Preserve four desktop nav links');
 assert.equal(snapshot.navArt,4,'Preserve the four original navbar Illustrator action icons');
 assert.ok(snapshot.logoOriginal,'Original full illustrated lockup must be displayed');
 assert.equal(snapshot.state,'special','Only Hero 01 at page top has special header');
 assert.ok(snapshot.textBelowTear,'Hero copy must be clear of torn-paper edge');
 assert.ok(snapshot.canvasBottom>=snapshot.controlBottom-2,'Solid forest hero must extend behind its slider controls');
 assert.ok(snapshot.horizontalOverflow<=1,'No horizontal overflow');
}
async function sample(page){
 return page.evaluate(()=>{
  const hero=document.querySelector('#hero');
  const cover=hero?.querySelector('.hero-cover');
  const paper=cover?.querySelector('.hero01-paper-panel');
  const tear=paper?.querySelector('svg.hero01-paper-edge');
  const eyebrow=cover?.querySelector('.hero-cover-inner .eyebrow');
  const edgeRect=tear?.getBoundingClientRect();
  const copyRect=eyebrow?.getBoundingClientRect();
  const paperPath=tear?.querySelector('.hero01-paper-cut');
  const d=paperPath?.getAttribute('d')||'';
  const rightEdgeY=Number(d.match(/^M0 0 H1440 V([\d.]+)/)?.[1]||0);
  const leftEdgeY=Number(d.match(/Q20 [\d.]+ 0 ([\d.]+) Z$/)?.[1]||0);
  const lastCopy=cover?.querySelector('.hero-cover-inner>p:not(.eyebrow)');
  const cta=cover?.querySelector('.hero-cover-inner>a');
  const logo=paper?.querySelector('.hero01-full-logo');
  const svgYAtCopy=(leftEdgeY+(rightEdgeY-leftEdgeY)*(copyRect?.left||0)/innerWidth);
  const tearAtCopy=(edgeRect?.top||0)+svgYAtCopy*(edgeRect?.height||0)/440;
  return {
   route:document.body.dataset.page,
   state:document.querySelector('#siteHeader')?.dataset.hero01Mode,
   slide:hero?.querySelector('.hero-slide.is-active')?.dataset.slide,
   coverBackground:cover&&getComputedStyle(cover).backgroundColor,
   paperBackground:paper&&getComputedStyle(paper).backgroundColor,
   paperPathFill:paperPath&&getComputedStyle(paperPath).fill,
   headerBottomBorder:getComputedStyle(document.querySelector('#siteHeader')).borderBottomWidth,
   tornDiagonal:rightEdgeY-leftEdgeY,
   copyAlignment:eyebrow&&getComputedStyle(eyebrow.parentElement).textAlign,
   ctaLeftAligned:!!(cta&&eyebrow&&Math.abs(cta.getBoundingClientRect().left-eyebrow.getBoundingClientRect().left)<3),
   ctaBelowText:!!(cta&&lastCopy&&cta.getBoundingClientRect().top>=lastCopy.getBoundingClientRect().bottom-2),
   logoCentered:!!(logo&&Math.abs((logo.getBoundingClientRect().left+logo.getBoundingClientRect().width/2)-innerWidth/2)<3),
   oldPaperImages:cover?.querySelectorAll('img.hero-background').length||0,
   paperSVGs:cover?.querySelectorAll('svg.hero01-paper-edge').length||0,
   tearPaths:tear?.querySelectorAll('path').length||0,
   navLinks:document.querySelectorAll('#siteHeader .nav-center>a').length,
   navArt:document.querySelectorAll('#siteHeader .nav-actions img.cc-nav-art').length,
   logoOriginal:!!paper?.querySelector('img.hero-brand-lockup[src="/assets/chapchitra-full.webp"]'),
   textBelowTear:!!(edgeRect&&copyRect&&copyRect.top>=tearAtCopy+16),
   horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
   canvasBottom:cover?.getBoundingClientRect().bottom??0,
   controlBottom:hero?.querySelector('.hero-controls')?.getBoundingClientRect().bottom??0,
   logoAnimation:window.__chapchitraC08?.hero||null,
   fullLinkHidden:document.querySelector('#siteHeader .logo-word--image')?.getAttribute('aria-hidden')==='true',
   heroLogoInert:document.querySelector('#hero .hero01-full-logo')?.inert??null
  };
 });
}
function locallyLaunched(engine){
 return engine===chromium&&process.platform==='win32'
  ? {headless:true,channel:'chrome'}:{headless:true};
}
for(const t of profiles){
 const browser=await t.engine.launch(locallyLaunched(t.engine));
 const context=await browser.newContext({
  viewport:{width:t.width,height:t.height},deviceScaleFactor:1,
  hasTouch:t.mobile,isMobile:t.mobile,reducedMotion:'no-preference',
  recordVideo:{dir:out,size:{width:t.width,height:t.height}}
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/assets/chapchitra-full.webp')&&response.status()>=400)
  errors.push('Full logo HTTP '+response.status())});
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#hero .hero01-paper-panel').waitFor({state:'visible',timeout:20000});
 // Keep the approved carousel on Hero 01 while the C08 240-frame animation
 // completes, exactly as a real pointer hovering over the hero would.
 await page.evaluate(()=>document.querySelector('#hero').dispatchEvent(new MouseEvent('mouseenter')));
 const initial=await sample(page);
 validate(initial);
 if(t.width<=365)assert.ok(initial.controlBottom<=t.height+1,
  'Narrow-screen Hero 01 slider controls must be visible in the initial viewport');
 await page.screenshot({path:resolve(out,t.name+'-special.png')});
 await page.waitForFunction(()=>window.__chapchitraC08?.hero?.completed>=1,null,{timeout:22000});
 const afterC08=await sample(page);
 assert.equal(afterC08.logoAnimation.failed,false,'Reuse exact approved C08 timeline');
 assert.equal(afterC08.logoAnimation.autoplay,1,'Original C08 hero autoplay fires once');
 await page.screenshot({path:resolve(out,t.name+'-logo-complete.png')});
 await page.evaluate(()=>window.scrollTo({top:185,behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='standard');
 const scrolled=await sample(page);
 assert.equal(scrolled.fullLinkHidden,false,'Standard navbar logo accessible on scroll');
 assert.equal(scrolled.heroLogoInert,true,'No duplicate or focusable logo below sticky navbar');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity)<.05,{},{timeout:2000});
 await page.screenshot({path:resolve(out,t.name+'-scrolled.png')});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 await page.locator('#hero [data-slide-to="1"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='standard');
 const slide02=await sample(page);
 assert.equal(slide02.slide,'1','Hero 02 active');
 assert.ok(await page.locator('#hero .hero-slide[data-slide="1"]').isVisible());
 await page.screenshot({path:resolve(out,t.name+'-slide02.png')});
 await page.locator('#hero [data-slide-to="4"]').evaluate(node=>node.click());
 assert.equal((await sample(page)).state,'standard','Hero 05 must use normal navbar');
 await page.locator('#hero [data-slide-to="0"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 const returned=await sample(page);
 assert.equal(returned.slide,'0');
 assert.equal(returned.heroLogoInert,false,'Large original logo regains accessibility at top');
 await page.screenshot({path:resolve(out,t.name+'-return.png')});
 // Standard header must be untouched on every other page.
 await page.goto(new URL('/shop/',origin).href,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#siteHeader .nav-center>a').first().waitFor({state:'attached',timeout:20000});
 const other=await page.evaluate(()=>({
  mode:document.querySelector('#siteHeader')?.dataset.hero01Mode||'standard',
  paper:document.querySelector('.hero01-paper-panel')!==null,
  navLinks:document.querySelectorAll('#siteHeader .nav-center>a').length,
  navArt:document.querySelectorAll('#siteHeader .nav-actions img.cc-nav-art').length
 }));
 assert.equal(other.mode,'standard');assert.equal(other.paper,false);
 assert.equal(other.navLinks,4);assert.equal(other.navArt,4);
 await context.close();
 const video=await page.video().path();
 await copyFile(video,resolve(out,t.name+'-transitions.webm'));
 await browser.close();
 assert.deepEqual(errors,[],t.name+' browser errors');
 result.push({profile:t.name,initial,afterC08,scrolled,slide02,returned,other,errors,
  screenshots:[t.name+'-special.png',t.name+'-logo-complete.png',t.name+'-scrolled.png',t.name+'-slide02.png',t.name+'-return.png'],
  recording:t.name+'-transitions.webm'});
 console.log('HERO01_OK',t.name,'C08',afterC08.logoAnimation.completed,'tears',initial.tearPaths);
}
// Reduced motion: original full static logo remains and C08 does not autoplay.
const rb=await webkit.launch({headless:true});
const rc=await rb.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const rp=await rc.newPage();
await rp.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
await rp.locator('#hero .hero01-full-logo').waitFor({state:'visible'});
await rp.waitForTimeout(650);
const reduced=await rp.evaluate(()=>({
 state:document.querySelector('#siteHeader')?.dataset.hero01Mode,
 visible:getComputedStyle(document.querySelector('#hero .hero01-full-logo img')).visibility,
 animationPlaying:!!window.__chapchitraC08?.hero?.playing,
 autoplay:window.__chapchitraC08?.hero?.autoplay||0
}));
assert.equal(reduced.state,'special');
assert.equal(reduced.visible,'visible');
assert.equal(reduced.animationPlaying,false);
assert.equal(reduced.autoplay,0);
await rp.screenshot({path:resolve(out,'reduced-webkit.png')});
await rc.close();await rb.close();
result.push({profile:'reduced-webkit',reduced,screenshot:'reduced-webkit.png'});
await writeFile(resolve(out,'hero01-browser-report.json'),JSON.stringify(result,null,2)+'\n');
console.log('HERO01_BROWSER_QA_PASSED',result.length,'profiles; evidence',out);
