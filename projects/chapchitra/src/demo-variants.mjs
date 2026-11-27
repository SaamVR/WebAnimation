export const DEMO_SIZES=Object.freeze(['S','M','L','XL','XXL']);
export const DEMO_COLORS=Object.freeze(['black','white','red','yellow','green','blue']);
export function variantKey(id,size='',color=''){
 if(!/^study-\d{3}$/.test(id)||size&&!DEMO_SIZES.includes(size)||color&&!DEMO_COLORS.includes(color))return null;
 return size||color?[id,size||'-',color||'-'].join('~'):id;
}
export function readVariantKey(key){
 if(typeof key!=='string')return null;
 const parts=key.split('~');if(parts.length!==1&&parts.length!==3)return null;
 const [id,s='',c='']=parts,size=s==='-'?'':s,color=c==='-'?'':c;
 return variantKey(id,size,color)===key?{id,size,color}:null;
}
export const colorLabel=color=>color?color[0].toUpperCase()+color.slice(1):'Not specified';
