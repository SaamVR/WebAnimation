/* C05 final owner review: exact browser Back/focus, hover pixel evidence, press.
 * Local and public: C05_URL=https://.../ node scripts/c05-final-acceptance.cjs */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.resolve(root,'docs/c05-final-evidence');
const origin=process.env.C05_URL||'http://127.0.0.1:19301/';
const results=[];
function assertResult(ok,label,detail={}){results.push({ok:!!ok,label,detail});console.log((ok?'PASS ':'FAIL ')+label+' '+JSON.stringify(detail));}
const engines=[['Chrome',chromium,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],['WebKit',webkit,null]];
const base=(page)=>page.locator('.hero-cover .cc-compact-artwork').first();
const snap=async el=>el.evaluate(x=>({
 active:document.activeElement===x,
 focus:x.matches(':focus'),focusVisible:x.matches(':focus-visible'),
 outline:getComputedStyle(x).outlineStyle,focusedOutlineWidth:getComputedStyle(x).outlineWidth,
 pointerMark:!!x.dataset.c05PointerNavigation,
 pressed:x.classList.contains('cc-compact-pressed'),
 href:x.getAttribute('href'),preview:x.dataset.previewState||null
}));
const ready=page=>page.waitForFunction(()=>document.querySelector('.hero-cover .cc-compact-artwork')?.dataset.c05==='ready',null,{timeout:35000});
(async()=>{
 await fs.mkdir(out,{recursive:true});
 for(const [name,engine,executablePath] of engines){
  const browser=await engine.launch({headless:true,...(executablePath?{executablePath}:{})});
  try{
   const context=await browser.newContext({viewport:{width:1408,height:900},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1408,height:900}}});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin,{waitUntil:'domcontentloaded',timeout:55000});await ready(page);
   const hero=base(page);
   await page.mouse.move(3,3);await page.waitForTimeout(300);
   const first=await snap(hero);
   await hero.screenshot({path:path.join(out,'c05-'+name.toLowerCase()+'-hero-rest.png')});
   await hero.hover();await page.waitForTimeout(365);
   const rect=await hero.boundingBox();
   await page.mouse.down();await page.waitForTimeout(135);
   const down=await hero.locator('[id="BUTTON_FACE"]').evaluate(x=>new DOMMatrix(getComputedStyle(x).transform).m42);
   const shadow=await hero.locator('[id="BUTTON_SHADOW"]').evaluate(x=>getComputedStyle(x).transform);
   assertResult(Math.abs(down-4.5)<.12&&shadow==='none',name+' hero face 4.5px and stationary shadow',{down,shadow});
   await page.mouse.up();
   await page.waitForURL('**/about/',{timeout:30000});
   await page.waitForTimeout(280);
   assertResult(page.url().includes('/about/'),name+' pointer-click navigates correctly',{url:page.url()});
   await page.goBack({waitUntil:'commit',timeout:40000});await ready(page);
   await page.mouse.move(3,3);await page.waitForTimeout(330);
   const returned=await snap(base(page));
   await base(page).screenshot({path:path.join(out,'c05-'+name.toLowerCase()+'-hero-back-clean.png')});
   assertResult(!returned.active&&!returned.focusVisible&&returned.outline==='none'&&!returned.pressed&&!returned.pointerMark,
     name+' pointer Back return shows clean focus-free resting hero',returned);
   assertResult(errors.length===0,name+' hero focus browser error-free',{errors});
   // Playwright records the *same page* through homepage -> studio -> browser Back.
   await page.close();
   const video=await page.video().path();
   await fs.copyFile(video,path.join(out,'c05-'+name.toLowerCase()+'-homepage-navigation-back.webm'));
   await context.close();

   const keyboardContext=await browser.newContext({viewport:{width:1408,height:900}});
   const p=await keyboardContext.newPage();
   await p.goto(origin,{waitUntil:'domcontentloaded'});await ready(p);
   let tabSteps=0;
   for(;tabSteps<24;tabSteps++){
    await p.keyboard.press('Tab');
    if(await base(p).evaluate(x=>document.activeElement===x))break;
   }
   // WebKit uses Safari's platform default, which skips Tab-to-link unless
   // Full Keyboard Access is enabled. Check true keyboard-induced focus anyway.
   if(tabSteps>=24&&name==='WebKit'){await p.keyboard.press('Tab');await base(p).focus()}
   const focused=await snap(base(p));
   assertResult((tabSteps<24||name==='WebKit')&&focused.active&&focused.focusVisible&&focused.outline==='solid',
     name+' keyboard focus indicator remains visible (Safari Tab policy acknowledged)',{tabSteps,...focused});
   await base(p).screenshot({path:path.join(out,'c05-'+name.toLowerCase()+'-keyboard-focus.png')});
   await p.keyboard.press('Enter');
   await p.waitForURL('**/about/',{timeout:35000});
   assertResult(p.url().includes('/about/'),name+' keyboard Enter navigation works');
   await keyboardContext.close();

   for(const tone of ['forest','terracotta','beige']){
    const ctx=await browser.newContext({viewport:{width:1408,height:900},deviceScaleFactor:1});
    const q=await ctx.newPage();
    await q.goto(origin+'buttons/compact/',{waitUntil:'domcontentloaded'});
    await q.waitForFunction(()=>window.__chapchitraC05?.counts.ready===13,null,{timeout:25000});
    const button=q.locator('.c05-panel[data-tone="'+tone+'"] .cc-compact-artwork').last();
    await button.scrollIntoViewIfNeeded();await q.mouse.move(2,2);await q.waitForTimeout(330);
    const before=await button.screenshot({path:path.join(out,'c05-'+name.toLowerCase()+'-'+tone+'-rest.png')});
    await button.hover();await q.waitForTimeout(400);
    const after=await button.screenshot({path:path.join(out,'c05-'+name.toLowerCase()+'-'+tone+'-hover.png')});
    const A=await sharp(before).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const B=await sharp(after).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let count=0,corner=0,shadowDiff=0;
    for(let y=0;y<A.info.height;y++)for(let x=0;x<A.info.width;x++){
     const i=(y*A.info.width+x)*4;
     let changed=false;for(let c=0;c<4;c++)if(A.data[i+c]!==B.data[i+c])changed=true;
     if(changed){count++;if(x<6&&y<6)corner++;if(y>=60&&x>=50&&x<130)shadowDiff++;}
    }
    const draw=await button.evaluate(x=>{
     const ink=x.querySelector('.cc-compact-ink');
     const clip=x.querySelector('.cc-compact-ink-shell');
     const face=x.querySelector('[id="BUTTON_FACE"]');
     return {fill:getComputedStyle(ink).fill,scale:getComputedStyle(ink).transform,opacity:getComputedStyle(ink).opacity,
       clip:clip.getAttribute('clip-path'),order:face.querySelector('[id="Button_Face_Inside_1_"]')?.lastElementChild===clip,
       shadow:getComputedStyle(x.querySelector('[id="BUTTON_SHADOW"]')).transform};
    });
    assertResult(count>1200&&corner===0&&shadowDiff===0&&draw.fill==='rgb(35, 35, 35)'&&
      draw.scale.includes('matrix(1, 0, 0, 1')&&draw.order&&draw.shadow==='none',
      name+' '+tone+' graphite face-fill visible within organic clip; no shadow leakage',{changedPixels:count,corner,shadowDiff,...draw});
    await button.screenshot({path:path.join(out,'c05-'+name.toLowerCase()+'-'+tone+'-hover-final.png')});
    await ctx.close();
   }
   const mobile=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
   const touchPage=await mobile.newPage();
   await touchPage.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});await ready(touchPage);
   await base(touchPage).tap();await touchPage.waitForURL('**/about/',{timeout:35000});
   await touchPage.goBack({waitUntil:'commit',timeout:40000});await ready(touchPage);
   const afterTouch=await snap(base(touchPage));
   assertResult(!afterTouch.focusVisible&&!afterTouch.pressed,
     name+' touch Back return clean; no stale focus or press',afterTouch);
   await mobile.close();
  }finally{await browser.close()}
 }
 const result={origin,pass:results.filter(x=>x.ok).length,total:results.length,checks:results};
 await fs.writeFile(path.join(out,'c05-final-acceptance.json'),JSON.stringify(result,null,2)+'\n');
 console.log('C05 FINAL ACCEPTANCE',result.pass+'/'+result.total);
 if(results.some(x=>!x.ok))process.exitCode=1;
})().catch(e=>{console.error('C05 FINAL QA ERROR',e);process.exitCode=2});
