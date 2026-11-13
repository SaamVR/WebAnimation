// C02 full-document one-click lifecycle QA, including genuine network timing.
const {chromium,webkit}=require('playwright');
const {mkdirSync,writeFileSync,renameSync}=require('node:fs');
const path=require('node:path');
const ORIGIN=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const KIND=process.env.C02_QA_ENGINE||'chromium';
const engine=KIND==='webkit'?webkit:chromium;
const OUTPUT=path.resolve(__dirname,'../docs/c02-lifecycle-evidence',KIND);
mkdirSync(OUTPUT,{recursive:true});
const results=[];
const TRACE='__c02_lifecycle_qa';
const cases=[
 {name:'fast',destination:'/shop/',minWait:0},
 {name:'1-second',destination:'/c02-review/slow/?delay=1000',minWait:1000},
 {name:'3-second',destination:'/c02-review/slow/?delay=3000',minWait:3000},
 {name:'5-second',destination:'/c02-review/slow/?delay=5000',minWait:5000}
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function outcome(device,test,pass,detail=''){
 results.push({engine:KIND,device,test,pass,detail});
 if(!pass)throw Error(test+': '+detail);
}
async function prepare(ctx){
 await ctx.addInitScript(key=>{
  // init scripts may execute before <html> exists: observe Document itself.
  const store=phase=>{
   if(!phase)return;
   try{
    const items=JSON.parse(sessionStorage.getItem(key)||'[]');
    items.push({phase,path:location.pathname,at:Date.now()});
    sessionStorage.setItem(key,JSON.stringify(items.slice(-50)));
   }catch{}
  };
  const observer=new MutationObserver(records=>{
   for(const record of records)
    if(record.attributeName==='data-c02-state'&&record.target===document.documentElement)
     store(document.documentElement.dataset.c02State);
  });
  observer.observe(document,{attributes:true,subtree:true,
   attributeFilter:['data-c02-state']});
 },TRACE);
}
async function cleanStart(page){
 await page.goto(ORIGIN+'/c02-review/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2',null,{timeout:20000});
 await page.evaluate(key=>sessionStorage.removeItem(key),TRACE);
}
async function checkComplete(page,desired,delay,label,device){
 await page.waitForURL(u=>u.pathname===desired.split('?')[0],{timeout:20000});
 await page.waitForFunction(()=>!document.getElementById('c02-loader')
  &&!document.documentElement.classList.contains('c02-pending'),null,{timeout:20000});
 const info=await page.evaluate(key=>({
  state:document.documentElement.dataset.c02State,
  trace:JSON.parse(sessionStorage.getItem(key)||'[]'),
  active:document.querySelectorAll('#c02-loader').length,
  destination:location.pathname,
  main:document.querySelector('#main')?.children.length,
  ready:window.__c02DemoReady
 }),TRACE);
 const covering=info.trace.filter(s=>s.phase==='covering').length;
 const revealing=info.trace.filter(s=>s.phase==='revealing').length;
 const complete=info.trace.filter(s=>s.phase==='complete').length;
 outcome(device,label+' single covering',covering===1,JSON.stringify(info.trace));
 outcome(device,label+' single automatic reveal',revealing===1&&complete===1,JSON.stringify(info.trace));
 outcome(device,label+' overlay removed',info.active===0&&info.state==='complete');
 if(delay>0)outcome(device,label+' real content ready',info.ready===true);
 return info;
}
async function journey(page,device,spec){
 await cleanStart(page);
 const a=await page.evaluate(href=>{
  const a=document.createElement('a');a.href=href;a.textContent='C02 test';
  a.id='c02-test-link';document.querySelector('#main')?.append(a);
  return a.href;
 },spec.destination);
 const before=Date.now();
 await page.locator('#c02-test-link').click({noWaitAfter:true});
 await checkComplete(page,spec.destination,spec.minWait,spec.name,device);
 outcome(device,spec.name+' elapsed',Date.now()-before>=spec.minWait,
  'elapsed='+String(Date.now()-before));
}
async function run(device,width,height){
 const browser=await engine.launch(KIND==='chromium'&&process.platform==='win32'
  ?{headless:true,channel:'chrome'}:{headless:true});
 const context=await browser.newContext({
  viewport:{width,height},hasTouch:device!=='desktop',
  recordVideo:{dir:OUTPUT,size:{width,height}}
 });
 await prepare(context);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const spec of cases)await journey(page,device,spec);
  // 3-second genuine network delay (document request; never a forced loader timeout).
  await cleanStart(page);
  let navigationDelayed=false,initialRequestSeen=false;
  await page.route(url=>new URL(url).pathname==='/about/',async route=>{
   const request=route.request();
   if(request.isNavigationRequest()){
    navigationDelayed=true;
    await sleep(3000);
   }else initialRequestSeen=true; // Click-time warm fetch.
   await route.continue();
  });
  const t=Date.now();
  await page.locator('a[href="/about/"]').click({noWaitAfter:true});
  await page.waitForFunction(()=>document.querySelector('#c02-loader')?.dataset.phase==='loading',null,{timeout:2400});
  await page.screenshot({path:path.join(OUTPUT,device+'-network-hold.png')});
  await checkComplete(page,'/about/',0,'network-delayed',device);
  outcome(device,'network response delay',navigationDelayed&&Date.now()-t>=3000,
   JSON.stringify({navigationDelayed,initialRequestSeen,elapsed:Date.now()-t}));
  await page.unrouteAll();
  // Rapid clicks: the second activation must not mount a second overlay.
  await cleanStart(page);
  const rapid=await page.evaluate(()=>{
   const link=document.querySelector('a[href="/shop/"]');
   link.click();link.click();
   return {count:document.querySelectorAll('#c02-loader').length,
    state:document.documentElement.dataset.c02State};
  });
  outcome(device,'rapid clicks single overlay',rapid.count===1&&rapid.state==='covering',
   JSON.stringify(rapid));
  await checkComplete(page,'/shop/',0,'double-click',device);
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.waitForURL(u=>u.pathname==='/c02-review/',{timeout:20000});
  outcome(device,'native browser Back',await page.locator('#c02-loader').count()===0);
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:20000});
  outcome(device,'native browser Forward',await page.locator('#c02-loader').count()===0);
  // Reduced-motion navigation is native: no C02 effects.
  await page.emulateMedia({reducedMotion:'reduce'});
  await cleanStart(page);
  await page.locator('a[href="/shop/"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:16000});
  outcome(device,'reduced motion no overlay',await page.locator('#c02-loader').count()===0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Failed application boot must not strand green screen; C02 starts independently.
  await page.route(url=>/\/app\.mjs$/.test(new URL(url).pathname),
   route=>route.abort('failed'));
  await cleanStart(page);
  await page.locator('a[href="/shop/"]').click({noWaitAfter:true});
  await checkComplete(page,'/shop/',0,'failed-app-resource',device);
  await page.unrouteAll();
  // Test failure-only navigation watchdog against a bad destination.
  await cleanStart(page);
  await page.route(url=>new URL(url).pathname==='/about/',route=>route.abort('failed'));
  await page.locator('a[href="/about/"]').click({noWaitAfter:true});
  await sleep(14000); // allow the 13s outgoing failure-only recovery watchdog
  const failedState=await page.evaluate(()=>({
   path:location.pathname,overlay:document.querySelector('#c02-loader')?.dataset.phase,
   pending:document.documentElement.classList.contains('c02-pending')
  })).catch(()=>({path:'browser-error-page',overlay:null,pending:false}));
  outcome(device,'failed network does not strand ink',
   failedState.path==='browser-error-page'||!failedState.overlay,
   JSON.stringify(failedState));
  await page.unrouteAll();
  outcome(device,'no fatal page errors',
   !errors.some(s=>s.includes('CHAPCHITRA V3 initialization')),JSON.stringify(errors));
 }catch(err){
  results.push({engine:KIND,device,test:'suite',pass:false,detail:String(err?.stack||err).slice(0,1600)});
 }finally{
  await context.close();
  try{
   const video=await page.video()?.path();
   if(video)renameSync(video,path.join(OUTPUT,device+'-one-click-lifecycle.webm'));
  }catch(e){console.warn('Video:',e.message)}
  await browser.close();
 }
}
(async()=>{
 const devices=process.env.C02_QA_DEVICE?
  [[process.env.C02_QA_DEVICE,process.env.C02_QA_DEVICE==='mobile'?390:834,
  process.env.C02_QA_DEVICE==='mobile'?844:1112]]:
  KIND==='chromium'?[['desktop',1280,800],['mobile',390,844]]:
  [['tablet',834,1112],['mobile',390,844]];
 for(const entry of devices)await run(...entry);
 writeFileSync(path.join(OUTPUT,'lifecycle-results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 const fail=results.filter(x=>!x.pass);
 console.log('SUMMARY',JSON.stringify({pass:results.length-fail.length,fail:fail.length}));
 if(fail.length)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
