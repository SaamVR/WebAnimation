const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4427/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/print-guide-touch');
fs.mkdirSync(OUT,{recursive:true});
const results=[],errors=[];
const check=(name,ok,detail)=>{
 const test={name,pass:!!ok,detail};results.push(test);
 if(!ok){errors.push(test);console.error('FAIL',name,detail)}
};
async function stageInfo(page){
 return page.evaluate(()=>{
  const g=document.querySelector('.cc-worktable-paper-guide').getBoundingClientRect();
  const a=document.querySelector('.cc-worktable-print').getBoundingClientRect();
  const t=document.querySelector('.cc-worktable-art-tools').getBoundingClientRect();
  return {guide:[g.width,g.height],art:[a.left,a.top,a.width,a.height],
   left:document.querySelector('.cc-worktable-print').style.left,
   top:document.querySelector('.cc-worktable-print').style.top,
   toolbar:[t.left,t.right],rotation:document.querySelector('.cc-worktable-print').dataset.rotation,
   scale:document.querySelector('#worktableArtScale').value,
   selected:!document.querySelector('.cc-worktable-art-tools').hidden};
 });
}
async function run(width,height){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/snap/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
 const p=await c.newPage(),jsErrors=[];p.on('pageerror',e=>jsErrors.push(e.message));
 await p.goto(URL,{waitUntil:'domcontentloaded'});
 await p.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:80000});
 const png=await sharp({create:{width:400,height:550,channels:4,background:'#f7de1e'}}).png().toBuffer();
 await p.locator('#worktableFile').setInputFiles({name:'touch-art.png',mimeType:'image/png',buffer:png});
 await p.locator('.cc-worktable-print.has-art').waitFor();
 const edit=p.locator('.cc-worktable-drag');
 await edit.scrollIntoViewIfNeeded();
 await edit.tap();
 check(width+' touch selects art',!!(await stageInfo(p)).selected);
 const cdp=await c.newCDPSession(p);
 const drag=async(selector,dx,dy,id)=>{
  const el=p.locator(selector);
  await el.scrollIntoViewIfNeeded();
  const b=await el.boundingBox();
  const x=b.x+b.width/2,y=b.y+b.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id,x,y}]});
  for(let n=1;n<=6;n++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id,x:x+dx*n/6,y:y+dy*n/6}]});
   await p.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 const before=await stageInfo(p);
 await drag('.cc-worktable-drag',12,16,31);
 const after=await stageInfo(p);
 check(width+' touch Move changes position',before.left!==after.left||before.top!==after.top,{before,after});
 await p.locator('.cc-worktable-tool[data-tool=resize]').tap();
 const handles=await p.locator('.cc-worktable-corner-handle:not([hidden])').count();
 check(width+' four touch handles',handles===4);
 const sizeBefore=Number((await stageInfo(p)).scale);
 await drag('.cc-worktable-corner-handle[data-corner=se]',19,20,32);
 const sizeAfter=Number((await stageInfo(p)).scale);
 check(width+' touch corner resize changes size',sizeAfter>sizeBefore,{sizeBefore,sizeAfter});
 await p.locator('.cc-worktable-tool[data-tool=rotate]').tap();
 check(width+' touch rotation 90',(await stageInfo(p)).rotation==='90');
 await p.locator('.cc-worktable-tool[data-tool=rotate]').tap();
 await p.locator('.cc-worktable-tool[data-tool=rotate]').tap();
 await p.locator('.cc-worktable-tool[data-tool=rotate]').tap();
 check(width+' 360° returns 0',(await stageInfo(p)).rotation==='0');
 await p.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,'touch-editor-'+width+'.png'),animations:'disabled'});
 check(width+' no JS errors',jsErrors.length===0,jsErrors);
 await c.close();await browser.close();
}
(async()=>{
 await run(834,1112);await run(390,844);
 const report={passed:results.length-errors.length,failed:errors.length,total:results.length,errors,results};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,errors},null,2));
 if(errors.length)process.exitCode=2;
})().catch(e=>{console.error('TOUCH TEST CRASH',e.stack);process.exitCode=3});
