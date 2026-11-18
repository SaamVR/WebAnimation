/**
 * CHAPCHITRA Hero 01 — isolated scroll-linked V retraction QA.
 * Always localhost. Screenshot five milestones each direction and retain
 * continuous full-size browser recordings for desktop Chromium and iPad WebKit.
 */
import {mkdir,rename,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const origin=process.env.CC_HERO01_RETRACT_ROOT||'http://127.0.0.1:4297';
if(!['127.0.0.1','localhost','::1'].includes(new URL(origin).hostname))
 throw Error('Retraction QA must use localhost; no hosted website');
const out=resolve(process.env.CC_HERO01_RETRACT_OUT||'perf-results/hero01-retraction');
await mkdir(out,{recursive:true});
const profiles=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112}
];
const results=[];

async function snap(page){
 return page.evaluate(()=>{
  const paper=document.querySelector('#hero01PaperPanel');
  const header=document.querySelector('#siteHeader');
  const svg=paper.querySelector('.hero01-paper-edge');
  const logo=paper.querySelector('.hero01-full-logo');
  const nav=header.querySelector('.logo-word--image');
  const box=paper.getBoundingClientRect(),h=header.getBoundingClientRect(),lb=logo.getBoundingClientRect();
  return {
   y:scrollY,p:Number(paper.dataset.retractionProgress),paperTop:box.top,paperBottom:box.bottom,
   headerBottom:h.bottom,edgeBehindNavbar:box.bottom-h.bottom,
   transform:getComputedStyle(paper).transform,transition:getComputedStyle(paper).transitionDuration,
   logoGap:lb.top-box.top,logoOpacity:getComputedStyle(logo).opacity,
   navVisible:getComputedStyle(nav).visibility==='visible',
   hero01Mode:header.dataset.hero01Mode,shadow:getComputedStyle(svg).filter,
   pathCount:svg.querySelectorAll('path').length,
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   c08:window.__chapchitraC08?.hero?.completed??0
  };
 });
}
function validate(x,p,phase){
 assert.ok(Math.abs(x.p-p)<.008,phase+' progress expected '+p+' got '+x.p);
 assert.match(x.shadow,/^drop-shadow\(/,phase+': preserve irregular SVG shadow');
 assert.equal(x.pathCount,1,phase+': original single SVG path');
 assert.equal(x.transition,'0s',phase+': no timed animation');
 assert.equal(x.logoOpacity,'1',phase+': identity never fades');
 assert.ok(x.horizontalOverflow<=1,phase+': no horizontal overflow');
 if(p===1){
  assert.equal(x.hero01Mode,'standard',phase+': navbar mode at full retraction');
  assert.equal(x.navVisible,true);
  assert.ok(x.edgeBehindNavbar<=-10,phase+': paper and alpha shadow fully concealed');
 }else{
  assert.equal(x.hero01Mode,'special',phase+': paper logo still sole identity');
  assert.equal(x.navVisible,false);
 }
}
for(const t of profiles){
 const report={profile:t.name,width:t.width,height:t.height,origin,frames:[],errors:[],failedResponses:[]};
 let browser,context,page;
 try{
  browser=await t.engine.launch({headless:true,timeout:20000});
  context=await browser.newContext({
   viewport:{width:t.width,height:t.height},deviceScaleFactor:1,
   hasTouch:t.name.includes('ipad'),recordVideo:{dir:out,size:{width:t.width,height:t.height}},
   reducedMotion:'no-preference'
  });
  page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.failedResponses.push(r.status()+' '+r.url())});
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#hero01PaperPanel .hero-brand-lockup').evaluate(img=>img.decode());
  // Pause only automatic slide switching, not scroll linkage or C08 drawing.
  await page.evaluate(()=>document.querySelector('#hero').dispatchEvent(new MouseEvent('mouseenter')));
  await page.waitForFunction(()=>window.__chapchitraC08?.hero?.completed>=1,null,{timeout:26000});
  const originalPath=await page.locator('#hero01PaperPanel .hero01-paper-cut').getAttribute('d');
  report.originalPathLength=originalPath.length;
  const paperHeight=await page.locator('#hero01PaperPanel').evaluate(p=>p.offsetHeight);
  const distance=paperHeight*.72;
  report.paperHeight=paperHeight;report.scrollDistance=distance;
  const earlier={};
  // Smooth continuous downwards scroll, with exact milestone screenshots.
  for(let i=0;i<=100;i++){
   const targetY=i===100?Math.ceil(distance):Math.round(distance*i/100);
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),targetY);
   await page.waitForTimeout(32);
   if(i%25===0){
    await page.waitForFunction(({y})=>{
     const el=document.querySelector('#hero01PaperPanel');
     const expected=Math.min(1,scrollY/(el.offsetHeight*.72));
     return Math.abs(scrollY-y)<=2&&Math.abs(Number(el.dataset.retractionProgress)-expected)<.003;
    },{y:targetY},{timeout:5000});
    const x=await snap(page);
    validate(x,i/100,t.name+' down '+i+'%');
    if(i>0)assert.ok(x.edgeBehindNavbar<earlier[i-25].edgeBehindNavbar-20,
     'Torn edge must retract continuously with each milestone');
    earlier[i]=x;
    const filename=t.name+'-down-'+String(i).padStart(3,'0')+'.png';
    await page.screenshot({path:resolve(out,filename)});
    report.frames.push({direction:'down',percent:i,filename,...x});
   }
  }
  // Scroll up with no release tween; the same coordinates must retrace identically.
  for(let i=99;i>=0;i--){
   const targetY=Math.round(distance*i/100);
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),targetY);
   await page.waitForTimeout(32);
   if(i%25===0){
    await page.waitForFunction(({y})=>{
     const el=document.querySelector('#hero01PaperPanel');
     const expected=Math.min(1,scrollY/(el.offsetHeight*.72));
     return Math.abs(scrollY-y)<=2&&Math.abs(Number(el.dataset.retractionProgress)-expected)<.003;
    },{y:targetY},{timeout:5000});
    const x=await snap(page);
    validate(x,i/100,t.name+' up '+i+'%');
    const down=earlier[i];
    assert.ok(Math.abs(x.edgeBehindNavbar-down.edgeBehindNavbar)<2,
     t.name+': reverse scroll must retrace edge at '+i+'%');
    assert.ok(Math.abs(x.logoGap-down.logoGap)<2,
     t.name+': logo and paper must stay joined at '+i+'%');
    const filename=t.name+'-up-'+String(i).padStart(3,'0')+'.png';
    await page.screenshot({path:resolve(out,filename)});
    report.frames.push({direction:'up',percent:i,filename,...x});
   }
  }
  assert.equal(await page.locator('#hero01PaperPanel .hero01-paper-cut').getAttribute('d'),originalPath);
  assert.deepEqual(report.errors,[],t.name+' page errors');
  assert.deepEqual(report.failedResponses,[],t.name+' failed network responses');
  report.pass=true;
 }catch(error){report.pass=false;report.error=error.stack||String(error)}
 finally{
  if(context){
   const video=page?.video();
   await context.close();
   if(video){
    try{
     const path=await video.path();
     report.video=t.name+'-continuous-down-up.webm';
     await rename(path,resolve(out,report.video));
    }catch(e){report.videoError=e.message}
   }
  }
  if(browser)await browser.close();
 }
 results.push(report);
 console.log('RETRACTION_PROFILE '+JSON.stringify({
  profile:report.profile,pass:report.pass,error:report.error,frames:report.frames.length,video:report.video
 }));
}
const summary={
 origin,pass:results.every(r=>r.pass),
 profiles:results.map(r=>({
  name:r.profile,pass:r.pass,paperHeight:r.paperHeight,scrollDistance:r.scrollDistance,
  frames:r.frames.length,video:r.video,error:r.error
 })),
 results
};
await writeFile(resolve(out,'retraction-qa.json'),JSON.stringify(summary,null,2));
console.log('RETRACTION_QA_SUMMARY '+JSON.stringify(summary.profiles));
if(!summary.pass)process.exitCode=1;
