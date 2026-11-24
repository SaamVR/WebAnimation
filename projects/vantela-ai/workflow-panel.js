/* Local illustrative workflow only. No network, file access, or AI backend. */
(()=>{
'use strict';
const root=document.querySelector('.vp2-workflow');if(!root)return;
const stage=root.querySelector('.vp2-wf-stage'),scene=root.querySelector('.vp2-scene-content'),result=root.querySelector('.vp2-wf-result'),next=root.querySelector('.vp2-next'),steps=[...root.querySelectorAll('[data-step]')],sources=[...root.querySelectorAll('[data-source]')];
const labels=['Capture','Understand','Organize','Deliver'];
const data={
 document:{name:'document',titles:['Bring in a document','Extract key information','Build a structured summary','Deliver the finished summary'],descs:['A sample file arrives in the workspace, ready to be understood.','A document scan highlights the information that matters.','Extracted details become a clear, reviewable summary.','The reviewed summary is ready to share with the team.'],rows:[['Document received','Ready for analysis'],['Name and date identified','Key amount extracted'],['Summary assembled','Review checklist ready'],['Summary ready','Shared workspace updated']],icon:'<path d="M72 115H103L120 132V207H72Z" fill="white" stroke="#006BE0" stroke-width="3"/><path d="M103 115V132H120M82 151H110M82 165H110M82 179H102" stroke="#006BE0" stroke-width="3" stroke-linecap="round"/>'},
 email:{name:'email',titles:['Bring in an email','Find the important details','Turn requests into tasks','Deliver a follow-up plan'],descs:['A sample customer message enters the workspace.','The request, deadline and next action are highlighted.','The request becomes an organized set of tasks.','A sample follow-up plan is ready for human review.'],rows:[['Email received','Ready for analysis'],['Request identified','Deadline highlighted'],['Task list assembled','Owner review ready'],['Follow-up prepared','Workspace updated']],icon:'<rect x="61" y="135" width="65" height="50" rx="8" fill="white" stroke="#F15A24" stroke-width="3"/><path d="M63 139 94 163 124 139" fill="none" stroke="#F15A24" stroke-width="3"/>'},
 idea:{name:'creative brief',titles:['Bring in a creative brief','Clarify the direction','Compose a visual plan','Deliver a review board'],descs:['A sample creative idea enters the workspace.','The brief is broken into goals, audience and style.','The direction becomes a small illustrated plan.','The proposed board is ready for team feedback.'],rows:[['Brief received','Ready for exploration'],['Goals identified','Style direction identified'],['Visual plan assembled','Review board prepared'],['Board ready','Feedback requested']],icon:'<rect x="65" y="125" width="59" height="66" rx="8" fill="white" stroke="#02856B" stroke-width="3"/><path d="M94 134 98 146 110 150 98 154 94 166 90 154 78 150 90 146Z" fill="#03DDB3"/><path d="M76 177H113" stroke="#02856B" stroke-width="3" stroke-linecap="round"/>'}
};
let source='document',step=0,timer=null; const play=root.querySelector('.vp2-run');
const lines='<path d="M200 142H339M200 156H304M200 170H326" stroke="#A9C7E1" stroke-width="7" stroke-linecap="round"/>';
const flow='<path d="M138 164H174" stroke="#0077F9" stroke-width="4" class="vp2-pulse-path"/><circle class="vp2-packet" cx="140" cy="164" r="6" fill="#F15A24"/><path d="m168 157 10 7-10 7" fill="none" stroke="#0077F9" stroke-width="3"/>';
const tick=(x,y)=>'<circle cx="'+x+'" cy="'+y+'" r="9" fill="#03DDB3"/><path d="m'+(x-4)+' '+y+' 3 3 5-6" stroke="#021D3D" stroke-width="2" fill="none" stroke-linecap="round"/>';
function artwork(d,i){
 let content=d.icon+flow;
 if(i===0)content+='<rect x="181" y="120" width="181" height="82" rx="12" fill="#fff" stroke="#0077F9" stroke-width="2"/>'+lines;
 if(i===1)content+='<rect x="181" y="119" width="181" height="85" rx="12" fill="#fff" stroke="#03DDB3" stroke-width="3"/>'+lines+'<rect x="194" y="136" width="150" height="12" rx="6" fill="#F6BC17" opacity=".9"/><rect x="194" y="165" width="135" height="12" rx="6" fill="#03DDB3" opacity=".9"/><path d="M177 161H365" stroke="#0077F9" stroke-width="3" class="vp2-scan"/>';
 if(i===2){if(source==='idea')content+='<rect x="181" y="119" width="87" height="85" rx="9" fill="#F6BC17"/><path d="m192 188 20-30 18 17 13-25 15 38Z" fill="#021D3D"/><rect x="278" y="119" width="85" height="38" rx="9" fill="#03DDB3"/><rect x="278" y="166" width="85" height="38" rx="9" fill="#F15A24"/>';else for(let j=0;j<3;j++){let y=119+j*29;content+='<rect x="181" y="'+y+'" width="181" height="24" rx="7" fill="white" stroke="#C2D5EC"/>'+tick(194,y+12)+'<path d="M210 '+(y+12)+'H'+(335-j*13)+'" stroke="#0077F9" stroke-width="5" stroke-linecap="round"/>';}}
 if(i===3)content+='<rect x="180" y="117" width="184" height="91" rx="12" fill="#fff" stroke="#02856B" stroke-width="3"/><circle cx="272" cy="151" r="24" fill="#03DDB3"/><path d="m260 151 8 8 17-18" stroke="#021D3D" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M227 191H317" stroke="#0077F9" stroke-width="7" stroke-linecap="round"/>';
 return '<g class="vp2-scene-motion">'+content+'</g>';
}
function render(animate=true){
 const d=data[source];sources.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===source)));steps.forEach((b,i)=>i===step?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));
 result.querySelector('small').textContent='0'+(step+1)+' / 04 · '+labels[step];result.querySelector('h4').textContent=d.titles[step];result.querySelector('p').textContent=d.descs[step];result.querySelectorAll('.vp2-wf-output span').forEach((n,i)=>n.textContent=d.rows[step][i]);scene.innerHTML=artwork(d,step);next.textContent=step===3?'Start again →':'Run next step →';
 stage.classList.remove('is-changing');if(animate){void stage.offsetWidth;stage.classList.add('is-changing')}
}
function stop(){if(timer!==null)clearTimeout(timer);timer=null;play.setAttribute('aria-pressed','false');play.textContent='Play full workflow'}
function schedule(){timer=setTimeout(()=>{if(step===3){stop();return}step++;render();schedule()},1600)}
play.addEventListener('click',()=>{if(timer!==null){stop();return}step=0;render();play.setAttribute('aria-pressed','true');play.textContent='Pause workflow';schedule()});
sources.forEach(b=>b.addEventListener('click',()=>{stop();source=b.dataset.source;step=0;render()}));steps.forEach(b=>b.addEventListener('click',()=>{stop();step=Number(b.dataset.step);render()}));
next.addEventListener('click',()=>{stop();step=(step+1)%4;render()});root.querySelector('.vp2-reset').addEventListener('click',()=>{stop();step=0;render()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});render(false);
})();
