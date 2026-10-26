import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../site/threads/',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const svg=Array.from({length:13},(_,i)=>read('assets/t03/backpack-animated.part-'+String(i).padStart(2,'0')+'.txt')).join('');
test('supplied SVG is preserved byte-for-byte including original 8-second 7-track animation',()=>{
 assert.equal(Buffer.byteLength(svg,'utf8'),4529659);
 assert.equal(createHash('sha256').update(svg).digest('hex'),'b403ed6afb24196859451a01c541650cec3605dc0aa523a52237bde90a3be17a');
 for(const track of ['lid-outside-motion','lid-inside-motion','collar-motion','buckle-left-motion','buckle-right-motion','handle-motion','main-body']){
  assert.match(svg,new RegExp('id="'+track+'"'));
 }
 assert.equal((svg.match(/@keyframes anim-/g)||[]).length,7);
 assert.match(svg,/anim-lid-outside-motion 8s linear infinite/);
 assert.match(svg,/viewBox="800 240 950 1090"/);
 assert.doesNotMatch(svg,/<image\b/);
});
test('legacy T03 experiment remains isolated; approved final native SVG is on the homepage',()=>{
 const html=read('t03-preview/index.html');
 const home=read('index.html');
 assert.match(html,/Unpack<br>Your Luck/);
 assert.match(html,/Tap the backpack\. Discover your surprise\./);
 assert.match(html,/t03-bag-trigger/);
 assert.match(html,/Not redeemable/);
 assert.match(home,/Unpack Your Luck/);
 assert.match(home,/t03-v2-preview\/assets\/backpack_animated\(2\)\.svg/);
 assert.doesNotMatch(home,/deal-backpack-static-20261020\.png|t03-bag-trigger|t03-coupon/);
});
test('T03 uses the SVG timeline without redrawing its seven motion tracks',()=>{
 const js=read('t03-preview/t03-preview.mjs');
 assert.match(js,/OPEN_TIME_MS=4000/);
 assert.match(js,/SHARDS=13/);
 assert.match(js,/animationIterationCount='1'/);
 assert.match(js,/animationPlayState='paused'/);
 assert.match(js,/seek\(OPEN_TIME_MS\)/);
 assert.match(js,/getAnimations\(\{subtree:true\}\)/);
 assert.match(js,/Better Luck Next Time!/);
 assert.match(js,/5% OFF/);
 assert.match(js,/7% OFF/);
 assert.match(js,/10% OFF/);
 assert.match(js,/sessionStorage\.setItem/);
 assert.match(js,/getRandomValues/);
 assert.match(js,/bytes\[0\]%4/);
 assert.doesNotMatch(js,/startDemoPayment|real redemption|window\.location\.reload/);
});
test('approved animation modules remain protected by original recovery checksum',()=>{
 const crypto=createHash('sha256').update(read('t01-spotlight.mjs')).digest('hex');
 assert.equal(crypto,'f4b5b6e2c269dcfdd9164c944420f696dc93e7c3eb6981967398e9b4914ac5e3');
});
