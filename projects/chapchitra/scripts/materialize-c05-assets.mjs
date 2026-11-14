/**
 * CHAPCHITRA C05 approved-source materializer.
 * The GitHub content API cannot reliably ingest the 5.9MB V7 JSON as one
 * payload. The immutable originals are therefore held as lossless gzip/base64
 * shards. Every build reconstructs the exact owner-supplied bytes, verifies
 * SHA-256 + Git blob SHA-1 and publishes the ordinary .json/.svg/.mjs filenames.
 * No source art or animation choreography is edited or regenerated.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

const ROOT=resolve(import.meta.dirname,'..');
const assetDestination=(name)=>name.endsWith('.mjs')?'motion/c05':'assets/c05';
const expectedNames=[
 'icon01-final.json','icon01-poster.svg','icon02-final.json','icon02-poster.svg',
 'icon03-approved-closing.mjs','icon03-approved-motion.mjs','icon03-final.svg',
 'icon03-poster.svg','icon03-refined-opening.mjs','icon04-final.json','icon04-poster.svg'
];
export async function materializeC05Assets({src=join(ROOT,'src'),output=join(ROOT,'dist')}={}) {
 const encoded=join(src,'assets/c05/encoded');
 const manifest=JSON.parse(await readFile(join(encoded,'manifest.json'),'utf8'));
 if(manifest.schemaVersion!==1||!Array.isArray(manifest.assets)||
    manifest.assets.map(a=>a.filename).sort().join('|')!==expectedNames.slice().sort().join('|'))
   throw Error('C05 approved final asset manifest does not match the 11 required source files');
 const report=[];
 for(const item of manifest.assets){
  if(!/^icon0[1-4]-[\w-]+\.(?:json|svg|mjs)$/.test(item.filename))
   throw Error('C05 invalid approved asset path: '+item.filename);
  let decoded;
  if(item.storage==='lossless-gzip-shards'){
   if(!Array.isArray(item.parts)||item.parts.length<1||item.parts.length>20||
      item.parts.some(part=>!part.startsWith(item.filename+'.part')||!/\.b64$/.test(part)))
    throw Error('C05 invalid compressed source part names: '+item.filename);
   const fragments=[];
   for(const part of item.parts)fragments.push(await readFile(join(encoded,part),'utf8'));
   const encodedString=fragments.join('');
   if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encodedString))
    throw Error('C05 invalid encoded original source: '+item.filename);
   decoded=gunzipSync(Buffer.from(encodedString,'base64'),{maxOutputLength:10*1024*1024});
  }else if(item.storage==='raw-immutable-Git-blob'){
   decoded=await readFile(join(src,assetDestination(item.filename),item.filename));
  }else throw Error('C05 unsupported asset storage: '+item.filename);
  const digest=createHash('sha256').update(decoded).digest('hex');
  const gitHash=createHash('sha1').update(Buffer.from('blob '+decoded.length+'\0')).update(decoded).digest('hex');
  if(decoded.length!==item.bytes||digest!==item.sha256||gitHash!==item.gitBlobSHA1)
   throw Error('C05 approved final source CHECKSUM MISMATCH: '+item.filename);
  if(item.filename.endsWith('.json')){
   const data=JSON.parse(decoded.toString('utf8'));
   const frames={'icon01-final.json':151,'icon02-final.json':115,'icon04-final.json':60};
   if(data.w!==512||data.h!==512||data.ip!==0||data.fr!==30||
      data.op!==frames[item.filename]||!data.layers?.length||data.assets?.some(a=>a.p||a.u))
    throw Error('C05 original Lottie vector metadata mismatch: '+item.filename);
  }
  const target=join(output,assetDestination(item.filename),item.filename);
  await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,decoded);
  report.push({file:item.filename,bytes:decoded.length,sha256:digest,gitBlobSHA1:gitHash});
 }
 console.log('C05 11 immutable owner-supplied assets materialized with SHA-256 and Git-blob SHA1 checks.');
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 const src=process.argv[2]||join(ROOT,'src');
 const output=process.argv[3]||join(ROOT,'dist');
 await materializeC05Assets({src,output});
}