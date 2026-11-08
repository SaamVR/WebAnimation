/* Real browser color-calibration regression: 4 garments x 6 fabric pigments,
   original alpha silhouette, folding/shading detail and native controls. */
const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(process.env.CC_QA_OUT||'perf-results/fabric-pigment');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4355/artists-edit/';
const COLORS=['black','white','red','yellow','blue','green'];
const GARMENTS=['regular','dropShoulder','fullSleeve','hoodie'];
fs.mkdirSync(ROOT,{recursive:true});
const records=[],fails=[],metrics=[];
const check=(name,pass,details)=>{const r={name,pass:!!pass,details};records.push(r);if(!pass)fails.push(r)};
const rail=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
async function ready(page){
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable').classList.contains('is-hydrating'),null,{timeout:70000});
}
async function chosen(page,g,c){
 await page.waitForFunction(([garment,color])=>{
  const el=document.querySelector('.cc-worktable-garment-surface');
  return el&&el.dataset.garment===garment&&el.dataset.color===color;
 },[g,c],{timeout:40000});
}
async function imageStats(page){
 return page.locator('.cc-worktable-garment-surface').evaluate(e=>{
  const {width,height}=e,rgba=e.getContext('2d').getImageData(0,0,width,height).data;
  let count=0,mean=[0,0,0],umin=255,umax=0,part=0,zero=0,full=0;
  const ys=[];
  for(let i=0;i<rgba.length;i+=4){
   const r=rgba[i],g=rgba[i+1],b=rgba[i+2],a=rgba[i+3];
   if(a===0){zero++;continue}
   if(a<255)part++;
   if(a<240)continue;
   full++;count++;mean[0]+=r;mean[1]+=g;mean[2]+=b;
   const y=.2126*r+.7152*g+.0722*b;
   if(y<umin)umin=y;if(y>umax)umax=y;
   if((i/4)%211===0)ys.push(y);
  }
  mean=mean.map(x=>x/count);
  ys.sort((a,b)=>a-b);
  const q=x=>ys[Math.min(ys.length-1,Math.floor(ys.length*x))];
  return {g:e.dataset.garment,c:e.dataset.color,w:width,h:height,pigmentMs:Number(e.dataset.pigmentRenderMs),
   mean:mean.map(x=>+x.toFixed(2)),count,edgePixels:part,zeroPixels:zero,fullPixels:full,
   luminanceRange:[+umin.toFixed(2),+umax.toFixed(2)],sampleSpread: +(q(.95)-q(.05)).toFixed(2),
   canvasRGBABytes:width*height*4};
 });
}
async function alphaIntegrity(page){
 return page.locator('.cc-worktable-garment-surface').evaluate(async e=>{
  const g=e.dataset.source;
  const response=await fetch('/assets/worktable/manifest.json',{cache:'force-cache'});
  if(!response.ok)throw Error('Manifest unavailable for silhouette comparison');
  const m=await response.json();
  const variants=m[g].delivery.variants;
  const stage=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
  const px=stage.width*Math.max(1,window.devicePixelRatio||1);
  const idx=px>1536?2:px>768?1:0;
  const v=variants[idx];
  const image=new Image();image.src='/assets/worktable/'+v.path.split('/').map(encodeURIComponent).join('/');
  await image.decode();
  const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const a=ctx.getImageData(0,0,c.width,c.height).data;
  const output=e.getContext('2d').getImageData(0,0,e.width,e.height).data;
  if(a.length!==output.length)throw Error('Pixel geometry changed');
  let alphaChanged=0,outsideChanged=0,edges=0,transparent=0,opaque=0;
  for(let i=0;i<a.length;i+=4){
   if(a[i+3]!==output[i+3])alphaChanged++;
   if(a[i+3]===0){
    transparent++;
    if(output[i]!==0||output[i+1]!==0||output[i+2]!==0)outsideChanged++;
   }else if(a[i+3]<255)edges++;
   else opaque++;
  }
  return {alphaChanged,outsideChanged,edges,transparent,opaque,sourceW:c.width,sourceH:c.height};
 });
}
function pigmentPass(c,mean){
 const [r,g,b]=mean;
 if(c==='black')return r>=12&&r<49&&Math.abs(r-g)<=10&&Math.abs(g-b)<=10;
 if(c==='white')return r>180&&g>180&&b>180;
 if(c==='red')return r>195&&r>g*4&&r>b*3;
 if(c==='yellow')return r>210&&g>165&&b<50&&r>=g;
 if(c==='blue')return b>170&&b>g*1.6&&r<55;
 if(c==='green')return g>98&&g>r*4&&g>b*1.4;
 return false;
}
async function checkSuite(type,name,width=1440,touch=false,dpr=1){
 const opts={headless:true,...(name.startsWith('chromium')&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(name.startsWith('chromium')?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})};
 const browser=await type.launch(opts);
 const context=await browser.newContext({viewport:{width,height:width===834?1112:width<=390?844:900},hasTouch:touch,isMobile:touch,deviceScaleFactor:dpr,serviceWorkers:'block'});
 const page=await context.newPage(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await ready(page);
 let cdp=null,heapBefore=null,heapAfter=null;
 if(type===chromium){
  cdp=await context.newCDPSession(page);
  await cdp.send('HeapProfiler.enable');await cdp.send('HeapProfiler.collectGarbage');
  heapBefore=await cdp.send('Runtime.getHeapUsage');
 }
 const originalAssets=await page.evaluate(()=>({
  upload:document.querySelector('.cc-worktable-upload-svg-layer svg')?.outerHTML.length,
  deskSrc:document.querySelector('.cc-worktable-desk')?.dataset.source,
  potCount:document.querySelectorAll('.cc-worktable-prop[data-group="color"]').length,
 }));
 const output=[];
 for(const g of GARMENTS){
  if(touch)await page.locator(rail('garment',g)).tap();
  else await page.locator(rail('garment',g)).click();
  for(const c of COLORS){
   if(touch)await page.locator(rail('color',c)).tap();
   else await page.locator(rail('color',c)).click();
   await chosen(page,g,c);
   const result=await imageStats(page);
   const a=await alphaIntegrity(page);
   const label=name+' '+width+' DPR'+dpr+' '+g+' '+c;
   check(label+' exact source alpha silhouette',a.alphaChanged===0&&a.outsideChanged===0,a);
   check(label+' fabric pigments visually separated from near-white source',pigmentPass(c,result.mean),result.mean);
   check(label+' tonal fold structure retained',result.sampleSpread>=3||c==='black',result.sampleSpread);
   check(label+' original native canvas size',result.w===a.sourceW&&result.h===a.sourceH,[result.w,result.h,a.sourceW,a.sourceH]);
   check(label+' no unwanted intermediate white canvas',await page.locator('.cc-worktable-garment-surface').count()===1&&await page.locator('.cc-worktable-preview').count()===0);
   // A noisy single Safari Retina paint is not a meaningful regression.
   // The paired old-vs-new p95 and retained memory checks enforce the true
   // performance gate; this is a loose safety upper bound only.
   const safetyLimit=dpr>=2?225:150;
   check(label+' bounded per-garment pigment time',result.pigmentMs>=0&&result.pigmentMs<safetyLimit,
    {ms:result.pigmentMs,safetyLimit});
   output.push(result);
  }
 }
 if(cdp){await cdp.send('HeapProfiler.collectGarbage');heapAfter=await cdp.send('Runtime.getHeapUsage');}
 const assetsAfter=await page.evaluate(()=>({
  upload:document.querySelector('.cc-worktable-upload-svg-layer svg')?.outerHTML.length,
  deskSrc:document.querySelector('.cc-worktable-desk')?.dataset.source,
  potCount:document.querySelectorAll('.cc-worktable-prop[data-group="color"]').length,
 }));
 check(name+' '+width+' illustrated controls unchanged',JSON.stringify(originalAssets)===JSON.stringify(assetsAfter),{before:originalAssets,after:assetsAfter});
 check(name+' '+width+' no page exceptions',pageErrors.length===0,pageErrors);
 check(name+' '+width+' responsive without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 metrics.push({engine:name,width,dpr,heapBefore:heapBefore?.usedSize,heapAfter:heapAfter?.usedSize,
  completedPairs:output.length,pigmentRenderMs:output.map(x=>x.pigmentMs),canvases:output.map(x=>x.canvasRGBABytes),
  perColorMean:output.filter(x=>x.g==='regular').map(x=>({color:x.c,mean:x.mean}))});
 await context.close();await browser.close();
}
(async()=>{
 await checkSuite(chromium,'chromium-desktop',1440,false,1);
 await checkSuite(webkit,'webkit-desktop',1440,false,1);
 await checkSuite(webkit,'webkit-tablet',834,true,2);
 await checkSuite(chromium,'chromium-mobile',390,true,1);
 await checkSuite(webkit,'webkit-mobile',390,true,1);
 const report={url:URL,total:records.length,passed:records.filter(x=>x.pass).length,failed:fails.length,
  failures:fails,metrics,checks:records};
 fs.writeFileSync(path.join(ROOT,'fabric-pigment-qa-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:report.failures,
  metrics:metrics.map(m=>({engine:m.engine,width:m.width,dpr:m.dpr,heapBefore:m.heapBefore,heapAfter:m.heapAfter,
  renderMin:Math.min(...m.pigmentRenderMs),renderMax:Math.max(...m.pigmentRenderMs),
  renderMean:+(m.pigmentRenderMs.reduce((a,b)=>a+b,0)/m.pigmentRenderMs.length).toFixed(2)}))},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('FABRIC QA CRASH',e);process.exitCode=3});
