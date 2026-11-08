const {webkit}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const base=process.env.C08_URL||'http://127.0.0.1:19289/';
const output=path.resolve(__dirname,'../docs/c08-evidence');
const checks=[];
function verify(ok,label,detail){checks.push({label,passed:!!ok,detail});console.log(ok?'PASS':'FAIL',label,JSON.stringify(detail||{}))}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const b=await webkit.launch({headless:true});
 try{
 for(const width of [1408,834,430,320]){
  const p=await b.newPage({viewport:{width,height:920}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__chapchitraC08?.hero.ready===true,null,{timeout:45000});
  const init=await p.evaluate(()=>({
   hero:window.__chapchitraC08.hero,
   nav:window.__chapchitraC08.navbar,
   scripts:[...document.scripts].filter(x=>x.src.includes('lottie.min.js')).length,
   navCenter:(()=>{let x=document.querySelector('.logo-word--image').getBoundingClientRect();return x.left+x.width/2})(),
   heroRect:(()=>{let x=document.querySelector('.hero-brand-lockup').getBoundingClientRect();return [x.left,x.top,x.width,x.height]})(),
   overlayRect:(()=>{let x=document.querySelector('#c08HeroStage').getBoundingClientRect();return [x.left,x.top,x.width,x.height]})(),
   overflow:document.documentElement.scrollWidth>innerWidth+1
  }));
  verify(init.hero.autoplay===1&&init.hero.playing&&!init.nav.loaded&&!init.nav.playing,
    'WebKit initial hero-only autoplay '+width,init);
  verify(init.scripts===1&&!init.overflow&&Math.abs(init.navCenter-width/2)<1.5&&init.heroRect.every((x,i)=>Math.abs(x-init.overlayRect[i])<1.2),
    'WebKit shared player and original geometry '+width,init);
  await p.waitForFunction(()=>window.__chapchitraC08.hero.completed===1,null,{timeout:10000});
  verify(await p.evaluate(()=>window.__chapchitraC08.hero.frame===239&&!window.__chapchitraC08.hero.playing),
    'WebKit final held without looping '+width);
  if(width===1408){
   await p.locator('.logo-word--image').hover();
   await p.waitForFunction(()=>window.__chapchitraC08.navbar.completed===1,null,{timeout:9000});
   verify((await p.evaluate(()=>window.__chapchitraC08.navbar.completed))===1,'WebKit navbar hover plays once');
   await p.waitForTimeout(380);
   verify((await p.evaluate(()=>window.__chapchitraC08.navbar.completed))===1,'WebKit navbar pointer hold does not repeat');
   await p.locator('#footer').scrollIntoViewIfNeeded();
   const f=await p.evaluate(()=>({src:document.querySelector('#footer .logo-word--footer img')?.getAttribute('src'),instances:document.querySelectorAll('#footer .c08-navbar-animation,#footer .c08-hero-wordmark').length}));
   verify(f.src==='/assets/chapchitra-wordmark-cream-terra.webp'&&f.instances===0,'WebKit footer remains static',f);
  }
  verify(errors.length===0,'WebKit no JavaScript errors '+width,errors);
  if([1408,430].includes(width)){
   await p.locator('#hero').screenshot({path:path.join(output,'c08-webkit-hero-'+width+'.png')});
  }
  await p.close();
 }
 const reduced=await b.newPage({viewport:{width:430,height:900},reducedMotion:'reduce'});
 await reduced.goto(base,{waitUntil:'domcontentloaded'});
 await reduced.waitForTimeout(500);
 const state=await reduced.evaluate(()=>({hero:window.__chapchitraC08?.hero,nav:window.__chapchitraC08?.navbar,visible:getComputedStyle(document.querySelector('.hero-brand-lockup')).display!=='none'}));
 verify(state.visible&&!state.hero?.playing&&!state.hero?.ready&&!state.nav?.loaded,'WebKit reduced-motion static logo',state);
 await reduced.close();
 }finally{await b.close()}
 await fs.writeFile(path.join(output,'c08-webkit-qa.json'),JSON.stringify({url:base,checks},null,2));
 console.log('WEBKIT SUMMARY',checks.filter(x=>x.passed).length+'/'+checks.length);
 if(checks.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
