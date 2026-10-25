import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {catalog,productGallery,galleryAssetManifest} from './catalog.mjs';

// Verify only real committed images can be advertised as catalog and gallery assets.
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

test('All 120 owner gallery angles are real, nonempty WebPs mapped to one product only',()=>{
 const all=catalog.filter(p=>galleryAssetManifest[p.id]);
 assert.equal(all.length,38);
 const used=new Set(),missing=[],invalid=[];
 for(const product of all){
   for(const angle of productGallery(product).slice(1)){
     assert.ok(!used.has(angle.asset),'Cannot reuse one angle in multiple galleries: '+angle.asset);
     used.add(angle.asset);
     const path=fileURLToPath(new URL(angle.asset.replace(/^\.\//,''),import.meta.url));
     if(!existsSync(path)){missing.push(angle.asset);continue}
     const bytes=readFileSync(path);
     if(bytes.length<2048 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP')invalid.push(angle.asset);
   }
 }
 assert.equal(used.size,120);
 assert.deepEqual(missing,[],'All Batch 2 collage cutouts must be committed before deploy');
 assert.deepEqual(invalid,[],'Invalid or placeholder gallery media');
});
