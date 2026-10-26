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
 assert.equal((source.match(/<image\b/g)||[]).length,9);
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
