import {chromium,webkit} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const out=resolve(import.meta.dirname,'../perf-results/staging-integration-20261118');
const rows=[];
for(const config of [
 {name:'narrow-chromium',browser:chromium,width:320,height:700},
 {name:'narrow-webkit',browser:webkit,width:320,height:700},
 {name:'mobile-chromium',browser:chromium,width:390,height:844}
]){
 const browser=await config.browser.launch({headless:true,timeout:45000});
 for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width:config.width,height:config.height},colorScheme:theme,reducedMotion:'reduce'});
  await ctx.addInitScript(choice=>{localStorage.setItem('chapchitra-color-theme-v1',choice)},theme);
  const page=await ctx.newPage();
  const row={profile:config.name,theme,errors:[]};
  const goto=async(path)=>{
   const resp=await page.goto('http://127.0.0.1:4336'+path,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>!!document.querySelector('#themeToggle'),null,{timeout:22000});
   await page.evaluate(()=>document.fonts.ready);
   return resp.status();
  };
  try{
   await goto('/shop/');
   const inspect=async()=>page.evaluate(()=>{
    const el=s=>document.querySelector(s);
    const rect=s=>{const x=el(s);if(!x)return null;const b=x.getBoundingClientRect();return {l:b.left,r:b.right,t:b.top,b:b.bottom,w:b.width,h:b.height,display:getComputedStyle(x).display}};
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
     logo:rect('#siteHeader .logo-word'),headerToggle:rect('#themeToggle'),
     search:rect('#searchButton'),bag:rect('.bag-link'),hamburger:rect('#menuButton'),
     menuButton:rect('#themeToggleMobile'),theme:document.documentElement.dataset.theme};
   });
   row.geometry=await inspect();
   const g=row.geometry;
   if(g.scrollWidth>g.width+2)row.errors.push('Horizontal overflow');
   if(config.width<=430&&g.headerToggle.display!=='none')row.errors.push('Narrow top toggle not hidden');
   for(const [key,obj] of Object.entries({search:g.search,bag:g.bag,headerToggle:g.headerToggle})){
    if(!obj||obj.display==='none')continue;
    if(obj.l<g.logo.r-0.5&&obj.r>g.logo.l+0.5)
     row.errors.push('Header logo overlaps '+key);
   }
   if(config.width<=430){
    await page.locator('#menuButton').click();
    const toggle=page.locator('#themeToggleMobile');
    if(!await toggle.isVisible())row.errors.push('Missing accessible toggle in narrow nav');
    else{
     const oldTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
     await toggle.click();
     const next=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,stored:localStorage.getItem('chapchitra-color-theme-v1'),pressed:document.querySelector('#themeToggleMobile').getAttribute('aria-pressed')}));
     row.menuResult={oldTheme,next};
     if(next.theme===oldTheme||next.stored!==next.theme||next.pressed!==String(next.theme==='dark'))
      row.errors.push('Narrow menu toggle failed');
    }
   }
   await goto('/shop/');
   if(config.name==='narrow-chromium'||config.name==='mobile-chromium'){
    await page.screenshot({path:join(out,config.name+'-'+theme+'-shop.png'),animations:'disabled'});
    await goto('/');
    await page.screenshot({path:join(out,config.name+'-'+theme+'-home-full.png'),fullPage:true,animations:'disabled'});
   }
  }catch(e){row.errors.push('EXCEPTION '+String(e))}
  row.pass=!row.errors.length;
  rows.push(row);
  console.log('NARROW_THEME '+JSON.stringify(row));
  await ctx.close();
 }
 await browser.close();
}
await writeFile(join(out,'integration-narrow-layout.json'),JSON.stringify(rows,null,2));
console.log('NARROW_SUMMARY '+JSON.stringify({pass:rows.every(r=>r.pass),count:rows.length}));
if(rows.some(r=>!r.pass))process.exitCode=1;
