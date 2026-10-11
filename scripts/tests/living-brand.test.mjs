import test from 'node:test';
import assert from 'node:assert/strict';
import { BLENDS, chooseBlend } from '../../site/brand-demo/identity-core.mjs';
test('three tea variants have distinct product identities',()=>{
 assert.equal(BLENDS.length,3);
 assert.equal(new Set(BLENDS.map(x=>x.color)).size,3);
 assert.equal(new Set(BLENDS.map(x=>x.name)).size,3);
});
test('switching blend changes product message as well as color',()=>{
 const mint=chooseBlend('mint'),hibiscus=chooseBlend('hibiscus');
 assert.notEqual(mint.title,hibiscus.title);
 assert.notEqual(mint.color,hibiscus.color);
 assert.ok(mint.description.length>25);
});
test('invalid blends fall back to a stable hero product',()=>{
 assert.equal(chooseBlend('invalid').id,'mint');
 assert.equal(chooseBlend('mint').id,'mint');
});
test('all products are explicitly fictional and never imply a purchase',()=>{
 for(const p of BLENDS){
   assert.equal(p.status,'concept');
   assert.equal(p.checkoutConnected,false);
 }
});
