import test from 'node:test';
import assert from 'node:assert/strict';
import {printGuideGeometry,placementGeometry,normalizedRotation,printableRegion,
 PAPER_REFERENCES} from '../src/worktable-print-placement.mjs';
const garments=['regular','dropShoulder','fullSleeve','hoodie'];
const dims=[[2480,3508,'portrait'],[500,200,'landscape'],[420,420,'square'],[150,700,'veryTall'],[900,160,'wide']];
const epsilon=1e-6;
const inside=(p,r)=>p.x+epsilon>=r.x&&p.y+epsilon>=r.y&&p.x+p.width<=r.x+r.width+epsilon&&p.y+p.height<=r.y+r.height+epsilon;
test('A3/A4 print guide is independent from uploaded image dimensions',()=>{
 for(const garment of garments){
  const a3=printGuideGeometry({garment,preset:'A3'});
  const a4=printGuideGeometry({garment,preset:'A4'});
  assert.ok(Math.abs(a3.width*a3.height/(a4.width*a4.height)-2)<.03,garment);
  assert.ok(Math.abs(a3.width/a3.height-PAPER_REFERENCES.A3.widthIn/PAPER_REFERENCES.A3.heightIn)<1e-7);
  assert.ok(inside(a3,printableRegion(garment)));
  assert.ok(inside(a4,printableRegion(garment)));
  for(const [w,h] of dims){
   const p=placementGeometry({garment,preset:'A4',imageWidth:w,imageHeight:h});
   assert.equal(p.frame.x,a4.x);assert.equal(p.frame.y,a4.y);
   assert.equal(p.frame.width,a4.width);assert.equal(p.frame.height,a4.height);
  }
 }
});
test('Portrait, landscape, square and extreme artwork center in reference at 0%',()=>{
 for(const garment of garments)for(const preset of ['A3','A4'])for(const [w,h,name] of dims){
  const p=placementGeometry({garment,preset,imageWidth:w,imageHeight:h});
  const frame=printGuideGeometry({garment,preset});
  assert.ok(Math.abs(p.width/p.height-w/h)<epsilon,[garment,preset,name]);
  assert.ok(p.width<=frame.width+epsilon&&p.height<=frame.height+epsilon);
  assert.ok(Math.abs(p.centerX-frame.centerX)<epsilon,[garment,preset,name,p]);
  assert.ok(Math.abs(p.centerY-frame.centerY)<epsilon,[garment,preset,name,p]);
  assert.equal(p.rotation,0);assert.equal(p.adjustment,0);
 }
});
test('Rotated bounding box remains inside conservative garment region',()=>{
 for(const garment of garments)for(const preset of ['A3','A4'])for(const [w,h,name] of dims){
  for(const angle of [0,90,180,270]){
   for(const adjustment of [-50,0,35,100]){
    const p=placementGeometry({garment,preset,imageWidth:w,imageHeight:h,rotation:angle,
     adjustment,dx:10000,dy:-10000});
    const r={x:p.rotatedX,y:p.rotatedY,width:p.rotatedWidth,height:p.rotatedHeight};
    assert.ok(inside(r,p.region),{garment,preset,name,angle,adjustment,result:p});
    assert.equal(p.rotation,angle);
    assert.ok(p.adjustment>=-50&&p.adjustment<=100);
    assert.ok(p.width>0&&p.height>0);
   }
  }
 }
});
test('90 degree clockwise sequence swaps width/height and cycles without drift',()=>{
 assert.deepEqual([0,90,180,270,360,450,-90].map(normalizedRotation),[0,90,180,270,0,90,270]);
 for(const garment of garments){
  const input={garment,preset:'A4',imageWidth:450,imageHeight:300};
  const zero=placementGeometry(input),ninety=placementGeometry({...input,rotation:90});
  assert.ok(Math.abs(ninety.rotatedWidth-ninety.height)<epsilon);
  assert.ok(Math.abs(ninety.rotatedHeight-ninety.width)<epsilon);
  assert.equal(placementGeometry({...input,rotation:360}).rotation,0);
  assert.equal(placementGeometry({...input,rotation:360}).x,zero.x);
  assert.equal(placementGeometry({...input,rotation:360}).y,zero.y);
 }
});
test('Move mode prioritizes reference guide whenever artwork fits',()=>{
 for(const garment of garments)for(const preset of ['A3','A4']){
  const input={garment,preset,imageWidth:900,imageHeight:250,adjustment:-25,constrainToGuide:true};
  for(const [dx,dy] of [[-1000,0],[1000,0],[0,1000],[0,-1000]]){
   const p=placementGeometry({...input,dx,dy});
   const box={x:p.rotatedX,y:p.rotatedY,width:p.rotatedWidth,height:p.rotatedHeight};
   assert.ok(inside(box,p.frame),{garment,preset,dx,dy,p});
  }
 }
});
test('When artwork is enlarged beyond guide, movement still never crosses garment boundary',()=>{
 for(const garment of garments)for(const preset of ['A3','A4']){
  const input={garment,preset,imageWidth:400,imageHeight:580,adjustment:100,constrainToGuide:true};
  for(const [dx,dy] of [[-10000,-10000],[10000,10000],[800,-800]]){
   const p=placementGeometry({...input,dx,dy});
   const box={x:p.rotatedX,y:p.rotatedY,width:p.rotatedWidth,height:p.rotatedHeight};
   assert.ok(inside(box,p.region),{garment,preset,dx,dy,p});
  }
 }
});
test('Reset center, adjustment and angle remain exact after a moved/rotated scene',()=>{
 for(const garment of garments){
  const p=placementGeometry({garment,preset:'A3',imageWidth:500,imageHeight:600,
   adjustment:0,rotation:0,dx:0,dy:0});
  assert.equal(p.rotation,0);assert.equal(p.adjustment,0);
  assert.ok(Math.abs(p.dx)<epsilon&&Math.abs(p.dy)<epsilon);
 }
});
