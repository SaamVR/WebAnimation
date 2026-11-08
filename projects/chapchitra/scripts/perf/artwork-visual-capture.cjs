const {chromium}=require('playwright');
const sharp=require('sharp');
const fs=require('fs'),path=require('path');
const OUT=path.resolve('docs/performance-evidence/artwork-placement-20261108');
fs.mkdirSync(OUT,{recursive:true});
const BROWSERS=[['before','http://127.0.0.1:4398/artists-edit/'],['after','http://127.0.0.1:4399/artists-edit/']];
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
function colorQuadrants(){
 const w=480,h=600,px=Buffer.alloc(w*h*4);
 const qs=[[255,255,255],[249,225,16],[10,74,245],[232,20,37]];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const col=qs[+(x>=w/2)+2*+(y>=h/2)];
  const i=(y*w+x)*4;px[i]=col[0];px[i+1]=col[1];px[i+2]=col[2];px[i+3]=255;
 }
 return sharp(px,{raw:{width:w,height:h,channels:4}}).jpeg({quality:100,chromaSubsampling:'4:4:4'}).toBuffer();
}
async function capture(browser,label,url,width,height,image){
 const ctx=await browser.newContext({viewport:{width,height},serviceWorkers:'block',
  recordVideo:{dir:OUT,size:{width:Math.min(width,1280),height:Math.min(height,800)}}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('.cc-worktable-stage:not([aria-busy=true])').waitFor({timeout:70000});
 await page.waitForFunction(()=>!document.querySelector('.cc-worktable').classList.contains('is-hydrating'),null,{timeout:85000});
 await page.locator('.cc-worktable-choice[data-group=color][data-value=black]').click();
 await page.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.color==='black',null,{timeout:50000});
 await page.locator('#worktableFile').setInputFiles({name:'white-yellow-blue-red.jpg',mimeType:'image/jpeg',buffer:image});
 await page.locator('.cc-worktable-print.has-art').waitFor({timeout:15000});
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await page.waitForTimeout(400);
 const original=label+'-'+width+'-opaque-on-black.png';
 await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,original),animations:'disabled'});
 await page.waitForTimeout(250);
 await page.locator('.cc-worktable-choice[data-group=printSize][data-value=A3]').click();
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await page.waitForTimeout(250);
 const a3=label+'-'+width+'-A3-placement.png';
 await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,a3),animations:'disabled'});
 await page.locator('#worktableArtScale').fill(label==='before'?'75':'35');
 await page.locator('.cc-worktable-stage').scrollIntoViewIfNeeded();
 await page.waitForTimeout(150);
 const resize=label+'-'+width+'-resize.png';
 await page.locator('.cc-worktable-stage').screenshot({path:path.join(OUT,resize),animations:'disabled'});
 await page.waitForTimeout(300);
 await page.locator('#worktableResetArt').click();
 await page.waitForTimeout(200);
 const video=page.video();
 await ctx.close();
 const videoPath=await video.path();
 const target=label+'-'+width+'-workflow.webm';
 fs.copyFileSync(videoPath,path.join(OUT,target));
 console.log('CAPTURED',label,width,'videoBytes',fs.statSync(path.join(OUT,target)).size,'errors',errors);
 if(errors.length)throw Error(errors.join(';'));
}
async function pair(oldFile,newFile,result){
 const before=await sharp(path.join(OUT,oldFile)).resize({width:620}).png().toBuffer();
 const after=await sharp(path.join(OUT,newFile)).resize({width:620}).png().toBuffer();
 const m1=await sharp(before).metadata(),m2=await sharp(after).metadata();
 const head=42,fullH=Math.max(m1.height,m2.height)+head;
 const banner=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="42"><rect width="1240" height="42" fill="#F6F7F5"/><text x="310" y="26" font-family="Arial" font-size="15" font-weight="bold" text-anchor="middle" fill="#8A503B">BEFORE — MULTIPLY / OLD PLACEMENT</text><text x="930" y="26" font-family="Arial" font-size="15" font-weight="bold" text-anchor="middle" fill="#293D2D">AFTER — SOURCE-OVER / SAFE REFERENCE</text></svg>');
 await sharp({create:{width:1240,height:fullH,channels:4,background:'#F6F7F5'}})
  .composite([{input:banner,left:0,top:0},{input:before,left:0,top:head},{input:after,left:620,top:head}])
  .webp({quality:88,effort:5}).toFile(path.join(OUT,result));
 console.log('COMPARISON',result,fs.statSync(path.join(OUT,result)).size);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:chrome});
 const sample=await colorQuadrants();
 for(const [label,url] of BROWSERS)for(const [width,height] of [[1440,900],[390,844]]){
  await capture(browser,label,url,width,height,sample);
 }
 await pair('before-1440-opaque-on-black.png','after-1440-opaque-on-black.png','before-after-artwork-fidelity-desktop.webp');
 await pair('before-390-opaque-on-black.png','after-390-opaque-on-black.png','before-after-artwork-fidelity-mobile.webp');
 await pair('before-1440-A3-placement.png','after-1440-A3-placement.png','before-after-A3-placement.webp');
 await pair('before-1440-resize.png','after-1440-resize.png','before-after-signed-resize.webp');
 await browser.close();
})().catch(e=>{console.error('CAPTURE FAILED',e.stack||String(e));process.exitCode=2});
