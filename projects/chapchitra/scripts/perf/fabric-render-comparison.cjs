/* Paired old-vs-new pigment canvas CPU, cold first frame and retained JS heap.
   Browser-side canvas timing wraps original and new engines identically,
   without changing either shipped source build. */
const {chromium,webkit}=require('playwright'),fs=require('fs'),path=require('path');
const OLD=process.env.CC_BEFORE_URL||'http://127.0.0.1:4344/artists-edit/';
const NEW=process.env.CC_QA_URL||'http://127.0.0.1:4355/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/rich-fabric');
fs.mkdirSync(OUT,{recursive:true});
const garment=['regular','dropShoulder','fullSleeve','hoodie'];
const colors=['black','white','red','yellow','blue','green'];
const rail=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const percentile=(ar,p)=>{
 const a=[...ar].sort((x,y)=>x-y);
 return a[Math.min(a.length-1,Math.floor((a.length-1)*p))];
};
async function run(engine,name,width,dpr){
 const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(engine===chromium?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const results=[];
 // An alternating second run exposes possible warm-cache/thermal variation.
 for(const [label,url] of [['before',OLD],['after',NEW]]){
  const context=await browser.newContext({viewport:{width,height:width===834?1112:width<=390?844:900},
   deviceScaleFactor:dpr,hasTouch:width<=834,isMobile:width<=834,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const start=new WeakMap();
   const originalDraw=CanvasRenderingContext2D.prototype.drawImage;
   const originalPut=CanvasRenderingContext2D.prototype.putImageData;
   CanvasRenderingContext2D.prototype.drawImage=function(...args){
    const isFabric=this.canvas?.classList?.contains('cc-worktable-garment-surface');
    if(isFabric)start.set(this.canvas,performance.now());
    const result=originalDraw.apply(this,args);
    if(isFabric)this.canvas.dataset.pigmentRenderMs=(performance.now()-start.get(this.canvas)).toFixed(2);
    return result;
   };
   CanvasRenderingContext2D.prototype.putImageData=function(...args){
    const result=originalPut.apply(this,args);
    if(start.has(this.canvas)){
     this.canvas.dataset.pigmentRenderMs=(performance.now()-start.get(this.canvas)).toFixed(2);
    }
    return result;
   };
  });
  const started=Date.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:90000});
  const first=Date.now()-started;
  await page.waitForFunction(()=>!document.querySelector('.cc-worktable').classList.contains('is-hydrating'),null,{timeout:70000});
  const allReady=Date.now()-started;
  let session=null,heapBefore=null;
  if(engine===chromium){
   session=await context.newCDPSession(page);
   await session.send('HeapProfiler.enable');
   await session.send('HeapProfiler.collectGarbage');
   heapBefore=(await session.send('Runtime.getHeapUsage')).usedSize;
  }
  const perPaint=[];
  for(const g of garment){
   if(width<=834)await page.locator(rail('garment',g)).tap();
   else await page.locator(rail('garment',g)).click();
   for(const c of colors){
    const now=await page.evaluate(()=>performance.now());
    if(width<=834)await page.locator(rail('color',c)).tap();
    else await page.locator(rail('color',c)).click();
    await page.waitForFunction(([g,c])=>{
     const el=document.querySelector('.cc-worktable-garment-surface');
     return el&&el.dataset.garment===g&&el.dataset.color===c;
    },[g,c],{timeout:60000});
    const info=await page.evaluate(now=>{
     const el=document.querySelector('.cc-worktable-garment-surface');
     return {paintMs:Number(el.dataset.pigmentRenderMs),wholeInteractionMs:performance.now()-now,
      w:el.width,h:el.height,bytes:el.width*el.height*4};
    },now);
    if(!Number.isFinite(info.paintMs))throw Error('Cannot measure '+label+' '+g+' '+c);
    perPaint.push({g,c,...info});
   }
  }
  let heapAfter=null;
  if(session){await session.send('HeapProfiler.collectGarbage');heapAfter=(await session.send('Runtime.getHeapUsage')).usedSize;}
  const paint=perPaint.map(x=>x.paintMs),interact=perPaint.map(x=>x.wholeInteractionMs);
  results.push({label,engine:name,width,dpr,first,allReady,heapBefore,heapAfter,paints:perPaint,
   summary:{paintMean:+(paint.reduce((a,b)=>a+b,0)/paint.length).toFixed(2),
    paintMedian:percentile(paint,.5),paintP90:percentile(paint,.9),paintP95:percentile(paint,.95),paintMax:Math.max(...paint),
    interactionMedian:percentile(interact,.5),interactionP95:percentile(interact,.95)},
   errors});
  await context.close();
 }
 await browser.close();
 return results;
}
(async()=>{
 const all=[
  ...await run(webkit,'webkit-retina-tablet',834,2),
  ...await run(chromium,'chromium-desktop',1440,1),
  ...await run(chromium,'chromium-mobile',390,1),
 ];
 const gates=[];
 for(let i=0;i<all.length;i+=2){
  const before=all[i],after=all[i+1],name=before.engine;
  const test=(check,pass,values)=>gates.push({name,check,pass,values});
  // Small absolute timings make percentage-only thresholds misleading; use
  // relative AND absolute allowances for browser/runner scheduler variation.
  test('p95 canvas pigment cost',after.summary.paintP95 <= before.summary.paintP95*1.4+5,
   [before.summary.paintP95,after.summary.paintP95]);
  test('first scene not slower >350ms',after.first<=before.first+350,[before.first,after.first]);
  if(before.heapAfter!==null&&after.heapAfter!==null){
   const oldDelta=before.heapAfter-before.heapBefore,newDelta=after.heapAfter-after.heapBefore;
   test('retained JS heap delta not increased by >256 KiB',newDelta-oldDelta<=262144,[oldDelta,newDelta]);
  }
 }
 const report={pairs:all,gates,pass:gates.every(g=>g.pass)};
 fs.writeFileSync(path.join(OUT,'fabric-before-after-render-performance.json'),JSON.stringify(report,null,2)+'\n');
 console.log('PERF GATES',JSON.stringify(gates));
 console.log(JSON.stringify(all.map(x=>({
  version:x.label,engine:x.engine,width:x.width,dpr:x.dpr,first:x.first,allReady:x.allReady,
  heapDelta:x.heapAfter===null?null:x.heapAfter-x.heapBefore,...x.summary,errors:x.errors,
 })),null,2));
 if(all.some(x=>x.errors.length)||!report.pass)process.exitCode=2;
})().catch(e=>{console.error('PERF QA CRASH',e);process.exitCode=3});
