const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const source='F:\\CHAPCHITRA_COMPACT_QA';
const dest=path.resolve(__dirname,'../docs/compact-evidence');
(async()=>{
 await fs.mkdir(dest,{recursive:true});
 const results=[];
 for(const width of [1408,430])for(let tone=0;tone<3;tone++){
  const before=path.join(source,'long-baseline-'+width+'-'+tone+'.png');
  const after=path.join(source,'long-after-'+width+'-'+tone+'.png');
  const a=await sharp(before).raw().toBuffer({resolveWithObject:true});
  const b=await sharp(after).raw().toBuffer({resolveWithObject:true});
  const dims=[a.info.width,a.info.height,b.info.width,b.info.height];
  if(dims[0]!==dims[2]||dims[1]!==dims[3])throw Error('Long button dimensions changed');
  let differing=0;
  for(let i=0;i<a.data.length;i++)if(a.data[i]!==b.data[i])differing++;
  results.push({width,tone,differingChannelSamples:differing,dimensions:dims.slice(0,2)});
  if(tone===0){
   await fs.copyFile(before,path.join(dest,'long-before-'+width+'.png'));
   await fs.copyFile(after,path.join(dest,'long-after-'+width+'.png'));
  }
 }
 await fs.writeFile(path.join(dest,'compact-long-pixel-equality.json'),JSON.stringify({results,totalDifferences:results.reduce((s,x)=>s+x.differingChannelSamples,0)},null,2)+'\n');
 console.log(JSON.stringify(results,null,2));
 if(results.some(x=>x.differingChannelSamples))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
