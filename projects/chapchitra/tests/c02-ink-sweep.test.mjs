import test from 'node:test';
import assert from 'node:assert/strict';
import {C02_PATHS,isC02Eligible} from '../src/motion/c02/ink-sweep.mjs';

test('C02 targets precisely the four approved top-level Home journeys',()=>{
 assert.deepEqual(C02_PATHS,['/shop/','/artists-edit/','/journal/','/about/']);
 for(const pathname of C02_PATHS){
  for(const source of ['primary','mobile']){
   assert.equal(isC02Eligible({page:'home',pathname,source}),true,pathname+' '+source);
  }
 }
});
test('C02 never catches product, checkout, cart, journal article, or other flows',()=>{
 for(const pathname of ['/product/','/product/?id=1','/bag/','/checkout/','/journal/story/','/favorites/','/','/shop/item/']){
  assert.equal(isC02Eligible({page:'home',pathname,source:'primary'}),false,pathname);
 }
 for(const page of ['shop','artists-edit','journal','about','product','bag']){
  assert.equal(isC02Eligible({page,pathname:'/shop/',source:'primary'}),false,page);
 }
 assert.equal(isC02Eligible({page:'home',pathname:'/shop/',source:'hero'}),false);
 assert.equal(isC02Eligible({page:'home',pathname:'/shop/',source:'footer'}),false);
});
test('C02 preserves browser link semantics, downloads, external targets and origins',()=>{
 const base={page:'home',pathname:'/shop/',source:'primary'};
 for(const override of [
  {modified:true},{sameOrigin:false},{download:true},
  {target:'_blank'},{target:'_top'},{target:'_parent'}
 ]){
  assert.equal(isC02Eligible({...base,...override}),false,JSON.stringify(override));
 }
 assert.equal(isC02Eligible({...base,target:'_self'}),true);
});
test('C02 has an independent ID; reusable SVG buttons never occupy this module',()=>{
 assert.equal(C02_PATHS.length,4);
});
