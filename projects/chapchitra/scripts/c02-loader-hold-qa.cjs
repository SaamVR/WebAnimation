// CHAPCHITRA C02: true incoming-page readiness gate, slow loader and reduced-motion evidence.
// Simulated tablet viewports are NOT physical iPad verification.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {mkdirSync,renameSync,writeFileSync}=require('node:fs');
const path=require('node:path');
const origin=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const browsers=process.env.C02_QA_ENGINE==='chromium'?[chromium]:
 process.env.C02_QA_ENGINE==='webkit'?[webkit]:[chromium,webkit];
const root=path.resolve(__dirname,'../docs/c02-evidence-v2',
 (process.env.C02_QA_ENGINE||'all')+'-'+(process.env.C02_QA_DEVICE||'all'));
mkdirSync(root,{recursive:true});
const results=[];
async function run(engine,device){
 const name=engine.name()+'-'+device+'-loader';
 const viewport=device==='tablet'?{width:834,height:1112}:{width:1280,height:800};
 const browser=await engine.launch(engine.name()==='chromium'&&process.platform==='win32'
  ?{headless:true,channel:'chrome'}:{headless:true});
 const context=await browser.newContext({viewport,recordVideo:{dir:root,size:viewport}});
 const page=await context.newPage();
 try{
  await page.goto(origin+'/c02-review/');
  await page.locator('#main').waitFor();
  const started=Date.now();
  const original=await page.evaluate(()=>{
   const link=document.querySelector('a[href="/c02-review/slow/?delay=2200"]');
   link.click();
   return {overlays:document.querySelectorAll('#c02-loader').length,
    roller:document.querySelector('#c02-loader img')?.getAttribute('src')};
  });
  assert.equal(original.overlays,1,'exactly one outgoing overlay');
  assert.equal(original.roller,'/assets/c02/roller-prepared.svg');
  await page.waitForURL(url=>url.pathname==='/c02-review/slow/',{timeout:18000});
  await page.waitForFunction(()=>{
   const stage=document.getElementById('c02-loader');
   return stage?.dataset.phase==='loading' && window.__c02DemoReady!==true;
  },null,{timeout:12000});
  const state=await page.evaluate(()=>({
   phase:document.getElementById('c02-loader')?.dataset.phase,
   contentCount:document.querySelector('#main')?.children.length,
   ready:window.__c02DemoReady
  }));
  assert.equal(state.phase,'loading');
  assert.equal(state.contentCount,0,'no destination DOM visible under covered ink');
  await page.screenshot({path:path.join(root,name+'-covered-loading.png')});
  await page.waitForFunction(()=>window.__c02DemoReady===true,null,{timeout:12000});
  await page.waitForFunction(()=>!document.getElementById('c02-loader'),null,{timeout:12000});
  const elapsed=Date.now()-started;
  assert.ok(elapsed>=2200,'revealed before simulated content was ready');
  assert.ok(await page.locator('text=The ink has lifted. The page is ready.').isVisible());
  await page.screenshot({path:path.join(root,name+'-destination-ready.png')});
  results.push({engine:engine.name(),device,case:'2.2s real DOM loading hold',status:'pass',elapsed});
  // One extra reduced-motion navigation. This uses native links and no C02 overlay.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(origin+'/c02-review/');
  await page.locator('#main').waitFor();
  await page.locator('a[href="/shop/"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:12000});
  assert.equal(await page.locator('#c02-loader').count(),0);
  await page.locator('#main').waitFor();
  await page.screenshot({path:path.join(root,name+'-reduced-motion.png')});
  results.push({engine:engine.name(),device,case:'native reduced-motion navigation',status:'pass'});
 }catch(error){
  results.push({engine:engine.name(),device,case:'loader suite',status:'fail',
   detail:String(error?.stack||error).slice(0,850)});
 }finally{
  await context.close();
  try{
   const file=await page.video()?.path();
   if(file)renameSync(file,path.join(root,name+'-journey.webm'));
  }catch(err){console.warn('Recording rename:',err.message)}
  await browser.close();
 }
}
(async()=>{
 for(const engine of browsers)for(const device of ['desktop','tablet'])
  await run(engine,device);
 writeFileSync(path.join(root,'loader-summary.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 if(results.some(r=>r.status==='fail'))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
