import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ARTIST_PRICING, calculateArtistPrice, formatArtistBDT,
 buildArtistCustomization, priceArtistCustomization, readArtistDemoBag,
 ARTIST_CART_MAX_ITEMS,
} from '../src/worktable-pricing.mjs';
const s=(art=false,preset='A4',editor={x:0,y:0,adjustment:0,rotation:0})=>({hasArtwork:art,preset,editor});
const base=(garment='regular',front=s(),back=s())=>({garment,color:'white',size:'M',front,back});
test('all four garment baseline values and provisional BDT config',()=>{
 const prices={regular:450,dropShoulder:550,fullSleeve:650,hoodie:850};
 assert.equal(ARTIST_PRICING.currency,'BDT');
 assert.ok(ARTIST_PRICING.version.includes('placeholder'));
 for(const [garment,expected] of Object.entries(prices)){
  const v=calculateArtistPrice(base(garment));
  assert.equal(v.base,expected,garment);assert.equal(v.total,expected);
  assert.equal(v.front.charge,0);assert.equal(v.back.charge,0);
  assert.equal(v.provisional,true);
 }
});
test('five owner examples calculate exactly',()=>{
 const cases=[
  [base('regular',s(true,'A4')),550],
  [base('regular',s(true,'A4'),s(true,'A4')),650],
  [base('dropShoulder',s(true,'A3')),750],
  [base('fullSleeve',s(true,'A4'),s(true,'A3')),950],
  [base('hoodie',s(true,'A3'),s(true,'A3')),1250],
 ];
 for(const [selection,total] of cases)assert.equal(calculateArtistPrice(selection).total,total);
 assert.equal(formatArtistBDT(1250),'৳1,250');
});
test('no artwork is free even when chosen print-size is A3; independent side charging',()=>{
 const blank=calculateArtistPrice(base('regular',s(false,'A3'),s(false,'A4')));
 assert.equal(blank.total,450);assert.equal(blank.front.sizeLabel,'No artwork');
 const backOnly=calculateArtistPrice(base('regular',s(false,'A3'),s(true,'A4')));
 assert.equal(backOnly.total,550);assert.equal(backOnly.front.charge,0);
 const noBack=calculateArtistPrice(base('regular',s(true,'A3'),s(false,'A3')));
 assert.equal(noBack.total,650);assert.equal(noBack.back.charge,0);
 const both=calculateArtistPrice(base('regular',s(true,'A4'),s(true,'A3')));
 assert.equal(both.total,750);
});
test('four garments × all sides × both paper sizes, color and garment size are price-neutral',()=>{
 for(const garment of Object.keys(ARTIST_PRICING.garments))
 for(const a of ['A4','A3'])
 for(const b of ['A4','A3'])
 for(const frontHas of [false,true])
 for(const backHas of [false,true]){
  const chosen=base(garment,s(frontHas,a),s(backHas,b));
  const total=calculateArtistPrice(chosen).total;
  const expected=ARTIST_PRICING.garments[garment].price+
   (frontHas?ARTIST_PRICING.printPerSide[a].price:0)+
   (backHas?ARTIST_PRICING.printPerSide[b].price:0);
  assert.equal(total,expected);
  chosen.color='red';chosen.size='XXL';
  assert.equal(calculateArtistPrice(chosen).total,expected);
 }
});
test('print dimensions and edit settings accompany demo-bag metadata (no uploaded bytes)',()=>{
 const config=buildArtistCustomization(base('hoodie',
  s(true,'A4',{x:12.34567,y:-1,adjustment:50,rotation:25}),
  s(true,'A3',{x:2,y:3,adjustment:10,rotation:-10})));
 assert.deepEqual(config.front.dimensionsMm,[210,297]);
 assert.deepEqual(config.back.dimensionsMm,[297,420]);
 assert.equal(config.displayTotalBDT,1150);
 assert.equal(config.front.editor.x,12.346);
 const text=JSON.stringify(config);
 assert.ok(!/bitmap|blob:|data:image|objectURL|fileName|src/i.test(text));
 assert.equal(priceArtistCustomization(config).pricing.total,1150);
});
test('session bag parsing ignores stored client totals, recalculates, rejects malformed items',()=>{
 const selection=buildArtistCustomization(base('regular',s(true,'A4'),s(true,'A3')));
 const rows=readArtistDemoBag([
  {id:'custom_valid-12345',selection:{...selection,displayTotalBDT:1,pricingVersion:'tampered'}},
  {id:'xxx',selection},
  {id:'custom_bad-invalid',selection:{...selection,garment:'unknown'}},
 ]);
 assert.equal(rows.length,1);
 assert.equal(rows[0].selection.pricing.total,750);
 assert.equal(rows[0].selection.displayTotalBDT,750);
 assert.ok(ARTIST_CART_MAX_ITEMS<=20);
});
test('invalid presets, garments, sizes, colors and falsified presence are rejected',()=>{
 assert.throws(()=>calculateArtistPrice(base('madeUp')),RangeError);
 assert.throws(()=>calculateArtistPrice(base('regular',s(true,'A1'))),RangeError);
 assert.throws(()=>calculateArtistPrice(base('regular',{hasArtwork:'yes',preset:'A4'})),TypeError);
 assert.throws(()=>buildArtistCustomization({...base(),size:'XXXXL'}),RangeError);
 assert.throws(()=>buildArtistCustomization({...base(),color:'transparent'}),RangeError);
});
