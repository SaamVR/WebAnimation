// CHAPCHITRA C06: verify the original Illustrator SVG and install only approved
// paint variants, with no extraction dependency, redraw or geometry change.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const checksum=data=>createHash('sha256').update(data).digest('hex');
const zipFile=resolve(import.meta.dirname,'c06-originals/Long SVG approved variants.zip');
const sourceHash='cd01ccbf86bf819fc65319abc685b39b5586e113200197a859e9b87333bdb3cf';
export const variants=Object.freeze({
 'forest':'f78a05d7aee295318bc78a6378f08ceaf30ec74c97727ed075d1e5d1bd359f32',
 'terracotta':'092dddf594e4a00bf76f702ce4e13d5b4fd9abefdfbe984119c598778536c6ef',
 'neutral':'28b6a8d47f8e417907333751f59c00ef27c4d7843bed171f3f62c9223ef44d9e'
});
function unzip(data){
 const files=new Map();let pos=0;
 while(pos+30<=data.length&&data.readUInt32LE(pos)===0x04034b50){
  const flags=data.readUInt16LE(pos+6),method=data.readUInt16LE(pos+8);
  const size=data.readUInt32LE(pos+18),nameLen=data.readUInt16LE(pos+26);
  const extraLen=data.readUInt16LE(pos+28);
  if(flags&8||![0,8].includes(method))throw Error('C06 ZIP requires a standard local header');
  const name=data.subarray(pos+30,pos+30+nameLen).toString('utf8');
  const start=pos+30+nameLen+extraLen,end=start+size;
  if(end>data.length||files.has(name))throw Error('C06 ZIP corrupted or duplicate entry: '+name);
  const raw=data.subarray(start,end);
  files.set(name,method===8?inflateRawSync(raw):Buffer.from(raw));
  pos=end;
 }
 return files;
}
export async function readLongSource(){
 const files=unzip(await readFile(zipFile));
 if(files.size!==4||checksum(files.get('Long Button.svg')??'')!==sourceHash)
  throw Error('C06 original Illustrator source is missing or changed');
 const source=files.get('Long Button.svg').toString('utf8');
 if(!source.includes('viewBox="0 0 320 54"')||
    !source.includes('id="Long_Button_Shadow"')||!source.includes('id="Long_Button_Face"'))
  throw Error('C06 source groups or artboard have changed');
 const old={st0:'#172419',st1:'#D8CEC2',st2:'#293D2D',st3:'#232323'};
 const palettes={
  forest:{st0:'#172419',st1:'#D8CEC2',st2:'#293D2D',st3:'#232323'},
  terracotta:{st0:'#1F2216',st1:'#D8CEC2',st2:'#8A503B',st3:'#232323'},
  neutral:{st0:'#8A503B',st1:'#E4E3DE',st2:'#A6A29B',st3:'#232323'}
 };
 for(const [tone,hash] of Object.entries(variants)){
  const bytes=files.get('long-button-'+tone+'.svg');
  if(!bytes||checksum(bytes)!==hash)throw Error('C06 approved '+tone+' vector differs from locked source');
  const text=bytes.toString('utf8');
  let expected=source.replace('id="Long_Button_Face"','id="BUTTON_FACE"')
    .replace('id="Long_Button_Shadow"','id="BUTTON_SHADOW"');
  for(const [cls,original] of Object.entries(old)){
   const from='.'+cls+'{fill:'+original+';}';
   if(!expected.includes(from))throw Error('Missing source paint '+cls);
   expected=expected.replace(from,'.'+cls+'{fill:'+palettes[tone][cls]+';}');
  }
  if(text!==expected)throw Error('C06 '+tone+' changed illustration geometry or texture');
 }
 return files;
}
export async function installLongSvgAssets(output){
 const files=await readLongSource();
 const dir=resolve(output,'assets/long');await mkdir(dir,{recursive:true});
 for(const tone of Object.keys(variants))
  await writeFile(resolve(dir,'long-button-'+tone+'.svg'),files.get('long-button-'+tone+'.svg'));
 return {originalSHA256:sourceHash,variants,viewBox:'0 0 320 54',sourcePaths:426,sourcePolygons:32};
}
