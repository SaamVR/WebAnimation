import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const OUT=resolve(import.meta.dirname,'../perf-results/typography-review-20261117');
await mkdir(OUT,{recursive:true});
const BASE='http://127.0.0.1:4309';
const profiles=[
 {name:'desktop-chromium',engine:chromium,viewport:{width:1440,height:900}},
 {name:'ipad-webkit',engine:webkit,viewport:{width:834,height:1112}},
 {name:'mobile-chromium',engine:chromium,viewport:{width:390,height:844}}
];
const result=[];
for(const profile of profiles){
 const browser=await profile.engine.launch({headless:true});
 const context=await browser.newContext({viewport:profile.viewport,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  window.__typoCLS={total:0,entries:[]};
  try{new PerformanceObserver(list=>{
   for(const e of list.getEntries()){
    if(!e.hadRecentInput){
     window.__typoCLS.total+=e.value;
     window.__typoCLS.entries.push({value:e.value,startTime:e.startTime});
    }
   }
  }).observe({type:'layout-shift',buffered:true})}catch(e){window.__typoCLS.unsupported=e.message}
 });
 const page=await context.newPage();
 const data={name:profile.name,pages:[],errors:[],warnings:[]};
 for(const path of ['/','/shop/','/artists-edit/']){
  const resp=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:28000});
  await page.waitForFunction(()=>!!document.querySelector('#app')?.children.length,null,{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(600);
  const x=await page.evaluate(()=>({
   cls:window.__typoCLS.total,
   clsSupported:!window.__typoCLS.unsupported,
   fontsChecked:{
    fraunces:document.fonts.check('650 34px "Fraunces"','Art you can wear.'),
    dm:document.fonts.check('400 16px "DM Sans"','Everyday wearable art')
   },
   fonts:performance.getEntriesByType('resource').filter(x=>x.name.includes('/assets/fonts/')).map(x=>({
    name:x.name.split('/').pop(),durationMs:+x.duration.toFixed(2),transferSize:x.transferSize,
    initiator:x.initiatorType
   })),
   preloads:document.querySelectorAll('link[rel="preload"][as="font"]').length,
   viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth
  }));
  const row={route:path,status:resp.status(),...x};data.pages.push(row);
  // The asynchronously mounted, owner-approved Artist's Edit desk has an
  // existing non-font page-mount CLS. Benchmark it separately against PR120;
  // do not mask unexpected CLS on Home/Shop or touch the protected desk layout.
  if(path==='/artists-edit/'&&x.clsSupported&&x.cls>.1)
   data.warnings.push('Inherited asynchronous Artist Edit worktable mount shift; compare baseline CLS evidence');
  if(resp.status()!==200||x.preloads!==2||!x.fontsChecked.fraunces||!x.fontsChecked.dm||
    x.scrollWidth>x.viewport+2||(path!=='/artists-edit/'&&x.clsSupported&&x.cls>.1))
   data.errors.push('font/CLS issue '+path+': '+JSON.stringify(row).slice(0,400));
 }
 data.pass=data.errors.length===0;
 result.push(data);
 await context.close();await browser.close();
 console.log('FONT_LOADING_QA '+JSON.stringify(data));
}
await writeFile(join(OUT,'font-loading-qa.json'),JSON.stringify({pass:result.every(r=>r.pass),profiles:result},null,2));
if(result.some(r=>!r.pass))process.exitCode=1;
