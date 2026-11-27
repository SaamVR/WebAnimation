import test from 'node:test';
import assert from 'node:assert/strict';
import {hero01Retraction,HERO01_SHADOW_CLEARANCE_PX,HERO01_RETRACTION_SCROLL_RATIO} from '../src/hero01-retraction.mjs';

test('scroll-top reproduces original paper origin without intrinsic motion',()=>{
 const s=hero01Retraction({scrollY:0,headerBottom:116,heroTop:116,paperHeight:306});
 assert.deepEqual(s,{progress:0,targetTop:116,offsetY:0,complete:false});
});

test('25/50/75/100 percent exact navbar-relative retraction including shadow clearance',()=>{
 const height=306,distance=height*HERO01_RETRACTION_SCROLL_RATIO,headerBottom=82;
 for(const fraction of [0,.25,.5,.75,1]){
  const y=distance*fraction;
  const heroTop=116-y;
  const s=hero01Retraction({scrollY:y,headerBottom,heroTop,paperHeight:height});
  assert.ok(Math.abs(s.progress-fraction)<1e-9);
  assert.ok(Math.abs((heroTop+s.offsetY)-(headerBottom-(height+HERO01_SHADOW_CLEARANCE_PX)*fraction))<1e-9);
  assert.equal(s.complete,fraction===1);
 }
});

test('reverse every step retraces identical paper/identity geometry, no easing or hysteresis',()=>{
 const h=275,distance=h*HERO01_RETRACTION_SCROLL_RATIO;
 const records=[0,.1,.25,.5,.75,.95,1].map(frac=>hero01Retraction({
  scrollY:frac*distance,headerBottom:66,heroTop:110-frac*distance,paperHeight:h
 }));
 for(let i=records.length-1;i>=0;i--){
  const s=hero01Retraction({scrollY:i===0?0:([0,.1,.25,.5,.75,.95,1][i]*distance),
   headerBottom:66,heroTop:110-[0,.1,.25,.5,.75,.95,1][i]*distance,paperHeight:h});
  assert.deepEqual(s,records[i]);
 }
});

test('clamps beyond full retraction, and a bad intermediate geometry does not produce NaN',()=>{
 const h=250;
 assert.equal(hero01Retraction({scrollY:900,headerBottom:66,heroTop:-800,paperHeight:h}).progress,1);
 assert.equal(hero01Retraction({scrollY:-10,headerBottom:100,heroTop:100,paperHeight:h}).progress,0);
 assert.deepEqual(hero01Retraction({scrollY:NaN,headerBottom:82,heroTop:82,paperHeight:h}),
  {progress:0,targetTop:82,offsetY:0,complete:false});
});

test('after the last retraction frame paper AND its drop shadow are fully behind the sticky header',()=>{
 const h=315,y=h*HERO01_RETRACTION_SCROLL_RATIO,headerBottom=82,heroTop=116-y;
 const state=hero01Retraction({scrollY:y,headerBottom,heroTop,paperHeight:h});
 const paperBottom=heroTop+state.offsetY+h;
 assert.equal(paperBottom,headerBottom-HERO01_SHADOW_CLEARANCE_PX);
 assert.ok(HERO01_SHADOW_CLEARANCE_PX>=10);
});

test('completed paper releases with the hero instead of tracking the sticky viewport',()=>{
 const h=306,d=h*HERO01_RETRACTION_SCROLL_RATIO,b=65;
 const a=hero01Retraction({scrollY:d,headerBottom:b,heroTop:b-d,paperHeight:h});
 for(const extra of [1,200,900,1800]){
  const s=hero01Retraction({scrollY:d+extra,headerBottom:b,heroTop:b-d-extra,paperHeight:h});
  assert.equal(s.complete,true);assert.ok(Math.abs(s.offsetY-a.offsetY)<1e-8);assert.ok(Math.abs(s.targetTop-(a.targetTop-extra))<1e-8);
 }
});
