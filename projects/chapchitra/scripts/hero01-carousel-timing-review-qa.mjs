/**
 * CHAPCHITRA Hero Carousel — real-time visual timing review.
 * The external timecode exists in a QA wrapper, never the website UI.
 * Native Playwright recording is captured at 1x without editing/cuts.
 */
import {mkdir,writeFile,copyFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const root='http://127.0.0.1:4297';
const appRoot=resolve(import.meta.dirname,'..');
const out=resolve(appRoot,'perf-results/hero01-carousel-timing-review');
const harnessDist=resolve(appRoot,'dist/qa-timing-review');
const targetMs=Number(process.env.CC_TIMING_DURATION_MS||53500);
const selected=process.env.CC_TIMING_PROFILES?.split(',')||['desktop-chromium','ipad-webkit'];
const probe=process.env.CC_TIMING_PROBE==='1';
const profiles=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112}
].filter(x=>selected.includes(x.name));
assert.equal(profiles.length,selected.length,'Invalid profile');
await mkdir(out,{recursive:true});
await mkdir(harnessDist,{recursive:true});
await copyFile(resolve(appRoot,'scripts/hero01-carousel-timing-harness.html'),join(harnessDist,'index.html'));

const summary={
 origin:root,baseline:'84a17011d378a57e2bae4f1e4ab2a19a26bc324c',
 method:'Unedited Playwright context video, 1x, external QA timecode ribbon',
 targetElapsedMs:targetMs,profiles:[]
};
for(const t of profiles){
 let browser,context,page;
 const report={profile:t.name,viewport:{width:t.width,height:t.height},errors:[],badResponses:[]};
 try{
  browser=await t.engine.launch({headless:true,timeout:20000});
  context=await browser.newContext({
   viewport:report.viewport,deviceScaleFactor:1,
   hasTouch:t.name==='ipad-webkit',reducedMotion:'no-preference',
   recordVideo:{dir:out,size:report.viewport}
  });
  page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',response=>{
   if(response.status()>=400)report.badResponses.push(response.status()+' '+response.url());
  });
  await page.goto(root+'/qa-timing-review/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.mouse.move(5,5); // outside the real website's viewport and hover controls
  await page.waitForFunction(()=>window.__qaTape?.ready===true,null,{timeout:25000});
  // Repeatedly observes monotonic time; does not accelerate, seek or skip.
  await page.waitForFunction(ms=>window.__qaTape?.elapsedMs>=ms,targetMs,{
   timeout:targetMs+30000,polling:100
  });
  report.tape=await page.evaluate(()=>structuredClone(window.__qaTape));
  report.finalRibbon=await page.locator('#qa-ribbon').innerText();
  report.elapsedMs=report.tape.elapsedMs;
  report.events=report.tape.events;
  report.c08=report.tape.c08;
  report.durations=report.events.slice(0,-1).map((e,i)=>({
   index:i+1,hero:e.slide,appearance:i<5?'first':'second',
   atMs:e.tMs,nextAtMs:report.events[i+1].tMs,
   measuredMs:+(report.events[i+1].tMs-e.tMs).toFixed(2),
   expectedMs:e.slide===1?8000:4000
  }));
  if(!probe){
   assert.ok(report.elapsedMs>=50000,'Recording must last at least 50s in real time');
   assert.ok(report.events.length>=11,'Two full cycles and subsequent Hero01 return not observed');
   for(let i=0;i<11;i++){
    assert.equal(report.events[i].slide,1+(i%5),'Wrong slide order at '+i);
   }
   for(let i=0;i<10;i++){
    const duration=report.durations[i];
    assert.ok(Math.abs(duration.measuredMs-duration.expectedMs)<450,
     'Unexpected Hero '+duration.hero+' dwell: '+duration.measuredMs+'ms');
   }
   assert.equal(report.c08.autoplay,1,'Initial C08 must autoplay exactly once');
   assert.ok(report.c08.completedAtMs>0&&report.c08.completedAtMs<report.events[1].tMs,
    'C08 must finish before leaving the initial Hero01');
   assert.ok(report.events[10].tMs>47000&&report.events[10].tMs<49500,
    'Two full cycles should end around 48 seconds');
  }
  assert.deepEqual(report.errors,[],'No browser errors');
  assert.deepEqual(report.badResponses,[],'No asset HTTP failures');
  report.pass=true;
 }catch(e){report.pass=false;report.failure=e.stack||String(e)}
 finally{
  if(context){
   const vid=page?.video();
   await context.close();
   if(vid){
    const original=await vid.path();
    report.video=t.name+'-two-cycles-uncut-timecode.webm';
    await rename(original,join(out,report.video));
   }
  }
  if(browser)await browser.close();
  summary.profiles.push(report);
  await writeFile(join(out,'timing-measurements.json'),JSON.stringify(summary,null,2));
  console.log('TIMING_PROFILE '+JSON.stringify({
   profile:t.name,pass:report.pass,elapsedMs:report.elapsedMs,
   events:report.events?.map(e=>({hero:e.slide,atMs:e.tMs})),
   durations:report.durations?.map(x=>({hero:x.hero,ms:x.measuredMs})),
   c08:report.c08,video:report.video,failed:report.failure
  }));
 }
}
console.log('TIMING_SUMMARY '+JSON.stringify({
 pass:summary.profiles.every(p=>p.pass),
 profiles:summary.profiles.map(p=>({name:p.profile,pass:p.pass,elapsed:p.elapsedMs,events:p.events?.length,
  c08:p.c08,failed:p.failure}))
}));
if(summary.profiles.some(p=>!p.pass))process.exitCode=1;
