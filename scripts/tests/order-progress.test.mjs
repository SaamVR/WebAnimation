import test from 'node:test';
import assert from 'node:assert/strict';
import {MILESTONES,seekOrderMilestone,formatOrderState} from '../../site/order-demo/order-core.mjs';

test('five milestone times progress chronologically within existing ten-second film',()=>{
 assert.equal(MILESTONES.length,5);
 assert.equal(MILESTONES[0].timeMs,0);
 assert.ok(MILESTONES.every((m,i)=>i===0||m.timeMs>MILESTONES[i-1].timeMs));
 assert.ok(MILESTONES.at(-1).timeMs<=10200);
});
test('selecting a milestone produces actual film timestamp and browser state',()=>{
 const s=seekOrderMilestone('sealed');
 assert.equal(s.timeMs,5200);
 assert.equal(s.status,'sealed');
 assert.match(s.label,/Seal/i);
});
test('unrecognized selection does not falsely advance a customer order',()=>{
 const s=seekOrderMilestone('invalid');
 assert.equal(s.status,'placed');
 assert.equal(s.timeMs,0);
});
test('returns fictional sample tracking reference, not real shipment',()=>{
 const s=formatOrderState(seekOrderMilestone('handoff'));
 assert.equal(s.liveTracking,false);
 assert.equal(s.paymentProcessed,false);
 assert.equal(s.kind,'simulation');
 assert.match(s.message,/demo/i);
});
test('does not claim final doorstep delivery when source animation only dispatches package',()=>{
 assert.ok(!MILESTONES.some(x=>x.id==='delivered'));
});
