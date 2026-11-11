// C02 candidate browser acceptance. Run after node scripts/build.mjs and npm run preview.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const origin=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const evidence=path.resolve(__dirname,'../docs/c02-evidence');
fs.mkdirSync(evidence,{recursive:true});
const results=[];
async function run(engine){
 const browser=await engine.launch(engine.name()==='chromium'?{headless:true,channel:'chrome'}:{headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:evidence,size:{width:1280,height:800}}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const destinations=['/shop/','/artists-edit/','/journal/','/about/'];
  for(const dest of destinations){
   await page.goto(origin+'/');
   await page.locator('.nav-center a[href="'+dest+'"]').click({noWaitAfter:true});
   await page.waitForURL(u=>u.pathname===dest,{timeout:10000});
   await page.waitForFunction(()=>!document.querySelector('[data-c02="ink-sweep"]'),null,{timeout:10000});
   assert.equal(await page.locator('#main').count(),1);
   assert.equal(await page.locator('[data-c02="ink-sweep"]').count(),0);
   results.push({engine:engine.name(),case:'home-to-'+dest,status:'pass'});
   if(dest==='/shop/'){
    await page.goBack();
    await page.waitForURL(u=>u.pathname==='/');
    assert.equal(await page.locator('[data-c02="ink-sweep"]').count(),0);
    results.push({engine:engine.name(),case:'browser-back-history',status:'pass'});
   }
  }
  // Capture an actual in-progress screenshot with the organic ink edge.
  await page.goto(origin+'/');
  await page.locator('.nav-center a[href="/shop/"]').waitFor();
  await page.evaluate(()=>document.querySelector('.nav-center a[href="/shop/"]').click());
  await page.waitForTimeout(140);
  assert.equal(await page.locator('[data-c02="ink-sweep"]').count(),1);
  await page.screenshot({path:path.join(evidence,engine.name()+'-c02-mid-sweep.png')});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:10000});
  results.push({engine:engine.name(),case:'mid-sweep-real-frame',status:'pass'});
  // Product browsing remains native; C02 cannot appear outside Home.
  await page.locator('.product-visual').first().click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/product/',{timeout:10000});
  assert.equal(await page.locator('[data-c02="ink-sweep"]').count(),0);
  results.push({engine:engine.name(),case:'shop-product-exclusion',status:'pass'});
  // Reduced-motion bypasses the transition; the native link still works.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(origin+'/');
  await page.locator('.nav-center a[href="/journal/"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/journal/',{timeout:10000});
  assert.equal(await page.locator('[data-c02="ink-sweep"]').count(),0);
  results.push({engine:engine.name(),case:'reduced-motion-native-nav',status:'pass'});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+'/');
  await page.locator('#menuButton').click();
  await page.locator('#mobileNav a[href="/about/"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/about/',{timeout:10000});
  await page.waitForFunction(()=>!document.querySelector('[data-c02="ink-sweep"]'),null,{timeout:10000});
  results.push({engine:engine.name(),case:'mobile-menu-navigation',status:'pass'});
  // Keyboard activation remains a native link-driven navigation.
  await page.setViewportSize({width:1280,height:800});
  await page.goto(origin+'/');
  await page.locator('.nav-center a[href="/journal/"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(u=>u.pathname==='/journal/',{timeout:10000});
  await page.waitForFunction(()=>!document.querySelector('[data-c02="ink-sweep"]'),null,{timeout:10000});
  results.push({engine:engine.name(),case:'keyboard-enter-nav',status:'pass'});
  // Owner-approved old site and handoff share a release-stamped editor JS entry.
  await page.goto(origin+'/artists-edit/');
  assert.equal(await page.locator('body[data-page="artists-edit"]').count(),1);
  assert.equal(await page.locator('text=SITE_BOOT_FAILED').count(),0);
  results.push({engine:engine.name(),case:'artist-editor-entrypoint',status:'pass'});
  if(errors.length)throw Error(engine.name()+' page errors: '+errors.slice(0,8).join(' | '));
  await context.close();
 }finally{await browser.close();}
}
(async()=>{
 for(const engine of [chromium,webkit]){
  try{await run(engine)}catch(error){
   results.push({engine:engine.name(),case:'browser-run',status:'fail',error:String(error.message).slice(0,1000)});
  }
 }
 fs.writeFileSync(path.join(evidence,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 if(results.some(r=>r.status==='fail'))process.exitCode=1;
})();
