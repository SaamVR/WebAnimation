import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../site/threads/t03-v2-preview/',import.meta.url);
const bytes=name=>readFileSync(new URL(name,root));
const txt=name=>bytes(name).toString('utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');
test('T03 V2 retains exact owner-supplied 5.2s SVG with all embedded artwork',()=>{
 const svg=bytes('assets/backpack_animated%20(2).svg'),s=svg.toString();
 assert.equal(svg.length,2400642);
 assert.equal(sha(svg),'c9e2ec66f68de42dd41c4a8b9b491928416017abf7172d5e99c84fa10696cf51');
 assert.match(s,/--dur: 5\.2s/);
 assert.match(s,/viewBox="800 260 950 1060"/);
 assert.equal((s.match(/data:image\/png;base64,/g)||[]).length,10);
 for(const id of ['backpack-scene','top-handle-group','lower-straps-group','open-collar-group','outer-hood-hinge-group','buckles-unclip-group','open-flap-group'])assert.match(s,new RegExp('id="'+id+'"'));
 for(const k of ['bagPhysics','handleFold','lowerStrapsRelax','collarExpand','bucklesSlide','outerHoodHinge','innerHoodHinge'])assert.match(s,new RegExp('@keyframes '+k));
 assert.equal((s.match(/@keyframes /g)||[]).length,7);
});
test('T03 V2 keeps native-resolution PNG source and pixel-preserving cropped presentation',()=>{
 const original=bytes('assets/1-backpack-closed.png'),trim=bytes('assets/backpack-closed-aligned.png');
 assert.equal(original.length,1278396);
 assert.equal(sha(original),'6b216a79fb3387718f11a7ac1f66ea7a8661b153d239252f0ef3823df7fe3701');
 assert.deepEqual([original.readUInt32BE(16),original.readUInt32BE(20)],[2048,1365]);
 assert.deepEqual([trim.readUInt32BE(16),trim.readUInt32BE(20)],[1015,993]);
 assert.match(txt('index.html'),/backpack-closed-aligned\.png/);
});
test('T03 V2 exact reward weights, one session result, source-authored open and close',()=>{
 const js=txt('t03.mjs');
 const bands=[...js.matchAll(/\{end:(\d+),label:'([^']+)'\}/g)].map(m=>({end:Number(m[1]),label:m[2]}));
 assert.deepEqual(bands.map((v,i)=>[v.label,v.end-(bands[i-1]?.end||0)]),[
  ['Free Delivery',500],['5% OFF',300],['7% OFF',120],['10% OFF',79],['50% OFF',1]]);
 assert.match(js,/sessionStorage\.getItem/);
 assert.match(js,/sessionStorage\.setItem/);
 assert.match(js,/OPEN_AT=0\.5\*5200/);
 assert.match(js,/CLOSE_FROM=0\.65\*5200/);
 assert.match(js,/getAnimations\(\{subtree:true\}\)/);
 assert.doesNotMatch(js,/startDemoPayment|dealUnitPrice|dealSavings/);
});
test('T03 V2 uses approved compact copy and neutral coupon without reset',()=>{
 const html=txt('index.html'),css=txt('t03.css');
 assert.match(html,/Unpack Your Luck/);
 assert.match(html,/Tap the backpack\. Discover your surprise\./);
 assert.match(html,/✦ Up to 50% OFF/);
 assert.doesNotMatch(html,/Reset backpack|Deal of the Week/i);
 assert.doesNotMatch(css,/dashed|glow|overshoot|#ffe4a0/i);
 assert.match(css,/#2E453A/);
});

test('T03 compositing and clipping: one visible source SVG after ready, full open artwork visible',()=>{
 const css=txt('t03.css'),js=txt('t03.mjs');
 assert.match(css,/\.t03-panel\{[^}]*overflow:visible/);
 assert.match(css,/\.t03-illustration\{[^}]*overflow:visible/);
 assert.match(css,/\.t03-svg-holder\{[^}]*overflow:visible/);
 assert.match(css,/\.t03-svg-holder svg\{[^}]*overflow:visible/);
 assert.match(css,/\.t03-bag-button\.is-ready \.t03-still\{opacity:0;visibility:hidden\}/);
 assert.doesNotMatch(css,/\.is-in-motion \.t03-still/);
 assert.match(js,/phase='closed';targetOpen=false/);
 assert.match(js,/button.disabled=false/);
 assert.match(js,/button\.classList\.add\('is-ready'\)/);
});
test('T03 queued interaction: no transition-time disabled button or dropped second click',()=>{
 const js=txt('t03.mjs');
 assert.match(js,/targetOpen=!targetOpen/);
 assert.match(js,/if\(!targetOpen\)\{close\(\);return;\}/);
 assert.match(js,/if\(targetOpen\)open\(\)/);
 assert.match(js,/else if\(phase==='opened'&&!targetOpen\)close\(\)/);
 assert.match(js,/schedule\(opened,OPEN_AT\)/);
 assert.match(js,/schedule\(closed,END_AT-CLOSE_FROM\)/);
 assert.doesNotMatch(js,/phase='opening';button\.disabled=true/);
 assert.doesNotMatch(js,/phase='closing';button\.disabled=true/);
 assert.doesNotMatch(js,/animation\.reverse\(|playbackRate|gsap\./);
});

test('T03 cold-start gate decodes every original embedded image and paints before enabling',()=>{
 const js=txt('t03.mjs');
 assert.match(js,/svg\.querySelectorAll\('image'\)/);
 assert.match(js,/imageSources\.length!==10/);
 assert.match(js,/await Promise\.all\(imageSources\.map\(async src/);
 assert.match(js,/await image\.decode\(\)/);
 assert.match(js,/await document\.fonts\.ready/);
 assert.match(js,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(resolve\)\)/);
 const endReady=js.indexOf("button.disabled=false");
 const decodeIndex=js.indexOf('await Promise.all(imageSources.map');
 const paintIndex=js.lastIndexOf("button.classList.add('is-ready')",endReady);
 assert.ok(decodeIndex>0&&paintIndex>decodeIndex&&endReady>paintIndex,'tap remains locked through decode and visible paints');
 assert.match(js,/node\.style\.animationPlayState='paused'/);
});
test('T03 coupon uses SVG-space rim occlusion without changing original reward easing',()=>{
 const js=txt('t03.mjs'),css=txt('t03.css');
 assert.match(js,/document\.createElementNS\(ns,'foreignObject'\)/);
 assert.match(js,/svg\.querySelector\('#open-flap-group'\)/);
 assert.match(js,/document\.createElementNS\(ns,'clipPath'\)/);
 assert.match(js,/clipPathUnits','userSpaceOnUse'/);
 assert.match(js,/couponLayer\.setAttribute\('clip-path','url\(#t03-coupon-opening-mask\)'\)/);
 assert.match(js,/front\.parentNode\.insertBefore\(couponLayer,front\)/);
 assert.match(js,/couponLayer\.appendChild\(coupon\)/);
 assert.match(css,/-webkit-tap-highlight-color:transparent/);
 assert.match(css,/\.t03-bag-button:focus-visible\{outline:3px solid var\(--forest\)\}/);
 assert.match(css,/transition:opacity 320ms ease,transform 650ms cubic-bezier\(\.25,\.55,\.25,1\),visibility 0s/);
 assert.doesNotMatch(js,/animation\.reverse\(|gsap\./);
});
