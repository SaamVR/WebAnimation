import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../site/threads/t03-v2-preview/',import.meta.url);
const bytes=name=>readFileSync(new URL(name,root));
const txt=name=>bytes(name).toString('utf8');
const sha=data=>createHash('sha256').update(data).digest('hex');
test('owner final postcard SVG is stored byte-for-byte and has native artwork and timing',()=>{
 const original=bytes('assets/backpack_animated_postcard.svg'),source=original.toString();
 assert.equal(original.length,2439189);
 assert.equal(sha(original),'025cb57273465c938177ad9da4778ccb2edaf8cbd8f66631344e4f0afa3858f2');
 assert.match(source,/--dur: 5s/);
 assert.equal((source.match(/data:image\/png;base64,/g)||[]).length,9);
 assert.equal((source.match(/@keyframes /g)||[]).length,8);
 for(const id of ['popout-card-group','open-collar-front-rim-group','rimPocketClip','closed-flap-group','open-flap-group'])assert.ok(source.includes('id="'+id+'"'),id);
 assert.match(source,/animation: cardPopOut var\(--dur\) cubic-bezier\(0\.34, 1\.45, 0\.64, 1\) infinite/);
});
test('owner full-size closed PNG remains byte-exact and cropped presentation preserved',()=>{
 const p=bytes('assets/1-backpack-closed.png'),trim=bytes('assets/backpack-closed-aligned.png');
 assert.equal(p.length,1278396);
 assert.equal(sha(p),'6b216a79fb3387718f11a7ac1f66ea7a8661b153d239252f0ef3823df7fe3701');
 assert.deepEqual([p.readUInt32BE(16),p.readUInt32BE(20)],[2048,1365]);
 assert.deepEqual([trim.readUInt32BE(16),trim.readUInt32BE(20)],[1015,993]);
});
test('one weighted reward per browser session: unchanged 50/30/12/7.9/0.1 distribution',()=>{
 const js=txt('t03.mjs');
 const bands=[...js.matchAll(/\{end:(\d+),label:'([^']+)'\}/g)].map(m=>({end:Number(m[1]),label:m[2]}));
 assert.deepEqual(bands.map((v,i)=>[v.label,v.end-(bands[i-1]?.end||0)]),[['Free Delivery',500],['5% OFF',300],['7% OFF',120],['10% OFF',79],['50% OFF',1]]);
 assert.match(js,/sessionStorage\.getItem/);
 assert.match(js,/sessionStorage\.setItem/);
 assert.match(js,/reviewReward\|\|selectReward\(\)/);
 assert.doesNotMatch(js,/startDemoPayment|dealUnitPrice|dealSavings/);
});
test('postcard renderer changes only lower body and widens outer frame 12.5% about same centre',()=>{
 const js=txt('t03.mjs');
 assert.match(js,/svg\.querySelector\('#popout-card-group'\)/);
 assert.match(js,/children\.slice\(7\)/);
 assert.match(js,/children\[1\]\.setAttribute\('x','1148'\)/);
 assert.match(js,/children\[1\]\.setAttribute\('width','252'\)/);
 assert.match(js,/children\[2\]\.setAttribute\('x','1158'\)/);
 assert.match(js,/children\[2\]\.setAttribute\('width','232'\)/);
 assert.match(js,/textNode\('FREE',501,48/);
 assert.match(js,/textNode\('DELIVERY',550,37/);
 assert.match(js,/textNode\(reward\.replace\(' OFF',''\),544,102/);
 assert.match(js,/#2E453A/);
 assert.doesNotMatch(js,/couponLayer|foreignObject|coupon\.classList/);
});
test('native CSS playback holds at full postcard opening without mutating keyframes',()=>{
 const js=txt('t03.mjs'),css=txt('t03.css'),reference=txt('native-motion.html');
 assert.match(js,/const DURATION_MS=5000/);
 assert.match(js,/const HOLD_MS=0\.60\*DURATION_MS/);
 assert.match(js,/svg\.getAnimations\(\{subtree:true\}\)/);
 assert.match(js,/animationiteration',nativeIteration/);
 assert.match(js,/master\?\.currentTime/); // Observes progress, never writes to timeline.
 assert.match(js,/svgActor\.classList\.add\('t03-native-paused'\)/);
 assert.match(js,/svgActor\.classList\.remove\('t03-native-paused'\)/);
 assert.match(css,/svg\.t03-native-paused #popout-card-group\{animation-play-state:paused!important\}/);
 assert.doesNotMatch(js,/(?:\.currentTime\s*=|\.pause\(|\.play\(|setTimeout\(|\.finish\(|\.cancel\(|animationIterationCount\s*=|style\.animationIterationCount\s*=|style\.animationPlayState\s*=)/);
 assert.doesNotMatch(js,/(?:playbackRate|animation\.reverse\(|gsap\.)/);
 assert.match(reference,/<object data="\.\/assets\/backpack_animated_postcard\.svg" type="image\/svg\+xml"/);
 assert.doesNotMatch(reference,/<script|currentTime|animation-play-state/);
});
test('all native group motion starts together and opening/closing clicks are queued without seeking',()=>{
 const js=txt('t03.mjs');
 assert.match(js,/const tracks=svg\.getAnimations\(\{subtree:true\}\)/);
 assert.match(js,/if\(tracks.length!==9\)/);
 assert.match(js,/phase='opened'/);
 assert.match(js,/phase='closing'/);
 assert.match(js,/desiredOpen=!desiredOpen/);
 assert.match(js,/if\(phase==='closed'&&desiredOpen\)open\(\)/);
 assert.match(js,/else if\(phase==='opened'&&!desiredOpen\)close\(\)/);
 assert.match(js,/requestAnimationFrame\(check\)/);
 assert.match(js,/finishClosed\(\)/);
 assert.doesNotMatch(js,/targetOpen|function seek\(|function schedule\(|transitionEnd|OPEN_AT|CLOSE_FROM|setTimeout\(/);
});
test('cold first click waits for all native images and paint; rewards still session-scoped',()=>{
 const js=txt('t03.mjs');
 assert.match(js,/imageSources\.length!==9/);
 assert.match(js,/await image\.decode\(\)/);
 assert.match(js,/await Promise\.all\(imageSources\.map/);
 assert.match(js,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(resolve\)\)/);
 assert.match(js,/sessionStorage\.getItem/);
 assert.match(js,/sessionStorage\.setItem/);
 assert.match(js,/button.disabled=false/);
});
test('review-only reward query parameter has five variants and no independent card',()=>{
 const html=txt('index.html'),js=txt('t03.mjs'),css=txt('t03.css');
 for(const key of ['5','7','10','50','free'])assert.ok(html.includes('?reward='+key),key);
 assert.match(js,/URLSearchParams\(location\.search\)/);
 assert.match(html,/Unpack Your Luck/);
 assert.match(html,/Tap the backpack\. Discover your surprise\./);
 assert.match(html,/✦ Up to 50% OFF/);
 assert.doesNotMatch(html,/id="t03-coupon"|id="t03-reward"|Reset Backpack/);
 assert.doesNotMatch(css,/\.t03-coupon/);
 assert.match(css,/-webkit-tap-highlight-color:transparent/);
 assert.match(css,/\.t03-bag-button:focus-visible\{outline:3px solid var\(--forest\)\}/);
});
