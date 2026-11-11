const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..','..'),repo=path.resolve(root,'..','..');
const back=JSON.parse(fs.readFileSync(path.join(root,'browser-assets/worktable/back/manifest.json')));
const reg=back.assets.regular,origCrop=[1004,240,1973,1989],crop=reg.delivery.crop;
const result=[];
(async()=>{
 for(const v of reg.delivery.variants){
  const relative='projects/chapchitra/browser-assets/worktable/'+v.path;
  const originalBytes=cp.execFileSync('git',['show','5397801fe04af8b653ecb5f6103e3fd3f5deeb50:'+relative],{cwd:repo,maxBuffer:3e6});
  const old=await sharp(originalBytes).metadata();
  const n=(x,start,len,size)=>Math.round((x-start)*size/len);
  const x=n(crop[0],origCrop[0],origCrop[2],old.width),
   y=n(crop[1],origCrop[1],origCrop[3],old.height),
   right=n(crop[0]+crop[2],origCrop[0],origCrop[2],old.width),
   bottom=n(crop[1]+crop[3],origCrop[1],origCrop[3],old.height);
  const cut=await sharp(originalBytes).extract({left:x,top:y,width:right-x,height:bottom-y})
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=fs.readFileSync(path.join(root,'browser-assets/worktable',v.path));
  const now=await sharp(b).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(cut.info.width!==now.info.width||cut.info.height!==now.info.height)throw Error('Geometry drift');
  let alphaDelta=0,rgbDelta=0,maxAlpha=0,pixels=0;
  for(let i=0;i<now.data.length;i+=4){
   const da=Math.abs(now.data[i+3]-cut.data[i+3]);
   alphaDelta+=da;maxAlpha=Math.max(maxAlpha,da);
   if(cut.data[i+3]>=12){
    rgbDelta+=Math.abs(now.data[i]-cut.data[i])+Math.abs(now.data[i+1]-cut.data[i+1])+Math.abs(now.data[i+2]-cut.data[i+2]);
    pixels++;
   }
  }
  result.push({path:v.path,width:now.info.width,height:now.info.height,
    meanAlphaDifference:alphaDelta/(now.data.length/4),maxAlphaDifference:maxAlpha,
    meanVisibleRgbDifference:rgbDelta/(3*pixels),
    originalBytes:originalBytes.length,optimizedBytes:b.length,
    sourceSHA256:v.sha256,
    preservedAlpha:alphaDelta===0});
 }
 const report={source:'Git committed previous WebPs vs corrected, same-pixel crop',
  variants:result,allAlphaExact:result.every(x=>x.preservedAlpha)};
 fs.mkdirSync(path.join(root,'perf-results/three-fixes-regular-alpha'),{recursive:true});
 fs.writeFileSync(path.join(root,'perf-results/three-fixes-regular-alpha/report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 if(!report.allAlphaExact)process.exitCode=2;
})().catch(e=>{console.error(e);process.exitCode=3});
