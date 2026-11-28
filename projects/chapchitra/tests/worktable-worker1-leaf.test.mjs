import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {normalizeWorker1Leaf} from '../src/worktable-worker1-leaf.mjs';
test('Worker 1 compatibility repair preserves original shape geometry, stacking, mask and ink fade',async()=>{
 const source=JSON.parse(await readFile(new URL('../src/assets/worktable-workers/Worker1_Brush_Presentation_VECTOR.json',import.meta.url)));
 const result=normalizeWorker1Leaf(structuredClone(source));const leaf=source.layers.filter(l=>l.parent===1001),start=source.layers.indexOf(leaf[0]),comp=result.layers[start];
 assert.equal(leaf.length,38);assert.deepEqual(result.layers.slice(0,start),source.layers.slice(0,start));assert.deepEqual(result.layers.slice(start+1),source.layers.slice(start+38));
 assert.equal(comp.ty,0);assert.equal(comp.hasMask,true);assert.equal(comp.parent,1001);assert.deepEqual(comp.masksProperties,leaf[0].masksProperties);assert.deepEqual(comp.ks.o,source.layers.find(l=>l.ind===1001).ks.o);
 assert.deepEqual(result.assets[0].layers,leaf.map(({parent,masksProperties,...l})=>l));assert.deepEqual([result.w,result.h,result.fr,result.ip,result.op],[512,512,30,0,120]);assert.throws(()=>normalizeWorker1Leaf(result));
});
