/** THREADS T02 V2 independent motion-library adapter. T01 source stays untouched. */
const ROOT='/vendor/';
let libraries;
export function loadMotionLibrary(){
 if(libraries)return libraries;
 const load=src=>new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=ROOT+src;
  script.async=false;
  script.onload=resolve;
  script.onerror=()=>reject(new Error('Motion asset unavailable: '+src));
  document.head.append(script);
 });
 libraries=load('gsap.min.js')
   .then(()=>load('MotionPathPlugin.min.js'))
   .then(()=>{
    const {gsap,MotionPathPlugin}=window;
    if(!gsap||!MotionPathPlugin)throw new Error('GSAP motion runtime unavailable');
    gsap.registerPlugin(MotionPathPlugin);
    return gsap;
   }).catch(()=>null);
 return libraries;
}
