import test from 'node:test';
import assert from 'node:assert/strict';
import {PAPER_REFERENCES,MIN_ADJUSTMENT,MAX_ADJUSTMENT,
 placementGeometry,paperGuide,printableRegion,printScaleLabel,resolutionGuidance}
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
  assert.ok(near(a3.guide.x,a3.region.x)&&near(a3.guide.y,a3.region.y));
  assert.ok(near(a3.guide.width,a3.region.width)&&near(a3.guide.height,a3.region.height));
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
  assert.ok(lower.y>home.y+20,garment);
  assert.ok(near(lower.bounds.y+lower.bounds.height,lower.guide.y+lower.guide.height));
  assert.ok(near(left.bounds.x,left.guide.x));
  assert.ok(near(right.bounds.x+right.bounds.width,right.guide.x+right.guide.width));
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

test('A3 is the exact fixed calibration — no enlarged garment envelope',()=>{
 for(const garment of garments){
  const a3=paperGuide(garment,'A3');
  const safe=printableRegion(garment);
  for(const key of ['x','y','width','height'])assert.ok(near(a3[key],safe[key]),garment+' '+key);
  const forced=paperGuide(garment,'A3',{frameX:9999,frameY:-9999});
  for(const key of ['x','y','width','height'])assert.ok(near(forced[key],safe[key]));
 }
});
test('A4 keeps A-series 1:2 area, fixed dimensions and can move to ALL four A3 corners',()=>{
 for(const garment of garments){
  const safe=printableRegion(garment);
  const home=paperGuide(garment,'A4');
  assert.ok(near(home.width*home.height*2,safe.width*safe.height,.02));
  for(const [sx,sy] of [[-1,-1],[-1,1],[1,-1],[1,1]]){
   const a4=paperGuide(garment,'A4',{frameX:sx*1e5,frameY:sy*1e5});
   assert.ok(near(a4.width,home.width)&&near(a4.height,home.height),garment);
   assert.ok(near(a4.x,sx<0?safe.x:safe.x+safe.width-a4.width),garment);
   assert.ok(near(a4.y,sy<0?safe.y:safe.y+safe.height-a4.height),garment);
  }
 }
});
test('rotated, enlarged and extreme-offset artwork stays inside selected A3/A4',()=>{
 for(const garment of garments)for(const preset of ['A3','A4'])
  for(const [w,h] of [[800,1200],[1200,800],[300,300],[500,1400]]){
   for(const rotation of [0,90,180,270]){
    for(const adjustment of [-50,0,25,80,100]){
     for(const [dx,dy] of [[0,0],[-9999,-9999],[9999,9999],[-9999,9999],[9999,-9999]]){
      const p=placementGeometry({garment,preset,imageWidth:w,imageHeight:h,rotation,
       adjustment,dx,dy,frameX:9999,frameY:-9999});
      const g=p.guide;
      assert.ok(p.bounds.x>=g.x-1e-6,JSON.stringify({garment,preset,rotation,p,reason:'left'}));
      assert.ok(p.bounds.y>=g.y-1e-6,JSON.stringify({garment,preset,rotation,p,reason:'top'}));
      assert.ok(p.bounds.x+p.bounds.width<=g.x+g.width+1e-6,JSON.stringify({garment,preset,rotation,p,reason:'right'}));
      assert.ok(p.bounds.y+p.bounds.height<=g.y+g.height+1e-6,JSON.stringify({garment,preset,rotation,p,reason:'bottom'}));
      assert.ok(near(p.width/p.height,w/h,1e-7),'source aspect must be preserved');
      assert.ok(p.maxAdjustment>=0&&p.adjustment<=p.maxAdjustment);
     }
    }
   }
  }
});
test('A4 frame translation carries local artwork offset without changing scale or rotation',()=>{
 for(const garment of garments){
  const args={garment,preset:'A4',imageWidth:960,imageHeight:1440,dx:12,dy:18,adjustment:10,rotation:90};
  const original=placementGeometry(args);
  const moved=placementGeometry({...args,frameX:35,frameY:-22});
  const marginX=moved.guide.frameX,marginY=moved.guide.frameY;
  assert.ok(near(moved.bounds.x-original.bounds.x,marginX),garment);
  assert.ok(near(moved.bounds.y-original.bounds.y,marginY),garment);
  assert.ok(near(moved.width,original.width));
  assert.ok(near(moved.height,original.height));
  assert.equal(moved.rotation,90);
 }
});
test('different front/back A4 frame offsets can be retained independently',async()=>{
 const {createSideRecords,storeSide,loadSide}=await import('../src/worktable-two-sided-state.mjs');
 const sides=createSideRecords();
 const front={x:1,y:2,frameX:36,frameY:-18,adjustment:12,rotation:90,selected:true,mode:'move'};
 const back={x:0,y:0,frameX:-36,frameY:18,adjustment:-20,rotation:0,selected:false,mode:'move'};
 storeSide(sides,'front',{url:'blob:front',bitmap:{naturalWidth:800,naturalHeight:1200},preset:'A4',editor:front});
 storeSide(sides,'back',{url:'blob:back',bitmap:{naturalWidth:900,naturalHeight:1200},preset:'A3',editor:back});
 assert.deepEqual(loadSide(sides,'front').editor,front);
 assert.deepEqual(loadSide(sides,'back').editor,back);
 assert.equal(loadSide(sides,'back').preset,'A3');
});
