const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const url=process.env.CC_QA_ROOT||'http://127.0.0.1:4490';
const dir=path.resolve(process.env.CC_QA_OUT||'perf-results/printed-total');
fs.mkdirSync(dir,{recursive:true});
const checks=[],errors=[],failedHTTP=[];
const record=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)console.error('FAIL',name,JSON.stringify(detail));};
const png=sharp({create:{width:460,height:580,channels:4,background:{r:226,g:97,b:47,alpha:1}}}).png().toBuffer();
const select=(p,key,val)=>p.locator('.cc-worktable-choice[data-group="'+key+'"][data-value="'+val+'"]').click();
const upload=async(p,name)=>p.locator('#worktableFile').setInputFiles({name,mimeType:'image/png',buffer:await png});
const flip=async(p,side)=>{await p.getByRole('button',{name:side==='back'?'View back':'View front'}).click();await p.waitForFunction(s=>document.querySelector('.cc-worktable-garment-surface')?.dataset.side===s,side,{timeout:40000})};
async function inspect(p){
 return p.evaluate(()=>{
  const mobile=matchMedia('(max-width:700px)').matches;
  const tag=document.querySelector(mobile?'.cc-worktable-price-tag-mobile':'.cc-worktable-price-tag-stage');
  const amount=tag.querySelector('.cc-worktable-tag-total');
  const typography=tag.querySelector('.cc-worktable-tag-typography');
  const img=tag.querySelector('img');
  const st=getComputedStyle(typography),sa=getComputedStyle(amount),si=getComputedStyle(tag);
  const mat=new DOMMatrixReadOnly(st.transform);
  const tilt=Math.atan2(mat.b,mat.a)*180/Math.PI;
  const bbox=tag.getBoundingClientRect();
  const range=document.createRange();range.selectNodeContents(amount);
  const text=range.getBoundingClientRect();
  const rel=r=>({left:(r.left-bbox.left)/bbox.width,right:(r.right-bbox.left)/bbox.width,top:(r.top-bbox.top)/bbox.height,bottom:(r.bottom-bbox.top)/bbox.height});
  const garment=document.querySelector('.cc-worktable-garment-surface').getBoundingClientRect();
  return {
   titleTextCount:tag.querySelectorAll('.cc-worktable-tag-label').length,
   childCount:typography.children.length,amountText:amount.textContent.trim(),
   tagTotals:[...document.querySelectorAll('.cc-worktable-tag-total')].map(e=>e.textContent.trim()),
   invoice:document.querySelector('#worktablePriceTotal').textContent.trim(),
   invoiceVisible:document.querySelector('.cc-worktable-invoice')?.getClientRects().length>0,
   font:st.fontFamily,weight:sa.fontWeight,size:parseFloat(sa.fontSize),tilt,
   fontReady:document.fonts.check('600 18px "Noto Serif Bengali"'),
   textRel:rel(text),textBoxRel:rel(typography.getBoundingClientRect()),
   amountOverflow:amount.scrollWidth>amount.clientWidth+2,
   imgLoaded:img.complete&&img.naturalWidth===312&&img.naturalHeight===142,
   tagPointer:si.pointerEvents,tagOuterMatrix:si.transform,
   collidesGarment:!(bbox.right<=garment.left||bbox.left>=garment.right||bbox.bottom<=garment.top||bbox.top>=garment.bottom),
   mobileBelow:mobile?bbox.top>=document.querySelector('.cc-worktable-stage').getBoundingClientRect().bottom:false,
   horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
  };
 });
}
async function assertPrice(p,name,want,full=false){
 await p.waitForFunction(w=>document.querySelector('#worktablePriceTotal')?.textContent.trim()===w,want,{timeout:30000});
 const x=await inspect(p);
 record(name+' both price tags and invoice '+want,x.invoice===want&&x.amountText===want&&x.tagTotals.length===2&&x.tagTotals.every(a=>a===want),x);
 record(name+' no duplicate HTML title',x.titleTextCount===0&&x.childCount===1,{title:x.titleTextCount,child:x.childCount});
 record(name+' press-green serif amount',/Noto Serif Bengali/.test(x.font)&&x.weight==='700'&&x.size>0,x);
 record(name+' amount tilt only',Math.abs(x.tilt+2.5)<0.18,{tilt:x.tilt,outer:x.tagOuterMatrix});
 record(name+' printed text fits',!x.amountOverflow&&x.textRel.left>0.17&&x.textRel.right<0.985&&x.textRel.top>0.25&&x.textRel.bottom<0.985,x.textRel);
 if(full){
   record(name+' asset and permanent invoice',x.imgLoaded&&x.invoiceVisible&&x.fontReady,{img:x.imgLoaded,invoice:x.invoiceVisible,font:x.fontReady});
   record(name+' non-interactive and collision free',x.tagPointer==='none'&&!x.collidesGarment&&!x.horizontalOverflow&&(!name.includes('mobile')||x.mobileBelow),x);
 }
 return x;
}
(async()=>{
 const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const wk=await webkit.launch({headless:true});
 try{
  for(const [browser,name,w,h] of [[chrome,'desktop',1440,900],[wk,'tablet-webkit',834,1112],[chrome,'mobile',390,844]]){
   const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,hasTouch:name!=='desktop',isMobile:name==='mobile'});
   const p=await context.newPage();
   p.on('pageerror',e=>errors.push({name,msg:e.message}));
   p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(url))failedHTTP.push({name,status:r.status(),url:r.url()})});
   await p.goto(url+'/artists-edit/',{waitUntil:'load',timeout:60000});
   await p.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
   await p.locator('.cc-worktable-garment-surface').waitFor({timeout:90000});
   await p.evaluate(async()=>document.fonts.ready);
   await assertPrice(p,name+' baseline','৳450',true);
   const tag=p.locator(name==='mobile'?'.cc-worktable-price-tag-mobile':'.cc-worktable-price-tag-stage');
   await tag.screenshot({path:path.join(dir,name+'-tag-450.png'),animations:'disabled'});
   for(const [garment,amount] of [['regular','৳450'],['dropShoulder','৳550'],['fullSleeve','৳650'],['hoodie','৳850']]){
    await select(p,'garment',garment);
    await assertPrice(p,name+' '+garment,amount);
   }
   await select(p,'printSize','A3');
   await assertPrice(p,name+' A3 without art','৳850');
   await upload(p,name+'-front.png');
   await assertPrice(p,name+' A3 front','৳1,050');
   await flip(p,'back');
   await assertPrice(p,name+' back view preserving front','৳1,050');
   await select(p,'printSize','A3');
   await upload(p,name+'-back.png');
   await assertPrice(p,name+' dual A3 max','৳1,250',true);
   await tag.screenshot({path:path.join(dir,name+'-tag-1250.png'),animations:'disabled'});
   await p.locator('.cc-worktable-stage').screenshot({path:path.join(dir,name+'-stage-1250.png'),animations:'disabled'});
   await p.locator('.cc-worktable-price').screenshot({path:path.join(dir,name+'-invoice-1250.png'),animations:'disabled'});
   await select(p,'printSize','A4');
   await assertPrice(p,name+' A3/A4 mixed','৳1,150');
   await flip(p,'front');await assertPrice(p,name+' restore front','৳1,150');
   await select(p,'size','XXL');await select(p,'color','red');
   await assertPrice(p,name+' size/color neutral','৳1,150');
   await p.close();await context.close();
  }
 }finally{await chrome.close();await wk.close()}
 const result={url,checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length,errors,failedHTTP,physicalIPad:'Not tested — desktop WebKit viewport'};
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({passed:result.passed,failed:result.failed,errors,failedHTTP,failures:checks.filter(x=>!x.pass).slice(0,8)},null,2));
 if(result.failed||errors.length||failedHTTP.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
