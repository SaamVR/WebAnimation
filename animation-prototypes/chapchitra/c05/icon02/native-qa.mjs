import { chromium, webkit } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const root=process.cwd(), base='/animation-prototypes/chapchitra/c05/icon02/';
const server=http.createServer(async(req,res)=>{
 try{
  const urlPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const full=path.resolve(root+'.'+urlPath);
  if(!full.startsWith(root))throw new Error('invalid path');
  const data=await readFile(full);res.setHeader('Content-Type',full.endsWith('.js')?'text/javascript':full.endsWith('.json')?'application/json':full.endsWith('.svg')?'image/svg+xml':'text/html');res.end(data);
 }catch(e){res.statusCode=404;res.end('not found')}
});
await new Promise(resolve=>server.listen(8787,'127.0.0.1',resolve));
await fs.mkdir('native-qa-artifacts',{recursive:true});
let errors=0;
for(const [browserName,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1180,height:600},deviceScaleFactor:1,reducedMotion:'no-preference'});
  const jsErrors=[];page.on('pageerror',e=>jsErrors.push(e.message));
  await page.goto('http://127.0.0.1:8787'+base+'native-review.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#ready').dataset.ok!=='waiting',{timeout:25000});
  const state=await page.locator('#ready').getAttribute('data-ok');
  if(state!=='yes')throw new Error(browserName+' native player did not start: '+await page.locator('#ready').innerText());
  const source=PNG.sync.read(await page.locator('#static').screenshot());
  for(const [frame,label] of [[0,'start'],[50,'mid'],[90,'late'],[114,'final']]){
    await page.evaluate(f=>window.nativeInstance.goToAndStop(f,true),frame);
    await page.waitForTimeout(300);
    await page.locator('#native').screenshot({path:'native-qa-artifacts/'+browserName+'-'+label+'.png'});
  }
  const nativeFinal=PNG.sync.read(await fs.readFile('native-qa-artifacts/'+browserName+'-final.png'));
  let differences=0,mag=0;
  for(let i=0;i<source.data.length;i+=4){
    const d=Math.max(Math.abs(source.data[i]-nativeFinal.data[i]),Math.abs(source.data[i+1]-nativeFinal.data[i+1]),Math.abs(source.data[i+2]-nativeFinal.data[i+2]));
    if(d>44)differences++;
    mag+=d;
  }
  const frac=differences/(source.width*source.height);
  const mean=mag/(source.width*source.height);
  console.log(browserName,{finalChangedFraction:frac,meanChannelDiff:mean,jsErrors});
  if(jsErrors.length||frac>0.16){errors++;console.error(browserName+' final image may be wrong');}
  await browser.close();
}
await new Promise(resolve=>server.close(resolve));
if(errors)process.exit(1);
