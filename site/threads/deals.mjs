/** A single globally shared UTC schedule; never starts from page-load or browser storage. */
export const OFFER_EXPIRES_AT='2026-11-08T23:59:59Z'; // End of the initial cycle.
export const OFFER_EXPIRY_MS=Date.parse(OFFER_EXPIRES_AT);
export const OFFER_CYCLE_MS=21*24*60*60*1000;
export const DEAL_PERCENT=15;
export const DEAL_PRODUCT_IDS=Object.freeze([
 'n1','sho-04','sho-06','sho-08',  // Four genuine sneakers
 'hat-04','acc-03',             // Cap and watch
 'bag-01','bag-05'              // Backpack and duffel
]);
const eligible=new Set(DEAL_PRODUCT_IDS);
/** Returns the next exclusive UTC cycle boundary, including at exact rollover. */
export const offerCycleEnd=(at=Date.now())=>{
 const elapsed=Math.max(0,Math.floor((at-OFFER_EXPIRY_MS)/OFFER_CYCLE_MS)+1);
 return OFFER_EXPIRY_MS+elapsed*OFFER_CYCLE_MS;
};
// Compatibility export: the eight demo offers are permanent, not time-gated.
export const offerIsActive=()=>true;
export const isDealProduct=id=>eligible.has(id);
export const roundMoney=n=>Math.round((n+Number.EPSILON)*100)/100;
export const dealUnitPrice=(product,at=Date.now())=>roundMoney(
 product.price*(eligible.has(product.id)?(100-DEAL_PERCENT)/100:1));
export const dealSavings=(product,at=Date.now())=>roundMoney(product.price-dealUnitPrice(product,at));
export const moneyUSD=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',
 minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export const countdownParts=(at=Date.now())=>{
 const seconds=Math.ceil((offerCycleEnd(at)-at)/1000);
 return [Math.floor(seconds/86400),Math.floor(seconds%86400/3600),
 Math.floor(seconds%3600/60),seconds%60];
};
export const dealDisplay=(product,at=Date.now())=>{
 const reduced=dealSavings(product,at)>0;
 return reduced?`<span class="deal-original">${moneyUSD(product.price)}</span> <strong class="deal-current">${moneyUSD(dealUnitPrice(product,at))}</strong>`:
 `<strong class="deal-current">${moneyUSD(product.price)}</strong>`;
};
