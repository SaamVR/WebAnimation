const sharp=require('sharp');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'../..');
 const os=require('node:os');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cc-perf-master-'));
 const {installWorktableAssets}=await import('../worktable-assets.mjs');
 await installWorktableAssets(root,temp,{originalsOnly:true});
 const originals=path.join(temp,'assets/worktable/');
 const {WORKTABLE_SOURCE_STACK}=await import('../../src/worktable-studio.mjs');
 const after=path.join(root,'perf-results',process.argv[2]||'optimized-qa')+'/';
 const out=path.join(root,'docs/performance-evidence')+'/';
 fs.mkdirSync(out,{recursive:true});
 const files={regular:'Tshirts/walnut_table_background_exact_tone_4K_1.png',
 dropShoulder:'Tshirts/walnut_table_background_exact_tone_4K_2.png',
 fullSleeve:'Tshirts/walnut_table_background_exact_tone_4K-3.png',
 hoodie:'Tshirts/walnut_table_background_exact_tone_4K-4.png'};
 const cached=new Map();
 const sourceBuffer=async name=>{
  if(!cached.has(name))cached.set(name,await sharp(originals+name).resize(1440,810,{fit:'fill'}).png().toBuffer());
  return cached.get(name);
 };
 const composedSource=async garment=>{
  const overlays=[];
  for(const path of WORKTABLE_SOURCE_STACK){
   const key=path===files.regular?files[garment]:path;
   overlays.push({input:await sourceBuffer(key),left:0,top:0,blend:'over'});
  }
  return sharp({create:{width:1440,height:810,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(overlays).png().toBuffer();
 };
 const results=[];
 for(const [garment,file] of Object.entries(files)){
  const beforeSource=await composedSource(garment),afterPath=after+garment+'.png';
  const before=await sharp(beforeSource).resize(1440,810,{fit:'fill'}).removeAlpha().raw().toBuffer();
  const candidate=await sharp(afterPath).resize(1440,810,{fit:'fill'}).removeAlpha().raw().toBuffer();
  if(before.length!==candidate.length)throw Error('Screenshot dimension mismatch '+garment);
  const diff=Buffer.alloc(1440*810*4);
  let total=0,over8=0,over20=0,max=0;
  for(let i=0;i<before.length;i+=3){
   const dr=Math.abs(before[i]-candidate[i]),dg=Math.abs(before[i+1]-candidate[i+1]),db=Math.abs(before[i+2]-candidate[i+2]);
   const sum=dr+dg+db;total+=sum;max=Math.max(max,dr,dg,db);
   const delta=sum/3;if(delta>8)over8++;if(delta>20)over20++;
   const k=i/3*4;
   diff[k]=210;diff[k+1]=50;diff[k+2]=50;diff[k+3]=Math.min(255,Math.max(0,delta*6));
  }
  const mae=total/before.length, fractionOver8=over8/(1440*810), fractionOver20=over20/(1440*810);
  const result={garment,meanAbsoluteRGB:Math.round(mae*1000)/1000,over8Pct:Math.round(fractionOver8*10000)/100,over20Pct:Math.round(fractionOver20*10000)/100,maxChannelDelta:max};
  const downsizedBefore=await sharp(beforeSource).resize(960,540).png().toBuffer();
  const downsizedAfter=await sharp(afterPath).resize(960,540).png().toBuffer();
  const canvas=await sharp({create:{width:1920,height:572,channels:4,background:'#ffffff'}})
    .composite([{input:downsizedBefore,left:0,top:32},{input:downsizedAfter,left:960,top:32},{input:Buffer.from('<svg width="1920" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="1920" height="32" fill="#f8f8f6"/><text x="10" y="22" font-family="Arial" font-size="15" fill="#26362c">Before: reconstructed from original PNG layers</text><text x="970" y="22" font-family="Arial" font-size="15" fill="#26362c">After: browser-delivery worktable</text></svg>'),left:0,top:0}])
    .png().toBuffer();
  fs.writeFileSync(out+'/'+garment+'-comparison.png',canvas);
  await sharp(diff,{raw:{width:1440,height:810,channels:4}}).png().toFile(out+'/'+garment+'-difference.png');
  results.push(result);
 }
 fs.writeFileSync(out+'/visual-diff.json',JSON.stringify(results,null,2)+'\n');
 fs.rmSync(temp,{recursive:true,force:true});
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
