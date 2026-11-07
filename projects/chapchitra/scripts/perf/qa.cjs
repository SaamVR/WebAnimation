const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('node:fs');
const path=require('node:path');
const project=path.resolve(__dirname,'../..');
(async()=>{
 const base=process.argv[2]||'http://127.0.0.1:4174';
 const tag=process.argv[3]||'optimized-qa';
 const folder=path.join(project,'perf-results',tag);
 fs.mkdirSync(folder,{recursive:true});
 const report={target:base,regressions:[],responsive:[],screenshots:[],issues:[],failures:[]};
 const check=(condition,name,extra)=>{report.regressions.push({name,ok:!!condition,extra});if(!condition)report.failures.push(name)};
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',e=>report.issues.push('pageerror: '+e.message));
 await page.goto(base+'/artists-edit/',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:90000});
 const hydrating=await page.evaluate(()=>document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'));
 if(hydrating)await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:90000});
 // Neutralize selected/hotspot outlines only for source-artwork pixel comparisons.
 // Interaction QA still checks aria-pressed, focus, and underlying controls.
 await page.addStyleTag({content:'.cc-worktable-hit::after{border-color:transparent!important;box-shadow:none!important;transform:none!important}.cc-worktable-choice:focus-visible{outline:0!important}'});
 const stage=page.locator('.cc-worktable-stage');
 const cdp=await context.newCDPSession(page);
 await cdp.send('Page.enable');
 const capture=async name=>{
  try{
   // Capture source stage without unrelated site sticky navbar overlapping the
   // offscreen CDP clip. Visibility is QA-only and immediately restored.
   await page.evaluate(()=>{
    const stage=document.querySelector('.cc-worktable-stage');
    window.__qaHidden=[...document.querySelectorAll('body *')]
     .filter(el=>!stage?.contains(el)&&['sticky','fixed'].includes(getComputedStyle(el).position))
     .map(el=>[el,el.style.visibility]);
    for(const [el] of window.__qaHidden)el.style.visibility='hidden';
   });
   const r=await stage.evaluate(el=>{const a=el.getBoundingClientRect();return {x:a.left+scrollX,y:a.top+scrollY,width:a.width,height:a.height}});
   const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{...r,scale:1}});
   fs.writeFileSync(folder+'/'+name+'.png',Buffer.from(result.data,'base64'));
   report.screenshots.push({name,bytes:fs.statSync(folder+'/'+name+'.png').size,region:r});
   await page.evaluate(()=>{for(const [el,v] of window.__qaHidden||[])el.style.visibility=v;window.__qaHidden=[]});
  }catch(e){report.issues.push('screenshot '+name+': '+String(e).slice(0,160))}
 };
 check(await stage.count()===1,'stage rendered');
 check(await page.locator('.cc-worktable-layer').count()>=39,'illustrated layers present');
 check(await page.locator('.cc-worktable-hit').count()===18,'stage hotspot count 18 (plus image only)');
 const garmentPaths=['regular','dropShoulder','fullSleeve','hoodie'];
 const click=async(g,v)=>page.locator('.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]').click({timeout:30000});
 for(const g of garmentPaths){
  await click('garment',g);
  if(hydrating)await page.waitForFunction(v=>document.querySelector('.cc-worktable-garment')?.dataset.source?.includes(({regular:'_1.png',dropShoulder:'_2.png',fullSleeve:'-3.png',hoodie:'-4.png'})[v]),g,{timeout:30000});
  check(await page.locator('.cc-worktable-choice[data-group=garment][data-value="'+g+'"]').getAttribute('aria-pressed')==='true','garment '+g);
  await page.waitForTimeout(200);
  await capture(g);
 }
 for(const v of ['S','M','L','XL','XXL']){await click('size',v);check(await page.locator('.cc-worktable-choice[data-group=size][data-value="'+v+'"]').getAttribute('aria-pressed')==='true','size '+v)}
 for(const v of ['black','white','red','yellow','blue','green']){await click('color',v);check(await page.locator('.cc-worktable-choice[data-group=color][data-value="'+v+'"]').getAttribute('aria-pressed')==='true','color '+v)}
 for(const v of ['A3','A4']){await click('printSize',v);check(await page.locator('.cc-worktable-choice[data-group=printSize][data-value="'+v+'"]').getAttribute('aria-pressed')==='true','paper '+v)}
 const upload=await sharp({create:{width:100,height:100,channels:4,background:{r:140,g:50,b:90,alpha:1}}}).png().toBuffer();
 await page.locator('#worktableFile').setInputFiles({name:'local-proof.png',mimeType:'image/png',buffer:upload});
 await page.waitForFunction(()=>document.querySelector('#worktableRemoveArt')?.disabled===false,{timeout:10000});
 check(await page.locator('.cc-worktable-print.has-art').count()===1,'upload appears locally');
 await page.locator('#worktableArtScale').fill('65');
 check(await page.locator('#worktableScaleOutput').textContent()==='65%','artwork resize');
 await page.locator('#worktableResetArt').click();
 check(await page.locator('#worktableScaleOutput').textContent()==='100%','reset artwork placement');
 await page.locator('.cc-worktable-drag').focus();
 await page.keyboard.press('ArrowRight');
 check(await page.locator('.cc-worktable-drag').count()===1,'keyboard mover');
 await page.locator('#worktableRemoveArt').click();
 check(await page.locator('.cc-worktable-print.has-art').count()===0,'remove artwork');
 await page.locator('.cc-worktable-choice[data-group=color][data-value=red]').focus();
 check(await page.locator('.cc-worktable-choice[data-group=color][data-value=red]').evaluate(el=>el===document.activeElement),'focus available');
 for(const [w,h] of [[1194,834],[834,1194],[390,844],[320,720]]){
  await page.setViewportSize({width:w,height:h});
  await page.waitForTimeout(180);
  const rs=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,stage:getComputedStyle(document.querySelector('.cc-worktable-stage')).width,upload:getComputedStyle(document.getElementById('worktableUploadArt')).minHeight,nav:!!document.querySelector('nav')}));
  report.responsive.push({viewport:[w,h],...rs});
  check(rs.scroll<=rs.width+1,'no overflow '+w);
  check(!!rs.stage,'stage visible '+w);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 const css=await page.locator('.cc-worktable-prop').first().evaluate(el=>getComputedStyle(el).transitionDuration);
 check(css.split(',').every(s=>s.trim()==='0s'),'reduced motion zero transitions',css);
 await page.close();await context.close();
 await browser.close();
 fs.writeFileSync(folder+'/qa-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({target:base,pass:report.regressions.filter(x=>x.ok).length,fail:report.failures.length,failures:report.failures,issues:report.issues,responsive:report.responsive,screenshots:report.screenshots.map(x=>x.name)},null,2));
 process.exitCode=report.failures.length>0?2:0;
})().catch(e=>{console.error(e);process.exitCode=3});
