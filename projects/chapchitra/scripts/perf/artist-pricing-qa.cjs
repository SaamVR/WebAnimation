const {chromium,webkit}=require('playwright'),sharp=require('sharp'),fs=require('fs'),path=require('path');
const base=process.env.CC_QA_ROOT||'http://127.0.0.1:4485';
const dir=path.resolve(process.env.CC_QA_OUT||'perf-results/artist-pricing');
fs.mkdirSync(dir,{recursive:true});
const checks=[],errors=[],http=[];
const record=(name,ok,detail)=>{checks.push({name,pass:!!ok,detail});if(!ok)console.error('FAILED',name,JSON.stringify(detail))};
const png=sharp({create:{width:400,height:550,channels:4,background:{r:243,g:70,b:26,alpha:1}}}).png().toBuffer();
// The approved phone UI hides the legacy below-stage choice rail: exercise the
// same reducer through its actual illustrated five-category popup instead.
const mobile=p=>p.evaluate(()=>matchMedia('(max-width:600px)').matches);
const sel=async(p,k,v)=>{
 if(await mobile(p)){
  const item=p.locator('.cc-mobile-category-button[data-mobile-group="'+k+'"]');
  await item.click();
  await p.locator('.cc-mobile-popup-option[data-group="'+k+'"][data-value="'+v+'"]').click();
  await p.keyboard.press('Escape');
 }else{
  await p.locator('.cc-worktable-choice[data-group="'+k+'"][data-value="'+v+'"]').click();
 }
};
const removeArtwork=async p=>{
 if(await mobile(p))await p.locator('.cc-mobile-category-button[data-mobile-group="upload"]').click();
 await p.locator('#worktableRemoveArt').click();
};
const total=async(p,w)=>{await p.waitForFunction(t=>document.querySelector('#worktablePriceTotal')?.textContent.trim()===t,w,{timeout:15000});record('Total '+w,(await p.locator('#worktablePriceTotal').textContent()).trim()===w)};
const upload=async(p,name)=>p.locator('#worktableFile').setInputFiles({name,mimeType:'image/png',buffer:await png});
const turn=async(p,target)=>{await p.getByRole('button',{name:target==='back'?'View back':'View front'}).click();await p.waitForFunction(side=>document.querySelector('.cc-worktable-garment-surface')?.dataset.side===side,target,{timeout:25000})};
async function open(p){
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))http.push([r.status(),r.url()])});
 await p.goto(base+'/artists-edit/',{waitUntil:'load',timeout:60000});
 await p.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:80000});
}
(async()=>{
 const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const webkitBrowser=await webkit.launch({headless:true});
 try{
  for(const [browser,id,w,h] of [[chrome,'desktop',1440,900],[webkitBrowser,'ipad-webkit',834,1112],[chrome,'mobile',390,844]]){
   const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:id!=='desktop',isMobile:id==='mobile'});
   let p=await ctx.newPage();await open(p);
   record(id+' price below wooden stage',await p.evaluate(()=>{const a=document.querySelector('.cc-worktable-price');return !document.querySelector('.cc-worktable-stage').contains(a)}));
   record(id+' no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   await total(p,'৳450');await sel(p,'printSize','A3');await total(p,'৳450');
   await upload(p,'front.png');await total(p,'৳650');await sel(p,'printSize','A4');await total(p,'৳550');
   await turn(p,'back');await total(p,'৳550');await sel(p,'printSize','A3');
   await upload(p,'back.png');await total(p,'৳750');
   await sel(p,'garment','fullSleeve');await total(p,'৳950');
   await turn(p,'front');await total(p,'৳950');
   await sel(p,'size','XL');await sel(p,'color','green');await total(p,'৳950');
   await p.locator('#worktablePriceBreakdown').waitFor();
   const txt=await p.locator('#worktablePriceBreakdown').innerText();
   record(id+' correct breakdown',txt.includes('Full Sleeve')&&txt.includes('Front print · A4')&&txt.includes('Back print · A3')&&txt.includes('৳950'),txt);
   record(id+' invoice always visible',await p.locator('.cc-worktable-invoice').isVisible());
   record(id+' both tag totals match invoice',await p.evaluate(()=>{
      const expected=document.querySelector('#worktablePriceTotal').textContent.trim();
      return [...document.querySelectorAll('.cc-worktable-tag-total')].every(el=>el.textContent.trim()===expected)
   }));
   await p.locator('.cc-worktable-price').screenshot({path:path.join(dir,id+'-pricing.png')});
   await p.locator('#worktableAddDemoBag').click();
   await p.locator('#worktableBagStatus a').waitFor({timeout:15000});
   const raw=await p.evaluate(()=>sessionStorage.getItem('chapchitra-artist-customizations-v1'));
   const rows=raw?JSON.parse(raw):[];
   record(id+' storage without image bytes',rows.length===1&&rows[0].selection.displayTotalBDT===950&&!raw.includes('blob:')&&!raw.includes('data:image'));
   await p.locator('#worktableBagStatus a').click();await p.waitForURL(/\/bag\//);
   await p.locator('.cc-artist-bag-breakdown summary').click();
   const bag=await p.locator('#bagItems').innerText();
   record(id+' bag dimensions and price',bag.includes('৳950')&&bag.includes('210 × 297')&&bag.includes('297 × 420')&&bag.includes('green'),bag);
   await p.locator('[data-remove-artist-bag]').click();
   record(id+' removal',await p.locator('[data-artist-bag-row]').count()===0);
   await p.close();
   p=await ctx.newPage();await open(p);await turn(p,'back');await upload(p,'back-only.png');
   await total(p,'৳550');await removeArtwork(p);await total(p,'৳450');
   await turn(p,'front');await total(p,'৳450');await p.close();await ctx.close();
  }
 }finally{await chrome.close();await webkitBrowser.close()}
 const result={base,checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,errors,http,physicalIPad:'NOT TESTED'};
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,errors,http,failedCases:checks.filter(x=>!x.pass)},null,2));
 if(result.failed||errors.length||http.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});