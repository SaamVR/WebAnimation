const {chromium}=require('/tmp/las-m2-r02-20261115/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root='/tmp/zestry-f07-f05-refined-preview',out='/tmp/zestry-f07-f05-release-qa';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.lottie':'application/octet-stream'};
const srv=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root)){res.writeHead(403);return res.end()}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('not found '+name)}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)});
});
(async()=>{
 await new Promise(r=>srv.listen(19611,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const all={};
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});const errors=[],httpErrors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)httpErrors.push(r.status()+' '+r.url())});
  await p.goto('http://127.0.0.1:19611/',{waitUntil:'domcontentloaded'});
  await p.locator('#menu').scrollIntoViewIfNeeded();
  const frame=p.frameLocator('#f05-book-frame');
  await frame.locator('body[data-f05-state="Closed"]').waitFor();
  await p.waitForFunction(()=>document.getElementById('f05-book-frame').contentWindow.__f05Ready===true);
  await p.locator('#menu').screenshot({path:path.join(out,name+'-book-closed.png')});
  await frame.locator('[data-event="open"]').click();
  await frame.locator('body[data-f05-state="Overview"]').waitFor({timeout:10000});
  await p.locator('#menu').screenshot({path:path.join(out,name+'-book-overview.png')});
  await frame.locator('[data-event="select_main"]').click();
  await frame.locator('body[data-f05-state="Main_Courses"]').waitFor({timeout:10000});
  await p.locator('#menu').screenshot({path:path.join(out,name+'-book-main-course.png')});
  await frame.locator('.dish').first().click();
  await p.waitForFunction(()=>document.getElementById('bag-count').textContent.trim()==='1');
  await p.locator('#cart-open').click();
  await p.locator('#drawer.active').waitFor();
  const subtotal=(await p.locator('#cart-total').textContent()).trim();
  await p.locator('#cart-checkout').click();
  await p.locator('#pickup-form').waitFor({state:'visible'});
  await p.locator('#pickup-name').fill('ZESTRY Tester');
  await p.locator('#pickup-phone').fill('01234567890');
  await p.locator('#pickup-form button[type="submit"]').click();
  await p.locator('#confirm-player svg').waitFor({state:'attached',timeout:20000});
  const confirmed=await p.locator('.confirmbox .success').textContent();
  await p.screenshot({path:path.join(out,name+'-order-confirmation.png')});
  const result={subtotal,confirmed,width,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors,httpErrors};
  all[name]=result;
  console.log('BOOK_CHECKOUT',name,JSON.stringify(result));
  await p.close();
 }
 await browser.close(); await new Promise(r=>srv.close(r));
 fs.writeFileSync(path.join(out,'checkout-qa.json'),JSON.stringify(all,null,2));
 if(Object.values(all).some(x=>x.overflow||x.subtotal!=='$19.00'||!x.confirmed.includes('Sample order')||x.errors.length||x.httpErrors.length))throw Error('checkout failed');
 console.log('BOOK_TO_F04_CHECKOUT_QA_PASSED');
})().catch(e=>{console.error('QA_FATAL',e.stack);srv.close();process.exit(1)});
