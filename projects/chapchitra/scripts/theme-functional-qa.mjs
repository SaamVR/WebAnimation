import {chromium,webkit} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const OUT=resolve(import.meta.dirname,'../perf-results/dark-theme-review-20261118');
await mkdir(OUT,{recursive:true});
const profiles=[
 {name:'desktop-chromium',engine:chromium,viewport:{width:1440,height:900}},
 {name:'ipad-webkit',engine:webkit,viewport:{width:834,height:1112}},
 {name:'mobile-chromium',engine:chromium,viewport:{width:390,height:844}}
];
const results=[];
const BASE='http://127.0.0.1:4319';
const snap=()=>({
 theme:document.documentElement.dataset.theme,
 pref:window.chapchitraTheme?.getPreference(),
 stored:localStorage.getItem('chapchitra-color-theme-v1'),
 button:document.querySelector('#themeToggle')?.getAttribute('aria-pressed'),
 label:document.querySelector('#themeToggle')?.getAttribute('aria-label')
});
for(const profile of profiles){
 let browser,ctx,page;
 const item={profile:profile.name,checks:[],errors:[]};
 try{
  browser=await profile.engine.launch({headless:true,timeout:60000});
  ctx=await browser.newContext({viewport:profile.viewport,colorScheme:'dark',reducedMotion:'reduce'});
  page=await ctx.newPage();
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>document.querySelector('#themeToggle')!==null,null,{timeout:30000});
  let s=await page.evaluate(snap);
  item.systemDark=s;
  if(s.theme!=='dark'||s.pref!=='system')item.errors.push('System preference dark failed');
  await page.locator('#themeToggle').click();
  s=await page.evaluate(snap);
  item.clickToLight=s;
  if(s.theme!=='light'||s.stored!=='light'||s.button!=='false')item.errors.push('Theme toggle dark -> light failed');
  await page.goto(BASE+'/shop/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#themeToggle')!==null,null,{timeout:20000});
  s=await page.evaluate(snap);
  item.routePersistence=s;
  if(s.theme!=='light'||s.stored!=='light')item.errors.push('Preference not persisted to Shop');
  await page.reload({waitUntil:'domcontentloaded',timeout:25000});
  s=await page.evaluate(snap);
  item.reload=s;
  if(s.theme!=='light'||s.stored!=='light')item.errors.push('Preference reset on reload');
  await page.evaluate(()=>window.chapchitraTheme.reset());
  s=await page.evaluate(snap);
  item.reset=s;
  if(s.theme!=='dark'||s.pref!=='system')item.errors.push('Reset does not follow system dark');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForTimeout(110);
  s=await page.evaluate(snap);
  item.systemChange=s;
  if(s.theme!=='light')item.errors.push('System OS media change not followed');
  await page.locator('#themeToggle').click();
  s=await page.evaluate(snap);
  item.clickToDark=s;
  if(s.theme!=='dark'||s.stored!=='dark')item.errors.push('Explicit dark selection failed');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForTimeout(120);
  s=await page.evaluate(snap);
  item.darkOverrideOS=s;
  if(s.theme!=='dark')item.errors.push('Explicit dark not overriding OS light');
  const fav=page.locator('#shopProducts [data-favorite]').first();
  if(await fav.count()){
   await fav.click();
   const selected=await fav.getAttribute('aria-pressed'),src=await fav.locator('img').getAttribute('src');
   await fav.click();
   const deselected=await fav.getAttribute('aria-pressed');
   item.favorite={selected,deselected,src};
   if(selected!=='true'||deselected!=='false'||!src?.includes('selected'))
    item.errors.push('Favorite selection state failed');
  }
  // Keyboard Tab establishes keyboard modality; direct pointer focus does not.
  await page.evaluate(()=>document.activeElement?.blur());
  await page.keyboard.press('Tab');
  await page.locator('#themeToggle').focus();
  item.focus=await page.locator('#themeToggle').evaluate(el=>{
   const s=getComputedStyle(el);
   return {focusVisible:el.matches(':focus-visible'),style:s.outlineStyle,
    width:s.outlineWidth,color:s.outlineColor};
  });
  if(!item.focus.focusVisible||Number.parseFloat(item.focus.width)<2||item.focus.style==='none')
   item.errors.push('Keyboard theme toggle focus ring missing');
  await page.locator('#searchButton').click();
  item.search=await page.locator('#globalSearch').evaluate(el=>{
   const s=getComputedStyle(el);return {bg:s.backgroundColor,fg:s.color,focusable:el.tabIndex>=0||el.tagName==='INPUT'};
  });
  if(!item.search.focusable)item.errors.push('Search input not focusable');
 }catch(e){item.errors.push('EXCEPTION '+(e.stack||e))}
 finally{if(ctx)await ctx.close();if(browser)await browser.close()}
 item.pass=item.errors.length===0;results.push(item);
 await writeFile(join(OUT,'theme-persistence-accessibility-qa.json'),JSON.stringify(results,null,2));
 console.log('FUNCTIONAL_THEME '+JSON.stringify(item));
}
console.log('FUNCTIONAL_SUMMARY '+JSON.stringify({passed:results.filter(r=>r.pass).length,total:results.length}));
if(results.some(x=>!x.pass))process.exitCode=1;
