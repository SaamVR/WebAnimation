const {chromium}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const out=path.resolve('perf-results/artwork-touch-final');
fs.mkdirSync(out,{recursive:true});
const checks=[],failures=[];
function check(name,ok,detail){const x={name,passed:!!ok,detail};checks.push(x);if(!ok)failures.push(x)}
async function run(browser,width,height){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:width===834?2:1});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4399/artists-edit/',{waitUntil:'domcontentloaded'});
 await p.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:75000});
 const img=await sharp({create:{width:280,height:396,channels:4,background:'#fac817'}}).png().toBuffer();
 await p.locator('#worktableFile').setInputFiles({name:'mobile.png',mimeType:'image/png',buffer:img});
 await p.locator('.cc-worktable-print.has-art').waitFor({timeout:15000});
 const drag=p.locator('.cc-worktable-drag');await drag.scrollIntoViewIfNeeded();
 const get=()=>p.locator('.cc-worktable-print').evaluate(e=>{
  const stage=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
  const r=e.getBoundingClientRect(),factor=2048/stage.width;
  return {x:(r.x-stage.x)*factor,y:(r.y-stage.y)*factor,active:e.classList.contains('is-manipulating'),
   drag:e.querySelector('.cc-worktable-drag').classList.contains('is-dragging')};
 });
 const before=await get();
 const box=await drag.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const cdp=await ctx.newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:11}]});
 const active=await get();
 check(width+' touch pointer starts capture and temporary outline',active.active&&active.drag,active);
 for(let n=1;n<=8;n++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+80*n/8,y:y+75*n/8,id:11}]});
  await p.waitForTimeout(12);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await get();
 check(width+' touch moves artwork in both axes',after.x>before.x+2&&after.y>before.y+2,{before,after});
 check(width+' pointer capture releases after touch',!after.drag,after);
 await p.locator('.cc-worktable-stage').screenshot({path:path.join(out,'touch-'+width+'.png'),animations:'disabled'});
 await p.waitForTimeout(950);
 check(width+' temporary outline disappears after touch',!(await get()).active);
 check(width+' original image stays on garment',await p.locator('.cc-worktable-print.has-art').count()===1);
 check(width+' no errors or overflow',errors.length===0&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),errors);
 await ctx.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 await run(browser,834,1112);await run(browser,390,844);
 await browser.close();
 const result={passed:checks.filter(c=>c.passed).length,failed:failures.length,total:checks.length,failures,checks};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));
 console.log('TOUCH QA',JSON.stringify(result));
 if(failures.length)process.exitCode=2;
})().catch(e=>{console.error('TOUCH QA CRASH',e.stack||String(e));process.exitCode=3});
