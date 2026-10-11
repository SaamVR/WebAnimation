// Fictional brand identity application. No e-commerce connectivity.
export const BLENDS=Object.freeze([
 Object.freeze({id:'mint',name:'Morning Mint',title:'A brighter beginning.',description:'Cooling spearmint leaves and the clarity of a quiet morning ritual.',color:'#8cae84',surface:'#e3e9cf',status:'concept',checkoutConnected:false}),
 Object.freeze({id:'chamomile',name:'Evening Chamomile',title:'Pause, then unwind.',description:'Golden botanicals, soft warmth and a deliberately slower evening.',color:'#bf9e6d',surface:'#f6ead0',status:'concept',checkoutConnected:false}),
 Object.freeze({id:'hibiscus',name:'Hibiscus Bloom',title:'A little more vibrant.',description:'Deep floral color and an expressive fruit-forward tea concept.',color:'#be6d79',surface:'#f4dcde',status:'concept',checkoutConnected:false})
]);
export function chooseBlend(id){return BLENDS.find(x=>x.id===id)||BLENDS[0]}
