import test from 'node:test';
import assert from 'node:assert/strict';
import {variantKey,readVariantKey,DEMO_COLORS,DEMO_SIZES} from '../src/demo-variants.mjs';
test('legacy sample rows remain backward compatible',()=>{
 assert.equal(variantKey('study-001'),'study-001');
 assert.deepEqual(readVariantKey('study-001'),{id:'study-001',size:'',color:''});
});
test('variant identities distinguish size and color and roundtrip',()=>{
 const keys=new Set();
 for(const size of DEMO_SIZES)for(const color of DEMO_COLORS){
  const key=variantKey('study-001',size,color);keys.add(key);assert.deepEqual(readVariantKey(key),{id:'study-001',size,color});
 }
 assert.equal(keys.size,30);
 assert.deepEqual(readVariantKey(variantKey('study-001','L','')),{id:'study-001',size:'L',color:''});
});
test('unknown and malformed values fail closed',()=>{
 for(const key of ['study-001~XXXL~red','study-001~S~bad','study-001~','study-001~-~-','other~S~red','study-001~S~red~x',null])assert.equal(readVariantKey(key),null);
});
