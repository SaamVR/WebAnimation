import {chromium,webkit} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const out=resolve(import.meta.dirname,'../perf-results/dark-theme-review-20261118');
await mkdir(out,{recursive:true});
// Supply local axe-core 4.10.3: CHAPCHITRA_AXE_PATH=/path/to/axe.min.js
const axe=await readFile(process.env.CHAPCHITRA_AXE_PATH||'/tmp/chapchitra-axe-4.10.3.min.js','utf8');
const base='http://127.0.0.1:4319';
const rows=[];
const matrix=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112},
 {name:'mobile-chromium',engine:chromium,width:390,height:844}
];
for(const profile of matrix){
 const browser=await profile.engine.launch({headless:true});
 for(const theme of ['dark']){
  const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},reducedMotion:'reduce',colorScheme:theme});
  await ctx.addInitScript(choice=>{
   try{localStorage.setItem('chapchitra-color-theme-v1',choice)}catch(_){}
  },theme);
  const page=await ctx.newPage();
  for(const [route,url] of [['home','/'],['shop','/shop/'],['artist','/artists-edit/']]){
   const row={browser:profile.name,theme,route};
   try{
    await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:28000});
    await page.waitForFunction(()=>document.querySelector('#app')?.children.length>0,null,{timeout:27000});
    await page.evaluate(()=>document.fonts.ready);
    await page.addScriptTag({content:axe});
    const results=await page.evaluate(()=>window.axe.run(document,{
      runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
    }));
    row.violations=results.violations.map(v=>({
     id:v.id,impact:v.impact,description:v.description,
     nodes:v.nodes.length,examples:v.nodes.slice(0,6).map(n=>({
      selector:n.target.join(' '),summary:n.failureSummary,
      html:n.html.slice(0,270)
     }))
    }));
    row.passes=results.passes.length;
    row.incomplete=results.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}));
    row.pass=row.violations.length===0;
   }catch(e){row.error=String(e);row.pass=false}
   rows.push(row);
   await writeFile(join(out,'axe-accessibility-audit.json'),JSON.stringify(rows,null,2));
   console.log('AXE_THEME '+JSON.stringify({
    browser:row.browser,theme:row.theme,route:row.route,passes:row.passes,
    violations:row.violations?.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes})),error:row.error
   }));
  }
  await ctx.close();
 }
 await browser.close();
}
console.log('AXE_RESULTS '+JSON.stringify({screens:rows.length,withViolations:rows.filter(x=>x.violations?.length).length,
 violations:[...new Set(rows.flatMap(x=>x.violations?.map(v=>v.id)||[]))]}));
