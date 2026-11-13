const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const origin=process.env.C02_QA_ORIGIN||'http://127.0.0.1:4272';
const oldOrigin=process.env.C02_QA_BEFORE||'https://chapchitra-motion-demo-o6uvzok47-samvrc.vercel.app';
const engineName=process.env.C02_QA_ENGINE||'chromium';
const engine=engineName==='webkit'?webkit:chromium;
const devices=process.env.C02_QA_DEVICE?[process.env.C02_QA_DEVICE]:['desktop','tablet'];
const out=path.resolve(__dirname,'../perf-results/c02-roller-correction',engineName);
fs.mkdirSync(out,{recursive:true});
const results=[];
const checkpoints=[['entrance',90],['quarter',45],['half',70],['three-quarter',70],['full-cover',155]];
async function capture(page,base,device,label){
 await page.goto(base+'/');
 await page.locator('.nav-center a[href="/shop/"]').waitFor({timeout:18000});
 await page.waitForFunction(()=>document.documentElement.dataset.c02Installed==='v2');
 await page.clock.pauseAt(Date.now());
 const start=await page.evaluate(()=>{
  document.querySelector('.nav-center a[href="/shop/"]').click();
  const node=document.querySelector('#c02-loader');
  return {overlays:document.querySelectorAll('#c02-loader').length,src:node?.querySelector('img')?.getAttribute('src')};
 });
 assert.equal(start.overlays,1);
 if(label==='after')assert.equal(start.src,'/assets/c02/roller-original.svg');
 let elapsed=0;
 for(const [name,dt] of checkpoints){
  await page.clock.runFor(dt);elapsed+=dt;
  await page.screenshot({path:path.join(out,device+'-'+label+'-'+name+'.png'),timeout:20000});
  const info=await page.evaluate(()=>{
   const ov=document.querySelector('#c02-loader'),r=ov?.querySelector('.c02-loader__roller'),img=r?.querySelector('img');
   return{phase:ov?.dataset.phase,display:r?getComputedStyle(r).display:null,loaded:img?.naturalWidth||0,
     src:img?.getAttribute('src'),transform:r?getComputedStyle(r).transform:null,
     filter:img?getComputedStyle(img).filter:null,blend:img?getComputedStyle(img).mixBlendMode:null,
     center:r?parseFloat(r.style.left):null,width:r?parseFloat(getComputedStyle(r).width):null};
  }).catch(error=>{
   if(name==='full-cover')return{phase:'cross-document-navigation',note:error.message};
   throw error;
  });
  if(label==='after'&&['quarter','half','three-quarter'].includes(name)){
   assert.equal(info.display,'block',name+' roller must be displayed');
   assert.ok(info.loaded>0,name+' original roller decoded');
   assert.equal(info.filter,'none',name+' should not recolor via filters');
   assert.equal(info.blend,'normal');
   const geometry=await page.evaluate(async()=>{
    const ink=(await import('/motion/c02/ink-shapes.mjs')).inkEdgeX;
    const overlay=document.getElementById('c02-loader');
    const roller=overlay.querySelector('.c02-loader__roller');
    const p=Number(overlay.dataset.progress);
    const size=parseFloat(getComputedStyle(roller).width);
    const center=Number.parseFloat(roller.style.left);
    const cylinderContact=center+(48.7199-850)/1700*size;
    const edge=ink(p,470,27)*innerWidth/1000;
    const matrix=new DOMMatrixReadOnly(getComputedStyle(roller).transform);
    const graphiteHandleRight=center+(1656.82-850)/1700*size;
    return {phase:p,delta:cylinderContact-(edge-2),direction:matrix.m21,
     handleOutside:graphiteHandleRight>edge+size*.4};
   });
   assert.ok(Math.abs(geometry.delta)<3,name+' cylinder/ink measured contact gap '+JSON.stringify(geometry));
   assert.ok(geometry.direction>.9&&geometry.handleOutside,name+' graphite handle must extend screen-right '+JSON.stringify(geometry));
  }
  results.push({engine:engineName,device,scene:label,name,ms:elapsed,status:'pass',...info});
 }
}
async function colorAudit(page,device){
 await page.goto(origin+'/');
 const colors=await page.evaluate(async()=>{
  const img=new Image();img.src='/assets/c02/roller-original.svg';await img.decode();
  const canvas=document.createElement('canvas');canvas.width=340;canvas.height=340;
  const cx=canvas.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0,340,340);
  const data=cx.getImageData(0,0,340,340).data;let green=0,black=0;
  for(let i=0;i<data.length;i+=4){
   if(data[i+3]<250)continue;
   if(data[i]===41&&data[i+1]===61&&data[i+2]===45)green++;
   if(data[i]===35&&data[i+1]===35&&data[i+2]===35)black++;
  }
  return{green,black,width:img.naturalWidth,height:img.naturalHeight};
 });
 assert.ok(colors.green>100&&colors.black>100,JSON.stringify(colors));
 assert.ok(colors.width>0,'SVG has a viewBox and rasterizes at the browser intrinsic size');
 results.push({engine:engineName,device,scene:'art audit',name:'original color pixels',status:'pass',...colors});
}
async function normalRecording(browser,device,viewport){
 const ctx=await browser.newContext({viewport,recordVideo:{dir:out,size:viewport}});
 const page=await ctx.newPage();
 try{
  await page.goto(origin+'/c02-review/');
  await page.locator('a[href="/shop/"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:20000});
  await page.waitForFunction(()=>!document.querySelector('#c02-loader'),null,{timeout:20000});
  await page.waitForTimeout(250);
  await page.goto(origin+'/c02-review/');
  await page.locator('a[href="/c02-review/slow/?delay=4500"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/c02-review/slow/',{timeout:18000});
  await page.waitForFunction(()=>document.querySelector('#c02-loader')?.dataset.phase==='loading',null,{timeout:10000});
  await page.screenshot({path:path.join(out,device+'-4p5s-covered.png')});
  await page.waitForFunction(()=>window.__c02DemoReady===true,null,{timeout:16000});
  await page.waitForFunction(()=>!document.querySelector('#c02-loader'),null,{timeout:16000});
  await page.screenshot({path:path.join(out,device+'-4p5s-revealed.png')});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(origin+'/c02-review/');
  await page.locator('a[href="/shop/"]').click({noWaitAfter:true});
  await page.waitForURL(u=>u.pathname==='/shop/',{timeout:15000});
  assert.equal(await page.locator('#c02-loader').count(),0);
  results.push({engine:engineName,device,scene:'video',name:'normal-speed; slow 4.5s; reduced motion',status:'pass'});
 }finally{
  await ctx.close();
  try{const src=await page.video()?.path();if(src)fs.renameSync(src,path.join(out,device+'-normal-speed.webm'))}catch(e){console.warn(e.message)}
 }
}
async function run(device){
 const viewport=device==='tablet'?{width:834,height:1112}:{width:1280,height:800};
 const browser=await engine.launch(engineName==='chromium'&&process.platform==='win32'?{channel:'chrome',headless:true}:{headless:true});
 const ctx=await browser.newContext({viewport});
 try{
  const beforePage=await ctx.newPage();await colorAudit(beforePage,device);
  await capture(beforePage,oldOrigin,device,'before');
  await beforePage.close();
  // Isolate the second capture: WebKit can finish a pending page navigation
  // even after time-controlled screenshots on the previous document.
  const afterPage=await ctx.newPage();
  await capture(afterPage,origin,device,'after');
  await afterPage.close();
  await normalRecording(browser,device,viewport);
 }catch(e){results.push({engine:engineName,device,scene:'suite',name:'failure',status:'fail',detail:String(e.stack||e).slice(0,850)})}
 finally{await ctx.close();await browser.close()}
}
(async()=>{for(const device of devices)await run(device);
 fs.writeFileSync(path.join(out,'visual-summary.json'),JSON.stringify(results,null,2));
 console.log('SUMMARY',JSON.stringify({passed:results.filter(r=>r.status==='pass').length,failed:results.filter(r=>r.status==='fail').length,failures:results.filter(r=>r.status==='fail')}));
 if(results.some(r=>r.status==='fail'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
