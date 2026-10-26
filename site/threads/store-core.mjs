import {dealUnitPrice,dealSavings,roundMoney} from './deals.mjs';
import {catalogById,productMeta,priceTk} from './catalog.mjs';
export const CART_KEY='threads.demo.cart.v1';
export const FAVORITES_KEY='threads.demo.favorites.v1';
export const ORDER_KEY='threads.demo.orders.v1';
export const ATTEMPT_KEY='threads.demo.payment.v1';
const storage=(kind='local')=>{try{return kind==='session'?globalThis.sessionStorage:globalThis.localStorage}catch{return null}};
const parse=(key,fallback,kind='local')=>{try{return JSON.parse(storage(kind)?.getItem(key)||'null')??fallback}catch{return fallback}};
const save=(key,value,kind='local')=>{try{storage(kind)?.setItem(key,JSON.stringify(value))}catch{}};
const signal=()=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('threads:cartchange',{detail:cartSummary()}))};
export function variantOptions(product){return productMeta(product)}
export function variantAvailable(product,color,size){
 if(!product)return false;
 const m=productMeta(product);
 if(!m.colors.some(x=>x.id===color)||!m.sizes.includes(size))return false;
 // Synthetic, predictable inventory rule for the demo. There is no inventory API.
 return !(product.id==='n2'&&color==='color-2'&&size==='43');
}
function sanitizedCart(raw){
 if(!Array.isArray(raw))return [];
 const cleaned=[],keys=new Set();
 for(const x of raw.slice(0,60)){
  if(!x||typeof x.id!=='string'||typeof x.color!=='string'||typeof x.size!=='string')continue;
  if(!variantAvailable(catalogById[x.id],x.color,x.size))continue;
  const quantity=Number(x.quantity);
  if(!Number.isInteger(quantity)||quantity<1||quantity>10)continue;
  const key=[x.id,x.color,x.size].join('~');
  if(keys.has(key))continue;
  keys.add(key);cleaned.push({id:x.id,color:x.color,size:x.size,quantity});
 }
 return cleaned;
}
export const getCart=()=>sanitizedCart(parse(CART_KEY,[]));
export const cartCount=()=>getCart().reduce((n,x)=>n+x.quantity,0);
export const cartSummary=(at=Date.now())=>{
 const items=getCart().map(x=>{
  const product=catalogById[x.id],unitPrice=dealUnitPrice(product,at);
  return {...x,product,unitPrice,originalPrice:product.price,
          subtotal:roundMoney(unitPrice*x.quantity),
          savings:roundMoney(dealSavings(product,at)*x.quantity)};
 });
 return {items,count:items.reduce((n,x)=>n+x.quantity,0),
  total:roundMoney(items.reduce((n,x)=>n+x.subtotal,0)),
  savings:roundMoney(items.reduce((n,x)=>n+x.savings,0))};
};
function writeCart(items){save(CART_KEY,items);signal();return cartSummary()}
export function addCartItem({id,color='color-0',size,quantity=1}){
 const product=catalogById[id],meta=product&&productMeta(product);
 if(!product)throw Error('Choose a valid demo product.');
 const resolvedSize=size??meta.sizes[0];
 const qty=Number(quantity);
 if(!variantAvailable(product,color,resolvedSize))throw Error('This combination is unavailable. Please choose another.');
 if(!Number.isInteger(qty)||qty<1||qty>10)throw Error('Quantity must be between 1 and 10.');
 const cart=getCart();
 const line=cart.find(x=>x.id===id&&x.color===color&&x.size===resolvedSize);
 if(line){if(line.quantity+qty>10)throw Error('Maximum 10 of one variant in the demo cart.');line.quantity+=qty}
 else cart.push({id,color,size:resolvedSize,quantity:qty});
 return writeCart(cart);
}
export function updateCartItem({id,color,size},quantity){
 const cart=getCart(),line=cart.find(x=>x.id===id&&x.color===color&&x.size===size);
 if(!line)throw Error('Cart line not found.');
 const qty=Number(quantity);
 if(!Number.isInteger(qty)||qty<0||qty>10)throw Error('Quantity must be between 0 and 10.');
 if(!qty)return removeCartItem({id,color,size});
 line.quantity=qty;return writeCart(cart);
}
export function removeCartItem({id,color,size}){return writeCart(getCart().filter(x=>!(x.id===id&&x.color===color&&x.size===size)))}
export function clearCart(){return writeCart([])}
export const cartKey=({id,color,size})=>[id,color,size].join('~');
export function getFavorites(){const raw=parse(FAVORITES_KEY,[]);return new Set(Array.isArray(raw)?raw.filter(x=>typeof x==='string'&&catalogById[x]):[])}
export function toggleFavorite(id){
 if(!catalogById[id])return false;
 const fav=getFavorites();if(fav.has(id))fav.delete(id);else fav.add(id);
 save(FAVORITES_KEY,[...fav]);
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('threads:favoriteschange',{detail:{id,selected:fav.has(id)}}));
 return fav.has(id);
}
export const getOrders=()=>{const o=parse(ORDER_KEY,[]);return Array.isArray(o)?o.filter(x=>x&&x.status==='succeeded'&&typeof x.ref==='string'):[]};
export const getOrder=ref=>getOrders().find(x=>x.ref===ref);
const randomId=()=>globalThis.crypto?.randomUUID?.()||'demo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
export const getAttempt=()=>{const a=parse(ATTEMPT_KEY,null,'session');return a&&typeof a==='object'&&['idle','pending','failed','cancelled','succeeded'].includes(a.status)?a:null};
export function startDemoPayment(form){
 const cart=cartSummary();
 if(!cart.items.length)throw Error('Your cart is empty.');
 const old=getAttempt();
 if(old?.status==='pending')return old;
 if(old?.status==='succeeded'&&getOrder(old.ref))return old;
 const email=String(form.email||'').trim(),name=String(form.name||'').trim(),address=String(form.address||'').trim(),city=String(form.city||'').trim(),phone=String(form.phone||'').trim();
 if(name.length<2||name.length>80||!/.+@.+\..+/.test(email)||address.length<5||city.length<2||phone.replace(/\D/g,'').length<8)throw Error('Enter valid contact and delivery details.');
 // The demo does not transmit or persist contact/delivery details; only a flag is retained.
 const a={id:randomId(),status:'pending',startedAt:new Date().toISOString(),
   items:cart.items.map(x=>({id:x.id,color:x.color,size:x.size,quantity:x.quantity,price:x.unitPrice,originalPrice:x.originalPrice})),total:cart.total,contactProvided:true};
 save(ATTEMPT_KEY,a,'session');return a;
}
export function resolveDemoPayment(result){
 const attempt=getAttempt();
 if(!attempt)throw Error('No demo transaction is in progress.');
 if(attempt.status==='succeeded'&&getOrder(attempt.ref))return attempt;
 if(attempt.status!=='pending')throw Error('This transaction is not pending. Retry checkout to begin a new one.');
 if(!['succeeded','failed','cancelled'].includes(result))throw Error('Invalid demo payment outcome.');
 if(result==='succeeded'){
  const exists=getOrders().find(x=>x.paymentAttemptId===attempt.id);
  const order=exists||{ref:'THR-'+Date.now().toString(36).toUpperCase()+'-'+attempt.id.slice(0,6).toUpperCase(),
   paymentAttemptId:attempt.id,status:'succeeded',createdAt:new Date().toISOString(),
   items:attempt.items,total:attempt.total,paymentMethod:'Simulated payment (no funds transferred)'};
  if(!exists)save(ORDER_KEY,[...getOrders(),order].slice(-30));
  clearCart();
  attempt.ref=order.ref;
 }
 attempt.status=result;
 save(ATTEMPT_KEY,attempt,'session');return attempt;
}
export function resetAttempt(){try{storage('session')?.removeItem(ATTEMPT_KEY)}catch{}}
export {priceTk};
