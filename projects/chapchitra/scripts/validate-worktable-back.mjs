import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const hash=b=>createHash('sha256').update(b).digest('hex');
const entries=Object.freeze({
 regular:'4dfe2de4a4cca7a1730a801bb59d4bbf29cfa60a4ca82d0868d7ac673400aa24',
 dropShoulder:'97bbda67b4df4a210f3432cc86f8dfcecfe5bc725d7b288bf971460596427d68',
 fullSleeve:'4505c681629d629ea3dee1bd7d46575bebf79650ac192ffa45953a9d117b106d',
 hoodie:'b26e7771a605d79d217c6fcfb03001f35cada4894d82b830bede09c0a24b06af',
});
export async function validateBackViewAssets(root){
 const folder=resolve(root,'browser-assets/worktable');
 let data;
 try{data=JSON.parse(await readFile(resolve(folder,'back/manifest.json'),'utf8'))}
 catch(error){throw new Error('CHAPCHITRA back-view asset pack not installed: add the four supplied WebP variants and manifest before deployment. '+error.message)}
 if(data.schema!=='chapchitra-worktable-back/1'||
    data.originalCanvas?.join('x')!=='4000x2250'||
    data.designCanvas?.join('x')!=='2048x1152')throw new Error('Back-view canvas registration mismatch');
 let files=0,bytes=0;
 for(const [garment,expectedSha] of Object.entries(entries)){
  const item=data.assets?.[garment];
  if(item?.sha256!==expectedSha||item.original?.join('x')!=='4000x2250')
   throw new Error('Owner-supplied original SHA/dimensions mismatch: '+garment);
  const rect=item.delivery?.stageBox,crop=item.delivery?.crop,variants=item.delivery?.variants;
  // Crop is [left,top,width,height] in NATIVE 4000x2250 source pixels.
  if(!Array.isArray(crop)||crop.length!==4||crop.some(v=>!Number.isInteger(v))||
     crop[0]<0||crop[1]<0||crop[2]<1||crop[3]<1||
     crop[0]+crop[2]>4000||crop[1]+crop[3]>2250)
   throw new Error('Invalid back-view native alpha crop: '+garment);
  if(!Array.isArray(rect)||rect.length!==4||rect.some(v=>!Number.isFinite(v))||
    rect[2]<=0||rect[3]<=0||rect[0]<0||rect[1]<0||
    rect[0]+rect[2]>2048||rect[1]+rect[3]>1152||
    variants?.length!==3)throw new Error('Back registration or variant count invalid: '+garment);
  for(const width of [768,1536,2560]){
   const variant=variants.find(v=>v.path==='back/variants/'+garment+'.w'+width+'.webp');
   if(!variant||variant.bytes<1000||variant.width<10||variant.height<10||
      !/^[a-f0-9]{64}$/.test(variant.sha256))throw new Error('Back WebP metadata missing: '+garment+' '+width);
   const content=await readFile(resolve(folder,variant.path));
   if(content.length!==variant.bytes||hash(content)!==variant.sha256)
    throw new Error('Back asset hash mismatch: '+variant.path);
   files++;bytes+=content.length;
  }
 }
 return {garments:4,optimizedFiles:files,optimizedBytes:bytes,sourceCanvas:'4000x2250'};
}
