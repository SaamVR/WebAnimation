// One-time CHAPCHITRA Regular Tee back crop correction.
// Native source alpha >12 was measured on the owner PNG:
// visible [1134,375,2860,2081] vs all-nonzero [1009,245,2972,2224].
// The source remains pinned by its SHA and is never edited.
// Re-encode ONLY existing Regular Tee browser variants.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..','browser-assets/worktable');
const path=resolve(root,'back/manifest.json');
const manifest=JSON.parse(await readFile(path,'utf8'));
const original=manifest.assets.regular;
if(original.sha256!=='4dfe2de4a4cca7a1730a801bb59d4bbf29cfa60a4ca82d0868d7ac673400aa24')
 throw Error('Owner source identity changed');
const old=original.delivery.crop;
if(old.join(',')!=='1004,240,1973,1989')throw Error('Unknown or already migrated Regular Tee crop');
const preserved=Object.fromEntries(['dropShoulder','fullSleeve','hoodie'].map(k=>[k,JSON.stringify(manifest.assets[k])]));
const front=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'))
 ['Tshirts/walnut_table_background_exact_tone_4K_1.png'].bbox;
const visible={x0:1134,y0:375,x1:2860,y1:2081};
const padding=12;
const crop=[visible.x0-padding,visible.y0-padding,
 visible.x1-visible.x0+padding*2,visible.y1-visible.y0+padding*2];
const scale=(front[3]-front[1])/(visible.y1-visible.y0);
const stageBox=[
 (front[0]+front[2])/2-crop[2]*scale/2,
 front[1]-padding*scale,
 crop[2]*scale,crop[3]*scale
].map(v=>Math.round(v*10000)/10000);
if(stageBox[0]<0||stageBox[1]<0||stageBox[0]+stageBox[2]>2048||
   stageBox[1]+stageBox[3]>1152)throw Error('Unsafe stage registration');
const generated=[];
for(const v of original.delivery.variants){
 const source=resolve(root,v.path);
 const meta=await sharp(source).metadata();
 const map=(native,start,extent,out)=>Math.round((native-start)*out/extent);
 const left=map(crop[0],old[0],old[2],meta.width);
 const top=map(crop[1],old[1],old[3],meta.height);
 const right=map(crop[0]+crop[2],old[0],old[2],meta.width);
 const bottom=map(crop[1]+crop[3],old[1],old[3],meta.height);
 const sub={left,top,width:right-left,height:bottom-top};
 if(left<0||top<0||right>meta.width||bottom>meta.height||sub.width<10||sub.height<10)
  throw Error('Unsafe WebP crop '+JSON.stringify(sub));
 const bytes=await sharp(source).extract(sub)
  .webp({quality:98,alphaQuality:100,effort:5,smartSubsample:true}).toBuffer();
 const dims=await sharp(bytes).metadata();
 generated.push({
  source,bytes,entry:{path:v.path,width:dims.width,height:dims.height,
    bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}
 });
}
for(const k of Object.keys(preserved)){
 if(JSON.stringify(manifest.assets[k])!==preserved[k])throw Error('Nonregular garment drift: '+k);
}
original.delivery.crop=crop;original.delivery.stageBox=stageBox;
original.alphaBBoxStage=[visible.x0*2048/4000,visible.y0*1152/2250,
 visible.x1*2048/4000,visible.y1*1152/2250].map(x=>Math.round(x*1000)/1000);
original.registration={
 method:'alpha-threshold-visible-silhouette',
 threshold:12,
 nativeVisibleBounds:[visible.x0,visible.y0,visible.x1,visible.y1],
 nativePadding:padding,
 frontReferenceBBoxStage:front,
 source:'Owner original 4000x2250 RGBA PNG SHA-256 pinned in same manifest',
 preservedComponents:['dropShoulder','fullSleeve','hoodie']
};
for(const v of generated)await writeFile(v.source+'.calibrated',v.bytes);
original.delivery.variants=generated.map(v=>v.entry);
await writeFile(path+'.calibrated',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({visible,crop,stageBox,variants:original.delivery.variants,untouched:Object.keys(preserved)},null,2));
