import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {catalog} from './catalog.mjs';

// This release gate is deliberately RED until all 29 owner-derived WebP assets
// are committed at their catalog paths. It prevents false visual completion.
test('Batch 1 product covers exist as genuine WebP files in the site tree',()=>{
 const batch=catalog.filter(p=>p.group==='catalog');
 assert.equal(batch.length,29);
 const missing=[],invalid=[];
 for(const product of batch){
  const path=fileURLToPath(new URL(product.asset.replace(/^\.\//,''), import.meta.url));
  if(!existsSync(path)){missing.push(product.id+' -> '+product.asset);continue}
  const bytes=readFileSync(path);
  if(bytes.length<1024||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP'){
   invalid.push(product.id+' -> not a valid WebP file');
  }
 }
 assert.deepEqual(missing,[],'Upload the 29 owner cutouts from THREADS_Batch1_29_Product_Covers_2026-10-19.zip to the new draft branch before merge/deployment');
 assert.deepEqual(invalid,[],'Expected actual WebP cover images, not placeholder files');
});
