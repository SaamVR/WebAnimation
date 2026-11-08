const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const OUTPUT=path.resolve(__dirname,'../docs/c08-evidence/c08-performance.json');
const urls={baseline:'http://127.0.0.1:19290/',c08:'http://127.0.0.1:19289/'};
(async()=>{
const results={
 method:'Single local Chromium run each, 430×900, simulated 4Mbps/70ms RTT/4× CPU, uncompressed Python HTTP server. Exploratory, not statistical, not a physical iPad or Render CDN benchmark.',
 measurements:{}
};
const b=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
try{
for(const [name,url] of Object.entries(urls)){
 const ctx=await b.newContext({viewport:{width:430,height:900},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{
  window.__c08FCP=0;
  try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.name==='first-contentful-paint')window.__c08FCP=e.startTime}).observe({type:'paint',buffered:true})}catch{}
 });
 const p=await ctx.newPage();
 const dev=await ctx.newCDPSession(p);
 await dev.send('Network.enable');
 await dev.send('Network.emulateNetworkConditions',{offline:false,latency:70,downloadThroughput:500000,uploadThroughput:250000});
 await dev.send('Emulation.setCPUThrottlingRate',{rate:4});
 const begin=Date.now();
 await p.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 const domWallMs=Date.now()-begin;
 await p.waitForTimeout(1600);
 const snapshot=async()=>p.evaluate(()=>{
  const hero=document.querySelector('.hero-brand-lockup');
  const nav=document.querySelector('.logo-word--image img');
  const all=performance.getEntriesByType('resource');
  return {
   fcpMs:window.__c08FCP,
   heroStaticVisible:!!hero?.complete&&hero?.naturalWidth>0,
   navbarStaticVisible:!!nav?.complete&&nav?.naturalWidth>0,
   resourceEntries:all.length,transferBytes:all.reduce((sum,e)=>sum+(e.transferSize||0),0),
   c08Assets:all.filter(e=>e.name.includes('/assets/c08/')||e.name.includes('/motion/c08/')).map(e=>({
    file:e.name.split('/').pop(),bytes:e.transferSize,durationMs:Math.round(e.duration)
   })),
   runtimeScriptCount:[...document.scripts].filter(e=>e.src.includes('/motion/c01/vendor/lottie.min.js')).length
  };
 });
 const early=await snapshot();
 let logoReadyMs=null;
 if(name==='c08'){
  await p.waitForFunction(()=>window.__chapchitraC08?.hero.ready===true,null,{timeout:45000});
  logoReadyMs=Date.now()-begin;
 }
 results.measurements[name]={domWallMs,early,logoReadyMs,after:await snapshot()};
 console.log(name,JSON.stringify(results.measurements[name]));
 await ctx.close();
}
}finally{await b.close()}
await fs.writeFile(OUTPUT,JSON.stringify(results,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=2});
