/* CHAPCHITRA C08: independent browser QA + actual lottie-web recording evidence.
   This uses the original 240-frame JSON directly in the official 5.13.0 SVG renderer. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'docs/c08-evidence');
const url=process.env.C08_URL||'http://127.0.0.1:19289/';
const binary=process.env.C08_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const results={url,runAt:new Date().toISOString(),checks:[],errors:[],screenshots:[],videos:[]};
function assert(ok,label,detail={}) {
 results.checks.push({label,passed:!!ok,...(detail?{detail}:{})});
 console.log((ok?'PASS ':'FAIL ')+label+' '+JSON.stringify(detail));
}
const state=p=>p.evaluate(()=>window.__chapchitraC08);
async function ready(page){
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 assert(response.status()===200,'homepage HTTP success',{status:response.status()});
 await page.waitForFunction(()=>window.__chapchitraC08?.hero.ready===true,null,{timeout:45000});
}
async function screenshot(page,name,target){
 const file=path.join(output,name);
 if(target) await page.locator(target).screenshot({path:file,animations:'disabled'});
 else await page.screenshot({path:file});
 results.screenshots.push(name);
}
function near(a,b,epsilon=1){return Math.abs(a-b)<=epsilon}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:binary});
 try{
  // Primary hero autoplay: no eager navbar Lottie instance, exact 4sec and carousel gate.
  const d=await browser.newContext({viewport:{width:1408,height:900},deviceScaleFactor:1});
  const p=await d.newPage();
  p.on('pageerror',e=>results.errors.push(e.message));
  await ready(p);
  const first=await state(p);
  assert(first.hero.playing&&first.hero.autoplay===1,'hero autoplay starts exactly once',first.hero);
  assert(!first.navbar.loaded&&!first.navbar.playing,'navbar remains static during hero autoplay',first.navbar);
  const startGeometry=await p.evaluate(()=>{
   const img=document.querySelector('.hero-brand-lockup').getBoundingClientRect();
   const stage=document.querySelector('#c08HeroStage').getBoundingClientRect();
   const nav=document.querySelector('.logo-word--image').getBoundingClientRect();
   const footer=document.querySelector('#footer .logo-word--footer');
   return {image:{x:img.x,y:img.y,w:img.width,h:img.height},
           overlay:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},
           navCenter:nav.x+nav.width/2,viewportCenter:innerWidth/2,
           footerImage:footer?.querySelector('img')?.getAttribute('src'),
           footerLottie:document.querySelectorAll('#footer .c08-navbar-animation, #footer .c08-hero-wordmark').length,
           runtimeScripts:[...document.scripts].filter(s=>s.src.includes('/motion/c01/vendor/lottie.min.js')).length};
  });
  assert(near(startGeometry.image.x,startGeometry.overlay.x,.8)&&near(startGeometry.image.y,startGeometry.overlay.y,.8)&&
    near(startGeometry.image.w,startGeometry.overlay.w,.8)&&near(startGeometry.image.h,startGeometry.overlay.h,.8),
    'hero overlay preserves exact centered original logo dimensions',startGeometry);
  assert(near(startGeometry.navCenter,startGeometry.viewportCenter,1),'navbar remains centered to viewport',startGeometry);
  assert(startGeometry.runtimeScripts===1,'C01/C08 reuse one shared self-hosted Lottie script',startGeometry);
  assert(startGeometry.footerImage==='/assets/chapchitra-wordmark-cream-terra.webp'&&startGeometry.footerLottie===0,
    'footer retains approved static light logo only',startGeometry);
  await p.waitForFunction(()=>window.__chapchitraC08.hero.completed===1,null,{timeout:12000});
  const completed=await state(p);
  assert(completed.hero.autoplay===1&&completed.hero.frame===239&&!completed.hero.playing,
    'hero final frame held after one autoplay',completed.hero);
  assert(!completed.navbar.loaded,'navbar never initializes while hero autoplays',completed.navbar);
  const slide=await p.evaluate(()=>document.querySelector('.hero-slide.is-active')?.dataset.slide);
  assert(slide==='0','carousel does not interrupt initial logo playback',{slide});
  await screenshot(p,'c08-hero-final-desktop.png');
  // Navbar hover: once per entry, no auto loop, second entry after exit.
  const nav=p.locator('.logo-word--image');
  await nav.hover();
  await p.waitForFunction(()=>window.__chapchitraC08.navbar.ready&&window.__chapchitraC08.navbar.playing,null,{timeout:15000});
  await screenshot(p,'c08-navbar-hover-desktop.png');
  await p.waitForFunction(()=>window.__chapchitraC08.navbar.completed===1,null,{timeout:8500});
  await p.waitForTimeout(450);
  assert((await state(p)).navbar.completed===1,'navbar does not restart while pointer remains inside');
  await p.mouse.move(5,710);
  await nav.hover();
  await p.waitForFunction(()=>window.__chapchitraC08.navbar.completed===2,null,{timeout:8500});
  assert((await state(p)).navbar.completed===2,'navbar replays once after pointer leaves and returns');
  // Hero hover: manual slide return remains possible, playback once per entry.
  await p.locator('.hero-dot').first().click();
  await p.locator('#c08HeroStage .c08-hero-trigger').hover();
  await p.waitForFunction(()=>window.__chapchitraC08.hero.completed===2,null,{timeout:8500});
  await p.waitForTimeout(420);
  assert((await state(p)).hero.completed===2,'hero hover replays once without looping');
  await p.mouse.move(5,710);
  await p.locator('#c08HeroStage .c08-hero-trigger').hover();
  await p.waitForFunction(()=>window.__chapchitraC08.hero.completed===3,null,{timeout:8500});
  assert((await state(p)).hero.completed===3,'hero replays again after pointer exit/reentry');
  await d.close();
  // Responsive: exact logo geometry and original navbar positioning remain intact.
  for(const width of [834,430,320]){
   const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
   const page=await ctx.newPage();
   await ready(page);
   const x=await page.evaluate(()=>{
    const img=document.querySelector('.hero-brand-lockup').getBoundingClientRect();
    const stage=document.querySelector('#c08HeroStage').getBoundingClientRect();
    const nav=document.querySelector('.logo-word--image').getBoundingClientRect();
    return {img:[img.x,img.y,img.width,img.height],stage:[stage.x,stage.y,stage.width,stage.height],
            navCenter:nav.left+nav.width/2,screenCenter:innerWidth/2,
            overflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert(x.img.every((v,i)=>near(v,x.stage[i],1))&&!x.overflow&&near(x.navCenter,x.screenCenter,1),
    'responsive hero and navbar preserve original proportions at '+width+'px',x);
   await page.waitForFunction(()=>window.__chapchitraC08.hero.completed===1,null,{timeout:8500});
   await screenshot(page,'c08-hero-final-'+width+'.png');
   await ctx.close();
  }
  // Mobile touch: replay hero, navbar tap still follows Home link.
  const mobile=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const mp=await mobile.newPage();
  await ready(mp);
  await mp.waitForFunction(()=>window.__chapchitraC08.hero.completed===1,null,{timeout:8500});
  const coarse=await mp.evaluate(()=>matchMedia('(hover:hover) and (pointer:fine)').matches);
  assert(coarse===false,'mobile/touch does not advertise mouse hover');
  await mp.locator('#c08HeroStage .c08-hero-trigger').tap();
  await mp.waitForFunction(()=>window.__chapchitraC08.hero.completed===2,null,{timeout:8500});
  assert((await state(mp)).hero.completed===2,'hero tap replays once on touch');
  assert(!(await state(mp)).navbar.loaded,'navbar stays static on touch when hero is tapped');
  await mp.locator('.logo-word--image').tap();
  await mp.waitForTimeout(280);
  const touchNav=await mp.evaluate(()=>({path:location.pathname,navbar:window.__chapchitraC08?.navbar}));
  assert(touchNav.path==='/'&&!touchNav.navbar.loaded,'navbar touch tap still navigates Home, without starting animation',touchNav);
  await mobile.close();
  // Reduced motion: no hero/nav Lottie, full static original logo and untouched footer.
  const reduced=await browser.newContext({viewport:{width:430,height:900},reducedMotion:'reduce'});
  const rp=await reduced.newPage();
  await rp.goto(url,{waitUntil:'domcontentloaded'});
  await rp.waitForTimeout(400);
  const still=await rp.evaluate(()=>({
   logoImage:document.querySelector('.hero-brand-lockup')?.complete&&document.querySelector('.hero-brand-lockup')?.naturalWidth>0,
   hero:window.__chapchitraC08?.hero,nav:window.__chapchitraC08?.navbar,
   overlay:document.querySelector('.hero-cover-inner')?.classList.contains('c08-hero-shown'),
   buttonVisible:getComputedStyle(document.querySelector('.c08-hero-trigger')).display!=='none'
  }));
  assert(still.logoImage&&!still.hero?.playing&&!still.hero?.ready&&!still.nav?.loaded&&!still.overlay&&!still.buttonVisible,
    'reduced-motion retains complete static identity without loading C08 Lottie',still);
  await screenshot(rp,'c08-reduced-mobile.png');
  await reduced.close();
 }finally{
  await browser.close();
 }
 // Record actual original SVG Lottie playback in host browser: initial hero-only autoplay,
 // then manual navbar hover. Browser capture is never shipped to the live website.
 const recordBrowser=await chromium.launch({headless:true,executablePath:binary});
 try{
  const recordHero=await recordBrowser.newContext({viewport:{width:1280,height:720},
    deviceScaleFactor:1,recordVideo:{dir:output,size:{width:1280,height:720}}});
  const page=await recordHero.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__chapchitraC08?.hero.ready,null,{timeout:45000});
  await page.waitForFunction(()=>window.__chapchitraC08.hero.completed>=1,null,{timeout:8500});
  await page.waitForTimeout(330);
  await page.close();
  await fs.copyFile(await page.video().path(),path.join(output,'c08-hero-autoplay-navbar-static.webm'));
  results.videos.push('c08-hero-autoplay-navbar-static.webm');
  await recordHero.close();
  const recordNav=await recordBrowser.newContext({viewport:{width:1280,height:720},
    deviceScaleFactor:1,recordVideo:{dir:output,size:{width:1280,height:720}}});
  const np=await recordNav.newPage();
  await np.goto(url,{waitUntil:'domcontentloaded'});
  await np.waitForFunction(()=>window.__chapchitraC08?.hero.completed===1,null,{timeout:12000});
  await np.locator('.logo-word--image').hover();
  await np.waitForFunction(()=>window.__chapchitraC08?.navbar.completed===1,null,{timeout:8500});
  await np.waitForTimeout(350);
  await np.close();
  await fs.copyFile(await np.video().path(),path.join(output,'c08-navbar-hover-reprint.webm'));
  results.videos.push('c08-navbar-hover-reprint.webm');
  await recordNav.close();
 }finally{await recordBrowser.close()}
 await fs.writeFile(path.join(output,'c08-browser-qa.json'),JSON.stringify(results,null,2)+'\n');
 console.log('C08 QA:',results.checks.filter(c=>c.passed).length+'/'+results.checks.length,'PASS, browser errors:',results.errors.length);
 if(results.checks.some(c=>!c.passed)||results.errors.length)process.exitCode=1;
})().catch(e=>{console.error('C08 QA FAILED',e);process.exitCode=2});
