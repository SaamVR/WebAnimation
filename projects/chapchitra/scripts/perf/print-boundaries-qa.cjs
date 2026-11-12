/* CHAPCHITRA — Print-boundary browser regression on the exact built app.
 * Verifies layout math in the rendered browser, not CSS clipping alone.
 * Run on a local preview via CC_QA_ROOT, never assume physical iPad testing.
 */
const {chromium,webkit}=require('playwright'),sharp=require('sharp');
const fs=require('node:fs'),path=require('node:path');
const root=(process.env.CC_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const folder=path.resolve(process.env.CC_QA_OUT||'perf-results/print-boundaries');
fs.mkdirSync(folder,{recursive:true});
const checks=[],errors=[],requests=[];
const verify=(label,condition,detail)=>{checks.push({label,pass:!!condition,detail});if(!condition)console.error('FAIL',label,JSON.stringify(detail));};
const src=()=>sharp({create:{width:720,height:1040,channels:4,background:{r:218,g:46,b:92,alpha:1}}}).png().toBuffer();
const settle=p=>p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const pick=async(p,group,value)=>{
 await p.locator('.cc-worktable-choice[data-group="'+group+'"][data-value="'+value+'"]').click();
 await settle(p);
};
const wait=async p=>p.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
const put=async(p,name)=>p.locator('#worktableFile').setInputFiles({name,mimeType:'image/png',buffer:await src()});
const point=async(p,selector)=>p.locator(selector).boundingBox();
const SNAP=async p=>p.evaluate(()=>{
 const stageBounds=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
 const box=element=>{const b=element.getBoundingClientRect();return{
  x:b.x-stageBounds.x,y:b.y-stageBounds.y,width:b.width,height:b.height,
  right:b.right-stageBounds.x,bottom:b.bottom-stageBounds.y}};
 const guide=document.querySelector('.cc-worktable-paper-guide');
 const clip=document.querySelector('.cc-worktable-print-clip');
 const art=document.querySelector('.cc-worktable-print');
 return {guide:box(guide),clip:box(clip),art:box(art),
  preset:guide.dataset.preset,rotation:art.dataset.rotation,artVisible:getComputedStyle(art).display!=='none',
  clipped:getComputedStyle(clip).overflow==='hidden',frameVisible:!document.querySelector('.cc-worktable-frame-handle').hidden,
  imageSource:art.querySelector('img')?.getAttribute('src')||'',price:document.querySelector('#worktablePriceTotal')?.textContent?.trim(),
  stage:box(document.querySelector('.cc-worktable-stage'))};
});
const within=(inner,outer,pad=2)=>inner.x>=outer.x-pad&&inner.y>=outer.y-pad&&inner.right<=outer.right+pad&&inner.bottom<=outer.bottom+pad;
const same=(a,b,eps=2)=>Math.abs(a-b)<=eps;
async function drag(page,selector,x,y){
 const b=await point(page,selector);
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
 await page.mouse.down();
 await page.mouse.move(x,y,{steps:8});
 await page.mouse.up();
 await settle(page);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const webkitBrowser=await webkit.launch({headless:true});
 try{
 for(const [engine,id,w,h] of [[browser,'desktop',1440,900],[webkitBrowser,'ipad-webkit',834,1112],[browser,'mobile',390,844]]){
 const ctx=await engine.newContext({viewport:{width:w,height:h},hasTouch:id!=='desktop',isMobile:id==='mobile',deviceScaleFactor:2,reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push({id,error:e.message}));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(root))requests.push({id,status:r.status(),url:r.url()})});
 await page.goto(root+'/artists-edit/',{waitUntil:'load',timeout:60000});
 await wait(page);
 // Cross all garment silhouettes and print presets with the calibrated A3 boundary.
 for(const garment of ['regular','dropShoulder','fullSleeve','hoodie']){
  await pick(page,'garment',garment);
  await pick(page,'printSize','A3');
  const a3=await SNAP(page);
  verify(id+' '+garment+' A3 fixed rectangle',a3.preset==='A3'&&!a3.frameVisible&&a3.clipped,a3);
  verify(id+' '+garment+' A3 guide/clip share one rectangle',
   same(a3.guide.x,a3.clip.x,.5)&&same(a3.guide.y,a3.clip.y,.5)&&
   same(a3.guide.width,a3.clip.width,.5)&&same(a3.guide.height,a3.clip.height,.5));
  await pick(page,'printSize','A4');
  const a4=await SNAP(page);
  verify(id+' '+garment+' A4 fixed ratio',same(a4.clip.width*a4.clip.height*2,a3.clip.width*a3.clip.height,.03*a3.clip.width*a3.clip.height)&&within(a4.clip,a3.clip),{a4:a4.clip,a3:a3.clip});
  verify(id+' '+garment+' A4 move handle visible',a4.frameVisible);
  verify(id+' '+garment+' A4 guide/clip share one rectangle',
   same(a4.guide.x,a4.clip.x,.5)&&same(a4.guide.y,a4.clip.y,.5)&&
   same(a4.guide.width,a4.clip.width,.5)&&same(a4.guide.height,a4.clip.height,.5));
  // Four corners of the bounding A3 (overshoot by 1000px; actual clamp must hold).
  for(const [x,y] of [[-1000,-1000],[10000,-1000],[-1000,10000],[10000,10000]]){
   await drag(page,'.cc-worktable-frame-handle',x,y);
   const moved=await SNAP(page);
   verify(id+' '+garment+' A4 clamped to A3',within(moved.clip,a3.clip,2),{moved:moved.clip,a3:a3.clip});
   verify(id+' '+garment+' A4 rigid dimension',same(moved.clip.width,a4.clip.width)&&same(moved.clip.height,a4.clip.height),moved.clip);
  }
 }
 // Real upload and pixel bounds, including rotation/scaling/movement.
 await pick(page,'garment','regular');await pick(page,'printSize','A3');
 await put(page,id+'-front.png');
 await page.locator('.cc-worktable-print.has-art').waitFor();
 await page.locator('.cc-worktable-drag').click();
 for(const preset of ['A3','A4']){
  await pick(page,'printSize',preset);
  for(const adjustment of ['-50','0','25','100']){
   const slider=page.locator('#worktableArtScale');
   const allowed=Math.min(Number(adjustment),Number(await slider.getAttribute('max')));
   await slider.fill(String(allowed));
   await settle(page);
   let snap=await SNAP(page);
   verify(id+' '+preset+' '+adjustment+' scale stays inside print',snap.artVisible&&within(snap.art,snap.clip),snap);
   verify(id+' '+preset+' clipping backup active',snap.clipped);
  }
  const art=await point(page,'.cc-worktable-drag');
  for(const [x,y] of [[-2000,-2000],[10000,10000],[-2000,10000],[10000,-2000]]){
   await drag(page,'.cc-worktable-drag',x,y);
   const moved=await SNAP(page);
   verify(id+' '+preset+' artwork drag clamped',within(moved.art,moved.clip),moved);
  }
  await page.locator('.cc-worktable-drag').click();
  await page.locator('.cc-worktable-tool[data-tool="rotate"]').click();
  await settle(page);
  const turned=await SNAP(page);
  verify(id+' '+preset+' rotated 90 remains inside',within(turned.art,turned.clip),turned);
  await page.locator('.cc-worktable-tool[data-tool="rotate"]').click();
  await settle(page);
  const turned180=await SNAP(page);
  verify(id+' '+preset+' rotated 180 remains inside',within(turned180.art,turned180.clip));
 }
 await pick(page,'printSize','A4');
 await page.locator('#worktableResetArt').click();
 await settle(page);
 const guideBefore=await SNAP(page);
 await drag(page,'.cc-worktable-frame-handle',guideBefore.clip.x+guideBefore.clip.width+100,guideBefore.clip.y+guideBefore.clip.height+70);
 const afterFrame=await SNAP(page);
 verify(id+' A4 moved frame carries artwork',within(afterFrame.art,afterFrame.clip)&&(!same(afterFrame.clip.x,guideBefore.clip.x)||!same(afterFrame.clip.y,guideBefore.clip.y)),{before:guideBefore,after:afterFrame});
 await page.screenshot({path:path.join(folder,id+'-a4-frame.png'),animations:'disabled'});
 const front=await SNAP(page);
 await page.getByRole('button',{name:'View back',exact:true}).click();
 await page.locator('.cc-worktable-garment-surface[data-side="back"]').waitFor({timeout:30000});
 await pick(page,'printSize','A4');await put(page,id+'-back.png');
 await page.getByRole('button',{name:'View front',exact:true}).click();
 await page.locator('.cc-worktable-garment-surface[data-side="front"]').waitFor({timeout:30000});
 const restored=await SNAP(page);
 verify(id+' front A4 frame & art state restored',same(front.clip.x,restored.clip.x)&&same(front.clip.y,restored.clip.y)&&within(restored.art,restored.clip),{front,restored});
 verify(id+' unchanged invoice pricing',restored.price==='৳650',{price:restored.price});
 await ctx.close();
 }
 }finally{await browser.close();await webkitBrowser.close()}
 const result={origin:root,checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,errors,requests,physicalIPadTested:false};
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,errors,requests,failedChecks:checks.filter(x=>!x.pass).slice(0,12)},null,2));
 if(result.failed||errors.length||requests.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
