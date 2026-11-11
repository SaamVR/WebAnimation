const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const oldUrl='https://chapchitra-webanimation.onrender.com/artists-edit/review/5397801fe04af8b653ecb5f6103e3fd3f5deeb50/';
const newUrl=process.env.CC_QA_URL||'http://127.0.0.1:4479/artists-edit/';
const folder=path.resolve('perf-results/three-fixes-regular-compare');fs.mkdirSync(folder,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const results={};
 try{
  for(const [label,url] of [['before',oldUrl],['after',newUrl]]){
   const p=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
   await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await p.locator('.cc-worktable-stage:not([aria-busy="true"])').waitFor({timeout:90000});
   await p.locator('.cc-worktable-garment-surface').waitFor({timeout:20000});
   await p.locator('.cc-worktable-frame').screenshot({path:path.join(folder,label+'-regular-front.png')});
   await p.getByRole('button',{name:'View back'}).click();
   await p.waitForFunction(()=>document.querySelector('.cc-worktable-garment-surface')?.dataset.side==='back',{timeout:30000});
   await p.locator('.cc-worktable-frame').screenshot({path:path.join(folder,label+'-regular-back.png')});
   results[label]=await p.evaluate(()=>{
    const c=document.querySelector('.cc-worktable-garment-surface'),stage=document.querySelector('.cc-worktable-stage');
    const sr=stage.getBoundingClientRect(),r=c.getBoundingClientRect(),width=c.width,height=c.height;
    const rgba=c.getContext('2d').getImageData(0,0,width,height).data;
    let x0=width,y0=height,x1=0,y1=0,area=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
     if(rgba[(y*width+x)*4+3]<12)continue;
     area++;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;
    }
    const b={left:(r.left-sr.left+x0/width*r.width)/sr.width*2048,
     top:(r.top-sr.top+y0/height*r.height)/sr.height*1152,
     right:(r.left-sr.left+(x1+1)/width*r.width)/sr.width*2048,
     bottom:(r.top-sr.top+(y1+1)/height*r.height)/sr.height*1152};
    return {canvas:{w:width,h:height},visibleAlphaBBoxStage:b,
     visibleWidth:b.right-b.left,visibleHeight:b.bottom-b.top,centerX:(b.left+b.right)/2,
     viewRowOutsideStage:!stage.contains(document.querySelector('.cc-worktable-view-row'))};
   });
   await p.close();
  }
 }finally{await browser.close()}
 const before=results.before,after=results.after;
 const checks=[
  {name:'new back not narrower than 94% of approved front',pass:after.visibleWidth>=869},
  {name:'new back vertical height approximately 878 stage units',pass:Math.abs(after.visibleHeight-877.568)<14},
  {name:'new back width materially larger than prior',pass:after.visibleWidth>before.visibleWidth*1.1},
  {name:'new back horizontally centered',pass:Math.abs(after.centerX-1022.976)<12},
  {name:'footer removed',pass:after.viewRowOutsideStage===false&&before.viewRowOutsideStage===true},
 ];
 const report={oldUrl,newUrl,results,checks,passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length};
 fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 if(report.failed)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exitCode=3});
