/* Exact owner-supplied Illustrator SVG and existing native upload regression. */
const {chromium,webkit}=require('playwright');
const sharp=require('sharp');
const fs=require('fs'),path=require('path');
const URL_NEW=process.env.CC_QA_URL||'http://127.0.0.1:4333/artists-edit/';
const URL_OLD=process.env.CC_BEFORE_URL||'http://127.0.0.1:4321/artists-edit/';
const OUT=path.resolve(process.env.CC_QA_OUT||'perf-results/upload-svg-review');
fs.mkdirSync(OUT,{recursive:true});
const checks=[],failures=[];
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)failures.push({name,detail})};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SEL='.cc-worktable-upload-svg-layer';
const HIT='.cc-worktable-hit[data-group="upload"]';
const get=page=>page.locator(SEL).evaluate(el=>{
 const vector=el.querySelector('svg'),float=el.querySelector('.cc-worktable-upload-float');
 const css=getComputedStyle(el),bounds=el.getBoundingClientRect(),hit=document.querySelector('.cc-worktable-hit[data-group=upload]').getBoundingClientRect();
 const frame=vector.querySelector('#FRAME_LINES path');
 return {x:bounds.x,y:bounds.y,w:bounds.width,h:bounds.height,
  hit:[hit.x,hit.y,hit.width,hit.height],classes:el.className,
  filter:css.filter,opacity:css.opacity,
  transform:css.transform,
  physicalLift:new DOMMatrixReadOnly(css.transform).m42,
  floatAnimation:getComputedStyle(float).animationName,
  floatState:getComputedStyle(float).animationPlayState,
  floatTransform:getComputedStyle(float).transform,
  svgTransform:getComputedStyle(vector).transform,
  circle:getComputedStyle(vector.querySelector('#CIRCLE_FOR_PLUS ellipse')).fill,
  plus:getComputedStyle(vector.querySelector('#PLUS path')).fill,
  ring:getComputedStyle(vector.querySelector('#CIRCLE_FOR_PLUS path')).fill,
  frame:getComputedStyle(frame).fill,
  viewBox:vector.getAttribute('viewBox'),
  groups:[...vector.querySelectorAll('g[id]')].map(el=>el.id),
  clip:getComputedStyle(vector).overflow
 };
});
async function navigate(page,url=URL_NEW,hydrated=true){
 const started=Date.now();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:90000});
 const firstMs=Date.now()-started;
 if(hydrated)await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:70000});
 return {firstMs,errors};
}
async function desktop(engine,name,options={}){
 const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),...(name==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const network=[];
 page.on('request',req=>network.push(req.url()));
 const nav=await navigate(page);
 const rest=await get(page);
 check(name+' SVG present once',await page.locator(SEL+' > .cc-worktable-upload-float > svg').count()===1);
 check(name+' four inspected source groups',rest.groups.join()===['MOUNTAINS_SUN','FRAME_LINES','CIRCLE_FOR_PLUS','PLUS'].join(),rest.groups);
 check(name+' original rest circle green',rest.circle==='rgb(40, 61, 45)',rest.circle);
 check(name+' original rest plus gallery offwhite',rest.plus==='rgb(246, 246, 244)',rest.plus);
 check(name+' resting frame is original green',rest.frame==='rgb(40, 61, 45)',rest.frame);
 check(name+' shape-following physical drop shadow retained',rest.filter.includes('drop-shadow('),rest.filter);
 check(name+' raster upload icon absent from DOM',await page.locator('img[data-source="Upload image notebook/Upload_image_notebook_upload_button_4.png"]').count()===0);
 check(name+' only one upload hotspot',await page.locator(HIT).count()===1);
 check(name+' notebook is still separate and unmodified',await page.locator('.cc-worktable-layer[data-source="Upload image notebook/Upload_image_notebook_1.png"]').count()===1);
 check(name+' no old upload raster network',!network.some(u=>u.includes('Upload_image_notebook_upload_button_4')),network.filter(u=>u.includes('upload_button')));
 check(name+' parent position from original stage crop',Math.abs(rest.x-(1143))<2&&Math.abs(rest.w-193.67)<2,rest);
 check(name+' idle floating animation exists',rest.floatAnimation==='cc-upload-float',rest.floatAnimation);
 check(name+' original opacity and visible',rest.opacity==='1',rest.opacity);
 if(name==='chromium')await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,'new-resting-desktop.png'),animations:'disabled'});
 // After hover, invert ONLY circle and plus, not mountains/frame/ring.
 await page.locator(HIT).hover();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#CIRCLE_FOR_PLUS ellipse')).fill==='rgb(246, 247, 245)',null,{timeout:4000});
 const hover=await get(page);
 check(name+' circle white on hover',hover.circle==='rgb(246, 247, 245)',hover.circle);
 check(name+' plus Press Green on hover',hover.plus==='rgb(41, 61, 45)',hover.plus);
 check(name+' frame NOT recolored',hover.frame===rest.frame,hover.frame);
 check(name+' original white ring NOT recolored',hover.ring===rest.ring,hover.ring);
 check(name+' approved 3px physical lift',Math.abs(hover.physicalLift+3)<.4,[rest.physicalLift,hover.physicalLift]);
 check(name+' hover float paused',hover.floatState==='paused',hover.floatState);
 check(name+' hover shadow retained',hover.filter.includes('drop-shadow('));
 if(name==='chromium')await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,'new-hover-inversion-desktop.png'),animations:'disabled'});
 await page.mouse.move(0,0);
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#CIRCLE_FOR_PLUS ellipse')).fill==='rgb(40, 61, 45)',null,{timeout:4000});
 const exit=await get(page);
 check(name+' circle returns to original after exit',exit.circle===rest.circle&&exit.plus===rest.plus,exit);
 check(name+' hover class clears',!exit.classes.includes('is-hovered'));
 // Pointer acknowledgment is short and must not delay the file chooser.
 await page.locator(HIT).dispatchEvent('pointerdown',{pointerType:'mouse',pointerId:1});
 check(name+' micro acknowledgement class immediately',await page.locator(SEL+'.is-upload-acknowledged').count()===1);
 await sleep(230);
 check(name+' acknowledgement automatically returns',await page.locator(SEL+'.is-upload-acknowledged').count()===0);
 const chooserWait=page.waitForEvent('filechooser',{timeout:5000});
 await page.locator(HIT).click();
 const chooser=await chooserWait;
 check(name+' native chooser opens on click',!!chooser);
 await chooser.setFiles([]);
 await page.mouse.move(0,0);await sleep(220);
 check(name+' cancellation leaves no selected state',!await page.locator(SEL).evaluate(el=>el.classList.contains('is-selected')));
 check(name+' no JS exceptions',nav.errors.length===0,nav.errors);
 await browser.close();
}
async function nativeArtworkAndTouch(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await navigate(page);
 const image=await sharp({create:{width:200,height:100,channels:4,background:{r:167,g:43,b:60,alpha:1}}}).png().toBuffer();
 const chooser=page.waitForEvent('filechooser',{timeout:5000});
 await page.locator(HIT).click();
 await (await chooser).setFiles({name:'approved-design.png',mimeType:'image/png',buffer:image});
 await page.getByText('Artwork loaded locally',{exact:false}).waitFor({timeout:10000});
 check('image file uses existing local-only upload preview',await page.locator('.cc-worktable-print.has-art img[src^=blob]').count()===1);
 check('resize slider enabled after valid upload',await page.locator('#worktableArtScale').isEnabled());
 await page.locator('#worktableArtScale').fill('-25');
 check('size slider changes without replacing SVG',await page.locator('#worktableScaleOutput').textContent()==='−25%'&&await page.locator(SEL+' svg').count()===1);
 await page.getByRole('button',{name:'Reset placement'}).click();
 check('reset placement still works',await page.locator('#worktableScaleOutput').textContent()==='0%');
 await page.getByRole('button',{name:'Remove artwork'}).click();
 check('remove artwork clears preview',await page.locator('.cc-worktable-print.has-art').count()===0&&await page.locator('#worktableArtScale').isDisabled());
 // Offscreen and hidden-tab animation pause.
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cc-worktable-upload-float')).animationPlayState==='paused',null,{timeout:4000});
 check('offscreen idle animation paused',true);
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.cc-worktable-upload-float')).animationPlayState==='running',null,{timeout:4000});
 check('onscreen idle resumes',true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 check('background page idle paused',(await get(page)).floatState==='paused');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 check('page-visible idle resumes',(await get(page)).floatState==='running');
 for(const width of [834,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===834?1112:720},deviceScaleFactor:1,hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const mobile=await context.newPage();
  const nav=await navigate(mobile);
  const before=await get(mobile);
  check('touch '+width+' single SVG',await mobile.locator(SEL+' svg').count()===1);
  check('touch '+width+' same clickable region',await mobile.locator(HIT).count()===1);
  const chooser=mobile.waitForEvent('filechooser',{timeout:8000});
  await mobile.locator(HIT).tap();
  await (await chooser).setFiles([]);
  check('touch '+width+' native file chooser',true);
  const after=await get(mobile);
  check('touch '+width+' no sticky hover',!after.classes.includes('is-hovered'),after.classes);
  check('touch '+width+' original rest palette',after.circle==='rgb(40, 61, 45)',after.circle);
  check('touch '+width+' no horizontal overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  check('touch '+width+' no page exceptions',nav.errors.length===0,nav.errors);
  if(width===390)await mobile.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,'new-mobile-touch.png'),animations:'disabled'});
  await context.close();
 }
 await browser.close();
}
async function keyboardReduced(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
 await navigate(page);
 const before=await get(page);
 check('reduced motion idle disabled',before.floatAnimation==='none',before.floatAnimation);
 const css=await page.locator(SEL+' svg').evaluate(el=>getComputedStyle(el).transitionDuration);
 check('reduced motion SVG transitions removed',css==='0s',css);
 await page.locator(HIT).focus();
 const wait=page.waitForEvent('filechooser',{timeout:5000});
 await page.locator(HIT).press('Enter');
 await (await wait).setFiles([]);
 const f=await get(page);
 check('keyboard Enter opens native file picker and focus has silhouette shadow',f.filter.includes('drop-shadow('),f.filter);
 await browser.close();
}
async function baselinePair(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const old=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const next=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await Promise.all([navigate(old,URL_OLD),navigate(next,URL_NEW)]);
 for(const [page,file] of [[old,'old-resting-desktop.png'],[next,'new-resting-for-compare.png']]){
  await page.mouse.move(0,0);
  await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,file),animations:'disabled'});
 }
 // Same approved selected-state shadow, glow and persistent elevation in
 // all four groups: SVG replacement may NOT modify this owner-approved work.
 for(const [group,value] of [['garment','dropShoulder'],['size','L'],['color','red'],['printSize','A3']]){
  for(const page of [old,next]){
   await page.locator('.cc-worktable-choice[data-group="'+group+'"][data-value="'+value+'"]').click();
   await page.mouse.move(0,0);
   await page.waitForFunction(([g,v])=>{
    const el=document.querySelector('.cc-worktable-prop[data-group="'+g+'"][data-value="'+v+'"]');
    return !!el&&el.classList.contains('is-selected');
   },[group,value],{timeout:4000});
   await sleep(300);
  }
  const cssFor=page=>page.locator('.cc-worktable-prop[data-group="'+group+'"][data-value="'+value+'"]').evaluate(el=>({
   filter:getComputedStyle(el).filter,transform:getComputedStyle(el).transform
  }));
  const [approved,updated]=await Promise.all([cssFor(old),cssFor(next)]);
  check('approved selected shadow/glow unchanged: '+group,approved.filter===updated.filter,{approved:approved.filter,updated:updated.filter});
  check('approved selected elevation unchanged: '+group,approved.transform===updated.transform,{approved:approved.transform,updated:updated.transform});
 }
 const a=path.join(OUT,'old-resting-desktop.png'),b=path.join(OUT,'new-resting-for-compare.png');
 const meta=await sharp(a).metadata(),width=meta.width,height=meta.height;
 const region={left:Math.round(width*.767),top:Math.round(height*.34),width:Math.round(width*.175),height:Math.round(height*.30)};
 const A=await sharp(a).extract(region).resize({width:650}).png().toBuffer();
 const B=await sharp(b).extract(region).resize({width:650}).png().toBuffer();
 const m=await sharp(A).metadata();
 await sharp({create:{width:1300,height:m.height,channels:4,background:'#fff'}}).composite([{input:A,left:0,top:0},{input:B,left:650,top:0}]).webp({quality:92,effort:5}).toFile(path.join(OUT,'before-after-illustrated-upload-target.webp'));
 await browser.close();
}
(async()=>{
 await desktop(chromium,'chromium');
 await desktop(webkit,'webkit');
 await nativeArtworkAndTouch();
 await keyboardReduced();
 await baselinePair();
 const report={url:URL_NEW,baseline:URL_OLD,total:checks.length,passed:checks.filter(x=>x.ok).length,failures,checks};
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({total:report.total,passed:report.passed,failed:failures.length,failures},null,2));
 if(failures.length)process.exitCode=2;
})().catch(e=>{console.error('QA CRASH',e);process.exitCode=3});
