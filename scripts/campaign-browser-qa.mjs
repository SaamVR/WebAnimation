import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { mkdirSync } from 'node:fs';

const base=process.env.CAMPAIGN_BASE_URL || 'http://127.0.0.1:8799';
const dir='qa-artifacts';
mkdirSync(dir,{recursive:true});

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(let n=1;n<=9;n++){
   const page=await browser.newPage({viewport:{width:1366,height:900}});
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const response=await page.goto(base+'/product'+n+'/',{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(response?.status(),200,'product'+n+' route must load');
   await page.waitForSelector('.primary-media',{timeout:10000});
   assert.equal(await page.locator('.case-study-use').count(),1,'product'+n+' needs commercial use case');
   assert.equal(await page.locator('.chapter').count(),5,'product'+n+' needs 5 director beats');
   await page.locator('.chapter').nth(3).click();
   assert.equal(await page.locator('.chapter[aria-pressed=true]').count(),1,'chapter must be selectable');
   assert.equal(errors.length,0,'No JavaScript errors on product'+n+': '+errors.join(','));
   if(n===6){
      await page.waitForSelector('#relay-request',{timeout:10000});
      await page.locator('#relay-analyze').click();
      assert.match(await page.locator('#relay-summary').innerText(),/CONSULTATION/i);
      assert.match(await page.locator('#relay-summary').innerText(),/TUESDAY/i);
      await page.locator('.relay-slot[data-slot="10:30"]').click();
      assert.equal(await page.locator('#relay-confirm').isDisabled(),false);
      await page.locator('#relay-confirm').click();
      assert.match(await page.locator('#relay-result').innerText(),/No real booking was created/i);
      await page.screenshot({path:dir+'/relay-confirmed-desktop.png',fullPage:true});
      const input=page.locator('#relay-request');
      await input.fill('I need help with my website');
      assert.equal(await page.locator('#relay-confirm').isDisabled(),true);
      await page.locator('#relay-analyze').click();
      assert.match(await page.locator('#relay-summary').innerText(),/UNSPECIFIED/);
      console.log('RELAY WORKFLOW PASS: editable request -> parsed -> selected -> explicitly confirmed demo');
   }
   if(n===7){
      const img=page.locator('img.shoe-actual');
      await img.waitFor();
      const state=await img.evaluate(el=>({ok:el.complete&&el.naturalWidth>0,width:el.naturalWidth,src:el.currentSrc.slice(0,22)}));
      assert.ok(state.ok,'Actual 3D shoe image must load rather than show a blank theatre');
      assert.match(state.src,/data:image\/webp/);
      await page.screenshot({path:dir+'/solecraft-desktop.png',fullPage:true});
      console.log('SOLECRAFT_IMAGE',state);
   }
   if(n===1)await page.screenshot({path:dir+'/order-journey-desktop.png',fullPage:true});
   await page.close();
 }
 const mobile=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await mobile.goto(base+'/product7/',{waitUntil:'domcontentloaded'});
 await mobile.waitForSelector('.shoe-actual');
 const scroll=await mobile.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(scroll.scroll<=scroll.viewport+2,'Mobile horizontal overflow: '+JSON.stringify(scroll));
 assert.equal(await mobile.locator('#play').getAttribute('aria-label'),'Pause animatic'); 
 await mobile.screenshot({path:dir+'/solecraft-mobile.png',fullPage:true});
 await mobile.goto(base+'/',{waitUntil:'domcontentloaded'});
 const src=await mobile.locator('a.work[href="/product7/"] iframe').getAttribute('src');
 assert.equal(src,'/product7/?preview=1','Home shoe card should preview actual uploaded shoe render');
 await mobile.screenshot({path:dir+'/home-mobile.png',fullPage:true});
 console.log('BROWSER QA PASS: nine media-led pages, actual shoe pixels, timeline, mobile.');
} finally { await browser.close(); }
