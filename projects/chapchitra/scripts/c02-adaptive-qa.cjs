// CHAPCHITRA C02 — adaptive cover measured across actual document handoffs.
// Device sizes are browser simulations; they are NOT physical iPad/Safari tests.
const {chromium,webkit}=require('playwright');
const {mkdirSync,writeFileSync,renameSync}=require('node:fs');
const path=require('node:path');
const ORIGIN=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const KIND=process.env.C02_QA_ENGINE||'chromium';
const engine=KIND==='webkit'?webkit:chromium;
const DIR=path.resolve(__dirname,'../docs/c02-adaptive-evidence',KIND);
mkdirSync(DIR,{recursive:true});
const SAMPLES='__c02_adaptive_samples';
const START='__c02_adaptive_started';
const results=[];
const widths=KIND==='webkit'?[['tablet',834,1112],['mobile',390,844]]:
 [['desktop',1280,800],['mobile',390,844]];
const delays=process.env.C02_QA_FAST==='1'?[1000,8000]:[1000,3000,5000,8000];
function check(label,pass,extra={}){
 results.push({engine:KIND,label,status:pass?'pass':'fail',...extra});
 if(!pass)throw Error(label+' '+JSON.stringify(extra).slice(0,850));
}
async function captureInit(context){
 await context.addInitScript(({key,start})=>{
  function take(){
   const o=document.getElementById('c02-loader');
   if(!o)return;
   const p=Number(o.dataset.progress);
   if(!Number.isFinite(p))return;
   try{
    const list=JSON.parse(sessionStorage.getItem(key)||'[]');
    const r=o.querySelector('.c02-loader__roller');
    const rect=r?.getBoundingClientRect();
    const vp=window.visualViewport;
    list.push({t:Date.now(),perf:performance.now(),p,scrollY,
     visualTop:vp?.offsetTop||0,visualHeight:vp?.height||innerHeight,
     state:document.documentElement.dataset.c02State,
     path:location.pathname,inkAsset:o.dataset.inkAsset,
     inkContactX:Number(o.dataset.inkContactX),
     rollerCenterX:rect?(rect.left+rect.width/2):null,
     rollerTransform:r?.style.transform||'',
     rollerSize:parseFloat(r?getComputedStyle(r).width:'0'),
     viewport:vp?.width||innerWidth,
     visible:r?getComputedStyle(r).display==='block':false
    });
    sessionStorage.setItem(key,JSON.stringify(list.slice(-650)));
   }catch{}
  }
  setInterval(take,90);
 },{key:SAMPLES,start:START});
}
async function ready(page,label){
 await page.goto(ORIGIN+'/c02-review/',{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2'&&
  document.documentElement.dataset.c02AssetReady==='true',
  null,{timeout:15000});
 await page.evaluate(({key,start})=>{
  sessionStorage.removeItem(key);sessionStorage.setItem(start,String(Date.now()));
 },{key:SAMPLES,start:START});
}
async function resultFrom(page){
 return page.evaluate(({key,start})=>({
  samples:JSON.parse(sessionStorage.getItem(key)||'[]'),
  startedAt:Number(sessionStorage.getItem(start)||0),
  fullCoverProof:JSON.parse(sessionStorage.getItem('chapchitra-c02-full-coverage-v1')||'null'),
  incomingProgress:Number(document.documentElement.dataset.c02IncomingProgress),
  prepaintProgress:Number(document.documentElement.dataset.c02PrepaintProgress),
  revealStartedAt:Number(document.documentElement.dataset.c02RevealStartAt||0),
  destinationReadyAt:Number(document.documentElement.dataset.c02ReadyAt||0),
  rollerEndAt:Number(document.documentElement.dataset.c02RollerEndAt||0),
  revealEndAt:Number(document.documentElement.dataset.c02RevealEndAt||0),
  demoReadyAt:window.__c02DemoReadyAt||0,
  state:document.documentElement.dataset.c02State,
  overlay:document.querySelectorAll('#c02-loader').length,
  page:location.pathname
 }),{key:SAMPLES,start:START});
}
function evaluateSamples(label,report,durationMs){
 const samples=report.samples.filter(x=>x.visible&&x.p<1);
 check(label+' roller recorded',samples.length>4,{n:samples.length});
 const increasing=samples.reduce((n,s,i)=>n+(i>0&&s.p>samples[i-1].p+0.00005?1:0),0);
 check(label+' movement throughout pending',increasing>=Math.max(4,Math.floor(durationMs/350)),
  {increasing,points:samples.length});
 // Compare actual rendered roller coordinates against the bitmap contact,
 // not obsolete left: CSS coordinates. This catches the owner's post-handoff
 // roller jump even if progress p remains mathematically monotonic.
 const contacts=samples.filter(s=>Number.isFinite(s.inkContactX)&&
  Number.isFinite(s.rollerCenterX));
 check(label+' original quilt never switches renderer',
  samples.every(s=>s.inkAsset==='owner-vector-svg'),{
   distinct:[...new Set(samples.map(s=>s.inkAsset))]});
 const offsets=contacts.map(s=>s.rollerCenterX-s.inkContactX);
 const span=offsets.length?Math.max(...offsets)-Math.min(...offsets):Infinity;
 check(label+' roller keeps physical bitmap contact offset',
  contacts.length>=5&&span<9,{n:contacts.length,offsetSpanPx:span});
 const jumps=[];
 for(let i=1;i<contacts.length;i++){
  const prev=contacts[i-1],next=contacts[i],elapsed=next.t-prev.t;
  if(elapsed>=35&&elapsed<=320&&next.viewport===prev.viewport){
   // Normalize distances to a common 90ms frame-observation window.
   // Document handoffs can omit one or two samples without any visual teleport.
   jumps.push({fractionPer90ms:Math.abs(next.inkContactX-prev.inkContactX)/
    Math.max(1,next.viewport)*90/elapsed,
    elapsedMs:elapsed,from:prev.p,to:next.p,fromPage:prev.path,toPage:next.path});
  }
 }
 const maxJump=jumps.sort((a,b)=>b.fractionPer90ms-a.fractionPer90ms)[0];
 check(label+' no abrupt roller-contact jumps at document handoff',
  !maxJump||maxJump.fractionPer90ms<.24,
  {peak:maxJump,n:jumps.length});
 const monotonic=samples.every((s,i)=>!i||s.p+0.028>=samples[i-1].p);
 check(label+' no discontinuous rollback',monotonic,
  {min:samples.reduce((v,s)=>Math.min(v,s.p),1)});
 const proof=report.fullCoverProof;
 check(label+' commit requires full visual ink coverage',
  proof?.covered===true&&proof.progress===1&&proof.frameFits===true&&
  proof.imageReady===true&&proof.imageSpans===true&&
  proof.whiteSeal===true&&proof.clip==='none'&&
  proof.minPigmentEdgePx>=proof.viewport.width+2&&
  proof.committedAt>=report.startedAt&&
  proof.committedAt<=report.destinationReadyAt,
  {proof,destinationReadyAt:report.destinationReadyAt});
 check(label+' incoming prepaint preserves full cover',
  report.incomingProgress===1&&report.prepaintProgress===1,
  {prepaint:report.prepaintProgress,incoming:report.incomingProgress});
 check(label+' time sequence',report.startedAt>0&&
  report.destinationReadyAt>=report.startedAt &&
  report.rollerEndAt>=report.destinationReadyAt &&
  report.revealEndAt>=report.rollerEndAt&&
  report.revealStartedAt>=report.destinationReadyAt&&
  report.revealEndAt>=report.revealStartedAt,report);
 check(label+' final overlay removed',report.overlay===0&&report.state==='complete');
 return {increasing,points:samples.length};
}
async function demo(page,device,delay){
 const name=KIND+'-'+device+'-'+delay+'ms';
 await ready(page,name);
 const started=Date.now();
 await page.locator('a[href="/c02-review/slow/?delay='+delay+'"]').click({noWaitAfter:true});
 // Record the moving boundary while the OLD page is still alive.
 await page.waitForTimeout(Math.max(160,Math.round(delay*.45)));
 const during=await page.evaluate(()=>({
  url:location.pathname,progress:Number(document.querySelector('#c02-loader')?.dataset.progress),
  phase:document.querySelector('#c02-loader')?.dataset.phase,
  count:document.querySelectorAll('#c02-loader').length
 })).catch(()=>({url:'navigating'}));
 // A fast cached destination can legitimately finish before this sampler
 // runs; timing evidence below remains authoritative, not a single snapshot.
 if(during.count===1)
  check(name+' visible mid-load',during.progress>0&&during.progress<.99,during);
 await page.screenshot({path:path.join(DIR,name+'-mid-loading.png')});
 await page.waitForURL(u=>u.pathname==='/c02-review/slow/',{timeout:28000});
 await page.waitForFunction(()=>window.__c02DemoReady===true,null,{timeout:18000});
 await page.waitForFunction(()=>!document.getElementById('c02-loader'),null,{timeout:18000});
 const report=await resultFrom(page);
 const total=Date.now()-started;
 check(name+' adapts to declared duration',total>=delay*.92 &&
  total<=delay+3500,{total,delay});
 const summary=evaluateSamples(name,report,delay);
 const entry={name,delay,total,...summary,
  startedAt:report.startedAt,destinationReadyAt:report.destinationReadyAt,
  fullCoverProof:report.fullCoverProof,
  incomingProgress:report.incomingProgress,prepaintProgress:report.prepaintProgress,
  revealStartedAt:report.revealStartedAt,
  rollerEndAt:report.rollerEndAt,revealEndAt:report.revealEndAt,
  sampleHighlights:report.samples.filter((_,i)=>i%7===0).slice(0,30)};
 results.push({engine:KIND,label:name+' evidence',status:'pass',...entry});
 console.log('CASE',JSON.stringify(entry));
 await page.screenshot({path:path.join(DIR,name+'-ready.png')});
}
async function navigation(page,device,route,back,from){
 await page.goto(ORIGIN+(from||(back?'/artists-edit/':'/')),{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2'&&
  document.documentElement.dataset.c02AssetReady==='true',
  null,{timeout:16000});
 await page.evaluate(({key,start})=>{
  sessionStorage.removeItem(key);sessionStorage.setItem(start,String(Date.now()));
 },{key:SAMPLES,start:START});
 const src=from||(back?'/artists-edit/':'/');
 await page.evaluate(href=>{
  const link=document.createElement('a');link.href=href;link.textContent='C02 native navigation QA';
  link.id='c02-adaptive-real-link';document.body.append(link);link.click();
 },route);
 await page.waitForURL(u=>u.pathname===route,{timeout:26000});
 await page.waitForFunction(()=>!document.querySelector('#c02-loader'),null,{timeout:22000});
 const report=await resultFrom(page),name=KIND+'-'+device+'-'+src+'->'+route;
 check(name+' destination ready',report.page===route);
 check(name+' real route full-cover commit and incoming first paint',
  report.fullCoverProof?.covered===true&&
  report.fullCoverProof.progress===1&&report.fullCoverProof.whiteSeal===true&&
  report.incomingProgress===1&&report.prepaintProgress===1&&
  report.fullCoverProof.committedAt<=report.destinationReadyAt,
  {source:src,to:route,proof:report.fullCoverProof,
   incoming:report.incomingProgress,prepaint:report.prepaintProgress});
 check(name+' after reveal correct',report.overlay===0&&report.state==='complete');
 check(name+' real load readiness',route!=='/artists-edit/'||
  await page.evaluate(()=>document.body.dataset.worktableStatus==='ready'));
 check(name+' complete timestamps',report.destinationReadyAt>0&&
  report.rollerEndAt>=report.destinationReadyAt &&
  report.revealEndAt>=report.rollerEndAt);
 console.log('REAL',JSON.stringify({name,started:report.startedAt,
  ready:report.destinationReadyAt,rollerEnd:report.rollerEndAt,revealEnd:report.revealEndAt}));
}
async function run(device,width,height){
 const browser=await engine.launch(KIND==='chromium'&&process.platform==='win32'
  ?{headless:true,channel:'chrome'}:{headless:true});
 const context=await browser.newContext({
  viewport:{width,height},hasTouch:device!=='desktop',
  recordVideo:{dir:DIR,size:{width,height}}
 });
 await captureInit(context);
 const page=await context.newPage();
 try{
  for(const delay of delays)await demo(page,device,delay);
  // Fresh page isolates the heavy garment editor from the prior 8s
  // continuous video/sampling sequence (especially memory-limited WebKit).
  await page.close();
  const realPage=await context.newPage();
  try{
   await navigation(realPage,device,'/artists-edit/',false);
   await navigation(realPage,device,'/',true);
   // Preserve real native multipage path coverage with the white underprint:
   // Shop (Gallery White) -> Journal and Journal -> About.
   await navigation(realPage,device,'/journal/',false,'/shop/');
   await navigation(realPage,device,'/about/',false,'/journal/');
   await realPage.emulateMedia({reducedMotion:'reduce'});
   await realPage.goto(ORIGIN+'/c02-review/');
   await realPage.locator('a[href="/shop/"]').click({noWaitAfter:true});
   await realPage.waitForURL(u=>u.pathname==='/shop/',{timeout:16000});
   check(KIND+'-'+device+' reduced motion native',
    await realPage.locator('#c02-loader').count()===0);
  }finally{await realPage.close();}
  // Original page video is retained; real-route journey video is produced
  // independently by Playwright and can be inspected in the same artifact.


 }catch(e){results.push({engine:KIND,device,label:'suite',status:'fail',
  error:String(e?.stack||e).slice(0,2000)});}
 finally{
  await context.close();
  try{
   const video=await page.video()?.path();
   if(video)renameSync(video,path.join(DIR,device+'-adaptive-1-3-5-8-real.webm'));
  }catch(e){console.warn(e.message)}
  await browser.close();
 }
}
(async()=>{
 for(const [device,width,height] of widths)await run(device,width,height);
 writeFileSync(path.join(DIR,'adaptive-results.json'),JSON.stringify(results,null,2));
 const fails=results.filter(x=>x.status==='fail');
 console.log('SUMMARY',JSON.stringify({pass:results.length-fails.length,fail:fails.length,
  failures:fails.map(x=>x.label+':'+x.error)}));
 if(fails.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
