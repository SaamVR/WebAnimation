// C08 Hero Slide 1: assemble two independently approved components.
// PATCH (upper part): original untouched green artwork, exact source pixels.
// WORDMARK (lower part): previously approved Cream + Terracotta raster,
//                        copied without recoloring. C08 Lottie is independent.
// Never apply palette remapping, canvas filters or tint to the clothing patch.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const sourcePath='scripts/c08-fallback-originals/chapchitra-full-on-dark-before.webp';
const wordmarkPath='scripts/c08-fallback-originals/chapchitra-full-terracotta-before-patch-restoration.webp';
const originalSourceSHA='d4298171361cf355eeea2d92a4d93b713397afbba11db49323115ea94de4d0d9';
const approvedWordmarkSourceSHA='3acec051748757e05501e759f497c938e69097b6c0f88f19c5a6c3bb6f288f00';
const footerPath='src/assets/chapchitra-wordmark-cream-terra.webp';
const footerSHA='e9b70e1af14dc71c2c065777415998c874c8af5517ac480297c127f1f6c489c5';
// The textile fibers taper to transparent by source row 774; the existing
// roller begins at row 775. This is a source-verified separation line.
// Do not change without inspecting the original raster.
const PATCH_END_Y=775;
const outputs=[
 'src/assets/chapchitra-full-on-dark.webp',
 'src/assets/chapchitra-full-on-dark-cream-terra.webp',
 'src/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp'
];

const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const originalBytes=await readFile(resolve(root,sourcePath));
const wordmarkBytes=await readFile(resolve(root,wordmarkPath));
if(sha(originalBytes)!==originalSourceSHA)throw Error('Original approved green clothing-patch source changed');
if(sha(wordmarkBytes)!==approvedWordmarkSourceSHA)throw Error('Approved Cream/Terracotta static wordmark source changed');
if(sha(await readFile(resolve(root,footerPath)))!==footerSHA)throw Error('Unrelated footer was modified');

const [patch,wordmark]=await Promise.all([
 sharp(originalBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),
 sharp(wordmarkBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true})
]);
const {width,height,channels}=patch.info;
if(width!==1250||height!==1052||channels!==4||wordmark.info.width!==width||
 wordmark.info.height!==height||wordmark.info.channels!==4)throw Error('Source artwork geometry mismatch');

const split=PATCH_END_Y*width*4;
const pixels=Buffer.from(wordmark.data); // All lower wordmark pixels are approved.
patch.data.copy(pixels,0,0,split); // Original green patch: no palette conversion.
// Preserve the source's final extremely faint textile antialias strands,
// even beyond row 774. The new roller starts at x>=850, and wordmark letters
// only begin below row 835; these few pixels cannot overlap the lower logo.
const PATCH_FRINGE_LIMIT_Y=830;
const PATCH_FRINGE_LIMIT_X=840;
for(let y=PATCH_END_Y;y<PATCH_FRINGE_LIMIT_Y;y++){
  const a=y*width*4;
  patch.data.copy(pixels,a,a,a+PATCH_FRINGE_LIMIT_X*4);
}
const isPatchPixel=index=>{
  const offset=index/4;
  const y=Math.floor(offset/width),x=offset%width;
  return y<PATCH_END_Y||(y<PATCH_FRINGE_LIMIT_Y&&x<PATCH_FRINGE_LIMIT_X);
};

const result=await sharp(pixels,{raw:patch.info}).webp({lossless:true,effort:6}).toBuffer();
const out=await sharp(result).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(out.info.width!==width||out.info.height!==height||out.info.channels!==4)
 throw Error('Composed logo lost original geometry');
let originalPatchPixels=0,approvedWordmarkPixels=0;
for(let index=0;index<out.data.length;index+=4){
 const approved=isPatchPixel(index)?patch.data:wordmark.data;
 // Pixels with alpha 0 are not displayed and their RGB values are undefined
 // across WebP decoders. Every visible original pixel must match *exactly*.
 for(let j=0;j<4;j++){
  if(j===3||approved[index+3]!==0){
   if(out.data[index+j]!==approved[index+j])
    throw Error('Pixel fidelity changed at index '+index+' channel '+j);
  }
 }
 if(out.data[index+3]>0){
  if(isPatchPixel(index))originalPatchPixels++;
  else approvedWordmarkPixels++;
 }
}
if(originalPatchPixels<200000||approvedWordmarkPixels<50000)
 throw Error('Composed hero is missing the patch or wordmark');

for(const file of outputs)await writeFile(resolve(root,file),result);
console.log(JSON.stringify({
  kind:'C08 approved original green patch plus independently approved Cream/Terracotta wordmark',
  sourcePath,wordmarkPath,patchRows:[0,PATCH_END_Y-1],patchFringeRows:[PATCH_END_Y,PATCH_FRINGE_LIMIT_Y-1],wordmarkRows:[PATCH_END_Y,height-1],
  width,height,originalPatchPixels,approvedWordmarkPixels,
  sha256:sha(result),bytes:result.length,outputs,footerUnchanged:true
},null,2));
