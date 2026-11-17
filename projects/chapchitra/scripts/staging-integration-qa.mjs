
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const ROOT=resolve(import.meta.dirname,'..'),OUT=join(ROOT,'perf-results/staging-integration-20261118');
await mkdir(OUT,{recursive:true});
const BASE='http://127.0.0.1:4336';
const profiles=[
 {id:'desktop-chromium',engine:chromium,width:1440,height:900},
 {id:'ipad-webkit',engine:webkit,width:834,height:1112},
 {id:'mobile-chromium',engine:chromium,width:390,height:844}
];
const routes=[['home','/'],['shop','/shop/'],['product',null],
 ['favorites','/favorites/'],['bag','/bag/'],['checkout','/checkout/'],
 ['journal','/journal/'],['about','/about/'],['artists-edit','/artists-edit/'],['account','/account/']];
const report={baseCommit:'c29d397fc0462c798cd2662c9abeb4f9a8a0483d',type:'isolated combined staged regression',profiles:[],screenshots:[]};
const check=(i,condition,msg)=>{if(!condition)i.errors.push(msg)};
for(const profile of profiles){
 const browser=await profile.engine.launch({headless:true,timeout:90000});
 for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},colorScheme:theme,reducedMotion:'reduce',hasTouch:profile.id!=='desktop-chromium'});
  const page=await ctx.newPage();
  const item={profile:profile.id,theme,routes:[],errors:[],warnings:[],checks:[]};
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message)));
  const info=async(name,path)=>{
   const response=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForSelector('#siteHeader',{timeout:35000});
   await page.evaluate(()=>document.fonts.ready);
   const v=await page.evaluate(()=>{
    const e=s=>document.querySelector(s);
    const sty=(s,k)=>e(s)?getComputedStyle(e(s))[k]:null;
    return {
     theme:document.documentElement.dataset.theme,
     preference:window.chapchitraTheme?.getPreference(),
     persisted:localStorage.getItem('chapchitra-color-theme-v1'),
     nav:e('#siteHeader .logo-word--image img')?.getAttribute('src'),
     footer:e('#footer .logo-word--footer img')?.getAttribute('src'),
     hero:e('#hero .hero-brand-lockup')?.getAttribute('src'),
     headerColor:sty('#siteHeader','backgroundColor'),
     vFill:sty('#hero .hero01-paper-cut','fill'),
     featured:sty('#featured','backgroundColor'),
     heroFont:sty('#hero .hero-cover h1','fontFamily'),
     bodyFont:sty('body','fontFamily'),
     width:document.documentElement.scrollWidth,viewport:innerWidth,
     themeCSS:[...document.styleSheets].some(x=>x.href?.endsWith('/theme.css')),
     brokenImages:[...document.querySelectorAll('img')].filter(x=>x.getAttribute('src')&&x.complete&&x.naturalWidth===0).map(x=>x.getAttribute('src')).slice(0,5)
    };
   });
   item.routes.push({name,status:response?.status(),...v});
   check(item,response?.status()===200,name+' HTTP '+response?.status());
   check(item,v.theme===theme,name+' wrong theme '+v.theme);
   check(item,v.themeCSS,name+' missing theme stylesheet');
   check(item,v.width<=v.viewport+2,name+' overflow '+(v.width-v.viewport));
   check(item,v.nav===(theme==='dark'?'/assets/chapchitra-wordmark-cream-terra.webp':'/assets/chapchitra-wordmark.webp'),name+' navbar artwork mismatch');
   check(item,v.footer==='/assets/chapchitra-wordmark-cream-terra.webp',name+' footer artwork mismatch');
   if(v.brokenImages.length)item.warnings.push(name+' completed broken images: '+v.brokenImages.join(', '));
   return v;
  };
  const shot=async(label,full)=>{
   const name=profile.id+'-'+theme+'-'+label+'.png';
   await page.screenshot({path:join(OUT,name),fullPage:!!full,animations:'disabled',timeout:100000});
   report.screenshots.push(name);
  };
  try{
   const first=await info('home','/');
   check(item,first.preference==='system','Initial theme does not follow OS preference');
   check(item,first.hero===(theme==='dark'?'/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp':'/assets/chapchitra-full.webp'),'Wrong Hero full logo');
   check(item,first.heroFont?.includes('Fraunces'),'Hero 01 Fraunces lost');
   check(item,first.bodyFont?.includes('DM Sans'),'Body DM Sans lost');
   if(theme==='dark'){
    check(item,first.headerColor==='rgb(23, 36, 25)','Dark Forest navbar altered');
    check(item,first.featured==='rgb(110, 82, 63)','Walnut Featured Prints altered');
   }else{
    check(item,first.headerColor==='rgb(246, 247, 245)','Gallery White header changed');
    check(item,first.vFill==='rgb(246, 247, 245)','Light V panel changed');
   }
   await page.evaluate(x=>window.chapchitraTheme.set(x),theme);
   await shot('homepage-full',true);
   const trace=[];
   for(const y of [0,80,160,240,320,240,160,80,0]){
    // WebKit can report the new scrollY a frame before the scroll-linked
    // animation RAF updates data-retraction-progress on saturated CI runners.
    await page.evaluate(async x=>{
     window.scrollTo({top:x,behavior:'instant'});
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    },y);
    await page.waitForTimeout(130);
    if(y===0)await page.waitForFunction(()=>{
     const el=document.querySelector('#hero01PaperPanel');
     return el&&Number(el.dataset.retractionProgress||0)<.01;
    },null,{timeout:4000});
    trace.push(await page.locator('#hero01PaperPanel').evaluate(e=>({scroll:scrollY,progress:Number(e.dataset.retractionProgress||0)})));
   }
   item.heroScrollTrace=trace;
   check(item,trace[3].progress>trace[0].progress,'Hero V not retracting progressively');
   check(item,Math.abs(trace[3].progress-trace[5].progress)<.015,'Hero V reverse does not retrace');
   check(item,trace[8].progress<.01,'Hero V not fully restored at top');
   await info('shop','/shop/');
   const product=await page.locator('.polaroid-name[href^="/product/"]').first().getAttribute('href').catch(()=>null);
   check(item,!!product,'No product links in Shop');
   await shot('shop',false);
   for(const [name,path] of routes.slice(2)){
    await info(name,name==='product'?(product||'/product/'):path);
    if(['product','favorites','bag','journal','artists-edit'].includes(name))await shot(name,false);
   }
   // Manual selection survives document navigation, reload and OS changes.
   await page.goto(BASE+'/about/',{waitUntil:'domcontentloaded'});
   check(item,await page.evaluate(x=>document.documentElement.dataset.theme===x&&localStorage.getItem('chapchitra-color-theme-v1')===x,theme),'Theme did not persist across routes');
   await page.reload({waitUntil:'domcontentloaded'});
   check(item,await page.evaluate(x=>document.documentElement.dataset.theme===x,theme),'Theme did not persist on reload');
   const opposite=theme==='dark'?'light':'dark';
   await page.emulateMedia({colorScheme:opposite});
   await page.waitForTimeout(100);
   check(item,await page.evaluate(x=>document.documentElement.dataset.theme===x,theme),'System color changed explicit preference');
   await page.evaluate(()=>window.chapchitraTheme.reset());
   check(item,await page.evaluate(x=>document.documentElement.dataset.theme===x,opposite),'Reset not following OS');
   await page.evaluate(x=>window.chapchitraTheme.set(x),theme);
   item.checks.push('System preference, persistence, reload, OS override, reset');
   // Favorites persist across routes.
   await page.goto(BASE+'/shop/',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-favorite]',{timeout:30000});
   const fav=page.locator('[data-favorite]').first();
   const id=await fav.getAttribute('data-favorite'),prior=await fav.getAttribute('aria-pressed');
   await fav.click();
   const after=await fav.getAttribute('aria-pressed');
   check(item,after!==prior,'Favorite toggle did not change');
   await page.goto(BASE+'/favorites/',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#siteHeader',{timeout:30000});
   // A DOMContentLoaded event precedes async app.mjs boot. The first QA
   // revision incorrectly inspected the empty shell before Favorites mounted.
   if(after==='true'){
    await page.waitForSelector('[data-favorite="'+id+'"]',{timeout:8000}).catch(()=>null);
    check(item,await page.locator('[data-favorite="'+id+'"]').count()>0,'Favorite not retained after mount');
   }
   item.checks.push('Favorite toggle, cross-route persistence');
   // Bag is demo-only: verify actual sample button and bag quantity.
   await page.goto(BASE+'/shop/',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-add-to-bag]',{timeout:30000});
   await page.locator('[data-add-to-bag]').first().click({timeout:15000});
   await page.waitForTimeout(400);
   const count=await page.locator('#siteHeader .bag-count').textContent();
   check(item,/[1-9]/.test(count||''),'Bag count did not increase');
   await page.goto(BASE+'/bag/',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#siteHeader',{timeout:30000});
   await page.waitForSelector('[data-bag-adjust],[data-bag-remove]',{timeout:8000}).catch(()=>null);
   check(item,await page.locator('[data-bag-adjust],[data-bag-remove]').count()>0,'Demo Bag lacks adjustment/removal controls after mount');
   item.checks.push('Cart Add to Bag, quantity count, controls; real checkout disabled');
   // Home pagination remains active.
   await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
   const next=page.locator('[data-pager="home"][data-page-number="2"]').first();
   if(await next.count()){
    await next.click({timeout:15000});
    const active=await page.locator('[data-pager="home"][aria-current="page"]').first().getAttribute('data-page-number');
    check(item,active==='2','Homepage pagination active page failed');
    item.checks.push('Collection pagination');
   }
   if(profile.id==='desktop-chromium'){
    await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
    await page.locator('.nav-center a[href="/shop/"]').first().click({timeout:16000});
    await page.waitForURL(/\/shop\/?/,{timeout:18000});
    item.checks.push('C02 Home -> Shop navigation in one click');
   }
   const bn=await page.evaluate(async()=>{
    await document.fonts.load('16px "Noto Sans Bengali"','বাংলা');
    return document.fonts.check('16px "Noto Sans Bengali"','বাংলা');
   });
   check(item,bn,'Noto Sans Bengali fallback not available');
   item.checks.push('Bengali body font family');
  }catch(e){item.errors.push('EXCEPTION '+String(e.stack||e).slice(0,1800))}
  // WebKit reports a nonfatal ResizeObserver notification-loop warning
  // during async worktable mount, even when layout resolves correctly.
  // Keep evidence; do not claim absence of a warning.
  item.warnings.push(...pageErrors.filter(x=>x.includes('ResizeObserver loop')).map(x=>'WebKit ResizeObserver warning: '+x));
  item.errors.push(...pageErrors.filter(x=>!x.includes('ResizeObserver loop')).map(x=>'Browser exception: '+x));
  item.pass=item.errors.length===0;
  report.profiles.push(item);
  await writeFile(join(OUT,'combined-regression.json'),JSON.stringify(report,null,2));
  console.log('DUAL_THEME_PROFILE '+JSON.stringify({browser:item.profile,theme:item.theme,pass:item.pass,routes:item.routes.length,checks:item.checks,errors:item.errors.slice(0,6),warnings:item.warnings.slice(0,3)}));
  await ctx.close();
 }
 await browser.close();
}
console.log('DUAL_THEME_RESULT '+JSON.stringify({passed:report.profiles.filter(x=>x.pass).length,total:report.profiles.length,screenshots:report.screenshots.length}));
if(report.profiles.some(x=>!x.pass))process.exitCode=1;
