import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const BASE='http://127.0.0.1:4327',ROOT=resolve(import.meta.dirname,'..');
const OUT=join(ROOT,'perf-results/dark-refinement-p01-20261118');
await mkdir(OUT,{recursive:true});
const instances=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112}
];
const current=(el,cssprop)=>getComputedStyle(document.querySelector(el))[cssprop];
const colors={forest:'rgb(41, 61, 45)',terracotta:'rgb(138, 80, 59)',mushroom:'rgb(166, 162, 155)',walnut:'rgb(110, 82, 63)',cream:'rgb(228, 227, 222)',graphite:'rgb(35, 35, 35)',beige:'rgb(216, 206, 194)'};
const full='/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp';
const wordmark='/assets/chapchitra-wordmark-cream-terra.webp';
const summary={revision:'dark-refinement-p01',browserProfiles:[],origin:BASE,videoMethod:'native Playwright video, no cuts, no edits, 1x'};
for(const p of instances){
 let browser,context,page,recordContext;
 const o={profile:p.name,viewport:{width:p.width,height:p.height},errors:[],screenshots:[],measured:{}};
 try{
  browser=await p.engine.launch({headless:true,timeout:35000});
  context=await browser.newContext({viewport:o.viewport,reducedMotion:'reduce',colorScheme:'light'});
  await context.addInitScript(()=>localStorage.setItem('chapchitra-color-theme-v1','dark'));
  page=await context.newPage();
  page.on('pageerror',e=>o.errors.push('JS: '+e.message));
  const resp=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(resp.status(),200);
  await page.waitForFunction(()=>!!document.querySelector('#homePager .pager')&&!!document.querySelector('#featured'),null,{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(900);
  // Wait for existing inline SVG hydration; fallback is original approved SVG poster.
  for(const sel of ['#hero .hero-cover .cc-compact-svg','#collection .product-add-button .cc-long-svg']){
   try{await page.waitForSelector(sel,{timeout:6500})}catch(e){o.errors.push('SVG hydration pending '+sel)}
  }
  const result=await page.evaluate(()=>{
   const style=(s,k)=>document.querySelector(s)?getComputedStyle(document.querySelector(s))[k]:null;
   const attr=(s,k)=>document.querySelector(s)?.getAttribute(k)||null;
   const x={
    theme:document.documentElement.dataset.theme,
    heroLogo:attr('#hero .hero-brand-lockup','src'),
    navLogo:attr('#siteHeader .logo-word--image img','src'),
    footerLogo:attr('#footer .logo-word--footer img','src'),
    heroButtonFace:style('#hero .cc-compact-svg #Button_Face_Inside_1_ > path.st7','fill'),
    heroButtonShadow:style('#hero .cc-compact-svg #BUTTON_SHADOW > path','fill'),
    longFace:style('#collection .product-add-button .cc-long-svg #BUTTON_FACE path.st2','fill'),
    longShadow:style('#collection .product-add-button .cc-long-svg #BUTTON_SHADOW path','fill'),
    categoriesChip:style('#categories .filter-chips a','backgroundColor'),
    categoriesChipText:style('#categories .filter-chips a','color'),
    pagination:style('#collection .pager button','backgroundColor'),
    paginationText:style('#collection .pager button','color'),
    featured:style('#featured','backgroundColor'),
    featuredPrinted:style('#featured','--cc-printed-surface'),
    story:style('#story','backgroundImage'),
    overflow:document.documentElement.scrollWidth-innerWidth,
    heroArtworkBytes:performance.getEntriesByType('resource').filter(x=>/chapchitra-full-on-dark|wordmark-cream-terra/.test(x.name)).map(x=>x.name)
   };return x;
  });
  o.measured=result;
  for(const [name,got,want] of [
   ['dark mode',result.theme,'dark'],['hero logo',result.heroLogo,full],
   ['navbar logo',result.navLogo,wordmark],['footer logo',result.footerLogo,wordmark],
   ['hero face',result.heroButtonFace,colors.terracotta],
   ['hero shadow',result.heroButtonShadow,colors.forest],
   ['Add to Bag face',result.longFace,colors.mushroom],
   ['Add to Bag shadow',result.longShadow,colors.terracotta],
   ['filter chips',result.categoriesChip,colors.beige],
   ['chip text',result.categoriesChipText,colors.graphite],
   ['pagination resting',result.pagination,colors.walnut],
   ['pagination text',result.paginationText,colors.cream],
   ['Featured Prints',result.featured,colors.walnut]
  ])if(got!==want)o.errors.push(name+': '+got+' expected '+want);
  if(result.overflow>2)o.errors.push('Horizontal overflow '+result.overflow);
  const snap=async(name,locator,fullPage=false)=>{
   const file=p.name+'-'+name+'.png';
   await page.locator(locator).first().scrollIntoViewIfNeeded();
   await page.screenshot({path:join(OUT,file),fullPage,animations:'disabled'});
   o.screenshots.push(file);
  };
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:join(OUT,p.name+'-dark-full-home.png'),fullPage:true,animations:'disabled'});
  o.screenshots.push(p.name+'-dark-full-home.png');
  await snap('hero-logo-cta','#hero .hero-cover');
  await snap('category-chips','#categories');
  await snap('collection-add-to-bag','#collection .product-card-shell');
  await snap('pagination','#homePager .pager');
  await snap('featured-prints','#featured');
  await snap('footer-logo','#footer .footer-identity');
  // Toggle light and back: original light artwork must return automatically.
  await page.evaluate(()=>window.chapchitraTheme.set('light'));
  let light=await page.evaluate(()=>({
   hero:document.querySelector('#hero .hero-brand-lockup')?.getAttribute('src'),
   nav:document.querySelector('#siteHeader .logo-word--image img')?.getAttribute('src')
  }));
  o.lightSource=light;
  if(light.hero!=='/assets/chapchitra-full.webp'||light.nav!=='/assets/chapchitra-wordmark.webp')
   o.errors.push('Light source not restored '+JSON.stringify(light));
  await page.evaluate(()=>window.chapchitraTheme.set('dark'));
  // Browser-native video of a real scroll path; each frame is in real time.
  recordContext=await browser.newContext({viewport:o.viewport,colorScheme:'light',recordVideo:{dir:OUT,size:o.viewport}});
  await recordContext.addInitScript(()=>localStorage.setItem('chapchitra-color-theme-v1','dark'));
  const vpage=await recordContext.newPage();
  await vpage.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await vpage.waitForFunction(()=>document.querySelector('#hero01PaperPanel')!==null,null,{timeout:25000});
  await vpage.waitForTimeout(650);
  const trace=[];
  for(const scroll of [0,35,70,105,140,175,210,245,280,315,350,385,420,490,580,700,840,1000,1200,1500,1800,2100,2400,2800,3200,3700,4100,4500,4900,5300,5700,5300,4900,4500,4100,3700,3200,2800,2400,2100,1800,1500,1200,1000,840,700,580,490,420,385,350,315,280,245,210,175,140,105,70,35,0]){
   await vpage.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),scroll);
   await vpage.waitForTimeout(170);
   trace.push(await vpage.evaluate(()=>({scroll:scrollY,progress:document.querySelector('#hero01PaperPanel')?.dataset.retractionProgress,theme:document.documentElement.dataset.theme})));
  }
  const vid=vpage.video();
  await recordContext.close();
  o.video=p.name+'-dark-home-scroll-uncut.webm';
  if(vid)await vid.saveAs(join(OUT,o.video));
  o.scrollTrace=trace;
  if(!trace.every(x=>x.theme==='dark'))o.errors.push('Theme unexpectedly switched during scroll video');
  if(trace.at(-1)?.scroll!==0)o.errors.push('Did not return to top');
  o.pass=o.errors.length===0;
 }catch(e){o.pass=false;o.errors.push(e.stack||String(e))}
 finally{
  if(recordContext){try{await recordContext.close()}catch(e){}}
  if(context)await context.close();
  if(browser)await browser.close();
  summary.browserProfiles.push(o);
  await writeFile(join(OUT,'browser-qa.json'),JSON.stringify(summary,null,2));
  console.log('P01_PROFILE '+JSON.stringify({name:o.profile,pass:o.pass,metrics:o.measured,errors:o.errors,shots:o.screenshots.length,video:o.video}));
 }
}
console.log('P01_SUMMARY '+JSON.stringify({passed:summary.browserProfiles.filter(o=>o.pass).length,total:summary.browserProfiles.length}));
if(summary.browserProfiles.some(o=>!o.pass))process.exitCode=1;
