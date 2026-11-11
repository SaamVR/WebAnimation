/* LONG owner acceptance — genuine Chrome/WebKit rendered SVG tests and recordings.
 * Run with candidate preview at :4173 and preserved before-source at :4174.
 * NO modification or merge of either project branch.
 */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const {readFile,writeFile,mkdir,copyFile}=require('node:fs/promises');
const {resolve}=require('node:path');
const out=resolve(__dirname,'../perf-results/long-final');
const current=process.env.LONG_BUTTON_URL||'http://127.0.0.1:4173';
const before=process.env.LONG_BUTTON_BEFORE_URL||'http://127.0.0.1:4174';
const colors={
 forest:{st0:'rgb(23, 36, 25)',st1:'rgb(216, 206, 194)',st2:'rgb(41, 61, 45)',st3:'rgb(35, 35, 35)'},
 terracotta:{st0:'rgb(31, 34, 22)',st1:'rgb(216, 206, 194)',st2:'rgb(138, 80, 59)',st3:'rgb(35, 35, 35)'},
 beige:{st0:'rgb(138, 80, 59)',st1:'rgb(228, 227, 222)',st2:'rgb(166, 162, 155)',st3:'rgb(35, 35, 35)'}
};
const evidence=[];
const requireCheck=(ok,label,extra={})=>{
 evidence.push({ok:!!ok,label,extra});
 console.log((ok?'PASS ':'FAIL ')+label+' '+JSON.stringify(extra));
 if(!ok)throw Error('LONG QA failed: '+label);
};
const ready=page=>page.waitForFunction(()=>window.__chapchitraLongButtons?.counts.ready>=3,null,{timeout:30000});
const transform=async(loc)=>loc.evaluate(el=>getComputedStyle(el).transform);
const yTransform=async(loc)=>loc.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42);
const pixels=async(a,b)=>{
 const A=await sharp(a).raw().toBuffer({resolveWithObject:true});
 const B=await sharp(b).raw().toBuffer({resolveWithObject:true});
 if(A.info.width!==B.info.width||A.info.height!==B.info.height)
  return {diff:-1,dimensions:[A.info,B.info]};
 let diff=0,corner=0;
 for(let i=0;i<A.data.length;i++)if(A.data[i]!==B.data[i]){
  diff++;
  const pixel=Math.floor(i/A.info.channels),x=pixel%A.info.width,y=Math.floor(pixel/A.info.width);
  if(x<6&&y<6)corner++;
 }
 return {diff,corner,width:A.info.width,height:A.info.height};
};
(async()=>{
 await mkdir(out,{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [1408,834,430,320]){
    const ctx=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:1});
    const page=await ctx.newPage(),errs=[];
    page.on('pageerror',e=>errs.push(e.message));
    const response=await page.goto(current+'/buttons/long/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__chapchitraLongButtons?.counts.ready===13,null,{timeout:30000});
    const global=await page.evaluate(()=>({
     total:window.__chapchitraLongButtons.counts.total,ready:window.__chapchitraLongButtons.counts.ready,
     fallback:window.__chapchitraLongButtons.counts.fallback,
     over:document.documentElement.scrollWidth>innerWidth+1,
     compacts:document.querySelectorAll('.cc-compact-artwork').length
    }));
    requireCheck(response.status()===200&&global.total===13&&global.ready===13&&global.fallback===0&&!global.over&&global.compacts===1,
      name+' '+width+' LONG and COMPACT coexist without overflow',global);
    for(const [tone,paint] of Object.entries(colors)){
     const button=page.locator('.long-panel[data-tone="'+tone+'"] .cc-long-artwork').first();
     const state=await button.evaluate(el=>({
      colors:Object.fromEntries(['st0','st1','st2','st3'].map(cls=>[cls,getComputedStyle(el.querySelector('svg .'+cls)).fill])),
      face:!!el.querySelector('svg #BUTTON_FACE'),shadow:!!el.querySelector('svg #BUTTON_SHADOW'),
      src:el.querySelector('svg').getAttribute('viewBox'),
      paths:el.querySelectorAll('svg path').length,
      polygons:el.querySelectorAll('svg polygon').length,
      clip:el.querySelector('.cc-long-ink-shell')?.getAttribute('clip-path')
     }));
     requireCheck(Object.entries(paint).every(([key,value])=>state.colors[key]===value)&&
        state.face&&state.shadow&&state.src==='0 0 320 54'&&state.paths===427&&state.polygons===32&&
        /^url\(#long-face-ink-\d+\)$/.test(state.clip),
        name+' '+width+' '+tone+' original shapes + final palette',state);
    }
    requireCheck(errs.length===0,name+' '+width+' JS errors',errs);
    if(width===1408){
     for(const tone of Object.keys(colors)){
      const box=page.locator('.long-panel[data-tone="'+tone+'"]');
      const button=box.locator('.cc-long-artwork').last();
      await button.scrollIntoViewIfNeeded();await page.mouse.move(5,5);await page.waitForTimeout(375);
      const rest=await button.screenshot({animations:'disabled'});
      await button.hover();await page.waitForTimeout(380);
      const hover=await button.screenshot();
      const comparison=await pixels(rest,hover);
      const fill=await button.locator('.cc-long-ink-graphite').evaluate(el=>({
       transform:getComputedStyle(el).transform,paint:getComputedStyle(el).fill
      }));
      requireCheck(comparison.diff>2500&&comparison.corner===0&&fill.paint==='rgb(35, 35, 35)'&&fill.transform.includes('matrix(1, 0, 0, 1'),
       name+' '+tone+' Graphite ink changes actual face with no corner leak',{comparison,fill});
      await box.screenshot({path:resolve(out,name+'-'+tone+'-hover.png')});
      await page.mouse.move(4,4);await page.waitForTimeout(380);
      const face=button.locator('#BUTTON_FACE'),shadow=button.locator('#BUTTON_SHADOW');
      const rect=await button.boundingBox();
      await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
      await page.mouse.down();await page.waitForTimeout(120);
      requireCheck(Math.abs((await yTransform(face))-4.5)<.15&&(await transform(shadow))==='none',
       name+' '+tone+' physical face only press 4.5px');
      await page.mouse.move(1,800);await page.mouse.up();await page.waitForTimeout(260);
      requireCheck(Math.abs(await yTransform(face))<.15,name+' '+tone+' release outside clears press');
     }
    }
    await ctx.close();
   }
   // Original Compact pixels must match a build of the unchanged 32e6
   // baseline, in the SAME browser/viewport; do not compare cross-platform PNGs.
   for(const width of [1408,430]){
    const ctx=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await ctx.newPage();
    await page.goto(current+'/buttons/compact/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__chapchitraCompactButtons?.counts.ready===13);
    for(const tone of Object.keys(colors)){
     const item=page.locator('[data-tone="'+tone+'"] .cc-compact-artwork').first();
     const candidate=await item.screenshot({animations:'disabled'});
     const old=await ctx.newPage();
     await old.goto(before+'/buttons/compact/',{waitUntil:'domcontentloaded'});
     await old.waitForFunction(()=>document.querySelectorAll('.cc-compact-artwork svg').length===13);
     const baseline=await old.locator('[data-tone="'+tone+'"] .cc-compact-artwork').first().screenshot({animations:'disabled'});
     const comp=await pixels(candidate,baseline);
     requireCheck(comp.diff===0,name+' '+width+' '+tone+' COMPACT before/after PIXEL-IDENTICAL',comp);
     if(name==='chromium'&&tone==='beige'){
      await writeFile(resolve(out,'COMPACT-before-'+width+'.png'),baseline);
      await writeFile(resolve(out,'COMPACT-after-'+width+'.png'),candidate);
     }
     await old.close();
    }
    await page.close();await ctx.close();
   }
   // Actual storefront native ADD TO BAG -> ADDED -> Graphite -> Green swipe.
   const ctx=await browser.newContext({viewport:{width:1408,height:940},deviceScaleFactor:1,
     recordVideo:{dir:out,size:{width:1408,height:940}}});
   const page=await ctx.newPage();
   await page.goto(current+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('.cc-long-artwork[data-long="ready"]').length>=3,null,{timeout:35000});
   const product=page.locator('[data-add-to-bag].cc-long-artwork').first();
   await product.scrollIntoViewIfNeeded();
   const label=product.locator('.cc-sketch-label');
   const beforeCount=Number(await page.locator('.bag-count').first().textContent());
   // Wait for a stable product-card hit target. WebKit may scroll the
   // dynamic homepage after the first layout pass, invalidating a stale
   // bounding box even though the native pointer interaction is sound.
   await product.hover();
   await page.waitForTimeout(200);
   await page.mouse.down();
   await page.waitForTimeout(180);
   const pressState=await product.evaluate(button=>({
     pressed:button.classList.contains('cc-long-pressed'),
     faceY:new DOMMatrix(getComputedStyle(button.querySelector('#BUTTON_FACE')).transform).m42,
     shadow:getComputedStyle(button.querySelector('#BUTTON_SHADOW')).transform
   }));
   requireCheck(pressState.pressed&&Math.abs(pressState.faceY-4.5)<.20&&pressState.shadow==='none',
     name+' cart button receives immediate press feedback',pressState);
   await page.mouse.up();
   await page.waitForFunction(()=>document.querySelector('[data-add-to-bag].added')!==null,null,{timeout:5000});
   requireCheck((await label.textContent())==='ADDED'&&
      Number(await page.locator('.bag-count').first().textContent())===beforeCount+1,
      name+' existing successful cart action and ADDED label');
   await page.waitForTimeout(340);
   const graphite=await transform(product.locator('.cc-long-ink-graphite'));
   requireCheck(graphite.includes('matrix(1, 0, 0, 1'),name+' Graphite confirmation ink fully covers face',{graphite});
   await product.screenshot({path:resolve(out,name+'-cart-confirm-graphite.png')});
   await page.waitForFunction(()=>!document.querySelector('[data-add-to-bag]')?.classList.contains('added'),null,{timeout:6000});
   await page.waitForTimeout(130);
   const greenMid=await transform(product.locator('.cc-long-ink-green'));
   const progress=parseFloat(greenMid.match(/matrix\(([-.\d]+)/)?.[1]??'0');
   requireCheck(progress>0&&progress<1,name+' Green return swipe visibly advances left→right',{greenMid,progress});
   await product.screenshot({path:resolve(out,name+'-cart-return-mid.png')});
   await page.waitForTimeout(420);
   requireCheck((await label.textContent())==='ADD TO BAG'&&!await product.evaluate(e=>e.classList.contains('long-returning')),
     name+' original label and green resting state restored');
   await product.screenshot({path:resolve(out,name+'-cart-return-rest.png')});
   await page.close();await copyFile(await page.video().path(),resolve(out,name+'-add-to-bag-graphite-green.webm'));
   await ctx.close();
   // Touch and keyboard navigation are native; no global focus changes.
   const mobile=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
   const touch=await mobile.newPage();
   await touch.goto(current+'/buttons/long/',{waitUntil:'domcontentloaded'});
   await touch.waitForFunction(()=>window.__chapchitraLongButtons?.counts.ready===13);
   const button=touch.locator('.long-panel[data-tone="terracotta"] .cc-long-artwork').last();
   await button.dispatchEvent('pointerdown',{button:0,pointerType:'touch'});
   requireCheck(await button.evaluate(e=>e.classList.contains('cc-long-pressed')),name+' touch press state');
   await button.dispatchEvent('pointercancel',{pointerType:'touch'});
   requireCheck(!await button.evaluate(e=>e.classList.contains('cc-long-pressed')),name+' touch cancellation');
   await mobile.close();

   // Browser Back and :focus-visible: pointer navigation clears stale focus
   // while keyboard modality retains an accessible visible outline.
   const navContext=await browser.newContext({viewport:{width:1408,height:950}});
   const nav=await navContext.newPage();
   await nav.goto(current+'/',{waitUntil:'domcontentloaded'});
   await nav.waitForFunction(()=>document.querySelector('.edit-banner .cc-long-artwork')?.dataset.long==='ready',null,{timeout:30000});
   const editor=nav.locator('.edit-banner .cc-long-artwork').first();
   await nav.keyboard.press('Tab');
   await editor.focus(); // Safari Tab-to-links depends on Full Keyboard Access.
   const focus=await editor.evaluate(e=>({visible:e.matches(':focus-visible'),style:getComputedStyle(e).outlineStyle}));
   requireCheck(focus.visible&&focus.style==='solid',name+' editorial keyboard focus visible',focus);
   await nav.keyboard.press('Enter');
   await nav.waitForURL('**/artists-edit/',{timeout:35000});
   requireCheck(nav.url().endsWith('/artists-edit/'),name+' keyboard Enter editorial navigation');
   await nav.goBack({waitUntil:'commit'});
   await nav.waitForFunction(()=>document.querySelector('.edit-banner .cc-long-artwork')?.dataset.long==='ready',null,{timeout:30000});
   await nav.locator('.edit-banner .cc-long-artwork').first().click();
   await nav.waitForURL('**/artists-edit/',{timeout:35000});
   await nav.goBack({waitUntil:'commit'});
   await nav.waitForFunction(()=>document.querySelector('.edit-banner .cc-long-artwork')?.dataset.long==='ready',null,{timeout:30000});
   await nav.mouse.move(2,2);
   const back=await nav.locator('.edit-banner .cc-long-artwork').first().evaluate(e=>({
    focus:e.matches(':focus-visible'),pressed:e.classList.contains('cc-long-pressed'),
    pointerRetained:!!e.dataset.longPointerNavigation
   }));
   requireCheck(!back.focus&&!back.pressed&&!back.pointerRetained,
     name+' pointer browser Back restores unoutlined long CTA',back);
   await navContext.close();

   // Separate actual browser VIDEO evidence of all three long face presses
   // and touch cancellations on tablet and mobile.
   for(const [device,width,height] of [['tablet',834,1112],['mobile',430,932]]){
    const touchContext=await browser.newContext({
     viewport:{width,height},hasTouch:true,isMobile:device==='mobile',deviceScaleFactor:1,
     recordVideo:{dir:out,size:{width,height}}
    });
    const touchPage=await touchContext.newPage();
    await touchPage.goto(current+'/buttons/long/',{waitUntil:'domcontentloaded'});
    await touchPage.waitForFunction(()=>window.__chapchitraLongButtons?.counts.ready===13,null,{timeout:30000});
    for(const tone of Object.keys(colors)){
     const specimen=touchPage.locator('.long-panel[data-tone="'+tone+'"] .cc-long-artwork').last();
     await specimen.scrollIntoViewIfNeeded();
     await touchPage.waitForTimeout(150);
     await specimen.dispatchEvent('pointerdown',{button:0,pointerType:'touch'});
     await touchPage.waitForTimeout(125);
     const press=await specimen.evaluate(e=>({
      pressed:e.classList.contains('cc-long-pressed'),
      travel:new DOMMatrix(getComputedStyle(e.querySelector('#BUTTON_FACE')).transform).m42,
      shadow:getComputedStyle(e.querySelector('#BUTTON_SHADOW')).transform
     }));
     requireCheck(press.pressed&&Math.abs(press.travel-4.5)<.22&&press.shadow==='none',
       name+' '+device+' '+tone+' original face presses without moving shadow',press);
     await touchPage.waitForTimeout(140);
     await specimen.dispatchEvent('pointercancel',{pointerType:'touch'});
     await touchPage.waitForTimeout(255);
     const released=await specimen.evaluate(e=>({
      pressed:e.classList.contains('cc-long-pressed'),
      travel:new DOMMatrix(getComputedStyle(e.querySelector('#BUTTON_FACE')).transform).m42
     }));
     requireCheck(!released.pressed&&Math.abs(released.travel)<.20,
       name+' '+device+' '+tone+' cancellation restores face',released);
    }
    await touchPage.close();
    await copyFile(await touchPage.video().path(),resolve(out,name+'-'+device+'-press-cancel.webm'));
    await touchContext.close();
   }

  }finally{await browser.close()}
 }
 const result={passed:evidence.filter(c=>c.ok).length,total:evidence.length,evidence};
 await writeFile(resolve(out,'long-browser-qa.json'),JSON.stringify(result,null,2)+'\n');
 console.log('LONG BROWSER QA PASS',result.passed+'/'+result.total);
})().catch(e=>{console.error(e);process.exitCode=1});
