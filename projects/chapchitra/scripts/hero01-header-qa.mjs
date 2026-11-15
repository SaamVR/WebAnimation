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
 assert.ok(snapshot.vTipY>=425,'V tip must point below centered logo');
 assert.ok(snapshot.vTipY-snapshot.leftEdgeY>=230&&snapshot.vTipY-snapshot.rightEdgeY>=230,
  'Both torn slopes descend toward the single central tip');
 assert.ok(snapshot.vFilledAtCenter&&snapshot.vEmptyBelow&&snapshot.vOutsideLeft&&snapshot.vOutsideRight,
  'One white SVG must render a downward V with dark space outside both slopes');
 assert.ok(snapshot.logoClearsTip,'Full logo must clear tip with at least 22px of paper');
 assert.ok(snapshot.logoEdgeClearance,'Both outer wordmark letters must have >=12px of white paper below them');
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
  const leftEdgeY=Number(d.match(/0 ([\d.]+) Z$/)?.[1]||0);
  const vTipY=paperPath?paperPath.getBBox().y+paperPath.getBBox().height:0;
  // Use actual rendered SVG geometry, not a parser that assumes the apex is
  // encoded using a straight-line command (it is a cubic Bezier endpoint).
  const filled=(x,y)=>paperPath?.isPointInFill?.(new DOMPoint(x,y))===true;
  const lastCopy=cover?.querySelector('.hero-cover-inner>p:not(.eyebrow)');
  const cta=cover?.querySelector('.hero-cover-inner>a');
  const logo=paper?.querySelector('.hero01-full-logo');
  const svgXAtCopy=((copyRect?.left||0)-(edgeRect?.left||0))/(edgeRect?.width||1)*1440;
  const svgYAtCopy=svgXAtCopy<=720
   ?leftEdgeY+(vTipY-leftEdgeY)*svgXAtCopy/720
   :rightEdgeY+(vTipY-rightEdgeY)*(1440-svgXAtCopy)/720;
  const tearAtCopy=(edgeRect?.top||0)+svgYAtCopy*(edgeRect?.height||0)/440;
  const logoRect=logo?.getBoundingClientRect();
  const tipScreenY=(edgeRect?.top||0)+vTipY*(edgeRect?.height||0)/440;
  return {
   route:document.body.dataset.page,
   state:document.querySelector('#siteHeader')?.dataset.hero01Mode,
   slide:hero?.querySelector('.hero-slide.is-active')?.dataset.slide,
   coverBackground:cover&&getComputedStyle(cover).backgroundColor,
   paperBackground:paper&&getComputedStyle(paper).backgroundColor,
   paperPathFill:paperPath&&getComputedStyle(paperPath).fill,
   headerBottomBorder:getComputedStyle(document.querySelector('#siteHeader')).borderBottomWidth,
   leftEdgeY,rightEdgeY,vTipY,
   vFilledAtCenter:filled(721,419),vEmptyBelow:!filled(721,446),
   vOutsideLeft:!filled(25,210)&&filled(25,120),
   vOutsideRight:!filled(1415,210)&&filled(1415,120),
   logoClearsTip:!!(logoRect&&logoRect.bottom<=tipScreenY-22),
   logoEdgeClearance:!!(logoRect&&edgeRect&&paperPath&&
    [0.09,0.91].every(fraction=>paperPath.isPointInFill(new DOMPoint(
      (logoRect.left+logoRect.width*fraction-edgeRect.left)*1440/edgeRect.width,
      (logoRect.bottom+12-edgeRect.top)*440/edgeRect.height
    )))),
   copyBelowTip:!!(copyRect&&copyRect.top>=tipScreenY+12),
   tipScreenY,
   copyTop:copyRect?.top,
   logoTopMargin:logo&&getComputedStyle(logo).marginTop,
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
   heroLogoInert:document.querySelector('#hero .hero01-full-logo')?.inert??null,
   navWordmark:(()=>{
    const link=document.querySelector('#siteHeader .logo-word--image'),img=link?.querySelector('img');
    if(!link||!img)return {visible:false,loaded:false,reason:'missing'};
    const outer=getComputedStyle(link),inner=getComputedStyle(img),r=link.getBoundingClientRect();
    return {visible:outer.visibility==='visible'&&Number(outer.opacity)>.95&&
       inner.visibility==='visible'&&Number(inner.opacity)>.95&&r.width>70,
      loaded:img.complete&&img.naturalWidth>100,
      src:new URL(img.currentSrc||img.src,location.href).pathname,
      playing:link.classList.contains('c08-navbar-playing'),
      ariaHidden:link.getAttribute('aria-hidden'),tabIndex:link.tabIndex,
      width:r.width,opacity:outer.opacity};
   })()
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
 assert.equal(initial.navWordmark.visible,false,'Compact wordmark hidden only for Hero 01 at top');
 assert.equal(initial.fullLinkHidden,true,'Compact logo removed from special header accessibility tree');
 assert.equal(initial.heroLogoInert,false);
 if(t.width<=740)assert.equal(initial.copyBelowTip,true,
  'Mobile/narrow V tip must NOT overlap the eyebrow, heading or editorial copy');
 if(t.width>=1080)assert.ok(Number.parseFloat(initial.logoTopMargin)<=4,
  'Original full logo must be raised approximately 25px');
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
 await page.waitForFunction(()=>{
  const link=document.querySelector('#siteHeader .logo-word--image'),img=link?.querySelector('img');
  return link&&img&&getComputedStyle(link).visibility==='visible'&&Number(getComputedStyle(link).opacity)>.95&&
    img.complete&&img.naturalWidth>100&&getComputedStyle(img).visibility==='visible';
 },null,{timeout:3500});
 const scrolled=await sample(page);
 assert.equal(scrolled.navWordmark.visible,true,'Scroll restores visible compact raster');
 assert.equal(scrolled.navWordmark.loaded,true,'Navbar image decoded');
 assert.equal(scrolled.navWordmark.src,'/assets/chapchitra-wordmark.webp');
 assert.equal(scrolled.fullLinkHidden,false,'Standard navbar logo accessible on scroll');
 assert.equal(scrolled.heroLogoInert,true,'No duplicate or focusable logo below sticky navbar');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity)<.05,{},{timeout:2000});
 await page.screenshot({path:resolve(out,t.name+'-scrolled.png')});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 await page.locator('#hero [data-slide-to="1"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='standard');
 await page.waitForFunction(()=>{
  const el=document.querySelector('#siteHeader .logo-word--image');
  return el&&getComputedStyle(el).visibility==='visible'&&Number(getComputedStyle(el).opacity)>.95;
 },null,{timeout:3500});
 const slide02=await sample(page);
 assert.equal(slide02.slide,'1','Hero 02 active');
 assert.equal(slide02.navWordmark.visible,true,'Hero 02 restores original compact wordmark');
 assert.equal(slide02.navWordmark.loaded,true,'Hero 02 compact wordmark decoded');
 assert.ok(await page.locator('#hero .hero-slide[data-slide="1"]').isVisible());
 await page.screenshot({path:resolve(out,t.name+'-slide02.png')});
 // Capture the owner's exact requested continuous sequence:
 // Hero 01 -> Hero 02 -> Hero 01, with no intervening slide.
 await page.locator('#hero [data-slide-to="0"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity)>.95,
  null,{timeout:3500});
 const returned=await sample(page);
 assert.equal(returned.slide,'0');
 assert.equal(returned.heroLogoInert,false,'Large original logo regains accessibility at top');
 assert.equal(returned.navWordmark.visible,false,'Hero 01 restores large-only logo presentation');
 await page.screenshot({path:resolve(out,t.name+'-return.png')});
 // Additionally check the same standard compact wordmark for Hero 05,
 // then return to the special Hero 01 state before leaving for Shop.
 await page.locator('#hero [data-slide-to="4"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='standard');
 await page.waitForFunction(()=>Number(getComputedStyle(
  document.querySelector('#siteHeader .logo-word--image')).opacity)>.95,
  null,{timeout:3500});
 const slide05=await sample(page);
 assert.equal(slide05.slide,'4');
 assert.equal(slide05.navWordmark.visible,true,'Hero 05 must restore visible compact navbar logo');
 await page.locator('#hero [data-slide-to="0"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 await page.waitForFunction(()=>Number(getComputedStyle(
  document.querySelector('#hero .hero01-full-logo')).opacity)>.95,
  null,{timeout:3500});
 await page.waitForTimeout(250); // Hold the returned full-logo frame for review.
 // Exercise the REAL Home -> Shop navbar interaction (not page.goto).
 // Desktop/tablet uses the existing Shop link; mobile uses the unchanged menu.
 // Preserve cross-document C02 navigation and wait for the new document.
 const shopLink=page.locator('#siteHeader .nav-center>a[href="/shop/"]');
 if(await shopLink.isVisible())await shopLink.click();
 else{
  const menu=page.locator('#menuButton');
  await menu.click();
  await page.locator('#mobileNav a[href="/shop/"]').click();
 }
 await page.waitForURL(u=>u.pathname==='/shop/',{timeout:30000});
 await page.locator('#siteHeader .nav-center>a').first().waitFor({state:'attached',timeout:20000});
 await page.waitForFunction(()=>{
  const link=document.querySelector('#siteHeader .logo-word--image'),img=link?.querySelector('img');
  return !!(img&&img.complete&&img.naturalWidth>100&&
   getComputedStyle(link).visibility==='visible'&&Number(getComputedStyle(link).opacity)>.95);
 },null,{timeout:6000});
 const other=await page.evaluate(()=>({
  mode:document.querySelector('#siteHeader')?.dataset.hero01Mode||'standard',
  paper:document.querySelector('.hero01-paper-panel')!==null,
  navLinks:document.querySelectorAll('#siteHeader .nav-center>a').length,
  navArt:document.querySelectorAll('#siteHeader .nav-actions img.cc-nav-art').length,
  wordmark:(()=>{
   const link=document.querySelector('#siteHeader .logo-word--image'),img=link?.querySelector('img');
   if(!link||!img)return {loaded:false,visible:false};
   return {loaded:img.complete&&img.naturalWidth>100,
    visible:getComputedStyle(link).visibility==='visible'&&
     Number(getComputedStyle(link).opacity)>.95&&getComputedStyle(img).visibility==='visible',
    src:new URL(img.currentSrc||img.src).pathname,
    ariaHidden:link.getAttribute('aria-hidden')};
  })()
 }));
 assert.equal(other.mode,'standard');assert.equal(other.paper,false);
 assert.equal(other.navLinks,4);assert.equal(other.navArt,4);
 assert.deepEqual([other.wordmark.loaded,other.wordmark.visible,other.wordmark.ariaHidden],
  [true,true,null],'Shop must render the original compact wordmark and accessible link');
 assert.equal(other.wordmark.src,'/assets/chapchitra-wordmark.webp');
 await page.screenshot({path:resolve(out,t.name+'-shop.png')});
 if(t.name==='desktop-chromium'){
  // The original C08 hover must still play. Completion must restore the
  // ORIGINAL compact image even if the pointer remains above the link.
  const link=page.locator('#siteHeader .logo-word--image');
  await page.waitForFunction(()=>!!window.__chapchitraC08?.navbar,null,{timeout:10000});
  await link.hover();
  await page.waitForFunction(()=>window.__chapchitraC08?.navbar?.completed>=1,null,{timeout:18000});
  await page.waitForFunction(()=>!document.querySelector('#siteHeader .logo-word--image').classList.contains('c08-navbar-playing'));
  assert.equal(await link.locator('img').evaluate(n=>getComputedStyle(n).visibility),'visible',
    'C08 completed hover must restore compact image while pointer remains hovered');
  await page.screenshot({path:resolve(out,'desktop-chromium-shop-hover-restored.png')});
  await page.mouse.move(2,320);
  await link.hover();
  await page.waitForFunction(()=>window.__chapchitraC08?.navbar?.completed>=2,null,{timeout:18000});
  assert.equal(await link.locator('img').evaluate(n=>getComputedStyle(n).visibility),'visible',
    'C08 must rearm, replay and restore original logo a second time');
 }
 await context.close();
 const video=await page.video().path();
 await copyFile(video,resolve(out,t.name+'-transitions.webm'));
 await browser.close();
 assert.deepEqual(errors,[],t.name+' browser errors');
 result.push({profile:t.name,initial,afterC08,scrolled,slide02,returned,other,errors,
  screenshots:[t.name+'-special.png',t.name+'-logo-complete.png',t.name+'-scrolled.png',t.name+'-slide02.png',t.name+'-return.png',t.name+'-shop.png'],
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
