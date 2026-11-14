/**
 * Offline-only browser QA + full-viewport recordings. Launch local project:
 *   cd projects/chapchitra && node scripts/preview.mjs
 *   C05_LOCAL_URL=http://127.0.0.1:4272 node scripts/capture-c05-values.mjs
 * Must NEVER run against a hosted or production URL without an explicit request.
 */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const url=process.env.C05_LOCAL_URL||'http://127.0.0.1:4272';
const parsed=new URL(url);
if(!['localhost','127.0.0.1','::1'].includes(parsed.hostname))
 throw Error('C05 visual QA refuses remote/hosted URL by policy');
const {chromium,webkit}=await import('playwright');
const folder=resolve(process.env.C05_EVIDENCE_FOLDER||'./c05-local-evidence');
await mkdir(folder,{recursive:true});
const cases=[
 {engine:'chromium',label:'desktop',width:1440,height:900,mobile:false},
 {engine:'webkit',label:'ipad',width:834,height:1112,mobile:false},
 {engine:'chromium',label:'mobile',width:390,height:844,mobile:true}
];
const expected=[
 ['Stories You Can Wear','Wear a story, not just a T-shirt. Art that feels personal, expressive, and unmistakably you.'],
 ['Rooted in Bengal','Inspired by the colours, culture, and everyday creative energy of Bengal.'],
 ['Anything but Ordinary','Original prints with personality, thoughtful details, and a style that refuses to blend in.'],
 ['Onto What You Wear','Find your favourite fit, add your own touch, and make it entirely yours.']
];
const observations=[];
for(const test of cases){
 const launcher=test.engine==='webkit'?webkit:chromium;
 const browser=await launcher.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:test.width,height:test.height},
  deviceScaleFactor:1,isMobile:test.mobile,hasTouch:test.mobile,
  recordVideo:{dir:folder,size:{width:test.width,height:test.height}}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const responses=[];page.on('response',r=>{
  if(r.url().includes('/assets/c05/')&&r.status()>=400)responses.push([r.status(),r.url()]);
 });
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
 const heading=page.locator('#values h2#valuesTitle');
 assert.equal(await heading.textContent(),'More Than a T-Shirt');
 const cards=page.locator('#values .value-card');assert.equal(await cards.count(),4);
 for(let n=0;n<4;n++){
  assert.equal(await cards.nth(n).locator('h3').textContent(),expected[n][0]);
  assert.equal(await cards.nth(n).locator('p').textContent(),expected[n][1]);
 }
 await page.locator('#values').scrollIntoViewIfNeeded();
 await page.screenshot({path:resolve(folder,`c05-${test.label}-entry.png`),fullPage:true});
 // Each mobile card uses a separate viewport trigger. Visit each one in DOM
 // order rather than incorrectly expecting offscreen motions to autoplay.
 for(const icon of ['01','02','03','04']){
  const stage=page.locator('#values [data-c05-icon="'+icon+'"]');
  await stage.scrollIntoViewIfNeeded();
  // Real continuous playback must finish the complete original animation three times.
  await page.waitForFunction(n=>{
   const stage=document.querySelector('#values [data-c05-icon="'+n+'"]');
   return Number(stage?.dataset.c05Cycles||0)>=3;
  },icon,{timeout:33000});
 }

 // Each offscreen card is intentionally paused; requiring its next cycle
 // after scrolling away creates a false timeout on single-column mobile.
 // All four have already completed at least three cycles while in view.
 const states=await page.locator('#values').evaluate(root=>root.c05QA?.states||[]);
 const timeline=states.map(({icon,state,error,frame,cycles})=>({icon,state,error,frame,cycles}));
 await page.screenshot({path:resolve(folder,`c05-${test.label}-final.png`),fullPage:true});
 // Inspect the real native player, not a placeholder or original static icon.
 const runtime=await page.locator('#values').evaluate(root=>({
  instances:[...root.querySelectorAll('[data-c05-icon]')].map(s=>({
   icon:s.dataset.c05Icon,
   native:!!s.querySelector('.c05-value-player svg'),
   staticVisible:getComputedStyle(s.querySelector('.c05-value-poster')).visibility!=='hidden'
  })),
  icon03UsesGSAP:window.C05Complete?.status?.()?.gsap===true,
  icon03ExactDuration:window.C05Complete?.duration===6.43,
  lottieRuntime:typeof window.lottie?.loadAnimation==='function',
  gsapRuntime:typeof window.gsap?.timeline==='function',
  rootQA:!!root.c05QA
 }));
 const instances=runtime.instances;
 // A native timeline must genuinely pause offscreen and resume in view.
 // Compare its playhead, rather than accepting a CSS-only hidden poster.
 const watched=page.locator('#values [data-c05-icon="02"]');
 await watched.scrollIntoViewIfNeeded();
 await page.waitForTimeout(180);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForTimeout(280);
 const paused1=await page.locator('#values').evaluate(r=>r.c05QA?.states.find(s=>s.icon==='02'));
 await page.waitForTimeout(340);
 const paused2=await page.locator('#values').evaluate(r=>r.c05QA?.states.find(s=>s.icon==='02'));
 const offscreenFrozen=paused1?.state==='paused'&&paused2?.state==='paused'&&
  Math.abs(Number(paused2.frame)-Number(paused1.frame))<=.25;
 await watched.scrollIntoViewIfNeeded();
 // A fixed 300ms sleep can misreport WebKit's next resumed RAF as stalled.
 // Require actual playhead advancement within a bounded interval instead.
 let resumedMotion=false;
 try{
  await page.waitForFunction(({frame,cycles})=>{
   const s=document.querySelector('#values')?.c05QA?.states.find(v=>v.icon==='02');
   return s?.state==='playing'&&(s.frame!==frame||s.cycles>cycles);
  },{frame:paused2.frame,cycles:paused2.cycles},{timeout:3500});
  resumedMotion=true;
 }catch{/* The retained final assertion reports a genuinely stalled player. */}
 const resumed=await page.locator('#values').evaluate(r=>r.c05QA?.states.find(s=>s.icon==='02'));
 const record={engine:test.engine,viewport:test.label,states:timeline,errors,responses,instances,runtime,
  visibilityQA:{offscreenFrozen,resumedMotion,paused1,paused2,resumed}};
 observations.push(record);
 await ctx.close();await browser.close();
 if(errors.length||responses.length||states.length!==4||states.some(s=>s.error||s.cycles<3||!['playing','paused'].includes(s.state))||
    !runtime.rootQA||!runtime.lottieRuntime||!runtime.gsapRuntime||
    !runtime.icon03UsesGSAP||!runtime.icon03ExactDuration||
    instances.length!==4||instances.some(s=>!s.native)||!offscreenFrozen||!resumedMotion)
  throw Error(`${test.label} C05 native Lottie / original GSAP playback did not complete: ${JSON.stringify(record)}`);
}
// Additional reduced-motion check: no moving playhead.
const browser=await webkit.launch({headless:true});
const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await reduced.newPage();
await page.goto(url,{waitUntil:'domcontentloaded'});
await page.locator('#values').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const reducedStates=await page.locator('#values').evaluate(root=>root.c05QA?.states||[]);
assert.equal(reducedStates.length,4);
assert.ok(reducedStates.every(s=>s.state==='reduced'));
await page.screenshot({path:resolve(folder,'c05-reduced-webkit.png'),fullPage:true});
observations.push({engine:'webkit',viewport:'mobile-reduced',states:reducedStates});
await reduced.close();await browser.close();
await writeFile(resolve(folder,'c05-browser-qa.json'),JSON.stringify(observations,null,2));
console.log('C05 local full-viewport QA passed; recordings in:',folder);