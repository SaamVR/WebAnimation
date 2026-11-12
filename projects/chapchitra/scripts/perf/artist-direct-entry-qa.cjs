/* Artist's Edit direct-to-worktable entry — browser/layout/history QA.
 * CC_DIRECT_QA_OVERRIDE_FILES=1: inject candidate-only four files into the
 * currently deployed Render baseline for pre-merge visual comparison.
 * CC_DIRECT_QA_BEFORE=1: record baseline geometry/screenshots (no new-layout
 * assertions). Otherwise verify the compiled candidate or live staging.
 */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=(process.env.CC_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const out=path.resolve(process.env.CC_QA_OUT||'perf-results/shared-stage-direct-entry');
const before=process.env.CC_DIRECT_QA_BEFORE==='1';
const overrides=process.env.CC_DIRECT_QA_OVERRIDE_FILES==='1';
fs.mkdirSync(out,{recursive:true});
const report={root,before,overrides,checks:[],metrics:[],errors:[],failedResponses:[],screenshots:[],physicalIPadTested:false};
const verify=(name,condition,detail)=>{
 report.checks.push({name,pass:!!condition});
 if(!condition)console.error('FAIL',name,JSON.stringify(detail||{}));
};
const variants=[
 {id:'desktop',engine:chromium,width:1440,height:900,mobile:false},
 {id:'ipad-webkit',engine:webkit,width:834,height:1112,mobile:true},
 {id:'mobile-webkit',engine:webkit,width:390,height:844,mobile:true},
 {id:'mobile-320',engine:chromium,width:320,height:640,mobile:true},
];
const measure=()=>{const box=s=>{
 const e=document.querySelector(s);if(!e)return null;
 const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
 return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,
  marginTop:cs.marginTop,paddingTop:cs.paddingTop,display:cs.display};
 };
 const frame=box('.cc-worktable-frame');
 const header=box('#siteHeader'),main=box('#main'),mount=box('.cc-worktable-mount');
 const headings=[...document.querySelectorAll('h1')].map(e=>({text:e.textContent.trim(),
   className:e.className,rect:e.getBoundingClientRect().toJSON(),visible:
   getComputedStyle(e).position!=='absolute' && getComputedStyle(e).clipPath!=='inset(50%)'}));
 return {url:location.pathname,header,main,mount,frame,
  stage:box('.cc-worktable-stage'),
  announcement:box('.announcement'),routeHeadCount:document.querySelectorAll('.route-head--artist-edit').length,
  studioHeaderCount:document.querySelectorAll('.cc-worktable-header').length,
  hiddenPlaceholderCount:document.querySelectorAll('.customize-layout').length,
  h1:headings,headerPosition:getComputedStyle(document.getElementById('siteHeader')).position,
  scrollY,overflowX:document.documentElement.scrollWidth-innerWidth};
};
const ready=async page=>{
 await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:100000});
 await page.locator('.cc-worktable-frame').waitFor({state:'visible',timeout:30000});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
};
const geometry=(id,m)=>{
 report.metrics.push({id,metric:m});
 if(before)return;
 verify(id+' no visible artist route heading',m.routeHeadCount===0&&m.studioHeaderCount===0,m);
 verify(id+' exactly one semantic Artist heading',m.h1.length===1&&m.h1[0].text==="Artist's Edit"&&m.h1[0].className==='cc-worktable-sr-only'&&!m.h1[0].visible,m.h1);
 verify(id+' no leftover hidden mount placeholder',m.hiddenPlaceholderCount===0,m);
 verify(id+' worktable starts under navbar',Math.abs(m.frame.top-m.header.bottom)<1.6,{frameTop:m.frame.top,headerBottom:m.header.bottom});
 verify(id+' main starts under navbar',Math.abs(m.main.top-m.header.bottom)<1.6,{main:m.main,header:m.header});
 verify(id+' mount has zero top margin/padding',m.mount.marginTop==='0px'&&m.mount.paddingTop==='0px',m.mount);
 verify(id+' stage retains original aspect',Math.abs(m.stage.width/m.stage.height-16/9)<.02,m.stage);
 verify(id+' frame retains approved aspect',Math.abs(m.frame.width/m.frame.height-(id.startsWith('mobile')?9/16:16/9))<.02,m.frame);
 verify(id+' no horizontal overflow',m.overflowX<=2,m.overflowX);
 verify(id+' Artist navbar remains normal flow',m.headerPosition==='static',m.headerPosition);
};
const navigateToArtist=async(page,kind,id)=>{
 await page.goto(root+'/',{waitUntil:'load',timeout:60000});
 const header=page.locator('#siteHeader');
 await header.waitFor({state:'visible'});
 if(kind==='navbar'){
  const mobile=page.viewportSize().width<=600;
  if(mobile){
   await page.locator('#menuButton').click();
   await page.locator('#mobileNav a[href="/artists-edit/"]').click();
  }else await page.locator('.nav-center a[href="/artists-edit/"]').click();
 }else if(kind==='banner'){
  await page.locator('a.editorial-cta[href="/artists-edit/"]').click();
 }else if(kind==='footer'){
  await page.locator('.site-footer a[href="/artists-edit/"]').click();
 }
 await page.waitForURL(/\/artists-edit\/(?:\?.*)?$/,{timeout:50000});
 await ready(page);
 let m=await page.evaluate(measure);
 geometry(id+' '+kind,m);
 if(!before){
  await page.goBack({waitUntil:'load',timeout:60000});
  verify(id+' '+kind+' Back restores home',new URL(page.url()).pathname==='/',page.url());
  await page.goForward({waitUntil:'load',timeout:60000});
  await ready(page);
  m=await page.evaluate(measure);
  geometry(id+' '+kind+' Forward',m);
 }
};
(async()=>{
 for(const {id,engine,width,height,mobile} of variants){
  const browser=await engine.launch({headless:true,
   executablePath:engine===chromium?(process.env.CHROMIUM_PATH||undefined):undefined,
   args:engine===chromium?['--no-sandbox']:[]});
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,
   hasTouch:mobile,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',err=>report.errors.push({id,error:err.message}));
  page.on('response',res=>{if(res.status()>=400&&res.url().startsWith(root))
   report.failedResponses.push({id,status:res.status(),url:res.url()})});
  try{
   if(overrides){
    for(const filename of ['app.mjs','styles.css','worktable-studio.mjs','worktable-studio.css']){
     const full=path.resolve(__dirname,'../../src',filename);
     await page.route('**/'+filename+'*',route=>route.fulfill({
      status:200,contentType:filename.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8',
      body:fs.readFileSync(full,'utf8')
     }));
    }
   }
   await page.goto(root+'/artists-edit/',{waitUntil:'load',timeout:60000});
   await ready(page);
   const m=await page.evaluate(measure);
   geometry(id+' direct',m);
   const screenshot=(before?'before-':'after-')+id+'.png';
   await page.screenshot({path:path.join(out,screenshot),animations:'disabled'});
   report.screenshots.push(screenshot);
   if(!before){
    await navigateToArtist(page,'navbar',id);
    await navigateToArtist(page,'banner',id);
    await navigateToArtist(page,'footer',id);
    if(width<=600){
     const nav=page.locator('.cc-mobile-category-button');
     verify(id+' unchanged mobile category buttons',await nav.count()===5);
     await page.locator('.cc-mobile-category-button[data-mobile-group="size"]').click();
     verify(id+' existing size popup still works',await page.locator('.cc-mobile-popup:not([hidden])').isVisible());
    }
   }
  }catch(e){report.errors.push({id,error:e.stack||e.message})}
  finally{await browser.close()}
  console.log('DONE',id,'checks',report.checks.length,'errors',report.errors.length);
 }
 report.passed=report.checks.filter(x=>x.pass).length;
 report.failed=report.checks.length-report.passed;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors,
  failedResponses:report.failedResponses,shots:report.screenshots},null,2));
 if(report.failed||report.errors.length||report.failedResponses.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
