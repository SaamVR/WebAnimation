/**
 * CHAPCHITRA: isolate carousel/manual/scroll/reduced-motion regression QA.
 * Reads the approved site, never modifies the site's clock or artwork.
 */
import {chromium,webkit} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const root='http://127.0.0.1:4297';
const out=resolve(import.meta.dirname,'../perf-results/hero01-carousel-timing-review');
await mkdir(out,{recursive:true});
const results=[];
const profiles=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112}
];
for(const t of profiles){
 let browser,context;
 const record={name:t.name,checks:{},errors:[]};
 try{
  browser=await t.engine.launch({headless:true,timeout:20000});
  context=await browser.newContext({
   viewport:{width:t.width,height:t.height},hasTouch:t.name==='ipad-webkit',
   reducedMotion:'no-preference'
  });
  const page=await context.newPage();
  page.on('pageerror',e=>record.errors.push(e.message));
  await page.goto(root+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#hero .hero-slide.is-active').waitFor({timeout:18000});
  await page.waitForFunction(()=>window.__chapchitraC08?.hero?.completed>=1,null,{timeout:22000});
  record.checks.initialC08Completed=await page.evaluate(()=>
   window.__chapchitraC08?.hero?.autoplay===1&&window.__chapchitraC08?.hero?.completed>=1);
  // Actual click on visible slide dot, with all interactive event listeners.
  await page.locator('#hero [data-slide-to="1"]').click({timeout:5000});
  record.checks.manualDot=await page.evaluate(()=>
   document.querySelector('#hero .hero-slide.is-active')?.dataset.slide==='1');
  // Cursor remains over the hero and must pause only autoplay, not other animation.
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel?.state?.running===false,null,{timeout:4000});
  const hoverBefore=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  await page.waitForTimeout(600);
  const hoverAfter=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  record.hoverRemaining={before:hoverBefore,after:hoverAfter};
  record.checks.hoverPause=Math.abs(hoverAfter-hoverBefore)<80;
  // Resume from the header outside the hero.
  await page.mouse.move(5,5);
  // A click also focuses the hero dot, so move BOTH pointer and keyboard focus away.
  await page.locator("#siteHeader .nav-actions a").first().focus();
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel?.state?.running===true,null,{timeout:4000});
  const movingBefore=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  await page.waitForTimeout(320);
  const movingAfter=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  record.checks.resumeAfterHover=movingBefore-movingAfter>220;
  // Scroll well below the hero so IntersectionObserver pauses the carousel.
  await page.evaluate(()=>window.scrollTo({top:1200,behavior:'instant'}));
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel?.state?.running===false,null,{timeout:4500});
  const offBefore=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  await page.waitForTimeout(700);
  const offAfter=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  record.scrollRemaining={before:offBefore,after:offAfter};
  record.checks.offscreenPause=Math.abs(offAfter-offBefore)<80;
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel?.state?.running===true,null,{timeout:4500});
  const returnBefore=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  await page.waitForTimeout(300);
  const returnAfter=await page.evaluate(()=>window.__chapchitraHeroCarousel.state.remainingMs);
  record.checks.onScreenResume=returnBefore-returnAfter>180;
  // Manual go back to Hero 01 must preserve 8s deadline and C08 original completion.
  await page.locator('#hero [data-slide-to="0"]').evaluate(b=>b.click());
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel?.state?.slide===0,null,{timeout:4000});
  const s=await page.evaluate(()=>({
   clock:window.__chapchitraHeroCarousel.state,
   c08:window.__chapchitraC08?.hero,
   paperPath:document.querySelector('#hero01PaperPanel .hero01-paper-cut')?.getAttribute('d')?.length
  }));
  record.checks.manualReturnToHero1=s.clock.remainingMs>7500&&s.clock.remainingMs<=8000;
  record.c08ManualReturnDebug={autoplay:s.c08?.autoplay,completed:s.c08?.completed,failed:s.c08?.failed,pathLength:s.paperPath};
  record.checks.c08StillValid=s.c08?.autoplay===1&&s.c08?.completed>=1&&s.paperPath>100;
  // The focus pause and resume behavior are part of the original approved carousel.
  await page.locator('#hero [data-slide-to="2"]').focus();
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel.state.running===false,null,{timeout:4000});
  record.checks.keyboardFocusPause=true;
  await page.locator('body').evaluate(b=>{const e=b.querySelector('#siteHeader .nav-actions a');e?.focus()});
  await page.waitForFunction(()=>window.__chapchitraHeroCarousel.state.running===true,null,{timeout:4000});
  record.checks.keyboardBlurResume=true;
  // Reduced-motion is a separate context: autoplay must be off from first load.
  const rm=await browser.newContext({viewport:{width:t.width,height:t.height},reducedMotion:'reduce'});
  const reduced=await rm.newPage();
  await reduced.goto(root+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await reduced.waitForFunction(()=>!!window.__chapchitraHeroCarousel?.state,null,{timeout:16000});
  const reducedStatus=await reduced.evaluate(()=>({
   running:window.__chapchitraHeroCarousel.state.running,
   active:document.querySelector('#hero .hero-slide.is-active')?.dataset.slide,
   logoNaturalWidth:document.querySelector('#hero .hero-brand-lockup')?.naturalWidth,
   c08Autoplay:window.__chapchitraC08?.hero?.autoplay??0
  }));
  record.checks.reducedMotion=reducedStatus.running===false&&reducedStatus.active==='0'&&reducedStatus.c08Autoplay===0;
  await rm.close();
  assert.deepEqual(record.errors,[],'Unexpected browser errors');
  for(const [name,result] of Object.entries(record.checks))assert.equal(result,true,name+' failed');
  record.pass=true;
 }catch(e){record.pass=false;record.failure=e.stack||String(e)}
 finally{if(context)await context.close();if(browser)await browser.close()}
 results.push(record);
 console.log('CONTROL_PROFILE '+JSON.stringify(record));
}
await writeFile(join(out,'controls-qa.json'),JSON.stringify({
 origin:root,baseline:'84a17011d378a57e2bae4f1e4ab2a19a26bc324c',pass:results.every(r=>r.pass),results
},null,2));
if(results.some(x=>!x.pass))process.exitCode=1;
