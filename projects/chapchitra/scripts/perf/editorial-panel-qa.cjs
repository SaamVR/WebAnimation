/* CHAPCHITRA isolated Artist's Edit panel UI tests. Artwork renderer unchanged.
   Tests panel↔stage synchronization, calibrated swatches and native tools. */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const fs=require('fs'),path=require('path');
const TARGET=process.env.CC_QA_URL||'http://127.0.0.1:4366/artists-edit/';
const BASE=process.env.CC_BEFORE_URL||'http://127.0.0.1:4355/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/editorial-panel-qa');
fs.mkdirSync(OUT,{recursive:true});
const results=[],failure=[];
const check=(name,pass,detail)=>{const r={name,pass:!!pass};if(detail!==undefined)r.detail=detail;results.push(r);if(!pass)failure.push(r)};
const rail=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const hit=(g,v)=>'.cc-worktable-hit[data-group="'+g+'"][data-value="'+v+'"]';
const image=(g,v)=>'.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]';
const groups=[
 ['garment',['regular','dropShoulder','fullSleeve','hoodie']],
 ['size',['S','M','L','XL','XXL']],
 ['color',['black','white','red','yellow','blue','green']],
 ['printSize',['A3','A4']],
];
const knownColors={black:'#222629',white:'#ffffff',red:'#DE1F30',yellow:'#F3C916',blue:'#145FCE',green:'#087B47'};
const hexToRGB=h=>[1,3,5].map(at=>parseInt(h.slice(at,at+2),16));
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function ready(page,url=TARGET){
 const start=Date.now();
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:85000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:85000});
 const ready=Date.now()-start;
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:80000});
 await page.evaluate(()=>document.fonts.ready);
 return {ready,full:Date.now()-start};
}
async function selected(page,g,v){
 const btn=page.locator(rail(g,v));
 return (await btn.getAttribute('aria-pressed'))==='true';
}
async function stageState(page,g,v){
 const props=await page.locator(image(g,v)).evaluate(el=>({selected:el.classList.contains('is-selected'),filter:getComputedStyle(el).filter}));
 const hitChecked=await page.locator(hit(g,v)).getAttribute('aria-pressed');
 return {...props,hitChecked};
}
async function runEngine(engine,name,{width=1440,height=900,touch=false}={}){
 const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(engine===chromium?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const first=await ready(page);
 const prefix=name+' '+width;
 const layout=await page.evaluate(()=>({
  columns:getComputedStyle(document.querySelector('.cc-worktable-rail')).gridTemplateColumns.split(' ').filter(Boolean).length,
  font:getComputedStyle(document.querySelector('.cc-worktable-palette h2')).fontFamily,
  supportFont:getComputedStyle(document.querySelector('.cc-worktable-choice')).fontFamily,
  background:getComputedStyle(document.querySelector('.cc-worktable-palette')).backgroundColor,
  actualWidth:document.documentElement.scrollWidth,
  winWidth:innerWidth,
  fields:document.querySelectorAll('fieldset.cc-worktable-field').length,
  legends:[...document.querySelectorAll('.cc-worktable-field legend')].map(el=>el.textContent.trim()),
  links:[...document.querySelectorAll('.cc-worktable-choice')].map(el=>[el.dataset.group,el.dataset.value,el.getAttribute('aria-pressed')]),
 }));
 check(prefix+' correct four accessible fieldset groups',layout.fields===4&&layout.legends.every((x,i)=>x.startsWith('0'+(i+1)+' ')),layout.legends);
 check(prefix+' editorial Noto Serif Bengali heading',layout.font.includes('Noto Serif Bengali'),layout.font);
 check(prefix+' Hind Siliguri control font',layout.supportFont.includes('Hind Siliguri'),layout.supportFont);
 check(prefix+' Gallery White surface',layout.background==='rgb(246, 247, 245)',layout.background);
 const expectedColumns=width>1100?4:width>600?2:1;
 check(prefix+' exact responsive column count',layout.columns===expectedColumns,{actual:layout.columns,expected:expectedColumns});
 check(prefix+' no page horizontal overflow',layout.actualWidth<=layout.winWidth+1,[layout.actualWidth,layout.winWidth]);
 check(prefix+' all 17 manual choices present',layout.links.length===17,layout.links.length);
 const liveMeta=await page.locator('#worktableMessage').evaluate(el=>({
  role:el.getAttribute('role'),ariaLive:el.getAttribute('aria-live')
 }));
 check(prefix+' persistent accessible polite status announcement region',
  liveMeta.role==='status'&&liveMeta.ariaLive==='polite',liveMeta);
 for(const [g,options] of groups){
  check(prefix+' only one chosen '+g+' initially',layout.links.filter(x=>x[0]===g&&x[2]==='true').length===1);
  for(const v of options){
   const node=page.locator(rail(g,v));
   check(prefix+' named semantic button '+g+':'+v,
    (await node.getAttribute('aria-pressed'))!==null &&
    (await node.textContent()).trim().length>0);
  }
 }
 for(const [color,hex] of Object.entries(knownColors)){
  const btn=page.locator(rail('color',color));
  const swatch=await btn.locator('.cc-worktable-swatch').evaluate(el=>({
    rgba:getComputedStyle(el).backgroundColor,ariaHidden:el.getAttribute('aria-hidden'),rect:(()=>{const r=el.getBoundingClientRect();return [r.width,r.height]})()
  }));
  const actual=(swatch.rgba.match(/\d+/g)||[]).slice(0,3).map(Number);
  check(prefix+' calibrated '+color+' fabric swatch and decorative dot',
   actual.every((n,i)=>n===hexToRGB(hex)[i])&&swatch.ariaHidden==='true'&&swatch.rect[0]>=20,
   {actual,hex});
 }
 // Every lower-rail click updates shared state and the same illustrated source.
 for(const [g,values] of groups){
  for(const v of values){
   const btn=page.locator(rail(g,v));
   if(touch)await btn.tap({timeout:25000});else await btn.click({timeout:25000});
   check(prefix+' rail sync '+g+':'+v,await selected(page,g,v));
   if(g!=='color'&&g!=='garment'){
    const stage=await stageState(page,g,v);
    check(prefix+' illustrated persistent highlight '+g+':'+v,stage.selected&&stage.hitChecked==='true',stage);
   }
   const active=await page.locator('.cc-worktable-choice[data-group="'+g+'"][aria-pressed=true]').count();
   check(prefix+' exclusivity '+g+':'+v,active===1,active);
  }
 }
 check(prefix+' selection announced to screen readers',await page.locator('#worktableMessage').textContent()==='A4 selected');
 await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.color==='green',null,{timeout:35000});
 // Garment and pigment still atomic after successive lower control selections.
 await page.locator(rail('garment','hoodie')).click();
 await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.garment==='hoodie'&&document.querySelector('.cc-worktable-garment-surface')?.dataset.color==='green',null,{timeout:35000});
 check(prefix+' final panel state matches colored Hoodie canvas',await selected(page,'garment','hoodie')&&await selected(page,'color','green'));
 // Desktop + tablet illustrated button -> lower panel; mobile hides tiny stage
 // hit targets deliberately, as approved before this layout task.
 if(width>=834){
  for(const [g,v] of [['garment','dropShoulder'],['size','L'],['color','red'],['printSize','A3']]){
   const h=page.locator(hit(g,v));
   await h.click({timeout:25000,force:true});
   check(prefix+' illustrated stage to panel '+g+':'+v,await selected(page,g,v));
   const props=await stageState(page,g,v);
   check(prefix+' stage and panel both pressed '+g+':'+v,props.selected&&props.hitChecked==='true',props);
  }
 }
 // Native upload retains its same chooser and sizing/reset/removal implementation.
 const button=page.locator('#worktableUploadArt');
 check(prefix+' primary upload 44px touch size',(await button.boundingBox()).height>=44);
 const chooser=page.waitForEvent('filechooser',{timeout:10000});
 if(touch)await button.tap();else await button.click();
 const imageBuffer=await sharp({create:{width:80,height:80,channels:4,background:'#9d4958'}}).png().toBuffer();
 await (await chooser).setFiles({name:'editorial-test.png',mimeType:'image/png',buffer:imageBuffer});
 await page.locator('.cc-worktable-print.has-art img[src^="blob"]').waitFor({timeout:15000});
 check(prefix+' upload enables existing controls',
  await page.locator('#worktableArtScale').isEnabled()&&await page.locator('#worktableResetArt').isEnabled()&&await page.locator('#worktableRemoveArt').isEnabled());
 await page.locator('#worktableArtScale').fill('65');
 check(prefix+' artwork scale remains synchronized',(await page.locator('#worktableScaleOutput').textContent()).trim()==='65%');
 await page.locator('#worktableResetArt').click();
 check(prefix+' reset placement stays functional',(await page.locator('#worktableScaleOutput').textContent()).trim()==='100%');
 await page.locator('#worktableRemoveArt').click();
 check(prefix+' artwork removal restores disabled state',await page.locator('.cc-worktable-print.has-art').count()===0&&await page.locator('#worktableResetArt').isDisabled());
 check(prefix+' no duplicate SVG illustration',await page.locator('.cc-worktable-upload-svg-layer svg').count()===1);
 check(prefix+' original production calibration disclaimer',await page.getByText('production print dimensions and fabric-color accuracy require manufacturer calibration.',{exact:false}).count()===1);
 // Touch target size all 17 controls; focus styles on keyboard desktop.
 for(const [g,options] of groups)for(const v of options){
  const rect=await page.locator(rail(g,v)).boundingBox();
  check(prefix+' touch target >=44px '+g+':'+v,!!rect&&rect.height>=44,rect?.height);
 }
 if(!touch){
  await page.locator(rail('color','black')).focus();
  const focus=await page.locator(rail('color','black')).evaluate(el=>({
   focused:document.activeElement===el,style:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth,
  }));
  check(prefix+' keyboard focus available',focus.focused,focus);
  await page.keyboard.press('Enter');
  check(prefix+' keyboard Enter updates same color reducer',await selected(page,'color','black'));
  await page.keyboard.press('Tab');
  const visibleFocus=await page.evaluate(()=>{
   const el=document.activeElement,computed=el?getComputedStyle(el):null;
   return {tag:el?.tagName,group:el?.dataset.group,value:el?.dataset.value,
    outline:computed?.outlineStyle,width:computed?.outlineWidth};
  });
  check(prefix+' keyboard focus advances',visibleFocus.tag==='BUTTON'||visibleFocus.tag==='INPUT',visibleFocus);
  check(prefix+' keyboard-only focus is visibly distinguished',
   visibleFocus.outline==='solid'&&parseFloat(visibleFocus.width)>=2,visibleFocus);
 }
 check(prefix+' no script errors',errors.length===0,errors);
 check(prefix+' final no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 // Full panel screenshot with a representative selected colored garment and
 // controls enabled from uploading a test image. Controls tested separately.
 await page.locator(rail('garment','hoodie')).click();
 await page.locator(rail('color','red')).click();
 await page.locator(rail('size','XL')).click();
 await page.locator(rail('printSize','A3')).click();
 if(!touch)await page.mouse.move(0,0);
 // The approved sticky site header must remain functional in the app, but
 // can overlap a page-element screenshot after Playwright scrolls the panel.
 // Hide only that chrome for the QA capture, never for interaction assertions.
 await page.addStyleTag({content:'.site-header,.announcement{visibility:hidden!important}'});
 await page.locator('.cc-worktable-palette').screenshot({path:path.join(OUT,name+'-'+width+'-selected-panel.png'),animations:'disabled'});
 await context.close();await browser.close();
 return {name,width,first};
}
(async()=>{
 const suites=[
  [chromium,'chromium-desktop',{width:1440,height:900}],
  [webkit,'webkit-desktop',{width:1440,height:900}],
  [chromium,'chromium-tablet',{width:834,height:1112,touch:true}],
  [webkit,'webkit-tablet',{width:834,height:1112,touch:true}],
  [chromium,'chromium-mobile',{width:390,height:844,touch:true}],
  [webkit,'webkit-mobile',{width:390,height:844,touch:true}],
  [chromium,'chromium-small',{width:320,height:740,touch:true}],
 ];
 const timings=[];
 for(const [engine,name,options] of suites)timings.push(await runEngine(engine,name,options));
 const report={target:TARGET,base:BASE,passed:results.filter(x=>x.pass).length,failed:failure.length,total:results.length,failures:failure,timings,checks:results};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,total:report.total,failures:report.failures,timings},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('EDITORIAL QA CRASH',e);process.exitCode=3});
