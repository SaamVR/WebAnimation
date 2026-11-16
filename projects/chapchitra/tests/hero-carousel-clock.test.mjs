import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO_DWELL_MS,createHeroCarouselClock} from '../src/hero-carousel-clock.mjs';

function harness() {
 let ms=0,visible=true,hovered=false,reduced=false,holding=true,id=0,scheduled=new Map();
 const transitions=[];
 const clock=createHeroCarouselClock({
  now:()=>ms,canRun:()=>visible&&!hovered&&!reduced,isLocked:()=>holding,
  setTimer:(fn,delay)=>{const h=++id;scheduled.set(h,{at:ms+delay,fn});return h},
  clearTimer:h=>scheduled.delete(h),
  onAdvance:next=>{transitions.push({at:ms,slide:next});clock.startSlide(next)}
 });
 const advance=delta=>{
  const target=ms+delta;
  while(true){
   const due=[...scheduled].filter(([,v])=>v.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!due)break;
   ms=due[1].at;scheduled.delete(due[0]);due[1].fn();
  }
  ms=target;
 };
 return {clock,advance,transitions,
  hold:v=>{holding=v;if(!holding)clock.resume()},
  visible:v=>{visible=v;if(visible)clock.resume();else clock.pause()},
  hover:v=>{hovered=v;if(hovered)clock.pause();else clock.resume()},
  reduced:v=>{reduced=v;if(reduced)clock.pause();else clock.resume()}};
}
test('Hero01 stays for 8000ms total, counting C08 playback',()=>{
 const h=harness();h.clock.startSlide(0);h.advance(4000);
 assert.equal(h.clock.snapshot().remainingMs,4000);
 h.hold(false);h.advance(3999);assert.equal(h.transitions.length,0);
 h.advance(1);assert.deepEqual(h.transitions,[{at:8000,slide:1}]);
});
test('unfinished C08 is not interrupted when its 8000ms deadline expires',()=>{
 const h=harness();h.clock.startSlide(0);h.advance(9000);
 assert.equal(h.transitions.length,0);assert.equal(h.clock.snapshot().waitingForC08,true);
 h.hold(false);assert.deepEqual(h.transitions,[{at:9000,slide:1}]);
});
test('Heroes 02–05 dwell 4000ms, repeat Hero01 dwell is again 8000ms',()=>{
 const h=harness();h.hold(false);h.clock.startSlide(0);h.advance(8000);
 for(let i=2;i<=4;i++){h.advance(4000);assert.equal(h.clock.snapshot().slide,i)}
 h.advance(4000);assert.equal(h.clock.snapshot().slide,0);
 h.advance(7999);assert.equal(h.clock.snapshot().slide,0);
 h.advance(1);assert.equal(h.clock.snapshot().slide,1);
 assert.deepEqual(HERO_DWELL_MS,[8000,4000,4000,4000,4000]);
});
test('offscreen and hover preserve the remaining deadline',()=>{
 const h=harness();h.hold(false);h.clock.startSlide(0);h.advance(2000);
 h.visible(false);h.advance(20000);assert.equal(h.clock.snapshot().remainingMs,6000);
 h.visible(true);h.advance(1000);h.hover(true);h.advance(7000);
 assert.equal(h.clock.snapshot().remainingMs,5000);
 h.hover(false);h.advance(4999);assert.equal(h.transitions.length,0);
 h.advance(1);assert.equal(h.transitions[0].slide,1);
});
test('manual navigation resets selected slide, reduced motion prevents autoplay',()=>{
 const h=harness();h.hold(false);h.clock.startSlide(0);h.advance(1234);
 h.clock.startSlide(3);assert.equal(h.clock.snapshot().remainingMs,4000);
 h.advance(2500);h.reduced(true);h.advance(6000);
 assert.equal(h.clock.snapshot().remainingMs,1500);
 h.reduced(false);h.advance(1500);assert.equal(h.clock.snapshot().slide,4);
});
