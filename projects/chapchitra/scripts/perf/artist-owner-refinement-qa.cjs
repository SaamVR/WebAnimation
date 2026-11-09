const {chromium,webkit}=require('playwright');
const sharp=require('sharp'),fs=require('fs'),path=require('path');
const before=process.env.CC_BEFORE_URL||'https://chapchitra-webanimation.onrender.com/artists-edit/';
const after=process.env.CC_AFTER_URL||'http://127.0.0.1:4457/artists-edit/';
const out=path.resolve('perf-results/owner-refinement');fs.mkdirSync(out,{recursive:true});
const report={before,after,checks:[],errors:[]};
const check=(label,pass,data)=>{report.checks.push({label,pass:!!pass,data});if(!pass)console.error('FAIL',label,JSON.stringify(data));};
async function ready(page,url){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
}
const choose=async (page,preset)=>page.locator('.cc-worktable-choice[data-group=printSize][data-value='+preset+']').click();
const geom=async page=>page.evaluate(()=>{
 const stage=document.querySelector('.cc-worktable-stage').getBoundingClientRect();
 const guide=document.querySelector('.cc-worktable-paper-guide').getBoundingClientRect();
 const header=document.querySelector('.route-head'),top=header?.getBoundingClientRect();
 const intro=document.querySelector('.cc-worktable-artwork-zone')?.getBoundingClientRect();
 const nav=document.querySelector('.site-header')?.getBoundingClientRect();
 return {guide:{x:(guide.x-stage.x)/stage.width*2048,y:(guide.y-stage.y)/stage.height*1152,
  w:guide.width/stage.width*2048,h:guide.height/stage.height*1152},
  headingCount:document.querySelectorAll('main h1').length,headingText:header?.querySelector('h1')?.textContent,
  headerHeight:top?.height,stageTop:stage.top,navBottom:nav?.bottom,
  horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
  tipsOpen:document.querySelector('.cc-worktable-print-tips')?.open||false,
  quality:document.querySelector('#worktableArtworkQuality')?.textContent,
  lowWarningVisible:!document.querySelector('#worktableArtworkQuality')?.hidden,
  studioWidth:stage.width,toolbar:!!document.querySelector('.cc-worktable-art-tools')};
});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 if(process.env.CC_SKIP_BEFORE!=='1'){
 const old=await browser.newPage({viewport:{width:1600,height:900}});
 await ready(old,before);
 await old.screenshot({path:path.join(out,'before-entry-desktop.png')});
 await old.locator('.cc-worktable-artwork-zone').screenshot({path:path.join(out,'before-artwork-panel-desktop.png')});
 const oldg=await geom(old);check('before oversized heading exists',oldg.headerHeight>200,oldg);
 await old.close();
 }
 const desktop=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];desktop.on('pageerror',e=>errors.push(e.message));
 await ready(desktop,after);
 await desktop.screenshot({path:path.join(out,'after-entry-desktop.png')});
 const g=await geom(desktop);
 check('compact 50-80px desktop header',g.headerHeight>=48&&g.headerHeight<=82,g);
 check('single accessible page heading',g.headingCount===1&&g.headingText.includes('Artist'),g);
 check('worktable starts immediately after heading',g.stageTop-g.navBottom<=90&&g.stageTop-g.navBottom>=40,g);
 check('no oversized intro or build metadata',await desktop.locator('.route-head .cc-worktable-version,.route-head p').count()===0);
 check('no desktop overflow',!g.horizontalOverflow,g);
 await choose(desktop,'A4');
 await desktop.locator('.cc-worktable-frame').screenshot({path:path.join(out,'after-A4-stage-desktop.png')});
 const a4=await geom(desktop);
 await choose(desktop,'A3');
 await desktop.locator('.cc-worktable-frame').screenshot({path:path.join(out,'after-A3-stage-desktop.png')});
 const a3=await geom(desktop);
 check('same A3/A4 upper anchor',Math.abs(a3.guide.y-a4.guide.y)<1,{a4:a4.guide,a3:a3.guide});
 const ratio=a3.guide.w*a3.guide.h/(a4.guide.w*a4.guide.h);
 check('twice reference area',Math.abs(ratio-2)<.02,{ratio,a4:a4.guide,a3:a3.guide});
 check('relative target shirt center',Math.abs(a4.guide.x+a4.guide.w/2-1023)<9,a4.guide);
 check('shared top below collar',Math.abs(a4.guide.y-362)<7,a4.guide);
 check('print tips initially collapsed',!g.tipsOpen);
 const sample=await sharp({create:{width:120,height:120,channels:4,background:{r:244,g:81,b:31,alpha:1}}}).png().toBuffer();
 await desktop.locator('#worktableFile').setInputFiles({name:'small-test.png',mimeType:'image/png',buffer:sample});
 await desktop.locator('.cc-worktable-print.has-art').waitFor({timeout:30000});
 await desktop.locator('#worktableArtworkQuality:not([hidden])').waitFor({timeout:20000});
 check('short image-quality warning', (await desktop.locator('#worktableArtworkQuality').textContent()).trim()==='Image quality may be low at this print size.');
 await desktop.locator('.cc-worktable-print-tips summary').click();
 check('print tips expand with correct print recommendations',await desktop.locator('.cc-worktable-print-tips[open]').count()===1&&
   (await desktop.locator('.cc-worktable-print-tips-content').textContent()).includes('3508 × 4961'));
 await desktop.locator('.cc-worktable-artwork-zone').screenshot({path:path.join(out,'after-artwork-panel-tips-desktop.png')});
 await desktop.locator('.cc-worktable-print-tips summary').click();
 await desktop.locator('.cc-worktable-artwork-zone').screenshot({path:path.join(out,'after-artwork-panel-desktop.png')});
 await desktop.locator('.cc-worktable-drag').click();
 await desktop.locator('.cc-worktable-tool[data-tool=resize]').click();
 await desktop.locator('#worktableArtScale').fill('20');
 check('resize control remains functional',(await desktop.locator('#worktableScaleOutput').textContent()).includes('+20'));
 await desktop.screenshot({path:path.join(out,'after-editor-desktop.png')});
 check('no runtime errors',errors.length===0,errors);
 await desktop.close();
 for(const [engine,name,w,h] of [[webkit,'tablet',834,1112],[chromium,'mobile',390,844]]){
  const b=engine===webkit?await webkit.launch({headless:true}):browser;
  const page=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});
  await ready(page,after);
  const state=await geom(page);
  check(name+' heading and stage',state.headingCount===1&&state.headerHeight<=75,state);
  check(name+' no horizontal overflow',!state.horizontalOverflow,state);
  await page.locator('.cc-worktable-artwork-zone').screenshot({path:path.join(out,'after-artwork-panel-'+name+'.png')});
  await page.screenshot({path:path.join(out,'after-entry-'+name+'.png')});
  await page.close();if(engine===webkit)await b.close();
 }
 await browser.close();
 report.passed=report.checks.filter(t=>t.pass).length;report.failed=report.checks.length-report.passed;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,checks:report.checks.filter(t=>!t.pass)},null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error('OWNER_QA_CRASH',e.stack||e);process.exitCode=3});
