/* Independent WebKit/Safari-engine C01 smoke checks. Does not generate or alter originals. */
const {webkit}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const url=process.env.C01_URL||'http://127.0.0.1:19118/';
const report={engine:'WebKit Linux',url,checks:[],errors:[]};
function check(name,ok,extra){
 report.checks.push({name,passed:ok,...(extra?{detail:extra}:{})});
 console.log((ok?'PASS':'FAIL')+' '+name+(extra?' '+JSON.stringify(extra):''));
}
(async()=>{
 const browser=await webkit.launch({headless:true,executablePath:process.env.C01_WEBKIT||'/home/ubuntu/.cache/ms-playwright/webkit-2311/pw_run.sh'});
 try{
  for(const width of [1280,834,430,320]){
   const page=await browser.newPage({viewport:{width,height:950}});
   page.on('pageerror',e=>report.errors.push(String(e.message)));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
   await page.locator('#benefits').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>window.__chapchitraC01?.ready,{timeout:40000});
   await page.evaluate(()=>{window.__chapchitraC01.seekForQA(10.27);window.__chapchitraC01.layoutForQA()});
   await page.waitForTimeout(170);
   const details=await page.evaluate(()=>({
    svg:document.querySelectorAll('.c01-lottie svg').length,
    text:[...document.querySelectorAll('.c01-copy p')].map(n=>n.textContent),
    overflow:document.documentElement.scrollWidth>window.innerWidth+1,
    connectors:document.querySelectorAll('.c01-connection-active').length,
    full:[...document.querySelectorAll('.c01-icon-shell')].every(n=>Number(n.style.opacity)===1),
    failed:window.__chapchitraC01.failed
   }));
   check('WebKit '+width+' real Lottie SVG and all connectors',details.svg===4&&details.connectors===3&&!details.failed);
   check('WebKit '+width+' responsive & finished composition',!details.overflow&&details.full);
   if(width===430)await page.locator('#benefits').screenshot({path:path.join(root,'docs/c01-evidence/c01-webkit-430.png')});
   await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:430,height:900},reducedMotion:'reduce'});
  await reduced.goto(url,{waitUntil:'domcontentloaded'});
  await reduced.locator('#benefits').scrollIntoViewIfNeeded();
  await reduced.waitForTimeout(400);
  const status=await reduced.evaluate(()=>({
   reduced:window.__chapchitraC01.reduced,
   stopped:!window.__chapchitraC01.playing,
   final:window.__chapchitraC01.seconds===10.27,
   icons:[...document.querySelectorAll('.c01-poster')].every(n=>n.naturalWidth>0)
  }));
  check('WebKit reduced-motion full static set',Object.values(status).every(Boolean),status);
  await reduced.close();
 }finally{await browser.close()}
 await fs.writeFile(path.join(root,'docs/c01-evidence/c01-webkit-qa-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('WEBKIT RESULT',report.checks.filter(x=>x.passed).length+'/'+report.checks.length,'page exceptions',report.errors.length);
 if(report.checks.some(x=>!x.passed)||report.errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
