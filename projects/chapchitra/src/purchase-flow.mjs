import {priceArtistCustomization,formatArtistBDT} from './worktable-pricing.mjs';
import {readVariantKey,colorLabel} from './demo-variants.mjs';
import {sketchButton} from './handdrawn-buttons.mjs';
import {shirtSilhouette} from './components.mjs';
import {readArtwork} from './purchase-artwork.mjs';
export const PREFS='chapchitra-purchase-demo-v1',ORDER='chapchitra-demo-order-v1',COUPON='DEMO10';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{return JSON.parse(sessionStorage.getItem(k)||'null')??d}catch{return d}};
export function prefs(){const p=read(PREFS,{});return {coupon:p?.coupon===COUPON?COUPON:'',notes:typeof p?.notes==='string'?p.notes.slice(0,500):'',qty:p?.qty&&typeof p.qty==='object'?p.qty:{}}}
export function qtyFor(p,id){const q=p.qty[id];return Number.isInteger(q)&&q>0&&q<=99?q:1}
export function rowsFor(catalog,regular,custom,p){const rows=[];for(const [id,qty] of regular){const v=readVariantKey(id),item=catalog.find(x=>x.id===v?.id);if(item&&Number.isInteger(qty)&&qty>0&&qty<=99)rows.push({id,qty,title:item.name,variant:item.fit+' · '+colorLabel(v.color)+' · Size '+(v.size||'Not selected'),unit:Number.isFinite(item.price)&&item.price>=0?item.price:450,visual:item.visual,productId:item.id})}for(const item of custom){try{const s=priceArtistCustomization(item.selection);rows.push({id:item.id,qty:qtyFor(p,item.id),title:s.pricing.garmentLabel+' · Custom print',variant:colorLabel(s.color)+' · Size '+s.size,unit:s.pricing.total,custom:true,selection:s})}catch{}}return rows}
export function totals(rows,coupon){const subtotal=rows.reduce((s,r)=>s+r.qty*r.unit,0),discount=coupon===COUPON?Math.round(subtotal*.1):0;return {subtotal,discount,delivery:0,total:subtotal-discount}}
const money=formatArtistBDT;
const btn=(label,opts={})=>sketchButton({label,variant:'long',tone:'forest',className:'cc-buy-action',...opts});
const title=(h,p)=>'<header class="cc-buy-heading"><p class="eyebrow">CHAPCHITRA · DEMONSTRATION</p><h1>'+h+'</h1><p>'+p+'</p></header>';
const side=s=>s.hasArtwork?s.preset+' · '+s.dimensionsMm.join(' × ')+' mm':'No print';
const details=r=>r.custom?'<div class="cc-buy-print"><p>Front: '+esc(side(r.selection.front))+' · '+money(r.selection.pricing.front.charge)+'</p><p>Back: '+esc(side(r.selection.back))+' · '+money(r.selection.pricing.back.charge)+'</p></div>':'';
function row(r,summary=false){const id=esc(r.id),thumb=r.custom?'<div class="cc-buy-thumb cc-buy-custom" data-purchase-art="'+id+'"><span>Custom garment<br>Preview unavailable</span></div>':'<a class="cc-buy-thumb" href="/product/?id='+esc(r.productId)+'" aria-label="View '+esc(r.title)+'">'+shirtSilhouette(r.visual)+'</a>';return '<article class="cc-buy-row demo-bag-row" '+(r.custom?'data-artist-bag-row':'data-bag-row')+'="'+id+'">'+thumb+'<div class="cc-buy-product"><h3>'+(r.custom?esc(r.title):'<a href="/product/?id='+esc(r.productId)+'">'+esc(r.title)+'</a>')+'</h3><p>'+esc(r.variant)+'</p>'+details(r)+(r.custom&&!summary?'<a class="cc-buy-edit" href="/artists-edit/?edit='+encodeURIComponent(r.id)+'">Edit customization</a>':'')+(summary?'<p>Quantity: '+r.qty+'</p>':'')+'</div>'+(summary?'<strong>'+money(r.unit*r.qty)+'</strong>':'<div class="cc-buy-unit"><small>Unit price</small><strong>'+money(r.unit)+'</strong></div><div class="cc-buy-quantity"><small>Quantity</small><div class="demo-bag-stepper"><button type="button" '+(r.custom?'data-custom-adjust':'data-bag-adjust')+'="-1" '+(r.custom?'data-custom-id':'data-bag-id')+'="'+id+'" aria-label="Decrease quantity"'+(r.qty===1?' disabled':'')+'>−</button><output aria-label="Quantity">'+r.qty+'</output><button type="button" '+(r.custom?'data-custom-adjust':'data-bag-adjust')+'="1" '+(r.custom?'data-custom-id':'data-bag-id')+'="'+id+'" aria-label="Increase quantity"'+(r.qty===99?' disabled':'')+'>+</button></div></div><div class="cc-buy-line"><small>Subtotal</small><strong>'+money(r.unit*r.qty)+'</strong><button class="demo-bag-remove" type="button" '+(r.custom?'data-remove-artist-bag':'data-bag-remove')+'="'+id+'">Remove</button></div>')+'</article>'}
export async function hydratePreviews(root){for(const el of root.querySelectorAll('[data-purchase-art]'))try{const a=await readArtwork(el.dataset.purchaseArt);if(!a||!el.isConnected)continue;const imgs=[];for(const s of ['front','back']){if(!(a[s]?.preview instanceof Blob))continue;const url=URL.createObjectURL(a[s].preview),img=document.createElement('img');img.src=url;img.alt='Customized garment '+s+' preview';img.onload=img.onerror=()=>URL.revokeObjectURL(url);imgs.push(img)}if(imgs.length)el.replaceChildren(...imgs)}catch{}}
const totalMarkup=t=>'<dl class="cc-buy-totals"><div><dt>Subtotal</dt><dd>'+money(t.subtotal)+'</dd></div><div><dt>Discount</dt><dd>−'+money(t.discount)+'</dd></div><div><dt>Delivery (demo)</dt><dd>'+money(t.delivery)+'</dd></div><div class="cc-buy-total"><dt>Total (demo)</dt><dd>'+money(t.total)+'</dd></div></dl><p class="cc-buy-muted">Prices, coupon and zero delivery charge are demonstration values, not commercial offers. Taxes and real delivery rates are not configured.</p>';
export function bagMarkup(){return '<section class="wrap cc-buy cc-buy-bag">'+title('Shopping Bag','Review your prints and custom garments.')+'<div class="cc-buy-grid"><div><div class="cc-buy-tablehead"><span>Product</span><span>Price</span><span>Quantity</span><span>Subtotal</span></div><div id="bagItems" aria-live="polite"></div><div class="cc-buy-extras"><form id="purchaseCoupon"><label for="purchaseCouponCode">Coupon code <small>Try DEMO10 for this demo</small></label><div class="cc-buy-inline"><input id="purchaseCouponCode" maxlength="30" autocomplete="off" placeholder="Coupon code">'+sketchButton({label:'Apply',type:'submit',tone:'forest',className:'cc-sketch--inline'})+'</div><p id="purchaseCouponStatus" role="status"></p></form><label for="purchaseNotes">Additional order notes</label><textarea id="purchaseNotes" rows="4" maxlength="500" placeholder="Optional demo instructions"></textarea></div></div><aside class="demo-bag-summary cc-buy-summary"><h2>Order summary</h2><p id="bagQuantitySummary" role="status"></p><div id="purchaseTotals"></div><div id="purchaseCheckoutAction"></div>'+btn('Continue shopping',{href:'/shop/',tone:'beige'})+'</aside></div></section>'}
export function renderBag(root,rows,p){root.querySelector('#bagItems').innerHTML=rows.length?rows.map(r=>row(r)).join(''):'<p class="cc-buy-empty">Your bag is empty. Explore the shop or customize a garment.</p>';root.querySelector('#bagQuantitySummary').textContent=rows.reduce((n,r)=>n+r.qty,0)+' items · Browser-session demo';root.querySelector('#purchaseTotals').innerHTML=totalMarkup(totals(rows,p.coupon));root.querySelector('#purchaseCheckoutAction').innerHTML=rows.length?btn('Proceed to checkout',{href:'/checkout/'}):btn('Proceed to checkout',{attrs:'disabled aria-disabled="true"'});void hydratePreviews(root)}
const districts=['Bagerhat','Bandarban','Barguna','Barishal','Bhola','Bogura','Brahmanbaria','Chandpur','Chapainawabganj','Chattogram','Chuadanga','Cox’s Bazar','Cumilla','Dhaka','Dinajpur','Faridpur','Feni','Gaibandha','Gazipur','Gopalganj','Habiganj','Jamalpur','Jashore','Jhalokati','Jhenaidah','Joypurhat','Khagrachhari','Khulna','Kishoreganj','Kurigram','Kushtia','Lakshmipur','Lalmonirhat','Madaripur','Magura','Manikganj','Meherpur','Moulvibazar','Munshiganj','Mymensingh','Naogaon','Narail','Narayanganj','Narsingdi','Natore','Netrokona','Nilphamari','Noakhali','Pabna','Panchagarh','Patuakhali','Pirojpur','Rajbari','Rajshahi','Rangamati','Rangpur','Satkhira','Shariatpur','Sherpur','Sirajganj','Sunamganj','Sylhet','Tangail','Thakurgaon'];
const field=(name,label,attrs='')=>'<label class="cc-buy-field">'+label+'<input name="'+name+'" '+attrs+'></label>';
const radio=(name,value,label,checked=false)=>'<label class="cc-buy-radio"><input type="radio" name="'+name+'" value="'+value+'" '+(checked?'checked':'')+' required><span>'+label+'</span></label>';
export function checkoutMarkup(rows,p){if(!rows.length)return '<section class="wrap cc-buy">'+title('Checkout','Your bag is empty.')+btn('Continue shopping',{href:'/shop/'})+'</section>';return '<section class="wrap cc-buy cc-buy-checkout">'+title('Checkout','Preview only. Use fictional contact details; no payment or delivery will occur.')+'<div class="cc-buy-grid"><form id="purchaseCheckout"><fieldset><legend>Contact &amp; delivery</legend><div class="cc-buy-fields">'+field('first','First name *','required maxlength="80" autocomplete="given-name"')+field('last','Last name *','required maxlength="80" autocomplete="family-name"')+'<label class="cc-buy-field cc-buy-wide">Country / region<input name="country" value="Bangladesh" readonly></label>'+field('phone','Phone number *','type="tel" required maxlength="32" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX or +8801XXXXXXXXX"')+field('email','Email (optional)','type="email" maxlength="120" autocomplete="email"')+'<label class="cc-buy-field">District *<select name="district" required><option value="">Select district</option>'+districts.map(d=>'<option>'+esc(d)+'</option>').join('')+'</select></label>'+field('area','Area / Thana *','required maxlength="100" autocomplete="address-level2"')+'<label class="cc-buy-field cc-buy-wide">Full delivery address *<textarea name="address" rows="3" maxlength="300" required autocomplete="street-address"></textarea></label>'+field('postcode','Postcode (optional)','maxlength="12" autocomplete="postal-code"')+'</div></fieldset><fieldset><legend>Shipping method</legend>'+radio('shipping','demo','Standard delivery · ৳0 (demonstration)',true)+'</fieldset><fieldset><legend>Payment method</legend><p class="cc-buy-muted">Simulated only. No payment credentials requested.</p>'+radio('payment','cod','Cash on Delivery (demo)',true)+radio('payment','bkash','bKash (simulated)')+radio('payment','online','Online payment (simulated)')+'<p id="purchasePaymentHelp" role="status" class="cc-buy-muted">Simulated cash on delivery. Nothing is charged.</p></fieldset><fieldset><legend>Billing address</legend>'+radio('billing','same','Same as delivery address',true)+radio('billing','different','Use a different billing address')+'<label id="purchaseBilling" class="cc-buy-field" hidden>Billing address<textarea name="billingAddress" rows="3" maxlength="300" disabled></textarea></label></fieldset><fieldset><legend>Order notes (optional)</legend><textarea name="notes" maxlength="500" rows="4" aria-label="Order notes">'+esc(p.notes)+'</textarea></fieldset><label class="cc-buy-consent"><input name="terms" type="checkbox" required><span>I agree to the demonstration terms: no real order, charge or delivery is created. Commercial terms are not yet configured.</span></label><p id="purchaseFormStatus" role="alert"></p>'+btn('Place demo order',{type:'submit'})+'</form><aside class="cc-buy-summary"><h2>Order summary</h2><div class="cc-buy-summary-items">'+rows.map(r=>row(r,true)).join('')+'</div>'+totalMarkup(totals(rows,p.coupon))+'<a class="cc-buy-edit" href="/bag/">Edit shopping bag</a></aside></div></section>'}
// One validation contract for browser errors and order creation. Normalize local and
// international Bangladesh mobile formats, including Bangla digits and separators.
export function normalizeBangladeshPhone(value){
 const digits=String(value??'').trim().replace(/[০-৯]/g,ch=>String(ch.charCodeAt(0)-0x09e6)).replace(/[\s()\-\u2010-\u2015]/g,'');
 if(/^01[3-9]\d{8}$/.test(digits))return '+880'+digits.slice(1);
 if(/^\+?8801[3-9]\d{8}$/.test(digits))return '+'+digits.replace(/^\+/,'');
 if(/^008801[3-9]\d{8}$/.test(digits))return '+'+digits.slice(2);
 return null;
}
export function checkoutErrors(fields,rows){
 const f=fields||{},e={},present=n=>typeof f[n]==='string'&&f[n].trim().length>0;
 if(!present('first'))e.first='Enter your first name.';
 if(!present('last'))e.last='Enter your last name.';
 if(f.country!=='Bangladesh')e.country='Select Bangladesh as your delivery country.';
 if(!present('phone'))e.phone='Enter your mobile number.';
 else if(!normalizeBangladeshPhone(f.phone))e.phone='Enter a valid Bangladesh mobile number, e.g. 01712345678 or +8801712345678.';
 if(present('email')&&!/^[^\s@]+@[^\s@]+$/.test(f.email.trim()))e.email='Enter a valid email address or leave this field blank.';
 if(!districts.includes(f.district))e.district='Select your district.';
 if(!present('area'))e.area='Enter your area or thana.';
 if(!present('address'))e.address='Enter your full delivery address.';
 if(f.shipping!=='demo')e.shipping='Select the demonstration shipping method.';
 if(!['cod','bkash','online'].includes(f.payment))e.payment='Select a simulated payment method.';
 if(!['same','different'].includes(f.billing))e.billing='Select a billing address option.';
 if(f.billing==='different'&&!present('billingAddress'))e.billingAddress='Enter your billing address.';
 if(f.terms!=='on')e.terms='Agree to the demonstration terms before placing your order.';
 if(!rows.length)e.bag='Your bag is empty. Return to your shopping bag.';
 return e;
}
export function validate(fields,rows){const errors=checkoutErrors(fields,rows);if(Object.keys(errors).length)throw Error(Object.values(errors)[0]);return true}
export function makeOrder(f,rows,p,reference){validate(f,rows);return {schema:1,reference,rows,totals:totals(rows,p.coupon),delivery:{name:f.first.trim()+' '+f.last.trim(),address:f.address.trim(),area:f.area.trim(),district:f.district,postcode:f.postcode?.trim()||''},payment:f.payment,notes:f.notes?.slice(0,500)||''}}
export const readOrder=()=>{const o=read(ORDER,null);return o?.schema===1&&typeof o.reference==='string'&&Array.isArray(o.rows)&&o.totals&&o.delivery?o:null};
// Stable replacement mount for the owner-supplied Lottie asset.
export function confirmationSuccessMarkup(reference){return '<header class="cc-buy-heading cc-buy-success-heading"><div id="packing-animation-slot" class="cc-buy-success-mark" data-animation-slot="order-confirmation" role="img" aria-label="Order placed successfully"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="49" fill="var(--color-press-green,#293D2D)"/><path d="M27 51 43 67 74 35" fill="none" stroke="#F6F7F5" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p class="eyebrow">CHAPCHITRA · DEMONSTRATION</p><h1>Order Placed Successfully!</h1><p>Thank you for shopping with CHAPCHITRA.</p><p class="cc-buy-muted">This is a demonstration order. No payment was processed and no commercial order or delivery was created.</p><p class="cc-buy-reference">Demo reference · '+esc(reference)+'</p></header>'}
export function confirmationMarkup(o){if(!o)return '<section class="wrap cc-buy">'+title('Order confirmation','No demonstration order has been placed.')+btn('Continue shopping',{href:'/shop/'})+'</section>';return '<section class="wrap cc-buy cc-buy-confirm" data-confirmation-enter="pending">'+confirmationSuccessMarkup(o.reference)+'<div class="cc-buy-grid"><div><h2>Delivery information</h2><p>'+esc(o.delivery.name)+'<br>'+esc(o.delivery.address)+'<br>'+esc(o.delivery.area)+', '+esc(o.delivery.district)+' '+esc(o.delivery.postcode)+'<br>Bangladesh</p><p>Payment: '+esc(({cod:'Cash on Delivery',bkash:'bKash',online:'Online payment'})[o.payment])+' (simulated)</p>'+btn('Continue shopping',{href:'/shop/'})+'</div><aside class="cc-buy-summary"><h2>Order summary</h2><div class="cc-buy-summary-items" role="region" tabindex="0" aria-label="Ordered products">' +o.rows.map(r=>row(r,true)).join('')+'</div>'+totalMarkup(o.totals)+'</aside></div></section>'}
// Route layout and fonts settle before the confirmation entrance.
export async function mountConfirmation(root,view=window){
 const panel=root.querySelector('.cc-buy-confirm');if(!panel)return;
 const top=()=>view.scrollTo({top:0,left:0,behavior:'instant'});top();
 const sheet=root.ownerDocument.querySelector('link[href="/purchase-flow.css"]');
 if(sheet&&!sheet.sheet)await new Promise(done=>{sheet.addEventListener('load',done,{once:true});sheet.addEventListener('error',done,{once:true});view.setTimeout(done,1500)});
 await root.ownerDocument.fonts?.ready;
 await new Promise(done=>view.requestAnimationFrame(()=>view.requestAnimationFrame(done)));
 if(!panel.isConnected)return;top();
 panel.dataset.confirmationEnter=view.matchMedia('(prefers-reduced-motion: reduce)').matches?'static':'ready';
}
export function mountCheckout(root,getRows,onSubmit){
 const form=root.querySelector('#purchaseCheckout');if(!form)return;
 if(form.dataset.checkoutMounted)return;form.dataset.checkoutMounted='true';
 const status=root.querySelector('#purchaseFormStatus'),submit=form.querySelector('button[type="submit"]');
 const billing=root.querySelector('#purchaseBilling'),billingInput=billing.querySelector('textarea');
 let attempted=false,submitting=false;
 function syncOptions(){
  const different=form.elements.billing.value==='different';
  billing.hidden=!different;billingInput.disabled=!different;billingInput.required=different;
  root.querySelector('#purchasePaymentHelp').textContent=({cod:'Simulated cash on delivery. Nothing is charged.',bkash:'Simulated bKash. No account or PIN required.',online:'Simulated online payment. No card details required.'})[form.elements.payment.value]||'Select a simulated payment method.';
 }
 function controls(name){return [...form.querySelectorAll('[name]')].filter(el=>el.name===name&&!el.disabled)}
 function errorHost(name,list){
  const first=list[0];if(!first)return null;
  if(first.type==='radio')return first.closest('fieldset');
  return first.closest('label')||first.parentElement;
 }
 function clearErrors(){
  for(const el of form.querySelectorAll('[data-checkout-invalid]')){
   const id=el.dataset.checkoutInvalid;el.removeAttribute('data-checkout-invalid');el.removeAttribute('aria-invalid');
   const ids=(el.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x&&x!==id);
   if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');
  }
  for(const el of form.querySelectorAll('[data-checkout-error-host]'))el.removeAttribute('data-checkout-error-host');
  for(const el of form.querySelectorAll('[data-checkout-error]'))el.remove();
 }
 function check({focus=false}={}){
  clearErrors();const fields=Object.fromEntries(new FormData(form)),errors=checkoutErrors(fields,getRows());
  const email=form.elements.email;if(email.value.trim()&&email.validity.typeMismatch)errors.email='Enter a valid email address or leave this field blank.';
  let firstInvalid=null;
  // DOM order defines the first field, not the order of error discovery.
  const names=[...new Set([...form.elements].map(el=>el.name).filter(Boolean))];
  for(const name of names){
   if(!errors[name])continue;
   const list=controls(name),host=errorHost(name,list);if(!host)continue;
   const id='checkout-error-'+name,err=document.createElement('span');err.id=id;err.className='cc-buy-field-error';err.dataset.checkoutError=name;err.textContent=errors[name];
   host.dataset.checkoutErrorHost='true';host.append(err);
   for(const el of list){el.dataset.checkoutInvalid=id;el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',[el.getAttribute('aria-describedby'),id].filter(Boolean).join(' '))}
   if(!firstInvalid)firstInvalid=list[0];
  }
  const count=Object.keys(errors).length;
  status.textContent=errors.bag|| (count?'Please correct the highlighted '+(count===1?'field.':'fields.'):'');
  if(focus&&firstInvalid){firstInvalid.focus({preventScroll:true});firstInvalid.scrollIntoView({block:'center',inline:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
  return {fields,errors};
 }
 form.addEventListener('change',()=>{syncOptions();if(attempted)check()});
 form.addEventListener('input',()=>{if(attempted)check()});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(submitting)return;attempted=true;syncOptions();
  const {fields,errors}=check({focus:true});if(Object.keys(errors).length)return;
  submitting=true;if(submit)submit.disabled=true;status.textContent='Preparing your demonstration order…';
  try{await onSubmit({...fields,phone:normalizeBangladeshPhone(fields.phone),email:fields.email?.trim()||''})}
  catch(error){status.textContent='Could not place the demonstration order. '+String(error?.message||error).slice(0,180);submitting=false;if(submit)submit.disabled=false}
 });
 // Use accessible inline feedback rather than the browser silently blocking submit.
 // Native attributes remain for semantics and mobile keyboard selection.
 form.noValidate=true;syncOptions();void hydratePreviews(root)
}
