import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planC03Flight,shrinkAt} from '../src/motion/c03/geometry.mjs';

const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const flight=readFileSync(new URL('../src/motion/c03/fly-to-bag.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/motion/c03/fly-to-bag.css',import.meta.url),'utf8');

test('arc begins in lower-right product and ends in actual measured bag',()=>{
 const source={left:100,top:180,width:260,height:260};
 const bag={left:1230,top:38,width:36,height:36};
 const plan=planC03Flight(source,bag,{bottom:90},{width:1440,height:900});
 assert.deepEqual(plan.start,{x:276.8,y:367.2});
 assert.deepEqual(plan.end,{x:1248,y:56.72});
 assert.ok(plan.path.startsWith('M 276.80 367.20 Q '),plan.path);
 assert.ok(plan.entryScale>0&&plan.entryScale<=.16);
 assert.equal(plan.widthPx,source.width*.64);
 assert.equal(plan.heightPx,source.height*.64);
 assert.ok(plan.control.y>90);
});
test('geometry adapts to mobile/sticky header and rejects unavailable positions',()=>{
 const source={left:22,top:218,width:190,height:190};
 const bag={left:335,top:40,width:35,height:37};
 const plan=planC03Flight(source,bag,{bottom:93},{width:390,height:844});
 assert.ok(plan&&plan.end.x>plan.start.x&&plan.end.y<plan.start.y);
 assert.equal(plan.end.x,352.5);
 assert.equal(plan.control.x>plan.start.x,true);
 assert.equal(planC03Flight(source,{...bag,left:415},{bottom:93},{width:390,height:844}),null);
 assert.equal(planC03Flight({...source,width:0},bag,{bottom:93},{width:390,height:844}),null);
});
test('one continuous monotonic shrink to actual basket aperture',()=>{
 let prev=shrinkAt(0);assert.equal(prev,0);
 for(let i=1;i<=100;i++){
  const current=shrinkAt(i/100);
  assert.ok(current>=prev,'scale reduction reversed');
  prev=current;
 }
 assert.equal(prev,1);
});
test('only Product Detail successful add triggers motion; existing mutation owns quantity',()=>{
 assert.match(app,/const c03Ready=route==='product'/);
 assert.match(app,/if\(route==='product'&&count>previous\)/);
 assert.match(app,/setDemoBagQty\(item\.id,previous\+1\)/);
 assert.match(flight,/source\.cloneNode\(true\)/);
 assert.match(flight,/\.detail-art \.shirt-svg, \.detail-art img/);
 assert.match(flight,/\.site-header \.bag-link/);
 assert.doesNotMatch(flight,/setDemoBagQty|sessionStorage\.setItem|\.click\(\)/);
 assert.match(css,/pointer-events:none/);
 assert.doesNotMatch(css,/background:var\(--fog\)|background:var\(--beige\)/);
 assert.match(flight,/prefers-reduced-motion: reduce/);
 assert.match(flight,/pagehide',cancelC03/);
 assert.match(flight,/gs\.timeline\(/);
});
