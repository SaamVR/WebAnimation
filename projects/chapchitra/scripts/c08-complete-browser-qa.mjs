/** Final C08 actual native SVG-renderer QA. No hosting, no production seek
 * API, no composite video. Cold response holds are explicit test controls.
 * Existing two-cycle carousel gate separately measures uninterrupted dwell. */
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const SELECTOR='#hero .hero01-full-logo';
const suffix={light:'CHAPCHITRA_C08_WORDMARK_REPRINT_NEG90_WITH_CLOTHING_PATCH.json',dark:'CHAPCHITRA_C08_INVERTED_WORDMARK_REPRINT.json'};
const other=t=>t==='light'?'dark':'light';
const state=p=>p.evaluate(()=>window.__chapchitraC08?.hero);
const ready=(p,fn,argument,timeout=15000)=>p.waitForFunction(fn,argument,{timeout});
function deferred(){let release;const promise=new Promise(r=>release=r);return {promise,release}}
async function snapshot(page){
 return page.evaluate(()=>{
  const box=document.querySelector('#hero .hero01-full-logo'),img=box.querySelector('.hero-brand-lockup');
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
  const slots=[...box.querySelectorAll('.c08-complete-variant')].map(slot=>{
   const svg=slot.querySelector('svg'),embedded=[...slot.querySelectorAll('svg image')].find(e=>!e.closest('defs'));
   const href=embedded?.getAttribute('href')||embedded?.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';
   const style=getComputedStyle(slot);
   return {theme:slot.dataset.c08Variant,ready:slot.dataset.c08Ready==='true',visible:style.visibility==='visible'&&Number(style.opacity)===1,
    rect:rect(slot),viewBox:svg?.getAttribute('viewBox'),image:!!embedded,imageHrefIsPNG:href.startsWith('data:image/png;base64,'),
    imageRect:embedded?rect(embedded):null};
  });
  return {state:window.__chapchitraC08?.hero,box:rect(box),staticRect:rect(img),staticVisible:getComputedStyle(img).visibility==='visible',
   staticSource:img.getAttribute('src'),staticDecoded:img.complete&&img.naturalWidth>0,
   slots,oldOverlay:!!box.querySelector('.c08-hero-cloth,.c08-hero-wordmark,.c08-hero-stage'),
   playerScripts:[...document.scripts].filter(s=>s.src.includes('/motion/c01/vendor/lottie.min.js')).length,
   navbarAnimations:document.querySelectorAll('#siteHeader .c08-complete-stage,#siteHeader .c08-navbar-animation').length,
   footerAnimations:document.querySelectorAll('#footer .c08-complete-stage,#footer .c08-navbar-animation').length};
 });
}
function singleView(s,t,expectNative){
 assert.equal(s.oldOverlay,false,'Retired split overlay must remain absent');
 assert.equal(s.navbarAnimations,0);assert.equal(s.footerAnimations,0);
 assert.ok(s.slots.length<=2,'At most two complete theme instances');
 const visible=s.slots.filter(v=>v.visible);
 if(expectNative){
  assert.equal(s.staticVisible,false,'Static fallback must not duplicate native composition');
  assert.equal(visible.length,1,'Exactly one complete native composition visible');
  const v=visible[0];
  assert.equal(v.theme,t);assert.equal(v.ready,true);assert.equal(v.image,true);assert.equal(v.imageHrefIsPNG,true);
  assert.equal(s.state.variants[t].decoded,true,'Embedded PNG decoded before reveal');
  assert.ok(v.viewBox?.split(/\s+/).map(Number).join(',')==='0,0,2400,2400','Original square viewBox');
  assert.ok(Math.abs(v.rect.width-s.staticRect.width)<1,'Preserve logo width');
  assert.ok(Math.abs(v.rect.height-v.rect.width)<1,'Native composition not shrunk into 2020-high box');
  assert.ok(Math.abs(v.rect.x-s.staticRect.x)<1&&Math.abs(v.rect.y-s.staticRect.y)<1,'Preserve origin');
  assert.ok(v.imageRect.width>30&&v.imageRect.height>30,'Painted PNG layer geometry');
 }else{
  assert.equal(visible.length,0,'No animated layer over fallback');
  assert.equal(s.staticVisible,true);assert.equal(s.staticDecoded,true);
  assert.ok(s.staticSource.includes('chapchitra-'+t+'-full.svg'),'Matching original fallback');
 }
}
async function shot(page,out,name){
 await page.screenshot({path:join(out,name+'.png')});
}
async function patchClip(page,t){
 const s=await snapshot(page),v=s.slots.find(a=>a.theme===t&&a.visible);
 assert.ok(v?.imageRect,'Native image rectangle required');
 // The exact embedded clothing region is independent of the wordmark.
 // Clip inside its rectangle; exclude transparent outer edge rounding.
 const x=Math.ceil(v.imageRect.x+2),y=Math.ceil(v.imageRect.y+2);
 const width=Math.floor(v.imageRect.width-4),height=Math.floor(v.imageRect.height-4);
 assert.ok(width>20&&height>20);
 return {png:await page.screenshot({clip:{x,y,width,height}}),clip:{x,y,width,height}};
}
async function pixels(a,b){
 const p=await sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const q=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual([p.info.width,p.info.height],[q.info.width,q.info.height]);
 let different=0,mean=0,colors=new Set();
 for(let i=0;i<p.data.length;i+=4){
  const d=Math.abs(p.data[i]-q.data[i])+Math.abs(p.data[i+1]-q.data[i+1])+Math.abs(p.data[i+2]-q.data[i+2]);
  mean+=d/3;if(d>12)different++;
  colors.add((p.data[i]<<16)|(p.data[i+1]<<8)|p.data[i+2]);
 }
 return {differentFraction:different/(p.data.length/4),meanAbsolute:mean/(p.data.length/4),distinctColors:colors.size};
}
async function freezeVisualFrame(page,t,frame){
 // Visual stills only AFTER real-time playback. Drive the actual existing
 // lottie-web player; no source replacement, screenshot composition or
 // change to the uninterrupted recording checks.
 await page.evaluate(({theme,frame})=>{
  const slot=document.querySelector('.c08-complete-variant[data-c08-variant="'+theme+'"]');
  const registration=window.lottie?.getRegisteredAnimations().find(a=>a.wrapper===slot);
  if(!registration)throw Error('No native registered animation for visual seek');
  registration.goToAndStop(frame,true);
 },{theme:t,frame});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
const focusHero=page=>page.evaluate(()=>document.querySelector('#hero [data-slide-to="0"]').focus({preventScroll:true}));
const toggle=page=>page.locator('#themeToggle').evaluate(el=>el.click());
function track(page,record){
 page.on('pageerror',e=>record.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)record.badResponses.push(r.status()+' '+r.url())});
 page.on('request',r=>{
  const url=new URL(r.url());
  if(url.pathname.startsWith('/assets/c08')||url.pathname.startsWith('/motion/c08'))record.requests.push(url.pathname);
 });
}
async function runOne(browser,profile,t,root,out){
 const name=profile.name+'-'+t,record={profile:name,viewport:profile.viewport,theme:t,checks:{},errors:[],badResponses:[],requests:[],samples:[]};
 const hold={light:deferred(),dark:deferred()},seen=new Set();
 let context,page;
 try{
  context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:1,hasTouch:profile.touch,
   colorScheme:t,reducedMotion:'no-preference',recordVideo:{dir:out,size:profile.viewport}});
  // Intercept only final JSON response delivery: actual native data and
  // artwork unchanged. Cold contexts; known delayed response, not a claim
  // of a measured real cellular throughput.
  await context.route('**/assets/c08-final/*.json',async route=>{
   const which=route.request().url().endsWith(suffix.light)?'light':'dark';
   seen.add(which);
   try{
    const response=await route.fetch();
    await hold[which].promise;
    await route.fulfill({response});
   }catch{try{await route.abort()}catch{}}
  });
  page=await context.newPage();track(page,record);
  await page.addInitScript(()=>{
   window.__c08Witness={samples:[],violations:[],last:null};
   const tick=()=>{
    const w=window.__c08Witness,box=document.querySelector('#hero .hero01-full-logo'),h=window.__chapchitraC08?.hero;
    if(box&&h&&!box.closest('.hero-slide').hidden&&box.getBoundingClientRect().width>0){
     const img=box.querySelector('.hero-brand-lockup');
     const staticVisible=getComputedStyle(img).visibility==='visible';
     const active=[...box.querySelectorAll('.c08-complete-variant')].filter(e=>getComputedStyle(e).visibility==='visible'&&Number(getComputedStyle(e).opacity)===1);
     const sample={t:performance.now(),theme:h.theme,shown:h.shown,phase:h.phase,frame:h.frame,
      staticVisible,staticDecoded:img.complete&&img.naturalWidth>0,visibleNative:active.length,
      embedded:active.length===1&&[...active[0].querySelectorAll('svg image')].some(e=>!e.closest('defs')),
      decoded:active.length===1&&h.variants[active[0].dataset.c08Variant]?.decoded===true};
     const key=[sample.theme,sample.shown,sample.phase,sample.visibleNative,Math.floor(sample.frame/20)].join(':');
     if(key!==w.last){w.samples.push(sample);w.last=key}
     if(active.length>1||active.length===1&&(staticVisible||!sample.embedded||!sample.decoded)||
       !staticVisible&&active.length===0)w.violations.push(sample);
    }
    requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
  });
  await page.goto(root+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.mouse.move(5,5);
  await page.locator(SELECTOR+' .hero-brand-lockup').evaluate(img=>img.decode());
  await ready(page,()=>!!window.__chapchitraC08?.hero);
  // Existing keyboard focus pause gives the targeted stress test a stable
  // hero. The original uninterrupted two-cycle timing test remains separate.
  await focusHero(page);
  await ready(page,()=>window.__chapchitraHeroCarousel?.state.running===false);
  await ready(page,theme=>window.__chapchitraC08?.hero.variants[theme]?.status==='loading',t);
  await page.waitForTimeout(350);
  let s=await snapshot(page);singleView(s,t,false);
  const initialBox=s.staticRect;record.samples.push({label:'cold-held-static',...s});
  await shot(page,out,name+'-01-cold-static');
  assert.equal(s.state.autoplay,0);
  record.checks.coldFallback=true;
  hold[t].release();
  await ready(page,()=>window.__chapchitraC08?.hero.playing===true);
  s=await snapshot(page);singleView(s,t,true);
  record.samples.push({label:'initial-native',...s});
  await shot(page,out,name+'-02-native-start');
  await ready(page,()=>window.__chapchitraC08?.hero.frame>=45&&window.__chapchitraC08?.hero.playing);
  const before=await state(page);
  // Exercise the real theme button handler without changing focus/scroll.
  // Actual pointer/touch activation is tested separately after completion.
  await toggle(page);
  await ready(page,theme=>{const h=window.__chapchitraC08?.hero;return h?.theme===theme&&h.shown==='static'&&!h.playing},other(t));
  await page.locator(SELECTOR+' .hero-brand-lockup').evaluate(img=>img.decode());
  const paused=await state(page);
  assert.equal(paused.phase,'playing','Theme transition is a paused continuation, not a reset');
  assert.ok(paused.frame>=before.frame-1&&paused.frame<=before.frame+30,'Preserve current frame at switch');
  s=await snapshot(page);singleView(s,other(t),false);
  record.samples.push({label:'theme-delayed-static',...s});
  await shot(page,out,name+'-03-theme-delayed-static');
  await page.waitForTimeout(180);
  assert.equal((await state(page)).frame,paused.frame,'Frame remains frozen while alternate is unavailable');
  hold[other(t)].release();
  await ready(page,theme=>{const h=window.__chapchitraC08?.hero;return h?.theme===theme&&h.shown===theme&&h.playing},other(t));
  s=await snapshot(page);singleView(s,other(t),true);
  assert.ok(Math.abs(s.state.lastSwap.frame-paused.frame)<=1,'Alternate rendered the exact held frame before resuming');
  record.samples.push({label:'resumed-matching-frame',...s});
  await shot(page,out,name+'-04-theme-resume');
  record.checks.heldThemeFrameContinuity=true;
  // Both instances are now decoded. Stress the synchronous actual toggle
  // handler with rapid repeated events; no new requests or autoplay.
  await page.evaluate(()=>{const button=document.querySelector('#themeToggle');button.click();button.click();button.click();button.click();});
  await ready(page,theme=>window.__chapchitraC08?.hero.shown===theme,other(t));
  const rapid=await state(page);
  assert.equal(rapid.autoplay,1);assert.equal(rapid.replays,0);
  assert.ok(rapid.frame>=paused.frame-1);
  record.checks.rapidThemeNoReplay=true;
  await ready(page,()=>window.__chapchitraC08?.hero.completed===1);
  s=await snapshot(page);singleView(s,other(t),true);
  assert.equal(s.state.frame,239);assert.equal(s.state.playing,false);
  assert.ok(Math.abs(s.staticRect.width-initialBox.width)<1&&Math.abs(s.staticRect.x-initialBox.x)<1&&Math.abs(s.staticRect.y-initialBox.y)<1);
  record.samples.push({label:'natural-complete',...s});
  await shot(page,out,name+'-05-natural-final');
  // Confirm the actual owner PNG stays painted at the original position
  // across frame 0/120/239 using native frame stills. Use the initial theme
  // to cover both palettes across the profile matrix.
  await toggle(page);
  await ready(page,theme=>window.__chapchitraC08?.hero.shown===theme,t);
  await freezeVisualFrame(page,t,0);
  await shot(page,out,name+'-06-native-frame000');
  const patch0=await patchClip(page,t);
  await freezeVisualFrame(page,t,120);
  await shot(page,out,name+'-07-native-frame120');
  const patch120=await patchClip(page,t);
  await freezeVisualFrame(page,t,239);
  await shot(page,out,name+'-08-native-frame239');
  const patch239=await patchClip(page,t);
  const a=await pixels(patch0.png,patch120.png),b=await pixels(patch0.png,patch239.png);
  record.patchPixels={clip:patch0.clip,frame0to120:a,frame0to239:b};
  assert.ok(a.distinctColors>25&&b.distinctColors>25,'Clothing region must contain visible multicolor artwork');
  assert.ok(a.differentFraction<.015&&b.differentFraction<.015,'Clothing patch pixels remain stable during wordmark motion');
  record.checks.nativePatchPixelContinuity=true;
  // Owner-approved deliberate replay: hover on fine pointer, touch tap,
  // or keyboard Enter. No autonomous carousel-return replay.
  const trigger=page.locator('.c08-complete-trigger');
  if(profile.touch){await trigger.tap();record.trigger='touch-tap'}
  else if(t==='light'){await trigger.hover();record.trigger='pointer-enter'}
  else{await trigger.focus();await trigger.press('Enter');record.trigger='keyboard-enter'}
  await ready(page,()=>window.__chapchitraC08?.hero.replays===1&&window.__chapchitraC08?.hero.playing);
  await ready(page,()=>window.__chapchitraC08?.hero.completed===2);
  await page.waitForTimeout(250);
  assert.equal((await state(page)).replays,1,'Holding pointer or focus must not loop');
  record.checks.deliberateReplay=true;
  await shot(page,out,name+'-09-replay-complete');
  // Real button click toggles current theme after complete without replay.
  await page.locator('#themeToggle').click();
  await ready(page,theme=>window.__chapchitraC08?.hero.shown===theme,other(t));
  await focusHero(page);
  const final=await state(page);
  assert.equal(final.completed,2);assert.equal(final.replays,1);assert.equal(final.frame,239);
  record.checks.actualToggleAfterComplete=true;
  // Explicit manual slide leave/return; no new auto start.
  await page.locator('#hero [data-slide-to="1"]').evaluate(el=>el.click());
  await ready(page,()=>document.querySelector('.hero-slide.is-active')?.dataset.slide==='1');
  await page.locator('#hero [data-slide-to="0"]').evaluate(el=>el.click());
  await ready(page,()=>document.querySelector('.hero-slide.is-active')?.dataset.slide==='0');
  await page.waitForTimeout(200);
  assert.equal((await state(page)).autoplay,1);assert.equal((await state(page)).replays,1);
  record.checks.noReturnAutoplay=true;
  const witness=await page.evaluate(()=>window.__c08Witness);
  record.witness=witness;
  assert.deepEqual(witness.violations,[],'No overlapping, empty or undecoded visible native frames');
  assert.ok(seen.has('light')&&seen.has('dark'));
  const jsonRequests=record.requests.filter(x=>x.startsWith('/assets/c08-final/')&&x.endsWith('.json'));
  assert.deepEqual(jsonRequests.sort(),Object.values(suffix).map(n=>'/assets/c08-final/'+n).sort());
  assert.equal(record.requests.some(x=>x.endsWith('.lottie')||x.startsWith('/assets/c08/')),false);
  record.checks.singleFormatAndBoundedInstances=true;
  record.performance=await page.evaluate(()=>({resources:performance.getEntriesByType('resource')
   .filter(x=>x.name.includes('/assets/c08-final/')).map(x=>({name:x.name,duration:x.duration,transferSize:x.transferSize,decodedBodySize:x.decodedBodySize})),
   heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null,
   nativeInstances:document.querySelectorAll('.c08-complete-variant svg').length}));
  assert.equal(record.performance.nativeInstances,2);
  // Observable lifecycle cleanup test (synthetic pagehide), then real route
  // navigation. Do not claim full physical-device heap or BFCache proof.
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
  await ready(page,()=>window.__chapchitraC08?.hero.disposed===true);
  assert.equal(await page.locator('.c08-complete-stage').count(),0);
  const countBefore=record.requests.length;
  await page.mouse.move(5,5);
  await page.goto(root+'/shop/',{waitUntil:'domcontentloaded'});
  await page.locator('#shopProducts').waitFor({timeout:20000});
  await ready(page,()=>!!window.__chapchitraNavbarC08);
  await page.waitForTimeout(350);
  const idleRequests=record.requests.slice(countBefore);
  assert.deepEqual([...idleRequests].sort(),['/motion/c08/complete-logo.mjs','/motion/c08/navbar-native.mjs'],'Only approved navbar code may load at idle outside Home');
  assert.equal(await page.locator('.c08-complete-stage,.c08-complete-variant,.c08-navbar-animation').count(),0,'No hero or retired split renderer outside Home');
  assert.equal(await page.evaluate(()=>!!window.__chapchitraC08?.hero),false,'No hero runtime outside Home');
  assert.equal(await page.evaluate(()=>window.__chapchitraNavbarC08.state.starts),0,'No idle navbar autoplay');
  assert.equal(await page.evaluate(()=>window.__chapchitraNavbarC08.state.ready),false,'No idle navbar composition');
  assert.equal(await page.locator('.site-footer .cc-nav-native-stage').count(),0,'Footer remains static');
  const nav=page.locator('.site-header .logo-word--image');
  if(!profile.touch){
   const hoverTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
   const beforeHover=record.requests.length;
   await nav.hover();
   await ready(page,()=>window.__chapchitraNavbarC08.state.playing===true);
   assert.equal(await page.evaluate(()=>window.__chapchitraNavbarC08.state.theme),hoverTheme);
   assert.deepEqual(record.requests.slice(beforeHover),['/assets/c08-final/'+suffix[hoverTheme]],'Deliberate hover loads only active approved theme asset');
   assert.equal(await nav.locator('img').evaluate(e=>getComputedStyle(e).visibility),'hidden');
   assert.equal(await nav.locator('.cc-nav-native-holder svg').count(),1);
   await ready(page,()=>window.__chapchitraNavbarC08.state.completed===1);
   assert.equal(await nav.locator('img').evaluate(e=>getComputedStyle(e).visibility),'visible');
   assert.equal(await page.evaluate(()=>window.__chapchitraNavbarC08.state.starts),1);
   await page.mouse.move(5,5);
  }
  record.checks.disposalAndNonHomeIsolation=true;
  record.checks.approvedNavbarOnDemand=true;
  assert.deepEqual(record.errors,[]);assert.deepEqual(record.badResponses,[]);
  record.pass=true;
 }catch(error){record.pass=false;record.failure=error.stack||String(error);try{record.failureState=await snapshot(page);await shot(page,out,name+'-FAIL')}catch{}}
 finally{
  hold.light.release();hold.dark.release();
  if(context){const video=page?.video();await context.close();if(video){try{const original=await video.path();record.video=name+'-native-uncut.webm';await rename(original,join(out,record.video))}catch(error){record.videoError=String(error);record.pass=false}}}
 }
 return record;
}
async function reducedAndFailure(browser,profile,t,root,out,fail=false){
 const name=profile.name+'-'+t+(fail?'-failure':'-reduced'),record={profile:name,errors:[],badResponses:[],requests:[]};
 let context,page;
 try{
  context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:1,hasTouch:profile.touch,colorScheme:t,reducedMotion:fail?'no-preference':'reduce'});
  if(fail)await context.route('**/assets/c08-final/'+suffix[t],route=>route.abort('failed'));
  page=await context.newPage();track(page,record);
  await page.goto(root+'/',{waitUntil:'domcontentloaded'});
  await page.locator(SELECTOR+' .hero-brand-lockup').evaluate(img=>img.decode());
  await ready(page,()=>!!window.__chapchitraC08?.hero);
  if(fail)await ready(page,()=>window.__chapchitraC08?.hero.failed===true);
  else await page.waitForTimeout(450);
  const s=await snapshot(page);singleView(s,t,false);
  assert.equal(s.state.autoplay,0);assert.equal(s.state.playing,false);
  if(!fail)assert.equal(record.requests.filter(x=>x.startsWith('/assets/c08-final/')).length,0);
  await shot(page,out,name);
  record.state=s;assert.deepEqual(record.errors,[]);assert.deepEqual(record.badResponses,[]);
  record.pass=true;
 }catch(e){record.pass=false;record.failure=e.stack||String(e)}
 finally{if(context)await context.close()}
 return record;
}
export async function runCompleteC08QA({root='http://127.0.0.1:4336',out=resolve(import.meta.dirname,'../perf-results/c08-final-native')}={}){
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(root))throw Error('C08 QA requires localhost; no hosted preview');
 await mkdir(out,{recursive:true});
 const profiles=[
  {name:'desktop',viewport:{width:1440,height:900},touch:false},
  {name:'tablet',viewport:{width:834,height:1112},touch:true},
  {name:'mobile',viewport:{width:390,height:844},touch:true}
 ];
 const selection=process.env.C08_QA_PROFILES?.split(',');
 const results=[];
 const save=()=>writeFile(join(out,'c08-complete-browser-report.json'),JSON.stringify({pass:results.every(r=>r.pass),method:'Native Lottie SVG, cold contexts, controlled JSON response holds, unedited browser video, native frame stills',results},null,2));
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,timeout:25000});
  try{
   for(const p of profiles){
    const profile={...p,name:engineName+'-'+p.name};
    if(selection&&!selection.includes(profile.name))continue;
    for(const t of ['light','dark']){
     const result=await runOne(browser,profile,t,root,out);
     results.push(result);await save();
     console.log('C08_COMPLETE_PROFILE '+JSON.stringify({profile:result.profile,pass:result.pass,checks:result.checks,patchPixels:result.patchPixels,failure:result.failure,video:result.video}));
     const reduced=await reducedAndFailure(browser,profile,t,root,out);
     results.push(reduced);await save();console.log('C08_REDUCED '+JSON.stringify({profile:reduced.profile,pass:reduced.pass,failure:reduced.failure}));
    }
   }
   if(!selection||selection.includes(engineName+'-desktop')){
    const failed=await reducedAndFailure(browser,{...profiles[0],name:engineName+'-desktop'},'light',root,out,true);
    results.push(failed);await save();console.log('C08_FAILURE_FALLBACK '+JSON.stringify({profile:failed.profile,pass:failed.pass,failure:failed.failure}));
   }
  }finally{await browser.close()}
 }
 const pass=results.length>0&&results.every(r=>r.pass);
 console.log('C08_COMPLETE_SUMMARY '+JSON.stringify({pass,total:results.length,passed:results.filter(r=>r.pass).length}));
 return {pass,results};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 const result=await runCompleteC08QA({root:process.env.C08_QA_ROOT||undefined,out:process.env.C08_QA_OUT||undefined});
 if(!result.pass)process.exitCode=1;
}
