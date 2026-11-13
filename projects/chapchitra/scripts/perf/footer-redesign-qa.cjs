/* CHAPCHITRA owner footer refresh. QA runs only on CI localhost.
 * Visual evidence: exact compiled app footer, not a mocked static screenshot.
 * iPad/mobile WebKit are browser emulation, not physical devices.
 */
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const origin=(process.env.CC_FOOTER_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const out=path.resolve(process.env.CC_FOOTER_QA_OUT||'perf-results/shared-stage-footer');
fs.mkdirSync(out,{recursive:true});
const devices=[
 {id:'desktop-chromium',engine:chromium,width:1440,height:900,cols:4},
 {id:'tablet-webkit',engine:webkit,width:834,height:1112,cols:3},
 {id:'mobile-webkit',engine:webkit,width:390,height:844,cols:2,isMobile:true},
 {id:'narrow-chromium',engine:chromium,width:320,height:740,cols:2,isMobile:true}
];
const routes=['/','/shop/','/artists-edit/','/journal/','/about/','/favorites/'];
let cases=0,failed=0;
const errors=[];
function assert(device,route,label,ok,meta){
 cases++;
 if(!ok){failed++;console.error('FOOTER_FAIL '+JSON.stringify({device,route,label,meta}).slice(0,1300))}
}
async function run(device){
 const browser=await device.engine.launch({headless:true,
  executablePath:device.engine===chromium?process.env.CHROMIUM_PATH||undefined:undefined,
  args:device.engine===chromium?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:!!device.isMobile,hasTouch:!!device.isMobile,deviceScaleFactor:1,
   reducedMotion:'reduce'});
  const page=await context.newPage();
  const exceptions=[];
  page.on('pageerror',error=>exceptions.push(error.message));
  for(const route of device.width===320?['/']:routes){
   await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:60000});
   const footer=page.locator('.site-footer');
   await footer.waitFor({state:'visible',timeout:30000});
   await footer.scrollIntoViewIfNeeded();
   await footer.locator('.footer-identity .logo-word--footer img').evaluate(async img=>{
    if(typeof img.decode==='function')try{await img.decode()}catch{}
   });
   const details=await page.evaluate(()=>{
    const footer=document.querySelector('.site-footer');
    const grid=footer?.querySelector('.footer-grid');
    const brand=footer?.querySelector('.footer-identity');
    const logo=brand?.querySelector('.logo-word--footer img');
    const discover=footer?.querySelector('.footer-nav-discover');
    const help=footer?.querySelector('.footer-nav-help');
    const empty=footer?.querySelector('.footer-illustration-space');
    const social=[...footer?.querySelectorAll('.footer-social-entry')||[]];
    return {
     logoSrc:logo?.getAttribute('src'),logoLoaded:!!logo?.naturalWidth,
     tagline:brand?.querySelector('p')?.textContent,
     discover:[...discover?.querySelectorAll('a')||[]].map(x=>({text:x.textContent,url:x.getAttribute('href')})),
     discoverHeading:discover?.querySelector('h2')?.textContent,
     help:[...help?.querySelectorAll('.footer-help-pending')||[]].map(x=>x.textContent),
     helpHeading:help?.querySelector('h2')?.textContent,
     helpAnchors:help?.querySelectorAll('a').length,
     socials:social.map(x=>({tag:x.tagName,name:x.getAttribute('aria-label'),svg:x.querySelectorAll('svg').length,href:x.getAttribute('href')})),
     footerCopy:footer?.textContent||'',
     emptyChildren:empty?.childElementCount,emptyText:empty?.textContent,
     emptyBorder:empty?getComputedStyle(empty).borderWidth:null,
     parts:grid?.children.length,gridColumns:grid?getComputedStyle(grid).gridTemplateColumns.split(' ').length:null,
     overflow:footer?Math.round(footer.scrollWidth-footer.clientWidth):null,
     color:footer?getComputedStyle(footer).backgroundColor:null,
     copyright:footer?.querySelector('.footer-bottom')?.textContent,
    };
   });
   const label=device.id;
   assert(label,route,'real brand logo',details.logoSrc==='/assets/chapchitra-wordmark-cream-terra.webp'&&details.logoLoaded,details);
   assert(label,route,'tagline',details.tagline==='PEOPLE · PLACES · PRINTS');
   assert(label,route,'three Discover routes',JSON.stringify(details.discover.map(x=>x.url))===JSON.stringify(['/artists-edit/','/journal/','/about/'])&&details.discoverHeading==='Discover',details.discover);
   assert(label,route,'Help labels not fabricated links',JSON.stringify(details.help)===JSON.stringify(['Support','Terms & Conditions','Contact Us'])&&details.helpAnchors===0&&details.helpHeading==='Help',details.help);
   assert(label,route,'three accessible socials without unverified destination',details.socials.length===3&&details.socials.every(x=>x.tag==='SPAN'&&x.svg===1&&x.href===null&&x.name?.includes('profile link unavailable')),details.socials);
   assert(label,route,'no demo/shop/newsletter copy',!/(Art-led print and apparel demo|Pricing and sample imagery remain provisional|Join the print studio|All Samples|Shopping Bag|Checkout Preview|Favorites)/.test(details.footerCopy));
   assert(label,route,'four grid areas',details.parts===4);
   assert(label,route,'responsive CSS columns',details.gridColumns===device.cols,details.gridColumns);
   assert(label,route,'reserved art space is truly empty',details.emptyChildren===0&&details.emptyText===''&&details.emptyBorder==='0px',details);
   assert(label,route,'no footer horizontal overflow',details.overflow!==null&&details.overflow<=1,{overflow:details.overflow,width:device.width});
   assert(label,route,'approved olive background',details.color==='rgb(31, 34, 22)',details.color);
   assert(label,route,'original copyright strip',details.copyright?.includes('© 2026 CHAPCHITRA · V3 architectural prototype'));
   if(route==='/'){
    try{await footer.screenshot({path:path.join(out,device.id+'-footer.png'),animations:'disabled',timeout:30000})}
    catch(e){errors.push({device:label,screenshot:String(e)})}
   }
  }
  assert(device.id,'all','no browser page exceptions',exceptions.length===0,exceptions);
  await context.close();
 }finally{await browser.close()}
}
(async()=>{
 for(const device of devices){try{await run(device)}catch(e){errors.push({device:device.id,error:e.stack||String(e)})}}
 const report={origin,source:'Local built site Chromium / WebKit emulation, NOT physical iPad',
  cases,passed:cases-failed,failed,errors,devices:devices.map(x=>x.id),
  screenshots:devices.map(x=>x.id+'-footer.png')};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('FOOTER_QA '+JSON.stringify(report));
 if(failed||errors.length)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=3});
