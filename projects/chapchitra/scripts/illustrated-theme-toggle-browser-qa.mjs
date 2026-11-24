/* Independent exact-owner SVG toggle review in isolated PR Chromium/WebKit.
 * The staging push also runs against LIVE Render only AFTER the exact public
 * release-marker SHA is verified by the integration runner.
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
const audit={source:'Owner Illustrator exact master, no raster replacement',
 mode:ROOT.startsWith('https://chapchitra-webanimation.onrender.com')?
  'LIVE Render staging public URL':'isolated PR build, NOT deployed',
 screenshots:[],profiles:[],errors:[]};
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
  buttonBox:svg.closest('button').getBoundingClientRect().toJSON(),
  sliderTransform:svg.querySelector('[data-toggle-role=slider]').getAttribute('transform'),
  sliderBaseFill:getComputedStyle(svg.querySelector('[id$="sliding-circle-inside-fill"] g > path')).fill,
  sliderGrainFill:getComputedStyle(svg.querySelector('[id$="sliding-circle-inside-fill"] > g:nth-child(2)')).fill,
  sunFill:getComputedStyle(svg.querySelector('[data-toggle-role="sun"] path')).fill,
  dayInkFill:getComputedStyle(svg.querySelector('[data-toggle-role="day"] .st1')).fill,
  outerInkFill:getComputedStyle(svg.querySelector('[id$="pill-outer-outline"] .st1')).fill,
  artworkInk:getComputedStyle(svg).getPropertyValue('--cc-toggle-ink').trim(),
  artworkPaper:getComputedStyle(svg).getPropertyValue('--cc-toggle-paper').trim(),
  moonCircleFill:getComputedStyle(svg.querySelector('[data-toggle-role="moon"] [id$="Moon-circle"] .st1')).fill,
  moonCrescentFill:getComputedStyle(svg.querySelector('[data-toggle-role="moon"] [id$="Moon-shape"] .st0')).fill,
  bagBadgeBackground:getComputedStyle(document.querySelector('#app > .site-header .bag-count')).backgroundColor,
  mountainFill:getComputedStyle(svg.querySelector('[id$="cc-mountain-solid-fill"]')).fill,
  mountainDetails:getComputedStyle(svg.querySelector('.cc-mountain-negative-details path.st1')).fill
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
   assert(start.pathCount===916,'original geometry/path count plus one mountain background changed');
   assert(start.roles.length===8,'required layer roles missing');
   assert(start.dayClip?.includes('url(#'),'unclipped scenery');
   assert(start.clipStyle&&start.clipStyle!=='none','invalid scene clipping');
   assert(Math.abs(start.svgBox.width-96)<2,'native SVG width wrong');
   assert(Math.abs(start.progress-(theme==='dark'?1:0))<.001,'initial SVG theme flash');
   assert(start.sliderBaseFill===(theme==='dark'?'rgb(244, 235, 228)':'rgb(246, 247, 245)'),
    'Illustrator slider base endpoint wrong: '+start.sliderBaseFill);
   assert(start.sliderGrainFill===(theme==='dark'?'rgb(138, 80, 59)':'rgb(41, 61, 45)'),
    'Illustrator slider grain endpoint wrong: '+start.sliderGrainFill);
   const stateInk=theme==='dark'?'rgb(138, 80, 59)':'rgb(41, 61, 45)';
   assert(start.sunFill===stateInk,'sun ink not using theme palette: '+start.sunFill);
   assert(start.dayInkFill===stateInk,'day ink not using theme palette: '+start.dayInkFill);
   assert(start.outerInkFill===stateInk,'outer pill ink not using theme palette: '+start.outerInkFill);
   assert(start.artworkInk===stateInk,'scoped illustrator ink not using theme palette: '+start.artworkInk);
    assert(start.mountainFill===stateInk,'mountain silhouette fill not using theme ink: '+start.mountainFill);
    const paperInk=theme==='dark'?'rgb(244, 235, 228)':'rgb(246, 247, 245)';
    assert(start.artworkPaper===paperInk,'paper light Gallery White / dark Cream incorrect: '+start.artworkPaper);
    assert(start.mountainDetails===paperInk,
      'original mountain relief paths not preserving inverse paper color: '+start.mountainDetails);
    assert(start.moonCircleFill===paperInk,'moon disc must not conceal Cream slider fill: '+start.moonCircleFill);
    assert(start.moonCrescentFill===stateInk,'crescent should use state ink against light paper: '+start.moonCrescentFill);
    // Owner rejected only the DARK rectangular backplate; light artwork is final.
    if(theme==='dark')assert(
      start.bagBadgeBackground==='rgba(0, 0, 0, 0)'||start.bagBadgeBackground==='transparent',
      'dark bag numeral must have no rectangular backdrop: '+start.bagBadgeBackground);
   await capture(page,profile.name+'-'+theme+'-initial-navbar');
   await button.click({timeout:10000});
   // WebKit may deliver its 300ms animation in only one or two visible
   // frames. The separately clock-held browser pass below verifies the TRUE
   // 150ms rendered midpoint; this natural-playback gate verifies completion.
   await page.waitForFunction(([sel,finish])=>
    Number(document.querySelector(sel+' svg')?.dataset.toggleProgress)===finish,
    [selector,theme==='dark'?0:1],{timeout:3500});
   const settled=await read(page,selector);
   const end=await read(page,selector);
   assert(end.progress===(theme==='dark'?0:1),'theme slide did not finish');
   assert(end.sliderBaseFill===(theme==='dark'?'rgb(246, 247, 245)':'rgb(244, 235, 228)'),
    'reversed slider base endpoint wrong: '+end.sliderBaseFill);
   assert(end.artworkInk===(theme==='dark'?'rgb(41, 61, 45)':'rgb(138, 80, 59)'),
    'reversed illustrator ink palette wrong: '+end.artworkInk);
   // Outer Illustrator geometry must stay fixed *inside its own control*.
   // The approved desktop/tablet theme changes the size of OTHER nav icon
   // hitboxes, shifting the whole nav action group by exactly 12px.
   // Requiring unchanged viewport X confuses that preexisting layout with
   // movement of the artwork; enforce both constraints independently.
   const localX=(frame)=>frame.svgBox.x-frame.buttonBox.x;
   assert(Math.abs(localX(start)-localX(end))<0.8&&
    Math.abs(start.svgBox.width-end.svgBox.width)<0.8,
    'Illustrator pill shifted or scaled relative to its unchanged button');
   const expectedGroupDelta=profile.width<=430?0:(theme==='dark'?-12:12);
   const groupDelta=end.buttonBox.x-start.buttonBox.x;
   assert(Math.abs(groupDelta-expectedGroupDelta)<1,
    'Theme-specific approved navbar action geometry changed: '+
     JSON.stringify({observed:groupDelta,expected:expectedGroupDelta}));
   assert(await button.getAttribute('aria-pressed')===(theme==='dark'?'false':'true'),'ARIA state not updated');
   await capture(page,profile.name+'-'+theme+'-finished-navbar');
   await button.click();
   await page.waitForFunction(([sel,finish])=>
    Number(document.querySelector(sel+' svg')?.dataset.toggleProgress)===finish,
    [selector,theme==='dark'?1:0],{timeout:3500});
   // Reverse midpoint is independently verified below with a real paused
   // frame, not inferred from a nondeterministic requestAnimationFrame race.
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
   record.runs.push({theme,passed:true,forwardSettled: settled.progress,paths:start.pathCount,clip:start.clipStyle});
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

// Capture the TRUE production SVG at its 150ms midpoint, without inventing
// shapes or modifying any app/source animation. The previous native rAF
// barrier was armed after the browser had already scheduled frames. WebKit
// could jump past its 300ms window on a busy CI host, leading to false fails.
//
// Instead, intercept only the TEST PAGE's queued requestAnimationFrame calls
// immediately before the click. Invoke the exact original controller's tick
// with a deterministically advanced 150ms timestamp. The real DOM/SVG is
// painted by Chromium/WebKit; temporarily queue the following callbacks while
// taking the real browser screenshot. Then advance to the true endpoint and
// restore native requestAnimationFrame. No synthetic paths, colours, CSS,
// production clock changes, or artificial motion frames are added to the app.
audit.midpoints=[];
async function installDeterministicFrameAdvance(page){
 await page.evaluate(()=>{
  const nativeRaf=window.requestAnimationFrame.bind(window);
  let pending=[],origin=0,sequence=0;
  const frameAt=ms=>{
   const callbacks=pending.splice(0);
   for(const callback of callbacks)callback(origin+ms);
   return callbacks.length;
  };
  window.__ccFrameAdvance={
   armAndClick(sel){
    origin=performance.now();pending.length=0;
    window.requestAnimationFrame=callback=>{
     pending.push(callback);return 0x70000000+(++sequence);
    };
    document.querySelector(sel).click();
   },
   frameAt,
   release(){
    window.requestAnimationFrame=nativeRaf;
    for(const callback of pending.splice(0))nativeRaf(callback);
   }
  };
 });
}
for(const profile of profiles){
 for(const theme of ['light','dark']){
  let env;
  try{
   env=await prepare(profile,theme,false);
   const {page,selector}=env;
   await installDeterministicFrameAdvance(page);
   const target=theme==='dark'?0:1;
   const origin=1-target;
   const advance=()=>page.evaluate(sel=>{
    const clock=window.__ccFrameAdvance;
    clock.armAndClick(sel);
    return clock.frameAt(150);
   },selector);
   const finish=()=>page.evaluate(()=>{
    const clock=window.__ccFrameAdvance;
    const n=clock.frameAt(330);
    clock.release();
    return n;
   });
   // Forward: actual production code, with an explicitly controlled
   // 150ms animation-clock sample and a stable real rendered SVG frame.
   assert((await advance())>0,'no forward owner-timeline frame scheduled');
   const forward=await read(page,selector);
   assert(forward.progress>=.30&&forward.progress<=.70,
    profile.name+' '+theme+' true forward midpoint missing: '+forward.progress);
   await capture(page,profile.name+'-'+theme+'-mid-transition');
   assert(Math.abs((await read(page,selector)).progress-forward.progress)<.01,
    'forward screenshot changed captured live midpoint frame');
   await finish();
   await page.waitForFunction(([sel,endpoint])=>
    Number(document.querySelector(sel+' svg')?.dataset.toggleProgress)===endpoint,
    [selector,target],{polling:25,timeout:3000});
   // Reverse: same exact original SVG/tick on its way back, no fabricated
   // reverse shapes or copied first-frame screenshots.
   assert((await advance())>0,'no reverse owner-timeline frame scheduled');
   const reverse=await read(page,selector);
   assert(reverse.progress>=.30&&reverse.progress<=.70,
    profile.name+' '+theme+' true reverse midpoint missing: '+reverse.progress);
   await capture(page,profile.name+'-'+theme+'-reverse-mid');
   assert(Math.abs((await read(page,selector)).progress-reverse.progress)<.01,
    'reverse screenshot changed captured live midpoint frame');
   await finish();
   await page.waitForFunction(([sel,endpoint])=>
    Number(document.querySelector(sel+' svg')?.dataset.toggleProgress)===endpoint,
    [selector,origin],{polling:25,timeout:3000});
   audit.midpoints.push({profile:profile.name,initialTheme:theme,
    forward:forward.progress,reverse:reverse.progress,
    method:'real Chromium/WebKit SVG render at deterministic native owner tick 150ms'});
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
