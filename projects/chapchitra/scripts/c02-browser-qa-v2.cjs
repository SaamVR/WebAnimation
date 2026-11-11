// CHAPCHITRA C02 owner-review acceptance against the real multipage build.
// C02_QA_ORIGIN overrides the local preview; simulator ≠ physical iPad.
const {chromium,webkit}=require('playwright');
const {mkdirSync,writeFileSync,renameSync}=require('node:fs');
const path=require('node:path');
const ORIGIN=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const OUT=path.resolve(__dirname,'../docs/c02-evidence-v2', (process.env.C02_QA_ENGINE||'all')+'-'+(process.env.C02_QA_DEVICE||'all'));
mkdirSync(OUT,{recursive:true});
const results=[];
function check(engine,name,condition,detail=''){
 results.push({engine,name,status:condition?'pass':'fail',detail});
 if(!condition)throw Error(name+': '+detail);
}
async function settled(page){
 await page.locator('#main').waitFor({state:'attached',timeout:20000});
 await page.waitForFunction(()=>!document.querySelector('#c02-loader'),null,{timeout:25000});
}
async function run(engine,device){
 const name=engine.name()+'-'+device;
 const b=await engine.launch(engine.name()==='chromium'&&process.platform==='win32'?{channel:'chrome',headless:true}:{headless:true});
 const dims=device==='desktop'?{width:1280,height:800}:device==='tablet'?{width:834,height:1112}:{width:390,height:844};
 const ctx=await b.newContext({
  viewport:dims,hasTouch:device!=='desktop',isMobile:device==='mobile',
  recordVideo:{dir:OUT,size:dims}
 });
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const goto=async p=>{await page.goto(ORIGIN+p);await page.locator('#main').waitFor()};
 const clickNav=async href=>{
  if(device==='mobile'){
   await page.locator('#menuButton').click();
   return page.locator('#mobileNav a[href="'+href+'"]').click({noWaitAfter:true});
  }
  return page.locator('.nav-center a[href="'+href+'"]').click({noWaitAfter:true});
 };
 async function jump(href,to){
  await page.locator('a[href="'+href+'"]').first().click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname===to,{timeout:15000});
  await settled(page);
  check(name,'navigate '+href,true);
 }
 try{
  await goto('/');
  // Confirm exact source SVG loads and the real overlay—not a generic opacity fade.
  if(device==='mobile')await page.locator('#menuButton').click();
  // Capture this state synchronously: the outgoing cover lasts only 405ms.
  const activated=await page.evaluate(isMobile=>{
   const link=document.querySelector(isMobile?
    '#mobileNav a[href="/shop/"]':'.nav-center a[href="/shop/"]');
   link.click();
   const overlay=document.getElementById('c02-loader');
   return {installed:document.documentElement.dataset.c02Installed,
    count:document.querySelectorAll('#c02-loader').length,
    src:overlay?.querySelector('img')?.getAttribute('src')};
  },device==='mobile');
  check(name,'owner roller source',activated.src==='/assets/c02/roller-original.svg',
   JSON.stringify(activated));
  check(name,'one active overlay',activated.count===1,JSON.stringify(activated));
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:15000});
  await settled(page);
  check(name,'home to shop',true);
  // Product route and native Back/Forward behavior
  await page.locator('a.product-visual').first().click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/product/',{timeout:15000});
  await settled(page);
  check(name,'shop to product',true);
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:15000});
  check(name,'browser Back returns to Shop',await page.locator('#c02-loader').count()===0);
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.waitForURL(u=>u.pathname==='/product/',{timeout:15000});
  check(name,'browser Forward returns to product',await page.locator('#c02-loader').count()===0);
  // The most complex destination is a separate async illustrated worktable.
  await goto('/');
  await clickNav('/artists-edit/');
  await page.waitForURL(u=>u.pathname==='/artists-edit/',{timeout:15000});
  await settled(page);
  check(name,'home to artist edit',await page.locator('#main').count()===1);
  // Simulated slow HTML response. Verify hold, never fake progress.
  await goto('/');
  let delaying=false;
  await page.route(url=>new URL(url).pathname==='/about/',async route=>{
   delaying=true;
   await new Promise(r=>setTimeout(r,1850));
   await route.continue();
  });
  const begin=Date.now();
  await clickNav('/about/');
  await page.waitForURL(u=>u.pathname==='/about/',{timeout:15000});
  check(name,'slow HTML response held at network boundary',
   delaying&&Date.now()-begin>=1850,
   'intercept='+delaying+' elapsed='+String(Date.now()-begin));
  await page.waitForURL(u=>u.pathname==='/about/',{timeout:15000});
  await settled(page);
  check(name,'slow-loading complete',true);
  await page.unrouteAll();
  // Reduced motion must preserve normal anchors and have no C02 overlay.
  await page.emulateMedia({reducedMotion:'reduce'});
  await goto('/');
  await clickNav('/journal/');
  await page.waitForURL(u=>u.pathname==='/journal/',{timeout:15000});
  check(name,'reduced motion native link',await page.locator('#c02-loader').count()===0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Source-failure fallback: roller 404/abort must not break navigation.
  await page.route('**/assets/c02/roller-prepared.svg',route=>route.abort('failed'));
  await goto('/');
  await clickNav('/about/');
  await page.waitForURL(u=>u.pathname==='/about/',{timeout:15000});
  await settled(page);
  check(name,'missing roller degrades gracefully',true);
  await page.unroute('**/assets/c02/roller-prepared.svg');
  // Rapid two-click activation must never create two overlays or double navigate.
  await goto('/');
  if(device==='mobile')await page.locator('#menuButton').click();
  await page.evaluate(isMobile=>{
   const selector=isMobile?'#mobileNav a[href="/shop/"]':'.nav-center a[href="/shop/"]';
   const a=document.querySelector(selector);a.click();a.click();
  },device==='mobile');
  check(name,'double click one overlay',await page.locator('#c02-loader').count()===1);
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:15000});await settled(page);
  // Keyboard Enter on an anchor is first-class.
  await goto('/');
  if(device==='mobile')await page.locator('#menuButton').click();
  await page.locator((device==='mobile'?'#mobileNav ':'.nav-center ')+'a[href="/journal/"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(u=>u.pathname==='/journal/',{timeout:15000});await settled(page);
  check(name,'keyboard Enter navigation',true);
  check(name,'no boot failures',!errors.some(s=>s.includes('CHAPCHITRA V3 initialization')));
 }catch(e){results.push({engine:name,name:'browser suite',status:'fail',detail:String(e?.stack||e).slice(0,750)})}
 finally{
  await ctx.close();
  try{
   const recorded=await page.video()?.path();
   if(recorded)renameSync(recorded,path.join(OUT,name+'-journey.webm'));
  }catch(e){console.warn('Video rename skipped:',e.message)}
  await b.close();
 }
}
(async()=>{
 for(const engine of [chromium,webkit]){
  if(process.env.C02_QA_ENGINE&&engine.name()!==process.env.C02_QA_ENGINE)continue;
  for(const device of ['desktop','tablet','mobile']){
   if(process.env.C02_QA_DEVICE&&device!==process.env.C02_QA_DEVICE)continue;
   await run(engine,device);
  }
 }
 writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 console.log('SUMMARY',JSON.stringify({pass:results.filter(x=>x.status==='pass').length,fail:results.filter(x=>x.status==='fail').length}));
 if(results.some(x=>x.status==='fail'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
