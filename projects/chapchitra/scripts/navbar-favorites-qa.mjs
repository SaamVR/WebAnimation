/** CHAPCHITRA — local-only real browser navbar + favorite state QA.
 * Runs on the built site. Never accesses, edits or deploys hosted staging.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.CC_QA_ROOT||'http://127.0.0.1:4272';
if(!['localhost','127.0.0.1','::1'].includes(new URL(origin).hostname))
 throw Error('Navbar favorite QA requires an isolated localhost build');
const out=resolve(process.env.CC_QA_OUT||'perf-results/shared-stage-navbar-favorites');
await mkdir(out,{recursive:true});
const profiles=[
 {name:'desktop-chromium',engine:'chromium',width:1440,height:900},
 {name:'mobile-chromium',engine:'chromium',width:390,height:844},
 {name:'ipad-webkit',engine:'webkit',width:834,height:1112},
 {name:'mobile-webkit',engine:'webkit',width:390,height:844}
];
const summary=[];
const browsers={
 chromium:await chromium.launch({headless:true}),
 webkit:await webkit.launch({headless:true})
};
try{
 for(const profile of profiles){
  const context=await browsers[profile.engine].newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:1,reducedMotion:'reduce'});
  // A fresh isolated browser context starts with empty favorites; do not clear
  // storage on every navigation, since reload persistence is part of this QA.
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(origin+'/shop/',{waitUntil:'domcontentloaded'});
  const fav=page.locator('.polaroid-card .favorite-toggle').first();
  await fav.waitFor({state:'visible',timeout:30000});
  const id=await fav.getAttribute('data-favorite');
  assert.ok(id,'Product button must identify the saved item');
  const originalPosition=await fav.boundingBox();
  const nav=page.locator('.site-header .nav-actions');
  assert.ok(await nav.isVisible(),'Navbar actions must be visible');
  const productArt=fav.locator('img[data-favorite-art]');
  const inspect=async selected=>page.evaluate(async selected=>{
   const navAssets=['nav-search.svg','nav-account.svg','nav-bag.svg','nav-favorites-outline.svg'];
   const load=async name=>{
    const response=await fetch('/assets/illustrator/'+name);
    if(!response.ok)throw Error('Cannot fetch '+name);
    return new DOMParser().parseFromString(await response.text(),'image/svg+xml');
   };
   const outline=await load('nav-favorites-outline.svg');
   const filled=await load('nav-favorites-selected.svg');
   const paths=doc=>[...doc.querySelectorAll('path')].map(p=>p.getAttribute('d'));
   const a=paths(outline),b=paths(filled);
   const color=doc=>doc.querySelector('style')?.textContent||'';
   const navColors=[];
   for(const name of navAssets){
    const doc=await load(name);
    navColors.push({name,dark:color(doc).includes('.st0{fill:#1C241D;}')});
   }
   const button=document.querySelector('.polaroid-card .favorite-toggle');
   const img=button?.querySelector('img[data-favorite-art]');
   if(img)await img.decode();
   return {
    navColors,
    outlinePaths:a.length,selectedPaths:b.length,
    sameOutline:a.length===2&&b.length===3&&a.every((path,i)=>path===b[i+1]),
    matchingFrame:outline.documentElement.getAttribute('viewBox')===filled.documentElement.getAttribute('viewBox'),
    selectedFill:filled.querySelector('.cc-favorite-interior')?.getAttribute('fill'),
    outlineTransparent:!outline.querySelector('.cc-favorite-interior'),
    favoriteSrc:img?.getAttribute('src'),
    pressed:button?.getAttribute('aria-pressed'),
    label:button?.getAttribute('aria-label'),
    focusVisible:document.activeElement===button,
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
    navbarIcons:[...document.querySelectorAll('.nav-actions img.cc-nav-art')].map(x=>({src:x.getAttribute('src'),w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height,loaded:x.complete&&x.naturalWidth>0})),
    iconColor:getComputedStyle(document.querySelector('.nav-icon')).color,
    stored:JSON.parse(localStorage.getItem('chapchitra-v3-sample-favorites')||'[]'),
    selectedExpected:selected
   };
  },selected);
  const validate=(info,selected)=>{
   assert.ok(info.navColors.every(x=>x.dark),'All navigation silhouettes must use #1C241D');
   assert.ok(info.sameOutline,'Selected heart must retain identical original outline path');
   assert.ok(info.matchingFrame,'Selected heart must preserve original dimensions/viewBox');
   assert.equal(info.selectedFill,'#8A503B','Terracotta only inside selected icon');
   assert.equal(info.outlineTransparent,true,'Default heart interior is transparent');
   assert.equal(info.pressed,String(selected),'aria-pressed state matches favorite');
   assert.ok(info.favoriteSrc?.endsWith(selected?'nav-favorites-selected.svg':'nav-favorites-outline.svg'),'Correct state asset');
   assert.equal(info.iconColor,'rgb(28, 36, 29)','Navbar fallback icon color is Dark Forest');
   assert.ok(info.navbarIcons.length===4&&info.navbarIcons.every(x=>x.loaded),'All original navbar icons must load');
   assert.equal(info.navbarIcons.filter(x=>x.w>0&&x.h>0).length,profile.width<=600?2:4,'Preserve mobile menu and desktop navbar visibility');
   assert.ok(info.horizontalOverflow<=1,'No horizontal scroll');
   assert.ok(selected?info.label.startsWith('Remove '):info.label.startsWith('Add '),'Accessible button label');
  };
  const headerScreenshot=out+'/'+profile.name+'-navbar.png';
  await page.screenshot({path:headerScreenshot,animations:'disabled'});
  await fav.scrollIntoViewIfNeeded();
  await page.evaluate(()=>{const b=document.querySelector('.polaroid-card .favorite-toggle');const y=b.getBoundingClientRect().top+scrollY-175;scrollTo(0,Math.max(0,y))});
  await page.waitForTimeout(200);
  let state=await inspect(false);
  validate(state,false);
  await page.screenshot({path:out+'/'+profile.name+'-favorite-default.png',animations:'disabled'});
  await fav.click();
  state=await inspect(true);
  validate(state,true);
  assert.ok(state.stored.includes(id),'Favorite must persist in localStorage');
  // Safari/WebKit does not necessarily focus a button on mouse click. Verify
  // reliable keyboard focus independently rather than encoding Chromium policy.
  await fav.focus();
  assert.equal(await fav.evaluate(el=>document.activeElement===el),true,'Keyboard focus must reach the favorite button');
  await page.screenshot({path:out+'/'+profile.name+'-favorite-selected.png',animations:'disabled'});
  await fav.click();
  state=await inspect(false);
  validate(state,false);
  assert.ok(!state.stored.includes(id),'Deselection clears storage');
  await page.screenshot({path:out+'/'+profile.name+'-favorite-deselected.png',animations:'disabled'});
  await fav.focus();
  await page.keyboard.press('Space');
  assert.equal(await fav.getAttribute('aria-pressed'),'true','Keyboard activation selects favorite');
  await page.reload({waitUntil:'domcontentloaded'});
  await fav.waitFor();
  assert.equal(await fav.getAttribute('aria-pressed'),'true','Selected favorite survives reload');
  await fav.focus();
  await page.keyboard.press('Space');
  assert.equal(await fav.getAttribute('aria-pressed'),'false','Keyboard activation deselects favorite');
  await page.goto(origin+'/favorites/',{waitUntil:'domcontentloaded'});
  const activeNav=page.locator('.nav-actions a[href="/favorites/"] img.cc-nav-art');
  await activeNav.waitFor({state:'attached'});
  if(profile.width<=600){
   await page.locator('#menuButton').click();
   assert.ok(await page.locator('#mobileNav a[href="/favorites/"]').isVisible(),'Favorites remains reachable through mobile menu');
   await page.locator('#menuButton').click();
  }
  assert.ok((await activeNav.getAttribute('src')).endsWith('nav-favorites-selected.svg'),'Favorites nav uses outlined selected asset');
  assert.ok((await page.locator('.nav-actions a[href="/favorites/"]').getAttribute('aria-current'))==='page','Active nav accessible');
  assert.deepEqual(errors,[],'No browser errors');
  summary.push({profile:profile.name,viewport:[profile.width,profile.height],passed:true,
   originalPosition:{width:originalPosition?.width,height:originalPosition?.height},
   selectedAndUnselectedSameOutline:true,storedStateAndKeyboard:true,errors});
  await context.close();
  console.log('NAV_FAVORITES_OK',profile.name);
 }
}finally{await Promise.all(Object.values(browsers).map(browser=>browser.close()))}
await writeFile(out+'/navbar-favorites-report.json',JSON.stringify({origin,summary},null,2));
console.log('NAV_FAVORITES_BROWSER_QA_PASSED',summary.length,'profiles');
