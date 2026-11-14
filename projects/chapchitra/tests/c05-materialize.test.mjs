import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {materializeC05Assets} from '../scripts/materialize-c05-assets.mjs';
const ROOT=resolve(import.meta.dirname,'..');
const source=join(ROOT,'src');
const manifest=join(source,'assets/c05/encoded/manifest.json');
test('C05 approved 11 source assets reconstruct byte-identically',async()=>{
 const dest=await mkdtemp(join(tmpdir(),'c05-originals-'));
 try{
  const files=await materializeC05Assets({src:source,output:dest});
  assert.equal(files.length,11);
  assert.equal(files.find(f=>f.file==='icon01-final.json')?.bytes,5867171);
  assert.equal(files.find(f=>f.file==='icon03-approved-closing.mjs')?.sha256,
   '9ad4c7fd272cb498cd0de72bbdcf84b7434739362bca1b8a0d3426451b32ef45');
  for(const f of files){
   const where=f.file.endsWith('.mjs')?'motion/c05':'assets/c05';
   const b=await readFile(join(dest,where,f.file));
   assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);
  }
 }finally{await rm(dest,{recursive:true,force:true});}
});
test('C05 rejects tampered original source shard, without altering original manifest',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'c05-tamper-'));
 try{
  const src=join(dir,'src'),out=join(dir,'dist');
  await mkdir(join(src,'assets/c05'),{recursive:true});
  await cp(join(source,'assets/c05/encoded'),join(src,'assets/c05/encoded'),{recursive:true});
  for(const a of (JSON.parse(await readFile(manifest,'utf8'))).assets){
   if(a.storage==='raw-immutable-Git-blob'){
    const relative=a.filename.endsWith('.mjs')?'motion/c05':'assets/c05';
    await mkdir(join(src,relative),{recursive:true});
    await cp(join(source,relative,a.filename),join(src,relative,a.filename));
   }
  }
  const path=join(src,'assets/c05/encoded/icon01-final.json.part00.b64');
  const b=await readFile(path,'utf8');
  await writeFile(path,'A'+b.slice(1));
  await assert.rejects(materializeC05Assets({src,output:out}),/C05 approved final source CHECKSUM MISMATCH|incorrect data check|invalid distance|incorrect header check/);
 }finally{await rm(dir,{recursive:true,force:true});}
});