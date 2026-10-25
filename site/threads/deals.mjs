/** Single UTC expiration, shared by every visitor. No per-session countdown or reset. */
export const OFFER_EXPIRES_AT='2026-11-08T23:59:59Z';
export const OFFER_EXPIRY_MS=Date.parse(OFFER_EXPIRES_AT);
export const DEAL_PERCENT=15;
export const DEAL_PRODUCT_IDS=Object.freeze([
 'n1','sho-04','sho-06','sho-08',  // Four genuine sneakers
 'hat-04','acc-03',             // Cap and watch
 'bag-01','bag-05'              // Backpack and duffel
]);
const eligible=new Set(DEAL_PRODUCT_IDS);
export const offerIsActive=(at=Date.now())=>Number.isFinite(at)&&at<OFFER_EXPIRY_MS;
export const isDealProduct=(id)=>eligible.has(id);
export const roundMoney=n=>Math.round((n+Number.EPSILON)*100)/100;
export const dealUnitPrice=(product,at=Date.now())=>roundMoney(
 product.price*(eligible.has(product.id)&&offerIsActive(at)?(100-DEAL_PERCENT)/100:1));
export const dealSavings=(product,at=Date.now())=>roundMoney(product.price-dealUnitPrice(product,at));
export const moneyUSD=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',
 minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export const countdownParts=(at=Date.now())=>{
 const seconds=Math.max(0,Math.ceil((OFFER_EXPIRY_MS-at)/1000));
 return [Math.floor(seconds/86400),Math.floor(seconds%86400/3600),
 Math.floor(seconds%3600/60),seconds%60];
};
export const dealDisplay=(product,at=Date.now())=>{
 const reduced=dealSavings(product,at)>0;
 return reduced?`<span class="deal-original">${moneyUSD(product.price)}</span> <strong class="deal-current">${moneyUSD(dealUnitPrice(product,at))}</strong>`:
 `<strong class="deal-current">${moneyUSD(product.price)}</strong>`;
};
