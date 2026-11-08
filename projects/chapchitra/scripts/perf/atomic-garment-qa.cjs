/* CHAPCHITRA — all 24 garment-color combos, atomic paint race, physical glow. */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const fs=require('fs'),path=require('path');
const NEW=process.env.CC_QA_URL||'http://127.0.0.1:4344/artists-edit/';
const OLD=process.env.CC_BEFORE_URL||'http://127.0.0.1:4333/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/atomic-garment');
fs.mkdirSync(OUT,{recursive:true});
const groups=['garment','size','color','printSize'];
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const colors=['black','white','red','yellow','blue','green'];
const lifts={garment:4.5,size:3.5,color:5.5,printSize:4};
const cases=[],failures=[];
const check=(name,ok,info)=>{const c={name,ok:!!ok};if(info!==undefined)c.info=info;cases.push(c);if(!ok)failures.push(c);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rail=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const prop=(g,v)=>'.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]';
const selectedSurface=page=>page.evaluate(()=>{
 const el=document.querySelector('.cc-worktable-garment-surface');
 if(!el)return null;
 const {width,height}=el;
 const rgba=el.getContext('2d')?.getImageData(Math.floor(width/2),Math.floor(height*.43),1,1).data;
 return {garment:el.dataset.garment,color:el.dataset.color,w:width,h:height,
  rgba:rgba?Array.from(rgba):null,shown:getComputedStyle(el).opacity,
  originalHidden:getComputedStyle(document.querySelector('.cc-worktable-garment')).visibility,
  tintDisplay:getComputedStyle(document.querySelector('.cc-worktable-tint')).display,
  previews:document.querySelectorAll('.cc-worktable-preview').length};
});
async function ready(page,url=NEW,{hydrate=true}={}){
 const t=Date.now();await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:90000});
 const first=Date.now()-t;
 if(hydrate)await page.waitForFunction(()=>!document.querySelector('.cc-worktable').classList.contains('is-hydrating'),null,{timeout:70000});
 return {first,full:Date.now()-t};
}
async function waitSurface(page,garment,color,timeout=35000){
 await page.waitForFunction(([g,c])=>{
  const el=document.querySelector('.cc-worktable-garment-surface');
  return el&&el.dataset.garment===g&&el.dataset.color===c;
 },[garment,color],{timeout});
 return selectedSurface(page);
}
async function selected(page,g,v){
 return page.locator(prop(g,v)).evaluate(el=>{
  const c=getComputedStyle(el);
  return {className:el.className,offset:new DOMMatrixReadOnly(c.transform).m42,filter:c.filter,opacity:c.opacity};
 });
}
async function stable(page,g,v,y){
 try{await page.waitForFunction(([g,v,y])=>{
  const el=document.querySelector('.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]');
  return el&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42-y)<.18;
 },[g,v,y],{timeout:4500,polling:'raf'})}catch{}
}
async function shot(page,name){
 await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,name+'.png'),animations:'disabled'});
}
async function fullMatrix(browser,engine){
 const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const timing=await ready(page);
 check(engine+' initial usable scene <= 8s',timing.first<=8000,timing);
 const combos=[];
 for(const g of garments){
  await page.locator(rail('garment',g)).click();
  for(const c of colors){
   await page.locator(rail('color',c)).click();
   const surface=await waitSurface(page,g,c);
   const cName=engine+' '+g+' '+c;
   check(cName+' surface is fully tinted and single',surface.garment===g&&surface.color===c&&surface.originalHidden==='hidden'&&surface.tintDisplay==='none'&&surface.previews===0,surface);
   check(cName+' garment pixels not transparent',!!surface.rgba&&surface.rgba[3]>=240,surface.rgba);
   if(c!=='white'){
    // A white exposed garment would have all three channels >230.
    check(cName+' first shown frame is not white',!(surface.rgba[0]>230&&surface.rgba[1]>230&&surface.rgba[2]>230),surface.rgba);
   }
   check(cName+' selected rails consistent',await page.locator(rail('garment',g)+'[aria-pressed=true]').count()===1&&await page.locator(rail('color',c)+'[aria-pressed=true]').count()===1);
   combos.push([g,c,surface.rgba]);
  }
 }
 if(engine==='chromium')await shot(page,'after-24-pairs-final-green-hoodie');
 check(engine+' exactly 24 garment/color combinations',combos.length===24,combos.length);
 // "Green Regular Tee → Green Hoodie" canonical owner case; record shape and green pixel in same commit.
 await page.locator(rail('garment','regular')).click();
 await page.locator(rail('color','green')).click();
 await waitSurface(page,'regular','green');
 if(engine==='chromium')await shot(page,'after-green-regular');
 const frames=await page.evaluate(()=>{window.__atomicSnapshots=[];window.__atomicObserver=new MutationObserver(()=>{
  const e=document.querySelector('.cc-worktable-garment-surface');
  const current=document.querySelector('.cc-worktable-choice[data-group=garment][aria-pressed=true]')?.dataset.value;
  const chosen=document.querySelector('.cc-worktable-choice[data-group=color][aria-pressed=true]')?.dataset.value;
  window.__atomicSnapshots.push({visible:e?e.dataset.garment+':'+e.dataset.color:'none',requested:current+':'+chosen,preview:document.querySelector('.cc-worktable-preview')?.dataset.garment||null});
 });window.__atomicObserver.observe(document.querySelector('.cc-worktable-stage'),{subtree:true,childList:true});return true});
 await page.locator(rail('garment','hoodie')).click();
 await waitSurface(page,'hoodie','green');
 const observations=await page.evaluate(()=>{window.__atomicObserver.disconnect();return window.__atomicSnapshots});
 check(engine+' canonical green Hoodie has no white intermediate',!observations.some(x=>x.visible==='hoodie:white'),observations);
 if(engine==='chromium')await shot(page,'after-green-hoodie');
 // Rapid changes: only final token can commit, never the late obsolete choice.
 const rapid=[['garment','dropShoulder'],['color','red'],['garment','fullSleeve'],['color','blue'],['garment','hoodie'],['color','yellow'],['garment','regular'],['color','black'],['garment','hoodie'],['color','green']];
 for(const [g,v] of rapid)await page.locator(rail(g,v)).dispatchEvent('click');
 const final=await waitSurface(page,'hoodie','green');
 await pause(600);
 check(engine+' rapid choices last writer wins',((await selectedSurface(page)).garment==='hoodie')&&((await selectedSurface(page)).color==='green'),final);
 check(engine+' rapid choices still one garment canvas',await page.locator('.cc-worktable-garment-surface').count()===1);
 check(engine+' rapid choices avoid ghost/shadow tint duplication',await page.locator('.cc-worktable-preview').count()===0&&await page.locator('.cc-worktable-garment').evaluate(el=>getComputedStyle(el).visibility)==='hidden');
 check(engine+' page errors',errors.length===0,errors);
 await page.close();return {timing,combos:combos.length};
}
async function glowAndUpload(browser,engine,{touch=false,width=1440}={}){
 const context=await browser.newContext({viewport:{width,height:width===834?1112:width<=390?740:900},hasTouch:touch,isMobile:touch,serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ready(page);
 for(const [g,v,other] of [['garment','dropShoulder','hoodie'],['size','XL','S'],['color','red','blue'],['printSize','A3','A4']]){
  if(touch)await page.locator(rail(g,v)).tap();
  else await page.locator(rail(g,v)).click();
  if(!touch)await page.mouse.move(0,0);
  await stable(page,g,v,-lifts[g]);
  await pause(280);
  const rest=await selected(page,g,v);
  check(engine+' '+width+' '+g+' selected persists after pointer exit',rest.className.includes('is-selected')&&Math.abs(rest.offset+lifts[g])<.22,rest);
  check(engine+' '+width+' '+g+' selected retains approved hover glow',rest.filter.includes('rgba(248, 235, 204, 0.52)'),rest.filter);
  if(!touch){
   await page.locator('.cc-worktable-hit[data-group="'+g+'"][data-value="'+v+'"]').hover();await pause(280);
   const hover=await selected(page,g,v);
   check(engine+' '+width+' '+g+' selected glow EXACT after exit/hover',rest.filter===hover.filter,{rest:rest.filter,hover:hover.filter});
   await page.mouse.move(0,0);await stable(page,g,v,-lifts[g]);await pause(240);
  }
  if(g==='color'){
   const tray=await page.evaluate(()=>{const arr=[...document.querySelectorAll('.cc-worktable-stage>.cc-worktable-layer')];return [arr.findIndex(x=>x.dataset.source==='Tshirt color/Tshirt_color_3.png'),arr.findIndex(x=>x.dataset.source==='Tshirt color/Tshirt_color_box_front_panel.png') ]});
   check(engine+' '+width+' tray foreground remains over selected pot',tray[0]>=0&&tray[1]>tray[0],tray);
   if(engine==='chromium'&&!touch)await shot(page,'after-persistent-red-pot-glow');
  }
  if(touch)await page.locator(rail(g,other)).tap();
  else await page.locator(rail(g,other)).click();
  if(!touch)await page.mouse.move(0,0);
  await stable(page,g,v,0);
  const old=await selected(page,g,v);
  check(engine+' '+width+' '+g+' previous selection returns to rest',Math.abs(old.offset)<.2&&!old.className.includes('is-selected'),old);
 }
 // Old uploaded design remains available while garment/color change atomically.
 const art=await sharp({create:{width:256,height:128,channels:4,background:{r:195,g:49,b:65,alpha:1}}}).png().toBuffer();
 const chooser=page.waitForEvent('filechooser',{timeout:8000});
 if(touch)await page.locator('#worktableUploadArt').tap();
 else await page.locator('#worktableUploadArt').click();
 await (await chooser).setFiles({name:'design.png',mimeType:'image/png',buffer:art});
 await page.getByText('Artwork loaded locally',{exact:false}).waitFor({timeout:10000});
 await page.locator(rail('garment','hoodie')).click();
 await page.locator(rail('color','green')).click();
 await waitSurface(page,'hoodie','green');
 check(engine+' '+width+' user uploaded art remains visible across garment swap',await page.locator('.cc-worktable-print.has-art img[src^=blob]').count()===1);
 check(engine+' '+width+' size/reset/remove controls still enabled',await page.locator('#worktableArtScale').isEnabled()&&await page.locator('#worktableResetArt').isEnabled()&&await page.locator('#worktableRemoveArt').isEnabled());
 check(engine+' '+width+' one unchanged inline SVG upload',await page.locator('.cc-worktable-upload-svg-layer svg').count()===1);
 check(engine+' '+width+' no page errors',errors.length===0,errors);
 check(engine+' '+width+' no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 await context.close();
}
async function progressiveHydration(browser){
 const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const issues=[];page.on('pageerror',e=>issues.push(e.message));
 // Force most cropped layers to decode late. Backplate + garment/worker may
 // complete while unrelated detail layers continue hydrating.
 let late=0;
 await page.route('**/assets/worktable/variants/**',async route=>{
  const u=route.request().url();
  if(!u.includes('/preview/')&&!u.includes('/Tshirts/')&&!u.includes('/Worker/')&&late++<27)await pause(900);
  await route.continue();
 });
 const started=await ready(page,NEW,{hydrate:false});
 check('early scene available before all cropped layers',await page.locator('.cc-worktable.is-hydrating').count()===1,started);
 await page.locator(rail('color','green')).click();
 await page.locator(rail('garment','hoodie')).click();
 await page.waitForFunction(()=>document.querySelector('.cc-worktable-preview')?.dataset.garment==='hoodie'&&document.querySelector('.cc-worktable-preview')?.dataset.color==='green',null,{timeout:55000});
 const before=await page.evaluate(()=>({hyd:document.querySelector('.cc-worktable').classList.contains('is-hydrating'),preview:document.querySelector('.cc-worktable-preview')?.dataset,
  garment:document.querySelector('.cc-worktable-garment-surface')?.dataset.garment,color:document.querySelector('.cc-worktable-garment-surface')?.dataset.color}));
 check('early stage swapped only complete green Hoodie preview',before.hyd&&before.preview.garment==='hoodie'&&before.preview.color==='green',before);
 await shot(page,'during-hydration-green-hoodie');
 // Change both after a completed preview, while remaining layers may decode.
 await page.locator(rail('garment','fullSleeve')).click();
 await page.locator(rail('color','red')).click();
 await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.garment==='fullSleeve'&&document.querySelector('.cc-worktable-garment-surface')?.dataset.color==='red',null,{timeout:50000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable').classList.contains('is-hydrating'),null,{timeout:70000});
 const done=await selectedSurface(page);
 check('hydration handoff preserves latest red Full Sleeve, not stale white',done.color==='red'&&done.garment==='fullSleeve'&&done.previews===0,done);
 check('hydration no JS errors',issues.length===0,issues);
 await page.close();
}
async function recordings(){
 const recordDir=path.join(OUT,'raw-recordings');fs.mkdirSync(recordDir,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const [url,label] of [[OLD,'before-old-css-tint'],[NEW,'after-atomic-composite']]){
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:recordDir,size:{width:1440,height:900}},serviceWorkers:'block'});
  const page=await context.newPage();
  await ready(page,url);
  await pause(350);
  await page.locator(rail('color','green')).click();await pause(950);
  await page.locator(rail('garment','hoodie')).click();
  if(label.startsWith('after'))await waitSurface(page,'hoodie','green');
  await pause(1250);
  await page.locator(rail('garment','dropShoulder')).click();
  if(label.startsWith('after'))await waitSurface(page,'dropShoulder','green');
  await pause(950);
  const video=page.video();
  await context.close();
  const p=await video.path();
  const dest=path.join(OUT,label+'.webm');
  fs.copyFileSync(p,dest);
  check('recording '+label+' captured',fs.statSync(dest).size>30000,fs.statSync(dest).size);
 }
 await browser.close();
}
(async()=>{
 const options={headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']};
 const chrome=await chromium.launch(options);
 const web=await webkit.launch({headless:true});
 await fullMatrix(chrome,'chromium');
 await fullMatrix(web,'webkit');
 await glowAndUpload(chrome,'chromium');
 await glowAndUpload(web,'webkit');
 await glowAndUpload(chrome,'chromium-tablet',{touch:true,width:834});
 await glowAndUpload(chrome,'chromium-mobile',{touch:true,width:390});
 await glowAndUpload(web,'webkit-mobile',{touch:true,width:390});
 await progressiveHydration(chrome);
 await chrome.close();await web.close();
 await recordings();
 const report={candidate:NEW,baseline:OLD,total:cases.length,passed:cases.filter(x=>x.ok).length,failed:failures.length,failures,cases};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:report.failures},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('QA CRASH',e);process.exitCode=3});
