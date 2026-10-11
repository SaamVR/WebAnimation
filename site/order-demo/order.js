import {MILESTONES,seekOrderMilestone,formatOrderState} from './order-core.mjs';
const mount=document.getElementById('order-workflow-root');
if(mount){
 mount.innerHTML=[
 '<div class="order-panel"><div class="order-panelhead"><span>ORDER JOURNEY / INTERACTIVE STATUS</span><b>DEMO ONLY</b></div>',
 '<div class="order-status-top"><span>FICTIONAL ORDER</span><strong>#CML-0027</strong></div>',
 '<h2 class="order-status-title">From purchase to dispatch.</h2>',
 '<p class="order-status-deck">Select a step to inspect the corresponding moment in the animated packaging sequence.</p>',
 '<ol id="order-milestones" class="order-milestones">',
 MILESTONES.map((x,i)=>'<li><button type="button" class="order-milestone" data-status="'+x.id+'" aria-pressed="false"><i>'+String(i+1).padStart(2,'0')+'</i><span><strong>'+x.label+'</strong><small>'+x.description+'</small></span></button></li>').join(''),
 '</ol><p id="order-feedback" class="order-feedback" role="status" aria-live="polite">Choose a fulfillment stage.</p>',
 '<div class="order-panel-foot">NO REAL CUSTOMER ORDER OR TRACKING CONNECTION</div></div>'
 ].join('');
 const frame=document.getElementById('order-live-film');
 const message=mount.querySelector('#order-feedback');
 let latest=null;
 function moveTo(id){
  const state=seekOrderMilestone(id),summary=formatOrderState(state);
  latest=state;
  mount.querySelectorAll('button[data-status]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.status===state.id)));
  message.textContent=summary.message;
  // Crucial: this controls the ACTUAL SVG cinematic frame, not a disconnected text playhead.
  try{
    const api=frame?.contentWindow;
    if(api&&api.motionReady&&typeof api.renderAt==='function'){
      api.renderAt(state.timeMs);
      mount.dataset.synced='true';
    }else{mount.dataset.synced='waiting'}
  }catch(error){mount.dataset.synced='unavailable';}
  mount.dataset.status=state.id;
 }
 frame?.addEventListener('load',()=>{
   if(latest)moveTo(latest.id);
   else moveTo('placed');
 });
 mount.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-status]');
  if(btn)moveTo(btn.dataset.status);
 });
 moveTo('placed');
 mount.dataset.ready='true';
}
