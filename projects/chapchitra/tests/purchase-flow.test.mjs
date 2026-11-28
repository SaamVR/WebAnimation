import test from 'node:test';import assert from 'node:assert/strict';import {rowsFor,totals,validate,makeOrder,bagMarkup,checkoutMarkup,confirmationMarkup} from '../src/purchase-flow.mjs';import {catalog} from '../src/catalog.mjs';
const side={hasArtwork:true,preset:'A4',editor:{x:0,y:0,adjustment:0,rotation:0}},p={coupon:'DEMO10',notes:'Demo note',qty:{custom_example123:2}};
const rows=rowsFor(catalog,new Map([['study-001~M~red',2]]),[{id:'custom_example123',selection:{garment:'regular',size:'L',color:'blue',front:side,back:{...side,hasArtwork:false}}}],p);
const f={first:'Demo',last:'Customer',phone:'01700000000',country:'Bangladesh',district:'Dhaka',area:'Demo area',address:'Demo address',payment:'bkash',billing:'same',shipping:'demo',terms:'on'};
test('purchase rows are repriced and coupon arithmetic is deterministic',()=>{assert.equal(rows.length,2);assert.equal(rows[0].unit,450);assert.equal(rows[1].unit,550);assert.equal(rows[1].qty,2);assert.deepEqual(totals(rows,p.coupon),{subtotal:2000,discount:200,delivery:0,total:1800});assert.equal(totals(rows,'fake').discount,0)});
test('purchase validation rejects missing consent, incorrect number and empty bag',()=>{assert.equal(validate(f,rows),true);assert.throws(()=>validate({...f,terms:''},rows));assert.throws(()=>validate({...f,phone:'123'},rows));assert.throws(()=>validate({...f,billing:'different'},rows));assert.throws(()=>validate(f,[]))});
test('purchase pages are explicit demo; no payment credentials and packing placeholder',()=>{assert.match(bagMarkup(),/Shopping Bag/);const html=checkoutMarkup(rows,p);for(const label of ['Cash on Delivery','bKash','Online payment','Billing address','Place demo order','Edit shopping bag'])assert.ok(html.includes(label));assert.doesNotMatch(html,/name="(?:card|cvv|pin|password)"/);const o=makeOrder(f,rows,p,'CC-DEMO-1234');assert.equal(o.totals.total,1800);assert.match(confirmationMarkup(o),/packing-animation-slot/);assert.match(confirmationMarkup(o),/CC-DEMO-1234/);assert.doesNotMatch(confirmationMarkup(o),/01700000000/)});

test('Bangladesh phone normalizes national, international, spaced, Bengali and 00880 formats',async()=>{
 const {normalizeBangladeshPhone}=await import('../src/purchase-flow.mjs');
 for(const number of ['01712345678','+8801712345678','8801712345678','+880 1712-345678','০১৭১২৩৪৫৬৭৮','008801712345678'])assert.equal(normalizeBangladeshPhone(number),'+8801712345678',number);
 for(const number of ['', '0171234567','+88001712345678','017123456789','abc01712345678','02123456789'])assert.equal(normalizeBangladeshPhone(number),null,number);
});
test('field errors are specific and all simulated methods can create orders',async()=>{
 const {checkoutErrors}=await import('../src/purchase-flow.mjs');
 const errors=checkoutErrors({...f,first:' ',last:'',phone:'123',email:'bad',district:'',area:'',address:'',billing:'different',terms:''},rows);
 for(const name of ['first','last','phone','email','district','area','address','billingAddress','terms'])assert.ok(errors[name],name);
 for(const payment of ['cod','bkash','online'])for(const phone of ['01712345678','+8801712345678']){
  const fields={...f,payment,phone};assert.deepEqual(checkoutErrors(fields,rows),{});assert.equal(makeOrder(fields,rows,p,'CC-DEMO-1234').payment,payment)
 }
});
test('confirmation has owner exact copy and independently replaceable Press Green checkmark',()=>{
 const html=confirmationMarkup(makeOrder(f,rows,p,'CC-DEMO-1234'));
 for(const x of ['Order Placed Successfully!','Thank you for shopping with CHAPCHITRA.','data-animation-slot="order-confirmation"','--color-press-green,#293D2D','No payment was processed'])assert.ok(html.includes(x),x);
 assert.doesNotMatch(html,/PACKING ANIMATION|Artwork pending/);
});
