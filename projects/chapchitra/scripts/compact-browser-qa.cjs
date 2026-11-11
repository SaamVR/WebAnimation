/* COMPACT independent source and browser behavior QA.
   Real Chromium + WebKit play the exact owner-supplied SVG paths. */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.resolve(root,'docs/compact-final-evidence');
const origin=process.env.COMPACT_BUTTON_URL||'http://127.0.0.1:19301/';
const tones={
 forest:{st5:'rgb(23, 36, 25)',st7:'rgb(99, 117, 101)',st8:'rgb(41, 61, 45)',st9:'rgb(216, 206, 194)',st10:'rgb(35, 35, 35)'},
 terracotta:{st5:'rgb(31, 34, 22)',st7:'rgb(110, 82, 63)',st8:'rgb(138, 80, 59)',st9:'rgb(216, 206, 194)',st10:'rgb(35, 35, 35)'},
 beige:{st5:'rgb(138, 80, 59)',st7:'rgb(99, 117, 101)',st8:'rgb(166, 162, 155)',st9:'rgb(228, 227, 222)',st10:'rgb(35, 35, 35)'}
};
const checks=[],errors=[];
const check=(ok,label,data={})=>{
 checks.push({ok:!!ok,label,data});
 console.log((ok?'PASS ':'FAIL ')+label+' '+JSON.stringify(data));
};
const get=async(p,selector)=>p.locator(selector).first().evaluate(e=>({
 cls:e.className,
 fill:Object.fromEntries(['st5','st7','st8','st9','st10'].map(c=>[c,getComputedStyle(e.querySelector('.'+c)).fill])),
 face:getComputedStyle(e.querySelector('[id="BUTTON_FACE"]')).transform,
 shadow:getComputedStyle(e.querySelector('[id="BUTTON_SHADOW"]')).transform,
 paths:e.querySelectorAll('svg path').length,polygons:e.querySelectorAll('svg polygon').length,
 clip:e.querySelector('.cc-compact-ink-shell')?.getAttribute('clip-path'),
 rect:e.getBoundingClientRect().toJSON()
}));
const matrixY=transform=>transform==='none'?0:(parseFloat(transform.match(/matrix\([^)]*?,\s*([\d.-]+)\)/)?.[1])||0);
(async()=>{
 await fs.mkdir(out,{recursive:true});
 for(const [name,engine,executablePath] of [
   ['Chrome',chromium,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
   ['WebKit',webkit,null]
 ]){
  const browser=await engine.launch({headless:true,...(executablePath?{executablePath}:{})});
  try{
   for(const width of [1408,834,430,320]){
    const context=await browser.newContext({viewport:{width,height:920},deviceScaleFactor:1});
    const page=await context.newPage();
    const jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(e.message));
    const response=await page.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded',timeout:50000});
    await page.waitForFunction(()=>window.__chapchitraCompactButtons?.counts.ready===13,null,{timeout:20000});
    const global=await page.evaluate(()=>({
     counts:window.__chapchitraCompactButtons.counts,
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     activeFiles:[...new Set([...document.querySelectorAll('.cc-compact-artwork img')].map(x=>x.getAttribute('src')))],
     clipCount:document.querySelectorAll('.cc-compact-artwork .cc-compact-ink-shell[clip-path]').length,
     long:document.querySelectorAll('.cc-sketch--long .cc-pill-face').length
    }));
    check(response.status()===200&&global.counts.ready===13&&!global.overflow&&global.clipCount===13&&global.long===1&&global.counts.fallback===0,
      name+' '+width+' isolated preview SVGs, clips, long controls, layout',global);
    for(const [tone,swatches] of Object.entries(tones)){
     const selector='.compact-panel[data-tone="'+tone+'"] .cc-compact-artwork';
     const state=await get(page,selector);
     check(Object.entries(swatches).every(([k,v])=>state.fill[k]===v)&&state.paths===115&&state.polygons===10&&
       state.clip?.startsWith('url(#compact-ink-clip-'),
       name+' '+width+' '+tone+' exact SVG paints, detailed original vectors',state);
    }
    const inactive=jsErrors.filter(x=>!x.startsWith('ResizeObserver loop completed with undelivered notifications'));
    check(inactive.length===0,name+' '+width+' no application JS exceptions',inactive);
    if(width===1408){
     const interactive=page.locator('.compact-panel[data-tone="forest"] .cc-compact-artwork').last();
     await interactive.scrollIntoViewIfNeeded();
     const face=interactive.locator('[id="BUTTON_FACE"]');
     const shadow=interactive.locator('[id="BUTTON_SHADOW"]');
     const restY=await face.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m42);
     const shadowRest=await shadow.evaluate(e=>getComputedStyle(e).transform);
     const artBox=await interactive.boundingBox();
     await page.mouse.move(artBox.x+artBox.width/2,artBox.y+artBox.height/2);
     await page.waitForTimeout(365);
     const hovered=await interactive.locator('.cc-compact-ink').evaluate(e=>getComputedStyle(e).transform);
     check(hovered.includes('matrix(1, 0, 0, 1'),name+' hover ink wipe completes left-to-right', {hovered});
     await page.mouse.down();
     await page.waitForTimeout(150);
     const pressY=await face.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m42);
     const shadowDown=await shadow.evaluate(e=>getComputedStyle(e).transform);
     const pressing=await interactive.evaluate(e=>e.classList.contains('cc-compact-pressed'));
     check(pressing&&Math.abs(pressY-restY-4.5)<.15&&shadowRest===shadowDown,
       name+' physical press only translates SVG face 4.5px; shadow remains fixed',{restY,pressY,shadowRest,shadowDown});
     await page.mouse.move(2,700);await page.mouse.up();await page.waitForTimeout(255);
     const released=await face.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).m42);
     check(Math.abs(released-restY)<.15&&!(await interactive.evaluate(e=>e.classList.contains('cc-compact-pressed'))),
       name+' pointer leaving outside cancels press',{released,restY});
     await interactive.focus();
     await page.keyboard.down('Space');
     const keyboard=await interactive.evaluate(e=>e.classList.contains('cc-compact-pressed'));
     await page.keyboard.up('Space');
     check(keyboard&&!(await interactive.evaluate(e=>e.classList.contains('cc-compact-pressed'))),
       name+' keyboard Space press and release works without stuck state');
     await page.locator('.compact-panel[data-tone="forest"]').screenshot({path:path.join(out,'compact-'+name.toLowerCase()+'-press-green.png')});
     await page.locator('.compact-panel[data-tone="terracotta"]').screenshot({path:path.join(out,'compact-'+name.toLowerCase()+'-terracotta.png')});
     await page.locator('.compact-panel[data-tone="beige"]').screenshot({path:path.join(out,'compact-'+name.toLowerCase()+'-neutral.png')});
    }
    if(width===430)await page.screenshot({path:path.join(out,'compact-'+name.toLowerCase()+'-mobile.png'),fullPage:true});
    await context.close();
   }
   const reduced=await browser.newContext({viewport:{width:430,height:900},reducedMotion:'reduce'});
   const p=await reduced.newPage();
   await p.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded'});
   await p.waitForFunction(()=>window.__chapchitraCompactButtons?.counts.ready===13,null,{timeout:15000});
   const styles=await p.locator('.cc-compact-artwork').first().evaluate(e=>({
    faceTransition:getComputedStyle(e.querySelector('[id="BUTTON_FACE"]')).transitionDuration,
    inkTransition:getComputedStyle(e.querySelector('.cc-compact-ink')).transitionDuration
   }));
   check(styles.faceTransition==='0s'&&styles.inkTransition==='0s',name+' reduced-motion no timed press or ink transitions',styles);
   await reduced.close();
  }finally{await browser.close()}
 }
 // Real mobile touch sequence including pointer cancel and click dispatch.
 const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
 try{
  const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const p=await context.newPage();
  await p.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.__chapchitraCompactButtons?.counts.ready===13,null,{timeout:15000});
  const tap=p.locator('.compact-panel[data-tone="terracotta"] .cc-compact-artwork').last();
  await tap.dispatchEvent('pointerdown',{button:0,pointerType:'touch'});
  await p.waitForTimeout(120);
  check(await tap.evaluate(e=>e.classList.contains('cc-compact-pressed')),'Touch press moves the face');
  await tap.dispatchEvent('pointercancel',{pointerType:'touch'});
  check(!(await tap.evaluate(e=>e.classList.contains('cc-compact-pressed'))),'Touch pointercancel releases immediately');
  await tap.tap();
  const status=await p.locator('#compactResponse').textContent();
  check(status.includes('terracotta interactive'),'Real mobile tap retains native click action',{status});
  await context.close();
 }finally{await browser.close()}
 const file=path.join(out,'compact-browser-qa.json');
 await fs.writeFile(file,JSON.stringify({origin,checks,passed:checks.filter(c=>c.ok).length,total:checks.length},null,2)+'\n');
 console.log('COMPACT BROWSER QA',checks.filter(x=>x.ok).length+'/'+checks.length);
 if(checks.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error('COMPACT QA ERROR',e);process.exitCode=2});
