/* C03 offline Playwright QA + real browser-recorded evidence. No hosted preview.
 * C03_QA_ROOT=http://127.0.0.1:4276 C03_QA_OUT=/tmp/... node ...
 */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=(process.env.C03_QA_ROOT||'http://127.0.0.1:4276').replace(/\/$/,'');
const out=path.resolve(process.env.C03_QA_OUT||'perf-results/c03-product-fly-bag');
fs.mkdirSync(out,{recursive:true});
const report={root,checks:[],errors:[],warnings:[],failedResponses:[],screenshots:[],videos:[],metrics:[]};
const check=(name,yes,detail)=>{
 report.checks.push({name,pass:!!yes});
 if(!yes)console.error('FAIL',name,JSON.stringify(detail||{}).slice(0,900));
};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const cases=[
 {id:'desktop-chromium',browser:chromium,width:1440,height:900,video:true},
 {id:'ipad-webkit',browser:webkit,width:834,height:1112,video:false},
 {id:'mobile-chromium',browser:chromium,width:390,height:844,video:true},
 {id:'mobile-webkit',browser:webkit,width:375,height:812,video:false},
 {id:'narrow-chromium',browser:chromium,width:320,height:700,video:false}
];
async function state(page){
 return page.evaluate(()=>{
  const source=document.querySelector('.detail-art .shirt-svg');
  const bag=document.querySelector('.site-header .bag-link');
  const proxy=document.querySelector('.c03-flight-cutout');
  const r=e=>{if(!e)return null;const x=e.getBoundingClientRect();return{left:x.left,top:x.top,right:x.right,bottom:x.bottom,width:x.width,height:x.height}};
  return {
   original:source?.outerHTML||'',source:r(source),bag:r(bag),proxy:r(proxy),
   overlayCount:document.querySelectorAll('[data-c03-flight]').length,
   count:Number(document.querySelector('.bag-count')?.textContent),
   status:document.querySelector('#bagStatus')?.textContent||'',
   url:location.pathname,
   clip:proxy&&getComputedStyle(proxy).overflow,
   layerPointer:document.querySelector('.c03-flight-layer')&&getComputedStyle(document.querySelector('.c03-flight-layer')).pointerEvents,
   bg:proxy?.style.background||getComputedStyle(proxy||document.body).backgroundColor,
   children:proxy?.children.length,
   path:document.querySelector('.c03-flight-path path')?.getAttribute('d')||'',
   scrollY
  };
 });
}
async function snapshot(page,name){
 const file=path.join(out,name+'.png');
 await page.screenshot({path:file,animations:'allow'});
 report.screenshots.push(path.basename(file));
}
// Run one device per invocation on constrained/offline runners as necessary.
const deviceFilter=(process.env.C03_QA_DEVICES||'').split(',').filter(Boolean);
async function normalTest(config){
 const {id,width,height,video}=config;
 const executablePath=config.browser===chromium?(process.env.C03_CHROMIUM_PATH||'/snap/bin/chromium'):undefined;
 const browser=await config.browser.launch({headless:true,timeout:25000,executablePath,args:config.browser===chromium?['--no-sandbox']:[]});
 const context=await browser.newContext({viewport:{width,height},
  isMobile:width<=600,hasTouch:width<=600,deviceScaleFactor:1,
  recordVideo:video?{dir:out,size:{width,height}}:undefined});
 const page=await context.newPage(),err=[],bad=[];
 page.on('pageerror',e=>{
  // The exact WebKit ResizeObserver loop message is a nonfatal browser
  // scheduling warning (no content exception, network error or crash).
  // Preserve it for audit without masking any other pageerror.
  if(e.message==='ResizeObserver loop completed with undelivered notifications.')
   report.warnings.push({id,message:e.message});
  else err.push(e.message);
 });
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(root))bad.push({status:r.status(),url:r.url()})});
 const recording=video?page.video():null;
 try{
  await page.goto(root+'/product/',{waitUntil:'load',timeout:60000});
  const button=page.locator('.detail-add-button[data-add-to-bag]');
  await button.waitFor({state:'visible',timeout:20000});
  // Preload local GSAP before measuring the first reaction.
  await page.waitForFunction(()=>typeof window.gsap?.timeline==='function',{timeout:20000});
  const initial=await state(page);
  check(id+' true PDP starting count',initial.count===0,initial);
  await snapshot(page,id+'-before');
  await button.click();
  await page.locator('[data-c03-flight]').waitFor({state:'attached',timeout:5000});
  await page.waitForTimeout(320);
  const mid=await state(page);
  await snapshot(page,id+'-mid-flight');
  // The reference art stays fixed in document space; T02-style mobile camera
  // reveal may legitimately change its viewport rectangle and scrollY.
  check(id+' source SVG stationary',mid.original===initial.original&&
   Math.abs(mid.source.left-initial.source.left)<2&&
   Math.abs(mid.source.top+mid.scrollY-initial.source.top-initial.scrollY)<2);
  check(id+' one transparent clone',mid.overlayCount===1&&mid.children===1&&
   mid.layerPointer==='none'&&mid.path.includes(' Q '),mid);
  check(id+' count immediately committed exactly once',mid.count===1&&mid.status.includes('added to demo bag'),mid);
  check(id+' target actual header bag',mid.bag?.width>0&&mid.bag?.height>0,mid.bag);
  await page.waitForTimeout(540);
  await snapshot(page,id+'-bag-approach');
  await page.waitForTimeout(300);
  await snapshot(page,id+'-bag-catch');
  // Motion can include the approved T02-style camera reveal and restore.
  // Verify actual cleanup, not a frame sampled before that return finishes.
  await page.locator('[data-c03-flight]').waitFor({state:'detached',timeout:8000});
  const settled=await state(page);
  check(id+' fully cleaned after catch',settled.overlayCount===0&&settled.count===1,settled);

  // A second add interrupts rather than accumulating orphan timelines.
  await button.click();
  await page.waitForTimeout(85);
  await button.click();
  const rapid=await state(page);
  check(id+' double-click exactly +2 bag items',rapid.count===3,rapid);
  check(id+' at most one clone during rapid add',rapid.overlayCount<=1,rapid.overlayCount);
  // An interrupted animation disappears before the replacement is attached.
  // Waiting for "detached" immediately may observe this *temporary gap*,
  // incorrectly failing when the new flight appears one frame later.
  await page.waitForTimeout(640);
  const replacement=await state(page);
  check(id+' replacement flight starts after rapid add',
   replacement.overlayCount===1,{overlayCount:replacement.overlayCount,count:replacement.count});
  await page.locator('[data-c03-flight]').waitFor({state:'detached',timeout:8000});
  await page.waitForTimeout(120);
  const rapidSettled=await state(page);
  check(id+' rapid click cleanup',
   rapidSettled.overlayCount===0&&rapidSettled.count===3,
   {overlayCount:rapidSettled.overlayCount,count:rapidSettled.count});

  // Scroll during flight cancels overlay; mutation is never undone.
  await button.click();
  await page.locator('[data-c03-flight]').waitFor({state:'attached',timeout:6000});
  await page.waitForTimeout(120);
  // iPad/WebKit may already be at the bottom after clicking Add. Choose a
  // reachable opposite direction so a real scroll event is guaranteed.
  const gesture=await page.evaluate(()=>{
   const before=window.scrollY;
   const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
   const target=before>max-100?Math.max(0,before-130):Math.min(max,before+130);
   window.scrollTo({left:0,top:target,behavior:'instant'});
   return {before,target,max};
  });
  await page.waitForTimeout(220);
  const interrupted=await state(page);
  check(id+' scroll produces actual viewport movement',
   Math.abs(interrupted.scrollY-gesture.before)>5,
   {gesture,scrollY:interrupted.scrollY});
  check(id+' scroll cancels safely',interrupted.overlayCount===0&&interrupted.count===4,
   {overlayCount:interrupted.overlayCount,count:interrupted.count,scrollY:interrupted.scrollY,gesture});
  // The scene remains functional after an interrupted sequence.
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await button.click();
  await page.locator('[data-c03-flight]').waitFor({state:'attached',timeout:6000});
  await page.waitForTimeout(100);
  // Safari/WebKit may quantize a 1px test viewport delta and dispatch no
  // native resize event. Require a measurable real resize across engines.
  const beforeResize=await page.evaluate(()=>{
   window.__c03NativeResizeEvents=0;
   window.addEventListener('resize',()=>{window.__c03NativeResizeEvents++});
   return innerWidth;
  });
  const resizedWidth=width>700?width-48:Math.max(300,width-32);
  await page.setViewportSize({width:resizedWidth,height});
  await page.waitForTimeout(260);
  const resized=await state(page);
  const resizedViewport=await page.evaluate(()=>({
   width:innerWidth,events:window.__c03NativeResizeEvents
  }));
  check(id+' real viewport resize observed',
   Math.abs(resizedViewport.width-beforeResize)>=16&&resizedViewport.events>=1,
   {beforeResize,resizedViewport});
  check(id+' resize cancels safely',
   resized.overlayCount===0&&resized.count===5,
   {overlayCount:resized.overlayCount,count:resized.count,beforeResize,resizedViewport});

  // Assert the established 99-per-product limit; no C03 for a rejected add.
  const productId=await button.getAttribute('data-add-to-bag');
  const key=await page.evaluate(()=>Object.keys(sessionStorage).find(k=>k.includes('session-demo-bag')));
  check(id+' existing session-bag key discovered',!!key,{key});
  if(key){
   await page.evaluate(([key,id])=>sessionStorage.setItem(key,JSON.stringify([[id,99]])),[key,productId]);
   await page.goto(root+'/product/',{waitUntil:'load'});
   await page.waitForFunction(()=>window.gsap?.timeline);
   await page.locator('.detail-add-button').click();
   const limit=await state(page);
   check(id+' quantity 99 blocks flight',limit.count===99&&limit.overlayCount===0,limit);
  }
  report.metrics.push({id,geometry:{source:mid.source,bag:mid.bag,proxy:mid.proxy,path:mid.path},
   firstCount:mid.count,rapidCount:rapid.count,scrollCount:interrupted.count});
 }catch(e){report.errors.push({id,error:e.stack||e.message})}
 finally{
  report.errors.push(...err.map(error=>({id,error})));
  report.failedResponses.push(...bad.map(z=>({id,...z})));
  await context.close();
  if(recording){
   try{
    const input=await recording.path(),output=path.join(out,'c03-'+id+'.webm');
    fs.renameSync(input,output);report.videos.push(path.basename(output));
   }catch(e){report.errors.push({id,videoError:e.message})}
  }
  await browser.close();
 }
 console.log('FINISHED',id,'checks',report.checks.length,'errors',report.errors.length);
}
async function reducedMotion(){
 const browser=await chromium.launch({headless:true,timeout:25000,executablePath:process.env.C03_CHROMIUM_PATH||'/snap/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 try{
  await page.goto(root+'/product/',{waitUntil:'load',timeout:60000});
  await page.locator('.detail-add-button').click();
  const s=await state(page);
  check('reduced motion commits count but creates no clone',s.count===1&&s.overlayCount===0,s);
  check('reduced motion status announced',s.status.includes('added to demo bag'),s.status);
 }catch(e){report.errors.push({id:'reduced',error:e.message})}
 await context.close();await browser.close();
}
(async()=>{
 for(const config of cases.filter(x=>!deviceFilter.length||deviceFilter.includes(x.id)))await normalTest(config);
 if(!deviceFilter.length||deviceFilter.includes('reduced-motion'))await reducedMotion();
 report.passed=report.checks.filter(x=>x.pass).length;
 report.failed=report.checks.length-report.passed;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('C03_QA_SUMMARY',JSON.stringify({
  passed:report.passed,failed:report.failed,errors:report.errors,
  failedResponses:report.failedResponses,warnings:report.warnings,screenshots:report.screenshots,videos:report.videos
 },null,2));
 if(report.failed||report.errors.length||report.failedResponses.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
