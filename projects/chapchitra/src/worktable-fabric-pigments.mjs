// CHAPCHITRA fabric color calibration — independent of the illustrated paint-pot
// palette. Corrected colors can be refined without changing the rendering method.
// Pigment midtones are calibrated against each neutral source garment's measured
// 1536px WebP median, not multiplied with the original almost-white RGB.
export const FABRIC_PIGMENTS=Object.freeze({
 black:Object.freeze({midtone:'#222629',shadowSlope:0.77,minChannel:8,maxChannel:72}),
 white:Object.freeze({midtone:'#ffffff',preserveOriginal:true}),
 red:Object.freeze({midtone:'#DE1F30',toneResponse:1.56,minTone:.47,maxTone:1.06}),
 yellow:Object.freeze({midtone:'#F3C916',toneResponse:1.45,minTone:.48,maxTone:1.038}),
 blue:Object.freeze({midtone:'#145FCE',toneResponse:1.54,minTone:.45,maxTone:1.068}),
 green:Object.freeze({midtone:'#087B47',toneResponse:1.50,minTone:.46,maxTone:1.065}),
});
// Registered 1536px source-image median encoded-luma values, in the same source
// files that supply fabric folds and highlights. Independent garment calibration
// avoids different pigments appearing washed out as the garment model changes.
export const GARMENT_NEUTRAL_MIDTONES=Object.freeze({
 regular:242,dropShoulder:237,fullSleeve:236,hoodie:238,
});
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const linearEncoded=v=>{
 const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
};
const sourceLstar=Float32Array.from({length:256},(_,i)=>{
 const y=linearEncoded(i);
 return y<=216/24389 ? y*24389/27 : 116*Math.cbrt(y)-16;
});
const hexChannels=hex=>[1,3,5].map(at=>parseInt(hex.slice(at,at+2),16));
export const rgbPigmentMidtone=color=>hexChannels(FABRIC_PIGMENTS[color].midtone);

// One 768-byte lightness lookup table per draw avoids expensive nonlinear
// per-pixel math. CIE L* separates the neutral fabric's highlights/seams/folds
// from the target pigment's independently calibrated hue and chroma.
export function createFabricPigmentLUT(garment,color){
 const profile=FABRIC_PIGMENTS[color],neutral=GARMENT_NEUTRAL_MIDTONES[garment];
 if(!profile||neutral===undefined)throw Error('Unsupported fabric pigment/garment');
 if(profile.preserveOriginal)return null; // No white material transformation.
 const table=new Uint8Array(256*3),base=hexChannels(profile.midtone);
 const center=sourceLstar[neutral];
 for(let y=0;y<256;y++){
  const delta=sourceLstar[y]-center,at=y*3;
  if(color==='black'){
   // Black cloth needs near-neutral reflected highlights, not a gray base.
   // Shift all three channels together so folds remain visible without a
   // red/maroon edge or excessive chroma in the darkest areas.
   for(let channel=0;channel<3;channel++){
    table[at+channel]=clamp(Math.round(base[channel]+delta*profile.shadowSlope),profile.minChannel,profile.maxChannel);
   }
  }else{
   // The source is nearly neutral; CIE-L* tone drives a shared scalar.
   // Hue/chroma are retained, including in wrinkles. Local dark seams stay
   // dark but cannot turn into muddy neutrals or overblown pink highlights.
   const tone=clamp(Math.exp(delta*profile.toneResponse/100),profile.minTone,profile.maxTone);
   for(let channel=0;channel<3;channel++){
    table[at+channel]=clamp(Math.round(base[channel]*tone),0,255);
   }
  }
 }
 return table;
}

// Pure ImageData-compatible mutator; alpha is never changed, so the garment's
// exact original silhouette and antialiased edges remain unchanged. No desk,
// worker, notebook, upload preview or separate alpha mask is touched.
export function applyFabricPigmentToRGBA(pixels,garment,color){
 const table=createFabricPigmentLUT(garment,color);
 if(table===null)return pixels;
 if(!pixels || !pixels.length || pixels.length%4!==0)throw Error('Expected RGBA pixels');
 for(let offset=0;offset<pixels.length;offset+=4){
  if(pixels[offset+3]===0)continue;
  // Source is almost-gray. Encoded BT.709 luma is used only to look up
  // the CIE L* of its neutral brightness, not as an output color channel.
  const y=Math.round(.2126*pixels[offset]+.7152*pixels[offset+1]+.0722*pixels[offset+2]);
  const at=y*3;
  pixels[offset]=table[at];
  pixels[offset+1]=table[at+1];
  pixels[offset+2]=table[at+2];
 }
 return pixels;
}
