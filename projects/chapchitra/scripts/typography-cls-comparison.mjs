import {chromium,webkit} from 'playwright';
import {writeFile} from 'node:fs/promises';
const targets=[
 {name:'approved-scroll-baseline',url:'http://127.0.0.1:4297'},
 {name:'typography-candidate',url:'http://127.0.0.1:4309'}
];
const profiles=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900},
 {name:'mobile-chromium',engine:chromium,width:390,height:844},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112}
];
const data=[];
for(const target of targets){
 for(const profile of profiles){
  let browser,ctx,pg;
  const row={source:target.name,profile:profile.name,url:target.url};
  try{
   browser=await profile.engine.launch({headless:true});
   ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    reducedMotion:'reduce'});
   await ctx.addInitScript(()=>{
    window.__shiftProbe={total:0,entries:[]};
    try{new PerformanceObserver(list=>{
     for(const e of list.getEntries()){
      if(e.hadRecentInput)continue;
      window.__shiftProbe.total+=e.value;
      window.__shiftProbe.entries.push({
       time:Math.round(e.startTime),value:e.value,
       sources:(e.sources||[]).map(s=>({
        tag:s.node?.tagName,
        cls:s.node?.className?.toString()?.slice(0,65),
        id:s.node?.id,
        old:s.previousRect&&[s.previousRect.x,s.previousRect.y,s.previousRect.width,s.previousRect.height],
        next:s.currentRect&&[s.currentRect.x,s.currentRect.y,s.currentRect.width,s.currentRect.height]
       })).slice(0,4)
      });
     }
    }).observe({type:'layout-shift',buffered:true})}
    catch(e){window.__shiftProbe.unsupported=e.message}
   });
   pg=await ctx.newPage();
   await pg.goto(target.url+'/artists-edit/',{waitUntil:'domcontentloaded',timeout:30000});
   await pg.waitForFunction(()=>!!document.querySelector('#app')?.children.length,null,{timeout:25000});
   await pg.evaluate(()=>document.fonts.ready);
   await pg.waitForTimeout(1800);
   Object.assign(row,await pg.evaluate(()=>({
    cls:window.__shiftProbe.total,entries:window.__shiftProbe.entries,
    body:document.body.dataset.page,
    studio:document.body.dataset.worktableStatus,
    fonts:performance.getEntriesByType('resource').filter(x=>/woff2/.test(x.name)).map(x=>x.name.split('/').pop())
   })));
   row.pass=true;
  }catch(e){row.pass=false;row.error=String(e)}
  finally{if(ctx)await ctx.close();if(browser)await browser.close()}
  data.push(row);
  console.log('CLS_COMPARISON '+JSON.stringify({source:row.source,profile:row.profile,cls:row.cls,entries:row.entries?.length,
   worst:row.entries?.sort((a,b)=>b.value-a.value).slice(0,2),error:row.error}));
 }
}
await writeFile('/tmp/chapchitra-typography-cls-comparison.json',JSON.stringify(data,null,2));
