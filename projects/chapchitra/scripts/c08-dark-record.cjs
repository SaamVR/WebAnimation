const{chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const dir=path.resolve(__dirname,'../docs/c08-evidence/dark-palette');
const base=process.env.C08_URL||'http://127.0.0.1:19189/';
(async()=>{
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-linux/headless_shell'});
try{
const context=await browser.newContext({viewport:{width:1280,height:720},
  deviceScaleFactor:1,recordVideo:{dir,size:{width:1280,height:720}}});
const page=await context.newPage();
await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__chapchitraC08?.hero.ready,null,{timeout:45000});
await page.waitForFunction(()=>window.__chapchitraC08?.hero.completed>=1,null,{timeout:9000});
const status=await page.evaluate(()=>({hero:window.__chapchitraC08.hero,nav:window.__chapchitraC08.navbar}));
if(status.hero.autoplay!==1||status.nav.loaded)throw Error('Hero autoplay and navbar-static invariant failed');
await page.waitForTimeout(250);
await page.close();
const src=await page.video().path();
await fs.copyFile(src,path.join(dir,'c08-inverted-hero-autoplay.webm'));
await context.close();
console.log('CAPTURED',path.join(dir,'c08-inverted-hero-autoplay.webm'),
  (await fs.stat(path.join(dir,'c08-inverted-hero-autoplay.webm'))).size,'bytes');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=2});
