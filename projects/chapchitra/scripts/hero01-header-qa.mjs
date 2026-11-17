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
 assert.match(snapshot.paperFilter,/^drop-shadow\(/,
  'Mushroom Grey shadow must follow the irregular SVG silhouette, not a box');
 assert.equal(snapshot.paperBoxShadow,'none','Do not introduce a rectangular box-shadow');
 assert.equal(snapshot.shadowPathCount,0,'No duplicate offset path or additional paper layer');
 assert.equal(snapshot.paperPathCount,1,'Render exactly the original Illustrator silhouette');
 assert.equal(snapshot.tearPaths,1,'No decorative fiber or outline paths');
 assert.equal(snapshot.headerBottomBorder,'0px','Remove divider beneath special Hero 01 navbar');
 assert.ok(snapshot.vTipY>=1180&&snapshot.vTipY<=1190,'Original Illustrator V-tip extent must be preserved');
 assert.ok(snapshot.vTipY-snapshot.leftEdgeY>=450&&snapshot.vTipY-snapshot.rightEdgeY>=450,
  'Both torn slopes descend toward the single central tip');
 assert.ok(snapshot.vFilledAtCenter&&snapshot.vEmptyBelow&&snapshot.vOutsideLeft&&snapshot.vOutsideRight,
  'One white SVG must render a downward V with dark space outside both slopes');
 // Measure the owner's desktop target in rendered viewport pixels, never merely in SVG units.
 if(snapshot.viewportWidth===1440&&snapshot.viewportHeight===900){
  const ratio=snapshot.tipScreenY/snapshot.viewportHeight;
  assert.ok(ratio>=.44&&ratio<=.45,
   'Initial V tip must be 44–45% down the visible desktop viewport: '+ratio);
  assert.ok(snapshot.leftShoulderScreenY<=220&&snapshot.rightShoulderScreenY<=220,
   'Both torn shoulders must rise with the shallower V');
  assert.ok(snapshot.tipScreenY-Math.max(snapshot.leftShoulderScreenY,snapshot.rightShoulderScreenY)>=180,
   'The shallower V must retain expressive diagonal depth');
 }
 assert.ok(snapshot.logoClearsTip,'Full logo must clear tip with at least 22px of paper');
 assert.ok(snapshot.logoEdgeClearance,'Both outer wordmark letters must have >=12px of white paper below them');
 assert.equal(snapshot.copyAlignment,'left','Hero 01 text must align left');
 assert.ok(snapshot.ctaLeftAligned,'Hero 01 CTA must align with copy');
 assert.ok(snapshot.ctaBelowText,'CTA must remain beneath the copy');
 assert.ok(snapshot.logoCentered,'Full original logo must be horizontally centered in paper');
 assert.ok(snapshot.logoUniform90,'Original full lockup width must equal exactly 90% of prior responsive width');
 assert.ok(snapshot.logoImageMatchesBox,'Original patch and wordmark must scale together at native aspect ratio');
 assert.ok(snapshot.logoRaised,'Entire logo must shift upward, not move patch and wordmark independently');
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
  // Illustrator master is unmodified. Its viewBox is presentation-cropped
  // to the approved Hero 01 depth; all hit tests operate in native path units.
  const vb=tear?.viewBox.baseVal;
  const nativeX=(x)=>(vb?.x||0)+(x-(edgeRect?.left||0))*(vb?.width||1)/(edgeRect?.width||1);
  const nativeY=(y)=>(vb?.y||0)+(y-(edgeRect?.top||0))*(vb?.height||1)/(edgeRect?.height||1);
  const screenY=(y)=>(edgeRect?.top||0)+(y-(vb?.y||0))*(edgeRect?.height||0)/(vb?.height||1);
  const filled=(x,y)=>paperPath?.isPointInFill?.(new DOMPoint(x,y))===true;
  const edgeAt=(x)=>{
    let lo=vb?.y||0,hi=lo+(vb?.height||1);
    for(let i=0;i<17;i++){
      const mid=(lo+hi)/2;
      if(filled(x,mid))lo=mid;else hi=mid;
    }
    return (lo+hi)/2;
  };
  const leftEdgeY=edgeAt(5),rightEdgeY=edgeAt(4195);
  const vTipY=paperPath?paperPath.getBBox().y+paperPath.getBBox().height:0;
  const lastCopy=cover?.querySelector('.hero-cover-inner>p:not(.eyebrow)');
  const cta=cover?.querySelector('.hero-cover-inner>a');
  const logo=paper?.querySelector('.hero01-full-logo');
  const svgXAtCopy=nativeX(copyRect?.left||0);
  const tearAtCopy=screenY(edgeAt(svgXAtCopy));
  const logoRect=logo?.getBoundingClientRect();
  const tipScreenY=screenY(vTipY);
  return {
   route:document.body.dataset.page,
   state:document.querySelector('#siteHeader')?.dataset.hero01Mode,
   slide:hero?.querySelector('.hero-slide.is-active')?.dataset.slide,
   coverBackground:cover&&getComputedStyle(cover).backgroundColor,
   paperBackground:paper&&getComputedStyle(paper).backgroundColor,
   paperPathFill:paperPath&&getComputedStyle(paperPath).fill,
   paperFilter:tear&&getComputedStyle(tear).filter,
   paperBoxShadow:tear&&getComputedStyle(tear).boxShadow,
   shadowPathCount:tear?.querySelectorAll('path.hero01-paper-shadow').length||0,
   paperPathCount:tear?.querySelectorAll('path.hero01-paper-cut').length||0,
   headerBottomBorder:getComputedStyle(document.querySelector('#siteHeader')).borderBottomWidth,
   viewportWidth:innerWidth,viewportHeight:innerHeight,
   paperHeight:edgeRect?.height,
   leftShoulderScreenY:screenY(leftEdgeY),
   rightShoulderScreenY:screenY(rightEdgeY),
   leftEdgeY,rightEdgeY,vTipY,
   vFilledAtCenter:filled(2074,vTipY-20),vEmptyBelow:!filled(2074,vTipY+15),
   vOutsideLeft:!filled(5,leftEdgeY+35)&&filled(5,leftEdgeY-35),
   vOutsideRight:!filled(4195,rightEdgeY+35)&&filled(4195,rightEdgeY-35),
   logoClearsTip:!!(logoRect&&logoRect.bottom<=tipScreenY-22),
   logoEdgeClearance:!!(logoRect&&edgeRect&&paperPath&&
    [0.09,0.91].every(fraction=>paperPath.isPointInFill(new DOMPoint(
      nativeX(logoRect.left+logoRect.width*fraction),
      nativeY(logoRect.bottom+12)
    )))),
   copyBelowTip:!!(copyRect&&copyRect.top>=tipScreenY+12),
   tipScreenY,
   copyTop:copyRect?.top,
   logoTopMargin:logo&&getComputedStyle(logo).marginTop,
   logoUniform90:!!(logoRect&&Math.abs(logoRect.width-
    0.9*(innerWidth<=740
      ?Math.min(246,Math.max(202,innerWidth*0.59))
      :Math.min(306,Math.max(228,innerWidth*0.23))))<1.2),
   logoImageMatchesBox:(()=>{
     const img=logo?.querySelector('img.hero-brand-lockup'),ir=img?.getBoundingClientRect();
     return !!(logoRect&&ir&&Math.abs(ir.width-logoRect.width)<1.2&&
       Math.abs(ir.height-ir.width*1052/1250)<2);
   })(),
   logoRaised:!!(logo&&Number.parseFloat(getComputedStyle(logo).marginTop)<
     (innerWidth<=365?7:innerWidth<=740?6:innerWidth<=950?4:3)), 
   logoStageAligned:(()=>{
    const imgRect=logo?.querySelector('img.hero-brand-lockup')?.getBoundingClientRect();
    const stageRect=logo?.querySelector('.c08-hero-stage')?.getBoundingClientRect();
    return !!(imgRect&&stageRect&&stageRect.width>0&&Math.abs(imgRect.left-stageRect.left)<2&&
      Math.abs(imgRect.top-stageRect.top)<2&&Math.abs(imgRect.width-stageRect.width)<2);
   })(),
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
 const page=await context.newPage(),errors=[],reviewTimeline=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes('/assets/chapchitra-full.webp')&&response.status()>=400)
  errors.push('Full logo HTTP '+response.status())});
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#hero .hero01-paper-panel').waitFor({state:'visible',timeout:20000});
 // Verify the actual original logo asset, not merely an <img> node. On a
 // throttled device DOMContentLoaded can precede image decode by several frames.
 await page.locator('#hero .hero01-full-logo>img.hero-brand-lockup').evaluate(async img=>{
  await img.decode();
  if(img.naturalWidth<100)throw Error('Original full illustrated logo failed to decode');
 });
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
 if(t.width>=1080)assert.ok(Number.parseFloat(initial.logoTopMargin)<0,
  'Desktop full logo must move upward as one unit with clear sticky-nav separation');
 if(t.width<=365)assert.ok(initial.controlBottom<=t.height+1,
  'Narrow-screen Hero 01 slider controls must be visible in the initial viewport');
 await page.screenshot({path:resolve(out,t.name+'-special.png')});
 reviewTimeline.push({event:'01 initial full logo',mode:initial.state,compactVisible:initial.navWordmark.visible,scale90:initial.logoUniform90});
 await page.waitForTimeout(550);
 await page.waitForFunction(()=>window.__chapchitraC08?.hero?.completed>=1,null,{timeout:22000});
 const afterC08=await sample(page);
 assert.equal(afterC08.logoAnimation.failed,false,'Reuse exact approved C08 timeline');
 assert.equal(afterC08.logoAnimation.autoplay,1,'Original C08 hero autoplay fires once');
 assert.ok(afterC08.logoStageAligned,'Approved C08 Wordmark Reprint overlay must track the uniformly scaled original lockup');
 await page.screenshot({path:resolve(out,t.name+'-logo-complete.png')});
 if(t.name==='desktop-chromium'||t.name==='ipad-webkit'){
  const width=Math.min(610,Math.floor(t.width*.76)),height=180;
  const clip={
   x:Math.round((t.width-width)/2),
   y:Math.max(0,Math.min(t.height-height,Math.round(afterC08.tipScreenY-height*.66))),
   width,height
  };
  await page.screenshot({path:resolve(out,t.name+'-torn-edge-shadow-closeup.png'),clip});
 }
 reviewTimeline.push({event:'01 C08 complete',completed:afterC08.logoAnimation.completed,c08Aligned:afterC08.logoStageAligned});
 await page.waitForTimeout(550);
 const paperAtTop=await page.locator('#hero01PaperPanel').evaluate(el=>el.getBoundingClientRect().top);
 const logoAtTop=await page.locator('#hero .hero01-full-logo').evaluate(el=>el.getBoundingClientRect().top);
 // Slow downward scroll while the original illustrated logo and V travel together.
 for(const y of [30,60,90,120,150,185]){
  await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
  await page.waitForTimeout(60);
 }
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 const mid=await sample(page);
 assert.equal(mid.navWordmark.visible,false,'No duplicate compact logo over partially visible paper');
 assert.equal(mid.heroLogoInert,false,'Original hero logo remains interactive');
 const midGeo=await page.evaluate(()=>({
  paper:document.querySelector('#hero01PaperPanel').getBoundingClientRect().top,
  logo:document.querySelector('#hero .hero01-full-logo').getBoundingClientRect().top,
  opacity:getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity
 }));
 assert.ok(Math.abs(midGeo.paper-paperAtTop+185)<3,'V follows native scroll');
 assert.ok(Math.abs(midGeo.logo-logoAtTop+185)<3,'Original logo follows same scroll');
 assert.equal(midGeo.opacity,'1','Never fade original artwork while still visible');
 await page.screenshot({path:resolve(out,t.name+'-paper-mid-scroll.png')});
 reviewTimeline.push({event:'paper-mid-scroll',mode:mid.state,scrollY:185,logoOpacity:midGeo.opacity});
 for(const y of [230,280,330,380,430,480]){
  await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
  await page.waitForTimeout(60);
 }

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
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity)>.95,{},{timeout:2000});
 await page.screenshot({path:resolve(out,t.name+'-scrolled.png')});
 reviewTimeline.push({event:'scroll down: compact navbar visible',compactVisible:scrolled.navWordmark.visible,heroInert:scrolled.heroLogoInert});
 await page.waitForTimeout(650);
 for(const y of [430,380,330,280,230,185,150,120,90,60,30,0]){
  await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
  await page.waitForTimeout(60);
 }

 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity)>.95);
 await page.screenshot({path:resolve(out,t.name+'-scroll-restored.png')});
 reviewTimeline.push({event:'scroll top: full logo restored',mode:'special'});
 await page.waitForTimeout(650);
 // Real-browser timer gate: a returned Hero01 gets eight seconds (not an
 // additional interval after C08), the next hero gets four seconds.
 await page.evaluate(()=>document.querySelector('#hero').dispatchEvent(new MouseEvent('mouseleave')));
 await page.locator('#hero [data-slide-to="0"]').evaluate(node=>node.click());
 const dwellStart=await page.evaluate(()=>performance.now());
 await page.waitForFunction(()=>document.querySelector('#hero .hero-slide.is-active')?.dataset.slide==='1',null,{timeout:13000});
 const firstDwell=(await page.evaluate(()=>performance.now()))-dwellStart;
 assert.ok(firstDwell>=7900&&firstDwell<9000,'Hero01 dwell must be 8000ms total');
 const nextStart=await page.evaluate(()=>performance.now());
 await page.waitForFunction(()=>document.querySelector('#hero .hero-slide.is-active')?.dataset.slide==='2',null,{timeout:7500});
 const secondDwell=(await page.evaluate(()=>performance.now()))-nextStart;
 assert.ok(secondDwell>=3900&&secondDwell<5000,'Hero02 dwell must be 4000ms');
 reviewTimeline.push({event:'native 8s/4s autoplay',firstDwell,secondDwell});
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
 // One continuous recording: Hero 01 -> 02 -> 03 -> 04 -> 05 -> 01.
 reviewTimeline.push({event:'02 active',compactVisible:slide02.navWordmark.visible});
 await page.waitForTimeout(650);
 for(const [target,name] of [[2,'03'],[3,'04'],[4,'05']]){
  await page.locator('#hero [data-slide-to="'+target+'"]').evaluate(node=>node.click());
  await page.waitForFunction(index=>document.querySelector('#hero .hero-slide.is-active')?.dataset.slide===String(index),target);
  await page.waitForFunction(()=>{
   const el=document.querySelector('#siteHeader .logo-word--image'),img=el?.querySelector('img');
   return el&&img&&getComputedStyle(el).visibility==='visible'&&
     Number(getComputedStyle(el).opacity)>.95&&getComputedStyle(img).visibility==='visible';
  },null,{timeout:3500});
  const snap=await sample(page);
  assert.equal(snap.state,'standard','Slides 02–05 must use the ONE standard navbar');
  assert.equal(snap.navWordmark.visible,true,'Original compact navbar wordmark visible for Hero '+name);
  assert.equal(snap.heroLogoInert,true,'Full logo must not stay interactive on Hero '+name);
  reviewTimeline.push({event:name+' active',compactVisible:snap.navWordmark.visible,heroInert:snap.heroLogoInert});
  await page.screenshot({path:resolve(out,t.name+'-slide'+name+'.png')});
  await page.waitForTimeout(650);
 }
 await page.locator('#hero [data-slide-to="0"]').evaluate(node=>node.click());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#hero .hero01-full-logo')).opacity)>.95,
  null,{timeout:3500});
 await page.waitForFunction(()=>{
  const el=document.querySelector('#siteHeader .logo-word--image');
  return el&&getComputedStyle(el).visibility==='hidden'&&Number(getComputedStyle(el).opacity)<.05;
 },null,{timeout:3500});
 const returned=await sample(page);
 assert.equal(returned.slide,'0');
 assert.equal(returned.heroLogoInert,false,'Large logo regains accessibility after Hero 05');
 assert.equal(returned.navWordmark.visible,false,'Compact navbar logo hidden ONLY on Hero 01 at top');
 reviewTimeline.push({event:'01 restored after 05',compactVisible:returned.navWordmark.visible,fullLogoInert:returned.heroLogoInert});
 await page.screenshot({path:resolve(out,t.name+'-return.png')});
 await page.waitForTimeout(750);
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
 // Record the entire C02 ink transition, but take the Shop *screenshot*
 // after its owner-approved cover/reveal overlay has actually been destroyed.
 // A DOM-state screenshot during ink cover cannot prove navbar visibility.
 await page.waitForFunction(()=>!document.querySelector('#c02-loader')&&
  !document.documentElement.classList.contains('c02-pending'),null,{timeout:20000});
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
 reviewTimeline.push({event:'Home -> Shop via C02',route:'shop',compactVisible:other.wordmark.visible});
 await page.waitForTimeout(650);
 // Return via the ONE original compact navbar Home link.
 await page.locator('#siteHeader .logo-word--image').click();
 await page.waitForURL(u=>u.pathname==='/',{timeout:30000});
 await page.locator('#hero .hero01-full-logo>img.hero-brand-lockup').evaluate(img=>img.decode());
 await page.waitForFunction(()=>document.querySelector('#siteHeader')?.dataset.hero01Mode==='special',null,{timeout:6000});
 const homeRestored=await sample(page);
 assert.equal(homeRestored.navWordmark.visible,false,'Home restores full logo before Journal transition');
 assert.equal(homeRestored.heroLogoInert,false);
 reviewTimeline.push({event:'Shop -> Home: full logo restored',route:'home',scale90:homeRestored.logoUniform90});
 await page.screenshot({path:resolve(out,t.name+'-home-before-journal.png')});
 await page.waitForTimeout(650);
 // Real Home -> Journal click with approved C02 navigation; mobile uses drawer.
 const journalLink=page.locator('#siteHeader .nav-center>a[href="/journal/"]');
 if(await journalLink.isVisible())await journalLink.click();
 else{
  await page.locator('#menuButton').click();
  await page.locator('#mobileNav a[href="/journal/"]').click();
 }
 await page.waitForURL(u=>u.pathname==='/journal/',{timeout:30000});
 await page.waitForFunction(()=>!document.querySelector('#c02-loader')&&
   !document.documentElement.classList.contains('c02-pending'),null,{timeout:20000});
 await page.waitForFunction(()=>{
   const link=document.querySelector('#siteHeader .logo-word--image'),img=link?.querySelector('img');
   return !!(img&&img.complete&&img.naturalWidth>100&&
     getComputedStyle(link).visibility==='visible'&&Number(getComputedStyle(link).opacity)>.95&&
     getComputedStyle(img).visibility==='visible');
 },null,{timeout:6000});
 const journal=await page.evaluate(()=>{
  const link=document.querySelector('#siteHeader .logo-word--image'),img=link?.querySelector('img');
  return {route:document.body.dataset.page,logoVisible:getComputedStyle(link).visibility==='visible'&&
   Number(getComputedStyle(link).opacity)>.95&&getComputedStyle(img).visibility==='visible',
   logoLoaded:img.complete&&img.naturalWidth>100,logoSource:new URL(img.currentSrc||img.src).pathname};
 });
 assert.equal(journal.route,'journal');
 assert.ok(journal.logoVisible&&journal.logoLoaded,'Journal must retain original compact navbar wordmark');
 assert.equal(journal.logoSource,'/assets/chapchitra-wordmark.webp');
 reviewTimeline.push({event:'Home -> Journal via C02',route:journal.route,compactVisible:journal.logoVisible});
 await page.screenshot({path:resolve(out,t.name+'-journal.png')});
 await page.waitForTimeout(700);
 await context.close();
 const video=await page.video().path();
 await copyFile(video,resolve(out,t.name+'-transitions.webm'));
 await browser.close();
 assert.deepEqual(errors,[],t.name+' browser errors');
 result.push({profile:t.name,initial,afterC08,scrolled,slide02,returned,other,homeRestored,journal,reviewTimeline,errors,
  screenshots:[t.name+'-special.png',t.name+'-logo-complete.png',t.name+'-paper-mid-scroll.png',t.name+'-scrolled.png',t.name+'-scroll-restored.png',
   t.name+'-slide02.png',t.name+'-slide03.png',t.name+'-slide04.png',t.name+'-slide05.png',
   t.name+'-return.png',t.name+'-shop.png',t.name+'-home-before-journal.png',t.name+'-journal.png'],
  recording:t.name+'-transitions.webm',
  edgeShadowCloseup:(t.name==='desktop-chromium'||t.name==='ipad-webkit')
   ?t.name+'-torn-edge-shadow-closeup.png':null});
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
