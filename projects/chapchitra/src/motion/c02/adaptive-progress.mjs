// CHAPCHITRA C02 — bounded, monotonic adaptive visual progress.
// This is NOT a fabricated network percentage. Only the completed document
// fetch and the incoming DOM/worktable determine genuine readiness.
export const C02_ADAPTIVE=Object.freeze({
 cap:0.76, // Keep a visibly unpainted strip and roller movement while pending.
 handoff:0.68,
 maxWaitMs:25000,
 shortFinishMs:280,
 longFinishMs:720
});
const clamp=(x,min,max)=>Math.min(max,Math.max(min,Number(x)||0));
export function pendingInkProgress(elapsedMs,{cap=C02_ADAPTIVE.cap,knownMs=0}={}){
 const t=Math.max(0,Number(elapsedMs)||0);
 // Known-duration pacing is permitted only for the isolated review simulator.
 // A linear floor preserves perceptible travel even at the end of slow demos.
 if(knownMs>0){
  const u=clamp(t/knownMs,0,1);
  const smooth=u*u*(3-2*u);
  const shaped=cap*(.22*u+.78*smooth);
  if(t<=knownMs)return shaped;
  return cap+(0.012)*(1-Math.exp(-(t-knownMs)/3600));
 }
 // In real navigation the ETA is unknowable. A bounded ease plus a
 // positive linear floor gives perceptible advance even at 8-25 seconds.
 // No invented percentage or parked 90-95% state while the request is pending.
 const horizon=C02_ADAPTIVE.maxWaitMs;
 const natural=.63*(1-Math.exp(-t/2500));
 const floor=.37*Math.min(t/horizon,1);
 return cap*(natural+floor);
}
export function finishDuration(progress,loadingAgeMs=0){
 const remaining=1-clamp(progress,0,1);
 const natural=clamp(remaining*1250,C02_ADAPTIVE.shortFinishMs,
  C02_ADAPTIVE.longFinishMs);
 // A slow real destination must not provoke a sudden sprint across the
 // last quarter of the viewport the moment its content becomes ready.
 return Math.round(loadingAgeMs>3000?Math.max(480,natural):natural);
}
// Cubic Hermite: preserves position and a bounded incoming velocity, while
// ending precisely at 1 with zero speed. No instantaneous progress jump.
export function finishInkProgress(progress,elapsedMs,durationMs,initialVelocity=0){
 const from=clamp(progress,0,1),u=clamp(elapsedMs/Math.max(1,durationMs),0,1);
 const delta=1-from;
 const tangent=clamp(initialVelocity,0,3*delta/(Math.max(1,durationMs)));
 const h00=2*u**3-3*u**2+1;
 const h10=u**3-2*u**2+u;
 const h01=-2*u**3+3*u**2;
 return clamp(h00*from+h10*tangent*durationMs+h01,from,1);
}
export function getReviewDelayMs(destination){
 try{
  const url=new URL(destination,'https://chapchitra.invalid');
  if(url.pathname!=='/c02-review/slow/')return 0;
  const raw=Number(url.searchParams.get('delay'));
  return Number.isFinite(raw)?Math.round(clamp(raw,1000,8000)):0;
 }catch{return 0}
}
