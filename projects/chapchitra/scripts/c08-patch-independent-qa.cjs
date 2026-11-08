// Independent pixel-level QA for C08 original clothing patch restoration.
// This is a local development QA script, not a Render build dependency.
const sharp=require('sharp');
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sources=[
 'scripts/c08-fallback-originals/chapchitra-full-on-dark-before.webp',
 'scripts/c08-fallback-originals/chapchitra-full-terracotta-before-patch-restoration.webp',
 'src/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp'
];
(async()=>{
 const bs=await Promise.all(sources.map(n=>fs.readFile(path.join(root,n))));
 const rs=await Promise.all(bs.map(x=>sharp(x).ensureAlpha().raw().toBuffer({resolveWithObject:true})));
 const width=1250,height=1052;
 if(rs.some(x=>x.info.width!==width||x.info.height!==height||x.info.channels!==4))throw Error('Dimension mismatch');
 const output=rs[2].data;let patch=0,wordmark=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4;
   const original=(y<775 || (y<830&&x<840))?rs[0].data:rs[1].data;
   for(let c=0;c<4;c++){
     if(c===3||original[i+3]){
       if(output[i+c]!==original[i+c])
         throw Error('Original patch or approved wordmark pixel changed at '+x+','+y+' RGBA '+c);
     }
   }
   if(output[i+3]){if(original===rs[0].data)patch++;else wordmark++;}
 }
 const png=path.join(root,'docs/c08-evidence/patch-restoration');
 const crop={left:615,top:90,width:180,height:157};
 const frameNames=['c08-patch-chromium-1408-f0.png','c08-patch-chromium-1408-f120.png','c08-patch-chromium-1408-f239.png'];
 const rasters=await Promise.all(frameNames.map(name=>sharp(path.join(png,name)).extract(crop).raw().toBuffer()));
 const diffs=rasters.slice(1).map(r=>{let count=0;for(let i=0;i<r.length;i++)if(r[i]!==rasters[0][i])count++;return count;});
 if(diffs.some(Boolean))throw Error('Clothing patch visibly changed during C08 frame progression');
 const footer=await fs.readFile(path.join(root,'src/assets/chapchitra-wordmark-cream-terra.webp'));
 if(sha(footer)!=='e9b70e1af14dc71c2c065777415998c874c8af5517ac480297c127f1f6c489c5')throw Error('Footer changed');
 const result={status:'PASS',sourceHashes:sources.map((n,i)=>({name:n,sha256:sha(bs[i])})),width,height,
  patchVisibleSourcePixels:patch,approvedWordmarkVisibleSourcePixels:wordmark,
  screenshotPatchCrop:crop,frameComparisonDiffChannelSamples:diffs,footerUnchanged:true};
 await fs.writeFile(path.join(png,'c08-patch-pixel-qa.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
