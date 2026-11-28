// Recompose only the twelve initial previews. No garment, desk, prop or
// source-master re-encoding; keep original checksummed layers for rollback.
import sharp from 'sharp';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {WORKTABLE_PREVIEW_STACK,WORKTABLE_GARMENT_ASSETS} from '../src/worktable-studio.mjs';
const root=resolve(import.meta.dirname,'../browser-assets/worktable');
const m=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const widths=[768,1536,2560];let previewBytes=0;
for(const [garment,garmentPath] of Object.entries(WORKTABLE_GARMENT_ASSETS)){
 const variants=[];
 for(const w of widths){
  const h=Math.round(w*9/16),composite=[];
  for(const original of WORKTABLE_PREVIEW_STACK){
   const key=original===WORKTABLE_GARMENT_ASSETS.regular?garmentPath:original,d=m[key].delivery,v=d.variants.find(v=>v.path.endsWith('.w'+w+'.webp'));
   const input=await readFile(resolve(root,v.path));
   if(createHash('sha256').update(input).digest('hex')!==v.sha256)throw Error('Input drift '+v.path);
   composite.push({input,left:Math.max(0,Math.min(w-v.width,Math.round(d.crop[0]*w/4000))),top:Math.max(0,Math.min(h-v.height,Math.round(d.crop[1]*w/4000))),blend:'over'});
  }
  const path='variants/preview/assembled-'+garment+'-svg3ea32afb-workers-v1.w'+w+'.webp';
  const bytes=await sharp({create:{width:w,height:h,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).webp({quality:94,alphaQuality:100,effort:5,smartSubsample:true}).toBuffer();
  await writeFile(resolve(root,path),bytes);previewBytes+=bytes.length;
  variants.push({path,width:w,height:h,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  await rm(resolve(root,'variants/preview/assembled-'+garment+'-svg3ea32afb.w'+w+'.webp'),{force:true});
 }
 m.__initialScene.garments[garment]={variants};
}
m.__initialScene.generatedFromLayers=[...WORKTABLE_PREVIEW_STACK];m.__initialScene.variants=m.__initialScene.garments.regular.variants;
await writeFile(resolve(root,'manifest.json'),JSON.stringify(m,null,2)+'\n');
const report=JSON.parse(await readFile(resolve(root,'optimization-report.json'),'utf8'));report.previewVariantBytes=previewBytes;report.totalVariantBytes=report.allVariantBytes+previewBytes;
await writeFile(resolve(root,'optimization-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('WORKER_FREE_PREVIEWS',previewBytes);
