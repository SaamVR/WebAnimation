const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const url=process.env.CC_QA_URL||'http://127.0.0.1:4457/artists-edit/';
const folder=path.resolve(process.env.CC_QA_OUT||'perf-results/two-sided-qa');
fs.mkdirSync(folder,{recursive:true});
const results=[];const errors=[];const failed=[];
const check=(label,ok,data)=>{results.push({label,pass:!!ok,data});if(!ok)console.error('FAIL',label,JSON.stringify(data))};
const source=async(w,h,r,g,b)=>sharp({create:{width:w,height:h,channels:4,
 background:{r,g,b,alpha:1}}}).png().toBuffer();
const art=async(page,w,h,r,g,b,name)=>{
 await page.locator('#worktableFile').setInputFiles({name,mimeType:'image/png',
  buffer:await source(w,h,r,g,b)});
 await page.locator('.cc-worktable-print.has-art').waitFor();
};
const side=async page=>page.locator('.cc-worktable-garment-surface').last().getAttribute('data-side');
const garment=async page=>page.locator('.cc-worktable-garment-surface').last().getAttribute('data-garment');
const turn=async(page,wanted)=>{
 const expected=wanted==='back'?'View back':'View front';
 await page.getByRole('button',{name:expected,exact:true}).click();
 await page.waitForFunction(target=>{
  const c=document.querySelector('.cc-worktable-garment-surface');
  return c&&c.dataset.side===target&&document.querySelector('.cc-worktable-view-button:not(:disabled)');
 },wanted,{timeout:35000});
};
const choose=async(page,group,value)=>page.locator('.cc-worktable-choice[data-group="'+group+'"][data-value="'+value+'"]').click();
const snapshot=async page=>page.evaluate(()=>{
 const print=document.querySelector('.cc-worktable-print'),img=print?.querySelector('img');
 const guide=document.querySelector('.cc-worktable-paper-guide');
 const c=document.querySelector('.cc-worktable-garment-surface');
 return {side:c?.dataset.side,garment:c?.dataset.garment,color:c?.dataset.color,
  source:img?.getAttribute('src')||'',size:document.querySelector('#worktableArtScale')?.value,
  preset:guide?.dataset.preset,rotation:print?.dataset.rotation,
  x:parseFloat(print?.style.left||'0'),y:parseFloat(print?.style.top||'0')};
});
(async()=>{
 const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/assets/worktable/back/variants/')&&
   !page.__startedBack)failed.push('Back asset eagerly requested: '+r.url())});
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/worktable/back/'))
   failed.push(r.status()+' '+r.url())});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
  check('default front visible',await side(page)==='front');
  check('no eager back image requests',failed.length===0,failed);
  page.__startedBack=true;
  for(const style of ['regular','dropShoulder','fullSleeve','hoodie']){
   await choose(page,'garment',style);
   await page.waitForFunction(g=>document.querySelector('.cc-worktable-garment-surface')?.dataset.garment===g,style);
   await page.locator('.cc-worktable-frame').screenshot({path:path.join(folder,style+'-front.png')});
   await turn(page,'back');
   check(style+' back artwork and registration',await side(page)==='back'&&await garment(page)===style);
   const bounds=await page.locator('.cc-worktable-garment-surface').boundingBox();
   const stage=await page.locator('.cc-worktable-stage').boundingBox();
   check(style+' back contained in stage',bounds.x>=stage.x-2&&bounds.y>=stage.y-2&&bounds.x+bounds.width<=stage.x+stage.width+2&&bounds.y+bounds.height<=stage.y+stage.height+2,bounds);
   await page.locator('.cc-worktable-frame').screenshot({path:path.join(folder,style+'-back.png')});
   await turn(page,'front');
  }
  await choose(page,'garment','regular');
  await choose(page,'printSize','A3');
  await art(page,410,570,28,152,108,'front-green.png');
  await page.locator('.cc-worktable-drag').click();
  await page.locator('.cc-worktable-tool[data-tool=rotate]').click();
  await page.locator('#worktableArtScale').fill('-20');
  await page.locator('.cc-worktable-drag').focus();await page.keyboard.press('ArrowRight');
  const front=await snapshot(page);
  check('front signed shrink remains possible after 90-degree rotation',front.size==='-20',front);
  await turn(page,'back');await choose(page,'printSize','A4');
  await art(page,620,350,215,52,42,'back-red.png');
  await page.locator('.cc-worktable-drag').click();
  await page.locator('.cc-worktable-tool[data-tool=rotate]').click();
  await page.locator('.cc-worktable-tool[data-tool=rotate]').click();
  await page.locator('#worktableArtScale').fill('-15');
  const back=await snapshot(page);
  check('front and back have different object URLs',front.source!==back.source,{front:front.source,back:back.source});
  await turn(page,'front');const restoredFront=await snapshot(page);
  for(const key of ['source','size','preset','rotation','x','y'])
   check('front restores '+key,String(restoredFront[key])===String(front[key]),{before:front[key],after:restoredFront[key]});
  await turn(page,'back');const restoredBack=await snapshot(page);
  for(const key of ['source','size','preset','rotation','x','y'])
   check('back restores '+key,String(restoredBack[key])===String(back[key]),{before:back[key],after:restoredBack[key]});
  await page.locator('#worktableRemoveArt').click();
  check('removing back does not remove front',!await page.locator('.cc-worktable-print.has-art').count());
  await turn(page,'front');
  check('front preserved after removing back',await page.locator('.cc-worktable-print.has-art').count()===1);
  for(const style of ['regular','dropShoulder','fullSleeve','hoodie']){
   await choose(page,'garment',style);await turn(page,'back');
   for(const color of ['black','white','red','yellow','blue','green']){
    await choose(page,'color',color);
    await page.waitForFunction(c=>document.querySelector('.cc-worktable-garment-surface')?.dataset.color===c,color);
    check(style+' back '+color,await page.locator('.cc-worktable-garment-surface[data-side=back][data-color="'+color+'"]').count()===1);
   }
   await turn(page,'front');
  }
  await page.close();
  const wk=await webkit.launch({headless:true});
  const tablet=await wk.newPage({viewport:{width:834,height:1112},hasTouch:true,isMobile:true});
  tablet.on('pageerror',e=>errors.push(e.message));
  await tablet.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await tablet.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
  await turn(tablet,'back');check('WebKit tablet switches to actual back',await side(tablet)==='back');
  await turn(tablet,'front');check('WebKit tablet returns to front',await side(tablet)==='front');
  await tablet.close();await wk.close();
 }finally{await browser.close()}
 check('no errors',errors.length===0,errors);check('back resources served successfully',failed.length===0,failed);
 const summary={url,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results,errors,failedResponses:failed};
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({passed:summary.passed,failed:summary.failed,errors,failedResponses:failed}));
 if(summary.failed)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
