import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavScrollState} from '../src/nav-scroll.mjs';
test('top stays visible; cumulative direction thresholds resist jitter',()=>{
 const s=createNavScrollState();assert.equal(s.step(0),'pinned');
 assert.equal(s.step(10),'pinned');assert.equal(s.step(25),'visible');assert.equal(s.step(50),'hidden');
 for(const y of [49,50,48,49,47,49])assert.equal(s.step(y),'hidden');
 assert.equal(s.step(37),'visible');assert.equal(s.step(0),'pinned');
});
test('fast down, small upward reversal, pinned overlays and overscroll',()=>{
 const s=createNavScrollState();assert.equal(s.step(500),'hidden');assert.equal(s.step(493),'hidden');assert.equal(s.step(488),'visible');
 assert.equal(s.step(800),'hidden');assert.equal(s.step(1000,{pinned:true}),'pinned');
 assert.equal(s.step(1000),'visible');assert.equal(s.step(1010),'visible');assert.equal(s.step(1040),'hidden');assert.equal(s.step(-5),'pinned');
});

test('lease restore preserves previous hidden mode',()=>{const s=createNavScrollState();assert.equal(s.step(500),'hidden');assert.equal(s.restore(540,true),'hidden');assert.equal(s.step(540),'hidden');assert.equal(s.step(526),'visible');assert.equal(s.restore(0,true),'pinned')});
