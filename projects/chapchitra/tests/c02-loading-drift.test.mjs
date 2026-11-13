import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {c02DriftAmplitude,c02DriftPhase,c02DriftAdvance,c02DriftFrame}
 from '../src/motion/c02/loading-drift.mjs';
test('bounded drift never exposes source edge at desktop/tablet/mobile',()=>{
 for(const width of [390,834,1280,1920,3440]){
  const edge=width*1.226;
  const amplitude=c02DriftAmplitude(width,edge);
  assert.ok(amplitude>0&&amplitude<=32);
  for(let n=0;n<=128;n++){
   const x=c02DriftFrame(2*Math.PI*n/128,amplitude).x;
   assert.ok(Math.abs(x)<=amplitude+1e-8);
   assert.ok(edge+x>width+24,'pigment still covers entire viewport');
  }
 }
});
test('reversible loop retains position and direction at phase handoff',()=>{
 let p=0,previous=-Infinity,turns=0;
 for(let t=0;t<12000;t+=16){
  p=c02DriftAdvance(p,16);
  const sample=c02DriftFrame(p,28);
  assert.ok(Math.abs(sample.x)<=28);
  if(previous!==-Infinity&&sample.direction!==previous)turns++;
  previous=sample.direction;
 }
 assert.ok(turns>=4&&turns<=7);
 assert.equal(c02DriftPhase(-Math.PI),Math.PI);
 const saved=c02DriftFrame(p,28);
 assert.deepEqual(c02DriftFrame(saved.phase,28),saved);
});
test('source uses exact incoming prepaint displacement and no repeated texture',async()=>{
 const runtime=await readFile(new URL('../src/motion/c02/ink-sweep.mjs',import.meta.url),'utf8');
 const early=await readFile(new URL('../src/motion/c02/early-head.html',import.meta.url),'utf8');
 assert.match(runtime,/overlay\.restoreDrift\(ticket\.drift\|\|\{\}\)/);
 assert.match(runtime,/if\(p>=1\)overlay\.startDrift\(\)/);
 assert.match(runtime,/overlay\.stopDrift\(\)/);
 assert.match(runtime,/if\(edgeStyle==='asset'\)overlay\.startDrift\(\)/);
 assert.match(runtime,/progress:1,startedAt,demoMs,edgeStyle,/);
 assert.match(runtime,/drift:overlay\.driftSnapshot\(\)/);
 assert.match(early,/rightContact-8096\*scale\+driftX/);
 assert.match(early,/dataset\.c02PrepaintDriftX/);
 assert.doesNotMatch(runtime,/background-repeat:repeat-x|texture.*tile/);
});
