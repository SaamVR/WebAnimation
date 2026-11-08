/* Controlled single-run baseline vs C01 under simulated mobile 4Mbps + 70ms RTT + 4x CPU slowdown. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path');
const OUTPUT=path.join(__dirname,'..','docs','c01-evidence','c01-performance-report.json');
const binary=process.env.C01_CHROMIUM||'/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-linux/headless_shell';
const report={method:'local Python static HTTP, Chromium headless 4x CPU throttle, 4Mbps, 70ms latency, 390x844, single run each; no gzip in local server; non-physical mobile; descriptive only',baseline:{},candidate:{}};
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:binary});
 try{
  for(const [name,url] of [['baseline','http://127.0.0.1:19119/'],['candidate','http://127.0.0.1:19118/']]){
   const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
   await ctx.addInitScript(()=>{
     window.__c01Lcp=0;window.__c01LongTasks=0;
     try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__c01Lcp=entry.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
     try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__c01LongTasks+=entry.duration}).observe({type:'longtask',buffered:true})}catch{}
   });
   const p=await ctx.newPage();
   const cdp=await ctx.newCDPSession(p);
   await cdp.send('Network.enable');
   await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:70,downloadThroughput:500000,uploadThroughput:250000});
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   const start=Date.now();
   await p.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   const domMs=Date.now()-start;
   await p.waitForTimeout(1500);
   let initial=await p.evaluate(()=>({
     lcp:window.__c01Lcp,mainThreadLongTasksMs:window.__c01LongTasks,
     navigation:performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,
     resourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+(r.transferSize||0),0),
     c01Requests:performance.getEntriesByType('resource').filter(r=>/\/assets\/c01\/|\/motion\/c01\//.test(r.name)).length
   }));
   await p.locator('#benefits').scrollIntoViewIfNeeded();
   const sectionStart=Date.now();
   if(name==='candidate')await p.waitForFunction(()=>window.__chapchitraC01?.ready,{timeout:50000});
   else await p.waitForTimeout(500);
   const readyMs=Date.now()-sectionStart;
   const ending=await p.evaluate(()=>({
     transferBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+(r.transferSize||0),0),
     c01Resources:performance.getEntriesByType('resource').filter(r=>/\/assets\/c01\/|\/motion\/c01\//.test(r.name)).map(r=>({url:r.name.split('/').slice(-1)[0],bytes:r.transferSize,duration:r.duration})),
     lcp:window.__c01Lcp,mainThreadLongTasksMs:window.__c01LongTasks
   }));
   report[name]={domMs,initial,sectionReadyMs:readyMs,ending};
   console.log(name,JSON.stringify({domMs,initial,readyMs,transferBytes:ending.transferBytes,c01:ending.c01Resources}));
   await ctx.close();
  }
 }finally{await b.close()}
 await fs.writeFile(OUTPUT,JSON.stringify(report,null,2)+'\n');
 console.log('benchmark saved',OUTPUT);
})().catch(e=>{console.error(e);process.exitCode=1});
