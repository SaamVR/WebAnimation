/* Owner's original Illustrator icon extraction + live state, local CI only.
 * No hosted URLs, no screenshot mocks, no mutated artwork or timers.
 */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const root=(process.env.CC_OWNER_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
if(!/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(root))throw Error('Owner vector QA refuses hosted URLs');
const dir=path.resolve(process.env.CC_OWNER_QA_OUT||'perf-results/shared-stage-owner-refinement');
fs.mkdirSync(dir,{recursive:true});
const configs=[
 {name:'desktop-chromium',browser:chromium,viewport:{width:1440,height:900}},
 {name:'ipad-webkit',browser:webkit,viewport:{width:834,height:1112}},
 {name:'mobile-webkit',browser:webkit,viewport:{width:390,height:844},mobile:true},
 {name:'narrow-chromium',browser:chromium,viewport:{width:320,height:740},mobile:true}
];
const checks=[],errors=[],screenshots=[];
// A DOMContentLoaded reload can tear down WebKit while its original Long
// SVG poster/fetch is in flight. This adds an asset readiness precondition;
// the strict existing pageerror assertion is NOT disabled or modified.
async function waitForLongHydration(page){
 await page.waitForFunction(()=>{
  const buttons=[...document.querySelectorAll('.cc-sketch--long.cc-long-artwork')];
  return buttons.length>0&&buttons.every(button=>button.dataset.long==='ready');
 },undefined,{timeout:30000});
}

const verify=(id,ok,details)=>{checks.push({id,ok:!!ok});if(!ok)console.error('OWNER_VECTOR_FAIL '+JSON.stringify({id,details}).slice(0,800))};
async function run(d){
 const browser=await d.browser.launch({headless:true});
 const context=await browser.newContext({viewport:d.viewport,isMobile:!!d.mobile,
  hasTouch:!!d.mobile,reducedMotion:'reduce',deviceScaleFactor:1});
 const page=await context.newPage();
 const exceptions=[],bad=[];
 page.on('pageerror',e=>exceptions.push(e.message));
 page.on('response',r=>{if(r.url().includes('/assets/illustrator/')&&r.status()>=400)bad.push([r.status(),r.url()])});
 try{
  await page.goto(root+'/shop/',{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('.product-card .favorite-toggle').first().waitFor({state:'attached',timeout:24000});
  await waitForLongHydration(page);
  const before=await page.evaluate(()=>{
   const bag=document.querySelector('.bag-link');
   const button=document.querySelector('.product-card .favorite-toggle');
   return {
    icons:['searchButton','.nav-actions a[href="/favorites/"]','.nav-actions a[href="/account/"]','.bag-link']
      .map((sel,i)=>{const el=i===0?document.getElementById(sel):document.querySelector(sel);return el?.querySelector('img.cc-nav-art')?.getAttribute('src')||null}),
    favorite:button?.querySelector('img')?.getAttribute('src'),
    pressed:button?.getAttribute('aria-pressed'),
    bagCount:bag?.querySelector('.bag-count')?.textContent,
    digits:[...bag?.querySelectorAll('.cc-bag-stamps img')||[]].map(e=>e.getAttribute('src'))
   };
  });
  verify(d.name+' owner navbar art',JSON.stringify(before.icons)===JSON.stringify([
   '/assets/illustrator/nav-owner-search.svg','/assets/illustrator/nav-owner-favorites-outline.svg',
   '/assets/illustrator/nav-owner-account.svg','/assets/illustrator/nav-owner-bag.svg']),before.icons);
  verify(d.name+' outlined unselected favorite',before.favorite==='/assets/illustrator/nav-favorites-outline.svg'&&before.pressed==='false',before);
  const fav=page.locator('.product-card .favorite-toggle').first();
  await fav.click();
  const on=await fav.evaluate(async el=>{
   const src=el.querySelector('img')?.getAttribute('src');
   const get=async filename=>{
    const response=await fetch('/assets/illustrator/'+filename);
    if(!response.ok)throw Error('Missing favorite vector: '+filename);
    return new DOMParser().parseFromString(await response.text(),'image/svg+xml');
   };
   const outline=await get('nav-favorites-outline.svg');
   const selected=await get('nav-favorites-selected.svg');
   const paths=doc=>[...doc.querySelectorAll('path')].map(p=>p.getAttribute('d'));
   const a=paths(outline),b=paths(selected);
   return {
    pressed:el.getAttribute('aria-pressed'),src,
    originalOutlinePreserved:a.length===2&&b.length===3&&a.every((path,i)=>path===b[i+1]),
    viewBoxPreserved:outline.documentElement.getAttribute('viewBox')===selected.documentElement.getAttribute('viewBox'),
    interiorFill:selected.querySelector('.cc-favorite-interior')?.getAttribute('fill'),
    darkForestOutline:selected.querySelector('style')?.textContent.includes('.st0{fill:#1C241D;}')===true
   };
  });
  verify(d.name+' filled selected favorite',
   on.pressed==='true'&&on.src==='/assets/illustrator/nav-favorites-selected.svg'&&
   on.originalOutlinePreserved&&on.viewBoxPreserved&&
   on.interiorFill==='#8A503B'&&on.darkForestOutline,on);
  await fav.click();
  const off=await fav.evaluate(el=>({pressed:el.getAttribute('aria-pressed'),src:el.querySelector('img')?.getAttribute('src')}));
  verify(d.name+' unselected favorite restores outline',off.pressed==='false'&&off.src==='/assets/illustrator/nav-favorites-outline.svg',off);
  // Test preserved live bag count for 0->1 via an actual card click.
  const button=page.locator('.product-card [data-add-to-bag]').first();
  const pid=await button.getAttribute('data-add-to-bag');
  await button.click();
  await page.waitForFunction(()=>document.querySelector('.bag-count')?.textContent==='1');
  const checkCount=async (num)=>{
   const value=await page.evaluate(()=>({
    text:document.querySelector('.bag-count')?.textContent,
    sr:document.querySelector('.bag-count .sr-only')?.textContent,
    digits:[...document.querySelectorAll('.cc-bag-stamps img')].map(e=>e.getAttribute('src')),
    aria:document.querySelector('.bag-link')?.getAttribute('aria-label'),
    height:document.querySelector('.bag-count')?.getBoundingClientRect()?.height
   }));
   verify(d.name+' original stamp digits '+num,
    value.text===String(num)&&value.sr===String(num)&&value.height>=16&&
    JSON.stringify(value.digits)===JSON.stringify([...String(num)].map(c=>'/assets/illustrator/stamp-'+c+'.svg'))&&value.aria?.includes(String(num)+' item'),
    value);
  };
  await checkCount(1);
  const storageKey=await page.evaluate(()=>Object.keys(sessionStorage).find(k=>k.includes('session-demo-bag')));
  verify(d.name+' existing bag session key',!!storageKey,storageKey);
  if(storageKey){
   for(const target of [0,10,11,12,99]){
    await page.evaluate(({key,id,num})=>{
     sessionStorage.setItem(key,JSON.stringify(num?[[id,num]]:[]))
    },{key:storageKey,id:pid,num:target});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await waitForLongHydration(page);
    await page.waitForFunction(num=>document.querySelector('.bag-count')?.textContent===String(num),target);
    await checkCount(target);
   }
  }
  await page.evaluate(()=>sessionStorage.clear());
  await page.reload({waitUntil:'domcontentloaded'});
  await waitForLongHydration(page);
  const headerSnap=path.join(dir,d.name+'-navbar-stamps.png');
  await page.locator('.site-header').screenshot({path:headerSnap,animations:'disabled'});
  screenshots.push(path.basename(headerSnap));
  const footer=page.locator('#footer');
  await footer.scrollIntoViewIfNeeded();
  const spec=await footer.evaluate(el=>{
   const social=[...el.querySelectorAll('.footer-social-entry img')].map(i=>i.getAttribute('src'));
   const grid=el.querySelector('.footer-grid');
   const empty=el.querySelector('.footer-illustration-space');
   const nav=el.querySelector('.footer-nav-discover');
   const help=el.querySelector('.footer-nav-help');
   const n=el.querySelector('.footer-identity').getBoundingClientRect();
   const d=nav.getBoundingClientRect(),h=help.getBoundingClientRect(),v=empty.getBoundingClientRect();
   return {
    socials:social,background:getComputedStyle(el).backgroundColor,
    children:grid.children.length,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
    areas:{brand:n.x,discover:d.x,help:h.x,reserved:v.x,emptyChildren:empty.children.length,emptyText:empty.textContent},
    overflow:el.scrollWidth-el.clientWidth,helpLinks:help.querySelectorAll('a').length,
    labels:[...help.querySelectorAll('.footer-help-pending')].map(z=>z.textContent)
   };
  });
  verify(d.name+' exact three social vectors',JSON.stringify(spec.socials)===JSON.stringify([
   '/assets/illustrator/social-instagram.svg','/assets/illustrator/social-facebook.svg','/assets/illustrator/social-whatsapp.svg']),spec.socials);
  verify(d.name+' reserved illustration entirely empty',spec.areas.emptyChildren===0&&spec.areas.emptyText===''&&
   spec.areas.discover<spec.areas.help&&(d.viewport.width>1070?spec.areas.help<spec.areas.reserved:true),spec.areas);
  verify(d.name+' original dark olive preserved',spec.background==='rgb(31, 34, 22)',spec.background);
  verify(d.name+' footer no horizontal clipping',spec.overflow<=1,spec);
  verify(d.name+' Help labels not fictitious links',spec.helpLinks===0&&spec.labels.join('|')==='Support|Terms & Conditions|Contact Us',spec);
  const footSnap=path.join(dir,d.name+'-footer.png');
  await footer.screenshot({path:footSnap,animations:'disabled'});screenshots.push(path.basename(footSnap));
  if(d.name==='desktop-chromium'){
   await page.goto(root+'/',{waitUntil:'domcontentloaded'});
   await waitForLongHydration(page);
   await page.locator('#values h2#valuesTitle').waitFor({state:'visible',timeout:20000});
   const headings=await page.locator('#values .section-title').allTextContents();
   verify(d.name+' clean C05 heading',headings.length===1&&headings[0].trim()==='More Than a T-Shirt',headings);
  }
  verify(d.name+' browser errors absent',exceptions.length===0,exceptions);
  verify(d.name+' SVG HTTP errors absent',bad.length===0,bad);
 }catch(error){errors.push({device:d.name,message:error.stack||String(error)})}
 await context.close();await browser.close();
}
(async()=>{
 for(const d of configs)await run(d);
 const report={checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length,errors,screenshots};
 fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('OWNER_REFINEMENT_QA '+JSON.stringify(report));
 if(report.failed||errors.length)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=3});