// C02 original owner PNG: full-stroke browser comparison + real navigation QA.
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
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2');
 const started=Date.now();
 await page.locator('a[href="/c02-review/slow/?delay='+delay+'"]').click({noWaitAfter:true});
 let observed=false;
 const deadline=Date.now()+Math.min(delay,1800);
 while(Date.now()<deadline&&!observed){
  const state=await page.evaluate(()=>{
   const o=document.getElementById('c02-loader');
   const img=o?.querySelector('.c02-loader__ink-asset');
   const roller=o?.querySelector('.c02-loader__roller img');
   const data={
    p:Number(o?.dataset.progress),inkType:o?.dataset.inkAsset,
    source:img?.getAttribute('src'),originalSize:[img?.naturalWidth,img?.naturalHeight],
    roller:roller?.getAttribute('src'),natural:[roller?.naturalWidth,roller?.naturalHeight],
    style:img?getComputedStyle(img).display:null,
    width:img?parseFloat(img.style.width):0,height:img?parseFloat(img.style.height):0,
    contact:Number(o?.dataset.inkContactX),viewport:innerWidth
   };
   return data;
  }).catch(()=>({}));
  if(state.inkType==='original-png'&&state.p>.05&&state.p<.99){
   observed=true;
   record(device,delay+'ms exact source',state.source==='/assets/c02/Ink_swipe_1.png'
    &&state.originalSize[0]===2048&&state.originalSize[1]===1152
    &&state.roller==='/assets/c02/roller-original.svg',state);
   record(device,delay+'ms aspect ratio',Math.abs(state.width/state.height-2048/1152)<.00002,state);
   record(device,delay+'ms moving contact',Number.isFinite(state.contact)&&state.contact>-state.viewport,state);
   if(delay>=5000)
    await page.screenshot({path:path.join(output,device+'-5s-original-png-roller.png')});
  }else await page.waitForTimeout(45);
 }
 if(delay>=5000)record(device,'5s visibly textured cover',observed,{delay,observed});
 await page.waitForURL(u=>u.pathname==='/c02-review/slow/',{timeout:18000});
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
async function compare(page,device){
 await page.goto(origin+'/c02-review/asset-compare/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#after image')?.getAttribute('href')
  ==='/assets/c02/Ink_swipe_1.png');
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
    height:Number(img?.getAttribute('height')),beforeLength:before?.getAttribute('d')?.length};
  });
  record(device,'side-by-side at '+progress/10+'%',rect.progress===String(progress)
   &&rect.source==='/assets/c02/Ink_swipe_1.png'&&
   Math.abs(rect.width/rect.height-2048/1152)<.00002,rect);
  await page.screenshot({path:path.join(output,device+'-compare-'+progress/10+'pct.png'),fullPage:true});
 }
}
async function main(){
 const devices=process.env.C02_QA_DEVICE
  ?[[process.env.C02_QA_DEVICE,process.env.C02_QA_DEVICE==='desktop'?1280:834,
    process.env.C02_QA_DEVICE==='desktop'?800:1112]]
  :engineName==='webkit'?[['ipad',834,1112],['mobile',390,844]]:[['desktop',1280,800],['mobile',390,844]];
 for(const [device,width,height] of devices){
  const browser=await engine.launch(engineName==='chromium'&&process.platform==='win32'
   ?{channel:'chrome',headless:true}:{headless:true});
  const context=await browser.newContext({viewport:{width,height},hasTouch:device!=='desktop',
   recordVideo:{dir:output,size:{width,height}}});
  const page=await context.newPage();
  try{
   await compare(page,device);
   for(const delay of [1000,5000])await step(page,device,delay);
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
