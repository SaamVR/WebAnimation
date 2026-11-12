/* CHAPCHITRA Artist's Edit control-skin regression.
 * Use the actual built application in Chromium and WebKit. This script does
 * not alter print geometry or test touch hardware; WebKit is simulated iPad.
 */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=(process.env.CC_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const out=path.resolve(process.env.CC_QA_OUT||'perf-results/artist-controls');
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],httpErrors=[];
const verify=(name,condition,detail)=>{checks.push({name,pass:!!condition});if(!condition)console.error('FAIL',name,detail);};
const close=(a,b,epsilon=2)=>Math.abs(a-b)<=epsilon;
const within=(inner,outer,pad=2)=>inner.left>=outer.left-pad&&inner.top>=outer.top-pad&&inner.right<=outer.right+pad&&inner.bottom<=outer.bottom+pad;
const withinStage=(inner,outer,innerStage,outerStage,pad=2)=>within(
 {left:inner.left-innerStage.left,top:inner.top-innerStage.top,right:inner.right-innerStage.left,bottom:inner.bottom-innerStage.top},
 {left:outer.left-outerStage.left,top:outer.top-outerStage.top,right:outer.right-outerStage.left,bottom:outer.bottom-outerStage.top},pad);
const capture=async(page)=>page.evaluate(()=>{
 const el=sel=>document.querySelector(sel);
 const box=sel=>{const r=el(sel).getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 const button=el('.cc-worktable-view-button'),arrow=el('.cc-worktable-frame-handle'),label=el('.cc-worktable-view-label');
 return {stage:box('.cc-worktable-stage'),guide:box('.cc-worktable-paper-guide'),
  move:box('.cc-worktable-frame-handle'),button:box('.cc-worktable-view-button'),
  label:box('.cc-worktable-view-label'),visual:box('.cc-worktable-view-button .cc-compact-svg'),viewText:button.getAttribute('aria-label'),text:label.textContent,
  terracotta:button.classList.contains('cc-sketch--terracotta'),
  faceFill:getComputedStyle(button.querySelector('[id="BUTTON_FACE"] path.st8')||button.querySelector('[id="BUTTON_FACE"]')).fill,
  compactState:button.dataset.compact,font:getComputedStyle(button).fontFamily,
  fontSize:parseFloat(getComputedStyle(button).fontSize),moveColor:getComputedStyle(arrow).color,
  moveBackground:getComputedStyle(arrow).backgroundColor,
  compactSource:button.querySelector('svg.cc-compact-svg')?.getAttribute('viewBox'),
  movePath:arrow.querySelector('svg path')?.getAttribute('d'),moveSvg:!!arrow.querySelector('svg'),
  moveVisible:!arrow.hidden,stageBusy:el('.cc-worktable-stage').getAttribute('aria-busy')};
});
const choose=async(p,group,value)=>{
 await p.locator('.cc-worktable-choice[data-group="'+group+'"][data-value="'+value+'"]').click();
 await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
};
const image=()=>sharp({create:{width:640,height:900,channels:4,background:{r:41,g:61,b:45,alpha:1}}}).png().toBuffer();
const drag=async(page,locator,dx,dy)=>{
 await locator.scrollIntoViewIfNeeded();
 const box=await locator.boundingBox();
 const x=box.x+box.width/2,y=box.y+box.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:12});await page.mouse.up();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
};
(async()=>{
 for(const [engine,id,width,height] of [[chromium,'desktop',1440,900],[webkit,'ipad-webkit',834,1112],[chromium,'mobile',390,844]]){
  const browser=await engine.launch({headless:true,executablePath:id==='desktop'||id==='mobile'?(process.env.CHROMIUM_PATH||undefined):undefined,args:id==='ipad-webkit'?[]:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:id==='mobile',hasTouch:id!=='desktop',reducedMotion:'reduce'});
  const page=await context.newPage();
  try{
   page.on('pageerror',error=>errors.push({id,message:error.message}));
   page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(root))httpErrors.push({id,status:response.status(),url:response.url()});});
   await page.goto(root+'/artists-edit/',{waitUntil:'load',timeout:60000});
   await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
   await page.locator('.cc-worktable-view-button[data-compact="ready"]').waitFor({timeout:20000});
   await choose(page,'printSize','A3');
   const a3=await capture(page);
   await choose(page,'printSize','A4');
   const start=await capture(page);
   verify(id+' approved compact SVG hydrated',start.compactState==='ready'&&start.compactSource==='0 0 164 64',start);
   verify(id+' new A4 inline four-arrow path',start.moveSvg&&start.movePath?.startsWith('M12 3v18M3 12h18'),start);
   verify(id+' A4 move uses press green + gallery white',start.moveBackground==='rgb(41, 61, 45)'&&start.moveColor==='rgb(246, 247, 245)',start);
   verify(id+' A4 handle exact 44px',close(start.move.width,44,.1)&&close(start.move.height,44,.1),start.move);
   verify(id+' A4 initially inside A3',withinStage(start.guide,a3.guide,start.stage,a3.stage),{a3:a3.guide,a4:start.guide});
   verify(id+' both text and icon readable',start.label.width>=35&&start.label.height>=12&&within(start.label,start.button,6),start);
   verify(id+' text uses Hind Siliguri',start.font.toLowerCase().includes('hind siliguri'),start.font);
   if(id!=='mobile')verify(id+' requested 16–17px label',start.fontSize>=15.9&&start.fontSize<=17,start.fontSize);
   verify(id+' button has 44px+ native hit height',start.button.height>=44,start.button);
   verify(id+' exact approved Terracotta Compact variant',start.terracotta&&start.faceFill==='rgb(138, 80, 59)',{terracotta:start.terracotta,faceFill:start.faceFill});
   verify(id+' visible Compact SVG is 80% in both dimensions',
    close(start.visual.width,start.button.width*.8,1.4)&&close(start.visual.height,start.button.height*.8,1.4),
    {button:start.button,visible:start.visual});
   verify(id+' compact artwork horizontally centered under shirt',
    close((start.visual.left+start.visual.right)/2,(start.stage.left+start.stage.right)/2,2),
    {button:start.visual,stage:start.stage});
   verify(id+' visible button remains inside wooden stage',
    start.visual.bottom<=start.stage.bottom+1&&start.visual.top>=start.stage.top,
    {button:start.visual,stage:start.stage});
   await drag(page,page.locator('.cc-worktable-frame-handle'),-28,24);
   const moved=await capture(page);
   verify(id+' A4 frame drag moves without changing size',(!close(start.guide.x,moved.guide.x,.8)||!close(start.guide.y,moved.guide.y,.8))&&close(start.guide.width,moved.guide.width,.5)&&close(start.guide.height,moved.guide.height,.5),{start:start.guide,moved:moved.guide});
   verify(id+' A4 remains inside A3',withinStage(moved.guide,a3.guide,moved.stage,a3.stage),{a3:a3.guide,moved:moved.guide});
   await page.locator('#worktableFile').setInputFiles({name:'cc-control-regression.png',mimeType:'image/png',buffer:await image()});
   await page.locator('.cc-worktable-print.has-art').waitFor();
   await page.locator('.cc-worktable-stage').screenshot({path:path.join(out,id+'-front.png'),animations:'disabled'});
   const view=page.locator('.cc-worktable-view-button');
   await view.click();
   await page.locator('.cc-worktable-garment-surface[data-side="back"]').waitFor({timeout:40000});
   await page.waitForFunction(()=>document.querySelector('.cc-worktable-view-button')?.getAttribute('aria-label')==='View front');
   verify(id+' flip button changes text in BOTH compact SVG layers',await page.locator('.cc-worktable-view-label').evaluateAll(a=>a.length===2&&a.every(x=>x.textContent==='View front')));
   await page.locator('.cc-worktable-stage').screenshot({path:path.join(out,id+'-back.png'),animations:'disabled'});
   await view.click();
   await page.locator('.cc-worktable-garment-surface[data-side="front"]').waitFor({timeout:40000});
   await page.waitForFunction(()=>document.querySelector('.cc-worktable-view-button')?.getAttribute('aria-label')==='View back');
   verify(id+' flip restores View back in both layers',await page.locator('.cc-worktable-view-label').evaluateAll(a=>a.length===2&&a.every(x=>x.textContent==='View back')));
   verify(id+' uploaded artwork still visible',await page.locator('.cc-worktable-print.has-art').count()===1);
  }catch(e){errors.push({id,message:e.stack||e.message});}
  finally{await browser.close();}
 }
 const result={root,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass).length,checks,errors,httpErrors,physicalIPadTested:false};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,errors,httpErrors},null,2));
 if(result.failed||errors.length||httpErrors.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
