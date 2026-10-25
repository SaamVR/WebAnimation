import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../../site/threads/',import.meta.url);
const asset=(id,view='cover')=>readFileSync(fileURLToPath(new URL('assets/products/'+id+'/'+view+'.webp',root)));
function webpDims(bytes) {
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 const kind=bytes.toString('ascii',12,16);
 if(kind==='VP8L') {
  const n=bytes.readUInt32LE(21);
  return [(n&0x3fff)+1,((n>>>14)&0x3fff)+1];
 }
 if(kind==='VP8X')return [bytes.readUIntLE(24,3)+1,bytes.readUIntLE(27,3)+1];
 throw new Error('Unexpected WebP codec '+kind);
}
test('exactly three bag cover canvases are reframed and non-square',()=>{
 const expected={'bag-01':[750,946],'bag-02':[760,899],'bag-05':[754,643]};
 for(const [id,wanted] of Object.entries(expected)){
  assert.deepEqual(webpDims(asset(id)),wanted,id+' silhouette-bounded canvas');
  assert.ok(asset(id).length>10000,id+' real photograph preserved');
 }
});
test('Mustard and reference bags retain their approved covers',()=>{
 for(const id of ['bag-04','bag-03','bag-06','bag-07']) {
  const [width,height]=webpDims(asset(id));
  assert.ok(width>250&&height>250,id);
 }
});
test('all genuine bag gallery angles remain available with contain-fit',async()=>{
 const {catalogById,productGallery}=await import('../../site/threads/catalog.mjs');
 for(const id of ['bag-01','bag-02','bag-04','bag-05']){
  const gallery=productGallery(catalogById[id]);
  assert.ok(gallery.length>=3,id+' should retain gallery');
  assert.equal(new Set(gallery.map(x=>x.asset)).size,gallery.length,id+' angle distinctness');
  for(const view of gallery){
    const relative=view.asset.replace(/^.\//,'');
    const b=readFileSync(fileURLToPath(new URL(relative,root)));
    assert.ok(b.length>2000,relative+' real photo');
  }
 }
 const css=readFileSync(fileURLToPath(new URL('storefront.css',root)),'utf8');
 assert.match(css,/\.store-product-card__media img\{[^}]*object-fit:contain/);
 assert.match(css,/\.store-thumbnails button img\{[^}]*object-fit:contain/);
 assert.match(css,/\.store-detail__image img\{[^}]*object-fit:contain/);
});
