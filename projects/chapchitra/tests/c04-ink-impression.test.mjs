import test from 'node:test';
import assert from 'node:assert/strict';
import {INK_IMPRESSION_MS,INK_IMPRESSION_FRAMES,playInkImpression,cancelInkImpression} from '../src/motion/c04/ink-impression.mjs';
function element(){
 const classes=new Set(),calls=[],anims=[];
 const el={isConnected:true,
  classList:{add:n=>classes.add(n),remove:n=>classes.delete(n),contains:n=>classes.has(n)},
  animate(frames,options){
   const listeners={};
   const animation={frames,options,addEventListener:(name,fn)=>listeners[name]=fn,cancel(){
    this.cancelled=true;
    listeners.cancel?.();
   },finish(){listeners.finish?.()}};
   anims.push(animation);calls.push({frames,options});return animation;
  }};
 return {el,classes,calls,anims};
}
test('five decisive keyframes: 0/45/100/200/280ms; fully static 80ms hold',()=>{
 assert.equal(INK_IMPRESSION_MS,280);
 assert.deepEqual(INK_IMPRESSION_FRAMES.map(f=>Math.round(f.offset*280)),[0,45,100,200,280]);
 assert.equal(INK_IMPRESSION_FRAMES[1].opacity,.85);
 assert.equal(INK_IMPRESSION_FRAMES[2].opacity,1);
 assert.equal(INK_IMPRESSION_FRAMES[3].transform,INK_IMPRESSION_FRAMES[4].transform);
 assert.equal(INK_IMPRESSION_FRAMES[4].opacity,1);
 assert.ok(INK_IMPRESSION_FRAMES.every(f=>!/(spring|bounce|elastic)/i.test(f.easing||'')));
});
test('one-shot, compositor properties only, no persistent transform or opacity',()=>{
 const {el,classes,calls}=element();
 const anim=playInkImpression(el,{reducedMotion:false});
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0].options,{duration:280,iterations:1,fill:'none',easing:'linear'});
 assert.ok(calls[0].frames.every(f=>Object.keys(f).every(k=>['offset','easing','opacity','transform'].includes(k))));
 assert.ok(classes.has('cc-c04-inking'));
 anim.finish();
 assert.ok(!classes.has('cc-c04-inking'));
 assert.equal(Object.hasOwn(el,'style'),false);
});
test('interrupts without queue; reduced motion and disconnected nodes do nothing',()=>{
 const {el,anims}=element();
 playInkImpression(el,{reducedMotion:false});
 playInkImpression(el,{reducedMotion:false});
 assert.equal(anims.length,2);
 assert.equal(anims[0].cancelled,true);
 cancelInkImpression(el);
 assert.equal(anims[1].cancelled,true);
 assert.equal(playInkImpression(el,{reducedMotion:true}),null);
 el.isConnected=false;
 assert.equal(playInkImpression(el,{reducedMotion:false}),null);
 assert.equal(anims.length,2);
});
