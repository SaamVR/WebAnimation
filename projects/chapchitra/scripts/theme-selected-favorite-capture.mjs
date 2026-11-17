import {chromium,webkit} from 'playwright';
import {resolve,join} from 'node:path';
const out=resolve(import.meta.dirname,'../perf-results/dark-theme-review-20261118');
for(const cfg of [
 {name:'ipad-webkit',engine:webkit,width:834,height:1112},
 {name:'mobile-chromium',engine:chromium,width:390,height:844}
]){
 const browser=await cfg.engine.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},colorScheme:'dark',reducedMotion:'reduce'});
 await ctx.addInitScript(()=>localStorage.setItem('chapchitra-color-theme-v1','dark'));
 const page=await ctx.newPage();
 await page.goto('http://127.0.0.1:4319/shop/',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#shopProducts [data-favorite]');
 const item=page.locator('#shopProducts [data-favorite]').first();
 await item.click();
 if(await item.getAttribute('aria-pressed')!=='true')throw new Error('Favorite not selected');
 await page.screenshot({path:join(out,cfg.name+'-dark-favorite-selected.png'),animations:'disabled'});
 console.log('SELECTED_HEART_EVIDENCE',cfg.name,'PASS');
 await ctx.close();await browser.close();
}
