// Runtime-only compatibility repair for the exact owner-supplied Worker 1.
// Lottie-web's data completion converts relative mask tangents only when
// hasMask is true. Null-parent opacity is not inherited by child layers.
// Compose the contiguous botanical shapes in one native vector precomp so the
// original clip and group opacity apply once, in the original stacking order.
export function normalizeWorker1Leaf(data){
 const rig=data.layers.find(l=>l.ind===1001&&l.nm==='RIG leaf');
 const leaf=data.layers.filter(l=>l.parent===1001);
 const start=data.layers.indexOf(leaf[0]);
 const mask=leaf[0]?.masksProperties;
 if(!rig||rig.parent!==1000||leaf.length!==38||start<0||
 !leaf.every((l,i)=>data.layers[start+i]===l&&l.ty===4&&JSON.stringify(l.masksProperties)===JSON.stringify(mask))||
 mask?.length!==1||mask[0].nm!=='Original leaf print top-down brush reveal')throw Error('Worker 1 source leaf contract changed');
 const id='worker1-original-leaf-vector-precomp';
 const children=leaf.map(l=>{const {parent,masksProperties,...shape}=l;return shape});
 const first=leaf[0],{shapes,...layer}=first;
 const comp={...layer,ty:0,nm:'Original botanical leaf (SVG mask compatibility)',refId:id,w:data.w,h:data.h,hasMask:true,ks:{...first.ks,o:structuredClone(rig.ks.o)}};
 data.layers.splice(start,leaf.length,comp);
 data.assets.push({id,layers:children,w:data.w,h:data.h});
 return data;
}
