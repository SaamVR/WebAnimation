/** Checkout-only payment modal. The existing T04 success artwork/timeline is unchanged. */
import {startDemoPayment,resolveDemoPayment,resetAttempt} from './store-core.mjs';
import {playT04Approved} from './t04-payment-approved.mjs';
import {loadMotionLibrary} from './t02-motion-runtime.mjs';

export function initT04PaymentOverlay({form,start,showError}){
 const overlay=document.createElement('div');
 overlay.id='t04-payment-overlay';overlay.className='t04-overlay';overlay.hidden=true;
 overlay.innerHTML=`<div class="t04-overlay__backdrop" aria-hidden="true"></div>
  <section class="t04-overlay__dialog" role="dialog" aria-modal="true" aria-labelledby="t04-dialog-heading" aria-describedby="t04-dialog-description" tabindex="-1">
    <h2 id="t04-dialog-heading" class="sr-only">Simulated payment</h2>
    <p id="t04-dialog-description" class="sr-only">No real money is charged.</p>
    <button type="button" id="t04-dialog-close" class="t04-overlay__close" aria-label="Cancel demo payment and return to checkout">×</button>
    <div id="payment-stage" class="store-payment-stage" data-t04-stage="idle" aria-live="polite"></div>
  </section>`;
 document.body.append(overlay);
 const stage=overlay.querySelector('#payment-stage');
 const dialog=overlay.querySelector('.t04-overlay__dialog');
 const closeButton=overlay.querySelector('#t04-dialog-close');
 const shell=document.querySelector('#site-shell');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const gsapPromise=loadMotionLibrary();
 let busy=false,exiting=false,previousFocus=null,oldOverflow='';
 const focusAction=()=>{(stage.querySelector('button:not(:disabled)')||dialog).focus({preventScroll:true})};
 const animateEnter=async()=>{
  const gs=await gsapPromise;
  if(overlay.hidden)return;
  if(reduce.matches||!gs){overlay.classList.add('is-ready');return}
  gs.fromTo(dialog,{autoAlpha:0,y:18,scale:.98},
    {autoAlpha:1,y:0,scale:1,duration:.28,ease:'power2.out',clearProps:'transform,opacity,visibility',onComplete:()=>overlay.classList.add('is-ready')});
 };
 const animateExit=async()=>{
  const gs=await gsapPromise;
  if(!reduce.matches&&gs&&!overlay.hidden){
   await new Promise(done=>gs.to(dialog,{opacity:0,y:10,scale:.985,duration:.18,ease:'power1.in',onComplete:done}));
  }
 };
 const open=()=>{
  if(!overlay.hidden)return;
  previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  overlay.hidden=false;shell.inert=true;dialog.focus({preventScroll:true});void animateEnter();
 };
 const close=async()=>{
  if(overlay.hidden||busy||exiting)return;
  exiting=true;
  await animateExit();
  overlay.hidden=true;overlay.classList.remove('is-ready');dialog.removeAttribute('style');
  shell.inert=false;document.body.style.overflow=oldOverflow;
  resetAttempt();start.disabled=false;start.dataset.t04Stage='idle';
  (previousFocus?.isConnected?previousFocus:start).focus({preventScroll:true});
  exiting=false;
 };
 const display=(status,message='')=>{
  stage.dataset.t04Stage=status;start.dataset.t04Stage=status;
  closeButton.disabled=false;
  if(status==='pending'){
   start.disabled=true;
   stage.innerHTML=`<div class="t04-pending">
     <div class="t04-approval-visual" aria-hidden="true"><div class="t04-demo-card">
       <span class="t04-demo-card__brand">THREADS</span>
       <span class="t04-demo-card__chip"></span>
       <span class="t04-demo-card__note">PAYMENT SIMULATION</span>
     </div><span class="t04-pending-spinner"></span></div>
     <span class="store-badge">Processing · Demo</span>
     <h2>Payment pending</h2>
     <p>Choose a simulated result. No bank transaction will take place.</p>
     <div class="store-payment-actions">
       <button type="button" id="simulate-success" class="store-primary-btn">Approve demo payment</button>
       <button type="button" id="simulate-fail" class="store-outline-btn">Simulate failure</button>
       <button type="button" id="simulate-cancel" class="store-outline-btn">Cancel payment</button>
     </div></div>`;
   stage.querySelector('#simulate-success').addEventListener('click',()=>void resolve('succeeded'));
   stage.querySelector('#simulate-fail').addEventListener('click',()=>void resolve('failed'));
   stage.querySelector('#simulate-cancel').addEventListener('click',()=>void resolve('cancelled'));
  }else{
   start.disabled=false;
   stage.innerHTML=`<div class="t04-outcome">
    <span class="store-badge">__JS__</span>
    <h2>__TITLE__</h2>
    <p>__MESSAGE__</p>
    <div class="store-payment-actions">
      <button type="button" id="try-again" class="store-primary-btn">Try again</button>
      <button type="button" id="return-checkout" class="store-outline-btn">Return to checkout</button>
    </div></div>`
    .replace('__JS__',status==='failed'?'Failed · Demo':'Cancelled · Demo')
    .replace('__TITLE__',status==='failed'?'Payment failed':'Payment cancelled')
    .replace('__MESSAGE__',message||'No order was created or charged. You can retry.');
   stage.querySelector('#try-again').addEventListener('click',()=>{
    if(busy)return;
    try{
     if(!form.reportValidity())return;
     resetAttempt();startDemoPayment(Object.fromEntries(new FormData(form)));
     display('pending');
    }catch(err){showError(err.message)}
   });
   stage.querySelector('#return-checkout').addEventListener('click',()=>void close());
  }
  focusAction();
 };
 const resolve=async outcome=>{
  if(busy)return;busy=true;
  try{
   // Payment state is authoritative. Never animate before the demo success is committed.
   const result=resolveDemoPayment(outcome);
   if(outcome==='succeeded'){
    if(result?.status!=='succeeded'||!result.ref)throw Error('Demo approval could not be verified.');
    closeButton.disabled=true;start.dataset.t04Stage='succeeded';
    await playT04Approved(stage);
    await new Promise(done=>setTimeout(done,reduce.matches?80:650));
    await animateExit();
    window.location.replace('/order/?ref='+encodeURIComponent(result.ref));
   }else{
    display(outcome,'No order was created or charged. You can retry.');
   }
  }catch(err){
   showError(err.message);
   if(!overlay.hidden)display('failed',err.message);
  }finally{busy=false}
 };
 closeButton.addEventListener('click',()=>{
  if(busy||exiting)return;
  if(stage.dataset.t04Stage==='pending')void resolve('cancelled');
  else void close();
 });
 overlay.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   if(busy)return;
   event.preventDefault();
   if(stage.dataset.t04Stage==='pending')void resolve('cancelled');
   else void close();
   return;
  }
  if(event.key!=='Tab')return;
  const nodes=[...dialog.querySelectorAll('button:not(:disabled),[href],input:not(:disabled),[tabindex="0"]')]
   .filter(node=>node.getClientRects().length);
  if(!nodes.length){event.preventDefault();dialog.focus();return}
  const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!form.reportValidity()||!overlay.hidden)return;
  try{
   startDemoPayment(Object.fromEntries(new FormData(form)));
   showError('');
   open();display('pending');
  }catch(err){showError(err.message)}
 });
 window.addEventListener('pagehide',()=>{shell.inert=false;document.body.style.overflow=oldOverflow},{once:true});
}
