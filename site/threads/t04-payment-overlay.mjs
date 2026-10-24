/** T04: test-card-only checkout overlay. Approved payment artwork unchanged. */
import {startDemoPayment,resolveDemoPayment,resetAttempt,getAttempt} from './store-core.mjs';
import {playT04Approved} from './t04-payment-approved.mjs';
import {loadMotionLibrary} from './t02-motion-runtime.mjs';
export function initT04PaymentOverlay({form,cardForm,proceed,showError}){
 const overlay=document.createElement('div');
 overlay.id='t04-payment-overlay';overlay.className='t04-overlay';overlay.hidden=true;
 overlay.innerHTML=`<div class="t04-overlay__backdrop" aria-hidden="true"></div>
 <section class="t04-overlay__dialog" role="dialog" aria-modal="true" aria-labelledby="t04-dialog-heading" tabindex="-1">
  <h2 id="t04-dialog-heading" class="sr-only">Demo card payment</h2>
  <button type="button" id="t04-dialog-close" class="t04-overlay__close" aria-label="Close simulated payment">×</button>
  <div id="payment-stage" class="store-payment-stage" aria-live="polite" data-t04-stage="idle"></div>
 </section>`;
 document.body.append(overlay);
 const dialog=overlay.querySelector('[role=dialog]'),stage=overlay.querySelector('#payment-stage');
 const closeButton=overlay.querySelector('#t04-dialog-close'),shell=document.querySelector('#site-shell');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const motion=loadMotionLibrary();let processing=false,exiting=false,previousFocus,overflow='',token=0;
 const validCard=()=>cardForm.checkValidity() &&
  cardForm.elements.demoCardNumber.value.replace(/\s/g,'')==='4242424242424242' &&
  cardForm.elements.demoCardExpiry.value.trim()==='12/30' &&
  cardForm.elements.demoCardCvv.value==='123' &&
  cardForm.elements.demoCardholder.value.trim().length>=2;
 const sync=()=>{proceed.disabled=processing||cardForm.closest('#checkout-card-step')?.hidden||!form.checkValidity()||!validCard()};
 const clearCard=()=>{for(const key of ['demoCardholder','demoCardNumber','demoCardExpiry','demoCardCvv'])cardForm.elements[key].value='';sync()};
 const gsEnter=async()=>{const gs=await motion;if(overlay.hidden)return;
  if(reduce.matches||!gs)return;
  gs.fromTo(dialog,{opacity:0,y:18,scale:.98},{opacity:1,y:0,scale:1,duration:.28,ease:'power2.out',clearProps:'transform,opacity'})};
 const gsExit=async()=>{const gs=await motion;if(!reduce.matches&&gs&&!overlay.hidden)
  await new Promise(done=>gs.to(dialog,{opacity:0,y:10,scale:.985,duration:.18,ease:'power1.in',onComplete:done}))};
 const open=()=>{previousFocus=document.activeElement;overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';overlay.hidden=false;shell.inert=true;
  dialog.focus({preventScroll:true});void gsEnter()};
 const close=async()=>{
  if(overlay.hidden||exiting||stage.dataset.t04Stage==='succeeded')return;
  exiting=true;token++;
  if(getAttempt()?.status==='pending')try{resolveDemoPayment('cancelled')}catch{}
  clearCard();await gsExit();
  overlay.hidden=true;dialog.removeAttribute('style');shell.inert=false;document.body.style.overflow=overflow;
  resetAttempt();processing=false;sync();(previousFocus?.isConnected?previousFocus:proceed).focus({preventScroll:true});exiting=false;
 };
 const pending=()=>{
  stage.dataset.t04Stage='pending';
  stage.innerHTML=`<div class="t04-pending">
   <div class="t04-approval-visual" aria-hidden="true"><div class="t04-demo-card">
    <span class="t04-demo-card__brand">THREADS</span><span class="t04-demo-card__chip"></span>
    <span class="t04-demo-card__note">PAYMENT SIMULATION</span>
   </div><span class="t04-pending-spinner"></span></div>
   <span class="store-badge">Processing · Demo</span>
   <h2>Processing test payment</h2><p>Simulated authorization only. No money is charged.</p>
  </div>`;
 };
 const failure=message=>{
  stage.dataset.t04Stage='failed';
  stage.innerHTML=`<div class="t04-outcome"><h2>Payment could not complete</h2>
    <p id="t04-failure"></p><button type="button" id="return-checkout" class="store-primary-btn">Return to card details</button></div>`;
  stage.querySelector('#t04-failure').textContent=message;
  stage.querySelector('#return-checkout').addEventListener('click',()=>void close());
  stage.querySelector('#return-checkout').focus({preventScroll:true});
 };
 const submit=async()=>{
  if(processing||exiting||!overlay.hidden)return;
  if(!form.reportValidity())return;
  if(!cardForm.reportValidity()||!validCard()){
   showError('Use the provided test card 4242 4242 4242 4242, expiry 12/30 and CVV 123. Do not enter real card details.');
   return;
  }
  processing=true;sync();const current=++token;
  try{
   // Important: only contact/delivery fields are passed to session state, never test PAN/CVV.
   const contact=Object.fromEntries(new FormData(form));
   startDemoPayment({name:contact.name,email:contact.email,phone:contact.phone,city:contact.city,address:contact.address});
   clearCard();showError('');open();pending();closeButton.focus({preventScroll:true});
   await new Promise(done=>setTimeout(done,reduce.matches?250:1050));
   if(token!==current||overlay.hidden)return;
   const result=resolveDemoPayment('succeeded');
   if(result?.status!=='succeeded'||!result.ref)throw Error('Demo payment was not approved');
   stage.dataset.t04Stage='succeeded';closeButton.disabled=true;
   await playT04Approved(stage);
   await new Promise(done=>setTimeout(done,reduce.matches?80:650));
   if(token!==current)return;
   await gsExit();window.location.replace('/order/?ref='+encodeURIComponent(result.ref));
  }catch(err){
   if(token===current){const message=err instanceof Error?err.message:'Payment could not complete';
    showError(message);if(!overlay.hidden)failure(message)}
  }finally{processing=false;sync()}
 };
 proceed.addEventListener('click',()=>void submit());
 cardForm.addEventListener('submit',event=>{event.preventDefault();void submit()});
 for(const f of [form,cardForm]){f.addEventListener('input',sync);f.addEventListener('change',sync)}
 closeButton.addEventListener('click',()=>void close());
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();if(stage.dataset.t04Stage!=='succeeded')void close();return}
  if(event.key!=='Tab')return;
  const nodes=[...dialog.querySelectorAll('button:not(:disabled),[href],input:not(:disabled)')]
   .filter(n=>n.getClientRects().length);
  if(!nodes.length){event.preventDefault();dialog.focus();return}
  if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1).focus()}
  else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus()}
 });
 window.addEventListener('pagehide',()=>{token++;shell.inert=false;document.body.style.overflow=overflow;clearCard()},{once:true});
 sync();
}
