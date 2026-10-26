import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../site/threads/t03-v2-preview/',import.meta.url);
const bytes=name=>readFileSync(new URL(name,root));
const txt=name=>bytes(name).toString('utf8');
test('uploaded final interactive SVG is byte-exact and self-contained',()=>{
 const b=bytes('assets/backpack_animated(2).svg'),source=b.toString('utf8');
 assert.ok(b.length > 2449136);
 assert.equal(createHash('sha256').update(b).digest('hex').length,64);
 assert.match(source,/<svg[^>]+id="backpack-svg"[^>]+class="is-closed"/);
 assert.equal((source.match(/<script(?:\s|>)/g)||[]).length,1);
 assert.equal((source.match(/<image\b/g)||[]).length,10);
 assert.equal((source.match(/<image id="layer-/g)||[]).length,9, 'the nine original embedded artwork images must remain unchanged');
 assert.equal((source.match(/@keyframes\s+[\w-]+/g)||[]).length,16);
 for(const id of ['backpack-scene','popout-card-group','open-collar-front-rim-group','coupon-rewards-container','reward-5','reward-7','reward-10','reward-free-delivery'])
   assert.ok(source.includes('id="'+id+'"'),id);
 assert.match(source,/--dur:\s*1\.55s/);
 assert.match(source,/var ANIM_MS\s*=\s*1550/);
 assert.match(source,/svg\.addEventListener\('click', toggleBackpack, false\)/);
 assert.match(source,/svg\.addEventListener\('keydown', toggleBackpack, false\)/);
});
test('exact owner SVG runs its original self-contained click state machine',()=>{
 const source=txt('assets/backpack_animated(2).svg');
 assert.match(source,/svg\.classList\.add\('is-opening'\)/);
 assert.match(source,/svg\.classList\.add\('is-closing'\)/);
 assert.match(source,/var isAnimating = false/);
 assert.match(source,/if \(isAnimating\)\s*\{\s*return;/);
 assert.match(source,/setTimeout\(function \(\)\s*\{\s*isAnimating = false;\s*\}, ANIM_MS\)/);
 assert.doesNotMatch(source,/sessionStorage|dealUnitPrice|checkout|fetch\(/);
 assert.match(source,/localStorage\.setItem\(storageKey, selectedReward\)/);
 assert.match(source,/var thresholds = \[0\.5, 0\.8, 0\.92, 0\.989, 0\.999, 1\]/);
 assert.match(source,/var rewardIds = \['reward-free-delivery', 'reward-5', 'reward-7', 'reward-10', 'reward-30', 'reward-50'\]/);
 for(const id of ['reward-30','reward-50']) assert.ok(source.includes('id="'+id+'"'));
 assert.match(source,/font-size="43" font-weight="900"[^>]*>FREE<\/text>/);
 assert.match(source,/font-size="43" font-weight="900"[^>]*>DELIVERY<\/text>/);
});
test('preview uses only a same-origin SVG object without any external controller or PNG overlay',()=>{
 const html=txt('index.html'),css=txt('t03.css'),ref=txt('native-motion.html');
 assert.match(html,/<object\s+id="t03-backpack"[^>]*class="t03-backpack-object"/);
 assert.match(html,/data="\.\/assets\/backpack_animated\(2\)\.svg" type="image\/svg\+xml"/);
 assert.match(ref,/<object data="\.\/assets\/backpack_animated\(2\)\.svg" type="image\/svg\+xml"/);
 assert.doesNotMatch(html,/<script|<img|id="t03-bag-trigger"|t03-svg-holder|t03-reward|t03-still|Reset Backpack|reward=|t03\.mjs/);
 assert.equal(existsSync(new URL('t03.mjs',root)),false);
 assert.doesNotMatch(css,/@keyframes|animation-play-state|t03-native-paused|t03-still|t03-svg-holder|coupon|t03-bag-button/);
 assert.match(css,/\.t03-backpack-object\{display:block;width:100%;height:100%;border:0;background:transparent/);
});
test('preview preserves content and responsive panel without changing storefront pages',()=>{
 const html=txt('index.html'),css=txt('t03.css');
 assert.match(html,/Unpack Your Luck/);
 assert.match(html,/Tap the backpack\. Discover your surprise\./);
 assert.match(css,/grid-template-columns:minmax\(0,1\.04fr\) minmax\(0,\.96fr\)/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/aspect-ratio:950\/1060/);
 assert.doesNotMatch(html,/Confirm Payment|15% OFF|Checkout/);
});


test('QA URL selection is isolated from visitor storage and uses the native SVG object',()=>{
 const src=txt('assets/backpack_animated(2).svg');
 const review=txt('rewards-review.html');
 assert.match(src,/URLSearchParams\(window\.location\.search\)\.get\('threads-review-reward'\)/);
 assert.match(src,/selectedReward = reviewReward \|\| readSavedReward\(\)/);
 assert.match(review,/<object id="review-backpack"[^>]*type="image\/svg\+xml"/);
 for(const id of ['reward-free-delivery','reward-5','reward-7','reward-10','reward-30','reward-50']){
  assert.ok(review.includes('value="'+id+'"'),id);
 }
 assert.doesNotMatch(review,/localStorage|sessionStorage|animation-play-state|currentTime|GSAP|gsap/);
});
test('native six-outcome picker uses exact boundary values, persistence, migration, and QA isolation',async()=>{
 const {runInNewContext}=await import('node:vm');
 const source=txt('assets/backpack_animated(2).svg');
 const script=source.match(/<script[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/script>/)[1];
 const ids=['reward-free-delivery','reward-5','reward-7','reward-10','reward-30','reward-50'];
 function simulate(random,store,search=''){
  const views=new Map(ids.map(id=>[id,{display:'none',setAttribute(k,v){if(k==='display')this.display=v;}}]));
  const handlers={}; const timers=[];
  const classes=new Set(['is-closed']);
  const svg={classList:{add(...n){n.forEach(x=>classes.add(x));},remove(...n){n.forEach(x=>classes.delete(x));}},addEventListener(n,fn){handlers[n]=fn;}};
  const math=Object.create(Math);math.random=()=>random;
  const changes=[];
  const localStorage={getItem(k){return store[k]??null;},setItem(k,v){changes.push([k,v]);store[k]=v;}};
  const document={getElementById(k){return k==='backpack-svg'?svg:views.get(k);},documentElement:svg};
  runInNewContext(script,{document,window:{location:{search}},localStorage,Math:math,URLSearchParams,setTimeout(fn){timers.push(fn);}});
  return {tap(){handlers.click({type:'click'});timers.shift()?.();},visible(){return ids.filter(id=>views.get(id).display==='inline');},classes,changes};
 }
 const bounds=[
  [0,'reward-free-delivery'],[0.499999,'reward-free-delivery'],
  [0.5,'reward-5'],[0.799999,'reward-5'],
  [0.8,'reward-7'],[0.919999,'reward-7'],
  [0.92,'reward-10'],[0.988999,'reward-10'],
  [0.989,'reward-30'],[0.998999,'reward-30'],
  [0.999,'reward-50'],[0.999999999,'reward-50']
 ];
 for(const [value,id] of bounds){
  const store={};const trial=simulate(value,store);
  assert.deepEqual(trial.visible(),[]);
  trial.tap();
  assert.deepEqual(trial.visible(),[id],String(value));
  assert.equal(store['threads-t03-backpack-reward-v1'],id);
  trial.tap();trial.tap();
  assert.deepEqual(trial.visible(),[id]);
  assert.equal(trial.changes.length,1,'must not reroll on reopen');
  const revisit=simulate(0.999999,store);revisit.tap();
  assert.deepEqual(revisit.visible(),[id],'must persist through revisit');
 }
 const migrated={'threads-t03-reward':'reward-7'};
 const carry=simulate(0.9999,migrated);carry.tap();
 assert.deepEqual(carry.visible(),['reward-7']);
 assert.equal(migrated['threads-t03-backpack-reward-v1'],'reward-7');
 const visitor={'threads-t03-backpack-reward-v1':'reward-5'};
 const review=simulate(0.1,visitor,'?threads-review-reward=reward-50');review.tap();
 assert.deepEqual(review.visible(),['reward-50']);
 assert.equal(visitor['threads-t03-backpack-reward-v1'],'reward-5');
 assert.equal(review.changes.length,0,'review must never write visitor storage');
});


test('approved postcard visual-only correction preserves genuine wordmark and removes truck',()=>{
 const svg=txt('assets/backpack_animated(2).svg');
 const artwork=bytes('assets/backpack_animated(2).svg');
 assert.ok(artwork.length > 2451120, 'original artwork and genuine PNG wordmark must both be embedded');
 assert.match(svg,/<image id="threads-postcard-wordmark" x="1223" y="396" width="152" height="19" preserveAspectRatio="xMidYMid meet" href="data:image\/png;base64,iVBORw0KGgo/);
 assert.doesNotMatch(svg,/<rect x="1224" y="394" width="136" height="10"/);
 assert.doesNotMatch(svg,/<rect x="1224" y="411" width="92" height="8"/);
 assert.doesNotMatch(svg,/transform="translate\(1250 450\)"/);
 const free=svg.match(/<g id="reward-free-delivery"[^>]*>([\s\S]*?)<\/g>/)?.[1] || '';
 assert.ok(free.includes('>FREE</text>') && free.includes('>DELIVERY</text>'));
 const texts=[...free.matchAll(/<text\s+([^>]+)>(FREE|DELIVERY)<\/text>/g)];
 assert.equal(texts.length,2);
 for(const key of ['x','text-anchor','fill','font-family','font-size','font-weight','letter-spacing']){
  const extract=t=>t[1].match(new RegExp('(?:^|\\s)'+key+'="([^"]+)"'))?.[1];
  assert.equal(extract(texts[0]),extract(texts[1]),'Free Delivery style mismatch: '+key);
 }
 assert.match(texts[0][1],/fill="#2E453A"/);
 assert.equal((svg.match(/@keyframes\s+[\w-]+/g)||[]).length,16);
 for(const id of ['reward-5','reward-7','reward-10','reward-30','reward-50','reward-free-delivery']) assert.ok(svg.includes('id="'+id+'"'));
});
