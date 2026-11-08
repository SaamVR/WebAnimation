import test from 'node:test';
import assert from 'node:assert/strict';
import {PAPER_REFERENCES,MIN_ADJUSTMENT,MAX_ADJUSTMENT,
 placementGeometry,printableRegion,printScaleLabel,resolutionGuidance}
 from '../src/worktable-print-placement.mjs';
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const aspects=[[800,1200,'portrait'],[1200,800,'landscape'],[800,800,'square'],[500,1400,'extra-tall']];
const near=(a,b,eps=1e-8)=>Math.abs(a-b)<=eps;

test('A3/A4 visual reference sizes and signed slider bounds',()=>{
 assert.deepEqual(PAPER_REFERENCES.A4,{widthIn:8.27,heightIn:11.69,widthPx:2480,heightPx:3508});
 assert.deepEqual(PAPER_REFERENCES.A3,{widthIn:11.69,heightIn:16.54,widthPx:3508,heightPx:4961});
 assert.equal(MIN_ADJUSTMENT,-50);assert.equal(MAX_ADJUSTMENT,100);
});
test('portrait A3 area twice A4 in all four garments',()=>{
 for(const garment of garments){
  const a4=placementGeometry({garment,preset:'A4',imageWidth:2480,imageHeight:3508});
  const a3=placementGeometry({garment,preset:'A3',imageWidth:3508,imageHeight:4961});
  assert.ok(near(a3.width/a4.width,Math.SQRT2,.005),garment);
  assert.ok(near(a3.height/a4.height,Math.SQRT2,.005),garment);
  assert.ok(near((a3.width*a3.height)/(a4.width*a4.height),2,.02),garment);
  assert.ok(a3.y>a3.region.y&&a3.y<a3.region.y+a3.region.height*.14);
 }
});
test('different source image ratios fit entirely inside reference, without clipping',()=>{
 for(const garment of garments)for(const preset of ['A4','A3'])for(const [w,h,name] of aspects){
  const p=placementGeometry({garment,preset,imageWidth:w,imageHeight:h});
  assert.ok(near(p.width/p.height,w/h,.0001),[garment,preset,name,p]);
  assert.ok(p.width<=p.refW+.0001&&p.height<=p.refH+.0001);
  assert.ok(p.x>=p.region.x-1e-6&&p.y>=p.region.y-1e-6);
 }
});
test('all signed slider values are constrained to the safe garment bounds',()=>{
 for(const garment of garments)for(const preset of ['A4','A3'])for(const [w,h] of aspects){
  for(const amount of [-999,-50,-25,0,25,35,80,100,1000]){
   const p=placementGeometry({garment,preset,imageWidth:w,imageHeight:h,adjustment:amount});
   assert.ok(p.adjustment>=-50&&p.adjustment<=p.maxAdjustment);
   assert.ok(p.maxAdjustment<=100&&p.maxAdjustment>=0);
   assert.ok(near(p.width/p.height,w/h,1e-7));
   assert.ok(p.x>=p.region.x-1e-6&&p.y>=p.region.y-1e-6);
   assert.ok(p.x+p.width<=p.region.x+p.region.width+1e-6);
   assert.ok(p.y+p.height<=p.region.y+p.region.height+1e-6);
   if(amount<=p.maxAdjustment&&amount>=-50)assert.equal(p.adjustment,amount);
   if(amount>p.maxAdjustment)assert.equal(p.constrained,true);
  }
 }
});
test('dragging from below collar reaches all edges without going off garment',()=>{
 for(const garment of garments){
  const base={garment,preset:'A4',imageWidth:2480,imageHeight:3508};
  const home=placementGeometry(base);
  const lower=placementGeometry({...base,dy:9999});
  const left=placementGeometry({...base,dx:-9999});
  const right=placementGeometry({...base,dx:9999});
  assert.ok(lower.y>home.y+40,garment);
  assert.ok(near(lower.y+lower.height,lower.region.y+lower.region.height));
  assert.ok(near(left.x,left.region.x));
  assert.ok(near(right.x+right.width,right.region.x+right.region.width));
 }
});
test('switching presets and garments retains intent and clamps to safe area',()=>{
 let dx=120,dy=135,adjustment=35;
 for(const garment of garments)for(const preset of ['A3','A4']){
  const p=placementGeometry({garment,preset,imageWidth:1200,imageHeight:700,dx,dy,adjustment});
  assert.ok(Number.isFinite(p.dx)&&Number.isFinite(p.dy));
  assert.ok(p.x+p.width<=p.region.x+p.region.width+1e-6);
  assert.ok(p.y+p.height<=p.region.y+p.region.height+1e-6);
  dx=p.dx;dy=p.dy;adjustment=p.adjustment;
 }
});
test('signed labels and relative 300 PPI guidance',()=>{
 for(const [amount,label] of [[-50,'−50%'],[-25,'−25%'],[0,'0%'],[35,'+35%'],[100,'+100%']])
  assert.equal(printScaleLabel(amount),label);
 for(const preset of ['A3','A4']){
  const p=PAPER_REFERENCES[preset];
  assert.equal(resolutionGuidance({preset,imageWidth:p.widthPx,imageHeight:p.heightPx}).low,false);
  const small=resolutionGuidance({preset,imageWidth:230,imageHeight:350});
  assert.equal(small.low,true);
  assert.match(small.text,/preview is still available/);
  assert.equal(resolutionGuidance({preset,imageWidth:p.widthPx,imageHeight:p.heightPx,adjustment:60}).low,true);
 }
});
test('unknown garments, presets and zero-sized images fail',()=>{
 assert.throws(()=>printableRegion('coat'),RangeError);
 assert.throws(()=>placementGeometry({garment:'hoodie',preset:'A2',imageWidth:100,imageHeight:200}),RangeError);
 assert.throws(()=>placementGeometry({imageWidth:0,imageHeight:200}),RangeError);
 assert.throws(()=>placementGeometry({imageWidth:NaN,imageHeight:200}),RangeError);
});
