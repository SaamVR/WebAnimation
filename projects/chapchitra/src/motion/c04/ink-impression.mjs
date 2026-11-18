/**
 * C04 | One-shot 280 ms printed impression (no stamp device or new art).
 * Operates on the complete existing SVG digit group or on the selected pager
 * numeral alone. Never animates the bag badge, pagination button or layout.
 */
export const INK_IMPRESSION_MS = 280;
export const INK_IMPRESSION_FRAMES = Object.freeze([
 {offset:0,opacity:0,transform:'translate3d(0,1px,0) scale(1.04,0.94)',easing:'cubic-bezier(0.18,0.65,0.25,1)'},
 {offset:45/280,opacity:0.85,transform:'translate3d(0,1px,0) scale(1.04,0.94)',easing:'cubic-bezier(0.16,0.7,0.28,1)'},
 {offset:100/280,opacity:1,transform:'translate3d(0,0,0) scale(1.007,0.996)',easing:'cubic-bezier(0.2,0.7,0.3,1)'},
 {offset:200/280,opacity:1,transform:'translate3d(0,0,0) scale(1,1)',easing:'linear'},
 {offset:1,opacity:1,transform:'translate3d(0,0,0) scale(1,1)'}
]);
const active = new Map();
const reduced = typeof matchMedia==='function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
export function cancelInkImpression(target){
 if(!target)return;
 const animation=active.get(target);
 if(animation){animation.cancel();active.delete(target)}
 target.classList?.remove('cc-c04-inking');
}
export function playInkImpression(target,{reducedMotion=reduced?.matches??false}={}){
 if(!target)return null;
 cancelInkImpression(target);
 if(reducedMotion||!target.isConnected||typeof target.animate!=='function')return null;
 target.classList.add('cc-c04-inking');
 const animation=target.animate(INK_IMPRESSION_FRAMES.map(frame=>({...frame})),{
  duration:INK_IMPRESSION_MS,iterations:1,fill:'none',easing:'linear'
 });
 active.set(target,animation);
 const tidy=()=>{
  if(active.get(target)!==animation)return;
  active.delete(target);
  target.classList.remove('cc-c04-inking');
 };
 animation.addEventListener('finish',tidy,{once:true});
 animation.addEventListener('cancel',tidy,{once:true});
 return animation;
}
// A newly enabled accessibility preference immediately shows final artwork.
reduced?.addEventListener?.('change',event=>{
 if(event.matches)for(const target of [...active.keys()])cancelInkImpression(target);
});
