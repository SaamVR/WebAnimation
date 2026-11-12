/* CHAPCHITRA mobile Artist's Edit: real browser checks on the BUILT app.
 * Optional CC_MOBILE_QA_OVERRIDE_FILES=1 substitutes candidate source into
 * the existing shared Render site for isolated premerge testing.
 * Requires playwright + sharp from the existing project's npm dependencies.
 */
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const root=(process.env.CC_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const output=path.resolve(process.env.CC_QA_OUT||'perf-results/mobile-artist');
fs.mkdirSync(output,{recursive:true});
const tests=[
 [chromium,'chromium320',320,568],[chromium,'chromium360',360,740],
 [chromium,'chromium375',375,667],[chromium,'chromium390',390,844],
 [chromium,'chromium430',430,932],[webkit,'webkit375',375,667],
 [webkit,'webkit390',390,844],[webkit,'ipad834',834,1112],
 [chromium,'desktop1440',1440,900],
];
const groups=['garment','color','size','printSize','upload'];
const report={root,checks:[],errors:[],failedResponses:[],screenshots:[],physicalIPadTested:false};
const verify=(name,okay,extra)=>{report.checks.push({name,passed:!!okay});if(!okay)console.error('FAIL',name,JSON.stringify(extra||null))};
const dimensions=async(el)=>el.evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}});
const save=async(page,name)=>{const filename=name+'.png';await page.locator('.cc-worktable-frame').screenshot({path:path.join(output,filename),animations:'disabled'});report.screenshots.push(filename)};
const img=()=>sharp({create:{width:760,height:920,channels:4,background:{r:31,g:89,b:47,alpha:1}}}).png().toBuffer();
(async()=>{
 for(const [engine,id,width,height] of tests){
  const mobile=width<=600;
  const browser=await engine.launch({headless:true,
   executablePath:engine===chromium?(process.env.CHROMIUM_PATH||undefined):undefined,
   args:engine===chromium?['--no-sandbox']:[]});
  const ctx=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2,reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push({id,error:e.message}));
  page.on('response',res=>{if(res.status()>=400&&res.url().startsWith(root))report.failedResponses.push({id,status:res.status(),url:res.url()})});
  try{
   if(process.env.CC_MOBILE_QA_OVERRIDE_FILES==='1'){
    for(const filename of ['worktable-studio.mjs','worktable-mobile.mjs','worktable-studio.css']){
     await page.route('**/'+filename+'*',route=>route.fulfill({status:200,
      contentType:filename.endsWith('css')?'text/css':'text/javascript',
      body:fs.readFileSync(path.resolve(__dirname,'../../src',filename),'utf8')}));
    }
   }
   await page.goto(root+'/artists-edit/',{waitUntil:'load',timeout:60000});
   await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:70000});
   await page.locator('.cc-worktable-garment-surface[data-side="front"]').waitFor({state:'visible',timeout:60000});
   const frame=page.locator('.cc-worktable-frame'),stage=page.locator('.cc-worktable-stage');
   const fr=await dimensions(frame),sr=await dimensions(stage);
   verify(id+' no horizontal document overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
   verify(id+' frame aspect',Math.abs(fr.w/fr.h-(mobile?9/16:16/9))<.012,{frame:fr});
   verify(id+' original shirt rendering',await page.locator('.cc-worktable-garment-surface[data-side="front"]').count()===1);
   if(!mobile){
    verify(id+' desktop/iPad mobile navigation hidden',!(await page.locator('.cc-mobile-category-nav').isVisible()));
    verify(id+' stage untransformed',Math.abs(sr.w-fr.w)<1);
    continue;
   }
   verify(id+' exactly five category buttons',await page.locator('.cc-mobile-category-button').count()===5);
   const nav=page.locator('.cc-mobile-category-nav'),nb=await dimensions(nav);
   verify(id+' nav within viewport',nb.x>=-2&&nb.right<=width+2&&nb.bottom<=height+1,{nav:nb});
   for(const btn of await page.locator('.cc-mobile-category-button').all()){
    const r=await dimensions(btn);verify(id+' nav button 44px target',r.w>=44&&r.h>=44,{r});
   }
   const price=await page.locator('.cc-worktable-price-tag-mobile .cc-worktable-tag-total').textContent();
   verify(id+' price remains on original tag',price?.includes('৳'));
   if(id==='chromium390')await save(page,'mobile-portrait-base');
   for(const group of groups){
    const button=page.locator('.cc-mobile-category-button[data-mobile-group="'+group+'"]');
    await button.click();
    const pop=page.locator('.cc-mobile-popup');
    await pop.waitFor({state:'visible'});
    const pb=await dimensions(pop);
    verify(id+' '+group+' horizontally centered',Math.abs(pb.x+pb.w/2-width/2)<3,{popup:pb});
    verify(id+' '+group+' one expanded nav button',await page.locator('.cc-mobile-category-button[aria-expanded="true"]').count()===1);
    const choices=await pop.locator('.cc-mobile-popup-option').all();
    verify(id+' '+group+' has actions',choices.length>=1);
    for(const item of choices){
     const b=await dimensions(item);verify(id+' '+group+' 44px option target',b.w>=44&&b.h>=44);
    }
    if(id==='chromium390')await save(page,'mobile-popup-'+group);
    await page.keyboard.press('Escape');
    verify(id+' '+group+' Escape dismissal',await pop.isHidden());
   }
   // Real existing reducer and garment painting: no mobile duplicate state.
   await page.locator('[data-mobile-group="garment"]').click();
   await page.locator('.cc-mobile-popup-option[data-group="garment"][data-value="dropShoulder"]').click();
   await page.locator('.cc-worktable-garment-surface[data-garment="dropShoulder"]').waitFor({state:'visible',timeout:35000});
   verify(id+' garment event uses existing renderer',await page.locator('#worktablePriceGarmentLabel').textContent()==='Drop Shoulder');
   await page.keyboard.press('Escape');
   await page.locator('[data-mobile-group="color"]').click();
   await page.locator('.cc-mobile-popup-option[data-group="color"][data-value="yellow"]').click();
   await page.locator('.cc-worktable-garment-surface[data-color="yellow"]').waitFor({state:'visible',timeout:35000});
   verify(id+' pigment rendered via original canvas',await page.locator('.cc-worktable-garment-surface[data-color="yellow"]').count()===1);
   await page.keyboard.press('Escape');
   await page.locator('[data-mobile-group="size"]').click();
   await page.locator('.cc-mobile-popup-option[data-group="size"][data-value="L"]').click();
   verify(id+' size event uses existing reducer',await page.locator('.cc-worktable-choice[data-group="size"][data-value="L"]').getAttribute('aria-pressed')==='true');
   await page.keyboard.press('Escape');
   await page.locator('[data-mobile-group="printSize"]').click();
   await page.locator('.cc-mobile-popup-option[data-group="printSize"][data-value="A3"]').click();
   await page.locator('.cc-mobile-popup-option[data-group="printSize"][data-value="A4"]').click();
   verify(id+' existing A4 guide retains preset',await page.locator('.cc-worktable-paper-guide').getAttribute('data-preset')==='A4');
   await page.keyboard.press('Escape');
   await page.locator('[data-mobile-group="upload"]').click();
   verify(id+' original artwork controls moved into popup',await page.locator('.cc-mobile-popup #worktableUploadArt').count()===1);
   await page.locator('#worktableFile').setInputFiles({name:'mobile-qa.png',mimeType:'image/png',buffer:await img()});
   await page.locator('.cc-worktable-print.has-art').waitFor({state:'visible',timeout:20000});
   await page.keyboard.press('Escape');
   const before=await page.locator('.cc-worktable-print-frame').evaluate(el=>({left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height}));
   const beforeSize=await dimensions(stage);
   await page.locator('.cc-worktable-drag').click({force:true});
   verify(id+' automatic artwork zoom',await page.locator('.cc-worktable.cc-mobile-editing').count()===1);
   await page.waitForTimeout(450);
   const afterSize=await dimensions(stage);
   verify(id+' uniform presentation zoom',afterSize.w>beforeSize.w*1.5&&Math.abs(afterSize.w/afterSize.h-16/9)<.02);
   const tool=page.locator('.cc-worktable-art-tools'),tb=await dimensions(tool);
   verify(id+' actual transform toolbar visible in viewport',await tool.isVisible()&&tb.x>=-1&&tb.right<=width+1,{tools:tb});
   verify(id+' move resize rotate reuses native tool buttons',await tool.locator('.cc-worktable-tool').count()===3);
   if(id==='chromium390')await save(page,'mobile-artwork-zoom');
   await page.locator('.cc-mobile-zoom-done').click();
   const after=await page.locator('.cc-worktable-print-frame').evaluate(el=>({left:el.style.left,top:el.style.top,width:el.style.width,height:el.style.height}));
   verify(id+' Done preserves print coordinates',JSON.stringify(before)===JSON.stringify(after),{before,after});
   // Browser style recalculation following mobile zoom is asynchronous in
   // WebKit and under CPU contention. Wait for the next computed-visible frame
   // rather than reporting a false regression in an immediate isVisible().
   await page.waitForFunction(()=>{
    const n=document.querySelector('.cc-mobile-category-nav');
    if(!n)return false;
    const style=getComputedStyle(n);
    return style.visibility==='visible'&&style.opacity==='1'&&style.display!=='none';
   },null,{timeout:2500});
   verify(id+' Done restores five-button navigation',await nav.isVisible());
   const button=page.locator('.cc-worktable-view-button');
   await button.click();
   await page.waitForFunction(()=>document.querySelector('.cc-worktable-view-button')?.getAttribute('aria-label')==='View front',null,{timeout:35000});
   await button.click();
   await page.waitForFunction(()=>document.querySelector('.cc-worktable-view-button')?.getAttribute('aria-label')==='View back',null,{timeout:35000});
   verify(id+' front/back retains uploaded front image',await page.locator('.cc-worktable-print.has-art').count()===1);
  }catch(e){report.errors.push({id,error:e.stack||e.message})}
  finally{await browser.close()}
  console.log('DONE',id,'failures',report.checks.filter(v=>!v.passed).length,'errors',report.errors.length);
 }
 report.passed=report.checks.filter(x=>x.passed).length;
 report.failed=report.checks.length-report.passed;
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors,failedResponses:report.failedResponses,screenshots:report.screenshots},null,2));
 if(report.failed||report.errors.length||report.failedResponses.length)process.exitCode=2;
 // The unified staging workflow already executes this script in the same
 // built-site Chromium/WebKit gate. Include direct entry/navigation/history
 // screenshots without editing repo-root governance or animation ownership.
 if(fs.existsSync(path.join(__dirname,'artist-direct-entry-qa.cjs'))){
  const {spawnSync}=require('node:child_process');
  const direct=spawnSync(process.execPath,[path.join(__dirname,'artist-direct-entry-qa.cjs')],{
   cwd:path.resolve(__dirname,'../..'),stdio:'inherit',timeout:12*60*1000,
   env:{...process.env,CC_QA_ROOT:root,
    CC_QA_OUT:path.resolve('perf-results/shared-stage-direct-entry'),
    CC_DIRECT_QA_BEFORE:'0',CC_DIRECT_QA_OVERRIDE_FILES:'0'}
  });
  if(direct.error||direct.status!==0){
   console.error('Artist direct-entry regression failed:',direct.error?.message||direct.status);
   process.exitCode=2;
  }
 }
})().catch(e=>{console.error(e);process.exitCode=3});
