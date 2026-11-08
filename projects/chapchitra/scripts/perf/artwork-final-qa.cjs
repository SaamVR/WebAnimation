const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('fs'),path=require('path');
const URL=process.env.CC_QA_URL||'http://127.0.0.1:4399/artists-edit/';
const OUT=process.env.CC_QA_OUT||path.resolve('perf-results/artwork-placement-final');
fs.mkdirSync(OUT,{recursive:true});
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const colors=['white','black','red','yellow','blue','green'];
const report={url:URL,checks:[],failures:[],screenshots:[],videos:[]};
function assert(name,passed,details){
 const r={name,passed:!!passed,details};
 report.checks.push(r);
 if(!passed){report.failures.push(r);console.error('FAILED',name,JSON.stringify(details).slice(0,700));}
}
const choice=(g,v)=>'.cc-worktable-choice[data-group="'+g+'"][data-value="'+v+'"]';
const targetColors=[[255,255,255],[249,225,16],[10,74,245],[232,20,37]];
async function art(w,h,opts={}){
 const {transparent=false,jpeg=false}=opts;
 const data=Buffer.alloc(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const q=+(x>=w/2)+2*+(y>=h/2),i=(y*w+x)*4;
  data[i]=targetColors[q][0];data[i+1]=targetColors[q][1];data[i+2]=targetColors[q][2];
  data[i+3]=transparent&&(x<w*.1||x>w*.9||y<h*.1||y>h*.9)?0:255;
 }
 const handle=sharp(data,{raw:{width:w,height:h,channels:4}});
 return jpeg?handle.jpeg({quality:100,chromaSubsampling:'4:4:4'}).toBuffer():handle.png().toBuffer();
}
async function framePixels(page){
 const screenshot=await page.locator('.cc-worktable-print>img').screenshot({animations:'disabled',timeout:30000});
 const {data,info}=await sharp(screenshot).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const pixel=(u,v)=>{
  const x=Math.max(0,Math.min(info.width-1,Math.floor(info.width*u)));
  const y=Math.max(0,Math.min(info.height-1,Math.floor(info.height*v)));
  const i=(y*info.width+x)*4;
  return Array.from(data.subarray(i,i+4));
 };
 return {patches:[pixel(.25,.25),pixel(.75,.25),pixel(.25,.75),pixel(.75,.75)],
  corner:pixel(.02,.02),width:info.width,height:info.height};
}
async function rect(page){
 return page.evaluate(()=>{
  const stage=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
  const art=document.querySelector('.cc-worktable-print').getBoundingClientRect();
  const factor=2048/stage.width;
  return {x:(art.x-stage.x)*factor,y:(art.y-stage.y)*factor,
   width:art.width*factor,height:art.height*factor,
   imageBlend:getComputedStyle(document.querySelector('.cc-worktable-print img')).mixBlendMode,
   imageFilter:getComputedStyle(document.querySelector('.cc-worktable-print img')).filter,
   parentBlend:getComputedStyle(document.querySelector('.cc-worktable-print')).mixBlendMode};
 });
}
async function ready(page){
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:80000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:80000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable')?.classList.contains('is-hydrating'),null,{timeout:80000});
}
async function choose(page,g,v){
 await page.locator(choice(g,v)).click({timeout:15000});
 if(g==='garment'||g==='color')await page.waitForFunction(([group,value])=>{
  const surface=document.querySelector('.cc-worktable-garment-surface');
  return surface?.dataset[group==='garment'?'garment':'color']===value;
 },[g,v],{timeout:50000});
}
async function upload(page,filename,buffer,mimeType='image/png'){
 await page.locator('#worktableFile').setInputFiles({name:filename,buffer,mimeType});
 await page.locator('.cc-worktable-print.has-art img[src^="blob"]').waitFor({timeout:15000});
}
async function save(page,filename,element='.cc-worktable-stage'){
 const file=path.join(OUT,filename);
 await page.locator(element).screenshot({path:file,animations:'disabled',timeout:20000});
 report.screenshots.push(filename);
}
async function run(label,width,height,asTouch=false){
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--disable-dev-shm-usage']});
 const options={viewport:{width,height},deviceScaleFactor:1,hasTouch:asTouch,isMobile:asTouch,serviceWorkers:'block'};
 if(label==='desktop')options.recordVideo={dir:OUT,size:{width:1280,height:800}};
 const context=await browser.newContext(options);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ready(page);
 assert(label+' editorial header preserved',await page.getByRole('heading',{name:'Customize your print'}).count()===1);
 assert(label+' explicit 300 PPI guidance',await page.getByText('Recommended artwork resolution (300 PPI)').count()===1);
 assert(label+' initial adjustment zero',await page.locator('#worktableArtScale').inputValue()==='0');
 assert(label+' source artwork disabled until upload',await page.locator('#worktableArtScale').isDisabled());
 const isColor=rgb=>rgb.slice(0,3).every((v,i)=>Math.abs(v-targetColors[i][i]??0)<20);
 // Distinct white opaque JPEG proves no multiply over a pigmented shirt.
 await choose(page,'color','black');
 await upload(page,'opaque-white-yellow-blue-red.jpg',await art(480,600,{jpeg:true}),'image/jpeg');
 const initial=await rect(page);
 assert(label+' compositor is normal source-over',initial.parentBlend==='normal'&&initial.imageBlend==='normal'&&initial.imageFilter==='none',initial);
 assert(label+' image is portrait at actual aspect',Math.abs(initial.width/initial.height-480/600)<.01,initial);
 const pngSource=await framePixels(page);
 assert(label+' opaque JPG white/yellow/blue/red pixels preserved',pngSource.patches.every((p,i)=>p.slice(0,3).every((ch,c)=>Math.abs(ch-targetColors[i][c])<=25)),pngSource);
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await save(page,label+'-opaque-jpg-on-black.png');
 await choose(page,'printSize','A3');
 const a3=await rect(page);
 await choose(page,'printSize','A4');
 const a4=await rect(page);
 assert(label+' A3 is about 2x the A4 visual reference area',
  Math.abs((a3.width*a3.height)/(a4.width*a4.height)-2)<.07,{a3,a4});
 await page.locator('#worktableArtScale').fill('-25');
 assert(label+' negative slider label',await page.locator('#worktableScaleOutput').textContent()==='−25%');
 await page.locator('#worktableArtScale').fill('35');
 const plus=await rect(page);
 assert(label+' +35% enlarges reference',plus.width>a4.width*1.30&&plus.height>a4.height*1.30,{a4,plus});
 assert(label+' +35% advisory',await page.locator('#worktableSizeGuidance').textContent().then(x=>x.includes('Above the nominal')));
 assert(label+' manipulation outline visible while resizing',await page.locator('.cc-worktable-print.is-manipulating').count()===1);
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await save(page,label+'-plus35-temporary-boundary.png');
 await page.waitForTimeout(950);
 assert(label+' temporary boundary removed when idle',
  await page.locator('.cc-worktable-print.is-manipulating').count()===0);
 await page.locator('#worktableResetArt').click();
 assert(label+' reset is signed zero',await page.locator('#worktableScaleOutput').textContent()==='0%');
 // Transparent PNG should expose garment through transparency, not multiply.
 await upload(page,'transparent-print.png',await art(480,600,{transparent:true}));
 await choose(page,'color','green');
 const alpha=await framePixels(page);
 assert(label+' PNG opaque quadrants preserve original values',
  alpha.patches.every((p,i)=>p.slice(0,3).every((ch,c)=>Math.abs(ch-targetColors[i][c])<=16)),alpha);
 assert(label+' transparent corner reveals garment (not white)',alpha.corner.slice(0,3).some(x=>x<215),alpha.corner);
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await save(page,label+'-transparent-png-on-green.png');
 // Repeated four garment x six fabric colors, selected output and same image.
 if(label==='desktop'){
  const opaque=await art(480,600);
  await upload(page,'multicolor-png.png',opaque);
  for(const g of garments){
   await choose(page,'garment',g);
   for(const c of colors){
    await choose(page,'color',c);
    const rendered=await framePixels(page);
    assert('24 looks '+g+'/'+c+' keeps image RGB',
      rendered.patches.every((p,i)=>p.slice(0,3).every((ch,j)=>Math.abs(ch-targetColors[i][j])<=17)),rendered);
    const r=await rect(page);
    assert('24 looks '+g+'/'+c+' keeps image within stage',
      r.x>0&&r.y>0&&r.x+r.width<2048&&r.y+r.height<1152,r);
   }
  }
 }
 await choose(page,'color','black');
 await choose(page,'garment','regular');
 await page.locator('#worktableResetArt').click();
 await page.locator('.cc-worktable-drag').scrollIntoViewIfNeeded();
 const before=await rect(page);
 if(!asTouch){
  const box=await page.locator('.cc-worktable-drag').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+70,y+65,{steps:6});
  assert(label+' pointerdown shows temporary boundary',await page.locator('.cc-worktable-print.is-manipulating').count()===1);
  await page.mouse.up();
  const moved=await rect(page);
  assert(label+' mouse drag moves artwork x/y',moved.x>before.x&&moved.y>before.y,{before,moved});
  await page.locator('.cc-worktable-drag').focus();
  const beforeKeys=await rect(page);
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowUp');
  const afterKeys=await rect(page);
  assert(label+' keyboard reposition works',afterKeys.x<beforeKeys.x&&afterKeys.y<beforeKeys.y);
 }
 // Landscape and square sources must fit without crop.
 for(const [w,h,name] of [[540,240,'landscape'],[320,320,'square'],[280,420,'portrait']]){
  await upload(page,name+'.png',await art(w,h));
  const r=await rect(page);
  assert(label+' '+name+' keeps aspect',Math.abs(r.width/r.height-w/h)<.02,{r,w,h});
 }
 await page.locator('#worktableResetArt').click();
 assert(label+' reset returns to original collar position',
  await page.locator('#worktableArtScale').inputValue()==='0');
 await page.locator('#worktableRemoveArt').click();
 assert(label+' remove disables tools',await page.locator('#worktableArtScale').isDisabled()&&
   await page.locator('.cc-worktable-print.has-art').count()===0);
 assert(label+' no JS exceptions',errors.length===0,errors);
 assert(label+' no horizontal scroll',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const video=page.video();
 await context.close();
 if(video){const file=await video.path();const saved=label+'-artwork-interactions.webm';fs.copyFileSync(file,path.join(OUT,saved));report.videos.push(saved);}
 await browser.close();
}
(async()=>{
 for(const [label,w,h,touch] of [['desktop',1440,900,false],['tablet',834,1112,true],['mobile',390,844,true]])await run(label,w,h,touch);
 report.total=report.checks.length;report.passed=report.checks.filter(x=>x.passed).length;report.failed=report.failures.length;
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
 console.log('ARTWORK QA',JSON.stringify({passed:report.passed,failed:report.failed,total:report.total,failures:report.failures},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('QA CRASH',e.stack||String(e));process.exitCode=3});
