// C02: reversible covered-state drift of ONE owner-authored vector.
export const C02_DRIFT=Object.freeze({cycleMs:4400,maxPx:32});
export function c02DriftAmplitude(width,minPigmentEdgePx){
 const w=Number(width),edge=Number(minPigmentEdgePx);
 if(!Number.isFinite(w)||!Number.isFinite(edge)||w<=0)return 0;
 // The image's right-hand painted edge stays outside the viewport even at
 // the most negative displacement; reserve 32px extra compositing margin.
 return Math.max(0,Math.min(C02_DRIFT.maxPx,w*.055,
  (edge-w-32)*.4));
}
export function c02DriftPhase(value){
 const v=Number(value);
 if(!Number.isFinite(v))return 0;
 return ((v%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
}
export function c02DriftAdvance(phase,elapsedMs){
 return c02DriftPhase(c02DriftPhase(phase)+
  Math.max(0,Math.min(80,Number(elapsedMs)||0))*2*Math.PI/C02_DRIFT.cycleMs);
}
export function c02DriftFrame(phase,amplitude){
 const p=c02DriftPhase(phase),amp=Math.max(0,Number(amplitude)||0);
 return {phase:p,x:amp*Math.sin(p),direction:Math.cos(p)>=0?1:-1};
}
