// C08 visual QA: only the current logo's dark-surface palette is under review.
const{chromium,webkit}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const output=path.resolve(__dirname,'../docs/c08-evidence/patch-restoration');
const base=process.env.C08_URL||'http://127.0.0.1:19189/';
const CREAM='rgb(228, 227, 222)',TERRA='rgb(138, 80, 59)';
const plans=[
 ['Chromium',chromium,'/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1234/chrome-linux/headless_shell'],
 ['WebKit',webkit,'/home/ubuntu/.cache/ms-playwright/webkit-2311/pw_run.sh']
];
const checks=[],logs=[];
function check(name,ok,data){checks.push({name,ok,details:data});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(data||{}))}
function short(x){return typeof x==='number'?Math.round(x*100)/100:x}
(async()=>{
await fs.mkdir(output,{recursive:true});
for(const [name,engine,binary] of plans){
 let browser;
 try {browser=await engine.launch({headless:true,executablePath:binary})}
 catch(error){check(name+' launch',false,{error:String(error)});continue}
 try{
  for(const width of [1408,834,430]){
   const page=await browser.newPage({viewport:{width,height:950},deviceScaleFactor:1});
   const exceptions=[];
   page.on('pageerror',e=>exceptions.push(e.message));
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:50000});
   await page.waitForFunction(()=>window.__chapchitraC08?.hero.ready===true,null,{timeout:45000});
   const init=await page.evaluate(()=>{
    const img=document.querySelector('.hero-brand-lockup').getBoundingClientRect(),
      stage=document.querySelector('#c08HeroStage').getBoundingClientRect();
    return{
      poster:document.querySelector('.hero-brand-lockup').getAttribute('src'),
      footer:document.querySelector('.logo-word--footer img').getAttribute('src'),
      navbar:document.querySelector('.logo-word--image img').getAttribute('src'),
      c08:window.__chapchitraC08,
      aligned:[img.x,img.y,img.width,img.height].every((x,i)=>Math.abs(x-[stage.x,stage.y,stage.width,stage.height][i])<1.2),
      overflowing:document.documentElement.scrollWidth>innerWidth+1,
      staticLogoReady:document.querySelector('.hero-brand-lockup').complete&&document.querySelector('.hero-brand-lockup').naturalWidth>0,
      playerInstances:[...document.scripts].filter(s=>s.src.includes('/motion/c01/vendor/lottie.min.js')).length,
      labels:[...document.querySelectorAll('#benefits .c01-copy h3')].map(x=>x.textContent)
    }
   });
   const ok=init.poster==='/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp' &&
     init.footer==='/assets/chapchitra-wordmark-cream-terra.webp' &&
     init.navbar==='/assets/chapchitra-wordmark.webp' &&
     init.staticLogoReady&&init.aligned&&!init.overflowing&&init.playerInstances===1 &&
     init.c08.hero.autoplay===1&&!init.c08.navbar.loaded &&
     JSON.stringify(init.labels)===JSON.stringify(['Original Art & Customization','Secure & Flexible Payment','Fast Delivery','24/7 Support']);
   check(name+' '+width+' responsive static and active logo URLs',ok,{aligned:init.aligned,overflow:init.overflowing,hero:init.poster,footer:init.footer,nav:init.navbar,frames:init.c08.hero.frame});
   for(const frame of [0,70,120,180,239]){
    await page.evaluate(f=>window.__chapchitraC08.seekHeroForQA(f),frame);
    await page.waitForTimeout(45);
    const state=await page.evaluate(()=>{
      const root=document.querySelector('.c08-hero-wordmark svg');
      let elements=[...root.querySelectorAll('path,rect,ellipse,circle,polygon')];
      elements=elements.filter(el=>!el.closest('defs,clipPath,mask'));
      const colors=[...new Set(elements.map(el=>getComputedStyle(el).fill).filter(v=>v!=='none'))];
      const colored=colors.filter(c=>c!=='rgb(0, 0, 0)'&&c!=='rgb(255, 255, 255)');
      return {colors,colored,painted:elements.length,frame:window.__chapchitraC08.hero.frame};
    });
    check(name+' '+width+' frame '+frame+' uses only Cream/Terracotta logo inks',
      state.colored.length>=1&&state.colored.every(c=>c===CREAM||c===TERRA)&&
      Math.abs(state.frame-frame)<.5,{colors:state.colored,frame:short(state.frame),painted:state.painted});
    if(width===1408&&[0,120,239].includes(frame)){
      const file='c08-patch-'+name.toLowerCase()+'-'+width+'-f'+frame+'.png';
      await page.locator('#hero').screenshot({path:path.join(output,file)});
    }
   }
   // WebKit can report a transient ResizeObserver delivery notice on initial
   // responsive image decode. It is a browser layout notification, not an app
   // exception; log it separately and fail for any other JS error.
   const browserNotices=exceptions.filter(e=>e==='ResizeObserver loop completed with undelivered notifications.');
   const appErrors=exceptions.filter(e=>e!=='ResizeObserver loop completed with undelivered notifications.');
   check(name+' '+width+' no application JavaScript exceptions',appErrors.length===0,{appErrors,browserNotices});
   if(width===1408){
    await page.locator('#footer').scrollIntoViewIfNeeded();
    await page.locator('#footer').screenshot({path:path.join(output,'c08-patch-'+name.toLowerCase()+'-footer.png')});
    const footer=await page.evaluate(()=>({
      static:document.querySelectorAll('#footer .c08-navbar-animation, #footer .c08-hero-wordmark').length===0,
      img:document.querySelector('#footer .logo-word--footer img').naturalWidth>0
    }));
    check(name+' footer static and decoded',footer.static&&footer.img,footer);
   }
   await page.close();
  }
  const reduced=await browser.newPage({viewport:{width:430,height:900},reducedMotion:'reduce'});
  await reduced.goto(base,{waitUntil:'domcontentloaded'});
  await reduced.waitForTimeout(300);
  const state=await reduced.evaluate(()=>({
    source:document.querySelector('.hero-brand-lockup')?.getAttribute('src'),
    ready:window.__chapchitraC08?.hero.ready,
    playing:window.__chapchitraC08?.hero.playing,
    nav:window.__chapchitraC08?.navbar.loaded
  }));
  check(name+' reduced-motion keeps corrected two-color static fallbacks',
    state.source==='/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp'&&!state.ready&&!state.playing&&!state.nav,state);
  await reduced.close();
 }finally{await browser.close()}
}
const result={base,checks,passed:checks.filter(x=>x.ok).length,total:checks.length};
await fs.writeFile(path.join(output,'c08-patch-qa.json'),JSON.stringify(result,null,2)+'\n');
console.log('RESULT',result.passed+'/'+result.total);
if(result.passed!==result.total)process.exitCode=1;
})().catch(e=>{console.error('C08 QA failed',e);process.exitCode=2});
