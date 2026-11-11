/**
 * CHAPCHITRA Artist's Edit — central, TEMPORARY, client-only BDT price schedule.
 *
 * Owner may update this table later without changing the calculator or UI:
 *   Regular Tee 450, Drop Shoulder 550, Full Sleeve 650, Hoodie 850.
 *   A4: 100 per printed side; A3: 200 per printed side; no art: 0.
 *
 * NOT server-trusted or payable. Any future checkout MUST reprice server-side.
 */
export const ARTIST_PRICING = Object.freeze({
 currency:'BDT',
 version:'placeholder-2026-11-12-v1',
 garments:Object.freeze({
  regular:Object.freeze({label:'Regular Tee',price:450}),
  dropShoulder:Object.freeze({label:'Drop Shoulder',price:550}),
  fullSleeve:Object.freeze({label:'Full Sleeve',price:650}),
  hoodie:Object.freeze({label:'Hoodie',price:850}),
 }),
 printPerSide:Object.freeze({
  A4:Object.freeze({label:'A4',price:100,widthMm:210,heightMm:297}),
  A3:Object.freeze({label:'A3',price:200,widthMm:297,heightMm:420}),
 }),
});

const validObject=x=>x&&typeof x==='object'&&!Array.isArray(x);
const hasOwn=(o,key)=>Object.prototype.hasOwnProperty.call(o,key);
const allowedSizes=Object.freeze(['S','M','L','XL','XXL']);
const allowedColors=Object.freeze(['black','white','red','yellow','blue','green']);
export const ARTIST_CART_STORAGE_KEY='chapchitra-artist-customizations-v1';
export const ARTIST_CART_MAX_ITEMS=20;
export const formatArtistBDT=n=>'৳'+new Intl.NumberFormat('en-BD',{maximumFractionDigits:0}).format(n);
function cleanSide(raw){
 if(!validObject(raw) || typeof raw.hasArtwork!=='boolean')
  throw new TypeError('Artwork presence must be a boolean');
 const preset=raw.preset;
 if(!hasOwn(ARTIST_PRICING.printPerSide,preset))throw new RangeError('Unknown printing size');
 return {hasArtwork:raw.hasArtwork,preset};
}
export function calculateArtistPrice(selection){
 if(!validObject(selection)||!hasOwn(ARTIST_PRICING.garments,selection.garment))
  throw new RangeError('Unknown garment price');
 const garment=ARTIST_PRICING.garments[selection.garment];
 const front=cleanSide(selection.front),back=cleanSide(selection.back);
 const calculatedSide=side=>{
  const paper=ARTIST_PRICING.printPerSide[side.preset];
  return Object.freeze({
   hasArtwork:side.hasArtwork,preset:side.preset,
   sizeLabel:side.hasArtwork?side.preset:'No artwork',
   dimensionsMm:side.hasArtwork?Object.freeze([paper.widthMm,paper.heightMm]):null,
   charge:side.hasArtwork?paper.price:0,
  });
 };
 const f=calculatedSide(front),b=calculatedSide(back);
 return Object.freeze({
  currency:ARTIST_PRICING.currency,
  pricingVersion:ARTIST_PRICING.version,
  garment:selection.garment,
  garmentLabel:garment.label,
  base:garment.price,
  front:f,back:b,
  total:garment.price+f.charge+b.charge,
  provisional:true,
 });
}
const finiteNumber=(v,defaultValue=0)=>{
 if(typeof v!=='number'||!Number.isFinite(v))return defaultValue;
 return Math.round(v*1000)/1000;
};
function sanitizeSide(raw){
 const side=cleanSide(raw);
 const e=validObject(raw.editor)?raw.editor:{};
 return {
  ...side,
  editor:{
   x:finiteNumber(e.x),y:finiteNumber(e.y),
   adjustment:finiteNumber(e.adjustment),
   rotation:finiteNumber(e.rotation),
  },
 };
}
export function buildArtistCustomization(selection){
 if(!validObject(selection))throw new TypeError('Selection is required');
 const {garment,color,size}=selection;
 if(!allowedSizes.includes(size))throw new RangeError('Unknown garment size');
 if(!allowedColors.includes(color))throw new RangeError('Unknown fabric color');
 const front=sanitizeSide(selection.front),back=sanitizeSide(selection.back);
 const price=calculateArtistPrice({garment,front,back});
 // Do not persist File, object URL, bitmap or any uploaded image bytes.
 return Object.freeze({
  schema:'chapchitra-artist-configuration/1',
  garment,color,size,
  front:Object.freeze({...front,dimensionsMm:price.front.dimensionsMm}),
  back:Object.freeze({...back,dimensionsMm:price.back.dimensionsMm}),
  pricingVersion:price.pricingVersion,
  currency:price.currency,
  displayTotalBDT:price.total, // display-only; ALWAYS reprice at checkout
 });
}
export function priceArtistCustomization(config){
 const normalized=buildArtistCustomization(config);
 return Object.freeze({
  ...normalized,
  pricing:calculateArtistPrice(normalized),
 });
}
export function readArtistDemoBag(raw){
 if(!Array.isArray(raw))return [];
 const clean=[];
 for(const row of raw.slice(0,ARTIST_CART_MAX_ITEMS)){
  try{
   if(!validObject(row)||typeof row.id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(row.id))continue;
   const item=priceArtistCustomization(row.selection);
   // Refuse unknown/future incompatible pricing snapshots rather than
   // silently treating untrusted browser records as production authority.
   clean.push(Object.freeze({id:row.id,selection:item}));
  }catch{}
 }
 return clean;
}
