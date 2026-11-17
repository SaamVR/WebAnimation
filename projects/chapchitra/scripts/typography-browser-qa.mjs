import {chromium,webkit} from 'playwright';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const BASE='http://127.0.0.1:4309';
const ROOT=resolve(import.meta.dirname,'..');
const OUT=resolve(ROOT,'perf-results/typography-review-20261117');
await mkdir(OUT,{recursive:true});
const qaDir=resolve(ROOT,'dist/qa/typography-bengali');
await mkdir(qaDir,{recursive:true});
await copyFile(resolve(ROOT,'scripts/typography-bengali-qa.html'),join(qaDir,'index.html'));

const routes=[
 {label:'home-hero',path:'/',selector:'.hero-cover h1'},
 {label:'values-more-than-a-tshirt',path:'/',selector:'#valuesTitle'},
 {label:'home-products',path:'/',selector:'#homeProducts .polaroid-name strong'},
 {label:'shop',path:'/shop/',selector:'#shopBannerTitle'},
 {label:'product-detail',path:'/product/',selector:'h1'},
 {label:'favorites',path:'/favorites/',selector:'h1'},
 {label:'cart',path:'/bag/',selector:'h1'},
 {label:'journal',path:'/journal/',selector:'h1'},
 {label:'about',path:'/about/',selector:'h1'},
 {label:'artists-edit',path:'/artists-edit/',selector:'h1'}
];
const devices=[
 {name:'desktop-chromium',engine:chromium,width:1440,height:900,mobile:false},
 {name:'ipad-webkit',engine:webkit,width:834,height:1112,mobile:false},
 {name:'mobile-chromium',engine:chromium,width:390,height:844,mobile:true}
];
const report={url:BASE,profiles:[],capturedAt:new Date().toISOString()};
for(const dev of devices){
 const res={name:dev.name,viewport:{width:dev.width,height:dev.height},pages:[],errors:[]};
 let browser,context,page;
 try{
  browser=await dev.engine.launch({headless:true,timeout:25000});
  context=await browser.newContext({
   viewport:res.viewport,isMobile:dev.mobile,hasTouch:dev.mobile||dev.name.startsWith('ipad'),
   reducedMotion:'reduce',deviceScaleFactor:1
  });
  page=await context.newPage();
  const badResponses=[];
  page.on('pageerror',e=>res.errors.push('JS '+e.message));
  page.on('response',response=>{
   const u=response.url();
   if(response.status()>=400&&u.startsWith(BASE))badResponses.push(response.status()+' '+u);
   if(/fonts.googleapis.com|fonts.gstatic.com/.test(u))badResponses.push('External font request '+u);
  });
  const init=async(path)=>{
   const resp=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>!!document.querySelector('#app')?.children.length,null,{timeout:22000});
   return resp.status();
  };
  await init('/shop/');
  const productLink=await page.evaluate(()=>{
   const a=document.querySelector('#shopProducts a[href*="/product/"]');
   return a?.getAttribute('href')||null;
  });
  res.productLink=productLink;
  for(const r of routes){
   let urlPath=r.path;
   if(r.label==='product-detail'){
    if(!productLink)throw Error('Shop did not render product detail link');
    urlPath=productLink;
   }
   const status=await init(urlPath);
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(150);
   const target=page.locator(r.selector).first();
   if(!await target.count())throw Error('Missing '+r.label+' selector '+r.selector);
   await target.scrollIntoViewIfNeeded({timeout:13000});
   await page.evaluate(()=>document.fonts.ready);
   const computed=await target.evaluate(el=>{
    const cs=getComputedStyle(el),b=el.getBoundingClientRect();
    return {family:cs.fontFamily,size:cs.fontSize,weight:cs.fontWeight,style:cs.fontStyle,
     lineHeight:cs.lineHeight,letterSpacing:cs.letterSpacing,
     text:el.textContent.trim().slice(0,105),left:b.left,right:b.right,top:b.top,bottom:b.bottom};
   });
   const overall=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
    fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,style:f.style,weight:f.weight})),
    headingOverflow:[...document.querySelectorAll('h1,h2,h3')].filter(x=>{
     const b=x.getBoundingClientRect();
     return b.width>0&&(b.right>innerWidth+3||b.left< -3);
    }).slice(0,8).map(x=>x.textContent.trim().slice(0,50))
   }));
   const fname=dev.name+'-'+r.label+'.png';
   await page.screenshot({path:join(OUT,fname)});
   const obj={route:r.label,url:urlPath,status,selector:r.selector,...computed,...overall,screenshot:fname};
   res.pages.push(obj);
   if(overall.scrollWidth>dev.width+2)res.errors.push(r.label+' horizontal overflow '+(overall.scrollWidth-dev.width)+'px');
   if(status!==200)res.errors.push(r.label+' HTTP '+status);
   if(r.label==='home-hero'&&!computed.family.includes('Fraunces'))res.errors.push('Hero not Fraunces');
   if(r.label==='home-products'&&(!computed.family.includes('DM Sans')||Number(computed.weight)<600))
    res.errors.push('Product card name must be DM Sans semibold');
   if(r.label==='product-detail'&&(!computed.family.includes('DM Sans')||Number(computed.weight)<600))
    res.errors.push('Product detail title must be DM Sans semibold');
   if(r.label==='shop'&&Number(computed.weight)<600)
    res.errors.push('Shop hero headline must be Fraunces semibold/bold');
   if(r.label==='artists-edit'&&!computed.family.includes('Fraunces'))res.errors.push('Artist Edit heading not Fraunces');
  }
  await page.goto(BASE+'/qa/typography-bengali/',{waitUntil:'domcontentloaded',timeout:15000});
  await page.evaluate(()=>document.fonts.load('600 42px "Noto Serif Bengali"','ছাপচিত্র'));
  await page.evaluate(()=>document.fonts.load('400 16px "Noto Sans Bengali"','শিল্প'));
  await page.evaluate(()=>document.fonts.ready);
  res.bengali=await page.evaluate(()=>{
   const h=document.querySelector('h1'),p=document.querySelector('p[lang=bn]');
   return {serif:getComputedStyle(h).fontFamily,sans:getComputedStyle(p).fontFamily,
    loadedSerif:document.fonts.check('600 42px "Noto Serif Bengali"','ছাপচিত্র'),
    loadedSans:document.fonts.check('400 16px "Noto Sans Bengali"','শিল্প'),
    headline:h.textContent,paragraph:p.textContent,overflow:document.documentElement.scrollWidth>innerWidth+2};
  });
  await page.screenshot({path:join(OUT,dev.name+'-bengali.png'),fullPage:true});
  if(!res.bengali.loadedSerif||!res.bengali.loadedSans||res.bengali.overflow)
   res.errors.push('Bengali script shaping/font check failed');
  res.errors.push(...badResponses);
  res.pass=res.errors.length===0;
 }catch(e){res.pass=false;res.failure=e.stack||String(e)}
 finally{if(context)await context.close();if(browser)await browser.close()}
 report.profiles.push(res);
 await writeFile(join(OUT,'browser-audit.json'),JSON.stringify(report,null,2));
 console.log('TYPO_PROFILE '+JSON.stringify({
  name:res.name,pass:res.pass,pages:res.pages.length,
  errors:res.errors.slice(0,12),failure:res.failure,
  routeHeadings:res.pages.filter(p=>['home-hero','values-more-than-a-tshirt','home-products','artists-edit'].includes(p.route)).map(p=>({route:p.route,font:p.family,size:p.size,weight:p.weight})),
  bengali:res.bengali
 }));
}
console.log('TYPO_SUMMARY '+JSON.stringify({pass:report.profiles.every(p=>p.pass),totalShots:report.profiles.reduce((sum,p)=>sum+p.pages.length+1,0)}));
if(report.profiles.some(p=>!p.pass))process.exitCode=1;
