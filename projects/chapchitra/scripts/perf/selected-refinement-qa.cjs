/* CHAPCHITRA selected-state refinement: visual and behavioural release gate. */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const fs=require('fs'),path=require('path');
const NEW=process.env.CC_QA_URL||'http://127.0.0.1:4173/artists-edit/';
const OLD=process.env.CC_BEFORE_URL||'http://127.0.0.1:4174/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/selected-refinement');
fs.mkdirSync(OUT,{recursive:true});
const logs=[],errors=[],shots=[];
const assert=(name,ok,detail)=>{logs.push({name,ok:!!ok,detail});if(!ok)errors.push({name,detail})};
const data=async(page,g,v)=>page.locator('.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]').evaluate(el=>{
 const cs=getComputedStyle(el);
 return {cls:el.className,offset:new DOMMatrixReadOnly(cs.transform).m42,filter:cs.filter,opacity:cs.opacity,transition:cs.transitionDuration,source:el.dataset.source};
});
const img=(g,v)=>'.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]';
const btn=(g,v)=>'.cc-worktable-hit[data-group="'+g+'"][data-value="'+v+'"]';
const rail=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// WebKit can queue compositor frames under load beyond the nominal 190ms CSS
// duration. Inspect the settled rendered transform rather than sampling mid-frame.
async function settle(page,group,value,expected){
 try{
  await page.waitForFunction(([g,v,y])=>{
   const el=document.querySelector('.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]');
   return el&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m42-y)<.18;
  },[group,value,expected],{timeout:3400,polling:'raf'});
  return true;
 }catch{return false}
}

async function start(browser,viewport={},options={}){
 const page=await browser.newPage({viewport:{width:1440,height:900,...viewport},...options});
 const e=[];page.on('pageerror',err=>e.push(err.message));
 return {page,errs:e};
}
async function ready(page,url=NEW,{hydrate=true}={}){
 const start=Date.now();await page.goto(url,{waitUntil:'domcontentloaded',timeout:85000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:50000});
 const first=Date.now()-start;
 if(hydrate)await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:80000});
 return {first,full:Date.now()-start};
}
async function shot(page,label,{crop=false}={}){
 const p=path.join(OUT,label+'.png');
 if(!crop){
  await page.locator('.cc-worktable-stage').screenshot({path:p,animations:'disabled',timeout:30000});
 }else{
  const region=await page.evaluate(()=>{
   const stage=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
   const els=[...document.querySelectorAll('.cc-worktable-prop[data-group=color]')];
   const boxes=els.map(el=>el.getBoundingClientRect());
   const x=Math.min(...boxes.map(b=>b.x))-24,y=Math.min(...boxes.map(b=>b.y))-22;
   const right=Math.max(...boxes.map(b=>b.right))+28,bottom=Math.max(...boxes.map(b=>b.bottom))+28;
   return {x:Math.max(stage.left,x),y:Math.max(stage.top,y),width:Math.min(stage.right,right)-Math.max(stage.left,x),height:Math.min(stage.bottom,bottom)-Math.max(stage.top,y)};
  });
  await page.screenshot({path:p,clip:region,animations:'disabled',timeout:30000});
 }
 shots.push(path.basename(p));
}
async function desktop(engine,name){
 const b=await engine.launch({headless:true, ...(name==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(name==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const {page,errs}=await start(b);
 const timing=await ready(page);
 assert(name+' first-screen ready',timing.first<12000,timing);
 // Capture controlled initial scene with identical regular-tee/white-color
 // state to the baseline, before exercising any unrelated control.
 if(name==='chromium'){
  await page.mouse.move(0,0);await shot(page,'after-resting');
  await page.locator(btn('color','red')).hover();await settle(page,'color','red',-2);await shot(page,'after-hover');
  await page.locator(btn('color','red')).click();await page.mouse.move(0,0);await settle(page,'color','red',-5.5);
  await shot(page,'after-selected-after-pointer-exit');
  await shot(page,'after-selected-pot-closeup',{crop:true});
  await page.locator(rail('color','white')).click();await page.mouse.move(0,0);await settle(page,'color','red',0);
 }
 const groupCases=[['garment','dropShoulder',4.5],['size','XL',3.5],['color','red',5.5],['printSize','A3',4]];
 for(const [group,value,target] of groupCases){
  const element=page.locator(img(group,value));
  await page.mouse.move(0,0);await sleep(220);
  let resting=await data(page,group,value);
  assert(name+' '+group+' starts resting',Math.abs(resting.offset)<0.1,resting);
  await page.locator(btn(group,value)).hover();await settle(page,group,value,group==='size'?-1.5:-2);
  const hover=await data(page,group,value);
  assert(name+' '+group+' original hover lift unchanged',Math.abs(hover.offset- (group==='size'?-1.5:-2))<.22,hover);
  await page.locator(btn(group,value)).click();await page.mouse.move(0,0);await settle(page,group,value,-target);
  const selected=await data(page,group,value);
  assert(name+' '+group+' selected class persists after exit',selected.cls.includes('is-selected')&&!selected.cls.includes('is-hovered'),selected.cls);
  assert(name+' '+group+' exact elevated selected lift',Math.abs(selected.offset+target)<.18,selected);
  assert(name+' '+group+' selected stronger than hover',Math.abs(selected.offset)>Math.abs(hover.offset)+1.0);
  assert(name+' '+group+' silhouette shadow',selected.filter.includes('drop-shadow')&&!selected.filter.includes('blur('),selected.filter);
  assert(name+' '+group+' one selected image',await page.locator('.cc-worktable-prop[data-group="'+group+'"].is-selected').count()===1);
  // Manual rail change must release the previous object to rest without stale hover.
  let alternate={garment:'hoodie',size:'S',color:'blue',printSize:'A4'}[group];
  await page.locator(rail(group,alternate)).click();await page.mouse.move(0,0);await Promise.all([settle(page,group,value,0),settle(page,group,alternate,-target)]);
  const old=await data(page,group,value),replacement=await data(page,group,alternate);
  assert(name+' '+group+' old option returns to resting position',Math.abs(old.offset)<.2,old);
  assert(name+' '+group+' new manual selection persists',Math.abs(replacement.offset+target)<.2&&replacement.cls.includes('is-selected'),replacement);
  assert(name+' '+group+' manual exactly one selected',await page.locator('.cc-worktable-prop[data-group="'+group+'"].is-selected').count()===1);
 }
 for(const value of ['black','white','red','yellow','blue','green']){
  await page.locator(rail('color',value)).click();await page.mouse.move(0,0);await settle(page,'color',value,-5.5);
  const picked=await data(page,'color',value);
  assert(name+' six paint pots '+value+' selected persistently',Math.abs(picked.offset+5.5)<.2,picked.offset);
  assert(name+' six paint pots '+value+' only one selected',await page.locator('.cc-worktable-prop[data-group=color].is-selected').count()===1);
 }
 await page.locator(btn('size','M')).focus();await page.locator(btn('size','M')).press('Enter');await settle(page,'size','M',-3.5);
 const focused=await data(page,'size','M');
 assert(name+' selected focus retains elevation',Math.abs(focused.offset+3.5)<.22,focused);
 assert(name+' selected focus keeps highlight',focused.filter.includes('drop-shadow')&&focused.cls.includes('is-keyboard-focus'));
 await page.mouse.move(0,0);
 await page.locator(btn('upload','upload')).hover();await settle(page,'upload','upload',-3);
 const upload=await data(page,'upload','upload');
 assert(name+' upload plus 3px hover',Math.abs(upload.offset+3)<.2,upload);
 assert(name+' upload has no persistent selection',!upload.cls.includes('is-selected'),upload.cls);
 const backdrop=await page.locator('.cc-worktable-layer[data-source="Upload image notebook/Upload_image_notebook_1.png"]').evaluate(el=>({cls:el.className,offset:new DOMMatrixReadOnly(getComputedStyle(el).transform).m42}));
 assert(name+' notebook remains stationary',Math.abs(backdrop.offset)<.1,backdrop);
 await page.mouse.move(0,0);await settle(page,'upload','upload',0);
 const uploadExited=await data(page,'upload','upload');
 assert(name+' upload returns to rest after hover exit',Math.abs(uploadExited.offset)<.2,uploadExited);
 assert(name+' no page exceptions',errs.length===0,errs);
 await b.close();return timing;
}
async function mobile(){
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const width of [834,390,320]){
  const {page,errs}=await start(b,{width,height:width===834?1112:720},{isMobile:true,hasTouch:true});
  await ready(page);
  for(const [g,v,lift] of [['garment','dropShoulder',4.5],['size','XL',3.5],['color','red',5.5],['printSize','A3',4]]){
   await page.locator(rail(g,v)).tap();await settle(page,g,v,-lift);
   const info=await data(page,g,v);
   assert('touch '+width+' '+g+' selected lift',Math.abs(info.offset+lift)<.2&&info.cls.includes('is-selected'),info);
   assert('touch '+width+' '+g+' hover not sticky',!info.cls.includes('is-hovered'),info.cls);
   assert('touch '+width+' '+g+' one choice selected',await page.locator('.cc-worktable-prop[data-group="'+g+'"].is-selected').count()===1);
  }
  assert('touch '+width+' no horizontal scroll',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert('touch '+width+' no JS exceptions',errs.length===0,errs);
  if(width===390)await shot(page,'after-touch-selected-390');
  await page.close();
 }
 await b.close();
}
async function hydration(){
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const {page,errs}=await start(b,{width:1440,height:900});
 let delayed=0;
 await page.route('**/assets/worktable/variants/**',async route=>{
  if(route.request().url().includes('/preview/'))return route.continue();
  if(delayed++<20)await sleep(420);
  return route.continue();
 });
 await ready(page,NEW,{hydrate:false});
 const hydrating=await page.locator('.cc-worktable').evaluate(el=>el.classList.contains('is-hydrating'));
 assert('delayed hydration really active',hydrating,hydrating);
 await page.locator(rail('color','red')).click();await page.mouse.move(0,0);await settle(page,'color','red',-5.5);
 const state=await data(page,'color','red');
 assert('selection position and state recorded DURING hydration',state.cls.includes('is-selected')&&Math.abs(state.offset+5.5)<.2,state);
 // The already assembled preview is intentionally kept visible until the crop
 // layer handoff; opacity zero prevents ghosted double artwork before hydration.
 assert('compiled preview hides duplicate cropped layers',state.opacity==='0',state.opacity);
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:90000});
 await settle(page,'color','red',-5.5);
 const visible=await data(page,'color','red');
 assert('selected pot VISIBLE after progressive hydration handoff',visible.opacity==='1'&&Math.abs(visible.offset+5.5)<.2,visible);
 assert('selected state not dropped through hydration',visible.cls.includes('is-selected')&&await page.locator('.cc-worktable-prop[data-group=color].is-selected').count()===1);
 assert('hydration no JS errors',errs.length===0,errs);
 await b.close();
}
async function baseline(){
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const {page}=await start(b);
 await ready(page,OLD);
 await page.mouse.move(0,0);await sleep(250);await shot(page,'before-resting');
 await page.locator(btn('color','red')).hover();await settle(page,'color','red',-2);await shot(page,'before-hover');
 await page.locator(btn('color','red')).click();await page.mouse.move(0,0);await settle(page,'color','red',-2);
 await shot(page,'before-selected-after-pointer-exit');await shot(page,'before-selected-pot-closeup',{crop:true});
 await b.close();
}
async function compose(){
 const files=[['before-resting','after-resting'],['before-hover','after-hover'],['before-selected-after-pointer-exit','after-selected-after-pointer-exit']];
 const sheets=[];
 for(const [a,b] of files){
  const [ma,mb]=await Promise.all([sharp(path.join(OUT,a+'.png')).metadata(),sharp(path.join(OUT,b+'.png')).metadata()]);
  const w=Math.min(ma.width,mb.width),h=Math.min(ma.height,mb.height);
  const canvas={create:{width:w*2,height:h,channels:4,background:'#ffffff'}};
  const image=await sharp(canvas).composite([
   {input:await sharp(path.join(OUT,a+'.png')).resize(w,h).png().toBuffer(),top:0,left:0},
   {input:await sharp(path.join(OUT,b+'.png')).resize(w,h).png().toBuffer(),top:0,left:w}]).webp({quality:86,effort:4}).toFile(path.join(OUT,a.replace('before-','compare-')+'.webp'));
  sheets.push({name:a,bytes:image.size});
 }
 // Compare a FIXED original-stage crop so the elevated pot does not alter
 // the screenshot crop origin. This shows the movement against unselected pots.
 const baseFull=path.join(OUT,'before-selected-after-pointer-exit.png');
 const nextFull=path.join(OUT,'after-selected-after-pointer-exit.png');
 const stageMeta=await sharp(baseFull).metadata();
 const region={left:Math.round(stageMeta.width*.035),top:Math.round(stageMeta.height*.675),
  width:Math.round(stageMeta.width*.193),height:Math.round(stageMeta.height*.28)};
 const left=await sharp(baseFull).extract(region).resize({width:800}).png().toBuffer();
 const right=await sharp(nextFull).extract(region).resize({width:800}).png().toBuffer();
 const m=await sharp(left).metadata();
 await sharp({create:{width:1600,height:m.height,channels:4,background:'#fff'}}).composite([
  {input:left,left:0,top:0},{input:right,left:800,top:0}
 ]).webp({quality:90,effort:5}).toFile(path.join(OUT,'compare-selected-pot-closeup.webp'));
 return sheets;
}
(async()=>{
 await desktop(chromium,'chromium');await desktop(webkit,'webkit');
 await mobile();await hydration();await baseline();
 const composites=await compose();
 const report={candidate:NEW,baseline:OLD,passed:logs.filter(x=>x.ok).length,failed:errors.length,checks:logs,errors,screenshots:shots,composites};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors:report.errors,composites},null,2));
 if(errors.length)process.exitCode=2;
})().catch(error=>{console.error(error);process.exitCode=3});
