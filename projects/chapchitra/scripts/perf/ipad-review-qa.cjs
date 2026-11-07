const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const BASE=process.argv[2]||'http://127.0.0.1:4174';
const SHA=process.argv[3]||'6f952188452ca4d872275bedf1e31d5311b6a102';
const DIRECT='/artists-edit/review/'+SHA+'/';
const endpoint=BASE+DIRECT;
const scope=process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}:{};
const outPath=path.resolve(__dirname,'../../perf-results/ipad-cache-qa');
fs.mkdirSync(outPath,{recursive:true});
const report={sourceSHA:SHA,url:endpoint,checks:[],browserEngines:[],errors:[]};
const check=(name,pass,detail)=>{report.checks.push({name,ok:!!pass,detail});if(!pass)report.errors.push(name)};
async function fresh(name,opts={}){
 const browser=await (opts.webkit?webkit:chromium).launch({headless:true,...(!opts.webkit?scope:{}),args:opts.webkit?[]:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:834,height:1112},
 userAgent:opts.webkit?'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1':opts.chromeUA?'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1':undefined,serviceWorkers:'block'});
 const page=await context.newPage();
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 return {browser,context,page,pageErrors};
}
async function nominal(name,opts={}){
 const {browser,page,pageErrors}=await fresh(name,opts);
 const visited=new Set();
 page.on('request',req=>{if(req.url().startsWith(BASE))visited.add(new URL(req.url()).pathname)});
 const response=await page.goto(endpoint,{waitUntil:'domcontentloaded',timeout:70000});
 try{await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:45000})}catch{}
 const stage=await page.locator('.cc-worktable-stage').count();
 const meta=await page.evaluate(()=>({
  build:document.body.dataset.reviewBuild,
  manifest:document.body.dataset.reviewManifest,
  status:document.body.dataset.worktableStatus,
  debug:window.__chapchitraArtistDiagnostic,
  legacyVisible:(()=>{const el=document.querySelector('.customize-layout');return el&&!el.hidden&&getComputedStyle(el).display!=='none'})(),
  imageCount:document.querySelectorAll('.cc-worktable-layer').length,
  overflow:document.documentElement.scrollWidth>innerWidth+1
 }));
 const required=[
  '/releases/'+SHA+'/app.mjs',
  '/releases/'+SHA+'/manifest.json',
  '/releases/'+SHA+'/worktable-studio.mjs',
 ];
 check(name+' document HTTP 200',response?.status()===200,response?.status());
 check(name+' source marker exact',meta.build===SHA,meta.build);
 check(name+' current immutable code/manifest loaded',required.every(p=>visited.has(p)),required.filter(p=>!visited.has(p)));
 check(name+' illustrated worktable mounted',stage===1&&meta.status==='ready',meta);
 check(name+' no legacy configurator',!meta.legacyVisible,meta.legacyVisible);
 check(name+' no overflow',!meta.overflow);
 check(name+' visible release diagnostic',await page.locator('.cc-worktable-version').count()===1,await page.locator('.cc-worktable-version').textContent().catch(()=>null));
 check(name+' no JS exceptions',!pageErrors.length,pageErrors);
 if(stage){await page.screenshot({path:path.join(outPath,name+'.png'),fullPage:true,animations:'disabled',timeout:30000}).catch(e=>report.errors.push(name+' screenshot '+e.message.slice(0,80)));}
 report.browserEngines.push({name,success:stage===1&&meta.status==='ready',meta,errors:pageErrors,visited:[...visited]});
 await browser.close();
}
async function failure(name,intercept){
 const {browser,page,pageErrors}=await fresh(name);
 if(intercept==='module'){
  await page.route('**/releases/'+SHA+'/app.mjs',route=>route.abort('failed'));
  await page.goto(endpoint,{waitUntil:'domcontentloaded',timeout:70000});
  await page.getByRole('heading',{name:'Studio application script could not load'}).waitFor({timeout:20000});
  check(name+' script failure surfaced',await page.getByText('MODULE_FETCH_FAILED',{exact:false}).count()>0);
  check(name+' script failure recovery link',await page.getByRole('link',{name:'Open current review build'}).count()===1);
  await browser.close();return;
 }
 await page.route('**/releases/'+SHA+'/manifest.json',async route=>{
  if(intercept==='stale'){
    const old={ 'Artist-edit-backdrop-1.png':{original:[4000,2250]} };
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(old)});
  }else await route.abort('failed');
 });
 await page.goto(endpoint,{waitUntil:'domcontentloaded',timeout:70000});
 await page.locator('#cc-worktable-diagnostic[data-state=error]').waitFor({timeout:25000});
 const text=await page.locator('#cc-worktable-diagnostic').innerText();
 const legacyShown=await page.locator('.customize-layout').evaluate(el=>getComputedStyle(el).display!=='none');
 const detail=await page.evaluate(()=>window.__chapchitraArtistDiagnostic);
 check(name+' explicit error code',/MANIFEST_VALIDATION_FAILED/.test(text),text.slice(0,280));
 check(name+' remains on illustrated review (not old form)',!legacyShown,legacyShown);
 check(name+' actionable retry',await page.getByRole('button',{name:'Retry loading'}).count()===1);
 check(name+' direct review link',await page.getByRole('link',{name:'Open current review build'}).count()===1);
 check(name+' current build shown',detail?.build===SHA,detail);
 await browser.close();
}
(async()=>{
 await nominal('iPadSafari-compatible-Chromium');
 await nominal('iPadChrome-UA-Chromium',{chromeUA:true});
 if(fs.existsSync(webkit.executablePath())){
  try{await nominal('iPadSafari-WebKit-engine',{webkit:true})}
  catch(error){report.errors.push('WebKit engine run failed: '+error.message.slice(0,250))}
 }else report.browserEngines.push({name:'WebKit',note:'Engine binary unavailable; no native Safari claim'});
 await failure('legacy-manifest','stale');
 await failure('network-manifest','offline');
 await failure('failed-module','module');
 fs.writeFileSync(path.join(outPath,'result.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.filter(c=>c.ok).length,failed:report.errors,engines:report.browserEngines.map(x=>({name:x.name,success:x.success,note:x.note}))},null,2));
 process.exitCode=report.errors.length?2:0;
})().catch(e=>{console.error(e);process.exitCode=3});
