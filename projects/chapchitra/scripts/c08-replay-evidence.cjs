const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const out=path.resolve(__dirname,'../docs/c08-evidence');
const url=process.env.C08_URL||'http://127.0.0.1:19289/';
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{
  const d=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
  const p=await d.newPage();
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__chapchitraC08?.hero.playing,null,{timeout:45000});
  await p.waitForTimeout(1000);
  await p.screenshot({path:path.join(out,'c08-navbar-static-during-hero-autoplay.png')});
  await p.waitForFunction(()=>window.__chapchitraC08?.hero.completed===1,null,{timeout:9000});
  await p.locator('#c08HeroStage .c08-hero-trigger').hover();
  await p.waitForFunction(()=>window.__chapchitraC08?.hero.completed===2,null,{timeout:9000});
  await p.waitForTimeout(330);
  await p.close();await fs.copyFile(await p.video().path(),path.join(out,'c08-hero-autoplay-then-hover-replay.webm'));await d.close();
  console.log('HERO AUTOPLAY/HOVER replay video done');
  const mobile=await b.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true,deviceScaleFactor:1,recordVideo:{dir:out,size:{width:430,height:932}}});
  const mp=await mobile.newPage();
  await mp.goto(url,{waitUntil:'domcontentloaded'});
  await mp.waitForFunction(()=>window.__chapchitraC08?.hero.completed===1,null,{timeout:12000});
  await mp.locator('#c08HeroStage .c08-hero-trigger').tap();
  await mp.waitForFunction(()=>window.__chapchitraC08?.hero.completed===2,null,{timeout:9000});
  await mp.waitForTimeout(300);
  await mp.close();await fs.copyFile(await mp.video().path(),path.join(out,'c08-hero-mobile-tap-replay.webm'));await mobile.close();
  console.log('MOBILE TAP replay video done');
  const f=await b.newPage({viewport:{width:1280,height:900}});
  await f.goto(url,{waitUntil:'domcontentloaded'});
  await f.locator('#footer').scrollIntoViewIfNeeded();
  await f.locator('#footer').screenshot({path:path.join(out,'c08-footer-static.png')});
  await f.close();
  console.log('FOOTER static screenshot done');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=2});
