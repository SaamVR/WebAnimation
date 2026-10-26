import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';

const base=process.env.T03_HOME_URL||'http://127.0.0.1:8765/';
const out='artifacts/threads-favorites-qa';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const cases=[
 {name:'desktop',viewport:{width:1280,height:900},touch:false},
 {name:'ipad-touch',viewport:{width:834,height:1194},touch:true},
 {name:'mobile-touch',viewport:{width:390,height:844},touch:true}
];
const runs=[];
const visit=async(page,path)=>{await page.goto(new URL(path,base).href,{waitUntil:'load'});await page.locator('[data-save]').first().waitFor({timeout:15000});};
async function verifyStableToggle(page,gridSelector,label,touch=false){
 const button=page.locator(gridSelector+' [data-save]').first();
 await button.scrollIntoViewIfNeeded();
 await page.waitForTimeout(350); // Let any smooth scrolling settle before measuring click behavior.
 const pre=await button.getAttribute('aria-pressed');
 const id=await button.getAttribute('data-save');
 const snapshot=await page.evaluate(({selector,id})=>{
  const grid=document.querySelector(selector);
  const cards=[...grid.querySelectorAll('[data-product-id]')];
  const imgs=cards.map(c=>c.querySelector('img')).filter(Boolean);
  const records=[];
  const observer=new MutationObserver(m=>records.push(...m.filter(x=>x.type==='childList')));
  observer.observe(grid,{childList:true,subtree:true});
  window.__favoritesQa={grid,cards,imgs,records,observer,id,scrollY:window.scrollY};
  return {cards:cards.length,images:imgs.length,scroll:window.scrollY};
 },{selector:gridSelector,id});
 assert.ok(snapshot.cards>=2,'Need multiple cards to detect flicker: '+label);
 const imagesRequested=[];
 const listener=req=>{if(/\.(webp|png|jpe?g)(\?|$)/i.test(req.url()))imagesRequested.push(req.url())};
 page.on('request',listener);
 for(let i=0;i<6;i++){
  const rect=await button.boundingBox();
  assert.ok(rect?.width>0&&rect?.height>0,'Heart not visible');
  if(touch)await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);
  else await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
  assert.equal(await button.getAttribute('aria-pressed'),i%2===0?String(pre!=='true'):pre,'Incorrect rapid heart state '+label);
  assert.match(await button.getAttribute('aria-label'),i%2===0?(pre==='true'?/^Add .* to favorites$/:/^Remove .* from favorites$/):(pre==='true'?/^Remove .* from favorites$/:/^Add .* to favorites$/));
 }
 page.off('request',listener);
 const after=await page.evaluate(()=>{
  const s=window.__favoritesQa;
  const now=[...s.grid.querySelectorAll('[data-product-id]')];
  const good=s.cards.length===now.length&&s.cards.every((n,i)=>n===now[i]);
  const sameImages=s.imgs.every(img=>img&&img.isConnected&&s.grid.contains(img));
  const changes=s.records.length;
  const scroll=Math.abs(window.scrollY-s.scrollY);
  s.observer.disconnect();delete window.__favoritesQa;
  return {good,sameImages,changes,scroll};
 });
 assert.ok(after.good,'Products were recreated/reordered: '+label);
 assert.ok(after.sameImages,'Original image elements lost: '+label);
 assert.equal(after.changes,0,'Grid children changed from heart clicks: '+label);
 assert.ok(after.scroll<=2,'Scroll position shifted: '+label+' delta='+after.scroll);
 assert.equal(imagesRequested.length,0,'Image requests on favorite toggle: '+label+' '+imagesRequested.slice(0,3));
 const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('threads.demo.favorites.v1')||'[]').length);
 assert.equal((await page.locator('#favorites-button').getAttribute('aria-label')).includes('('+count+')'),count>0,'Navbar count mismatch: '+label);
 return {label,cards:after.good,images:after.sameImages,gridMutations:after.changes,scrollDelta:after.scroll,imageReloads:imagesRequested.length};
}
try{
 for(const device of cases){
  const context=await browser.newContext({viewport:device.viewport,hasTouch:device.touch,isMobile:device.name==='mobile-touch'});
  const page=await context.newPage();
  await visit(page,'/');
  const banner=page.locator('#deal');
  const panel=await page.locator('#deal .threads-deal__panel path').getAttribute('d');
  assert.ok(panel.startsWith('M 93 0 L 1755 152'));
  const offset=await page.locator('#deal .threads-deal__copy').evaluate(node=>parseFloat(getComputedStyle(node).top));
  assert.ok(offset>=7,'Text offset not applied on '+device.name);
  await banner.screenshot({path:`${out}/${device.name}-t03-copy.png`});
  const home=await verifyStableToggle(page,'#featured-products',device.name+' home',device.touch);
  await page.locator('#featured-products').screenshot({path:`${out}/${device.name}-home-hearts.png`});
  await visit(page,'/search/');
  const shop=await verifyStableToggle(page,'#results-grid',device.name+' shop',device.touch);
  await page.locator('#results-grid').screenshot({path:`${out}/${device.name}-shop-hearts.png`});
  await visit(page,'/deals/');
  const deals=await verifyStableToggle(page,'#results-grid',device.name+' deals',device.touch);
  await page.locator('#results-grid').screenshot({path:`${out}/${device.name}-deals-hearts.png`});
  runs.push({device:device.name,offset,home,shop,deals});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();
 await visit(page,'/search/');
 const buttons=page.locator('#results-grid [data-save]');
 const firstId=await buttons.nth(0).getAttribute('data-save');
 const secondId=await buttons.nth(1).getAttribute('data-save');
 await buttons.nth(0).click();
 await buttons.nth(1).click();
 await visit(page,'/search/?favorites=1');
 const initial=page.locator('#results-grid [data-product-id]');
 assert.equal(await initial.count(),2);
 const removedId=await initial.nth(0).getAttribute('data-product-id');
 const remainingId=await initial.nth(1).getAttribute('data-product-id');
 await page.evaluate(()=>{window.__keep=document.querySelectorAll('#results-grid [data-product-id]')[1]});
 await page.locator('#results-grid [data-save]').first().click();
 assert.equal(await page.locator('#results-grid [data-product-id]').count(),1);
 assert.ok(await page.evaluate(()=>document.querySelector('#results-grid [data-product-id]')===window.__keep),'Other favorite product node replaced');
 assert.equal(await page.locator('#results-count').textContent(),'1 relevant demo product');
 await page.reload({waitUntil:'load'});
 assert.equal(await page.locator('#results-grid [data-product-id]').count(),1);
 assert.equal(await page.locator('#results-grid [data-product-id]').first().getAttribute('data-product-id'),remainingId);
 // A second tab changes favorites; existing card should remain mounted while membership updates.
 const other=await context.newPage();
 await visit(other,'/search/');
 const third=other.locator(`#results-grid [data-save="${removedId}"]`);
 await third.click();
 await page.waitForFunction(()=>document.querySelectorAll('#results-grid [data-product-id]').length===2);
 assert.ok(await page.evaluate(ids=>{
  const cards=[...document.querySelectorAll('#results-grid [data-product-id]')];
  return ids.every(id=>cards.some(node=>node.dataset.productId===id));
 },[removedId,remainingId]),'Cross-tab membership missing');
 await page.locator('#results-grid').screenshot({path:`${out}/favorites-filter-membership.png`});
 runs.push({favoritesFilter:'PASS',persistent:true,crossTab:true});
 await context.close();
 writeFileSync(`${out}/results.json`,JSON.stringify(runs,null,2));
 console.log('THREADS favorites and alignment QA PASS',JSON.stringify(runs));
}finally{await browser.close();}
