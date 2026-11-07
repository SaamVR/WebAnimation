/**
 * Installs the owner's untouched 4000x2250 PNG worktable layers from six
 * reproducible, SHA-256 pinned archive segments. The small archive wrappers
 * are GitHub-safe ASCII parts, not recompressed/recolored image replacements.
 * Assets are extracted to dist only; no other website source is modified.
 */
import { readFile, writeFile, mkdtemp, cp, stat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const EXPECTED_SHA256='b86cd5425bb28c58de39bc7db75c7724005c4530da00fc19c81567293e7769bb';
const EXPECTED_BYTES=23656082;
const PARTS=6;

function originalPayload(zip,index){
 if(zip.readUInt32LE(0)!==0x04034b50)throw new Error('Invalid original asset archive wrapper '+index);
 if(zip.readUInt16LE(8)!==0)throw new Error('Unexpected compressed archive wrapper '+index);
 const size=zip.readUInt32LE(18);
 const nameLength=zip.readUInt16LE(26);
 const extraLength=zip.readUInt16LE(28);
 const name=zip.subarray(30,30+nameLength).toString('utf8');
 if(name!==('part'+index+'.bin'))throw new Error('Wrong asset archive part name '+name);
 const begin=30+nameLength+extraLength;
 if(begin+size>zip.length)throw new Error('Truncated original archive part '+index);
 return zip.subarray(begin,begin+size);
}

export async function installWorktableAssets(root,output){
 const partRoot=resolve(root,'artpack-parts');
 const segments=[];
 for(let i=0;i<PARTS;i++){
  const [a,b]=await Promise.all([
   readFile(resolve(partRoot,'part'+i+'.a.b64'),'utf8'),
   readFile(resolve(partRoot,'part'+i+'.b.b64'),'utf8')
  ]);
  const zip=Buffer.from((a.trim()+b.trim()),'base64');
  segments.push(originalPayload(zip,i));
 }
 const archive=Buffer.concat(segments);
 const hash=createHash('sha256').update(archive).digest('hex');
 if(hash!==EXPECTED_SHA256||archive.length!==EXPECTED_BYTES){
  throw new Error('Original worktable archive integrity mismatch: '+hash);
 }
 const temp=await mkdtemp(join(tmpdir(),'chapchitra-worktable-'));
 try{
  const gz=resolve(temp,'artwork.tar.gz');
  await writeFile(gz,archive);
  execFileSync('tar',['-xzf',gz,'-C',temp],{stdio:'pipe',timeout:60000});
  const src=resolve(temp,'projects/chapchitra/src/assets/worktable');
  const manifest=JSON.parse(await readFile(resolve(src,'manifest.json'),'utf8'));
  const entries=Object.values(manifest);
  for(const entry of entries){
   if(!entry.path?.startsWith('assets/worktable/') ||
      entry.original?.[0]!==4000 || entry.original?.[1]!==2250){
    throw new Error('Invalid source asset description: '+JSON.stringify(entry).slice(0,120));
   }
   const full=resolve(temp,'projects/chapchitra/src',entry.path);
   const buf=await readFile(full);
   const actual=createHash('sha256').update(buf).digest('hex');
   if(actual!==entry.sha256)throw new Error('Original PNG checksum mismatch: '+entry.path);
  }
  await cp(src,resolve(output,'assets/worktable'),{recursive:true,force:true});
  await stat(resolve(output,'assets/worktable/Artist-edit-backdrop-1.png'));
  return {originals:entries.length,archiveBytes:archive.length,sha256:hash};
 }finally{
  await rm(temp,{recursive:true,force:true});
 }
}
