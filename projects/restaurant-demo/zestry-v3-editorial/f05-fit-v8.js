/* Fit a single continuous vector canvas + its real book-control hit targets. */
(()=>{
 'use strict';
 const root=document.querySelector('.viewport'),stage=document.querySelector('.surface');
 if(!root||!stage)return;
 let queued=false;
 function fit(){
  queued=false;
  const W=root.clientWidth,H=root.clientHeight;
  if(W<1||H<1)return;
  // Original F05 coordinate system: stage 1740x1160, visible book about
  // 850x790 with illustrated navigation and close button. Scale BOTH axes.
  const s=Math.max(.15,Math.min((W-20)/900,(H-22)/790,1.3));
  stage.style.width=(1740*s).toFixed(2)+'px';
  stage.style.height=(1160*s).toFixed(2)+'px';
  stage.style.left=((W-850*s)/2-470*s).toFixed(2)+'px';
  stage.style.top=((H-790*s)/2-160*s).toFixed(2)+'px';
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(fit)}}
 if(window.ResizeObserver)new ResizeObserver(queue).observe(root);
 window.addEventListener('resize',queue,{passive:true});
 fit();
 document.addEventListener('pointerup',e=>{
  const b=e.target.closest('.hotspots button');
  if(b)requestAnimationFrame(()=>{if(document.activeElement===b)b.blur()});
 },true);
})();
