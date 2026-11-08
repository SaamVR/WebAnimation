import test from 'node:test';
import assert from 'node:assert/strict';
import {paperGuide,placementGeometry,printableRegion} from '../src/worktable-print-placement.mjs';
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const sizes=[[480,720,'portrait'],[720,480,'landscape'],[400,400,'square'],[200,1100,'tall']];
const near=(a,b,e=.001)=>Math.abs(a-b)<e;
test('nominal print guide is fixed for image aspect, rotation, scale and offsets',()=>{
 for(const garment of garments)for(const preset of ['A3','A4']){
  const paper=paperGuide(garment,preset);
  for(const [w,h] of sizes)for(const rotation of [0,90,180,270]){
   const art=placementGeometry({garment,preset,imageWidth:w,imageHeight:h,
    adjustment:25,rotation,dx:70,dy:95});
   assert.ok(near(art.guide.width,paper.width),garment);
   assert.ok(near(art.guide.height,paper.height),garment);
   assert.ok(near(art.guide.x,paper.x)&&near(art.guide.y,paper.y));
   assert.ok(art.bounds.x>=art.region.x-.0001);
   assert.ok(art.bounds.y>=art.region.y-.0001);
   assert.ok(art.bounds.x+art.bounds.width<=art.region.x+art.region.width+.0001);
   assert.ok(art.bounds.y+art.bounds.height<=art.region.y+art.region.height+.0001);
  }
 }
});
test('A3 has ~double A4 visual area across all garments',()=>{
 for(const garment of garments){
  const a=paperGuide(garment,'A3'),b=paperGuide(garment,'A4');
  assert.ok(near((a.width*a.height)/(b.width*b.height),2,.005));
  assert.ok(near(a.width/a.height,11.69/16.54,.001));
  assert.ok(a.y>=printableRegion(garment).y);
 }
});
test('0% auto-fits all aspect ratios inside paper, centered without cropping',()=>{
 for(const garment of garments)for(const preset of ['A3','A4'])for(const [w,h] of sizes){
  const p=placementGeometry({garment,preset,imageWidth:w,imageHeight:h});
  assert.ok(near(p.width/p.height,w/h,.0000001));
  assert.ok(p.bounds.width<=p.guide.width+.0001);
  assert.ok(p.bounds.height<=p.guide.height+.0001);
  assert.ok(near(p.centerX,p.guide.x+p.guide.width/2));
  assert.ok(near(p.centerY,p.guide.y+p.guide.height/2));
 }
});
test('four clockwise rotations preserve center and wrap at 360',()=>{
 for(const garment of garments)for(const [w,h] of sizes){
  const original=placementGeometry({garment,preset:'A4',imageWidth:w,imageHeight:h});
  const turn=placementGeometry({garment,preset:'A4',imageWidth:w,imageHeight:h,rotation:90});
  assert.equal(turn.rotation,90);
  assert.ok(near(turn.bounds.width,turn.height));
  assert.ok(near(turn.bounds.height,turn.width));
  assert.ok(near(original.centerX,turn.centerX));
  assert.ok(near(original.centerY,turn.centerY));
  const full=placementGeometry({garment,preset:'A4',imageWidth:w,imageHeight:h,rotation:360});
  assert.equal(full.rotation,0);
  assert.ok(near(original.width,full.width));
 }
});
test('signed resizing respects safe region even when rotated and positioned at edge',()=>{
 for(const garment of garments)for(const [w,h] of sizes)for(const rotation of [0,90,180,270]){
  for(const adjustment of [-50,0,25,60,100,1000]){
   const p=placementGeometry({garment,preset:'A3',imageWidth:w,imageHeight:h,
    rotation,adjustment,dx:9999,dy:-9999});
   assert.ok(p.adjustment>=-50&&p.adjustment<=p.maxAdjustment);
   assert.ok(near(p.width/p.height,w/h,.00001));
   assert.ok(p.bounds.x>=p.region.x-.0001);
   assert.ok(p.bounds.y>=p.region.y-.0001);
   assert.ok(p.bounds.x+p.bounds.width<=p.region.x+p.region.width+.0001);
   assert.ok(p.bounds.y+p.bounds.height<=p.region.y+p.region.height+.0001);
  }
 }
});
