/**
 * iPad Safari visual viewport keyboard stabilizer.
 * Never imposes a persistent translation on the checkout or fixed navbar.
 */
export function stabilizeCheckoutViewport({form,cardForm}){
 const vv=window.visualViewport;
 if(!vv)return;
 let focused=false,baselineY=0,baselineHeight=vv.height,keyboardSeen=false,restoreId=0;
 const isField=n=>!!n?.matches?.('input,textarea');
 const capture=e=>{
  if(!isField(e.target))return;
  if(!focused){
   baselineY=window.scrollY;
   baselineHeight=Math.max(vv.height,baselineHeight);
   keyboardSeen=false;
  }
  focused=true;restoreId++;
 };
 const restore=()=>{
  if(focused||!keyboardSeen||document.querySelector('#t04-payment-overlay:not([hidden])'))return;
  const ticket=++restoreId;
  // Safari updates visualViewport before its underlying layout scroll is
  // fully reconciled. Restore only after the keyboard-sized viewport recovers.
  const attempt=()=>{
   if(ticket!==restoreId||focused)return;
   if(vv.height<baselineHeight-72)return;
   requestAnimationFrame(()=>{
    if(ticket!==restoreId||focused)return;
    window.scrollTo({top:Math.max(0,baselineY),left:0,behavior:'instant'});
    keyboardSeen=false;
   });
  };
  attempt();
  window.setTimeout(attempt,110);
  window.setTimeout(attempt,260);
 };
 const onResize=()=>{
  if(focused&&vv.height<baselineHeight-90)keyboardSeen=true;
  if(!focused)restore();
 };
 const onBlur=e=>{
  if(!isField(e.target))return;
  // Moving between checkout inputs keeps the same keyboard session active.
  window.setTimeout(()=>{
   if(isField(document.activeElement))return;
   focused=false;restore();
  },30);
 };
 for(const parent of [form,cardForm]){
  parent.addEventListener('focusin',capture);
  parent.addEventListener('focusout',onBlur);
 }
 vv.addEventListener('resize',onResize,{passive:true});
 window.addEventListener('pageshow',()=>{baselineHeight=Math.max(baselineHeight,vv.height);focused=false;restore()});
 window.addEventListener('orientationchange',()=>{restoreId++;baselineHeight=vv.height;keyboardSeen=false;focused=false},{passive:true});
}
