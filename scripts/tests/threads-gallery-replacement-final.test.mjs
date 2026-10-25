import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { catalogById, productGallery } from '../../site/threads/catalog.mjs';

const root=new URL('../../site/threads/',import.meta.url);
const file=rel=>fileURLToPath(new URL(rel.replace(/^\.\//,''),root));
const sha=rel=>createHash('sha256').update(readFileSync(file(rel))).digest('hex');
const assets=views=>views.map(x=>x.asset.replace('./assets/products/',''));

test('six replacement galleries use only final owner-collage crops and no repeated angle',()=>{
 const expected={
  f2:['f2/cover.webp','f2/front.webp','f2/profile.webp','f2/rear.webp'],
  'hat-01':['hat-01/cover.webp','hat-01/front.webp','hat-01/profile.webp','hat-01/rear.webp'],
  'hat-04':['hat-04/cover.webp','hat-04/front.webp','hat-04/profile.webp','hat-04/rear.webp'],
  'bag-01':['bag-01/cover.webp','bag-01/front.webp','bag-01/side.webp','bag-01/angled.webp'],
  'bag-02':['bag-02/cover.webp','bag-02/front.webp','bag-02/side.webp','bag-02/angled.webp'],
  'bag-05':['bag-05/cover.webp','bag-05/front.webp','bag-05/side.webp','bag-05/angled.webp']
 };
 for(const [id,paths] of Object.entries(expected)){
  const p=catalogById[id],gallery=productGallery(p);
  assert.equal(p.asset,'./assets/products/'+paths[0],id+' cover path');
  assert.deepEqual(assets(gallery),paths,id+' exact gallery');
  for(const v of gallery){assert.ok(existsSync(file(v.asset)),id+' missing '+v.asset)}
  const hashes=gallery.map(v=>sha(v.asset));
  assert.equal(new Set(hashes).size,hashes.length,id+' has duplicated photo bytes');
 }
});

test('Mustard backpack promotes front view as cover without duplicate thumbnail',()=>{
 const p=catalogById['bag-04'],gallery=productGallery(p);
 assert.equal(p.asset,'./assets/products/bag-04/cover.webp');
 assert.deepEqual(assets(gallery),['bag-04/cover.webp','bag-04/side.webp','bag-04/angled.webp']);
 assert.equal(gallery.filter(v=>v.asset.endsWith('/front.webp')).length,0);
});

test('watch duplicate angles are omitted while bottle front/back remain distinct',()=>{
 for(const id of ['acc-03','acc-07']){
  const gallery=productGallery(catalogById[id]);
  assert.equal(gallery.some(v=>v.asset.endsWith('/angled.webp')),false,id);
  assert.deepEqual(assets(gallery),[
   id+'/cover.webp',id+'/front.webp',id+'/profile.webp',id+'/side.webp'
  ]);
 }
 const bottle=productGallery(catalogById['acc-04']);
 assert.deepEqual(assets(bottle),[
  'acc-04/cover.webp','acc-04/front.webp','acc-04/back.webp','acc-04/open.webp'
 ]);
 assert.notEqual(sha('./assets/products/acc-04/front.webp'),sha('./assets/products/acc-04/back.webp'));
});

test('catalog has no obsolete Sunburst cover reference and detail CSS is contain-only',()=>{
 const catalog=readFileSync(file('catalog.mjs'),'utf8');
 const css=readFileSync(file('storefront.css'),'utf8');
 assert.doesNotMatch(catalog,/featured-yellow-cap-owner-20261018\.webp/);
 assert.match(css,/\.store-detail__image img\{[^}]*object-fit:contain/);
 assert.doesNotMatch(css,/\.store-detail__image img\.view-[12]\{transform:scale/);
});

test('obsolete and duplicate gallery files are removed after verified replacement',()=>{
 for(const rel of [
  'assets/featured-yellow-cap-owner-20261018.webp',
  'assets/products/f2/angled.webp','assets/products/hat-01/angled.webp','assets/products/hat-04/angled.webp',
  'assets/products/bag-04/front.webp','assets/products/acc-03/angled.webp','assets/products/acc-07/angled.webp'
 ]) assert.equal(existsSync(file(rel)),false,rel);
});
