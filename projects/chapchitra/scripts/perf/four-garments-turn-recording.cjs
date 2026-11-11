const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
const url=process.env.CC_QA_URL||'http://127.0.0.1:4479/artists-edit/';
const out=path.resolve('perf-results/three-fixes-turn-recording');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:90000});
  for(const style of ['regular','dropShoulder','fullSleeve','hoodie']){
   await page.locator('.cc-worktable-choice[data-group="garment"][data-value="'+style+'"]').click();
   await page.waitForFunction(s=>document.querySelector('.cc-worktable-garment-surface')?.dataset.garment===s,style);
   await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
   await page.waitForTimeout(600);
   await page.getByRole('button',{name:'View back'}).click();
   await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.side==='back');
   await page.waitForTimeout(900);
   await page.getByRole('button',{name:'View front'}).click();
   await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.side==='front');
   await page.waitForTimeout(650);
  }
  await ctx.close();
  const source=await page.video().path(),target=path.join(out,'all-four-garment-turns.webm');
  if(source!==target)fs.copyFileSync(source,target);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({url,garments:4,sides:8,errors,video:'all-four-garment-turns.webm'},null,2));
  console.log(JSON.stringify({garments:4,sides:8,errors,video:target},null,2));
  if(errors.length)process.exitCode=2;
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
