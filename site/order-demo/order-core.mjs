// Presentation-only fulfillment state machine. Never a real shipment or payment.
export const MILESTONES=Object.freeze([
 Object.freeze({id:'placed',timeMs:0,label:'Order placed',description:'The confirmation begins the package journey.'}),
 Object.freeze({id:'prepared',timeMs:3000,label:'Product packed',description:'The order is positioned and protected inside its carton.'}),
 Object.freeze({id:'sealed',timeMs:5200,label:'Package sealed',description:'Flaps, shipping tape and label complete the package.'}),
 Object.freeze({id:'pickup',timeMs:7200,label:'Courier pickup',description:'The drone connects with the actual package before lifting.'}),
 Object.freeze({id:'handoff',timeMs:9600,label:'Dispatched',description:'The animated package exits into the delivery network.'})
]);
export function seekOrderMilestone(id){
 const found=MILESTONES.find(x=>x.id===id)||MILESTONES[0];
 return {...found,status:found.id};
}
export function formatOrderState(state){
 return {kind:'simulation',liveTracking:false,paymentProcessed:false,message:'Fictional order demo. '+state.description,stage:state.status};
}
