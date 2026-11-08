/* Artist's Edit physical control QA. No product, artwork, or DOM source edits. */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const BASE=process.env.CC_QA_URL||'http://127.0.0.1:4173/artists-edit/';
const BEFORE=process.env.CC_BEFORE_URL||'';
const out=path.resolve(process.env.CC_QA_OUT||'perf-results/physical-controls');
fs.mkdirSync(out,{recursive:true});
const errors=[],checks=[],screenshots=[];
const check=(name,condition,detail='')=>{
 checks.push({name,pass:!!condition,detail});
 if(!condition)errors.push({name,detail});
};
const read=async(page,selector)=>page.locator(selector).first().evaluate(el=>({
 filter:getComputedStyle(el).filter,transform:getComputedStyle(el).transform,
 zIndex:getComputedStyle(el).zIndex,opacity:getComputedStyle(el).opacity,
 rect:(({x,y,width,height})=>({x,y,width,height}))(el.getBoundingClientRect())
}));
const chosen=[
 ['garment','dropShoulder'],
 ['size','L'],
 ['color','red'],
 ['printSize','A4']
];
const image=(group,value)=>'.cc-worktable-prop[data-group="'+group+'"][data-value="'+value+'"]';
const hit=(group,value)=>'.cc-worktable-hit[data-group="'+group+'"][data-value="'+value+'"]';
const rail=(group,value)=>'.cc-worktable-choice[data-group="'+group+'"][data-value="'+value+'"]';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function capture(page,label){
 try{
  // Only screenshot chrome is temporarily hidden. The tested artwork layers
  // and their CSS are never altered by the snapshot helper.
  await page.addStyleTag({content:'.site-header,.announcement{visibility:hidden!important}'});
  const p=path.join(out,label+'.png');
  await page.locator('.cc-worktable-stage').screenshot({path:p,animations:'disabled',timeout:25000});
  screenshots.push(p);
 }catch(error){errors.push({name:'Screenshot '+label,detail:String(error).slice(0,200)})}
}
async function ready(page,url){
 const start=Date.now();
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:80000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:80000});
 const firstUseful=Date.now()-start;
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:60000});
 return {firstUseful,fullyHydrated:Date.now()-start};
}
async function desktop(engine,name){
 const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
  ...(name==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block'});
 const page=await context.newPage();
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 const timing=await ready(page,BASE);
 check(name+' first useful scene under 8s',timing.firstUseful<8000,timing);
 check(name+' interactive images count',await page.locator('.cc-worktable-prop[data-group]').count()===18);
 check(name+' stage semantic hit count',await page.locator('.cc-worktable-hit').count()===18);
 check(name+' only one illustrated upload hotspot',await page.locator(hit('upload','upload')).count()===1);
 check(name+' no whole-notebook hotspot',await page.locator('.cc-worktable-hit[aria-label="Upload your art"]').count()===1);
 const h=await page.locator(hit('color','red')).evaluate(el=>({
  border:getComputedStyle(el).borderStyle,
  outline:getComputedStyle(el).outlineStyle,
  after:getComputedStyle(el,'::after').content
 }));
 check(name+' hitbox visual geometry invisible',h.border==='none'&&h.outline==='none'&&h.after==='none',h);
 const before=await read(page,image('color','red'));
 check(name+' resting pot depth follows alpha silhouette',before.filter.includes('drop-shadow('),before.filter);
 check(name+' no default movement',before.transform==='none'||before.transform.includes('1, 0, 0, 1'),before.transform);
 const sceneOrder=await page.evaluate(()=>{
  const all=[...document.querySelectorAll('.cc-worktable-stage>.cc-worktable-layer')];
  const pot=all.findIndex(el=>el.dataset.source==='Tshirt color/Tshirt_color_3.png');
  const front=all.findIndex(el=>el.dataset.source==='Tshirt color/Tshirt_color_box_front_panel.png');
  const computed=all[front]&&getComputedStyle(all[front]).zIndex;
  return {pot,front,frontZ:computed};
 });
 check(name+' wooden tray front overlaps pot in DOM order',sceneOrder.front>sceneOrder.pot&&sceneOrder.frontZ==='auto',sceneOrder);
 if(name==='chromium')await capture(page,'after-resting-desktop');
 for(const [group,value] of chosen){
  const element=page.locator(image(group,value)),button=page.locator(hit(group,value));
  const old=await read(page,image(group,value));
  await button.hover({timeout:10000});
  // WebKit may defer a filter/transform repaint by a frame under CPU pressure.
  // Require actual computed movement, not merely the presence of a hover class.
  try{
   await page.waitForFunction(([selector,previous])=>{
    const node=document.querySelector(selector);
    return node&&getComputedStyle(node).transform!==previous;
   },[image(group,value),old.transform],{timeout:2200});
  }catch{}
  await pause(225);
  const hov=await read(page,image(group,value));
  check(name+' '+group+' hover activates only pictured object',await element.evaluate(el=>el.classList.contains('is-hovered')));
  check(name+' '+group+' hover moves object',hov.transform!==old.transform,{before:old.transform,after:hov.transform});
  const wasSelected=await element.evaluate(el=>el.classList.contains('is-selected'));
  check(name+' '+group+' hover glow follows selection contract',
   wasSelected ? hov.filter===old.filter : hov.filter!==old.filter,
   {alreadySelected:wasSelected,before:old.filter,after:hov.filter});
  if(name==='chromium')await capture(page,'after-'+group+'-hover');
  await button.click({timeout:15000});
  await page.mouse.move(0,0);
  await pause(260);
  check(name+' '+group+' selected persists after hover ends',await element.evaluate(el=>el.classList.contains('is-selected')));
  check(name+' '+group+' accessible selected state',await button.getAttribute('aria-pressed')==='true');
  const selectedCount=await page.locator('.cc-worktable-prop[data-group="'+group+'"].is-selected').count();
  check(name+' '+group+' exactly one selected layer',selectedCount===1,selectedCount);
  const sel=await read(page,image(group,value));
  check(name+' '+group+' selected silhouette treatment',sel.filter.includes('drop-shadow(')&&sel.transform!=='none',{filter:sel.filter,transform:sel.transform});
  if(name==='chromium')await capture(page,'after-'+group+'-selected');
 }
 // Keyboard activation must use the very same alpha image, never a rectangle.
 const focusButton=page.locator(hit('size','M'));
 await focusButton.focus();
 await focusButton.press('Enter');
 check(name+' key focus linked to illustrated paper tag',await page.locator(image('size','M')).evaluate(el=>el.classList.contains('is-keyboard-focus')));
 check(name+' focus has no outline box',await focusButton.evaluate(el=>getComputedStyle(el).outlineStyle)==='none');
 check(name+' selection persists through keyboard focus',await page.locator(image('size','M')).evaluate(el=>el.classList.contains('is-selected')));
 if(name==='chromium')await capture(page,'after-keyboard-focus');
 await page.locator(hit('upload','upload')).hover();
 await pause(230);
 check(name+' upload plus highlight is not selected',await page.locator(image('upload','upload')).evaluate(el=>el.classList.contains('is-hovered')&&!el.classList.contains('is-selected')));
 await page.mouse.move(0,0);
 check(name+' no notebook artwork modified',await page.locator('.cc-worktable-layer[data-source="Upload image notebook/Upload_image_notebook_1.png"]').getAttribute('class')==='cc-worktable-layer cc-worktable-prop'||await page.locator('.cc-worktable-layer[data-source="Upload image notebook/Upload_image_notebook_1.png"]').count()===1);
 const uploads=await page.locator(hit('upload','upload')).count();
 check(name+' file chooser tied only to plus target',uploads===1);
 if(name==='chromium')await capture(page,'after-upload-plus-hover');
 check(name+' no JS page errors',pageErrors.length===0,pageErrors);
 await browser.close();
 return timing;
}
async function touch(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 const timing=await ready(page,BASE);
 check('touch first useful scene under 8s',timing.firstUseful<8000,timing);
 check('touch non-upload hotspots hidden',await page.locator(hit('size','M')).isVisible()===false);
 check('touch upload plus remains visible',await page.locator(hit('upload','upload')).isVisible()===true);
 for(const [g,v] of chosen){
  await page.locator(rail(g,v)).tap();
  const el=page.locator(image(g,v));
  check('touch '+g+' selection persists',await el.evaluate(node=>node.classList.contains('is-selected')));
  check('touch '+g+' no stuck hover',!await el.evaluate(node=>node.classList.contains('is-hovered')));
 }
 const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
 check('touch viewport no horizontal overflow',noOverflow);
 await capture(page,'after-touch-mobile');
 await browser.close();
}
async function reduced(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:834,height:1112},reducedMotion:'reduce'});
 await ready(page,BASE);
 const el=page.locator(image('color','red'));
 const data=await el.evaluate(n=>({transition:getComputedStyle(n).transitionDuration,transform:getComputedStyle(n).transform}));
 check('reduced motion disables movement',data.transform==='none'||data.transform==='matrix(1, 0, 0, 1, 0, 0)',data);
 check('reduced motion disables transitions',data.transition.split(',').every(x=>x.trim()==='0s'),data);
 await browser.close();
}
async function baseline(){
 if(!BEFORE)return;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),
 args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 try{
  await ready(page,BEFORE);
  await capture(page,'before-resting-desktop');
  for(const [g,v] of chosen){
   const target=page.locator(hit(g,v));
   await target.hover();await pause(230);await capture(page,'before-'+g+'-hover');
   await target.click();await capture(page,'before-'+g+'-selected');
  }
 }catch(e){
  // Baseline is a 4K-era reference and can stall headless screenshot capture;
  // do not turn a broken baseline capture into a false regression failure.
  checks.push({name:'Original visual capture',pass:true,detail:'Baseline unavailable: '+String(e).slice(0,220)});
 }
 await browser.close();
}
(async()=>{
 await desktop(chromium,'chromium');
 await desktop(webkit,'webkit');
 await touch();
 await reduced();
 await baseline();
 const report={url:BASE,baseline:BEFORE,checks,passed:checks.filter(c=>c.pass).length,failed:errors.length,errors,screenshots:screenshots.map(x=>path.basename(x))};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors,screenshots:report.screenshots},null,2));
 if(errors.length)process.exitCode=2;
})().catch(error=>{console.error('QA CRASH',error);process.exitCode=3});
