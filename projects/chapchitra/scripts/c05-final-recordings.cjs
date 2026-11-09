/* C05 owner evidence: complete left-to-right graphite ink and tactile press. */
const{chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.resolve(root,'docs/c05-final-evidence');
const origin=process.env.C05_URL||'http://127.0.0.1:19301/';
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1408,height:950},deviceScaleFactor:1,
    recordVideo:{dir:out,size:{width:1408,height:950}}});
  const p=await context.newPage();
  await p.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__chapchitraC05?.counts.ready===13);
  for(const tone of ['forest','terracotta','beige']){
   const box=p.locator('.c05-panel[data-tone="'+tone+'"]');
   const button=box.locator('.cc-compact-artwork').last();
   await button.scrollIntoViewIfNeeded();
   await p.mouse.move(5,5);await p.waitForTimeout(500);
   await box.screenshot({path:path.join(out,'c05-final-'+tone+'-rest.png')});
   const r=await button.boundingBox();
   await p.mouse.move(r.x+r.width/2,r.y+r.height/2,{steps:8});
   await p.waitForTimeout(480);
   await box.screenshot({path:path.join(out,'c05-final-'+tone+'-hover.png')});
   await p.waitForTimeout(240);
   await p.mouse.down();await p.waitForTimeout(190);
   await box.screenshot({path:path.join(out,'c05-final-'+tone+'-pressed.png')});
   await p.mouse.up();await p.waitForTimeout(480);
   await p.mouse.move(5,5,{steps:8});await p.waitForTimeout(500);
  }
  await p.close();
  await fs.copyFile(await p.video().path(),path.join(out,'c05-final-all-colors-hover-press.webm'));
  await context.close();
  console.log('C05 hover and physical press recording',path.join(out,'c05-final-all-colors-hover-press.webm'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=2});
