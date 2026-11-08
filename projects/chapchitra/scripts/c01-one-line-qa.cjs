const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const out=path.resolve(__dirname,'../docs/c01-evidence');
const expected=['Original Art & Customization','Secure & Flexible Payment','Fast Delivery','24/7 Support'];
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 const p=await b.newPage({viewport:{width:1408,height:900}});
 const failures=[],results=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:19188/',{waitUntil:'domcontentloaded'});
 await p.locator('#benefits').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>window.__chapchitraC01?.ready,null,{timeout:40000});
 for(const width of [1408,1194,1024,834,768,740,681,680,430,320]){
  await p.setViewportSize({width,height:900});
  await p.locator('#benefits').scrollIntoViewIfNeeded();
  await p.evaluate(()=>{window.__chapchitraC01.seekForQA(10.27);window.__chapchitraC01.layoutForQA()});
  await p.waitForTimeout(120);
  const m=await p.evaluate(()=>{
   const stage=document.querySelector('.c01-stage');
   const labels=[...stage.querySelectorAll('.c01-copy h3')].map(e=>{
    const range=document.createRange();range.selectNodeContents(e);
    const box=range.getBoundingClientRect();
    return {text:e.textContent,left:box.left,right:box.right,actualHeight:box.height,
      clientHeight:e.clientHeight,fontSize:getComputedStyle(e).fontSize,
      whiteSpace:getComputedStyle(e).whiteSpace};
   });
   return {width:innerWidth,labels,
    gap:parseFloat(getComputedStyle(stage).paddingTop),
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    svg:stage.querySelectorAll('.c01-lottie svg').length,
    connectors:stage.querySelectorAll('.c01-connection-active').length,
    subtitles:stage.querySelectorAll('.c01-copy p').length
   };
  });
  const noCollision=width<=680||m.labels.every((h,i,a)=>i===0||h.left>=a[i-1].right-2);
  const inBounds=m.labels.every(h=>h.left>=-1&&h.right<=width+1);
  const oneLine=m.labels.every(h=>h.whiteSpace==='nowrap'&&h.clientHeight<=Math.ceil(h.actualHeight)+3);
  const pass=JSON.stringify(m.labels.map(h=>h.text))===JSON.stringify(expected)&&
   !m.overflow&&m.svg===4&&m.connectors===3&&m.subtitles===0&&
   m.gap===(width<=680?12:15)&&noCollision&&inBounds&&oneLine;
  console.log(width,pass?'PASS':'FAIL',JSON.stringify({gap:m.gap,labels:m.labels.map(h=>({font:h.fontSize,from:Math.round(h.left),to:Math.round(h.right)})),overlap:!noCollision,overflow:m.overflow}));
  if(!pass)failures.push(width);results.push({...m,pass});
  if([1408,834,681,430,320].includes(width))
   await p.locator('#benefits').screenshot({path:path.join(out,'c01-one-line-'+width+'.png')});
 }
 const videoContext=await b.newContext({viewport:{width:1408,height:760},deviceScaleFactor:1,
  recordVideo:{dir:out,size:{width:1408,height:760}}});
 const vp=await videoContext.newPage();
 await vp.goto('http://127.0.0.1:19188/',{waitUntil:'domcontentloaded'});
 await vp.locator('#benefits').scrollIntoViewIfNeeded();
 await vp.waitForFunction(()=>window.__chapchitraC01?.ready,null,{timeout:45000});
 await vp.evaluate(()=>{
  const section=document.querySelector('#benefits');
  window.scrollTo(0,window.scrollY+section.getBoundingClientRect().top-215);
  window.__chapchitraC01.seekForQA(0);
 });
 await vp.waitForTimeout(150);
 await vp.evaluate(()=>window.__chapchitraC01.resume());
 await vp.waitForTimeout(10700);
 await vp.close();
 await fs.copyFile(await vp.video().path(),path.join(out,'c01-one-line-synchronized-lottie.webm'));
 await videoContext.close();
 await b.close();
 await fs.writeFile(path.join(out,'c01-one-line-qa.json'),JSON.stringify({results,failures,errors},null,2));
 console.log('FINAL',failures.length?'FAIL':'PASS','failingWidths',failures,'errors',errors);
 if(failures.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});