/* Independent exact-owner SVG toggle review in the existing isolated CI preview.
 * Never interacts with the live Render staging site.
 * Uncut Chromium video + native screenshots + reversible-frame QA.
 */
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
const ROOT=(process.env.CC_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const OUT=resolve(process.env.CC_TOGGLE_QA_OUT||'perf-results/shared-stage-illustrated-toggle');
await mkdir(OUT,{recursive:true});
const profiles=[
 {name:'desktop-chromium',browser:chromium,width:1440,height:900,record:true},
 {name:'ipad-webkit',browser:webkit,width:834,height:1112},
 {name:'mobile-chromium',browser:chromium,width:390,height:844},
 {name:'narrow-320-chromium',browser:chromium,width:320,height:700}
];
const audit={source:'Owner Illustrator exact master, no raster replacement',mode:'isolated PR build, NOT deployed',screenshots:[],profiles:[],errors:[]};
const assert=(ok,message)=>{if(!ok)throw Error(message)};
const read=async(page,selector)=>page.locator(selector+' svg.cc-owner-toggle-svg').evaluate(svg=>{
 const roles=[...svg.querySelectorAll('[data-toggle-role]')].map(x=>x.getAttribute('data-toggle-role'));
 const day=svg.querySelector('[data-toggle-role=day]');
 return {
  progress:Number(svg.dataset.toggleProgress),
  pathCount:svg.querySelectorAll('path').length,
  roles,
  dayClip:day.getAttribute('clip-path'),
  clipStyle:getComputedStyle(day).clipPath,
  svgBox:svg.getBoundingClientRect().toJSON(),
  sliderTransform:svg.querySelector('[data-toggle-role=slider]').getAttribute('transform'),
  sliderBaseFill:getComputedStyle(svg.querySelector('[id$="sliding-circle-inside-fill"] g > path')).fill,
  sliderGrainFill:getComputedStyle(svg.querySelector('[id$="sliding-circle-inside-fill"] > g:nth-child(2)')).fill,
  sunFill:getComputedStyle(svg.querySelector('[data-toggle-role="sun"] path')).fill,
  dayInkFill:getComputedStyle(svg.querySelector('[data-toggle-role="day"] .st1')).fill,
  outerInkFill:getComputedStyle(svg.querySelector('[id$="pill-outer-outline"] .st1')).fill,
  artworkInk:getComputedStyle(svg).getPropertyValue('--cc-toggle-ink').trim()
 };
});
async function capture(page,name){
 const file=name+'.png';
 await page.screenshot({path:join(OUT,file),animations:'disabled',timeout:70000});
 audit.screenshots.push(file);
}
async function prepare(profile,theme,record=false){
 const browser=await profile.browser.launch({headless:true,timeout:90000});
 const context=await browser.newContext({
  viewport:{width:profile.width,height:profile.height},colorScheme:theme,
  reducedMotion:'no-preference',hasTouch:profile.name!=='desktop-chromium',
  recordVideo:record?{dir:OUT,size:{width:profile.width,height:profile.height}}:undefined
 });
 await context.addInitScript(choice=>{
  try{localStorage.setItem('chapchitra-color-theme-v1',choice)}catch{}
 },theme);
 const page=await context.newPage();
 const issues=[];
 page.on('pageerror',error=>issues.push(error.message));
 const response=await page.goto(ROOT+'/',{waitUntil:'domcontentloaded',timeout:60000});
 assert(response?.status()===200,'homepage HTTP != 200');
 await page.waitForSelector('#siteHeader',{timeout:35000});
 const mobile=profile.width<=430;
 if(mobile){
  await page.locator('#menuButton').click();
  await page.locator('#mobileNav:not([hidden])').waitFor({timeout:6000});
 }
 const selector=mobile?'#themeToggleMobile':'#themeToggle';
 await page.locator(selector+'[data-art-ready="true"]').waitFor({timeout:30000});
 if(mobile){
  const layout=await page.locator('#themeToggleMobile').evaluate(button=>{
   const label=button.querySelector('.cc-theme-menu-label');
   const b=button.getBoundingClientRect(),l=label.getBoundingClientRect();
   return {gridColumn:getComputedStyle(button).gridColumn,
    labelHeight:l.height,lineHeight:parseFloat(getComputedStyle(label).lineHeight),
    labelRight:l.right,buttonRight:b.right};
  });
  assert(layout.gridColumn.includes('1 / -1') || layout.gridColumn.includes('1 / span 2'),
   'mobile toggle must have its own full-width menu row');
  assert(layout.labelHeight<=layout.lineHeight*1.12,
   'mobile toggle label wraps or clips instead of using one readable line');
  assert(layout.labelRight<=layout.buttonRight+1,'mobile toggle label overflows');
 }
 const button=page.locator(selector);
 assert(await button.getAttribute('aria-pressed')===(theme==='dark'?'true':'false'),'incorrect accessible initial state');
 return {browser,context,page,button,selector,issues};
}
for(const profile of profiles){
 const record={profile:profile.name,runs:[]};
 for(const theme of ['light','dark']){
  let env;
  try{
   env=await prepare(profile,theme,profile.record&&theme==='light');
   const {page,button,selector,issues}=env;
   const start=await read(page,selector);
   assert(start.pathCount===915,'original geometry/path count changed');
   assert(start.roles.length===8,'required layer roles missing');
   assert(start.dayClip?.includes('url(#'),'unclipped scenery');
   assert(start.clipStyle&&start.clipStyle!=='none','invalid scene clipping');
   assert(Math.abs(start.svgBox.width-96)<2,'native SVG width wrong');
   assert(Math.abs(start.progress-(theme==='dark'?1:0))<.001,'initial SVG theme flash');
   assert(start.sliderBaseFill===(theme==='dark'?'rgb(138, 80, 59)':'rgb(244, 235, 228)'),
    'Illustrator slider base endpoint wrong: '+start.sliderBaseFill);
   assert(start.sliderGrainFill===(theme==='dark'?'rgb(244, 235, 228)':'rgb(41, 61, 45)'),
    'Illustrator slider grain endpoint wrong: '+start.sliderGrainFill);
   const stateInk=theme==='dark'?'rgb(138, 80, 59)':'rgb(41, 61, 45)';
   assert(start.sunFill===stateInk,'sun ink not using theme palette: '+start.sunFill);
   assert(start.dayInkFill===stateInk,'day ink not using theme palette: '+start.dayInkFill);
   assert(start.outerInkFill===stateInk,'outer pill ink not using theme palette: '+start.outerInkFill);
   assert(start.artworkInk===stateInk,'scoped illustrator ink not using theme palette: '+start.artworkInk);
   await capture(page,profile.name+'-'+theme+'-initial-navbar');
   await button.click({timeout:10000});
   await page.waitForFunction(sel=>{
    const progress=Number(document.querySelector(sel+' svg')?.dataset.toggleProgress);
    return progress>0.04&&progress<0.96;
   },selector,{timeout:1500});
   const middle=await read(page,selector);
   // A separate clock-controlled browser pass captures the true 150ms midpoint.
   await page.waitForTimeout(360);
   const end=await read(page,selector);
   assert(end.progress===(theme==='dark'?0:1),'theme slide did not finish');
   assert(end.sliderBaseFill===(theme==='dark'?'rgb(244, 235, 228)':'rgb(138, 80, 59)'),
    'reversed slider base endpoint wrong: '+end.sliderBaseFill);
   assert(end.artworkInk===(theme==='dark'?'rgb(41, 61, 45)':'rgb(138, 80, 59)'),
    'reversed illustrator ink palette wrong: '+end.artworkInk);
   assert(start.svgBox.x===end.svgBox.x&&start.svgBox.width===end.svgBox.width,'outer pill moved or scaled');
   assert(await button.getAttribute('aria-pressed')===(theme==='dark'?'false':'true'),'ARIA state not updated');
   await capture(page,profile.name+'-'+theme+'-finished-navbar');
   await button.click();
   await page.waitForFunction(sel=>{
    const progress=Number(document.querySelector(sel+' svg')?.dataset.toggleProgress);
    return progress>0.04&&progress<0.96;
   },selector,{timeout:1500});
   // The reverse midpoint is captured in the same deterministic browser pass.
   await page.waitForTimeout(350);
   assert((await read(page,selector)).progress===start.progress,'natural reverse did not finish');
   for(let i=0;i<6;i++){await button.click();await page.waitForTimeout(40);}
   await page.waitForTimeout(380);
   assert((await read(page,selector)).progress===start.progress,'rapid reversals desynchronized artwork');
   assert(env.issues.length===0,'browser errors: '+issues.join(','));
   // Existing saved controller state, not an independently managed toggle.
   const saved=await page.evaluate(()=>localStorage.getItem('chapchitra-color-theme-v1'));
   assert(saved===theme,'manual override did not persist through rapid reversals');
   await page.reload({waitUntil:'domcontentloaded'});
   if(profile.width<=430){await page.locator('#menuButton').click();}
   await page.locator(selector+'[data-art-ready="true"]').waitFor({timeout:30000});
   assert((await read(page,selector)).progress===start.progress,'reload restored incorrect artwork state');
   record.runs.push({theme,passed:true,mid:middle.progress,paths:start.pathCount,clip:start.clipStyle});
   if(profile.record&&theme==='light'){
    await page.waitForTimeout(180);
    // Keep one untouched, continuous recording containing both directions.
    const sourceVideo=page.video();
    await env.context.close();
    if(sourceVideo){const path=await sourceVideo.path();await rename(path,join(OUT,'desktop-chromium-original-toggle-uncut.webm'));}
    await env.browser.close();env=null;
   }
  }catch(error){
   record.runs.push({theme,passed:false,error:String(error)});
   audit.errors.push(profile.name+' '+theme+': '+String(error).slice(0,1000));
  }finally{
   if(env){await env.context.close();await env.browser.close();}
  }
 }
 audit.profiles.push(record);
}

// Capture TRUE rendered mid-transition frames, not synthetic reconstructed art.
// WebKit can jump past the 150ms target when a Playwright Clock is installed
// AFTER page scripts have scheduled rAF work. Arm an in-page rAF barrier instead:
// the production callback runs normally until the controller itself reaches the
// midpoint, then subsequent callbacks are held solely for screenshot acquisition.
// Releasing the barrier lets the original live timeline finish unchanged.
audit.midpoints=[];
async function installLiveFrameHold(page,selector){
 await page.evaluate(sel=>{
  const nativeRaf=window.requestAnimationFrame.bind(window);
  const state={armed:false,paused:false,pending:[],hits:0};
  const progress=()=>Number(document.querySelector(sel+' svg')?.dataset.toggleProgress);
  window.requestAnimationFrame=(callback)=>nativeRaf(time=>{
   if(state.paused){state.pending.push(callback);return;}
   callback(time);
   if(state.armed&&!state.paused){
    const v=progress();
    if(v>=0.30&&v<=0.70){
     state.armed=false;state.paused=true;state.hits++;
    }
   }
  });
  window.__ccFrameHold={
   state,
   arm(){state.armed=true;state.paused=false;state.pending.length=0;},
   release(){
    state.armed=false;state.paused=false;
    for(const callback of state.pending.splice(0))nativeRaf(callback);
   }
  };
 },selector);
}
for(const profile of profiles){
 for(const theme of ['light','dark']){
  let env;
  try{
   env=await prepare(profile,theme,false);
   const {page,button,selector}=env;
   await installLiveFrameHold(page,selector);
   const target=theme==='dark'?0:1;
   const origin=1-target;
   const click=()=>button.evaluate(element=>element.click());
   // 1: Capture a genuinely rendered intermediate light-to-dark or dark-to-light
   // frame. Poll using a timer rather than rAF because the latter is intentionally
   // paused for the still acquisition.
   await page.evaluate(()=>window.__ccFrameHold.arm());
   await click();
   await page.waitForFunction(()=>window.__ccFrameHold?.state.paused===true,
    undefined,{polling:25,timeout:3000});
   const forward=await read(page,selector);
   assert(forward.progress>=.30&&forward.progress<=.70,
    profile.name+' '+theme+' true forward midpoint missing: '+forward.progress);
   await capture(page,profile.name+'-'+theme+'-mid-transition');
   assert(Math.abs((await read(page,selector)).progress-forward.progress)<.01,
    'forward screenshot changed captured live midpoint frame');
   await page.evaluate(()=>window.__ccFrameHold.release());
   await page.waitForFunction(([sel,finish])=>
    Number(document.querySelector(sel+' svg')?.dataset.toggleProgress)===finish,
    [selector,target],{polling:25,timeout:3000});
   // 2: Reverse from a fully settled real endpoint, and capture a new actual
   // WebKit/Chromium animation frame before letting the motion finish.
   await page.evaluate(()=>window.__ccFrameHold.arm());
   await click();
   await page.waitForFunction(()=>window.__ccFrameHold?.state.paused===true,
    undefined,{polling:25,timeout:3000});
   const reverse=await read(page,selector);
   assert(reverse.progress>=.30&&reverse.progress<=.70,
    profile.name+' '+theme+' true reverse midpoint missing: '+reverse.progress);
   await capture(page,profile.name+'-'+theme+'-reverse-mid');
   assert(Math.abs((await read(page,selector)).progress-reverse.progress)<.01,
    'reverse screenshot changed captured live midpoint frame');
   await page.evaluate(()=>window.__ccFrameHold.release());
   await page.waitForFunction(([sel,finish])=>
    Number(document.querySelector(sel+' svg')?.dataset.toggleProgress)===finish,
    [selector,origin],{polling:25,timeout:3000});
   audit.midpoints.push({profile:profile.name,initialTheme:theme,
    forward:forward.progress,reverse:reverse.progress,
    method:'live native rAF capture barrier'});
  }catch(error){
   audit.errors.push('Live midpoint '+profile.name+' '+theme+': '+String(error));
  }finally{
   if(env){await env.context.close();await env.browser.close();}
  }
 }
}

try{
 const browser=await chromium.launch({headless:true,timeout:60000});
 const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:900}});
 const page=await context.newPage();
 await page.goto(ROOT+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#themeToggle[data-art-ready="true"]').waitFor({timeout:30000});
 await page.locator('#themeToggle').click();
 const immediate=(await read(page,'#themeToggle')).progress;
 assert(immediate===1,'reduced-motion must skip timeline and finish synchronously');
 audit.reducedMotion={passed:true,progress:immediate};
 await context.close();await browser.close();
}catch(error){audit.errors.push('reduced-motion: '+String(error));}
await writeFile(join(OUT,'illustrated-toggle-qa.json'),JSON.stringify(audit,null,2));
console.log('ILLUSTRATED_TOGGLE_QA '+JSON.stringify({
 profiles:audit.profiles.map(p=>({name:p.profile,passed:p.runs.filter(x=>x.passed).length,total:p.runs.length})),
 screenshots:audit.screenshots.length,issues:audit.errors,video:'desktop-chromium-original-toggle-uncut.webm'
}));
if(audit.errors.length)process.exitCode=1;
