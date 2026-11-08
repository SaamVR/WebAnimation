const {chromium}=require('playwright'),sharp=require('sharp');
const fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4411/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/print-guide-touch');
fs.mkdirSync(OUT,{recursive:true});
const checks=[],failures=[];
const check=(name,ok,detail)=>{const x={name,ok:!!ok,detail};checks.push(x);if(!ok){failures.push(x);console.error('FAIL',name,JSON.stringify(detail).slice(0,850));}};
async function put(page,w,h){
 const buf=await sharp({create:{width:w,height:h,channels:4,background:'#ece51a'}}).png().toBuffer();
 await page.locator('#worktableFile').setInputFiles({name:'touch-editor.png',mimeType:'image/png',buffer:buf});
 await page.locator('.cc-worktable-print.has-art').waitFor({timeout:18000});
}
async function read(page){
 return page.evaluate(()=>{
  const stage=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
  const artwork=document.querySelector('.cc-worktable-print').getBoundingClientRect(),f=2048/stage.width;
  const toolbar=document.querySelector('.cc-worktable-editor-toolbar'),t=toolbar.getBoundingClientRect();
  return {x:(artwork.x-stage.x)*f,y:(artwork.y-stage.y)*f,width:artwork.width*f,height:artwork.height*f,
   toolbar:!toolbar.hidden,toolbarRect:t.toJSON(),
   mode:document.querySelector('.cc-worktable-print').classList.contains('is-resize-mode')?'resize':'move',
   guide:document.querySelector('.cc-worktable-print-guide').classList.contains('is-shown'),
   rotation:document.querySelector('.cc-worktable-print').dataset.rotation,
   adjustment:document.querySelector('#worktableArtScale').value,
   active:document.querySelector('.cc-worktable-print').classList.contains('is-edit-selected'),
   overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
}
async function touchDrag(cdp,box,deltaX,deltaY){
 const x=box.x+box.width/2,y=box.y+box.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:7}]});
 for(let t=1;t<=8;t++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
   touchPoints:[{x:x+deltaX*t/8,y:y+deltaY*t/8,id:7}]});
  await new Promise(resolve=>setTimeout(resolve,16));
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
async function run(browser,width,height){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,
  deviceScaleFactor:width===834?2:1,serviceWorkers:'block'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:85000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 await page.locator('.cc-worktable-choice[data-group=printSize][data-value=A3]').tap();
 check(width+' tap A3 shows guide before upload',(await read(page)).guide);
 await put(page,350,350);
 await page.locator('#worktableArtScale').fill('-35');
 const area=page.locator('.cc-worktable-drag');await area.scrollIntoViewIfNeeded();
 await area.tap();
 check(width+' touch selects artwork and opens toolbar',(await read(page)).toolbar);
 const before=await read(page);
 const box=await area.boundingBox();
 const cdp=await ctx.newCDPSession(page);
 await touchDrag(cdp,box,22,18);
 const after=await read(page);
 check(width+' true touch moves picture in both axes',
  after.x>before.x+2&&after.y>before.y+2,{before,after});
 check(width+' guide stays visible while selected',after.guide);
 await page.locator('.cc-worktable-tool[data-tool=resize]').tap();
 check(width+' resize mode activated and all 4 handles present',
  await page.locator('.cc-worktable-print.is-resize-mode .cc-worktable-corner-handle:visible').count()===4);
 await page.locator('.cc-worktable-corner-handle[data-corner=se]').scrollIntoViewIfNeeded();
 const handle=page.locator('.cc-worktable-corner-handle[data-corner=se]');
 const handleBox=await handle.boundingBox(),small=await read(page);
 await touchDrag(cdp,handleBox,18,17);
 const sized=await read(page);
 check(width+' real touch corner resize updates shared slider and artwork',
  Number(sized.adjustment)>Number(small.adjustment)&&sized.width>small.width,
  {small,sized});
 check(width+' floating editor fits viewport',sized.toolbarRect.left>=0&&sized.toolbarRect.right<=width+1,sized.toolbarRect);
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,'touch-'+width+'-resize.png'),animations:'disabled'});
 for(const angle of [90,180,270,0]){
  await page.locator('.cc-worktable-tool[data-tool=rotate]').tap();
  const state=await read(page);
  check(width+' tap Rotate => '+angle,state.rotation===String(angle),state.rotation);
 }
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,'touch-'+width+'-rotate.png'),animations:'disabled'});
 // Keyboard focus and Escape must dismiss but retain artwork.
 await page.locator('.cc-worktable-drag').focus();await page.keyboard.press('Escape');
 check(width+' Escape dismisses controls',!(await read(page)).toolbar);
 check(width+' uploaded art retained',await page.locator('.cc-worktable-print.has-art').count()===1);
 check(width+' no errors',errors.length===0,errors);
 check(width+' no horizontal overflow',!(await read(page)).overflow);
 await ctx.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{await run(browser,834,1112);await run(browser,390,844);}
 finally{await browser.close();}
 const report={url:URL,total:checks.length,passed:checks.filter(x=>x.ok).length,
  failed:failures.length,failures,checks};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
 console.log('TOUCH EDITOR QA',JSON.stringify({passed:report.passed,total:report.total,failed:report.failed,failures:report.failures},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('TOUCH QA CRASH',e);process.exitCode=3});
