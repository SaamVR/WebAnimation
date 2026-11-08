const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4427/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/print-guide-tools');
fs.mkdirSync(OUT,{recursive:true});
const report={target:URL,checks:[],failures:[]};
const check=(name,pass,details)=>{
 const item={name,pass:!!pass};if(details!==undefined)item.details=details;
 report.checks.push(item);if(!pass){report.failures.push(item);console.error('FAIL',name,String(JSON.stringify(details)).slice(0,450));}
};
const label=(group,value)=>'.cc-worktable-choice[data-group='+group+'][data-value='+value+']';
const approx=(a,b,eps=1)=>Math.abs(a-b)<=eps;
async function fixture(w,h,transparent=false){
 const rgba=Buffer.alloc(w*h*4);
 const colors=[[254,254,255],[250,218,22],[11,84,230],[235,26,34]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,q=Number(x>=w/2)+2*Number(y>=h/2),c=colors[q];
  rgba[i]=c[0];rgba[i+1]=c[1];rgba[i+2]=c[2];
  rgba[i+3]=transparent&&(x<w*.08||x>w*.92||y<h*.08||y>h*.92)?0:255;
 }
 return sharp(rgba,{raw:{width:w,height:h,channels:4}}).png().toBuffer();
}
async function upload(page,w,h,transparent=false){
 await page.locator('#worktableFile').setInputFiles({name:'print-'+w+'x'+h+'.png',mimeType:'image/png',buffer:await fixture(w,h,transparent)});
 await page.locator('.cc-worktable-print.has-art').waitFor({timeout:30000});
 await page.waitForFunction(([width,height])=>{
  const img=document.querySelector('.cc-worktable-print>img');
  if(!img?.complete||img.naturalWidth!==width||img.naturalHeight!==height)return false;
  const el=img.parentElement,r=el.getBoundingClientRect();
  return Math.abs(r.width/r.height-width/height)<.012&&el.dataset.rotation==='0';
 },[w,h],{timeout:30000});
}
async function snap(page){
 return page.evaluate(()=>{
  const rect=(q)=>{
   const el=document.querySelector(q),r=el?.getBoundingClientRect();
   return r?{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}:null;
  };
  return {
   guide:rect('.cc-worktable-paper-guide'),
   print:rect('.cc-worktable-print'),
   bounds:rect('.cc-worktable-art-bounds'),
   stage:rect('.cc-worktable-stage'),
   tools:rect('.cc-worktable-art-tools'),
   guideVisible:document.querySelector('.cc-worktable-paper-guide')?.classList.contains('is-visible'),
   boundsVisible:document.querySelector('.cc-worktable-art-bounds')?.classList.contains('is-visible'),
   mode:[...document.querySelectorAll('.cc-worktable-tool')].find(b=>b.getAttribute('aria-pressed')==='true')?.dataset.tool,
   handles:[...document.querySelectorAll('.cc-worktable-corner-handle')].filter(e=>!e.hidden).map(e=>e.dataset.corner),
   toolsVisible:!document.querySelector('.cc-worktable-art-tools').hidden,
   rotation:document.querySelector('.cc-worktable-print').dataset.rotation,
   styleX:document.querySelector('.cc-worktable-print').style.left,
   styleY:document.querySelector('.cc-worktable-print').style.top,
   scale:document.querySelector('#worktableArtScale').value,
   scaleLabel:document.querySelector('#worktableScaleOutput').textContent,
   sourceImg:document.querySelector('.cc-worktable-print img')?.getAttribute('src'),
   blend:getComputedStyle(document.querySelector('.cc-worktable-print img')).mixBlendMode,
   color:document.querySelector('.cc-worktable-garment-surface')?.dataset.color,
   garment:document.querySelector('.cc-worktable-garment-surface')?.dataset.garment,
  };
 });
}
async function screenshot(page,file){
 const target=path.join(OUT,file);
 await page.locator('.cc-worktable-stage').screenshot({path:target,animations:'disabled',timeout:35000});
}
async function ready(page){
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:85000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:85000});
}
async function change(page,g,v){
 await page.locator(label(g,v)).click();
 if(g==='garment'||g==='color')await page.waitForFunction(([group,value])=>{
  const el=document.querySelector('.cc-worktable-garment-surface');
  return el?.dataset[group==='color'?'color':'garment']===value;
 },[g,v],{timeout:40000});
}
function fitInside(box,outer,tol=1.4){
 return box.x>=outer.x-tol&&box.y>=outer.y-tol&&
  box.right<=outer.right+tol&&box.bottom<=outer.bottom+tol;
}
async function testViewport(engine,name,width,height,touch=false){
 const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:process.env.CHROMIUM_PATH||'/snap/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
  hasTouch:touch,isMobile:touch,serviceWorkers:'block',reducedMotion:'reduce',
  recordVideo:{dir:OUT,size:{width:Math.min(width,1280),height:Math.min(height,900)}}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await ready(page);
  const initial=await snap(page);
  check(name+' guide DOM independent of image',!!initial.guide&&initial.sourceImg===null);
  await change(page,'printSize','A4');
  const a4=await snap(page);
  check(name+' guide shown before upload A4',a4.guideVisible&&!!a4.guide);
  await change(page,'printSize','A3');
  const a3=await snap(page);
  check(name+' guide shown before upload A3',a3.guideVisible);
  const ratio=a3.guide.width*a3.guide.height/(a4.guide.width*a4.guide.height);
  check(name+' A3 guide twice the A4 area',approx(ratio,2,.07),{ratio,a4:a4.guide,a3:a3.guide});
  if(name==='chromium-desktop')await screenshot(page,'before-upload-A3-guide.png');
  await change(page,'printSize','A4');
  for(const [w,h,shape] of [[420,620,'portrait'],[620,420,'landscape'],[460,460,'square'],[220,950,'tall']]){
   await upload(page,w,h,shape==='tall');
   const a=await snap(page);
   const paper=a.guide;
   check(name+' '+shape+' source fits entirely inside frame',fitInside(a.print,paper,1.6),
    {art:a.print,paper});
   check(name+' '+shape+' preserves ratio',approx(a.print.width/a.print.height,w/h,.015),
    {ratio:a.print.width/a.print.height,expected:w/h,source:[w,h],print:a.print});
   check(name+' '+shape+' reference frame remains unchanged',approx(a4.guide.width,a.guide.width,.3)&&approx(a4.guide.height,a.guide.height,.3));
   check(name+' '+shape+' upload starts at 0%',a.scale==='0'&&a.rotation==='0');
   if(name==='chromium-desktop')await screenshot(page,'auto-fit-'+shape+'.png');
  }
  await upload(page,400,570,true);
  await page.locator('.cc-worktable-drag').click();
  const sel=await snap(page);
  check(name+' selected image reveals toolbar',sel.toolsVisible&&sel.mode==='move'&&!sel.boundsVisible);
  const tool=sel.tools,stage=sel.stage;
  check(name+' toolbar remains within stage viewport',tool.x>=stage.x-1&&tool.right<=stage.right+1&&tool.y>=stage.y-1&&tool.bottom<=stage.bottom+1,{tool,stage});
  if(name==='chromium-desktop')await screenshot(page,'toolbar-move-selected.png');
  await page.locator('.cc-worktable-tool[data-tool=resize]').click();
  const resized=await snap(page);
  check(name+' Resize mode has four handles',resized.boundsVisible&&resized.mode==='resize'&&resized.handles.join(',')==='nw,ne,sw,se',resized);
  if(name==='chromium-desktop')await screenshot(page,'toolbar-resize-four-handles.png');
  if(!touch){
   for(const corner of ['nw','ne','sw','se']){
    await page.locator('#worktableResetArt').click();
    await page.locator('.cc-worktable-drag').click();
    await page.locator('.cc-worktable-tool[data-tool=resize]').click();
    const handle=page.locator('.cc-worktable-corner-handle[data-corner='+corner+']');
    await handle.scrollIntoViewIfNeeded();
    const before=await snap(page);
    const r=await handle.boundingBox();
    const x=r.x+r.width/2,y=r.y+r.height/2;
    const signX=corner.endsWith('w')?-1:1,signY=corner.startsWith('n')?-1:1;
    await page.mouse.move(x,y);await page.mouse.down();
    await page.mouse.move(x+signX*16,y+signY*17,{steps:5});
    await page.mouse.up();
    const after=await snap(page);
    check(name+' '+corner+' corner drag scales from center',Number(after.scale)>Number(before.scale),{before:before.scale,after:after.scale});
    check(name+' '+corner+' corner preserves aspect',approx(after.print.width/after.print.height,400/570,.02));
   }
  }
  // New rotation frames must preserve center, never rotate the A3/A4 guide.
  await page.locator('#worktableResetArt').click();
  await page.locator('.cc-worktable-drag').click();
  const original=await snap(page);
  for(let turn=1;turn<=4;turn++){
   await page.locator('.cc-worktable-tool[data-tool=rotate]').click();
   const after=await snap(page);
   check(name+' 90° rotation step '+turn,Number(after.rotation)===(turn*90)%360,after.rotation);
   check(name+' rotation guide dimensions unchanged '+turn,
    approx(original.guide.width,after.guide.width,.3)&&approx(original.guide.height,after.guide.height,.3));
   check(name+' rotated image remains inside stage '+turn,fitInside(after.print,after.stage,2),after.print);
   if(name==='chromium-desktop')await screenshot(page,'rotation-'+turn*90+'.png');
  }
  await page.locator('.cc-worktable-tool[data-tool=resize]').click();
  await page.locator('#worktableArtScale').fill('25');
  await page.waitForTimeout(110);
  const synced=await snap(page);
  check(name+' slider 25% signed label',synced.scaleLabel==='+25%');
  await page.locator('.cc-worktable-drag').focus();
  const focused=await snap(page);
  await page.keyboard.press('ArrowRight');
  let keyboard=await snap(page);
  if(Math.abs(parseFloat(keyboard.styleX)-parseFloat(focused.styleX))<.01){
   await page.keyboard.press('ArrowLeft');
   await page.keyboard.press('ArrowLeft');
   keyboard=await snap(page);
  }
  check(name+' keyboard reposition is still available',
   Math.abs(parseFloat(keyboard.styleX)-parseFloat(focused.styleX))>.025,
   {before:focused.styleX,after:keyboard.styleX,mode:keyboard.mode,rotation:keyboard.rotation});
  await change(page,'garment','hoodie');
  await change(page,'printSize','A3');
  const garment=await snap(page);
  check(name+' garment and A3 change retains artwork safely',garment.sourceImg?.startsWith('blob:')&&fitInside(garment.print,garment.stage,2));
  await page.locator('#worktableResetArt').click();
  const reset=await snap(page);
  check(name+' reset 0 scale and 0° rotation',reset.scale==='0'&&reset.rotation==='0');
  await page.locator('.cc-worktable-drag').click();
  const selectedAgain=await snap(page);
  await page.locator('.cc-worktable-stage').click({position:{x:10,y:10}});
  const dismissed=await snap(page);
  check(name+' click outside editor closes tools but not art',selectedAgain.toolsVisible&&!dismissed.toolsVisible&&!!dismissed.sourceImg);
  check(name+' image uses normal blend',dismissed.blend==='normal');
  check(name+' no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  check(name+' no browser errors',errors.length===0,errors);
 }finally{
  const video=page.video();
  await context.close();
  if(video){
   const filename=name+'-tool-workflow.webm';
   fs.copyFileSync(await video.path(),path.join(OUT,filename));
  }
  await browser.close();
 }
}
(async()=>{
 await testViewport(chromium,'chromium-desktop',1440,900);
 await testViewport(webkit,'webkit-tablet',834,1112,true);
 await testViewport(chromium,'chromium-mobile',390,844,true);
 report.total=report.checks.length;report.passed=report.checks.filter(c=>c.pass).length;report.failed=report.failures.length;
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,total:report.total,failures:report.failures},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('TOOLS QA CRASH',e.stack||String(e));process.exitCode=3});
