// Exact-geometry C08 dark-surface static fallback recoloring.
// Input alpha and dimensions remain byte-identical after lossless encoding;
// every visible output pixel has the approved Cream or Terracotta RGB triplet.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const CREAM=[228,227,222];   // #E4E3DE
const TERRA=[138,80,59];    // #8A503B
const definitions=[
  {source:'scripts/c08-fallback-originals/chapchitra-full-on-dark-before.webp',
   current:'src/assets/chapchitra-full-on-dark.webp',
   named:'src/assets/chapchitra-full-on-dark-cream-terra.webp'},
  {source:'scripts/c08-fallback-originals/chapchitra-wordmark-light-before.webp',
   current:'src/assets/chapchitra-wordmark-light.webp',
   named:'src/assets/chapchitra-wordmark-cream-terra.webp'}
];
for (const {source,current,named} of definitions){
 const original=await readFile(resolve(root,source));
 const {data,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.channels!==4)throw Error('Unexpected fallback channel count');
 const pixels=Buffer.from(data);
 let cream=0,terracotta=0,shaded=0;
 for(let i=0;i<pixels.length;i+=4){
  const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
  const y=Math.floor(i/4/info.width);
  const greenExcess=(2*g-r-b);
  const luminance=.2126*r+.7152*g+.0722*b;
  // Printed textile icon is textured, not a flat polygon. Preserve its
  // original illustrated highlight/shadow geometry as variable coverage of
  // Terracotta ink, without introducing a third RGB hue.
  const isSymbol=info.height>500 && y<770;
  const neutralHighlight=greenExcess<=40 && Math.max(r,g,b)>=130;
  const isCream=isSymbol?neutralHighlight:(greenExcess<=40 && luminance>=100);
  const color=isCream?CREAM:TERRA;
  pixels[i]=color[0];pixels[i+1]=color[1];pixels[i+2]=color[2];
  if(!isCream){
   let coverage=1;
   if(isSymbol){
    coverage=Math.max(.13,Math.min(1,.19+(luminance/102)));
   } else if(luminance<100){
    coverage=Math.max(.12,Math.min(1,luminance/100));
   }
   pixels[i+3]=a?Math.max(1,Math.round(a*coverage)):0;
   if(coverage<.995)shaded++;
  }
  if(a){if(isCream)cream++;else terracotta++}
 }
 const pngLike=sharp(pixels,{raw:info});
 const output=await pngLike.webp({lossless:true,effort:6}).toBuffer();
 const {data:encoded,info:outInfo}=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(outInfo.width!==info.width||outInfo.height!==info.height)throw Error('Recolored logo dimensions changed');
 for(let i=0;i<pixels.length;i+=4){
  if((data[i+3]>0)!==(encoded[i+3]>0))throw Error('Recolored logo silhouette geometry changed');
  if(encoded[i+3] && !([CREAM,TERRA].some(c=>c[0]===encoded[i]&&c[1]===encoded[i+1]&&c[2]===encoded[i+2])))
   throw Error('Unexpected non-approved RGB in dark logo');
 }
 await writeFile(resolve(root,current),output);
 await writeFile(resolve(root,named),output);
 const checksum=createHash('sha256').update(output).digest('hex');
 console.log(JSON.stringify({source,current,named,dimensions:[info.width,info.height],creamPixels:cream,terraPixels:terracotta,tonalInkPixels:shaded,bytes:output.length,sha256:checksum}));
}
