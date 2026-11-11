const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path');
const base=process.env.CC_QA_ROOT||'http://127.0.0.1:4479';
const out=path.resolve(process.env.CC_QA_OUT||'perf-results/ipad-navbar-scroll');
fs.mkdirSync(out,{recursive:true});
const rows=[],errors=[];
const paths=['/','/shop/','/artists-edit/'];
(async()=>{
 for(const [engine,name,viewport] of [
  [chromium,'chromium-desktop',{width:1440,height:900}],
  [webkit,'webkit-ipad-landscape',{width:1194,height:834}],
  [webkit,'webkit-ipad-portrait',{width:834,height:1112}]
 ]){
  const browser=await engine.launch(engine===chromium?{headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{headless:true});
  try{
   for(const route of paths){
    const slug=route==='/'?'home':route==='/shop/'?'shop':'artists';
    const context=await browser.newContext({viewport,hasTouch:name.includes('ipad'),
     recordVideo:{dir:out,size:viewport}});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(name+route+': '+e.message));
    await page.goto(base+route+'?navdebug=1',{waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#siteHeader').waitFor({timeout:20000});
    const positions=[0,140,470,920,1550,950,320,1800,720,2600,1000,390,2200];
    for(const y of positions){
     await page.evaluate(value=>window.scrollTo({top:value,behavior:'instant'}),y);
     await page.waitForTimeout(90);
     const measure=await page.evaluate(()=>{
      const h=document.getElementById('siteHeader'),a=document.querySelector('#app > .announcement');
      const hb=h.getBoundingClientRect(),ab=a.getBoundingClientRect();
      const vp=visualViewport,el=document.elementFromPoint(innerWidth/2,2);
      return {scrollY,headerTop:hb.top,headerBottom:hb.bottom,announcementBottom:ab.bottom,
       vpOffset:vp?.offsetTop??0,visualPageTop:vp?.pageTop??scrollY,
       cssPosition:getComputedStyle(h).position,elementAtTop:!!el?.closest('#siteHeader'),
       translate:getComputedStyle(h).translate,diagnostics:!!window.__ccNavViewport};
     });
     const stuck=measure.announcementBottom<=0;
     const pass=!stuck||(Math.abs(measure.headerTop)<2&&measure.elementAtTop&&measure.cssPosition==='sticky');
     rows.push({engine:name,route,target:y,pass,stuck,...measure});
    }
    await page.screenshot({path:path.join(out,name+'-'+slug+'-scroll.png')});
    await context.close();
    await page.video().saveAs(path.join(out,name+'-'+slug+'-scroll.webm'));
   }
  }finally{await browser.close()}
 }
 const errorsInQA=rows.filter(r=>!r.pass);
 const report={source:'Headless Windows Chromium/WebKit; iPad Safari/Chrome toolbar NOT emulated',
  base,total:rows.length,passed:rows.length-errorsInQA.length,failed:errorsInQA.length,
  errors,failedRows:errorsInQA,
  visualViewportOffsets:[...new Set(rows.filter(r=>r.engine.includes('ipad')).map(r=>r.vpOffset))],
  physicalIPadGapStatus:'UNVERIFIED / OPEN'};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors,
  physicalIPadGapStatus:report.physicalIPadGapStatus,offsets:report.visualViewportOffsets},null,2));
 if(report.failed||errors.length)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
