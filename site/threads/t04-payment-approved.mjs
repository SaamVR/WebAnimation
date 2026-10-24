/** T04: animate only after a REAL committed demo-success result. No live payment. */
import {loadMotionLibrary} from './t02-motion-runtime.mjs';
export async function playT04Approved(stage){
 if(!stage||!stage.isConnected)return;
 stage.dataset.t04Stage='succeeded';stage.classList.add('t04-is-approved');
 stage.innerHTML=`
  <div class="t04-approved" data-t04-animation role="status" aria-label="Demo transaction approved. No real payment was made.">
   <div class="t04-approval-visual" aria-hidden="true">
    <div class="t04-demo-card">
     <span class="t04-demo-card__brand">THREADS</span>
     <span class="t04-demo-card__chip"></span>
     <span class="t04-demo-card__note">PAYMENT SIMULATION</span>
    </div>
    <svg class="t04-approval-seal" viewBox="0 0 116 116" aria-hidden="true" focusable="false">
     <circle class="t04-seal-bg" cx="58" cy="58" r="50"></circle>
     <circle class="t04-seal-stroke" cx="58" cy="58" r="50" stroke-dasharray="315" stroke-dashoffset="315"></circle>
     <path class="t04-seal-check" d="M32 60 L51 78 L85 39" stroke-dasharray="80" stroke-dashoffset="80"></path>
    </svg>
   </div>
   <p class="t04-status-kicker">THREADS · DEMONSTRATION</p>
   <h2>Demo payment approved</h2>
   <p>Demo payment · No money charged.</p>
  </div>`;
 stage.setAttribute('tabindex','-1');stage.focus({preventScroll:true});

 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const gsap=await loadMotionLibrary();if(!gsap||!stage.isConnected)return;
 const card=stage.querySelector('.t04-demo-card'),seal=stage.querySelector('.t04-approval-seal');
 const circle=stage.querySelector('.t04-seal-stroke'),check=stage.querySelector('.t04-seal-check');
 const title=stage.querySelector('.t04-approved h2'),note=stage.querySelector('.t04-approved > p:last-child');
 await new Promise(resolve=>{
  let done=false,timeline;
  const finish=()=>{if(done)return;done=true;window.removeEventListener('pagehide',finish);timeline?.kill();resolve()};
  window.addEventListener('pagehide',finish,{once:true});
  timeline=gsap.timeline({onComplete:finish});
  timeline.fromTo(card,{opacity:0,y:38,rotation:-5,scale:.92},
                {opacity:1,y:0,rotation:-2,scale:1,duration:.45,ease:'power2.out'},0)
   .fromTo(seal,{opacity:0,scale:.63,rotation:-15},
                {opacity:1,scale:1,rotation:0,duration:.39,ease:'back.out(1.35)'},.38)
   .to(circle,{strokeDashoffset:0,duration:.47,ease:'power1.inOut'},.55)
   .to(check,{strokeDashoffset:0,duration:.32,ease:'power2.out'},.87)
   .fromTo([title,note],{opacity:0,y:10},
                        {opacity:1,y:0,duration:.28,stagger:.09,ease:'power1.out'},.96)
   .to({}, {duration:.21},1.32);
 });
}
