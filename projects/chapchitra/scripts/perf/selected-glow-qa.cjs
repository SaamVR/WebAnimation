/* Browser-gated selected glow regression — CSS only, no app changes. */
const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const OLD=process.env.CC_BEFORE_URL||'http://127.0.0.1:4317/artists-edit/';
const NEW=process.env.CC_QA_URL||'http://127.0.0.1:4321/artists-edit/';
const ROOT=path.resolve(process.env.CC_QA_OUT||'perf-results/selected-glow');
fs.mkdirSync(ROOT,{recursive:true});
const cases=[['garment','dropShoulder','hoodie',4.5],['size','XL','S',3.5],['color','red','blue',5.5],['printSize','A3','A4',4]];
const results=[],errors=[];
const check=(name,ok,info)=>{results.push({name,ok,info});if(!ok)errors.push({name,info})};
const selector=(g,v)=>'.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]';
const hit=(g,v)=>'.cc-worktable-hit[data-group="'+g+'"][data-value="'+v+'"]';
const rail=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function state(page,g,v){
 return page.locator(selector(g,v)).evaluate(el=>{
  const c=getComputedStyle(el);
  return {filter:c.filter,transform:c.transform,y:new DOMMatrixReadOnly(c.transform).m42,
   opacity:c.opacity,selected:el.classList.contains('is-selected'),hovered:el.classList.contains('is-hovered')};
 });
}
async function settle(page,g,v,y){
 try{await page.waitForFunction(([g,v,y])=>{
  const el=document.querySelector('.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]');
  return el&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42-y)<.18;
 },[g,v,y],{polling:'raf',timeout:4000})}catch{}
}
async function ready(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:70000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:60000});
}
async function engine(type,label,config={}){
 const browser=await type.launch({headless:true,...(label.startsWith('chromium')&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(label.startsWith('chromium')?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const context=await browser.newContext({viewport:{width:config.width||1440,height:config.height||900},hasTouch:!!config.touch,isMobile:!!config.touch,serviceWorkers:'block'});
 const page=await context.newPage();const browserErrors=[];
 page.on('pageerror',e=>browserErrors.push(e.message));
 await ready(page,NEW);
 const backdrop=await page.locator('.cc-worktable-stage').evaluate(el=>getComputedStyle(el).backgroundImage);
 const isTouch=!!config.touch;
 for(const [g,v,other,lift] of cases){
  // Test an unselected image: the resting state must not receive the new cream halo.
  const original=await state(page,g,v);
  check(label+' '+g+' resting no selected glow',!original.filter.includes('4.6px)')||!original.filter.includes('248, 237, 214'),original.filter);
  if(!isTouch){
   await page.locator(hit(g,v)).hover();
   await settle(page,g,v,g==='size'?-1.5:-2);
   const newHover=await state(page,g,v);
   check(label+' '+g+' approved nonselected hover intact',newHover.hovered&& !newHover.filter.includes('rgba(248, 237, 214, 0.32)'),newHover);
   await page.locator(hit(g,v)).click();
   await page.mouse.move(0,0);
  }else{
   await page.locator(rail(g,v)).tap();
  }
  await settle(page,g,v,-lift);
  // The CSS transform and filter are independent 190ms transitions. WebKit
  // can settle the translation before the alpha-shadow interpolation finishes.
  await page.waitForFunction(([group,value])=>{
   const el=document.querySelector('.cc-worktable-prop[data-group="'+group+'"][data-value="'+value+'"]');
   const f=el?getComputedStyle(el).filter:'';
   return f.includes('rgba(248, 237, 214, 0.32)')&&f.includes('rgba(255, 249, 232, 0.66)');
  },[g,v],{polling:'raf',timeout:5000}).catch(()=>{});
  const selected=await state(page,g,v);
  check(label+' '+g+' selected persists after pointer exit',selected.selected&&!selected.hovered&&Math.abs(selected.y+lift)<.2,selected);
  check(label+' '+g+' selected uses only cream alpha glow',selected.filter.includes('rgba(248, 237, 214, 0.32)')&&selected.filter.includes('rgba(255, 249, 232, 0.66)'),selected.filter);
  check(label+' '+g+' only one selected',await page.locator('.cc-worktable-prop[data-group="'+g+'"].is-selected').count()===1);
  if(g==='color'){
   const tray=await page.evaluate(()=>{
    const all=[...document.querySelectorAll('.cc-worktable-stage>.cc-worktable-layer')];
    const pot=all.findIndex(el=>el.dataset.source==='Tshirt color/Tshirt_color_3.png');
    const front=all.findIndex(el=>el.dataset.source==='Tshirt color/Tshirt_color_box_front_panel.png');
    return {pot,front,z:front>=0?getComputedStyle(all[front]).zIndex:null};
   });
   check(label+' paint tray front still in front',tray.pot>=0&&tray.front>tray.pot&&tray.z==='auto',tray);
   if(label==='chromium-desktop')await page.locator('.cc-worktable-stage').screenshot({path:path.join(ROOT,'after-red-pot-selected-exit.png'),animations:'disabled'});
  }
  if(isTouch)await page.locator(rail(g,other)).tap();else await page.locator(rail(g,other)).click();
  if(!isTouch)await page.mouse.move(0,0);
  await Promise.all([settle(page,g,v,0),settle(page,g,other,-lift)]);
  const old=await state(page,g,v),next=await state(page,g,other);
  check(label+' '+g+' deselected returns to rest',!old.selected&&Math.abs(old.y)<.2&&!old.filter.includes('rgba(248, 237, 214, 0.32)'),old);
  check(label+' '+g+' replacement retains glow',next.selected&&Math.abs(next.y+lift)<.2&&next.filter.includes('rgba(248, 237, 214, 0.32)'),next);
 }
 check(label+' no page errors',browserErrors.length===0,browserErrors);
 check(label+' no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 check(label+' image manifest first stage intact',await page.locator('.cc-worktable-stage').count()===1,backdrop);
 await browser.close();
}
async function hoverParity(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const old=await browser.newPage({viewport:{width:1440,height:900}}),next=await browser.newPage({viewport:{width:1440,height:900}});
 await Promise.all([ready(old,OLD),ready(next,NEW)]);
 const screenshot=async(page,file)=>{await page.locator('.cc-worktable-stage').screenshot({path:path.join(ROOT,file+'.png'),animations:'disabled'});};
 const selected=async(page)=>{await page.locator(rail('color','red')).click();await page.mouse.move(0,0);await settle(page,'color','red',-5.5);};
 await Promise.all([selected(old),selected(next)]);
 const oldSel=await state(old,'color','red'),newSel=await state(next,'color','red');
 check('before vs after red pot lift preserved',Math.abs(oldSel.y+5.5)<.2&&Math.abs(newSel.y+5.5)<.2,{old:oldSel.y,new:newSel.y});
 check('old selected filter differs only in cream glow',oldSel.filter!==newSel.filter&&newSel.filter.includes('rgba(248, 237, 214, 0.32)'),{old:oldSel.filter,new:newSel.filter});
 await screenshot(old,'before-red-pot-selected-exit');
 await screenshot(next,'after-red-pot-selected-exit');
 // All approved hover filters must be byte-identical when images are not selected.
 for(const [g,v] of [['garment','dropShoulder'],['size','XL'],['color','yellow'],['printSize','A3'],['upload','upload']]){
  await old.locator(hit(g,v)).hover();await next.locator(hit(g,v)).hover();
  await pause(260);
  const left=await state(old,g,v),right=await state(next,g,v);
  check('approved hover identical baseline/changed: '+g,left.filter===right.filter&&Math.abs(left.y-right.y)<.01,{old:left,new:right});
  await old.mouse.move(0,0);await next.mouse.move(0,0);
 }
 // Same crop coordinates; unselected paints and original front panel must remain.
 const before=path.join(ROOT,'before-red-pot-selected-exit.png'),after=path.join(ROOT,'after-red-pot-selected-exit.png');
 const m=await sharp(before).metadata();
 const region={left:Math.round(m.width*.035),top:Math.round(m.height*.675),width:Math.round(m.width*.193),height:Math.round(m.height*.28)};
 const a=await sharp(before).extract(region).resize({width:800}).png().toBuffer();
 const b=await sharp(after).extract(region).resize({width:800}).png().toBuffer();
 const mm=await sharp(a).metadata();
 await sharp({create:{width:1600,height:mm.height,channels:4,background:'#fff'}}).composite([{input:a,left:0,top:0},{input:b,left:800,top:0}]).webp({quality:91,effort:5}).toFile(path.join(ROOT,'compare-selected-glow-pot.webp'));
 // Also full desk side-by-side, with no changes to layout, behind the art.
 const A=await sharp(before).webp({quality:85}).toBuffer(),B=await sharp(after).webp({quality:85}).toBuffer();
 await sharp({create:{width:m.width*2,height:m.height,channels:4,background:'#fff'}}).composite([{input:A,left:0,top:0},{input:B,left:m.width,top:0}]).webp({quality:85,effort:5}).toFile(path.join(ROOT,'compare-selected-glow-full-stage.webp'));
 // Owner review composition: one selected object in each of the four groups.
 // Use the manual rail to preserve the approved control paths and transitions.
 const choices=[['garment','dropShoulder',4.5],['size','XL',3.5],['color','red',5.5],['printSize','A3',4]];
 for(const page of [old,next]){
  for(const [g,v,lift] of choices){
   await page.locator(rail(g,v)).click();await page.mouse.move(0,0);await settle(page,g,v,-lift);
  }
  await pause(350);
 }
 for(const [g,v,lift] of choices){
  const s=await state(next,g,v);
  check('owner all-selected preview '+g+' keeps lifted glow',s.selected&&!s.hovered&&Math.abs(s.y+lift)<.2&&s.filter.includes('rgba(248, 237, 214, 0.32)'),s);
 }
 await screenshot(old,'before-four-groups-selected');
 await screenshot(next,'after-four-groups-selected');
 const AA=await sharp(path.join(ROOT,'before-four-groups-selected.png')).webp({quality:86}).toBuffer();
 const BB=await sharp(path.join(ROOT,'after-four-groups-selected.png')).webp({quality:86}).toBuffer();
 await sharp({create:{width:m.width*2,height:m.height,channels:4,background:'#fff'}}).composite([{input:AA,left:0,top:0},{input:BB,left:m.width,top:0}]).webp({quality:87,effort:5}).toFile(path.join(ROOT,'compare-glow-four-groups-selected.webp'));
 await browser.close();
}
(async()=>{
 await engine(chromium,'chromium-desktop',{width:1440});
 await engine(webkit,'webkit-desktop',{width:1440});
 await engine(webkit,'webkit-tablet',{width:834,height:1112,touch:true});
 await engine(chromium,'chromium-mobile',{width:390,height:844,touch:true});
 await engine(chromium,'chromium-small-mobile',{width:320,height:720,touch:true});
 await hoverParity();
 const report={candidate:NEW,baseline:OLD,total:results.length,passed:results.filter(r=>r.ok).length,errors,results};
 fs.writeFileSync(path.join(ROOT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,passed:report.passed,failed:errors.length,errors},null,2));
 if(errors.length)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=3});
