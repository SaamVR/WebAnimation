const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const project=path.resolve(__dirname,'../..');
(async()=>{
 const url=process.argv[2]||'https://chapchitra-webanimation.onrender.com/artists-edit/';
 const name=process.argv[3]||'baseline';
 const mbps=Number(process.argv[4]||10);
 const width=Number(process.argv[5]||1440);
 const out=path.join(project,'perf-results',name);
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,serviceWorkers:'block'});
 const page=await context.newPage();const cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 if(mbps>0)await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:70,downloadThroughput:mbps*125000,uploadThroughput:mbps*125000});
 await cdp.send('Performance.enable');
 const reqs=new Map();const errors=[];
 cdp.on('Network.requestWillBeSent',v=>reqs.set(v.requestId,{url:v.request.url,start:v.timestamp,bytes:0}));
 cdp.on('Network.loadingFinished',v=>{const a=reqs.get(v.requestId);if(a){a.bytes=v.encodedDataLength;a.done=v.timestamp}});
 cdp.on('Network.loadingFailed',v=>errors.push({id:v.requestId,error:v.errorText}));
 page.on('pageerror',e=>errors.push({pageerror:String(e)}));
 const t=Date.now();
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 let tShell=null,tReady=null,ctrlReady=null;
 try{
 await page.locator('.cc-worktable-stage').waitFor({timeout:120000});
 tShell=Date.now()-t;
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:120000});
 tReady=Date.now()-t;
 ctrlReady=await page.locator('.cc-worktable-choice').count();
 const firstReq=[...reqs.values()].filter(x=>x.bytes>0);
 globalThis.firstTransfer={bytes:firstReq.reduce((a,x)=>a+x.bytes,0),requests:firstReq.length};
 }catch(e){errors.push({wait:String(e).slice(0,180)})}
 let tHydrate=null;try{await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),{timeout:60000});tHydrate=Date.now()-t;}catch(e){errors.push({hydrate:String(e).slice(0,120)})}
 await page.waitForTimeout(200);
 const all=[...reqs.values()];const imgs=all.filter(a=>/worktable.*\.(png|webp|avif)/.test(a.url));
 const metrics=await cdp.send('Performance.getMetrics');
 const state=await page.evaluate(()=>({stage:!!document.querySelector('.cc-worktable-stage'),images:document.querySelectorAll('.cc-worktable-layer').length,decoded:[...document.querySelectorAll('.cc-worktable-layer')].filter(a=>a.complete&&a.naturalWidth).length,mem:performance.memory?.usedJSHeapSize||null,firstPaint:performance.getEntriesByType('paint').map(x=>[x.name,x.startTime]),dom:document.getElementsByTagName('*').length,scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 const result={name,url,mbps,width,tShell,tReady,tHydrate,firstTransfer:globalThis.firstTransfer||null,ctrlReady,requests:all.length,imgRequests:imgs.length,encodedBytes:all.reduce((a,x)=>a+x.bytes,0),imageEncodedBytes:imgs.reduce((a,x)=>a+x.bytes,0),metrics:Object.fromEntries(metrics.metrics.filter(x=>/JSHeap|Nodes|Layout|Script|Task|Recalc|Documents/.test(x.name)).map(x=>[x.name,x.value])),state,errors,topImages:imgs.sort((a,b)=>b.bytes-a.bytes).slice(0,8)};
 fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({...result,topImages:result.topImages.map(x=>({name:x.url.split('/').pop(),bytes:x.bytes}))},null,2));
 if(tReady!==null && width>=834 && process.argv[6]!=='noscreenshot'){
  try{
   const stage=page.locator('.cc-worktable-stage');
   await stage.screenshot({path:out+'/regular.png',timeout:25000,animations:'disabled'});
   for(const [n,k] of [['dropShoulder','Drop Shoulder'],['fullSleeve','Full Sleeve'],['hoodie','Hoodie']]){
    await page.getByRole('button',{name:k,exact:true}).last().click();
    await page.waitForTimeout(600);
    await stage.screenshot({path:out+'/'+n+'.png',timeout:25000,animations:'disabled'});
   }
  }catch(e){console.log('SCREENSHOT ISSUE',String(e).slice(0,500))}
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
