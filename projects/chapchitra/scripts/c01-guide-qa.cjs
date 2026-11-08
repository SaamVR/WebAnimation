const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const out=path.resolve(__dirname,'../docs/c01-evidence');
const url=process.env.C01_URL||'http://127.0.0.1:19188/';
const binary='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const results={checked:new Date().toISOString(),checks:[],snapshots:[]};
function check(name,ok,detail){results.checks.push({name,ok,detail});console.log(ok?'PASS':'FAIL',name,JSON.stringify(detail));}
function approx(a,b,tol=.03){return Math.abs(a-b)<=tol}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:binary});
 try{
 for(const width of [1408,834,430,320]){
  const page=await browser.newPage({viewport:{width,height:950},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('#benefits').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.__chapchitraC01?.ready,null,{timeout:45000});
  for(const time of [0,2.445,2.64,2.78,5.085,5.28,5.42,7.475,7.67,7.81,10.27]){
   await page.evaluate(t=>window.__chapchitraC01.seekForQA(t),time);
   await page.waitForTimeout(30);
   const snap=await page.evaluate(()=>({
     circle:[...document.querySelectorAll('#benefits .c01-icon-shell')].map(e=>({
       guide:Number(getComputedStyle(e,'::after').opacity),
       frame:Number(getComputedStyle(e,'::before').opacity),
       art:Number(getComputedStyle(e.querySelector('.c01-icon')).opacity),
       color:getComputedStyle(e,'::after').borderTopColor,
       width:getComputedStyle(e,'::after').width,
       border:getComputedStyle(e,'::after').borderTopWidth
     })),
     connector:[...document.querySelectorAll('#benefits .c01-connection-active')].map(p=>1-parseFloat(p.style.strokeDashoffset)/p.getTotalLength()),
     lineColor:getComputedStyle(document.querySelector('#benefits .c01-connection-guide')).stroke,
     count:document.querySelectorAll('#benefits .c01-lottie svg').length,
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     text:[...document.querySelectorAll('#benefits .c01-copy h3')].map(x=>x.textContent)
   }));
   const c=snap.circle,guide=[.57,...Array(3).fill(.57)];
   const active=t=>approx(t.art,1)&&approx(t.guide,0);
   const pending=t=>approx(t.art,0)&&approx(t.guide,.57);
   let ok=snap.count===4&&!snap.overflow&&
     JSON.stringify(snap.text)===JSON.stringify(['Original Art & Customization','Secure & Flexible Payment','Fast Delivery','24/7 Support'])&&
     c.every(t=>t.color===snap.lineColor&&Number.parseFloat(t.border)>=1);
   if(time===0)ok=ok&&active(c[0])&&c.slice(1).every(pending)&&snap.connector.every(r=>approx(r,0));
   if(time===2.445)ok=ok&&pending(c[1])&&approx(snap.connector[0],.5,.05);
   if(time===2.64)ok=ok&&c[1].art>0&&c[1].art<.3&&c[1].guide>0&&approx(snap.connector[0],1);
   if(time===2.78)ok=ok&&active(c[1])&&pending(c[2]);
   if(time===5.085)ok=ok&&pending(c[2])&&approx(snap.connector[1],.5,.05);
   if(time===5.42)ok=ok&&active(c[2])&&pending(c[3]);
   if(time===7.475)ok=ok&&pending(c[3])&&approx(snap.connector[2],.5,.05);
   if(time===7.81)ok=ok&&active(c[3]);
   if(time===10.27)ok=ok&&c.every(active)&&snap.connector.every(v=>approx(v,1));
   check(width+'px t='+time+'s source and guide positions',ok,{art:c.map(x=>+x.art.toFixed(3)),guide:c.map(x=>+x.guide.toFixed(3)),connections:snap.connector.map(x=>+x.toFixed(2)),color:snap.lineColor});
   if((width===1408&&[0,2.445,2.78,5.085,10.27].includes(time))||(width===430&&[0,5.085,10.27].includes(time))){
     const fn='c01-guide-'+width+'-t'+String(time).replace('.','_')+'.png';
     await page.locator('#benefits').screenshot({path:path.join(out,fn)});
     results.snapshots.push(fn);
   }
  }
  check(width+'px no Javascript errors',errors.length===0,errors);
  await page.close();
 }
 const still=await browser.newPage({viewport:{width:430,height:900},reducedMotion:'reduce'});
 await still.goto(url,{waitUntil:'domcontentloaded'});
 await still.locator('#benefits').scrollIntoViewIfNeeded();
 await still.waitForTimeout(250);
 const reduced=await still.evaluate(()=>({playing:window.__chapchitraC01.playing,reduced:window.__chapchitraC01.reduced,posters:[...document.querySelectorAll('.c01-poster')].every(n=>n.complete&&n.naturalWidth>0),guides:[...document.querySelectorAll('.c01-icon-shell')].map(n=>Number(getComputedStyle(n,'::after').opacity))}));
 check('reduced-motion all icons complete, no guides',reduced.reduced&&!reduced.playing&&reduced.posters&&reduced.guides.every(x=>x===0),reduced);
 await still.close();
 const record=await browser.newContext({viewport:{width:1408,height:760},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1408,height:760}}});
 const vid=await record.newPage();
 await vid.goto(url,{waitUntil:'domcontentloaded'});
 await vid.locator('#benefits').scrollIntoViewIfNeeded();
 await vid.waitForFunction(()=>window.__chapchitraC01?.ready,null,{timeout:45000});
 await vid.evaluate(()=>{const section=document.querySelector('#benefits');scrollTo(0,scrollY+section.getBoundingClientRect().top-220);window.__chapchitraC01.seekForQA(0)});
 await vid.waitForTimeout(120);
 await vid.evaluate(()=>window.__chapchitraC01.resume());
 await vid.waitForTimeout(10800);
 await vid.close();
 await fs.copyFile(await vid.video().path(),path.join(out,'c01-guide-synchronized-lottie.webm'));
 await record.close();
 check('original Lottie recording captures full synchronized cycle',(await fs.stat(path.join(out,'c01-guide-synchronized-lottie.webm'))).size>25000,{bytes:(await fs.stat(path.join(out,'c01-guide-synchronized-lottie.webm'))).size});
 }finally{
   await browser.close();
   await fs.writeFile(path.join(out,'c01-guide-qa.json'),JSON.stringify(results,null,2)+'\n');
 }
 const failed=results.checks.filter(x=>!x.ok);
 console.log('C01 GUIDE QA',results.checks.length-failed.length+'/'+results.checks.length,'passed');
 if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
