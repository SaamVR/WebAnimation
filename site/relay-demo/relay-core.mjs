// Functional, deterministic demo model. No calendar, AI, messaging or payment APIs are called.
export const AVAILABLE_SLOTS=Object.freeze([
 {id:'09:00',label:'9:00 AM'},{id:'10:30',label:'10:30 AM'},{id:'11:30',label:'11:30 AM'}
]);

export function extractRequest(text){
 const value=String(text||'');
 const duration=value.match(/\b(15|30|45|60)\s*(?:minutes?|mins?)\b/i);
 const day=value.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
 const hour=value.match(/\b(morning|afternoon|evening)\b/i);
 const service=/consultation|consult|call/i.test(value)?'Consultation':/repair|fix|service visit/i.test(value)?'Service visit':'General enquiry';
 return {
  service,
  durationMinutes:duration?Number(duration[1]):30,
  preferredDay:day?day[1].charAt(0).toUpperCase()+day[1].slice(1).toLowerCase():'Unspecified',
  daypart:hour?hour[1].charAt(0).toUpperCase()+hour[1].slice(1).toLowerCase():'Flexible'
 };
}
export function createBookingState(text){
 return {request:String(text||''),details:extractRequest(text),selectedSlot:null,status:'ready',confirmation:null};
}
export function selectSlot(state,id){
 const found=AVAILABLE_SLOTS.find(s=>s.id===id);
 if(!found)throw new Error('Cannot select unavailable slot');
 return {...state,status:'slot-selected',selectedSlot:found.id,confirmation:null};
}
export function confirmBooking(state){
 if(!state.selectedSlot)throw new Error('Select a slot before confirming');
 const found=AVAILABLE_SLOTS.find(s=>s.id===state.selectedSlot);
 if(!found)throw new Error('Cannot confirm unavailable slot');
 return {...state,status:'confirmed',confirmation:{
  kind:'simulation',
  service:state.details.service,
  time:found.label,
  preferredDay:state.details.preferredDay,
  externalCalendarConnected:false,
  paymentProcessed:false
 }};
}
