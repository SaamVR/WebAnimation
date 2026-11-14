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
  await page.waitForFunction(n=>
   document.querySelector('#values [data-c05-icon="'+n+'"]')?.dataset.c05State==='complete',
   icon,{timeout:17000});
 }

 // Four original motions may not have the same duration. Wait for completed/paused/reduced.
 try{await page.waitForFunction(()=>{
  const stages=[...document.querySelectorAll('#values [data-c05-icon]')];
  return stages.length===4&&stages.every(n=>
   ['complete','reduced'].includes(n.dataset.c05State));
 },null,{timeout:17000});}catch{}
 const states=await page.locator('#values').evaluate(root=>root.c05QA?.states||[]);
 const timeline=states.map(({icon,state,error,frame})=>({icon,state,error,frame}));
 await page.screenshot({path:resolve(folder,`c05-${test.label}-final.png`),fullPage:true});
 // Inspect the real native player, not a placeholder or original static icon.
 const instances=await page.locator('#values').evaluate(root=>[...root.querySelectorAll('[data-c05-icon]')]
  .map(s=>({icon:s.dataset.c05Icon,native:!!s.querySelector('.c05-value-player svg'),staticVisible:getComputedStyle(s.querySelector('.c05-value-poster')).visibility!=='hidden'})));
 const record={engine:test.engine,viewport:test.label,states:timeline,errors,responses,instances};
 observations.push(record);
 await ctx.close();await browser.close();
 if(errors.length||responses.length||states.length!==4||states.some(s=>s.error||s.state!=='complete'))
  throw Error(`${test.label} C05 playback did not complete: ${JSON.stringify(record)}`);
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