import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRequest, createBookingState, selectSlot, confirmBooking, AVAILABLE_SLOTS } from '../../site/relay-demo/relay-core.mjs';

test('recognizes service and requested duration',()=>{
 const d=extractRequest('Please book a 30 minute consultation on Tuesday morning');
 assert.deepEqual(d,{service:'Consultation',durationMinutes:30,preferredDay:'Tuesday',daypart:'Morning'});
});
test('falls back honestly for unspecified details',()=>{
 const d=extractRequest('I want help with my website');
 assert.equal(d.preferredDay,'Unspecified');
 assert.equal(d.durationMinutes,30);
 assert.equal(d.daypart,'Flexible');
});
test('selecting a slot does not confirm until an explicit action',()=>{
 const s=createBookingState('Book a Tuesday consultation');
 const selected=selectSlot(s,AVAILABLE_SLOTS[1].id);
 assert.equal(selected.status,'slot-selected');
 assert.equal(selected.confirmation,null);
 const confirmed=confirmBooking(selected);
 assert.equal(confirmed.status,'confirmed');
 assert.equal(confirmed.confirmation.time,AVAILABLE_SLOTS[1].label);
});
test('booking actions reject unavailable choices',()=>{
 const s=createBookingState('Book appointment');
 assert.throws(()=>selectSlot(s,'09:15'),/unavailable slot/i);
 assert.throws(()=>confirmBooking(s),/select a slot/i);
});
test('the workflow is a simulation, never an actual booking',()=>{
 const s=confirmBooking(selectSlot(createBookingState('Please book'),AVAILABLE_SLOTS[0].id));
 assert.equal(s.confirmation.kind,'simulation');
 assert.equal(s.confirmation.externalCalendarConnected,false);
 assert.equal(s.confirmation.paymentProcessed,false);
});
