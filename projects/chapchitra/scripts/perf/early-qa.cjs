const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const project=path.resolve(__dirname,'../..');
const url=process.argv[2]||'http://127.0.0.1:4173';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={};
 const context=await browser.newContext({viewport:{width:834,height:1112},deviceScaleFactor:1});
 const page=await context.newPage();
 page.on('pageerror',e=>{report.pageError=e.message});
 await page.route('**/assets/worktable/variants/**',async route=>{
  if(!route.request().url().includes('/preview/')) await new Promise(r=>setTimeout(r,8500));
  try{await route.continue()}catch{}
 });
 await page.goto(url+'/artists-edit/',{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:30000});
 report.ready=!!await page.locator('.cc-worktable.is-hydrating').count();
 await page.locator('.cc-worktable-choice[data-group=garment][data-value=hoodie]').click();
 await page.locator('.cc-worktable-preview[data-garment=hoodie][data-color=white]').waitFor({timeout:45000});
 report.earlySwitch=await page.locator('.cc-worktable-choice[data-group=garment][data-value=hoodie]').getAttribute('aria-pressed');
 await page.locator('.cc-worktable-choice[data-group=color][data-value=red]').click();
 report.earlyColor=await page.locator('.cc-worktable-tint.is-colored').count();
 const art=await sharp({create:{width:16,height:16,channels:4,background:{r:211,g:10,b:15,alpha:1}}}).png().toBuffer();
 await page.locator('#worktableFile').setInputFiles({name:'device-local.png',mimeType:'image/png',buffer:art});
 await page.locator('.cc-worktable-print.has-art').waitFor({timeout:15000});
 report.earlyUpload=await page.locator('.cc-worktable-print.has-art').evaluate(el=>({opacity:getComputedStyle(el).opacity,zIndex:getComputedStyle(el).zIndex}));
 report.earlyFeedback=await page.locator('#worktableMessage').textContent();
 await page.close();await context.close();
 const fault=await browser.newContext({viewport:{width:390,height:844}});
 const f=await fault.newPage();
 await f.route('**/assets/worktable/variants/Worker/Mini_worker_1.pn3*',route=>route.abort('failed'));
 await f.goto(url+'/artists-edit/',{waitUntil:'domcontentloaded',timeout:90000});
 await f.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:30000});
 await f.waitForTimeout(2500);
 await f.locator('.cc-worktable-choice[data-group=garment][data-value=dropShoulder]').click();
 // New atomic compositor must NOT expose a half-assembled shirt if any
 // foreground worker asset fails. Keep the LAST full, safe preview visible.
 await f.waitForFunction(()=>document.querySelector('#worktableMessage')?.textContent?.includes('previous complete garment'),null,{timeout:25000});
 report.faultFallback=await f.locator('.cc-worktable-preview[data-garment=regular]').count();
 report.faultDescription='The complete original garment remains visible instead of a partial frame';
 report.faultStageBusy=await f.locator('.cc-worktable-stage').getAttribute('aria-busy');
 report.faultPageError=report.pageError||null;
 await browser.close();
 const ok=report.ready&&report.earlySwitch==='true'&&report.earlyColor===1&&report.earlyUpload.opacity==='1'&&report.earlyUpload.zIndex==='6'&&report.faultFallback===1&&!report.pageError;
 fs.mkdirSync(path.join(project,'perf-results'),{recursive:true});
 fs.writeFileSync(path.join(project,'perf-results','early-failure-qa.json'),JSON.stringify({...report,ok},null,2)+'\n');
 console.log(JSON.stringify({...report,ok},null,2));if(!ok)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=3});
