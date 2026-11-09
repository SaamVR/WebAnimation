/* C05 real browser recordings for owner creative review. Playwright webm. */
const{chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const dir=path.resolve(root,'docs/c05-evidence');
const origin=process.env.C05_URL||'http://127.0.0.1:19301/';
const binary='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
(async()=>{
 await fs.mkdir(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:binary});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,
   recordVideo:{dir,size:{width:1280,height:900}}});
  const page=await context.newPage();
  await page.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__chapchitraC05?.counts.ready===13,null,{timeout:30000});
  for(const tone of ['forest','terracotta','beige']){
   const section=page.locator('.c05-panel[data-tone="'+tone+'"]');
   const button=section.locator('.cc-compact-artwork').last();
   await button.scrollIntoViewIfNeeded();
   await page.mouse.move(5,5);
   await page.waitForTimeout(310);
   await section.screenshot({path:path.join(dir,'c05-'+tone+'-rest.png')});
   const box=await button.boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
   await page.waitForTimeout(380);
   await section.screenshot({path:path.join(dir,'c05-'+tone+'-hover.png')});
   await page.mouse.down();
   await page.waitForTimeout(180);
   await section.screenshot({path:path.join(dir,'c05-'+tone+'-pressed.png')});
   await page.mouse.up();
   await page.waitForTimeout(360);
   await page.mouse.move(5,5);
   await page.waitForTimeout(250);
  }
  await page.close();
  await fs.copyFile(await page.video().path(),path.join(dir,'c05-desktop-physical-press.webm'));
  await context.close();
  console.log('Desktop recording '+(await fs.stat(path.join(dir,'c05-desktop-physical-press.webm'))).size+' bytes');
  for(const [kind,width,height] of [['tablet',834,1112],['mobile',430,932]]){
   const ctx=await browser.newContext({viewport:{width,height},isMobile:kind==='mobile',
    hasTouch:true,deviceScaleFactor:1,recordVideo:{dir,size:{width,height}}});
   const p=await ctx.newPage();
   await p.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.__chapchitraC05?.counts.ready===13,null,{timeout:20000});
   for(const tone of ['forest','terracotta','beige']){
    const button=p.locator('.c05-panel[data-tone="'+tone+'"] .cc-compact-artwork').last();
    await button.scrollIntoViewIfNeeded();
    await p.waitForTimeout(220);
    await button.dispatchEvent('pointerdown',{pointerType:'touch',button:0,isPrimary:true});
    await p.waitForTimeout(310);
    await button.dispatchEvent('pointerup',{pointerType:'touch',button:0,isPrimary:true});
    await p.waitForTimeout(290);
   }
   await p.close();
   await fs.copyFile(await p.video().path(),path.join(dir,'c05-'+kind+'-touch-press.webm'));
   await ctx.close();
   console.log(kind+' recording '+(await fs.stat(path.join(dir,'c05-'+kind+'-touch-press.webm'))).size+' bytes');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=2});
