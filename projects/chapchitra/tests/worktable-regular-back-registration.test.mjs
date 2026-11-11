import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const back=JSON.parse(readFileSync(new URL('browser-assets/worktable/back/manifest.json',root)));
const front=JSON.parse(readFileSync(new URL('browser-assets/worktable/manifest.json',root)));
const master=front['Tshirts/walnut_table_background_exact_tone_4K_1.png'];
const item=back.assets.regular;
test('Regular Tee back uses measured visible source silhouette, not low-alpha debris',()=>{
 assert.equal(item.sha256,'4dfe2de4a4cca7a1730a801bb59d4bbf29cfa60a4ca82d0868d7ac673400aa24');
 assert.equal(item.registration.method,'alpha-threshold-visible-silhouette');
 assert.deepEqual(item.registration.nativeVisibleBounds,[1134,375,2860,2081]);
 assert.deepEqual(item.delivery.crop,[1122,363,1750,1730]);
});
test('visible front and back collars, centers and hems match without nonuniform stretching',()=>{
 const [fx0,fy0,fx1,fy1]=master.bbox;
 const [x,y,w,h]=item.delivery.stageBox;
 const [cx,cy,cw,ch]=item.delivery.crop;
 const [vx0,vy0,vx1,vy1]=item.registration.nativeVisibleBounds;
 const fromNativeX=p=>x+(p-cx)*w/cw,fromNativeY=p=>y+(p-cy)*h/ch;
 const backBox={left:fromNativeX(vx0),top:fromNativeY(vy0),
  right:fromNativeX(vx1),bottom:fromNativeY(vy1)};
 assert.ok(Math.abs(backBox.top-fy0)<.2,'top collar');
 assert.ok(Math.abs(backBox.bottom-fy1)<.2,'hem');
 assert.ok(Math.abs((backBox.left+backBox.right)/2-(fx0+fx1)/2)<.3,'center');
 const frontWidth=fx1-fx0,backWidth=backBox.right-backBox.left;
 assert.ok(backWidth/frontWidth>.94&&backWidth/frontWidth<1.02,'proportional visible width');
 assert.ok(Math.abs(w/h-cw/ch)<0.0001,'no nonuniform stretch');
});
test('Only Regular Tee variant registration is revised; other three remain original',()=>{
 const expected={dropShoulder:[580.2995,183.4443,890.4009,877.1114],
  fullSleeve:[616.4517,192.5558,823.0966,864.8885],
  hoodie:[644.2867,213.4502,764.4267,850.0996]};
 for(const [key,box] of Object.entries(expected)){
  assert.deepEqual(back.assets[key].delivery.stageBox,box,key);
  assert.equal(back.assets[key].delivery.variants.length,3);
 }
});
