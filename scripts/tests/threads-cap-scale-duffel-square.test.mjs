import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../site/threads/',import.meta.url);
const src=rel=>readFileSync(fileURLToPath(new URL(rel,root)));
function webpSize(buf){
 assert.equal(buf.toString('ascii',0,4),'RIFF');
 assert.equal(buf.toString('ascii',8,12),'WEBP');
 const chunk=buf.toString('ascii',12,16);
 if(chunk==='VP8L'){
  assert.equal(buf[20],0x2f);
  const n=buf.readUInt32LE(21);
  return [(n&0x3fff)+1,((n>>>14)&0x3fff)+1];
 }
 if(chunk==='VP8X')return [1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
 throw new Error('Unexpected WebP codec '+chunk);
}
test('three owner cap galleries have tight bounded image canvases, not square whitespace',()=>{
 for(const id of ['f2','hat-01','hat-04']){
  for(const view of ['cover','front','profile','rear']){
   const file='assets/products/'+id+'/'+view+'.webp';
   const [w,h]=webpSize(src(file));
   assert.ok(w>=500&&h>=480,file+' full photograph resolution '+w+'x'+h);
   assert.ok(w!==h,file+' should not retain the old 1100×1100 padded canvas');
   if(view==='cover')assert.ok(w/h>1.25&&w/h<1.6,file+' authentic cap silhouette shape');
  }
 }
});
test('orange duffel has isolated square frame with contain-fit, unchanged other products',()=>{
 const js=src('storefront-pages.mjs').toString();
 const css=src('storefront.css').toString();
 assert.match(js,/p\.id==='f3'\?' data-f3-square-gallery'/);
 assert.match(css,/\.store-detail\[data-f3-square-gallery\] \.store-detail__image\{[^}]*aspect-ratio:1 \/ 1/);
 assert.match(css,/\.store-detail\[data-f3-square-gallery\] \.store-detail__image img\{[^}]*object-fit:contain/);
 assert.doesNotMatch(css,/\.store-detail__image img\.view-[12]\{transform:scale/);
});
