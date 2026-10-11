import {AVAILABLE_SLOTS,createBookingState,selectSlot,confirmBooking} from './relay-core.mjs';
const mount=document.getElementById('relay-demo-root');
if(mount){
 mount.innerHTML=[
 '<div class="relay-window">',
 '<header class="relay-bar"><span class="relay-mark"><i></i> RELAY / WORKFLOW DEMO</span><span>FICTIONAL ENQUIRY · NO LIVE SERVICES</span></header>',
 '<div class="relay-columns">',
 '<section class="relay-col relay-inbox" aria-label="Incoming customer enquiry">',
 '<div class="relay-colhead"><span>01 / CUSTOMER ENQUIRY</span><b>INBOX</b></div>',
 '<label for="relay-request">Customer message</label>',
 '<textarea id="relay-request" rows="5">Hi, can I book a 30 minute consultation on Tuesday morning?</textarea>',
 '<button id="relay-analyze" class="relay-primary" type="button">UNDERSTAND REQUEST <span aria-hidden="true">→</span></button>',
 '<p class="relay-hint">Edit the fictional message. This is a rule-based demonstration, not a connected AI agent.</p>',
 '</section>',
 '<section class="relay-col relay-structure" aria-label="Structured request details">',
 '<div class="relay-colhead"><span>02 / UNDERSTAND</span><b>EXTRACTED</b></div>',
 '<div id="relay-summary" class="relay-summary relay-empty"><span class="relay-emblem">↝</span><p>Analyze the message to extract useful details.</p></div>',
 '</section>',
 '<section class="relay-col relay-calendar" aria-label="Schedule example appointment">',
 '<div class="relay-colhead"><span>03 / SCHEDULE</span><b>EXAMPLE SLOTS</b></div>',
 '<p class="relay-hint">Illustrative availability, not connected to a calendar.</p>',
 '<div id="relay-slots" class="relay-slots"></div>',
 '<button class="relay-confirm" id="relay-confirm" type="button" disabled>CONFIRM DEMO BOOKING ↗</button>',
 '<div id="relay-result" role="status" aria-live="polite" class="relay-result">Waiting for customer request</div>',
 '</section></div>',
 '<footer class="relay-foot"><span id="relay-status">STEP 01 · WAITING</span><span>MESSAGE → INTENT → SLOT → CONFIRM</span></footer>',
 '</div>'
 ].join('');
 const text=mount.querySelector('#relay-request');
 const analyze=mount.querySelector('#relay-analyze');
 const summary=mount.querySelector('#relay-summary');
 const slots=mount.querySelector('#relay-slots');
 const confirm=mount.querySelector('#relay-confirm');
 const result=mount.querySelector('#relay-result');
 const status=mount.querySelector('#relay-status');
 let state=null;
 const html=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const setStatus=s=>status.textContent=s;
 function showDetails(){
  const d=state.details;
  summary.classList.remove('relay-empty');
  summary.innerHTML='<dl class="relay-fields">'+[
   ['SERVICE',d.service],['DURATION',d.durationMinutes+' MIN'],['PREFERRED DAY',d.preferredDay.toUpperCase()],['TIME WINDOW',d.daypart.toUpperCase()]
  ].map(([name,value],i)=>'<div class="relay-field" style="--delay:'+i+'"><dt>'+name+'</dt><dd>'+html(value)+'</dd></div>').join('')+'</dl>';
 }
 function showSlots(){
  slots.innerHTML=AVAILABLE_SLOTS.map(slot=>'<button class="relay-slot" type="button" data-slot="'+slot.id+'" aria-pressed="'+String(state.selectedSlot===slot.id)+'">'+slot.label+'</button>').join('');
 }
 analyze.addEventListener('click',()=>{
  state=createBookingState(text.value);showDetails();showSlots();
  confirm.disabled=true;
  result.className='relay-result';result.textContent='Request understood. Choose an example appointment time.';
  setStatus('STEP 02 · REQUEST STRUCTURED');
 });
 slots.addEventListener('click',event=>{
  const button=event.target.closest('button[data-slot]');
  if(!button||!state)return;
  state=selectSlot(state,button.dataset.slot);showSlots();confirm.disabled=false;
  result.textContent='Ready to confirm '+button.textContent+' (simulation)';
  setStatus('STEP 03 · SLOT SELECTED');
 });
 confirm.addEventListener('click',()=>{
  if(!state||!state.selectedSlot)return;
  state=confirmBooking(state);confirm.disabled=true;
  result.className='relay-result relay-done';
  result.textContent='✓ Demo appointment confirmed · '+state.confirmation.service+' · '+state.confirmation.time+'. No real booking was created.';
  setStatus('STEP 04 · CONFIRMED (SIMULATED)');
 });
 text.addEventListener('input',()=>{
  state=null;confirm.disabled=true;slots.innerHTML='';summary.className='relay-summary relay-empty';
  summary.innerHTML='<span class="relay-emblem">↝</span><p>Message edited. Run Understand Request again.</p>';
  result.className='relay-result';result.textContent='Waiting for customer request';
  setStatus('STEP 01 · WAITING');
 });
 mount.dataset.ready='true';
}
