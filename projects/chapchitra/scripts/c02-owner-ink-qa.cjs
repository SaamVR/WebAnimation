// C02 original owner SVG: visible vector surface + real navigation QA.
// Viewports are simulated; physical iPad Safari remains an owner review gate.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const engineName=process.env.C02_QA_ENGINE||'chromium';
const engine=engineName==='webkit'?webkit:chromium;
const origin=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const output=path.resolve(__dirname,'../docs/c02-owner-ink-evidence',engineName);
fs.mkdirSync(output,{recursive:true});
const results=[];
function record(device,name,passed,data){
 results.push({engine:engineName,device,name,passed,data});
 if(!passed)throw Error(name+': '+JSON.stringify(data).slice(0,1100));
}
async function step(page,device,delay){
 await page.goto(origin+'/c02-review/?edge=asset',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2'&&
  document.documentElement.dataset.c02AssetReady==='true');
 const started=Date.now();
 await page.locator('a[href="/c02-review/slow/?delay='+delay+'"]').click({noWaitAfter:true});
 let observed=false,texturedInterior=false;
 const captures=new Set();
 const requireInterior=device==='ultrawide'&&delay>=5000;
 const detailed=delay===5000;
 const deadline=Date.now()+(detailed?delay+3500:Math.min(delay,1800));
 while(Date.now()<deadline&&(!observed||(requireInterior&&!texturedInterior)||
  (detailed&&captures.size<4))){
  const state=await page.evaluate(()=>{
   const o=document.getElementById('c02-loader');
   const img=o?.querySelector('.c02-loader__ink-asset');
   const roller=o?.querySelector('.c02-loader__roller img');
   const layer=o?.querySelector('.c02-loader__ink-asset-layer');
   const viewport=window.visualViewport;
   const scale=(viewport?.height||innerHeight)*1.5/1152;
   const data={
    p:Number(o?.dataset.progress),inkType:o?.dataset.inkAsset,
    source:img?.getAttribute('src'),originalSize:[img?.naturalWidth,img?.naturalHeight],
    roller:roller?.getAttribute('src'),natural:[roller?.naturalWidth,roller?.naturalHeight],
    style:img?getComputedStyle(img).display:null,
    width:img?parseFloat(img.style.width):0,height:img?parseFloat(img.style.height):0,
    contact:Number(o?.dataset.inkContactX),viewport:innerWidth,
    sourceStartX:Number(o?.dataset.inkContactX)-8096*scale,
    layers:layer?.children.length,
    svgVisible:o?getComputedStyle(o.querySelector('svg.c02-loader__surface')).visibility:null,
    layerDisplay:layer?getComputedStyle(layer).display:null,
    backgroundRepeat:layer?getComputedStyle(layer).backgroundRepeat:null
   };
   return data;
  }).catch(()=>({}));
  if(state.inkType==='owner-vector-svg'&&state.p>.05&&state.p<=1&&
   state.originalSize?.[0]===8192&&state.originalSize?.[1]===1152){
   if(!observed){
    observed=true;
    record(device,delay+'ms one original hand-illustrated vector image',
     state.source==='/assets/c02/texture.svg'&&
     state.originalSize[0]===8192&&state.originalSize[1]===1152&&
     state.roller==='/assets/c02/roller-original.svg'&&state.layers===1&&
     state.svgVisible==='hidden',state);
    record(device,delay+'ms exact SVG aspect ratio',
     Math.abs(state.width/state.height-8192/1152)<.00002,state);
    record(device,delay+'ms moving contact',
     Number.isFinite(state.contact)&&state.contact>-state.viewport,state);
    record(device,delay+'ms no runtime texture tiles or overlapping images',
     state.layers===1&&state.layerDisplay==='block'&&
     !state.backgroundRepeat?.includes('repeat-x'),state);
    if(delay>=5000&&!requireInterior)
     await page.screenshot({path:path.join(output,device+'-5s-original-png-roller.png')});
   }
   if(requireInterior&&!texturedInterior&&state.contact>state.viewport*.78){
    texturedInterior=true;
    const screenshot=await page.screenshot({path:path.join(output,
     'ultrawide-5s-unified-texture.png')});
    const sharp=require('sharp');
    const sampled=await sharp(screenshot).extract({
     left:10,top:125,width:430,height:330
    }).stats();
    const rgbDeviation=sampled.channels.slice(0,3).map(c=>c.stdev);
    record(device,'ultrawide SVG retains original pigment variance',
     Math.max(...rgbDeviation)>.25,
     {sourceStartX:state.sourceStartX,rgbDeviation});
   }
   if(detailed){
    for(const threshold of [.25,.5,.75,.95]){
     if(state.p>=threshold&&!captures.has(threshold)){
      captures.add(threshold);
      await page.screenshot({path:path.join(output,
       device+'-5s-cover-'+Math.round(threshold*100)+'pct.png')});
      break;
     }
    }
   }
   if(detailed&&!requireInterior)await page.waitForTimeout(28);
   else if(requireInterior&&!texturedInterior)await page.waitForTimeout(28);
  }else await page.waitForTimeout(45);
 }
 if(delay>=5000)record(device,'5s continuously textured cover',observed,
  {delay,observed,coverageStages:[...captures]});
 if(device==='ultrawide'&&delay>=5000)
  record(device,'5s extended unique pigment coverage',texturedInterior,
   {delay,texturedInterior});
 await page.waitForURL(u=>u.pathname==='/c02-review/slow/',{timeout:18000});
 // The 385ms reveal must use the SAME pigment surface as full cover.
 // Inspect the actual incoming document rather than source-only assertions.
 if(delay>=5000){
  await page.waitForFunction(()=>document.getElementById('c02-loader')?.dataset.phase==='reveal',
   null,{timeout:16000});
  const reveal=await page.evaluate(()=>{
   const o=document.getElementById('c02-loader');
   const bitmap=o?.querySelector('.c02-loader__ink-asset');
   const layer=o?.querySelector('.c02-loader__ink-asset-layer');
   const svg=o?.querySelector('svg.c02-loader__surface');
   const vp=window.visualViewport;
   return {phase:o?.dataset.phase,asset:o?.dataset.inkAsset,
    progress:Number(o?.dataset.progress),source:bitmap?.getAttribute('src'),
    layers:layer?.children.length,natural:[bitmap?.naturalWidth,bitmap?.naturalHeight],
    layerDisplay:getComputedStyle(layer).display,
    svgVisibility:getComputedStyle(svg).visibility,
    viewportWidth:vp?.width||innerWidth,scrollY,
    viewportHeight:vp?.height||innerHeight,
    clip:layer?.style.clipPath};
  });
  record(device,'5s reveal retains original SVG without renderer switch',
   reveal.phase==='reveal'&&reveal.asset==='owner-vector-svg'&&
   reveal.source==='/assets/c02/texture.svg'&&
   reveal.layers===1&&reveal.natural[0]===8192&&
   reveal.layerDisplay==='block'&&reveal.svgVisibility==='hidden',reveal);
  await page.screenshot({path:path.join(output,device+'-5s-textured-reveal.png')});
 }
 await page.waitForFunction(()=>window.__c02DemoReady===true&&!document.getElementById('c02-loader'),
  null,{timeout:18000});
 const finished=await page.evaluate(()=>({
  phase:document.documentElement.dataset.c02State,
  ready:Number(document.documentElement.dataset.c02ReadyAt),
  rollerDone:Number(document.documentElement.dataset.c02RollerEndAt),
  revealed:Number(document.documentElement.dataset.c02RevealEndAt),
  remaining:window.__c02RemainingWaitMs
 }));
 record(device,delay+'ms one-click destination reveal',
  finished.phase==='complete'&&finished.ready>0&&
  finished.rollerDone>=finished.ready&&finished.revealed>=finished.rollerDone,
  {elapsedMs:Date.now()-started,...finished});
}
// Real compositor check: grow/shrink the iPad viewport DURING an active
// partial printed cover, then verify the mask, roller and raster use the
// same visualViewport rectangle. This cannot emulate physical toolbar chrome.
async function viewportScenario(page,device,width,height){
 await page.goto(origin+'/c02-review/?edge=asset',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2'&&
  document.documentElement.dataset.c02AssetReady==='true');
 await page.locator('a[href="/c02-review/slow/?delay=5000"]').click({noWaitAfter:true});
 await page.waitForFunction(()=>{
  const o=document.getElementById('c02-loader');
  return o?.dataset.inkAsset==='owner-vector-svg'&&
   Number(o.dataset.progress)>.10;
 },null,{timeout:6500});
 const read=()=>page.evaluate(()=>{
  const o=document.getElementById('c02-loader');
  const frame=o?.getBoundingClientRect();
  const vp=window.visualViewport;
  const rect=o?.querySelector('.c02-loader__ink-asset-layer')?.getBoundingClientRect();
  const roller=o?.querySelector('.c02-loader__roller')?.getBoundingClientRect();
  return {phase:o?.dataset.phase,p:Number(o?.dataset.progress),
   asset:o?.dataset.inkAsset,bodyScroll:scrollY,
   outer:frame?{x:frame.x,y:frame.y,width:frame.width,height:frame.height}:null,
   ink:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null,
   roller:roller?{x:roller.x,y:roller.y,width:roller.width,height:roller.height}:null,
   viewport:{x:vp?.offsetLeft||0,y:vp?.offsetTop||0,
    width:vp?.width||innerWidth,height:vp?.height||innerHeight},
   inner:[innerWidth,innerHeight],page:[document.documentElement.scrollWidth,
    document.documentElement.scrollHeight]};
 });
 const initial=await read();
 const shorter=Math.max(500,height-120);
 await page.setViewportSize({width,height:shorter});
 await page.waitForFunction(()=>{
  const o=document.getElementById('c02-loader');
  const v=window.visualViewport;
  return o&&Math.abs(o.getBoundingClientRect().height-(v?.height||innerHeight))<2;
 },null,{timeout:3500});
 const resized=await read();
 record(device,'visual-viewport changed without ink clipping',
  resized.asset==='owner-vector-svg'&&resized.phase==='cover'&&
  Math.abs(resized.outer.height-resized.viewport.height)<2&&
  Math.abs(resized.outer.width-resized.viewport.width)<2&&
  Math.abs(resized.outer.x-resized.viewport.x)<2&&
  Math.abs(resized.outer.y-resized.viewport.y)<2&&
  resized.ink.height>resized.outer.height-1,
  {initial,resized});
 await page.screenshot({path:path.join(output,device+'-viewport-resized.png')});
 await page.setViewportSize({width,height});
 await page.waitForURL(u=>u.pathname==='/c02-review/slow/',{timeout:20000});
 await page.waitForFunction(()=>window.__c02DemoReady===true&&
  !document.getElementById('c02-loader'),null,{timeout:20000});
 const destination=await page.evaluate(()=>({scrollY,viewportHeight:visualViewport?.height,
  innerHeight,docHeight:document.documentElement.scrollHeight,
  phase:document.documentElement.dataset.c02State}));
 record(device,'resized-viewport navigation completed without forced scroll',
  destination.phase==='complete'&&destination.scrollY===0,
  {initial,resized,destination});
}

async function compare(page,device){
 await page.goto(origin+'/c02-review/asset-compare/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#after image')?.getAttribute('href')
  ==='/assets/c02/texture.svg');
 await page.waitForFunction(()=>document.querySelector('#after image')?.getBBox().width>0);
 for(const progress of [380,700]){
  await page.locator('#progress').evaluate((el,value)=>{
   el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
  },progress);
  const rect=await page.evaluate(()=>{
   const before=document.querySelector('#before path[fill="#293D2D"]');
   const img=document.querySelector('#after image');
   return {progress:document.getElementById('progress').value,
    source:img?.getAttribute('href'),width:Number(img?.getAttribute('width')),
    height:Number(img?.getAttribute('height')),
    imageX:Number(img?.getAttribute('x')),
    extraRect:!!document.querySelector('#after rect'),
    beforeLength:before?.getAttribute('d')?.length};
  });
  record(device,'side-by-side at '+progress/10+'%',rect.progress===String(progress)
   &&rect.source==='/assets/c02/texture.svg'&&
   Math.abs(rect.width/rect.height-8192/1152)<.00002&&
   !rect.extraRect&&Number.isFinite(rect.imageX),rect);
  await page.screenshot({path:path.join(output,device+'-compare-'+progress/10+'pct.png'),fullPage:true});
 }
}
async function main(){
 const devices=process.env.C02_QA_DEVICE
  ?[[process.env.C02_QA_DEVICE,process.env.C02_QA_DEVICE==='desktop'?1280:834,
    process.env.C02_QA_DEVICE==='desktop'?800:1112]]
  :engineName==='webkit'?[['ipad',834,1112],['mobile',390,844]]
 :[['desktop',1280,800],['mobile',390,844],['ultrawide',3440,900]];
 for(const [device,width,height] of devices){
  const browser=await engine.launch(engineName==='chromium'&&process.platform==='win32'
   ?{channel:'chrome',headless:true}:{headless:true});
  const context=await browser.newContext({viewport:{width,height},hasTouch:device!=='desktop',
   recordVideo:{dir:output,size:{width,height}}});
  const page=await context.newPage();
  try{
   await compare(page,device);
   for(const delay of [1000,3000,5000])await step(page,device,delay);
   if(device==='ipad'||device==='desktop')
    await viewportScenario(page,device,width,height);
  }catch(e){results.push({engine:engineName,device,name:'suite',passed:false,error:String(e.stack||e).slice(0,2000)});}
  finally{
   await context.close();
   try{const video=await page.video()?.path();
    if(video)fs.copyFileSync(video,path.join(output,device+'-one-click-1s-5s.webm'))}
   catch(e){console.error('Video archive',e.message)}
   await browser.close();
  }
 }
 fs.writeFileSync(path.join(output,'owner-png-results.json'),JSON.stringify(results,null,2));
 const failed=results.filter(x=>!x.passed);
 console.log('SUMMARY',JSON.stringify({passed:results.length-failed.length,failed:failed.length,errors:failed}));
 if(failed.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
