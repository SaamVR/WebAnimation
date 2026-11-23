import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../src/motion/c08/logo-player.mjs',import.meta.url),'utf8');
const original=JSON.parse(readFileSync(new URL('../src/assets/c08/wordmark-reprint-original.json',import.meta.url),'utf8'));
const cream=JSON.parse(readFileSync(new URL('../src/assets/c08/wordmark-reprint-dark-owner-cream.json',import.meta.url),'utf8'));

test('C08 waits for original Cloth_patch decoding before revealing animated lettering',()=>{
 assert.match(code,/const clothIsDecoded=\(\)=>cloth\.complete&&cloth\.naturalWidth>0/);
 assert.match(code,/await cloth\.decode\(\)/);
 assert.match(code,/const clothReady=await waitForCloth\(\)/);
 assert.match(code,/if\(!clothReady\)\{/);
 assert.match(code,/!hero\.ready\|\|!clothIsDecoded\(\)/);
 assert.match(code,/throw new Error\('C08 original Cloth_patch could not be decoded'\)/);
 assert.match(code,/throw new Error\('C08 themed Cloth_patch could not be decoded'\)/);
});
test('C08 cold-load gate leaves the original frame budget, paint and movement assets intact',()=>{
 for(const data of [original,cream]){
  assert.equal(data.fr,60);
  assert.equal(data.op,240);
  assert.equal(data.ip,0);
  assert.deepEqual(data.layers.map(layer=>layer.nm),[
    'ROLLER_ASSEMBLY_MASTER','ROLLER_HANDLE_ROD','ROLLER_CYLINDER',
    'HIDDEN_T','PRINT_REVEAL','BASE_WORDMARK'
  ]);
 }
 assert.match(code,/hero\.instance\.play\(\)/);
 assert.match(code,/next\.goToAndStop\(frame,true\)/);
 assert.match(code,/onHeroHolding\(true\)/);
});
