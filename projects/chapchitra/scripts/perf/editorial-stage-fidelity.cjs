const {chromium}=require('playwright');
const sharp=require('sharp');
const path=require('path'),fs=require('fs');
const OLD=process.env.CC_BEFORE_URL||'http://127.0.0.1:4355/artists-edit/';
const NEW=process.env.CC_QA_URL||'http://127.0.0.1:4366/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/editorial-stage-fidelity');
fs.mkdirSync(OUT,{recursive:true});
async function capture(browser,url,state,version){
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable').classList.contains('is-hydrating'),null,{timeout:65000});
 if(state==='red-hoodie'){
  await page.locator('.cc-worktable-choice[data-group=garment][data-value=hoodie]').click();
  await page.locator('.cc-worktable-choice[data-group=color][data-value=red]').click();
  await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.garment==='hoodie'&&document.querySelector('.cc-worktable-garment-surface')?.dataset.color==='red',null,{timeout:40000});
 }
 await page.mouse.move(0,0);
 await page.waitForTimeout(350);
 const file=path.join(OUT,version+'-'+state+'.png');
 await page.locator('.cc-worktable-stage').screenshot({path:file,animations:'disabled'});
 const metrics=await page.evaluate(()=>({
  stageRect:(()=>{const r=document.querySelector('.cc-worktable-stage').getBoundingClientRect();return [r.width,r.height]})(),
  stageChildren:document.querySelectorAll('.cc-worktable-stage>.cc-worktable-layer').length,
  garment:[document.querySelector('.cc-worktable-garment-surface')?.dataset.garment,document.querySelector('.cc-worktable-garment-surface')?.dataset.color],
  preview:document.querySelectorAll('.cc-worktable-preview').length,
  selected:[...document.querySelectorAll('.cc-worktable-prop.is-selected')].map(x=>x.dataset.group+':'+x.dataset.value).sort(),
 }));
 await page.close();return {file,metrics,errors};
}
async function compare(a,b){
 const [old,newer]=await Promise.all([sharp(a.file).raw().toBuffer({resolveWithObject:true}),sharp(b.file).raw().toBuffer({resolveWithObject:true})]);
 if(old.info.width!==newer.info.width||old.info.height!==newer.info.height||old.info.channels!==newer.info.channels)throw Error('Stage screenshot changed dimensions');
 let sum=0,n=0,changes=0;
 for(let offset=0;offset<old.data.length;offset+=old.info.channels){
  let changed=false;for(let channel=0;channel<3;channel++){
   const delta=Math.abs(old.data[offset+channel]-newer.data[offset+channel]);sum+=delta;n++;changed ||=delta>2;
  }
  if(changed)changes++;
 }
 return {width:old.info.width,height:old.info.height,meanAbsRGB:sum/n,pixelsChangedOver2:changes,percentChangedOver2:changes*100/(old.info.width*old.info.height)};
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={};
 for(const state of ['resting','red-hoodie']){
  const before=await capture(browser,OLD,state,'before');
  const after=await capture(browser,NEW,state,'after');
  const diff=await compare(before,after);
  report[state]={before:before.metrics,after:after.metrics,diff,errors:[...before.errors,...after.errors]};
  console.log(state,JSON.stringify(report[state]));
  if(diff.meanAbsRGB>1.5||diff.percentChangedOver2>1.25||report[state].errors.length)throw Error('Approved worktable visual fidelity REGRESSION '+state);
 }
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=2});
