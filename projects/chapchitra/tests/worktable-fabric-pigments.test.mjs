import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 FABRIC_PIGMENTS,GARMENT_NEUTRAL_MIDTONES,rgbPigmentMidtone,
 createFabricPigmentLUT,applyFabricPigmentToRGBA,
} from '../src/worktable-fabric-pigments.mjs';
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const colors=['black','white','red','yellow','blue','green'];
const sample=(garment,color,neutral,alpha=255)=>{
 const rgba=new Uint8ClampedArray([neutral,neutral-1,neutral-2,alpha]);
 applyFabricPigmentToRGBA(rgba,garment,color);
 return [...rgba];
};
test('independently calibrated profiles do not modify original six illustrated paint-pot swatches',async()=>{
 assert.deepEqual(Object.keys(FABRIC_PIGMENTS),colors);
 assert.deepEqual(Object.keys(GARMENT_NEUTRAL_MIDTONES),garments);
 const source=await readFile(new URL('../src/worktable-studio.mjs',import.meta.url),'utf8');
 for(const [k,v] of Object.entries({black:'#292b2a',white:'#ffffff',red:'#bf3846',yellow:'#e1bc33',blue:'#2a6ea9',green:'#317452'})){
  assert.ok(source.includes(k+":'"+v+"'"),'illustrated swatch '+k+' must remain original');
 }
 for(const color of colors){
  assert.match(FABRIC_PIGMENTS[color].midtone,/^#[0-9a-f]{6}$/i);
  if(color!=='white')assert.equal(createFabricPigmentLUT('regular',color).byteLength,768);
 }
});
test('24 combinations match the calibrated fabric midtone despite different garment neutral whites',()=>{
 for(const color of colors){
  const rgb=rgbPigmentMidtone(color);
  if(color==='white')continue; // Original white source texture is intentionally unmodified.
  for(const garment of garments){
   const rgba=sample(garment,color,GARMENT_NEUTRAL_MIDTONES[garment]);
   assert.equal(rgba[3],255);
   for(let ch=0;ch<3;ch++)assert.ok(Math.abs(rgba[ch]-rgb[ch])<=4,
    color+'/'+garment+' ch '+ch+' rgba='+rgba);
  }
 }
});
test('black is deep neutral fabric with preserved folds and subdued non-gray highlights',()=>{
 for(const garment of garments){
  const mid=sample(garment,'black',GARMENT_NEUTRAL_MIDTONES[garment]);
  const fold=sample(garment,'black',190);
  const highlight=sample(garment,'black',250);
  assert.ok(mid.slice(0,3).every(ch=>ch>=19&&ch<=45),mid);
  assert.ok(Math.max(...mid.slice(0,3))-Math.min(...mid.slice(0,3))<=8,mid);
  assert.ok(fold[0]<mid[0]-7&&mid[0]<highlight[0],JSON.stringify({mid,fold,highlight}));
  assert.ok(fold[0]>=8,'black shadows must not crush to zero');
 }
});
test('red is rich saturated red, never pale pink or muddy-neutral maroon',()=>{
 for(const garment of garments){
  const mid=sample(garment,'red',GARMENT_NEUTRAL_MIDTONES[garment]);
  const fold=sample(garment,'red',195);
  assert.ok(mid[0]>=210&&mid[1]<=48&&mid[2]<=65,mid);
  assert.ok(mid[0]>=mid[1]*4&&mid[0]>=mid[2]*3,mid);
  assert.ok(fold[0]>fold[1]*4&&fold[0]>fold[2]*3,'red folds preserve red chroma');
  assert.ok(fold[0]<mid[0]-15,'shadows should retain garment depth');
 }
});
test('yellow, blue and green are pigmented, nonclipped and show natural highlights/folds',()=>{
 for(const garment of garments){
  const y=sample(garment,'yellow',GARMENT_NEUTRAL_MIDTONES[garment]);
  const b=sample(garment,'blue',GARMENT_NEUTRAL_MIDTONES[garment]);
  const g=sample(garment,'green',GARMENT_NEUTRAL_MIDTONES[garment]);
  assert.ok(y[0]>=230&&y[1]>=180&&y[2]<=45,y);
  assert.ok(b[2]>=190&&b[0]<=40&&b[1]>=75&&b[1]<=130,b);
  assert.ok(g[1]>=110&&g[0]<=30&&g[2]>=55&&g[2]<=90,g);
  for(const color of ['red','yellow','blue','green']){
   const low=sample(garment,color,190),hi=sample(garment,color,248);
   assert.ok(low[0]<hi[0]||low[1]<hi[1]||low[2]<hi[2],color+' fold contrast');
   assert.ok(hi.slice(0,3).every(x=>x<255),color+' highlight must not clip');
  }
 }
});
test('all 24 combinations preserve source alpha exactly, including antialiased boundaries',()=>{
 for(const garment of garments)for(const color of colors){
  const px=new Uint8ClampedArray([
   2,220,60,0, 110,118,117,1, 136,138,136,32,
   178,176,179,126, 224,223,225,224, 240,238,239,254, 243,241,240,255,
  ]);
  const before=px.slice();
  applyFabricPigmentToRGBA(px,garment,color);
  for(let i=3;i<px.length;i+=4)assert.equal(px[i],before[i],
   'alpha changed '+garment+'/'+color+' offset '+i);
  for(let i=0;i<3;i++)assert.equal(px[i],before[i],
   'outside silhouette recolored');
 }
});
test('white garment remains byte-for-byte source original for all four shapes',()=>{
 for(const garment of garments){
  const before=new Uint8ClampedArray([240,238,239,255,182,179,180,200,3,3,3,0]);
  const after=before.slice();
  assert.equal(applyFabricPigmentToRGBA(after,garment,'white'),after);
  assert.deepEqual(after,before);
 }
});
test('all garment pigment curves preserve monotonic CIE-lightness depth across folds',()=>{
 for(const garment of garments)for(const color of colors){
  if(color==='white')continue;
  const lut=createFabricPigmentLUT(garment,color);
  for(const [a,b] of [[155,185],[185,213],[213,228],[228,239]]){
   const dark=lut.slice(a*3,a*3+3),light=lut.slice(b*3,b*3+3);
   assert.ok(dark[0]<=light[0]&&dark[1]<=light[1]&&dark[2]<=light[2],
    garment+':'+color+':'+a+'->'+b);
  }
 }
});
test('unknown pigment/garment or misaligned pixels fail without tinting the source',()=>{
 assert.throws(()=>createFabricPigmentLUT('regular','cerise'),/Unsupported/);
 assert.throws(()=>createFabricPigmentLUT('tuxedo','red'),/Unsupported/);
 assert.throws(()=>applyFabricPigmentToRGBA(new Uint8ClampedArray(5),'regular','red'),/Expected RGBA/);
});
