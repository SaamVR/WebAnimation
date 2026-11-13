/* CHAPCHITRA Artist's Edit cold/warm loading: LOCAL CI only.
 * Record numbers without changing layouts, source artwork or release targets.
 * Works on Chromium, WebKit iPad and mobile WebKit emulation, not physical iPad.
 */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=(process.env.CC_ARTIST_LOAD_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const out=path.resolve(process.env.CC_ARTIST_LOAD_OUT||'perf-results/shared-stage-artist-load');
fs.mkdirSync(out,{recursive:true});
const configurations=[
 {id:'desktop-chromium',browser:chromium,width:1440,height:900,mobile:false},
 {id:'ipad-webkit',browser:webkit,width:834,height:1112,mobile:false},
 {id:'mobile-webkit',browser:webkit,width:390,height:844,mobile:true},
];
const samples=[],errors=[];
const number=n=>Number.isFinite(n)?Math.round(n):null;
const median=values=>{const s=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!s.length)return null;return number((s[Math.floor((s.length-1)/2)]+s[Math.floor(s.length/2)])/2)};
async function timedLoad(page,entry,kind,iteration){
 const bad=[],runtimeErrors=[];
 const handlePage=e=>runtimeErrors.push(e.message);
 const handleResponse=r=>{if(r.status()>=400&&r.url().startsWith(root))bad.push({code:r.status(),path:new URL(r.url()).pathname})};
 page.on('pageerror',handlePage);page.on('response',handleResponse);
 let shell=null,firstVisible=null,interactive=null,hydration=null,frame=null;
 try{
  if(kind==='cold')await page.goto(root+'/artists-edit/',{waitUntil:'domcontentloaded',timeout:90000});
  else await page.reload({waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('.cc-worktable-stage').waitFor({state:'attached',timeout:80000});
  shell=await page.evaluate(()=>performance.now());
  await page.locator('.cc-worktable-stage:not([aria-busy])').waitFor({timeout:80000});
  firstVisible=await page.evaluate(()=>performance.now());
  await page.locator(entry.mobile?'.cc-mobile-category-button[data-mobile-group="upload"]':'#worktableUploadArt')
   .waitFor({state:'visible',timeout:20000});
  interactive=await page.evaluate(()=>performance.now());
  try{
   await page.waitForFunction(()=>{
    const surface=document.querySelector('.cc-worktable');
    return !!surface&&!surface.classList.contains('is-hydrating');
   },{timeout:25000});
   hydration=await page.evaluate(()=>performance.now());
  }catch{}
  await page.waitForTimeout(120);
  frame=await page.evaluate(()=>{
   const frame=document.querySelector('.cc-worktable-frame');
   const rect=frame?.getBoundingClientRect();
   const stage=document.querySelector('.cc-worktable-stage');
   const preview=document.querySelector('.cc-worktable-preview');
   const inputs=[...document.querySelectorAll('.cc-worktable-choice')];
   const images=[...document.querySelectorAll('img.cc-worktable-layer')];
   const resources=performance.getEntriesByType('resource');
   const manifest=resources.filter(r=>/\/(?:releases\/[^/]+\/)?manifest\.json/.test(r.name));
   const previewResource=resources.filter(r=>/assembled-regular.*\.webp/.test(r.name));
   const allWorktable=resources.filter(r=>/\/assets\/worktable\//.test(r.name));
   const perf=window.__ccArtistLoadObs||{};
   const nav=performance.getEntriesByType('navigation')[0];
   return {
    viewport:[innerWidth,innerHeight],frameAspect:rect?rect.width/rect.height:null,
    stageAspect:stage?stage.getBoundingClientRect().width/stage.getBoundingClientRect().height:null,
    previewVisible:!!preview&&getComputedStyle(preview).display!=='none',
    previewDecoded:!!preview?.complete&&preview.naturalWidth>0,
    interactiveControls:inputs.length,usableUpload:!document.querySelector('#worktableUploadArt')?.disabled,
    imagesTotal:images.length,imagesDecoded:images.filter(x=>x.complete&&x.naturalWidth>0).length,
    navigationType:nav?.type||null,lcpMs:perf.lcpMs||null,
    firstPaintMs:performance.getEntriesByType('paint').find(x=>x.name==='first-paint')?.startTime||null,
    fcpMs:performance.getEntriesByType('paint').find(x=>x.name==='first-contentful-paint')?.startTime||null,
    longTasks:perf.longTasks||0,longTaskMs:numberOrZero(perf.longTaskMs),
    resourceRequests:resources.length,assetRequests:allWorktable.length,
    totalTransferBytes:resources.reduce((sum,r)=>sum+(r.transferSize||0),0),
    assetTransferBytes:allWorktable.reduce((sum,r)=>sum+(r.transferSize||0),0),
    manifest:manifest.map(r=>({name:new URL(r.name).pathname,duration:numberOrZero(r.duration),transferBytes:r.transferSize||0})),
    previewResource:previewResource.map(r=>({name:new URL(r.name).pathname,duration:numberOrZero(r.duration),transferBytes:r.transferSize||0}))
   };
   function numberOrZero(n){return Math.round(Number(n)||0)}
  });
  const screenshot=entry.id+'-'+kind+'-'+iteration+'.png';
  if(kind==='cold'&&iteration===0){
   await page.screenshot({path:path.join(out,screenshot),animations:'disabled',timeout:20000});
  }
  if(!frame.usableUpload||!frame.imagesTotal||!Number.isFinite(firstVisible))throw Error('Unusable first worktable');
 }catch(err){runtimeErrors.push('MEASURE: '+String(err.message||err))}
 finally{page.off('pageerror',handlePage);page.off('response',handleResponse)}
 const sample={device:entry.id,kind,iteration,shellMs:number(shell),firstVisibleMs:number(firstVisible),
   interactiveMs:number(interactive),hydrationMs:number(hydration),lcpMs:number(frame?.lcpMs),
   fcpMs:number(frame?.fcpMs),...frame,errors:runtimeErrors,failedResponses:bad};
 samples.push(sample);
 console.log('CC_LOAD_SAMPLE '+JSON.stringify({device:sample.device,kind,iteration,shell:sample.shellMs,
   firstVisible:sample.firstVisibleMs,interactive:sample.interactiveMs,hydration:sample.hydrationMs,
   lcp:sample.lcpMs,transfer:sample.totalTransferBytes,imageTransfers:sample.assetTransferBytes,
   imageCount:sample.imagesDecoded,errors:runtimeErrors.length,failedResponses:bad.length}));
 if(runtimeErrors.length||bad.length)errors.push({device:entry.id,kind,iteration,runtimeErrors,bad});
}
async function run(entry){
 const browser=await entry.browser.launch({headless:true,
  executablePath:entry.browser===chromium?process.env.CHROMIUM_PATH||undefined:undefined,
  args:entry.browser===chromium?['--no-sandbox']:[]});
 try{
  for(let i=0;i<2;i++){
   const ctx=await browser.newContext({viewport:{width:entry.width,height:entry.height},
    isMobile:entry.mobile,hasTouch:entry.mobile,deviceScaleFactor:1,
    serviceWorkers:'block',reducedMotion:'reduce'});
   const page=await ctx.newPage();
   await page.addInitScript(()=>{
    const data={lcpMs:null,longTasks:0,longTaskMs:0};window.__ccArtistLoadObs=data;
    try{new PerformanceObserver(list=>{
     const entries=list.getEntries();if(entries.length)data.lcpMs=entries.at(-1).startTime;
    }).observe({type:'largest-contentful-paint',buffered:true})}catch{}
    try{new PerformanceObserver(list=>{
     for(const x of list.getEntries()){data.longTasks++;data.longTaskMs+=x.duration}
    }).observe({type:'longtask',buffered:true})}catch{}
   });
   await timedLoad(page,entry,'cold',i);
   await timedLoad(page,entry,'warm',i);
   await ctx.close();
  }
 }finally{await browser.close()}
}
(async()=>{
 for(const entry of configurations)await run(entry);
 const summary={};
 for(const c of configurations){
  summary[c.id]={};
  for(const kind of ['cold','warm']){
   const these=samples.filter(s=>s.device===c.id&&s.kind===kind);
   summary[c.id][kind]=Object.fromEntries(['shellMs','firstVisibleMs','interactiveMs','hydrationMs','lcpMs','fcpMs','totalTransferBytes','assetTransferBytes','longTaskMs'].map(k=>[k,median(these.map(s=>s[k]))]));
  }
 }
 const report={base:root,source:'two cold and two warm local CI runs per device; WebKit iPad/mobile are emulated, not physical hardware',samples,summary,errors};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('CC_LOAD_SUMMARY '+JSON.stringify(summary));
 console.log('CC_LOAD_ERRORS '+errors.length);
 if(errors.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=3});
