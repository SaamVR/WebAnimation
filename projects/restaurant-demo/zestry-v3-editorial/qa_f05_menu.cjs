const {chromium}=require('/tmp/las-m2-r02-20261115/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=process.env.ZESTRY_PREVIEW_DIR||path.join(__dirname,'../zestry-v3-public'),OUT=process.env.ZESTRY_QA_DIR||path.join(__dirname,'../docs/qa/f05-book-local');
fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.json':'application/json','.lottie':'application/octet-stream','.jpg':'image/jpeg','.js':'application/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const p=path.resolve(ROOT,'.'+(url==='/'?'/index.html':url));if(!p.startsWith(ROOT)){res.writeHead(403);return res.end()}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end(url)}res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(data)})});
(async()=>{
await new Promise(r=>server.listen(19145,'127.0.0.1',r));const b=await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});const results={};
for(const [name,width,height] of [['desktop',1440,900],['ipad',1024,768],['mobile',390,844],['small',320,690]]){
 const page=await b.newPage({viewport:{width,height},deviceScaleFactor:1});const errors=[],httpErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push('CONSOLE '+msg.text())});page.on('response',r=>{if(r.status()>=400)httpErrors.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:19145/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#menu').scrollIntoViewIfNeeded();
 const book=page.frameLocator('#f05-book-frame');
 await book.locator('body[data-f05-state="Closed"]').waitFor({timeout:30000});
 await page.waitForFunction(()=>document.getElementById('f05-book-frame').contentWindow.__f05Ready===true,{timeout:30000});
 await book.locator('[data-event="open"]').click();
 await book.locator('body[data-f05-state="Overview"]').waitFor({timeout:20000});
 for(const [cat,event] of [['Main_Courses','select_main'],['Starters','select_starters'],['Desserts','select_desserts'],['Drinks','select_drinks']]){
  await book.locator('[data-event="'+event+'"]').click();
  await book.locator('body[data-f05-state="'+cat+'"]').waitFor({timeout:20000});
  const imgs=await book.locator('.photos img').evaluateAll(els=>els.map(i=>({complete:i.complete,natural:i.naturalWidth,src:i.getAttribute('src')})));
  if(!imgs.length||imgs.some(x=>!x.complete||!x.natural))throw Error('photos not loaded '+cat+' '+JSON.stringify(imgs));
  if(cat==='Main_Courses')await page.locator('#menu').screenshot({path:path.join(OUT,name+'-menu-main.png')});
 }
 await book.locator('[data-event="select_main"]').click();
 await book.locator('body[data-f05-state="Main_Courses"]').waitFor({timeout:20000});
 await book.locator('.book-dish, .dish').first().click();
 await page.waitForFunction(()=>document.getElementById('bag-count').textContent.trim()==='1');
 const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cartCount:document.getElementById('bag-count').textContent,oldCardsVisible:!!document.getElementById('cards').offsetParent,bookVisible:!!document.getElementById('f05-book-frame').offsetParent}));
 await book.locator('[data-event="close"]').click();
 await book.locator('body[data-f05-state="Closed"]').waitFor({timeout:20000});
 results[name]={...state,errors,httpErrors};
 console.log('QA_MENU',name,JSON.stringify(results[name]));
 await page.close();
}
await b.close();await new Promise(r=>server.close(r));
fs.writeFileSync(path.join(OUT,'menu_qa.json'),JSON.stringify(results,null,2));
if(Object.values(results).some(x=>x.scrollWidth>x.width||x.errors.length||x.httpErrors.length||x.cartCount.trim()!=='1'||x.oldCardsVisible||!x.bookVisible))throw Error('QA_MENU_FAIL');
console.log('QA_MENU_PASS');
})().catch(e=>{console.error('QA_FATAL',e.stack);server.close();process.exit(1)});
