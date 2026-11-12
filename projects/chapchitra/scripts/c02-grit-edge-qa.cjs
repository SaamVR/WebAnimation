// CHAPCHITRA C02 — same-progress Grit Roller vs original visual QA.
// Actual Playwright Chromium/WebKit browser screenshots and WebM, no image mockups.
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const {mkdirSync,writeFileSync,renameSync}=require('node:fs');
const path=require('node:path');
const ORIGIN=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const NAME=process.env.C02_QA_ENGINE||'chromium';
const engine=NAME==='webkit'?webkit:chromium;
const devices=process.env.C02_QA_DEVICE
 ?[[process.env.C02_QA_DEVICE,process.env.C02_QA_DEVICE==='mobile'?390:834,
   process.env.C02_QA_DEVICE==='mobile'?844:1112]]
 :NAME==='webkit'?[['tablet',834,1112],['mobile',390,844]]:
  [['desktop',1280,800],['mobile',390,844]];
const folder=path.resolve(__dirname,'../docs/c02-grit-edge-evidence',NAME);
mkdirSync(folder,{recursive:true});
const results=[];
function assert(ok,where,details=''){
 results.push({engine:NAME,where,status:ok?'pass':'fail',details});
 if(!ok)throw Error(where+': '+JSON.stringify(details).slice(0,600));
}
async function rgbaDiff(a,b){
 const imA=await sharp(a).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const imB=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(imA.info.width!==imB.info.width||imA.info.height!==imB.info.height)return -1;
 let changed=0;
 for(let i=0;i<imA.data.length;i+=4)
  if(Math.abs(imA.data[i]-imB.data[i])+
   Math.abs(imA.data[i+1]-imB.data[i+1])+
   Math.abs(imA.data[i+2]-imB.data[i+2])>50)changed++;
 return changed;
}
async function compare(page,device){
 await page.goto(ORIGIN+'/c02-review/edge-compare/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#grit mask path')?.getAttribute('d')?.length>800);
 const comparePoints=[.20,.38,.57,.72];
 for(const p of comparePoints){
  await page.locator('#progress').evaluate((el,value)=>{
   el.value=String(Math.round(value*1000));
   el.dispatchEvent(new Event('input',{bubbles:true}));
  },p);
  const state=await page.evaluate(()=>{
   const org=document.querySelector('#original');
   const grit=document.querySelector('#grit');
   return {
    old:org?.querySelector('g path[fill="#293D2D"]')?.getAttribute('d'),
    next:grit?.querySelector('g path[fill="#293D2D"]')?.getAttribute('d'),
    oldForest:org?.querySelector('g path[fill="#172419"]')?.getAttribute('d'),
    nextForest:grit?.querySelector('g path[fill="#172419"]')?.getAttribute('d'),
    oldOutline:org?.querySelector('path[stroke="#8A503B"]')?.getAttribute('d'),
    nextOutline:grit?.querySelector('path[stroke="#8A503B"]')?.getAttribute('d'),
    mask:grit?.querySelector('g')?.getAttribute('mask'),
    cuts:grit?.querySelector('mask path')?.getAttribute('d')?.length,
    deposits:grit?.querySelector(':scope > path[fill="#293D2D"]')?.getAttribute('d')?.length
   };
  });
  assert(state.old===state.next&&state.oldForest===state.nextForest&&
   state.oldOutline===state.nextOutline,
   device+' same exact organic shape at '+p,state);
  assert(Boolean(state.mask&&state.cuts>3000&&state.deposits>200),
   device+' localized pigment mask at '+p,
   {mask:state.mask,cuts:state.cuts,deposits:state.deposits});
  await page.screenshot({path:path.join(folder,device+'-before-after-'+Math.round(p*100)+'pct.png'),
   fullPage:true});
  if(p===.38){
   const a=await page.locator('#original').screenshot();
   const b=await page.locator('#grit').screenshot();
   const changed=await rgbaDiff(a,b);
   assert(changed>100,device+' real raster difference between edge variants',
    {changedPixels:changed});
  }
 }
 await page.locator('#replay').click();
 await page.waitForTimeout(5300);
 assert(Number(await page.locator('#progress').inputValue())>=750,
  device+' both panels share same 5s playback progress');
}
async function navigation(page,device,edge){
 const route='/c02-review/?edge='+edge;
 await page.goto(ORIGIN+route,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2');
 const t=Date.now();
 await page.locator('a[href="/c02-review/slow/?delay=3000"]').click({noWaitAfter:true});
 await page.waitForFunction(()=>{
  const o=document.querySelector('#c02-loader');
  const p=Number(o?.dataset.progress);
  return o?.dataset.phase==='cover'&&p>=.30&&p<.78;
 },null,{timeout:4000});
 const state=await page.evaluate(()=>{
  const o=document.querySelector('#c02-loader');
  const g=o?.querySelector('svg > g');
  return {p:Number(o?.dataset.progress),mask:g?.getAttribute('mask'),
   image:o?.querySelector('img')?.getAttribute('src'),
   rollerWidth:o?.querySelector('.c02-loader__roller')?
    getComputedStyle(o.querySelector('.c02-loader__roller')).width:null,
   outlines:o?.querySelectorAll('svg path[stroke]').length};
 });
 assert(state.p>=.30&&state.p<1,device+' '+edge+' mid-sweep',state);
 assert(edge==='grit'?Boolean(state.mask):!state.mask,
  device+' '+edge+' mask only when selected',state);
 assert(state.image==='/assets/c02/roller-original.svg',
  device+' '+edge+' approved original SVG',state);
 await page.screenshot({path:path.join(folder,device+'-'+edge+'-original-roller-in-motion.png')});
 await page.waitForURL(u=>u.pathname==='/c02-review/slow/',{timeout:15000});
 await page.waitForFunction(()=>!document.querySelector('#c02-loader')&&window.__c02DemoReady===true,
  null,{timeout:18000});
 const final=await page.evaluate(()=>({
  at:Number(document.documentElement.dataset.c02ReadyAt),
  end:Number(document.documentElement.dataset.c02RollerEndAt),
  reveal:Number(document.documentElement.dataset.c02RevealEndAt),
  status:document.documentElement.dataset.c02State
 }));
 assert(final.at>0&&final.end>=final.at&&final.reveal>=final.end&&
   final.status==='complete',device+' '+edge+' automatic reveal',final);
 results.push({engine:NAME,where:device+' '+edge+' complete',status:'pass',
  elapsed:Date.now()-t,...final});
}
(async()=>{
 for(const [device,width,height] of devices){
  const browser=await engine.launch(NAME==='chromium'&&process.platform==='win32'
   ?{headless:true,channel:'chrome'}:{headless:true});
  const ctx=await browser.newContext({viewport:{width,height},
   hasTouch:device!=='desktop',recordVideo:{dir:folder,size:{width,height}}});
  const page=await ctx.newPage();
  try{
   await compare(page,device);
   for(const edge of ['original','grit'])await navigation(page,device,edge);
  }catch(e){
   results.push({engine:NAME,device,where:'suite',status:'fail',
    error:String(e?.stack||e).slice(0,1500)});
  }finally{
   await ctx.close();
   try{const video=await page.video()?.path();
    if(video)renameSync(video,path.join(folder,device+'-grit-roller-comparison.webm'))}
   catch(e){console.warn('Video issue',e.message)}
   await browser.close();
  }
 }
 writeFileSync(path.join(folder,'grit-edge-results.json'),JSON.stringify(results,null,2));
 const failed=results.filter(x=>x.status==='fail');
 console.log('RESULTS',JSON.stringify(results.filter(x=>x.where==='suite'||x.where.includes('raster'))));
 console.log('SUMMARY',JSON.stringify({pass:results.length-failed.length,
  fail:failed.length,failures:failed}));
 if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});