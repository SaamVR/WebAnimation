const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const origin=process.env.CC_QA_ROOT||'http://127.0.0.1:4489';
const out=path.resolve(process.env.CC_QA_OUT||'perf-results/price-tag-typography');
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],requests=[];
const check=(name,ok,detail)=>{checks.push({name,pass:!!ok,detail});if(!ok)console.error('FAIL',name,JSON.stringify(detail));};
const imageData=sharp({create:{width:500,height:600,channels:4,background:{r:226,g:57,b:24,alpha:1}}}).png().toBuffer();
const choose=(p,k,v)=>p.locator('.cc-worktable-choice[data-group="'+k+'"][data-value="'+v+'"]').click();
const switchSide=async(p,side)=>{await p.getByRole('button',{name:side==='back'?'View back':'View front'}).click();await p.waitForFunction(x=>document.querySelector('.cc-worktable-garment-surface')?.dataset.side===x,side,{timeout:30000})};
const upload=async(p,name)=>p.locator('#worktableFile').setInputFiles({name,mimeType:'image/png',buffer:await imageData});
const names=[['desktop',chromium,1440,900],['ipad-webkit',webkit,834,1112],['mobile',chromium,390,844]];
const money=v=>'৳'+new Intl.NumberFormat('en-BD').format(v);
async function snapshot(page){
 return page.evaluate(()=>{
  const mobile=matchMedia('(max-width:700px)').matches;
  const tag=document.querySelector(mobile?'.cc-worktable-price-tag-mobile':'.cc-worktable-price-tag-stage');
  const wrap=tag.querySelector('.cc-worktable-tag-typography');
  const label=tag.querySelector('.cc-worktable-tag-label');
  const amount=tag.querySelector('.cc-worktable-tag-total');
  const tagBox=tag.getBoundingClientRect(),l=label.getBoundingClientRect(),a=amount.getBoundingClientRect();
  const style=getComputedStyle(wrap),ls=getComputedStyle(label),as=getComputedStyle(amount);
  const angle=Math.atan2(new DOMMatrixReadOnly(style.transform).b,new DOMMatrixReadOnly(style.transform).a)*180/Math.PI;
  const relative=r=>({left:(r.left-tagBox.left)/tagBox.width,right:(r.right-tagBox.left)/tagBox.width,top:(r.top-tagBox.top)/tagBox.height,bottom:(r.bottom-tagBox.top)/tagBox.height});
  const garment=document.querySelector('.cc-worktable-garment-surface').getBoundingClientRect();
  const overlapsGarment=!(tagBox.right<=garment.left||tagBox.left>=garment.right||tagBox.bottom<=garment.top||tagBox.top>=garment.bottom);
  return {
   label:label.textContent.trim(),amount:amount.textContent.trim(),invoice:document.querySelector('#worktablePriceTotal').textContent.trim(),
   bothPrices:[...document.querySelectorAll('.cc-worktable-tag-total')].map(x=>x.textContent.trim()),
   nameFont:style.fontFamily,labelWeight:ls.fontWeight,amountWeight:as.fontWeight,
   labelSize:parseFloat(ls.fontSize),amountSize:parseFloat(as.fontSize),angle,
   labelBox:relative(l),amountBox:relative(a),tagWidth:tagBox.width,tagHeight:tagBox.height,
   totalInvoiceVisible:!!document.querySelector('.cc-worktable-invoice')?.getClientRects().length,
   fontLoaded:document.fonts.check('700 24px "Hind Siliguri"'),
   artLoaded:tag.querySelector('img').complete&&tag.querySelector('img').naturalWidth>0,
   nonInteractive:getComputedStyle(tag).pointerEvents==='none',
   overlapsGarment,stageTagPosition:getComputedStyle(document.querySelector('.cc-worktable-price-tag-stage')).position,
   mobileBelow:mobile?tagBox.top>=document.querySelector('.cc-worktable-stage').getBoundingClientRect().bottom:false,
   groupMatrix:style.transform,tagMatrix:getComputedStyle(tag).transform
  };
 });
}
async function verify(page,label,want,detail=false){
 await page.waitForFunction(m=>document.querySelector('#worktablePriceTotal')?.textContent.trim()===m,want,{timeout:15000});
 const x=await snapshot(page);
 check(label+' invoice + both tags '+want,x.invoice===want&&x.amount===want&&x.bothPrices.every(y=>y===want),x);
 check(label+' two-line printed label and correct typography',x.label==='TOTAL'&&/Hind Siliguri/.test(x.nameFont)&&x.labelWeight==='600'&&x.amountWeight==='700'&&x.amountSize>x.labelSize,{label:x.label,font:x.nameFont,weights:[x.labelWeight,x.amountWeight],sizes:[x.labelSize,x.amountSize]});
 check(label+' printed tilt -2.5deg with no PNG rotation',Math.abs(x.angle+2.5)<0.2,{group:x.groupMatrix,outer:x.tagMatrix,angle:x.angle});
 check(label+' amount visibly inside paper',x.amountBox.left>0.28&&x.amountBox.right<0.94&&x.amountBox.top>0.18&&x.amountBox.bottom<0.86,x.amountBox);
 check(label+' label visibly inside paper',x.labelBox.left>0.28&&x.labelBox.right<0.94&&x.labelBox.top>0.18&&x.labelBox.bottom<0.86,x.labelBox);
 if(detail){
  check(label+' image, invoice, interaction and placement',x.artLoaded&&x.totalInvoiceVisible&&x.nonInteractive&&!x.overlapsGarment&&(!label.includes('mobile')||x.mobileBelow),x);
  check(label+' no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
  check(label+' actual Hind Siliguri font loaded',x.fontLoaded,{loaded:x.fontLoaded});
 }
 return x;
}
(async()=>{
 const chrome=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const wk=await webkit.launch({headless:true});
 try{
  for(const [name,engine,w,h] of names){
   const browser=engine===chromium?chrome:wk;
   const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:name!=='desktop',isMobile:name==='mobile',deviceScaleFactor:2,reducedMotion:'reduce'});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push({name,msg:e.message}));
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))requests.push({name,status:r.status(),url:r.url()})});
   await page.goto(origin+'/artists-edit/',{waitUntil:'load',timeout:60000});
   await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
   await page.locator('.cc-worktable-garment-surface').waitFor({timeout:90000});
   await page.evaluate(async()=>{await document.fonts.ready});
   await verify(page,name+' blank','৳450',true);
   const tag=page.locator(name==='mobile'?'.cc-worktable-price-tag-mobile':'.cc-worktable-price-tag-stage');
   await tag.screenshot({path:path.join(out,name+'-tag-450.png'),animations:'disabled'});
   for(const [g,cost] of [['regular',450],['dropShoulder',550],['fullSleeve',650],['hoodie',850]]){
    await choose(page,'garment',g);await verify(page,name+' '+g,money(cost));
   }
   await choose(page,'printSize','A3');await verify(page,name+' no art A3','৳850');
   await upload(page,name+'-front.png');await verify(page,name+' A3 front','৳1,050');
   await switchSide(page,'back');await verify(page,name+' switch to blank back','৳1,050');
   await choose(page,'printSize','A3');await upload(page,name+'-back.png');await verify(page,name+' max two-sided A3','৳1,250',true);
   await page.evaluate(async()=>{await document.fonts.ready});
   await tag.screenshot({path:path.join(out,name+'-tag-1250.png'),animations:'disabled'});
   await page.locator('.cc-worktable-stage').screenshot({path:path.join(out,name+'-stage-1250.png'),animations:'disabled'});
   await page.locator('.cc-worktable-price').screenshot({path:path.join(out,name+'-invoice-1250.png'),animations:'disabled'});
   const final=await snapshot(page);
   check(name+' amount width + bbox not clipped for ৳1,250',final.amountBox.left>0.30&&final.amountBox.right<0.90,final.amountBox);
   await choose(page,'printSize','A4');await verify(page,name+' mixed A3/A4','৳1,150');
   await switchSide(page,'front');await verify(page,name+' front back preservation','৳1,150');
   await choose(page,'size','XXL');await choose(page,'color','red');
   await verify(page,name+' size color neutral','৳1,150');
   await ctx.close();
  }
 }finally{await chrome.close();await wk.close()}
 const summary={origin,checks,pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,errors,requests,physicalIPad:'NOT tested — automated desktop WebKit viewport only'};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({pass:summary.pass,fail:summary.fail,errors,requests,failed:checks.filter(x=>!x.pass)},null,2));
 if(summary.fail||errors.length||requests.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
