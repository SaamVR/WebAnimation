const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4411/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/print-guide-keyboard');
fs.mkdirSync(OUT,{recursive:true});
const failures=[],checks=[];
const check=(name,ok,extra)=>{let x={name,ok:!!ok,extra};checks.push(x);if(!ok)failures.push(x);};
async function run(engine,label){
 const browser=await engine.launch({headless:true,...(engine===chromium?{executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}:{})});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:75000});
 const img=await require('sharp')({create:{width:400,height:540,channels:4,background:'#e7d529'}}).png().toBuffer();
 await page.locator('#worktableFile').setInputFiles({name:'test.png',mimeType:'image/png',buffer:img});
 await page.locator('.cc-worktable-print.has-art').waitFor({timeout:18000});
 const art=page.locator('.cc-worktable-drag');
 await art.scrollIntoViewIfNeeded();
 await art.focus();
 await page.keyboard.press('Enter');
 check(label+' Enter selects artwork',!(await page.locator('.cc-worktable-editor-toolbar').evaluate(e=>e.hidden)));
 check(label+' keyboard focus remains available',await art.evaluate(e=>document.activeElement===e));
 await page.keyboard.press('Escape');
 check(label+' Escape dismisses toolbar',await page.locator('.cc-worktable-editor-toolbar').evaluate(e=>e.hidden));
 await art.focus();await page.keyboard.press('Space');
 check(label+' Space selects artwork',!(await page.locator('.cc-worktable-editor-toolbar').evaluate(e=>e.hidden)));
 await page.locator('.cc-worktable-tool[data-tool=resize]').focus();
 await page.keyboard.press('Enter');
 check(label+' keyboard activates resize',
  await page.locator('.cc-worktable-print.is-resize-mode .cc-worktable-corner-handle:visible').count()===4);
 const h=page.locator('.cc-worktable-corner-handle[data-corner=se]');
 await h.focus();const before=Number(await page.locator('#worktableArtScale').inputValue());
 await page.keyboard.press('ArrowUp');
 check(label+' corner arrow resizes and synchronizes slider',
  Number(await page.locator('#worktableArtScale').inputValue())>before,{before});
 await page.locator('.cc-worktable-tool[data-tool=rotate]').focus();
 await page.keyboard.press('Enter');
 check(label+' keyboard rotate advances exact 90°',await page.locator('.cc-worktable-print').getAttribute('data-rotation')==='90');
 check(label+' rotate aria-label is in sync',(await page.locator('.cc-worktable-tool[data-tool=rotate]').getAttribute('aria-label')).includes('current 90 degrees'));
 check(label+' no JS errors',errors.length===0,errors);
 await page.close();
 }finally{await browser.close();}
}
(async()=>{
 await run(chromium,'Chrome');
 await run(webkit,'WebKit');
 const report={url:URL,total:checks.length,passed:checks.filter(x=>x.ok).length,failed:failures.length,failures,checks};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
 console.log('KEYBOARD QA',JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures}));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('KEYBOARD CRASH',e);process.exitCode=3});
