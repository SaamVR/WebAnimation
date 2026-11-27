/** CHAPCHITRA Hero01 scroll-linked navbar paper.
 * A geometry calculation only: does not animate, tween or alter artwork.
 * The extra 12px conceals the approved SVG's 5px alpha shadow by 100%.
 */
export const HERO01_SHADOW_CLEARANCE_PX=12;
export const HERO01_RETRACTION_SCROLL_RATIO=0.72;
export function hero01Retraction({scrollY,headerBottom,heroTop,paperHeight}){
 if(![scrollY,headerBottom,heroTop,paperHeight].every(Number.isFinite)||paperHeight<=0)
  return {progress:0,offsetY:0,targetTop:heroTop,complete:false};
 const distance=paperHeight*HERO01_RETRACTION_SCROLL_RATIO;
 const progress=Math.min(1,Math.max(0,scrollY/distance));
 // Beyond completion, release the assembly into normal document movement.
 const targetTop=headerBottom-(paperHeight+HERO01_SHADOW_CLEARANCE_PX)*progress-Math.max(0,scrollY-distance);
 return {progress,targetTop,offsetY:targetTop-heroTop,complete:progress>=1};
}
