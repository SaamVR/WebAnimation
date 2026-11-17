const {chromium}=require('/tmp/las-m2-r02-20261115/node_modules/playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const root=process.env.ZESTRY_PREVIEW_DIR||'/tmp/zestry-f07-f05-preview';
const dest=process.env.ZESTRY_QA_DIR||'/tmp/zestry-f07-f05-qa';
fs.mkdirSync(dest,{recursive:true});
const mime={'.html':'text/html','.json':'application/json','.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.png':'image/png','.lottie':'application/octet-stream'};
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const f=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!f.startsWith(root)){res.writeHead(403);return res.end();}
 fs.readFile(f,(err,bytes)=>{if(err){res.writeHead(404);return res.end('not found '+name)}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(bytes);});
});
async function findF07(page){
 return page.evaluate(()=>{
  const e=document.querySelector('[data-animation="f07"]');
  const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===e);
  return {asset:e.dataset.loaded,found:!!a,compName:a?.animationData?.nm,fr:a?.frameRate,frames:a?.totalFrames,w:a?.animationData?.w,h:a?.animationData?.h,loop:a?.loop,svg:!!e.querySelector('svg')};
 });
}
(async()=>{
 await new Promise(r=>server.listen(19456,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const results={};
 for(const [name,width,height] of [['desktop',1440,900],['ipad',1024,768],['mobile',390,844],['small',320,690]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});const errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:19456/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#reservations').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-animation="f07"]')?.dataset.loaded==='yes',{timeout:30000});
  const meta=await findF07(page);
  for(const frame of [16,53,128,154,192,227]){
   await page.evaluate(frame=>{const e=document.querySelector('[data-animation="f07"]');const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===e);a.goToAndStop(frame,true)},frame);
   await page.waitForTimeout(100);
   if(['desktop','mobile'].includes(name)&&[16,53,128,192,227].includes(frame))await page.locator('.reservation-art').screenshot({path:path.join(dest,name+'-f07-frame-'+frame+'.png'),timeout:30000});
  }
  const layout=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,artBox:(()=>{const r=document.querySelector('.reservation-art').getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]})(),bookVisible:!!document.getElementById('f05-book-frame')}));
  await page.locator('button[data-book]:visible').first().click();
  await page.locator('#date').fill(await page.locator('#date').getAttribute('min'));
  await page.locator('#time').selectOption({label:'6:00 PM'});
  await page.locator('#guestname').fill('Preview Guest');
  await page.locator('#email').fill('preview@example.com');
  await page.locator('#booking-form button[type=submit]').click();
  await page.locator('#confirm-player svg').first().waitFor({state:'attached',timeout:25000});
  const confirm=await page.evaluate(()=>{
   const p=document.getElementById('confirm-player');
   const a=lottie.getRegisteredAnimations().find(x=>x.wrapper===p);
   return{visible:!!p.querySelector('svg'),name:a?.animationData?.nm,frames:a?.totalFrames,success:document.querySelector('.confirmbox .success')?.textContent};
  });
  await page.screenshot({path:path.join(dest,name+'-booking-confirmed.png')});
  results[name]={...meta,...layout,confirm,errors,missing};
  console.log('F07_QA',name,JSON.stringify(results[name]));
  await page.close();
 }
 await browser.close();await new Promise(r=>server.close(r));
 fs.writeFileSync(path.join(dest,'F07_BROWSER_QA.json'),JSON.stringify(results,null,2));
 if(Object.values(results).some(x=>x.scrollWidth>x.viewport||!x.found||!x.svg||x.w!==960||x.h!==720||x.frames!==228||x.loop!==false||!x.confirm.visible||x.confirm.frames!==228||x.errors.length||x.missing.length))throw Error('F07 acceptance gate failed');
 console.log('F07_V5_BOOKING_QA_PASSED');
})().catch(e=>{console.error('QA_FATAL',e.stack);server.close();process.exit(1)});
