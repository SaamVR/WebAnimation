/**
 * Rebuild browser-delivery artwork from checksummed 4000×2250 original archive.
 * Sources/master archive and SHA256 entries are never modified.
 * Run: npm run optimize:artwork
 */
import sharp from 'sharp';
import {WORKTABLE_PREVIEW_STACK,WORKTABLE_GARMENT_ASSETS} from '../src/worktable-studio.mjs';
import {readFile, writeFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {tmpdir} from 'node:os';
import {installWorktableAssets} from './worktable-assets.mjs';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const masterStage=await mkdtemp(join(tmpdir(),'chapchitra-artmasters-'));
try{
await installWorktableAssets(root,masterStage,{originalsOnly:true});
const source=resolve(masterStage,'assets/worktable');

const target=resolve(root,'browser-assets/worktable');
const manifest=JSON.parse(await readFile(resolve(source,'manifest.json'),'utf8'));
const widths=[768,1536,2560];
const f=(n)=>Math.round(n*100000)/100000;
const stageFactor=2048/4000;
let total=0, original=0, entries=0;
const delivery={};
await mkdir(target,{recursive:true});
for(const [key,entry] of Object.entries(manifest)){
 // Full-composition references are QA-only, not runtime media.
 if(key.startsWith('Full composition/'))continue;
 const input=resolve(source,entry.path.replace("assets/worktable/",""));
 const bytes=await readFile(input);
 const sourceHash=createHash('sha256').update(bytes).digest('hex');
 if(sourceHash!==entry.sha256)throw new Error('Master checksum drift: '+key);
 original+=bytes.length;
 const b=entry.bbox;
 const x=Math.max(0,Math.floor(b[0]/stageFactor)-3);
 const y=Math.max(0,Math.floor(b[1]/stageFactor)-3);
 const right=Math.min(4000,Math.ceil(b[2]/stageFactor)+3);
 const bottom=Math.min(2250,Math.ceil(b[3]/stageFactor)+3);
 const crop={left:x,top:y,width:right-x,height:bottom-y};
 if(crop.width<1||crop.height<1)throw new Error('Empty alpha crop for '+key);
 const stageBox=[f(x*stageFactor),f(y*stageFactor),f(crop.width*stageFactor),f(crop.height*stageFactor)];
 const variants=[];
 for(const viewWidth of widths){
  const scaledWidth=Math.max(1,Math.round(crop.width*viewWidth/4000));
  const filePath='variants/'+key.replace(/\.png$/i,'.w'+viewWidth+'.webp');
  const output=resolve(target,filePath);
  await mkdir(dirname(output),{recursive:true});
  const result=await sharp(bytes,{limitInputPixels:16e6})
    .extract(crop).resize({width:scaledWidth,kernel:'lanczos3'})
    .webp({quality:94,alphaQuality:100,effort:5,smartSubsample:true})
    .toBuffer();
  await writeFile(output,result);
  const {width,height}=await sharp(result).metadata();
  variants.push({path:filePath,width,height,bytes:result.length,sha256:createHash('sha256').update(result).digest('hex')});
  total+=result.length;
 }
 delivery[key]={...entry,delivery:{crop:[crop.left,crop.top,crop.width,crop.height],stageBox,variants}};
 entries++;
 if(entries%8===0)console.log('optimized',entries,'assets',Math.round(total/1024),'KiB');
}

const allScenes={};
let previewBytes=0;
for(const [garment,garmentPath] of Object.entries(WORKTABLE_GARMENT_ASSETS)){
 const sceneVariants=[];
 for(const viewWidth of widths){
  const height=Math.round(viewWidth*9/16);
  const composite=[];
  for(const originalPath of WORKTABLE_PREVIEW_STACK){
   const key=originalPath===WORKTABLE_GARMENT_ASSETS.regular?garmentPath:originalPath;
   const info=delivery[key].delivery;
   const v=info.variants.find(v=>v.path.endsWith('.w'+viewWidth+'.webp'));
   const left=Math.min(viewWidth-v.width,Math.round(info.crop[0]*viewWidth/4000));
   const top=Math.min(height-v.height,Math.round(info.crop[1]*viewWidth/4000));
   composite.push({input:await readFile(resolve(target,v.path)),left:Math.max(0,left),top:Math.max(0,top),blend:'over'});
  }
  const outPath='variants/preview/assembled-'+garment+'-svg3ea32afb.w'+viewWidth+'.webp';
  const image=await sharp({create:{width:viewWidth,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(composite).webp({quality:94,alphaQuality:100,effort:5,smartSubsample:true}).toBuffer();
  await mkdir(dirname(resolve(target,outPath)),{recursive:true});
  await writeFile(resolve(target,outPath),image);
  previewBytes+=image.length;
  sceneVariants.push({path:outPath,width:viewWidth,height,bytes:image.length,sha256:createHash('sha256').update(image).digest('hex')});
 }
 allScenes[garment]={variants:sceneVariants};
 console.log('assembled garment scene',garment,sceneVariants.map(x=>x.bytes));
}
// Old composition URLs contained the baked raster upload icon. Remove those
// exact old preview variants so every published scene is icon-free.
for(const garment of Object.keys(WORKTABLE_GARMENT_ASSETS)){
 for(const viewWidth of widths){
  await rm(resolve(target,'variants/preview/assembled-'+garment+'.w'+viewWidth+'.webp'),{force:true});
 }
}
delivery.__initialScene={generatedFromLayers:WORKTABLE_PREVIEW_STACK,
 variants:allScenes.regular.variants,garments:allScenes};

await writeFile(resolve(target,'manifest.json'),JSON.stringify(delivery,null,2)+'\n');
const summary={runtimeOriginalAssets:entries,runtimeMasterBytes:original,allVariantBytes:total,previewVariantBytes:previewBytes,totalVariantBytes:total+previewBytes,variantsPerLayer:widths,sourceArchivePreserved:true};
await writeFile(resolve(target,'optimization-report.json'),JSON.stringify(summary,null,2)+'\n');
console.log('ARTWORK OPTIMIZATION:',JSON.stringify(summary));

}finally{await rm(masterStage,{recursive:true,force:true})}
