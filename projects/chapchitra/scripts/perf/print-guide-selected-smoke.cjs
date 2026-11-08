/* Focused settled transform gate: do not sample WebKit mid-190ms animation. */
const {webkit}=require('playwright');
const fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4427/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/print-guide-selected-webkit');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await webkit.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 const values=[];
 for(const color of ['black','white','red','yellow','blue','green']){
  await page.locator('.cc-worktable-choice[data-group=color][data-value='+color+']').click();
  await page.mouse.move(0,0);
  await page.waitForFunction(c=>{
   const e=document.querySelector('.cc-worktable-prop[data-group=color][data-value='+c+']');
   return e?.classList.contains('is-selected')&&
    Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m42+5.5)<.15;
  },color,{timeout:6000,polling:'raf'});
  const transform=await page.locator('.cc-worktable-prop[data-group=color][data-value='+color+']')
   .evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m42);
  values.push({color,transform,pass:Math.abs(transform+5.5)<.15});
 }
 const report={target:URL,total:values.length,passed:values.filter(x=>x.pass).length,
  failed:values.filter(x=>!x.pass).length,values,errors};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
 await browser.close();
 if(report.failed||errors.length)process.exitCode=2;
})().catch(e=>{console.error('SELECTED SMOKE FAILED',e.stack);process.exitCode=3});
