/* On-device QA: real lottie-web renderer, exact final-pose posters, and owner review screenshots. */
const {chromium} = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root,'docs','c01-evidence');
const posters = path.join(root,'src','assets','c01','posters');
const endpoint = process.env.C01_URL || 'http://127.0.0.1:19118/';
const executablePath = process.env.C01_CHROMIUM;
const labels = [
 ['Custom Print Care','Thoughtful printing with room for customization.'],
 ['Easy Payment','Easy checkout with multiple payment methods.'],
 ['Delivery','Shipping updates with parcel delivery.'],
 ['Order Support','Support for print, artwork, sizing, and ordering.']
];
const names=['icon-01-print-care-v4.webp','icon-02-easy-payment-v2.webp','icon-03-delivery-v2.webp','icon-04-order-support-v2.webp'];
const report={endpoint,checkedAt:new Date().toISOString(),checks:[],errors:[],posters:[]};
function check(name,passed,info) {
 report.checks.push({name,passed,...(info?{detail:info}:{})});
 console.log((passed?'PASS':'FAIL')+' '+name+(info?' '+JSON.stringify(info):''));
}
async function ready(page) {
 await page.goto(endpoint,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#benefits').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>window.__chapchitraC01?.ready===true,{timeout:40000});
}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 await fs.mkdir(posters,{recursive:true});
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 try {
  const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push('console: '+m.text().slice(0,300));});
  await ready(page);
  const initial=await page.evaluate(()=>({
    copy:[...document.querySelectorAll('.c01-copy')].map(n=>[n.querySelector('h3').textContent,n.querySelector('p').textContent]),
    count:document.querySelectorAll('.c01-lottie svg').length,
    source:[...document.querySelectorAll('.c01-icon')].map(n=>n.getBoundingClientRect().width),
    duration:window.__chapchitraC01.duration, connectors:window.__chapchitraC01.connectors,
    ready:window.__chapchitraC01.ready, failed:window.__chapchitraC01.failed
  }));
  check('exact owner-locked copy',JSON.stringify(initial.copy)===JSON.stringify(labels));
  check('real lottie renderer 4 SVG',initial.count===4&&initial.ready&&!initial.failed);
  check('V3 connectors count and 10.27-second cycle',initial.connectors===3&&initial.duration===10.27);
  check('desktop icon dimensions match V3',initial.source.every(x=>x===72));
  const activation=await page.evaluate(()=>{
    const sample=t=>{
      window.__chapchitraC01.seekForQA(t);
      return [...document.querySelectorAll('.c01-icon-shell')].map(x=>Number(x.style.opacity));
    };
    return [sample(0),sample(2.7),sample(5.34),sample(7.73),sample(10.27)];
  });
  check('V3 future icons hidden at cycle start',activation[0][0]===1&&activation[0].slice(1).every(n=>n===0));
  check('V3 01 > 02 > 03 > 04 sequential reveal',
    activation[1][1]>.2&&activation[1][2]===0&&
    activation[2][2]>.2&&activation[2][3]===0&&
    activation[3][3]>.2&&activation[4].every(n=>n===1),activation);
  const connectors=await page.evaluate(()=>{
    const sample=t=>{
      window.__chapchitraC01.seekForQA(t);
      return [...document.querySelectorAll('.c01-connection-active')].map(p=>
        1-Number.parseFloat(p.style.strokeDashoffset)/p.getTotalLength());
    };
    return [sample(2.25),sample(2.445),sample(2.64),sample(5.085),sample(7.475)];
  });
  check('all three connector ramps preserve 390ms V3 timing',
    Math.abs(connectors[0][0])<.01 && Math.abs(connectors[1][0]-.5)<.025 &&
    Math.abs(connectors[2][0]-1)<.01 &&
    Math.abs(connectors[3][1]-.5)<.025 &&
    Math.abs(connectors[4][2]-.5)<.025,connectors);
  await page.evaluate(()=>window.__chapchitraC01.seekForQA(10.27));
  await page.waitForTimeout(320);
  for(let i=0;i<4;i++){
   await page.evaluate(index=>{
     document.querySelector('#c01Capture')?.remove();
     const original=document.querySelectorAll('.c01-lottie svg')[index];
     const wrapper=document.createElement('div');
     wrapper.id='c01Capture';
     Object.assign(wrapper.style,{position:'fixed',top:'0',left:'0',width:'512px',height:'512px',background:'#F6F7F5',overflow:'hidden',zIndex:'999999',pointerEvents:'none'});
     const svg=original.cloneNode(true);
     svg.setAttribute('width','512');svg.setAttribute('height','512');
     Object.assign(svg.style,{display:'block',width:'512px',height:'512px'});
     wrapper.appendChild(svg);document.body.appendChild(wrapper);
   },i);
   const png=await page.locator('#c01Capture').screenshot({animations:'disabled'});
   await sharp(png).webp({quality:94,effort:5}).toFile(path.join(posters,names[i]));
   report.posters.push({name:names[i],bytes:(await fs.stat(path.join(posters,names[i]))).size});
  }
  await page.evaluate(()=>document.querySelector('#c01Capture')?.remove());
  await page.locator('#benefits').screenshot({path:path.join(output,'c01-desktop-1280.png'),animations:'disabled'});
  for(const width of [834,430,320]){
   await page.setViewportSize({width,height:900});
   await page.locator('#benefits').scrollIntoViewIfNeeded();
   await page.evaluate(()=>window.__chapchitraC01.layoutForQA());
   await page.waitForTimeout(160);
   const info=await page.evaluate(()=>({
     overflow:document.documentElement.scrollWidth>innerWidth+1,
     icons:[...document.querySelectorAll('.c01-icon')].map(n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,w:r.width}}),
     lines:[...document.querySelectorAll('.c01-connection-active')].map(n=>({start:(()=>{let x=n.getPointAtLength(0);return[x.x,x.y]})(),end:(()=>{let x=n.getPointAtLength(n.getTotalLength());return[x.x,x.y]})()}))
   }));
   check('responsive no horizontal overflow '+width,!info.overflow);
   check('responsive correct icon count '+width,info.icons.length===4&&info.lines.length===3);
   if(width<681)check('vertical composition '+width,info.icons.every((v,i,a)=>i===0||v.y>a[i-1].y));
   else check('horizontal composition '+width,info.icons.every((v,i,a)=>i===0||v.x>a[i-1].x));
   await page.locator('#benefits').screenshot({path:path.join(output,'c01-'+width+'.png'),animations:'disabled'});
  }
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>window.__chapchitraC01.seekForQA(5.45));
  await page.locator('#benefits').scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.__chapchitraC01.resume());
  await page.waitForTimeout(200);
  check('single playback active in viewport',await page.evaluate(()=>window.__chapchitraC01.playing));
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForTimeout(350);
  check('offscreen paused',await page.evaluate(()=>!window.__chapchitraC01.playing));
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('#benefits').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  check('resume when re-entering viewport',await page.evaluate(()=>window.__chapchitraC01.playing));
  await context.close();
  const still=await browser.newContext({viewport:{width:430,height:900},reducedMotion:'reduce'});
  const sp=await still.newPage();
  await sp.goto(endpoint,{waitUntil:'domcontentloaded'});
  await sp.locator('#benefits').scrollIntoViewIfNeeded();
  await sp.waitForTimeout(750);
  const rm=await sp.evaluate(()=>({
    reduced:window.__chapchitraC01?.reduced,
    playing:window.__chapchitraC01?.playing,
    second:window.__chapchitraC01?.seconds,
    visible:[...document.querySelectorAll('.c01-poster')].every(n=>n.complete&&n.naturalWidth>0),
    connectors:[...document.querySelectorAll('.c01-connection-active')].length
  }));
  check('reduced-motion static pose + full connectors',rm.reduced===true&&rm.playing===false&&rm.second===10.27&&rm.visible&&rm.connectors===3,rm);
  await sp.locator('#benefits').screenshot({path:path.join(output,'c01-reduced-430.png')});
  await still.close();
  const vid=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,
    recordVideo:{dir:output,size:{width:1280,height:720}}});
  const vp=await vid.newPage();
  await ready(vp);
  await vp.evaluate(()=>{
    const section=document.getElementById('benefits');
    window.scrollTo(0,Math.max(0,window.scrollY+section.getBoundingClientRect().top-160));
    window.__chapchitraC01.seekForQA(0);
  });
  await vp.waitForTimeout(180);
  await vp.screenshot({path:path.join(output,'c01-recording-viewport.png')});
  await vp.evaluate(()=>window.__chapchitraC01.resume());
  await vp.waitForTimeout(10650);
  await vp.close();
  const recording=await vp.video().path();
  await fs.copyFile(recording,path.join(output,'c01-synchronized-lottie-playback.webm'));
  await vid.close();
  check('recorded original Lottie sequence', (await fs.stat(path.join(output,'c01-synchronized-lottie-playback.webm'))).size>10000);
 }finally{
  await browser.close();
  await fs.writeFile(path.join(output,'c01-browser-qa-report.json'),JSON.stringify(report,null,2)+'\n');
 }
 console.log('SUMMARY',report.checks.filter(c=>c.passed).length,'/',report.checks.length,'passes; browser errors',report.errors.length);
 console.log('ERRORS',report.errors.slice(0,10));
 if(report.checks.some(c=>!c.passed))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=2});
