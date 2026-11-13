const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const origin=process.env.CC_QA_ROOT||'http://127.0.0.1:4483';
const out=path.resolve(process.env.CC_QA_OUT||'perf-results/artist-navbar-static-qa');
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],responses=[];
const check=(label,passed,details={})=>{
 const result={label,passed:!!passed,...details};checks.push(result);
 if(!passed)console.error('FAILED',label,JSON.stringify(details));
};
async function measure(page){
 return page.evaluate(()=>{
  const header=document.querySelector('#app > .site-header');
  const main=document.querySelector('#app > #main');
  const announcement=document.querySelector('#app > .announcement');
  const h=header.getBoundingClientRect(),m=main.getBoundingClientRect(),a=announcement.getBoundingClientRect();
  const element=document.elementFromPoint(innerWidth/2,3);
  return {route:document.body.dataset.page,scrollY:scrollY,headerTop:h.top,
   headerBottom:h.bottom,headerHeight:h.height,mainTop:m.top,
   announcementTop:a.top,announcementBottom:a.bottom,
   headerPosition:getComputedStyle(header).position,
   topmostIsHeader:!!element?.closest('#siteHeader'),
   headerInlineStyle:header.getAttribute('style'),
   bodyScrollHeight:document.documentElement.scrollHeight,
   visualViewportOffset:window.visualViewport?.offsetTop??0};
 });
}
async function run(browser,engine,width,height){
 const context=await browser.newContext({
  viewport:{width,height},hasTouch:engine.includes('webkit')||engine.includes('mobile'),
  isMobile:engine.includes('mobile'),
  recordVideo:engine==='webkit-ipad'?{dir:out,size:{width,height}}:undefined,
  reducedMotion:'reduce'
 });
 for(const route of ['artists-edit','home','shop','journal','about']){
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({engine,route,message:e.message}));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))responses.push({engine,route,status:r.status(),url:r.url()})});
  const url=route==='home'?'/':route==='artists-edit'?'/artists-edit/':'/'+(route==='about'?'about':route)+'/';
  await page.goto(origin+url,{waitUntil:'load',timeout:60000});
  await page.locator('#siteHeader').waitFor({timeout:30000});
  if(route==='artists-edit') await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
  const initial=await measure(page);
  check(engine+' '+route+' page identity',initial.route===route,{got:initial.route});
  check(engine+' '+route+' navbar in normal header flow initially',
   Math.abs(initial.mainTop-initial.headerBottom)<2 && initial.headerHeight>40,{initial});
  check(engine+' '+route+' retains initial nav height and announcement flow',
   initial.announcementBottom<=initial.headerTop+2 && initial.headerTop>=0,{initial});
  const expected=route==='artists-edit'?'static':'sticky';
  check(engine+' '+route+' computed position is '+expected,initial.headerPosition===expected,{got:initial.headerPosition});
  if(route==='artists-edit'){
   await page.screenshot({path:path.join(out,engine+'-artist-top.png')});
   const max=await page.evaluate(()=>Math.max(0,document.documentElement.scrollHeight-innerHeight));
   check(engine+' artist page tall enough for scroll test',max>450,{max});
   await page.evaluate(()=>scrollTo({top:Math.min(650,document.documentElement.scrollHeight-innerHeight),behavior:'instant'}));
   await page.waitForTimeout(130);
   let scrolled=await measure(page);
   check(engine+' artist header physically scrolls out',
    scrolled.scrollY>initial.headerTop+initial.headerHeight+20 && scrolled.headerBottom<-20 && !scrolled.topmostIsHeader,{scrolled});
   check(engine+' artist static header follows scroll without compensation',
    Math.abs(scrolled.headerTop-(initial.headerTop-scrolled.scrollY))<2,{initialHeaderTop:initial.headerTop,scrolled});
   await page.screenshot({path:path.join(out,engine+'-artist-scrolled.png')});
   await page.evaluate(()=>scrollTo({top:Math.min(1500,document.documentElement.scrollHeight-innerHeight),behavior:'instant'}));
   await page.waitForTimeout(160);
   const deep=await measure(page);
   check(engine+' artist remains nonsticky after deep scroll',
    deep.scrollY>scrolled.scrollY && deep.headerBottom < -initial.headerHeight,{deep});
   await page.evaluate(()=>scrollTo({top:180,behavior:'instant'}));
   await page.waitForTimeout(120);
   const reverse=await measure(page);
   check(engine+' artist header remains in normal flow during reverse scroll',
    Math.abs(reverse.headerTop-(initial.headerTop-reverse.scrollY))<2,{reverse});
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   await page.waitForTimeout(160);
   const returned=await measure(page);
   check(engine+' artist navbar returns only at page top',
    returned.scrollY===0 && Math.abs(returned.headerTop-initial.headerTop)<2 &&
    Math.abs(returned.mainTop-returned.headerBottom)<2,{returned});
   await page.screenshot({path:path.join(out,engine+'-artist-returned.png')});
   if(engine==='webkit-ipad'){
    await page.evaluate(()=>scrollTo({top:850,behavior:'instant'}));
    await page.waitForTimeout(500);
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.waitForTimeout(500);
   }
  }else{
   await page.evaluate(()=>scrollTo({top:Math.min(350,Math.max(0,document.documentElement.scrollHeight-innerHeight)),behavior:'instant'}));
   await page.waitForTimeout(120);
   const scrolled=await measure(page);
   if(scrolled.scrollY>initial.headerTop+8)check(engine+' '+route+' still sticks at top',Math.abs(scrolled.headerTop)<2,{scrolled});
  }
  await page.close();
  if(engine==='webkit-ipad'&&route==='artists-edit'){
   // The video is finalized as the page closes.
   const video=page.video();
   if(video){
    const videoPath=await video.path();
    const target=path.join(out,'webkit-ipad-artist-navbar-scroll.webm');
    if(videoPath!==target)fs.copyFileSync(videoPath,target);
   }
  }
 }
 await context.close();
}
(async()=>{
 const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const wk=await webkit.launch({headless:true});
 try{
  await run(chrome,'chromium-desktop',1440,900);
  await run(wk,'webkit-ipad',834,1112);
  await run(chrome,'chromium-mobile',390,844);
 }finally{await chrome.close();await wk.close()}
 const result={origin,source:'Desktop Chromium and WebKit iPad emulation; NOT a physical iPad',
  checks,passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,
  errors,responses,physicalIPadStatus:'UNVERIFIED'};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,errors,responses,failures:checks.filter(x=>!x.passed)},null,2));
 if(result.failed||errors.length||responses.length)process.exitCode=2;
 // Once the portrait Artist's Edit feature is present, the same existing
 // Chromium/WebKit staging runner must verify its actual compiled bundle.
 // The project-local script retains screenshots under shared-stage-mobile,
 // which the already configured shared CI artifact uploader collects.
 const mobileQA=path.join(__dirname,'mobile-artist-qa.cjs');
 if(fs.existsSync(mobileQA)){
  const {spawnSync}=require('node:child_process');
  const outMobile=path.resolve('perf-results/shared-stage-mobile');
  const child=spawnSync(process.execPath,[mobileQA],{
   cwd:path.resolve(__dirname,'../..'),
   env:{...process.env,CC_QA_ROOT:origin,CC_QA_OUT:outMobile,
    CC_MOBILE_QA_OVERRIDE_FILES:'0'},
   encoding:'utf8',stdio:'inherit',timeout:9*60*1000,
  });
  if(child.error||child.status!==0){
   console.error('Portrait Artist mobile QA failed',child.error?.message||child.status);
   process.exitCode=2;
  }
 }
 // C03 Product Fly-to-Bag: run the dedicated, fully local Chromium/WebKit
 // animation-matrix QA on the same installed CI Playwright runner. This is
 // conditional on the authorized C03 feature existing in the compiled site.
 // It neither calls a hosted URL nor modifies any existing app test logic.
 const c03QA=path.join(__dirname,'c03-browser-qa.cjs');
 if(fs.existsSync(c03QA)){
  const {spawnSync}=require('node:child_process');
  const child=spawnSync(process.execPath,[c03QA],{
   cwd:path.resolve(__dirname,'../..'),
   env:{...process.env,C03_QA_ROOT:origin,
    C03_QA_OUT:path.resolve('perf-results/shared-stage-c03'),
    C03_CHROMIUM_PATH:chromium.executablePath()},
   encoding:'utf8',stdio:'inherit',timeout:12*60*1000,
  });
  if(child.error||child.status!==0){
   console.error('C03 dedicated GSAP flight QA failed',child.error?.message||child.status);
   process.exitCode=2;
  }
 }
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});