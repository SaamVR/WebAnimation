const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4411/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/print-guide-editor');
fs.mkdirSync(OUT,{recursive:true});
const done=[],errors=[],failures=[];
const assert=(name,ok,detail)=>{const x={name,ok:!!ok,detail};done.push(x);if(!ok){failures.push(x);console.error('FAIL',name,JSON.stringify(detail).slice(0,850));}};
const choose=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const fabrics=['white','black','red','yellow','blue','green'];
const variants=[[330,470,'portrait'],[510,260,'landscape'],[370,370,'square'],[150,600,'tall']];
const preview=async page=>page.evaluate(()=>{
 const stage=document.querySelector('.cc-worktable-stage');
 const rect=stage.getBoundingClientRect(),k=2048/rect.width;
 const sample=element=>{
  if(!element)return null;
  const r=element.getBoundingClientRect();
  return {x:(r.x-rect.x)*k,y:(r.y-rect.y)*k,w:r.width*k,h:r.height*k,opacity:Number(getComputedStyle(element).opacity)};
 };
 const print=document.querySelector('.cc-worktable-print');
 const guide=document.querySelector('.cc-worktable-print-guide');
 return {guide:sample(guide),img:sample(print),print:{rotation:print.dataset.rotation,selected:print.classList.contains('is-edit-selected'),resize:print.classList.contains('is-resize-mode'),blend:getComputedStyle(print).mixBlendMode},
  guideShown:guide.classList.contains('is-shown'),preset:guide.dataset.preset,
  toolbar:!document.querySelector('.cc-worktable-editor-toolbar').hidden,
  handles:[...document.querySelectorAll('.cc-worktable-corner-handle')].filter(e=>getComputedStyle(e).display!=='none').length,
  tools:[...document.querySelectorAll('.cc-worktable-tool')].map(e=>({tool:e.dataset.tool,active:e.classList.contains('is-active'),pressed:e.getAttribute('aria-pressed')})),
  value:document.querySelector('#worktableArtScale').value,label:document.querySelector('#worktableScaleOutput').textContent,
  warning:document.querySelector('#worktableSizeGuidance').textContent,
  overflow:document.documentElement.scrollWidth>innerWidth+1
 };
});
async function makeArt(w,h,{transparent=false,jpeg=false}={}){
 const raw=Buffer.alloc(w*h*4);
 const patches=[[255,255,255],[255,220,17],[22,91,242],[224,19,37]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const q=+(x>=w/2)+2*+(y>=h/2);
  const i=(y*w+x)*4,[r,g,b]=patches[q];
  raw[i]=r;raw[i+1]=g;raw[i+2]=b;
  raw[i+3]=transparent&&(x<w*.09||x>w*.91||y<h*.09||y>h*.91)?0:255;
 }
 const sh=sharp(raw,{raw:{width:w,height:h,channels:4}});
 return jpeg?sh.jpeg({quality:99,chromaSubsampling:'4:4:4'}).toBuffer():sh.png().toBuffer();
}
async function upload(page,w,h,name,opts={}){
 const buffer=await makeArt(w,h,opts);
 await page.locator('#worktableFile').setInputFiles({name:name+(opts.jpeg?'.jpg':'.png'),mimeType:opts.jpeg?'image/jpeg':'image/png',buffer});
 await page.locator('.cc-worktable-print.has-art img[src^=blob]').waitFor({timeout:16000});
}
async function pick(page,group,value){
 await page.locator(choose(group,value)).click();
 if(group==='garment'||group==='color')await page.waitForFunction(([g,v])=>{
  const s=document.querySelector('.cc-worktable-garment-surface');
  return s?.dataset[g==='garment'?'garment':'color']===v;
 },[group,value],{timeout:55000});
}
async function select(page){
 const area=page.locator('.cc-worktable-drag');
 await area.scrollIntoViewIfNeeded();
 await area.click();
}
async function screenshot(page,name){
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 const file=path.join(OUT,name+'.png');
 await page.locator('.cc-worktable-stage').screenshot({path:file,animations:'disabled',timeout:28000});
}
async function exercise(type,label,width,height){
 const browser=await type.launch({headless:true,...(type===chromium?{executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}:{})});
 const context=await browser.newContext({
  viewport:{width,height},hasTouch:width<=834,isMobile:width<=430,
  recordVideo:label==='desktop'?{dir:OUT,size:{width:1280,height:800}}:undefined,serviceWorkers:'block'
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(label+': '+e.message));
 try{
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:85000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 // Before upload, changing print sizes reveals a separate physical reference.
 await pick(page,'printSize','A4');
 let a4=await preview(page);
 assert(label+' A4 guide before upload',a4.guideShown&&!a4.toolbar&&a4.img.w===0,a4);
 if(label==='desktop')await screenshot(page,'01-a4-guide-without-upload');
 await pick(page,'printSize','A3');
 let a3=await preview(page);
 assert(label+' A3 guide remains portrait and 2x A4 reference',
  a3.guide.w/a3.guide.h<.75&&Math.abs(a3.guide.w*a3.guide.h/(a4.guide.w*a4.guide.h)-2)<.025,
  {a4:a4.guide,a3:a3.guide});
 if(label==='desktop')await screenshot(page,'02-a3-guide-without-upload');
 await page.waitForTimeout(1680);
 assert(label+' pre-upload guide fades',!(await preview(page)).guideShown);
 await pick(page,'printSize','A4');
 // Artwork fits whole within independent frame; guide size never changes.
 for(const [w,h,format] of variants){
  await upload(page,w,h,format,{transparent:format==='square',jpeg:format==='landscape'});
  const s=await preview(page);
  assert(label+' '+format+' matches source aspect',
   Math.abs(s.img.w/s.img.h-w/h)<.015,{w,h,s:s.img});
  assert(label+' '+format+' centered inside A4 guide',
   Math.abs((s.img.x+s.img.w/2)-(s.guide.x+s.guide.w/2))<.7&&
   Math.abs((s.img.y+s.img.h/2)-(s.guide.y+s.guide.h/2))<.7,
   {guide:s.guide,art:s.img});
  assert(label+' '+format+' does not change A4 guide',
   Math.abs(s.guide.w-a4.guide.w)<.3&&Math.abs(s.guide.h-a4.guide.h)<.3,s.guide);
  assert(label+' '+format+' initialized signed 0 and rotation 0',
   s.value==='0'&&s.print.rotation==='0'&&!s.toolbar);
  if(label==='desktop'&&['portrait','landscape','square'].includes(format))
   await screenshot(page,'03-'+format+'-auto-fitted');
 }
 // A3 changes guide and the default fitted image size without changing image RGB.
 await upload(page,330,470,'final-transparent',{transparent:true});
 await pick(page,'printSize','A4');
 const small=await preview(page);
 await pick(page,'printSize','A3');
 const large=await preview(page);
 assert(label+' A3 increases both reference and default image footprints',
  large.guide.w>small.guide.w*1.38&&large.img.w>small.img.w*1.35,
  {small,large});
 if(label==='desktop')await screenshot(page,'04-a3-with-artwork');
 // Click image: toolbar visible with all three tools; guide persists.
 await select(page);
 let selected=await preview(page);
 assert(label+' selecting artwork opens toolbar and guide',
  selected.toolbar&&selected.guideShown&&selected.print.selected&&selected.tools.length===3,selected);
 assert(label+' Move is active initially',selected.tools.find(t=>t.tool==='move')?.pressed==='true');
 if(label==='desktop')await screenshot(page,'05-floating-three-tool-editor');
 // Mouse drag to move, real touch in a separate suite.
 if(label==='desktop'){
  await page.locator('#worktableArtScale').fill('-25');
  const area=page.locator('.cc-worktable-drag');
  const box=await area.boundingBox();
  const x=box.x+box.width*.5,y=box.y+box.height*.5;
  const before=await preview(page);
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+45,y+33,{steps:6});await page.mouse.up();
  const after=await preview(page);
  assert(label+' Move drags artwork within guide',after.img.x>before.img.x+3||after.img.y>before.img.y+3,{before:before.img,after:after.img});
  await screenshot(page,'06-moving-inside-print-guide');
 }
 // Resize mode exposes only actual-image corners and shares signed slider.
 await page.locator('.cc-worktable-tool[data-tool=resize]').click();
 let sized=await preview(page);
 assert(label+' Resize mode has four handles and bounds',
  sized.print.resize&&sized.handles===4&&sized.tools.find(t=>t.tool==='resize')?.active,sized);
 if(label==='desktop')await screenshot(page,'07-resize-mode-four-corners');
 // Test all 4 physical corners from reset starting point.
 if(label==='desktop'){
  for(const corner of ['nw','ne','se','sw']){
   await page.locator('#worktableResetArt').click();
   await select(page);
   await page.locator('.cc-worktable-tool[data-tool=resize]').click();
   const hnd=page.locator('.cc-worktable-corner-handle[data-corner='+corner+']');
   await hnd.scrollIntoViewIfNeeded();
   const rect=await hnd.boundingBox();
   const x=rect.x+rect.width*.5,y=rect.y+rect.height*.5;
   const outward={nw:[-14,-18],ne:[14,-18],se:[14,18],sw:[-14,18]}[corner];
   const before=await preview(page);
   await page.mouse.move(x,y);await page.mouse.down();
   await page.mouse.move(x+outward[0],y+outward[1],{steps:5});await page.mouse.up();
   const after=await preview(page);
   assert('resize '+corner+' updates image and signed slider',
    Number(after.value)>Number(before.value)&&after.img.w>before.img.w&&after.img.h>before.img.h,
    {before:before.value,after:after.value,old:before.img,new:after.img});
  }
  await screenshot(page,'08-after-corner-resize-synced-slider');
 }
 // Rotates exactly 90 degrees clockwise per activation, 4 turns = 0.
 await page.locator('#worktableResetArt').click();
 await select(page);
 for(const rot of [90,180,270,0]){
  await page.locator('.cc-worktable-tool[data-tool=rotate]').click();
  const s=await preview(page);
  assert(label+' rotates exactly '+rot+'°',s.print.rotation===String(rot),s);
  assert(label+' rotation '+rot+'° keeps art within stage',
   s.img.x>=0&&s.img.y>=0&&s.img.x+s.img.w<=2048+1&&s.img.y+s.img.h<=1152+1,
   {rotation:rot,box:s.img});
  if(label==='desktop')await screenshot(page,'09-rotation-'+rot);
 }
 // 0% reset aligns center, 0deg, original A3; panel and toolbar synchronized.
 await page.locator('#worktableArtScale').fill('35');
 const plus=await preview(page);
 assert(label+' bottom panel +35% shows larger image and guides',plus.value==='35'&&plus.img.w>large.img.w,plus);
 await page.locator('#worktableResetArt').click();
 const zero=await preview(page);
 assert(label+' Reset returns image centered, 0%, rotation 0°',
  zero.value==='0'&&zero.print.rotation==='0'&&
  Math.abs(zero.img.x+zero.img.w/2-zero.guide.x-zero.guide.w/2)<.8,zero);
 // Garment changes and 24 combinations don't remove artwork.
 for(const garment of garments){
  await pick(page,'garment',garment);
  for(const color of fabrics){
   await pick(page,'color',color);
   const state=await preview(page);
   assert(label+' '+garment+'/'+color+' retains art and print guide',
    state.img.w>0&&state.guide.w>0&&!state.overflow);
  }
 }
 await select(page);
 await page.locator('.cc-worktable-choice[data-group=size][data-value=M]').click();
 assert(label+' click outside editor dismisses tools and leaves art',
  !(await preview(page)).toolbar&&await page.locator('.cc-worktable-print.has-art').count()===1);
 await select(page);
 await page.keyboard.press('Escape');
 assert(label+' Escape dismisses toolbar',!(await preview(page)).toolbar);
 assert(label+' no JS errors',errors.length===0,errors.slice());
 assert(label+' no viewport overflow',!(await preview(page)).overflow);
 const video=page.video();await context.close();
 if(video){const recorded=await video.path();fs.copyFileSync(recorded,path.join(OUT,label+'-editing-workflow.webm'));}
 }catch(error){errors.push(label+' CRASH '+String(error?.stack||error));console.error(label+' CRASH',error);}
 finally{await browser.close();}
}
(async()=>{
 await exercise(chromium,'desktop',1440,900);
 await exercise(chromium,'tablet',834,1112);
 await exercise(webkit,'webkit-mobile',390,844);
 const summary={url:URL,total:done.length,passed:done.filter(x=>x.ok).length,
  failed:failures.length,failures,errors,checks:done};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(summary,null,2));
 console.log('EDITOR QA',JSON.stringify({total:summary.total,passed:summary.passed,failed:summary.failed,errors:summary.errors},null,2));
 if(summary.failed||summary.errors.length)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=3});
