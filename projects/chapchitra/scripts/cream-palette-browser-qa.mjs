/**
 * CHAPCHITRA Cream palette — isolated PR comparison.
 * The BEFORE URL is the still-live approved staging site. AFTER is the local
 * built candidate. Never navigates via links that could change staging.
 * Only runs when explicitly invoked on the palette-review feature PR.
 */
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const before=(process.env.CC_PALETTE_BEFORE_ROOT||'https://chapchitra-webanimation.onrender.com').replace(/\/$/,'');
const after=(process.env.CC_QA_ROOT||'http://127.0.0.1:4272').replace(/\/$/,'');
const out=resolve(process.env.CC_PALETTE_OUT||'perf-results/shared-stage-cream-palette');
await mkdir(out,{recursive:true});
const profiles=[
 {name:'desktop-chromium',browser:chromium,width:1440,height:900},
 {name:'ipad-webkit',browser:webkit,width:834,height:1112}
];
const routes=[
 ['home','/'],['shop','/shop/'],['product',null],
 ['favorites','/favorites/'],['bag','/bag/'],
 ['artists-edit','/artists-edit/'],['journal','/journal/'],['about','/about/']
];
const capture=new Set(['home','shop','product','artists-edit','journal']);
const rows=[],problems=[],pairs=[];
const hexOld='#E4E3DE',hexNew='#F4EBE4';
const contrast=(x,y)=>{
 const lum=s=>{
  const v=(s.match(/\d+/g)||[]).slice(0,3).map(Number).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return v[0]*.2126+v[1]*.7152+v[2]*.0722;
 };
 const [h,l]=[lum(x),lum(y)].sort((a,b)=>b-a);
 return (h+.05)/(l+.05);
};
async function inspect(page,name,theme,phase){
 const data=await page.evaluate(()=>{
  const $=s=>document.querySelector(s);
  const root=getComputedStyle(document.documentElement);
  const sty=s=>$(s)?getComputedStyle($(s)):null;
  const rgb=s=>s?.color||null;
  return {
   theme:document.documentElement.dataset.theme,
   cream:root.getPropertyValue('--color-cream').trim().toUpperCase(),
   worktablePaper:sty('.cc-worktable')?.getPropertyValue('--cc-paper')?.trim()||null,
   header:sty('#siteHeader')?{fg:rgb(sty('#siteHeader')),bg:sty('#siteHeader').backgroundColor}:null,
   featured:sty('#featured')?{fg:rgb(sty('#featured')),bg:sty('#featured').backgroundColor}:null,
   footer:sty('.site-footer')?{fg:rgb(sty('.site-footer')),bg:sty('.site-footer').backgroundColor}:null,
   bodyPage:document.body.dataset.page,
   horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)
  };
 });
 rows.push({name,theme,phase,...data});
 const want=phase==='before'?hexOld:hexNew;
 if(data.cream!==want)problems.push(name+' '+theme+' '+phase+' '+page.url()+': Cream '+data.cream+' expected '+want);
 if(data.theme!==theme)problems.push(name+' '+theme+' '+phase+': wrong active theme '+data.theme);
 if(data.horizontalOverflow>2)problems.push(name+' '+theme+' '+phase+': horizontal overflow '+data.horizontalOverflow);
 if(theme==='dark'&&phase==='after'){
  for(const key of ['header','featured','footer']){
   const part=data[key];if(!part)continue;
   const ratio=contrast(part.fg,part.bg);
   if(!Number.isFinite(ratio)||ratio<4.5)problems.push(name+' dark '+key+': WCAG AA contrast '+ratio);
  }
 }
 return data;
}
async function openRoute(page,base,route,path){
 if(!path){
  await page.goto(base+'/shop/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.polaroid-name[href^="/product/"]').first().waitFor({timeout:30000});
  path=await page.locator('.polaroid-name[href^="/product/"]').first().getAttribute('href');
  if(!path)throw Error('Shop has no Product Detail link');
 }
 const response=await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded',timeout:60000});
 if(response?.status()!==200)throw Error(route+': HTTP '+response?.status());
 await page.locator('#siteHeader').waitFor({timeout:35000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>!document.documentElement.classList.contains('c02-pending'),null,{timeout:12000}).catch(()=>null);
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 return response;
}
async function takeShot(page,file,full=false){
 await page.screenshot({path:file,...(full?{fullPage:true}:{}),animations:'disabled',timeout:120000});
}
async function makePair(files,id){
 const width=640,gap=18;
 const images=[];
 for(const file of files){
  const b=await sharp(file).resize({width,withoutEnlargement:true}).png().toBuffer();
  images.push({input:b,top:0,left:images.length*(width+gap)});
 }
 const heights=await Promise.all(images.map(x=>sharp(x.input).metadata().then(m=>m.height)));
 const board=join(out,'comparison-'+id+'.png');
 await sharp({create:{width:width*2+gap,height:Math.max(...heights),channels:4,background:'#FFFFFF'}})
  .composite(images).png().toFile(board);
 pairs.push(board);
}
for(const profile of profiles){
 const browser=await profile.browser.launch({headless:true,timeout:90000});
 try{
  for(const theme of ['light','dark']){
   const shots=new Map();
   for(const [phase,base] of [['before',before],['after',after]]){
    const context=await browser.newContext({
     viewport:{width:profile.width,height:profile.height},
     deviceScaleFactor:1,colorScheme:theme,reducedMotion:'reduce',
     hasTouch:profile.name==='ipad-webkit'
    });
    await context.addInitScript(choice=>{
     try{localStorage.setItem('chapchitra-color-theme-v1',choice)}catch{}
    },theme);
    const page=await context.newPage();
    for(const [name,path] of routes){
     try{
      await openRoute(page,base,name,path);
      await inspect(page,name,theme,phase);
      if(capture.has(name)){
       const file=join(out,profile.name+'-'+theme+'-'+name+'-'+phase+'.png');
       await takeShot(page,file,name==='home');
       shots.set(name+'-'+phase,file);
      }
      if(name==='home'){
       const footer=page.locator('.site-footer');
       await footer.waitFor({timeout:9000});
       const file=join(out,profile.name+'-'+theme+'-footer-'+phase+'.png');
       await takeShot(footer,file);
       shots.set('footer-'+phase,file);
      }
     }catch(e){problems.push(profile.name+' '+theme+' '+phase+' '+name+': '+String(e).slice(0,400));}
    }
    await context.close();
   }
   for(const key of [...capture,'footer']){
    const left=shots.get(key+'-before'),right=shots.get(key+'-after');
    if(left&&right)await makePair([left,right],profile.name+'-'+theme+'-'+key);
    else problems.push(profile.name+' '+theme+' '+key+': missing matched screenshots');
   }
  }
 }finally{await browser.close();}
}
const report={review:'Creative approval pending — PR only; staging untouched',before,after,profiles:profiles.map(x=>x.name),routes:routes.map(x=>x[0]),screenshots:pairs.map(x=>x.split('/').pop()),rows,problems};
await writeFile(join(out,'cream-palette-qa.json'),JSON.stringify(report,null,2));
console.log('CREAM_PALETTE_QA '+JSON.stringify({tested:rows.length,matchedPairs:pairs.length,issues:problems.length,examples:problems.slice(0,8),output:out}));
if(problems.length)process.exitCode=1;
